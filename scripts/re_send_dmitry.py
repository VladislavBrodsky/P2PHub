
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.notification_service import notification_service
from app.core.i18n import get_msg

async def resend_dmitry():
    user_id = 716720099 # uslincoln
    lang = "en"
    buyer_name = "Дмитрий Рудских Profit & Travel 🌅🌎🏖✈️"
    
    # 1. Referral Joined + PRO Plan Bought
    msg_upg = get_msg(
        lang, "referral_upgrade_announcement",
        buyer_name=buyer_name, level=1,
        plan_name="PRO", amount=11.7
    )
    
    # We use _fallback_send directly to bypass enqueue logic which might fail if redis is unreachable
    # from this local script
    try:
        from app.core.config import settings
        buttons = [[{"text": get_msg(lang, "btn_check_balance"), "web_app": {"url": settings.FRONTEND_URL}}]]
        await notification_service._fallback_send(user_id, msg_upg, parse_mode="Markdown", buttons=buttons)
        print("✅ Sent upgrade notification!")
    except Exception as e:
        print("Error sending upgrade:", e)

    # 2. XP Award
    chain_text = "You" + " ← " + buyer_name
    msg_xp = get_msg(lang, "referral_l1_congrats", name=buyer_name, xp=300)
    try:
        buttons_xp = [[
            {"text": get_msg(lang, "btn_view_network"), "web_app": {"url": f"{settings.FRONTEND_URL}?start_param=network"}},
            {"text": get_msg(lang, "btn_open_app"), "web_app": {"url": settings.FRONTEND_URL}}
        ]]
        await notification_service._fallback_send(user_id, msg_xp, parse_mode="Markdown", buttons=buttons_xp)
        print("✅ Sent XP notification!")
    except Exception as e:
        print("Error sending XP:", e)

if __name__ == "__main__":
    asyncio.run(resend_dmitry())
