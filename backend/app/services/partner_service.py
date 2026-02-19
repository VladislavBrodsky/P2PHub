import asyncio
import io
import logging
import secrets
from datetime import UTC, datetime, timedelta

import httpx
from PIL import Image
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.broker import broker
from app.core.config import settings
from app.models.partner import Partner
from app.services.leaderboard_service import leaderboard_service
from app.services.redis_service import redis_service
from bot import bot

logger = logging.getLogger(__name__)

# #comment: Global HTTPX client to reuse connections across requests.
# This significantly reduces latency and overhead compared to creating a client per request.
http_client = httpx.AsyncClient(timeout=10.0, limits=httpx.Limits(max_keepalive_connections=50, max_connections=100))
async def ensure_photo_cached(file_id: str, force_refresh: bool = False) -> bytes | None:
    """Ensures the Telegram photo is cached in Redis (WebP optimized)."""
    cache_key_binary = f"tg_photo_bin_v1:{file_id}"
    cache_key_url = f"tg_photo_url:{file_id}"

    # 1. Fast Path (Read from Cache)
    if not force_refresh:
        cached_binary = await _get_cached_photo(cache_key_binary)
        if cached_binary: return cached_binary

    # 2. Slow Path (Process with Lock)
    lock_key = f"lock:photo:process:{file_id}"
    async with redis_service.client.lock(lock_key, timeout=60):
        # Double check
        cached_binary = await _get_cached_photo(cache_key_binary)
        if cached_binary: return cached_binary

        try:
            photo_url = await _get_photo_url(file_id, cache_key_url)
            if not photo_url: return None

            response = await http_client.get(photo_url)
            if response.status_code == 200:
                optimized = await asyncio.to_thread(_process_image_binary, response.content)
                await redis_service.set_bytes(cache_key_binary, optimized, expire=86400 * 7)
                return optimized
        except Exception as e:
            logger.error(f"❌ Failed to optimize/cache photo {file_id}: {e}")
            
    return None

async def _get_cached_photo(key: str) -> bytes | None:
    try:
        return await redis_service.get_bytes(key)
    except Exception:
        return None

async def _get_photo_url(file_id: str, cache_key: str) -> str | None:
    photo_url = await redis_service.get(cache_key)
    if photo_url == "EMPTY": return None
    if not photo_url:
        file = await bot.get_file(file_id)
        photo_url = f"https://api.telegram.org/file/bot{settings.BOT_TOKEN}/{file.file_path}"
        await redis_service.set(cache_key, photo_url, expire=7200)
    return photo_url

def _process_image_binary(content: bytes) -> bytes:
    img = Image.open(io.BytesIO(content))
    if img.width > 128 or img.height > 128:
        img.thumbnail((128, 128), Image.Resampling.LANCZOS)
    output = io.BytesIO()
    img.save(output, format="WEBP", quality=80)
    return output.getvalue()

@broker.task(task_name="warm_up_partner_photos")
async def warm_up_partner_photos(file_ids: list[str]):
    """
    Background task to warm up photo cache for a list of file_ids.
    """
    if not file_ids: return
    logger.info(f"🔥 Warming up cache for {len(file_ids)} photos...")
    chunk_size = 5
    for i in range(0, len(file_ids), chunk_size):
        chunk = file_ids[i:i + chunk_size]
        await asyncio.gather(*[ensure_photo_cached(fid) for fid in chunk if fid])

async def create_partner(
    session: AsyncSession,
    telegram_id: str,
    username: str | None = None,
    first_name: str | None = None,
    last_name: str | None = None,
    language_code: str | None = "en",
    referrer_code: str | None = None,
    photo_file_id: str | None = None
) -> tuple[Partner, bool]:
    """Creates a new partner or retrieves an existing one."""
    partner = await get_partner_by_telegram_id(session, telegram_id)
    
    if partner and (partner.referrer_id or not referrer_code):
        return partner, False

    # 2. Resolve Referrer
    referrer = await _resolve_referrer(session, referrer_code, partner.id if partner else None)
    
    if partner and referrer:
        # Increment L1 referrer count synchronously for immediate UI updates
        referrer.referral_count = Partner.referral_count + 1
        session.add(referrer)
        
        await _update_existing_partner_referrer(session, partner, referrer)
        
        # Move side effects (Level 2-9 awards, notifications) to background task
        await handle_partner_creation_task.kiq(partner.id, referrer.id)
        
        return partner, True

    # 3. Create Record
    if referrer:
        path = f"{referrer.path or ''}.{referrer.id}".lstrip(".")
        depth = referrer.depth + 1
        
        # #comment: CRITICAL FIX for Task System Reliability
        # We increment the direct (L1) referrer's referral_count SYNCHRONOUSLY here.
        # This ensures that "Invite 1 friend" tasks and UI stats are updated immediately
        # even if background workers are busy or delayed.
        referrer.referral_count = Partner.referral_count + 1
        session.add(referrer)
    else:
        path, depth = None, 0

    partner = Partner(
        telegram_id=telegram_id, username=username, first_name=first_name,
        last_name=last_name, language_code=language_code,
        referral_code=f"P2P-{secrets.token_hex(4).upper()}",
        referrer_id=referrer.id if referrer else None,
        photo_file_id=photo_file_id, path=path, depth=depth
    )
    
    session.add(partner)
    partner, is_new = await _commit_partner_creation(session, partner, telegram_id)
    
    if is_new:
        # #comment: Move side effects (Level 2-9 awards, notifications) to background task
        await handle_partner_creation_task.kiq(partner.id, referrer.id if referrer else None)

    return partner, is_new

@broker.task(task_name="handle_partner_creation_task")
async def handle_partner_creation_task(partner_id: int, referrer_id: int | None = None):
    """
    Decoupled side-effects for partner creation.
    Handles leaderboard sync and multi-level cache invalidation.
    """
    from sqlalchemy.orm import sessionmaker

    from app.models.partner import engine
    from app.services.referral_service import process_referral_logic
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        partner = await session.get(Partner, partner_id)
        if not partner: return

        # 1. Sync Leaderboard
        try:
            await leaderboard_service.update_score(partner.id, partner.xp)
        except Exception as e:
            logger.warning(f"Failed to sync to leaderboard: {e}")

        # 2. Cache Invalidation
        try:
            await redis_service.client.delete("partners:recent_v2")
            if partner.path:
                async with redis_service.client.pipeline(transaction=True) as pipe:
                    anc_ids = [int(x) for x in partner.path.split('.')]
                    # Invalidate up to 9 levels of the tree
                    for anc_id in anc_ids[-9:]:
                        pipe.delete(f"ref_tree_stats_v2:{anc_id}")
                    await pipe.execute()
            
            if referrer_id:
                await redis_service.client.delete(f"ref_tree_members_v2:{referrer_id}:1")

            # 3. Trigger Referral Logic (XP, Notifications, Network Counting)
            # This was previously triggered in the endpoint but is more robust here.
            if partner.referrer_id:
                logger.info(f"🚀 Triggering referral logic for new partner {partner.id}")
                await process_referral_logic(partner.id)

        except Exception as e:
            logger.error(f"Side effects failed: {e}")

async def _resolve_referrer(session: AsyncSession, code: str | None, current_id: int | None) -> Partner | None:
    if not code: return None
    try:
        referrer = await get_partner_by_referral_code(session, code)
        if referrer and referrer.id != current_id:
            # #comment: Fraud Check - Prevent 'XP Farming' via abnormal referral velocity.
            # If a referrer hits the limit, we still allow the new user to join,
            # but they won't be credited to the suspicious referrer.
            from app.services.fraud_service import fraud_service
            if not await fraud_service.is_referral_velocity_ok(referrer.id):
                 return None
            return referrer
    except Exception as e:
        logger.error(f"Error resolving referring partner {code}: {e}")
    return None

async def _update_existing_partner_referrer(session: AsyncSession, partner: Partner, referrer: Partner):
    partner.referrer_id = referrer.id
    partner.path = f"{referrer.path or ''}.{referrer.id}".lstrip(".")
    partner.depth = referrer.depth + 1
    session.add(partner)
    await session.commit()
    await session.refresh(partner)

async def _commit_partner_creation(session: AsyncSession, partner: Partner, telegram_id: str) -> tuple[Partner, bool]:
    from sqlalchemy.exc import IntegrityError
    try:
        await session.commit()
        await session.refresh(partner)
        return partner, True
    except IntegrityError:
        await session.rollback()
        existing = await get_partner_by_telegram_id(session, telegram_id)
        if not existing:
            raise RuntimeError("Database integrity error on user creation followed by missing record.") from None
        return existing, False


async def get_partner_by_telegram_id(session: AsyncSession, telegram_id: str) -> Partner | None:
    statement = select(Partner).where(Partner.telegram_id == telegram_id)
    result = await session.exec(statement)
    return result.first()

async def get_partner_by_referral_code(session: AsyncSession, code: str) -> Partner | None:
    statement = select(Partner).where(Partner.referral_code == code)
    result = await session.exec(statement)
    return result.first()

@broker.task(task_name="sync_profile_photos_task", schedule=[{"cron": "0 0 * * *"}])
async def sync_profile_photos_task():
    from sqlalchemy.orm import sessionmaker

    from app.models.partner import engine
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        await sync_profile_photos(bot, session)

async def sync_profile_photos(bot, session: AsyncSession):
    """
    Optimized: Only sync users who have been active in the last 7 days.
    Fixed: Separates Telegram API I/O (parallel) from DB session updates (sequential).
    """
    logger.info("📅 Starting Profile Photo Sync (Selective)...")
    seven_days_ago = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=7)
    
    # Query only active users to save API calls and DB load
    stmt = select(Partner).where(Partner.updated_at >= seven_days_ago)
    result = await session.exec(stmt)
    partners = result.all()
    
    updated = 0
    # Process in batches 
    chunk_size = 20
    for i in range(0, len(partners), chunk_size):
        chunk = partners[i : i + chunk_size]
        
        # 1. Gather photo info from Telegram in parallel (No session usage here)
        async def get_info(p):
            try:
                user_photos = await bot.get_user_profile_photos(p.telegram_id, limit=1)
                if user_photos.total_count > 0:
                    return p.id, user_photos.photos[0][-1].file_id
            except Exception as e:
                if "bot was blocked" not in str(e).lower():
                    logger.debug(f"Photo info fetch failed for {p.telegram_id}: {e}")
            return p.id, None

        results = await asyncio.gather(*[get_info(p) for p in chunk])
        
        # 2. Apply updates to session (Sequential/Safe)
        for p_id, new_file_id in results:
            if not new_file_id:
                continue
            # Correct partner instance from chunk
            partner = next(p for p in chunk if p.id == p_id)
            if partner.photo_file_id != new_file_id:
                partner.photo_file_id = new_file_id
                session.add(partner)
                updated += 1
        
        # Periodically flush to keep memory usage low
        if updated > 0 and updated % 50 == 0:
            await session.flush()
        
        # Small sleep between batches to avoid TG flood limits
        await asyncio.sleep(0.3)

    await session.commit()
    logger.info(f"✅ Selective Sync complete. Updated {updated} photos.")

async def sync_single_photo(bot, session, partner: Partner) -> bool:
    """Helper for parallel photo sync with error handling."""
    try:
        user_photos = await bot.get_user_profile_photos(partner.telegram_id, limit=1)
        if user_photos.total_count > 0:
            # #comment: Use the largest available photo (last in the list) for best quality
            new_file_id = user_photos.photos[0][-1].file_id
            if partner.photo_file_id != new_file_id:
                partner.photo_file_id = new_file_id
                session.add(partner)
                return True
    except Exception as e:
        # Don't log spam for users who blocked the bot
        if "bot was blocked" not in str(e).lower():
            logger.error(f"Photo sync error for {partner.telegram_id}: {e}")
    return False

async def sync_single_photo_background(telegram_id: str):
    """
    Background worker for on-demand photo sync.
    Creates its own session to avoid sharing state with the main request.
    """
    from sqlalchemy.orm import sessionmaker

    from app.models.partner import engine
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        stmt = select(Partner).where(Partner.telegram_id == telegram_id)
        result = await session.exec(stmt)
        partner = result.first()
        if partner and await sync_single_photo(bot, session, partner):
            await session.commit()
            # Invalidate profile cache
            await redis_service.client.delete(f"partner:profile:{telegram_id}")

async def migrate_paths(session: AsyncSession):
    """
    Iterative Queue-based path migration (Non-recursive).
    Handles large trees efficiently without hitting recursion limits.
    """
    logger.info("🛠 Starting path migration (Iterative BFS)...")
    
    # Use a queue for BFS: (parent_id, parent_path, parent_depth)
    queue = []
    
    # Find all root users (no referrer)
    root_stmt = select(Partner).where(Partner.referrer_id.is_(None))
    root_res = await session.exec(root_stmt)
    for root in root_res.all():
        if root.path is not None or root.depth != 0:
            root.path = None
            root.depth = 0
            session.add(root)
        queue.append((root.id, "", 0))
        
    processed_count = 0
    while queue:
        # Process in chunks of 100 for memory efficiency
        current_batch = queue[:100]
        queue = queue[100:]
        
        for parent_id, parent_path, parent_depth in current_batch:
            # Find children
            child_stmt = select(Partner).where(Partner.referrer_id == parent_id)
            child_res = await session.exec(child_stmt)
            
            for child in child_res.all():
                new_path = f"{parent_path}.{parent_id}".lstrip(".")
                new_depth = parent_depth + 1
                
                if child.path != new_path or child.depth != new_depth:
                    child.path = new_path
                    child.depth = new_depth
                    session.add(child)
                
                queue.append((child.id, child.path, child.depth))
                processed_count += 1

        # Commit periodically
        if processed_count % 500 == 0:
            await session.commit()
            logger.info(f"🛠 Migration progress: {processed_count} partners processed...")

    await session.commit()
    logger.info(f"✅ Migration complete. Processed {processed_count} partners.")
async def get_partner_full(session: AsyncSession, telegram_id: str) -> Partner | None:
    """
    Fetches a partner with ALL necessary relationships eagerly loaded.
    Why: Prevents 'MissingGreenlet' errors when preparing complex responses.
    """
    from sqlalchemy.orm import selectinload
    stmt = select(Partner).where(Partner.telegram_id == telegram_id).options(
        selectinload(Partner.completed_task_records),
        selectinload(Partner.referrals)
    )
    result = await session.exec(stmt)
    return result.first()
