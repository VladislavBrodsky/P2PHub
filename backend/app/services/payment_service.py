import asyncio
import contextlib
import json
import logging
from datetime import UTC, datetime, timedelta

import sentry_sdk
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.http_client import http_client
from app.core.retry import async_retry
from app.models.partner import Partner, SystemSetting
from app.models.transaction import PartnerTransaction
from app.services.redis_service import redis_service
from app.services.ton_verification_service import ton_verification_service
from app.services.tron_verification_service import tron_verification_service

logger = logging.getLogger(__name__)

# Constants for Subscription
TON_API_BASE = "https://tonapi.io/v2"
NANO_TON = 10**9

class PaymentService:
    async def create_transaction(
        self,
        session: AsyncSession,
        partner_id: int,
        amount: float,
        currency: str,
        network: str,
        tx_hash: str | None = None
    ) -> PartnerTransaction:
        transaction = PartnerTransaction(
            partner_id=partner_id,
            amount=amount,
            currency=currency,
            network=network,
            tx_hash=tx_hash,
            status="pending"
        )
        session.add(transaction)
        await session.flush()
        await session.refresh(transaction)
        return transaction

    async def create_payment_session(
        self,
        session: AsyncSession,
        partner_id: int,
        amount_usd: float = settings.PRO_PRICE_USD,
        currency: str = "TON",
        network: str = "TON"
    ) -> dict:
        """
        Creates a payment session. 
        TON: 10 minutes.
        USDT/Crypto: 30 minutes.
        """
        expires_in_minutes = 30 if currency == "USDT" else 10
        
        if currency == "TON":
            ton_price = await self.get_ton_price()
            # Add 2% buffer for spread/volatility to ensure they pay enough
            amount_crypto = (amount_usd / ton_price) * 1.02
        else:
            amount_crypto = amount_usd # For USDT it's 1:1

        transaction = PartnerTransaction(
            partner_id=partner_id,
            amount=amount_usd,
            amount_crypto=amount_crypto,
            currency=currency,
            network=network,
            status="pending"
        )
        session.add(transaction)
        await session.flush()
        await session.refresh(transaction)

        return {
            "transaction_id": transaction.id,
            "amount": float(f"{amount_crypto:.4f}"),
            "currency": currency,
            "network": network,
            "address": settings.ADMIN_TON_ADDRESS if currency == "TON" else settings.ADMIN_USDT_ADDRESS,
            "expires_at": (transaction.created_at + timedelta(minutes=expires_in_minutes)).isoformat()
        }

    async def get_ton_price(self) -> float:
        """Fetches current TON/USD price with caching (1 minute)."""
        cache_key = "ton_price_usd"
        try:
            cached_price = await redis_service.get(cache_key)
            if cached_price:
                return float(cached_price)
        except Exception:
            pass

        try:
            client = await http_client.get_client()
            # #comment: Using TonAPI.io for reliable, high-precision price data.
            response = await client.get(f"{TON_API_BASE}/rates?tokens=ton&currencies=usd")
            data = response.json()
            # Extract price from standardized TonAPI response format
            price = float(data['rates']['TON']['prices']['USD'])
            
            # Cache for 60 seconds
            with contextlib.suppress(Exception):
                await redis_service.set(cache_key, str(price), expire=60)
                
            return price
        except Exception as e:
            logger.error(f"Error fetching TON price: {e}")
            return 5.5 # Fallback conservative price if API fails
            
    @async_retry(max_attempts=3, base_delay=1.0)
    async def verify_ton_transaction(
        self,
        session: AsyncSession,
        partner: Partner,
        tx_hash: str
    ) -> bool:
        """
        Verifies a TON transaction hash via TonVerificationService.
        Checks if the destination address matches admin wallet and amount is correct.
        """
        sentry_sdk.add_breadcrumb(
            category="payment",
            message=f"Starting verification for {partner.id} | Hash: {tx_hash}",
            level="info"
        )
        # 1. Check if TX already processed by someone else
        stmt = select(PartnerTransaction).where(
            PartnerTransaction.tx_hash == tx_hash,
            PartnerTransaction.status == "completed"
        )
        res = await session.exec(stmt)
        existing = res.first()
        if existing:
            if existing.partner_id == partner.id:
                logger.info(f"Transaction {tx_hash} already processed for partner {partner.id}")
                return True
            else:
                logger.warning(f"🚨 FRAUD ATTEMPT: Partner {partner.id} tried to use Hash {tx_hash} already used by {existing.partner_id}")
                return False

        # 2. Find the most recent pending TON transaction for this partner
        sentry_sdk.add_breadcrumb(
            category="payment",
            message="Searching for active session within 10-minute window...",
            level="debug"
        )
        # A "session" is valid if created within last 10 minutes
        ten_mins_ago = datetime.now(UTC).replace(tzinfo=None) - timedelta(minutes=10)
        stmt_session = select(PartnerTransaction).where(
            PartnerTransaction.partner_id == partner.id,
            PartnerTransaction.status == "pending",
            PartnerTransaction.currency == "TON",
            PartnerTransaction.created_at >= ten_mins_ago
        ).order_by(PartnerTransaction.created_at.desc())

        res_session = await session.exec(stmt_session.with_for_update())
        active_session = res_session.first()

        if not active_session:
            logger.warning(f"No active TON session found for partner {partner.id} in the last 10 minutes.")
            return False

        # 3. Use the fixed crypto amount stored at session creation
        # This prevents verification failures due to price fluctuations between payment and verification.
        expected_ton = active_session.amount_crypto or ((active_session.amount / 5.5) * 1.02)

        # 4. Call dedicated verification service with robust validation parameters
        is_valid = await ton_verification_service.verify_transaction(
            tx_hash=tx_hash,
            expected_amount_ton=expected_ton * 0.98, # Allow 2% slippage margin for gas fees/precision
            expected_address=settings.ADMIN_TON_ADDRESS
        )

        if is_valid:
            # Upgrade user to PRO
            await self.upgrade_to_pro(
                session=session,
                partner=partner,
                amount=active_session.amount,
                currency="TON",
                network="TON",
                tx_hash=tx_hash,
                transaction_id=active_session.id
            )
            
            from app.services.audit_service import audit_service
            await audit_service.log_payment(
                session=session,
                partner_id=partner.id,
                transaction_id=active_session.id,
                amount=active_session.amount,
                currency="TON",
                plan=partner.subscription_plan or "PRO",
                status="verified",
                tx_hash=tx_hash
            )
            
            return True

        # If it failed but session is still valid, we keep it pending.
        from app.services.audit_service import audit_service
        await audit_service.log_payment(
            session=session,
            partner_id=partner.id,
            transaction_id=active_session.id,
            amount=active_session.amount,
            currency="TON",
            plan="PRO",
            status="failed",
            tx_hash=tx_hash
        )

        return False

    @async_retry(max_attempts=3, base_delay=1.0)
    async def verify_usdt_transaction(
        self,
        session: AsyncSession,
        partner: Partner,
        tx_hash: str,
        network: str = "TRC20"
    ) -> bool:
        """
        Verifies a USDT transaction hash (TRC-20 or TON Jetton) and upgrades user if valid.
        """
        sentry_sdk.add_breadcrumb(
            category="payment",
            message=f"Starting USDT verification ({network}) for {partner.id} | Hash: {tx_hash}",
            level="info"
        )
        # 1. Check if TX already processed by someone else
        stmt = select(PartnerTransaction).where(
            PartnerTransaction.tx_hash == tx_hash,
            PartnerTransaction.status == "completed"
        )
        res = await session.exec(stmt)
        existing = res.first()
        if existing:
            if existing.partner_id == partner.id:
                logger.info(f"Transaction {tx_hash} already processed for partner {partner.id}")
                return True
            else:
                logger.warning(f"🚨 FRAUD ATTEMPT: Partner {partner.id} tried to use USDT Hash {tx_hash} already used by {existing.partner_id}")
                return False

        # 2. Find the most recent pending USDT transaction for this partner on this network.
        # We look back 2 hours to support users who created a session earlier.
        two_hours_ago = datetime.now(UTC).replace(tzinfo=None) - timedelta(hours=2)
        stmt_session = select(PartnerTransaction).where(
            PartnerTransaction.partner_id == partner.id,
            PartnerTransaction.status.in_(["pending", "manual_review"]),
            PartnerTransaction.currency == "USDT",
            PartnerTransaction.network == network,
            PartnerTransaction.created_at >= two_hours_ago
        ).order_by(PartnerTransaction.created_at.desc())

        res_session = await session.exec(stmt_session.with_for_update())
        active_session = res_session.first()

        if not active_session:
            # No session found. Create an ad-hoc one so users who paid directly
            # (without going through the in-app payment flow) can still be auto-verified.
            # Default to PRO+ price; the blockchain verification will confirm the actual amount.
            logger.info(
                f"No active USDT/{network} session for partner {partner.id}. "
                "Creating ad-hoc session to allow direct-payment verification."
            )
            active_session = PartnerTransaction(
                partner_id=partner.id,
                amount=settings.PRO_PLUS_PRICE_USD,
                amount_crypto=settings.PRO_PLUS_PRICE_USD,  # 1:1 for USDT
                currency="USDT",
                network=network,
                status="pending"
            )
            session.add(active_session)
            await session.flush()  # Get the ID without committing

        expected_usdt = active_session.amount

        # 3. Call dedicated verification service
        if network == "TRC20":
            is_valid = await tron_verification_service.verify_transaction(
                tx_hash=tx_hash,
                expected_amount_usdt=expected_usdt,
                expected_address=settings.ADMIN_USDT_ADDRESS
            )
        else: # TON (Jetton)
            is_valid = await ton_verification_service.verify_transaction(
                tx_hash=tx_hash,
                expected_amount=expected_usdt,
                expected_address=settings.ADMIN_TON_ADDRESS,
                currency="USDT"
            )

        if is_valid:
            # Upgrade user to PRO/PRO+
            await self.upgrade_to_pro(
                session=session,
                partner=partner,
                amount=active_session.amount,
                currency="USDT",
                network=network,
                tx_hash=tx_hash,
                transaction_id=active_session.id
            )
            
            from app.services.audit_service import audit_service
            await audit_service.log_payment(
                session=session,
                partner_id=partner.id,
                transaction_id=active_session.id,
                amount=active_session.amount,
                currency="USDT",
                plan=partner.subscription_plan or "PRO",
                status="verified",
                tx_hash=tx_hash
            )
            return True

        return False

    @async_retry(max_attempts=3, base_delay=1.0)
    async def upgrade_to_pro(
        self,
        session: AsyncSession,
        partner: Partner,
        amount: float,
        currency: str,
        network: str,
        tx_hash: str | None = None,
        transaction_id: int | None = None
    ):
        try:
            now = datetime.now(UTC).replace(tzinfo=None)
            
            # #comment: Phase 3 Bug Fix: Initialize before branching so PRO+ path
            # doesn't hit NameError when referencing lifetime_granted in promo_details.
            lifetime_granted = False
            
            # Re-fetch partner to prevent lazy-loading issues if there was a rollback in a prior retry attempt
            from sqlalchemy import inspect
            state = inspect(partner)
            # state.identity is a tuple of primary keys, e.g., (1,)
            # If state is transient, it might be None, so we fallback to partner.id (which won't be expired yet if it's new)
            p_id = state.identity[0] if state and state.identity else partner.id
            
            from sqlalchemy.orm import selectinload
            fresh_partner = await session.get(Partner, p_id, with_for_update=True)
            if fresh_partner:
                partner = fresh_partner
                
            # --- BALANCE DEDUCTION (RETRY-SAFE) ---
            # If this is a balance upgrade, we deduct it here inside the retry block.
            # This ensures that if a rollback happens, the deduction is re-applied in the next attempt.
            if currency == "BALANCE":
                if partner.balance < amount:
                    raise ValueError(f"Insufficient balance during upgrade: {partner.balance} < {amount}")
                partner.balance = Partner.balance - amount
                
                # Log balance deduction as a negative Earning item in the ledger
                from app.models.partner import Earning
                session.add(Earning(
                    partner_id=partner.id,
                    amount=-float(amount),
                    description=f"Subscription Payment: {currency}",
                    type="PAYMENT",
                    currency="USDT",
                    reference_id=f"bal_deduct_{transaction_id or now.timestamp()}"
                ))
                
                session.add(partner)
                await session.flush()

            sentry_sdk.add_breadcrumb(
                category="payment",
                message=f"Executing PRO upgrade for partner {getattr(partner, 'telegram_id', 'unknown')} at {now}",
                level="info"
            )
            # Determine Plan Details
            # Direct PRO+ purchase
            is_direct_plus = amount >= (settings.PRO_PLUS_PRICE_USD - 0.1)
            # Upgrade from PRO to PRO+ (paying the difference)
            is_pro_to_plus_upgrade = (
                partner.is_pro and 
                not (partner.subscription_plan or "").startswith("PRO_PLUS") and 
                abs(amount - (settings.PRO_PLUS_PRICE_USD - settings.PRO_PRICE_USD)) < 0.5
            )
            
            is_plus = is_direct_plus or is_pro_to_plus_upgrade
            
            # Initialize before conditional assignment to prevent UnboundLocalError on PRO+ path
            lifetime_granted = False
            
            # Tiered PRO Logic: First 300 get Lifetime, others get 30 days.
            # PRO+ is unaffected by the 300 limit (usually remains lifetime or handled separately)
            # as per user instruction: "this not applied for PRO+".
            
            if is_plus:
                partner.subscription_plan = "PRO_PLUS_MONTHLY"
                # Updated Logic: PRO+ purchases ALSO consume a specialized "Lifetime Slot"
                # This aligns with the "300 Limited Promo" campaign
                
                stmt_sold = select(SystemSetting).where(SystemSetting.key == "pro_slots_sold").with_for_update()
                res_sold = await session.exec(stmt_sold)
                setting_sold = res_sold.first()
                
                sold_count = int(setting_sold.value) if setting_sold else 147
                
                # Increment the global counter (But only if it's a NEW purchase, 
                # or if we want to count upgrades too. Typically upgrades don't consume a new slot if already PRO)
                # However, the code previously always incremented. Let's keep consistency for now unless specified.
                if not is_pro_to_plus_upgrade:
                    if setting_sold:
                        setting_sold.value = str(sold_count + 1)
                        session.add(setting_sold)
                    else:
                        new_sold = SystemSetting(key="pro_slots_sold", value=str(sold_count + 1))
                        session.add(new_sold)

                # Monthly Subscription with Extension Logic
                if partner.pro_expires_at and partner.pro_expires_at > now:
                    partner.pro_expires_at += timedelta(days=30)
                else:
                    partner.pro_expires_at = now + timedelta(days=30)
                
                # Award additional tokens
                partner.pro_tokens = settings.PRO_PLUS_TOKENS_MONTHLY
            else:
                # Standard PRO Plan
                # 1. Fetch current sold count with pessimistic lock to prevent race conditions
                stmt_sold = select(SystemSetting).where(SystemSetting.key == "pro_slots_sold").with_for_update()
                res_sold = await session.exec(stmt_sold)
                setting_sold = res_sold.first()
                
                stmt_total = select(SystemSetting).where(SystemSetting.key == "pro_slots_total")
                res_total = await session.exec(stmt_total)
                setting_total = res_total.first()
                
                sold_count = int(setting_sold.value) if setting_sold else 147
                total_slots = int(setting_total.value) if setting_total else 300
                
                if sold_count < total_slots:
                    partner.subscription_plan = "PRO_LIFETIME"
                    partner.pro_expires_at = None # Lifetime
                    lifetime_granted = True
                    
                    # Increment counter
                    if setting_sold:
                        setting_sold.value = str(sold_count + 1)
                        session.add(setting_sold)
                    else:
                        # Initialize counter if this is the first tracked sale
                        new_sold = SystemSetting(key="pro_slots_sold", value=str(sold_count + 1))
                        session.add(new_sold)
                else:
                    partner.subscription_plan = "PRO_MONTHLY"
                    # Handle Extension: If they already have an expiry, add 30 days
                    if partner.pro_expires_at and partner.pro_expires_at > now:
                        partner.pro_expires_at += timedelta(days=30)
                    else:
                        partner.pro_expires_at = now + timedelta(days=30)
                    
                partner.pro_tokens = settings.PRO_TOKENS_MONTHLY

            partner.pro_tokens_last_reset = now
            partner.is_pro = True
            
            # Record current XP for audit
            xp_before = float(partner.xp)
            
            # Record promotion details in payment_details
            promo_details = {
                "currency": currency,
                "network": network,
                "tx_hash": tx_hash or "MANUAL_CONFIRMATION",
                "amount": amount,
                "verified_at": now.isoformat(),
                "lifetime_granted": lifetime_granted if not is_plus else False, # PRO+ usually managed differently
                "plan_type": partner.subscription_plan,
                "is_upgrade": is_pro_to_plus_upgrade
            }
            if not is_plus:
                promo_details["slots_sold_at_purchase"] = sold_count
                
            partner.payment_details = json.dumps(promo_details)

            session.add(partner)

            # 2. Update or Create Transaction
            transaction = None
            if transaction_id:
                transaction = await session.get(PartnerTransaction, transaction_id)
            elif tx_hash:
                stmt_tx = select(PartnerTransaction).where(PartnerTransaction.tx_hash == tx_hash)
                res_tx = await session.exec(stmt_tx)
                transaction = res_tx.first()

            if not transaction:
                transaction = PartnerTransaction(
                    partner_id=partner.id,
                    amount=amount,
                    currency=currency,
                    network=network,
                    tx_hash=tx_hash,
                    status="completed"
                )
                session.add(transaction)
                await session.flush() # Get the ID
            else:
                if transaction.status == "completed":
                    logger.info(f"Transaction {transaction.id} already completed. Skipping upgrade.")
                    return
                transaction.status = "completed"
                # Update hash if provided and missing
                if tx_hash and not transaction.tx_hash:
                    transaction.tx_hash = tx_hash
                session.add(transaction)

            # Update Partner with transaction link
            partner.last_transaction_id = transaction.id
            session.add(partner)

            # --- AWARD XP TO BUYER & LOG IN LEDGER ---
            # We do this AFTER verifying the transaction is not already completed to prevent double-logging.
            if is_pro_to_plus_upgrade:
                upgrade_xp = settings.PRO_PLUS_UPGRADE_SELF_XP - settings.PRO_UPGRADE_SELF_XP
            else:
                upgrade_xp = settings.PRO_PLUS_UPGRADE_SELF_XP if is_plus else settings.PRO_UPGRADE_SELF_XP

            partner.xp = Partner.xp + upgrade_xp # Atomic Increments
            xp_after = xp_before + upgrade_xp

            # Record XP Transaction and Audit for Buyer
            from app.models.partner import XPTransaction
            from app.services.audit_service import audit_service
            
            session.add(XPTransaction(
                partner_id=partner.id, amount=upgrade_xp,
                type="UPGRADE_BONUS",
                description=f"{'PRO+ (Upgrade)' if is_pro_to_plus_upgrade else ('PRO+' if is_plus else 'PRO')} Upgrade Reward",
                reference_id=f"upg_bonus_{transaction.id}"
            ))

            await audit_service.log_xp_award(
                session=session, partner_id=partner.id, 
                xp_amount=upgrade_xp, level=partner.level, is_pro=True,
                xp_before=xp_before, xp_after=xp_after
            )

            # Update Leaderboard (Incremental for Seasons)
            from app.services.leaderboard_service import leaderboard_service
            await leaderboard_service.increment_score(partner.id, upgrade_xp)

            # Check level up for buyer
            from app.services.referral_service import _check_level_up
            temp_notifs = []
            await _check_level_up(partner, temp_notifs, xp_after)
            if temp_notifs:
                # We can't easily gather here without an event loop if we are deep in sync code, 
                # but these are async tasks from notification_service.
                # However, _check_level_up adds to temp_notifs list.
                pass 

            # 3. Distribute Commissions to Ancestors (BEFORE commit for transaction atomicity)
            # #comment: Elite Quality Filter - Skip commissions for non-spending upgrades (Gifts, Grants)
            # This prevents referral leakage and internal system inflation.
            # 3. Distribute Commissions to Ancestors (Staged for post-commit)
            is_gift = (network or "").upper() in ["MANUAL", "SYSTEM_GIFT", "SYSTEM_GIFT_FORCE"]
            comm_pipe, comm_notifs = None, []
            if not is_gift:
                from app.services.referral_service import distribute_pro_commissions
                res = await distribute_pro_commissions(
                    session, partner.id, amount, 
                    plan_type=partner.subscription_plan,
                    transaction_id=transaction.id
                )
                if res:
                    comm_pipe, comm_notifs = res
            else:
                logger.info(f"🎁 Skipping commission distribution for gift upgrade (Network: {network}) for partner {partner.id}")
            
            # 3.1 Trigger "Network Catalyst" milestone for direct referrer (L1)
            # This fires the first time ANY of their direct referrals upgrades to PRO.
            if partner.referrer_id:
                try:
                    from sqlalchemy.orm import selectinload
                    from sqlmodel import select as sql_select
                    referrer_stmt = sql_select(Partner).where(Partner.id == partner.referrer_id).options(
                        selectinload(Partner.completed_task_records)
                    )
                    referrer_res = await session.exec(referrer_stmt)
                    referrer_partner = referrer_res.first()
                    
                    if referrer_partner:
                        from app.core.tasks import get_task_config
                        from app.models.partner import PartnerTask
                        catalyst_task_id = "network_catalyst"
                        catalyst_config = get_task_config(catalyst_task_id)
                        
                        # Check if referrer already has this milestone
                        existing_catalyst = next(
                            (t for t in (referrer_partner.completed_task_records or []) if t.task_id == catalyst_task_id and t.status == "COMPLETED"),
                            None
                        )
                        
                        if not existing_catalyst and catalyst_config:
                            catalyst_xp = catalyst_config.get('reward', 1000)
                            from sqlalchemy import update as sql_update
                            stmt_update = sql_update(Partner).where(Partner.id == referrer_partner.id).values(xp=Partner.xp + catalyst_xp)
                            await session.execute(stmt_update)
                            
                            session.add(PartnerTask(
                                partner_id=referrer_partner.id,
                                task_id=catalyst_task_id,
                                status="COMPLETED",
                                reward_xp=catalyst_xp,
                                completed_at=now
                            ))
                            
                            from app.models.partner import XPTransaction
                            session.add(XPTransaction(
                                partner_id=referrer_partner.id,
                                amount=float(catalyst_xp),
                                type="MILESTONE",
                                description=f"Completed Milestone: {catalyst_task_id}",
                                reference_id=f"ms_{catalyst_task_id}_{partner.id}"
                            ))
                            
                            logger.info(f"✅ Network Catalyst awarded to referrer {referrer_partner.telegram_id}: +{catalyst_xp} XP")
                except Exception as e:
                    logger.error(f"Network Catalyst trigger failed for referrer {partner.referrer_id}: {e}")

            # Stage Invalidate Cache (Immediate UI Feedback after commit)
            async def _after_commit():
                try:
                    tg_id = str(partner.telegram_id)
                    # #comment: Unified to v5 across stack
                    await redis_service.client.delete(f"partner:profile:v5:{tg_id}")
                    # Cleanup legacy keys
                    await redis_service.client.delete(f"profile_cache_v5:{partner.id}")
                    await redis_service.client.delete(f"profile_cache_v3:{partner.id}")
                    await redis_service.client.delete(f"partner:profile:{tg_id}")
                except Exception as e:
                    logger.warning(f"Cache invalidation failed for {partner.telegram_id}: {e}")


            # 4. Prepare Visionary & Viral Messages (Deferred until after commit)
            from app.core.i18n import get_msg
            from app.services.notification_service import notification_service

            lang = partner.language_code or "en"
            
            # Atomic commit everything
            await session.commit()

            # --- POST-COMMIT SIDE EFFECTS ---
            # Now that DB is permanent, we can safely send notifications and clear cache.
            await _after_commit()
            
            # Execute deferred commissions side-effects
            if comm_pipe:
                try:
                    await comm_pipe.execute()
                except Exception as cp_err:
                    logger.warning(f"Commissions Redis Sync Failed: {cp_err}")
            
            if comm_notifs:
                await asyncio.gather(*comm_notifs, return_exceptions=True)

            # 4.1 Welcome Message & XP Notice
            welcome_msg = get_msg(lang, "pro_plus_welcome") if is_plus else get_msg(lang, "pro_welcome")
            xp_msg = get_msg(lang, "upgrade_xp_bonus", xp=int(upgrade_xp))
            
            await notification_service.send_standard(
                chat_id=str(partner.telegram_id),
                text=f"{welcome_msg}\n\n{xp_msg}",
                salt=f"pro_welcome_{partner.id}"
            )
            if temp_notifs:
                await asyncio.gather(*temp_notifs, return_exceptions=True)

            # 4.2 Viral Congrats Message
            ref_link = f"{settings.FRONTEND_URL}?startapp={partner.referral_code}"
            viral_intro = get_msg(lang, "viralkit_intro")
            viral_key = "pro_plus_viral_announcement" if is_plus else "pro_viral_announcement"
            viral_msg = get_msg(lang, viral_key, referral_link=ref_link)
            
            await notification_service.send_low_prio(
                chat_id=str(partner.telegram_id),
                text=f"{viral_intro}\n{viral_msg}",
                salt=f"pro_viral_{partner.id}"
            )

            # 4.4 Admin Notification
            try:
                username_display = f"@{partner.username}" if partner.username else "No Username"
                admin_id = settings.ADMIN_USER_IDS[0] if settings.ADMIN_USER_IDS else "716720099"
                
                # Fetch admin lang - we do this in a separate session scope if needed, 
                # but here we just use the ID.
                admin_lang = "en" # Default to EN for admin notifications
                
                base_plan = 'PRO+' if is_plus else 'PRO'
                plan_name = f"{base_plan} Upgrade" if is_pro_to_plus_upgrade else base_plan
                expires_str = partner.pro_expires_at.strftime('%Y-%m-%d') if partner.pro_expires_at else 'LIFETIME'
                
                admin_notify_msg = get_msg(
                    admin_lang, "admin_payment_success",
                    plan=plan_name,
                    user=username_display,
                    user_id=partner.telegram_id,
                    amount=amount,
                    currency=currency,
                    hash=tx_hash or 'MANUAL',
                    plan_type=partner.subscription_plan,
                    expires=expires_str
                )
                
                await notification_service.send_critical(
                    chat_id=str(admin_id),
                    text=admin_notify_msg,
                    parse_mode="HTML",
                    salt=f"adm_upg_{partner.id}_{transaction.id}"
                )
            except Exception as admin_err:
                logger.error(f"Failed to notify admin about successful purchase: {admin_err}")

            logger.info(f"Partner {partner.telegram_id} upgraded to PRO via {currency}")
            return True
        except Exception as e:
            sentry_sdk.capture_exception(e)
            logger.error(f"❌ PRO Upgrade Failed for {partner.telegram_id}: {e}")
            await session.rollback()
            raise e

payment_service = PaymentService()
