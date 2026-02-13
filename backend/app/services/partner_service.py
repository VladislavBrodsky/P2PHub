import asyncio
import logging
import secrets
from typing import List, Optional, Tuple

from sqlmodel import select, text
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.partner import Partner
from app.services.leaderboard_service import leaderboard_service
from app.services.redis_service import redis_service
from app.worker import broker

logger = logging.getLogger(__name__)

async def ensure_photo_cached(file_id: str) -> Optional[bytes]:
    """
    Ensures the Telegram photo is cached in Redis (WebP optimized).
    Returns the binary content if successful, None otherwise.
    """
    import io
    import httpx
    from PIL import Image
    from bot import bot

    cache_key_binary = f"tg_photo_bin_v1:{file_id}"
    cache_key_url = f"tg_photo_url:{file_id}"

    try:
        cached_binary = await redis_service.get_bytes(cache_key_binary)
        if cached_binary: return cached_binary
    except Exception: pass

    try:
        photo_url = await redis_service.get(cache_key_url)
        if not photo_url:
            file = await bot.get_file(file_id)
            photo_url = f"https://api.telegram.org/file/bot{settings.BOT_TOKEN}/{file.file_path}"
            await redis_service.set(cache_key_url, photo_url, expire=3600)
    except Exception as e:
        logger.error(f"Failed to get photo URL for {file_id}: {e}")
        return None

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(photo_url)
            if response.status_code == 200:
                img = Image.open(io.BytesIO(response.content))
                if img.width > 128 or img.height > 128:
                    img.thumbnail((128, 128), Image.Resampling.LANCZOS)
                output = io.BytesIO()
                img.save(output, format="WEBP", quality=80)
                optimized_binary = output.getvalue()
                await redis_service.set_bytes(cache_key_binary, optimized_binary, expire=86400)
                return optimized_binary
    except Exception as e:
        logger.error(f"Failed to optimize/cache photo {file_id}: {e}")
    
    return None

@broker.task(task_name="warm_up_partner_photos")
async def warm_up_partner_photos(file_ids: List[str]):
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
    username: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    language_code: Optional[str] = "en",
    referrer_code: Optional[str] = None,
    photo_file_id: Optional[str] = None
) -> Tuple[Partner, bool]:
    """
    Creates a new partner or retrieves an existing one.
    Handles potential race conditions during registration via database unique constraints.
    """
    # 1. Primary check
    statement = select(Partner).where(Partner.telegram_id == telegram_id)
    result = await session.exec(statement)
    partner = result.first()
    if partner: return partner, False

    # 2. Resolve Referrer
    referrer_id = None
    referrer = None
    if referrer_code:
        try:
            ref_stmt = select(Partner).where(Partner.referral_code == referrer_code)
            ref_res = await session.exec(ref_stmt)
            referrer = ref_res.first()
            if referrer: referrer_id = referrer.id
        except Exception as e:
            logger.error(f"Error resolving referrer_code {referrer_code}: {e}")

    path = None
    depth = 0
    if referrer:
        parent_path = referrer.path or ""
        path = f"{parent_path}.{referrer.id}".lstrip(".")
        depth = referrer.depth + 1

    # 3. Create Record
    partner = Partner(
        telegram_id=telegram_id,
        username=username,
        first_name=first_name,
        last_name=last_name,
        language_code=language_code,
        referral_code=f"P2P-{secrets.token_hex(4).upper()}",
        referrer_id=referrer_id,
        photo_file_id=photo_file_id,
        path=path,
        depth=depth
    )
    
    session.add(partner)
    
    from sqlalchemy.exc import IntegrityError
    try:
        await session.commit()
        await session.refresh(partner)
        is_new = True
    except IntegrityError:
        # Race condition: Another worker inserted this TG_ID simultaneously
        await session.rollback()
        stmt = select(Partner).where(Partner.telegram_id == telegram_id)
        res = await session.exec(stmt)
        partner = res.first()
        is_new = False
        if not partner:
            # This should theoretically never happen if IntegrityError was caught
            raise RuntimeError("Database integrity error on user creation followed by missing record.")

    # Side Effects
    try:
        await leaderboard_service.update_score(partner.id, partner.xp)
    except Exception: pass

    if is_new and referrer:
        try:
            async with redis_service.client.pipeline(transaction=True) as pipe:
                anc_ids = [int(x) for x in partner.path.split('.')] if partner.path else []
                for anc_id in anc_ids[-9:]:
                    pipe.delete(f"ref_tree_stats:{anc_id}")
                    if anc_id == referrer.id:
                        pipe.delete(f"ref_tree_members:{anc_id}:1")
                await pipe.execute()
        except Exception: pass

    try:
        await redis_service.client.delete("partners:recent_v2")
    except Exception: pass

    return partner, is_new

async def get_partner_by_telegram_id(session: AsyncSession, telegram_id: str) -> Optional[Partner]:
    statement = select(Partner).where(Partner.telegram_id == telegram_id)
    result = await session.exec(statement)
    return result.first()

async def get_partner_by_referral_code(session: AsyncSession, code: str) -> Optional[Partner]:
    statement = select(Partner).where(Partner.referral_code == code)
    result = await session.exec(statement)
    return result.first()

@broker.task(task_name="sync_profile_photos_task", schedule=[{"cron": "0 0 * * *"}])
async def sync_profile_photos_task():
    from bot import bot
    from app.models.partner import engine
    from sqlalchemy.orm import sessionmaker
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        await sync_profile_photos(bot, session)

async def sync_profile_photos(bot, session: AsyncSession):
    """
    Optimized: Only sync users who have been active in the last 7 days and use chunks.
    """
    logger.info("📅 Starting Profile Photo Sync (Selective)...")
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    # Query only active users to save API calls and DB load
    stmt = select(Partner).where(Partner.updated_at >= seven_days_ago)
    result = await session.exec(stmt)
    partners = result.all()
    
    updated = 0
    # Process in batches with high concurrency but respecting rate limits
    chunk_size = 20
    for i in range(0, len(partners), chunk_size):
        chunk = partners[i : i + chunk_size]
        tasks = []
        for partner in chunk:
            tasks.append(sync_single_photo(bot, session, partner))
        
        # Gather results to keep pushing
        results = await asyncio.gather(*tasks)
        updated += sum(1 for r in results if r)
        
        # Small sleep between batches to avoid TG flood limits
        await asyncio.sleep(0.5)

    await session.commit()
    logger.info(f"✅ Selective Sync complete. Updated {updated} photos.")

async def sync_single_photo(bot, session, partner: Partner) -> bool:
    """Helper for parallel photo sync with error handling."""
    try:
        user_photos = await bot.get_user_profile_photos(partner.telegram_id, limit=1)
        if user_photos.total_count > 0:
            new_file_id = user_photos.photos[0][0].file_id
            if partner.photo_file_id != new_file_id:
                partner.photo_file_id = new_file_id
                session.add(partner)
                return True
    except Exception as e:
        # Don't log spam for users who blocked the bot
        if "bot was blocked" not in str(e).lower():
            logger.error(f"Photo sync error for {partner.telegram_id}: {e}")
    return False

async def migrate_paths(session: AsyncSession):
    """
    Iterative Queue-based path migration (Non-recursive).
    Handles large trees efficiently without hitting recursion limits.
    """
    logger.info("🛠 Starting path migration (Iterative BFS)...")
    
    # Use a queue for BFS: (parent_id, parent_path, parent_depth)
    queue = []
    
    # Find all root users (no referrer)
    root_stmt = select(Partner).where(Partner.referrer_id == None)
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

