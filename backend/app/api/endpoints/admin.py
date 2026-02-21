import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.i18n import get_msg
from app.core.security import get_current_admin
from app.models.partner import Partner, get_session
from app.models.transaction import PartnerTransaction
from app.services.admin_service import admin_service
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service
from app.services.payment_service import payment_service
from app.services.broadcast_service import broadcast_service
from app.schemas.broadcast import BroadcastCreate, BroadcastRead

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/stats", response_model=dict[str, Any])
async def get_admin_stats(
    force_refresh: bool = False,
    admin: dict = Depends(get_current_admin)
):
    """
    Returns high-level KPIs and financial data for the admin dashboard.
    """
    return await admin_service.get_dashboard_stats(force_refresh=force_refresh)

@router.get("/pending-payments")
async def list_pending_payments(
    admin: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    """
    Lists all transactions awaiting manual review with partner details.
    """
    from sqlalchemy.orm import selectinload
    statement = (
        select(PartnerTransaction)
        .where(PartnerTransaction.status == "manual_review")
        .options(selectinload(PartnerTransaction.partner))
    )
    result = await session.exec(statement)
    txs = result.all()
    
    return [
        {
            "id": t.id,
            "partner_id": t.partner_id,
            "username": t.partner.username if t.partner else None,
            "telegram_id": t.partner.telegram_id if t.partner else "Unknown",
            "amount": t.amount,
            "currency": t.currency,
            "network": t.network,
            "tx_hash": t.tx_hash,
            "status": t.status,
            "created_at": t.created_at.isoformat()
        } for t in txs
    ]

@router.post("/approve-payment/{transaction_id}")
async def approve_payment(
    transaction_id: int,
    admin: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    """
    Approves a manual payment and triggers user upgrade.
    """
    transaction = await session.get(PartnerTransaction, transaction_id)

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if transaction.status != "manual_review":
        raise HTTPException(status_code=400, detail=f"Transaction is in {transaction.status} state, cannot approve")

    # Get the partner
    partner = await session.get(Partner, transaction.partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    # Execute upgrade logic
    success = await payment_service.upgrade_to_pro(
        session=session,
        partner=partner,
        amount=transaction.amount,
        currency=transaction.currency,
        network=transaction.network,
        tx_hash=transaction.tx_hash,
        transaction_id=transaction.id
    )

    if success:
        # Notify the User
        try:
            lang = partner.language_code or "en"
            user_msg = get_msg(lang, "pro_welcome")
            await notification_service.send_standard(
                chat_id=partner.telegram_id,
                text=f"✅ *PAYMENT APPROVED!*\n\n{user_msg}",
                salt=f"pay_appr_{transaction.id}"
            )
        except Exception as e:
            logger.error(f"[DEBUG] User approval notification failed: {e}")

        return {"status": "success", "message": f"Payment {transaction.id} approved for {partner.telegram_id}"}

    else:
        raise HTTPException(status_code=500, detail="Failed to upgrade user to PRO")

@router.post("/reject-payment/{transaction_id}")
async def reject_payment(
    transaction_id: int,
    admin: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    """
    Rejects a manual payment. Sets status to 'failed' and notifies the user.
    """
    transaction = await session.get(PartnerTransaction, transaction_id)

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if transaction.status != "manual_review":
        raise HTTPException(status_code=400, detail=f"Transaction is in {transaction.status} state, cannot reject")

    # Get the partner
    partner = await session.get(Partner, transaction.partner_id)

    transaction.status = "failed"
    session.add(transaction)
    
    # Audit Log
    await audit_service.log_event(
        session=session,
        entity_type="transaction",
        entity_id=str(transaction.id),
        action="payment_rejected",
        actor_id=str(admin.get("id") or "admin"),
        details={"partner_id": transaction.partner_id, "amount": transaction.amount}
    )
    
    await session.commit()

    # Notify the User
    if partner:
        try:
            await notification_service.send_standard(
                chat_id=partner.telegram_id,
                text="❌ *PAYMENT REJECTED*\n\nYour manual payment confirmation was rejected. Please try again or contact support.",
                salt=f"pay_rej_{transaction.id}"
            )
        except Exception as e:
            logger.error(f"Failed to send rejection notification: {e}")

    return {"status": "success", "message": f"Payment {transaction_id} rejected"}

@router.get("/tree")
async def get_global_tree_stats(
    target_id: int | None = None,
    admin: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    """
    Returns the total number of partners at each level (1-9) globally, 
    or a specific partner's tree if target_id is provided.
    """
    if target_id:
        from app.services.analytics_service import get_referral_tree_stats
        return await get_referral_tree_stats(session, target_id)
        
    return await admin_service.get_global_network_stats()

@router.get("/network/{level}")
async def get_global_network_level(
    level: int,
    target_id: int | None = None,
    admin: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    """
    Returns the list of top partners at a specific level in the whole system,
    or a specific partner's network level if target_id is provided.
    """
    if target_id:
        from app.services.analytics_service import get_referral_tree_members
        return await get_referral_tree_members(session, target_id, level)
        
    return await admin_service.get_global_network_members(level)

@router.post("/recalculate-stats")
async def recalculate_stats(
    admin: dict = Depends(get_current_admin)
):
    """
    Triggers a global recalculation of referral counts and depths.
    """
    return await admin_service.recalculate_all_referral_counts()

@router.get("/health")
async def get_system_health(
    admin: dict = Depends(get_current_admin)
):
    """
    Returns high-level system health metrics.
    """
    from app.services.maintenance_service import check_database_health
    return await check_database_health()

@router.get("/partners/{partner_id}", response_model=dict[str, Any])
async def get_partner_details(
    partner_id: int,
    admin: dict = Depends(get_current_admin)
):
    """
    Get detailed partner information for administrative review.
    """
    details = await admin_service.get_partner_admin_details(partner_id)
    if not details:
        raise HTTPException(status_code=404, detail="Partner not found")
    return details

@router.post("/partners/{partner_id}/update")
async def update_partner_admin(
    partner_id: int,
    payload: dict[str, Any],
    admin: dict = Depends(get_current_admin)
):
    """
    Update partner attributes (XP, PRO status) from admin panel.
    """
    success = await admin_service.update_partner_admin(partner_id, payload)
    if not success:
        raise HTTPException(status_code=404, detail="Partner not found or update failed")
    return {"status": "success"}

@router.post("/maintenance/clear-cache")
async def clear_cache(
    admin: dict = Depends(get_current_admin)
):
    """
    Clears key system caches.
    """
    return await admin_service.clear_system_cache()

@router.get("/search-partners", response_model=list[dict[str, Any]])
async def search_partners(
    query: str,
    admin: dict = Depends(get_current_admin)
):
    """
    Search for partners by username or Telegram ID.
    Only accessible by admins.
    """
    return await admin_service.search_partners(query)

@router.get("/maintenance/notification-stats")
async def get_notification_stats(
    admin: dict = Depends(get_current_admin)
):
    """Returns statistics about pending/sent notifications."""
    from sqlmodel import func, select
    from sqlmodel.ext.asyncio.session import AsyncSession

    from app.models.notification_retry import NotificationRetry
    from app.models.partner import engine
    
    async with AsyncSession(engine) as session:
        sent = (await session.exec(select(func.count(NotificationRetry.id)).where(NotificationRetry.status == "sent"))).one() or 0
        pending = (await session.exec(select(func.count(NotificationRetry.id)).where(NotificationRetry.status == "pending"))).one() or 0
        failed = (await session.exec(select(func.count(NotificationRetry.id)).where(NotificationRetry.status == "failed"))).one() or 0
        total = (await session.exec(select(func.count(NotificationRetry.id)))).one() or 0
        return {"sent": sent, "pending": pending, "failed": failed, "total": total}

@router.get("/palantir-feed", response_model=list[dict[str, Any]])
async def get_palantir_feed(
    limit: int = 100,
    admin: dict = Depends(get_current_admin)
):
    """
    Returns the real-time system event feed.
    """
    return await admin_service.get_palantir_feed(limit=limit)

# --- Mass Messaging (Broadcast) Endpoints ---

@router.post("/broadcasts", response_model=BroadcastRead)
async def create_broadcast(
    data: BroadcastCreate,
    admin: dict = Depends(get_current_admin)
):
    """
    Creates and triggers a mass messaging campaign.
    """
    return await broadcast_service.create_broadcast(
        admin_id=str(admin.get("id")),
        message_text=data.message_text,
        audience_type=data.audience_type
    )

@router.get("/broadcasts/active", response_model=list[BroadcastRead])
async def get_active_broadcasts(
    admin: dict = Depends(get_current_admin)
):
    """
    Returns currently running broadcasts.
    """
    return await broadcast_service.get_active_broadcasts()

@router.get("/broadcasts/history", response_model=list[BroadcastRead])
async def get_broadcast_history(
    limit: int = 20,
    admin: dict = Depends(get_current_admin)
):
    """
    Returns past mass message campaigns.
    """
    return await broadcast_service.get_broadcast_history(limit=limit)

@router.post("/broadcasts/{broadcast_id}/cancel")
async def cancel_broadcast(
    broadcast_id: int,
    admin: dict = Depends(get_current_admin)
):
    """
    Cancels a running broadcast.
    """
    success = await broadcast_service.cancel_broadcast(broadcast_id)
    if not success:
        raise HTTPException(status_code=404, detail="Broadcast not found or not cancellable")
    return {"status": "cancelled"}

@router.post("/maintenance/retry-notifications")
async def retry_notifications(
    admin: dict = Depends(get_current_admin)
):
    """Trigger manual retry of pending notifications."""
    from app.services.notification_service import notification_service
    await notification_service.process_retries()
    return {"status": "success"}

@router.post("/maintenance/audit-economy")
async def audit_economy_endpoint(
    admin: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    """
    Trigger an economy integrity audit manually from the Advanced Admin Command Center.
    This calculates the exact sum of XP and USDT based on transaction logs and earnings
    to ensure the current User.xp and User.balance values match exactly and have not 
    been mutated incorrectly or exploited. Returns detailed counts of checked partners
    and any discrepancies found.
    """
    from app.services.maintenance_service import run_economy_audit
    return await run_economy_audit(session)

@router.post("/maintenance/audit-tree")
async def audit_tree_endpoint(
    admin: dict = Depends(get_current_admin),
    session: AsyncSession = Depends(get_session)
):
    """
    Trigger a network tree integrity audit manually from the Advanced Admin Command Center.
    This inspects the entire 20-level hierarchy and validates the materialized path structure
    against the cached depth value. It quickly finds anomalies where users might be at
    incorrect structural levels.
    """
    from app.services.maintenance_service import check_tree_integrity
    return await check_tree_integrity(session)
