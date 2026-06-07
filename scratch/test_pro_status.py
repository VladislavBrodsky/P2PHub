import asyncio
import os
import sys

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))

from app.models.partner import Partner
from sqlmodel import select
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

engine = create_async_engine(DATABASE_URL)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def test_pro_status():
    async with async_session_maker() as session:
        stmt = select(Partner).where(Partner.username.ilike("uslincoln")).with_for_update()
        result = await session.exec(stmt)
        partner = result.first()
        if not partner:
            print("Not found")
            return
            
        print(f"Partner is_pro: {partner.is_pro}, plan: {partner.subscription_plan}, expires: {partner.pro_expires_at}")
        
        # Run reset / check logic
        from app.services.viral_studio import viral_studio
        try:
            await viral_studio.check_tokens_and_reset(partner, session)
            print("check_tokens_and_reset passed")
        except Exception as e:
            print(f"check_tokens_and_reset failed: {e}")
            import traceback
            traceback.print_exc()

        # Let's see what get_pro_status returns
        import json
        tg_main = ""
        tg_others = []
        if partner.telegram_channel_id:
            try:
                if partner.telegram_channel_id.strip().startswith("["):
                    channels = json.loads(partner.telegram_channel_id)
                    if channels:
                        tg_main = channels[0]
                        tg_others = channels[1:]
                else:
                    tg_main = partner.telegram_channel_id
            except Exception:
                tg_main = partner.telegram_channel_id

        try:
            completed_stages = json.loads(partner.completed_stages or "[]")
        except Exception:
            completed_stages = []

        try:
            unlocked_stages = json.loads(partner.unlocked_stages or "[]")
        except Exception:
            unlocked_stages = []

        capabilities = {}
        try:
            capabilities = viral_studio.get_capabilities()
            print("get_capabilities passed")
        except Exception as e:
            print(f"get_capabilities failed: {e}")

        status_resp = {
            "is_pro": partner.is_pro,
            "is_pro_plus": partner.is_pro_plus,
            "pro_tokens": partner.pro_tokens,
            "academy_score": partner.academy_score,
            "completed_stages": completed_stages,
            "unlocked_stages": unlocked_stages,
            "has_x_setup": bool(partner.x_api_key),
            "has_telegram_setup": bool(partner.telegram_channel_id),
            "has_linkedin_setup": bool(partner.linkedin_access_token),
            "has_pinterest_setup": bool(partner.pinterest_access_token),
            "has_threads_setup": bool(partner.threads_access_token),
            "personal_referral_link": partner.personal_referral_link,
            "capabilities": capabilities,
        }
        print("Status Response:", json.dumps(status_resp, indent=2))

if __name__ == "__main__":
    asyncio.run(test_pro_status())
