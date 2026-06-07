import asyncio
import os
import sys
import json

BASE_DIR = "/Users/grandmaestro/Developer/P2PHub"
sys.path.append(os.path.join(BASE_DIR, "backend"))

from app.models.partner import Partner
from app.services.viral_studio import viral_studio
from sqlmodel import select
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+asyncpg://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway"

engine = create_async_engine(DATABASE_URL)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def simulate_endpoint():
    async with async_session_maker() as session:
        try:
            print("1. Fetching partner @uslincoln...")
            stmt = select(Partner).where(Partner.username.ilike("uslincoln"))
            res = await session.exec(stmt)
            partner = res.first()
            
            if not partner:
                print("❌ Partner not found!")
                return
                
            print(f"Partner ID: {partner.id}, TG: {partner.telegram_id}")
            
            print("2. Calling viral_studio.check_tokens_and_reset...")
            await viral_studio.check_tokens_and_reset(partner, session)
            print("✅ check_tokens_and_reset completed successfully.")
            
            print("3. Emulating the status response payload...")
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
                except Exception as e:
                    print(f"Warning parsing telegram_channel_id: {e}")
                    tg_main = partner.telegram_channel_id

            completed_stages = json.loads(partner.completed_stages or "[]")
            unlocked_stages = json.loads(partner.unlocked_stages or "[]")
            
            payload = {
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
                "setup": {
                    "x_api_key": partner.x_api_key or "",
                    "x_api_secret": partner.x_api_secret or "",
                    "x_access_token": partner.x_access_token or "",
                    "x_access_token_secret": partner.x_access_token_secret or "",
                    "telegram_channel_id": tg_main,
                    "telegram_channels": tg_others,
                    "linkedin_access_token": partner.linkedin_access_token or "",
                    "pinterest_access_token": partner.pinterest_access_token or "",
                    "threads_access_token": partner.threads_access_token or "",
                    "facebook_access_token": partner.facebook_access_token or "",
                    "discord_webhook_url": partner.discord_webhook_url or ""
                }
            }
            print("🎉 Success! Status payload compiled successfully:")
            print(json.dumps(payload, indent=2))
        except Exception as e:
            print(f"❌ Error during simulation: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(simulate_endpoint())
