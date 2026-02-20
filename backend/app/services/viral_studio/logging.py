import asyncio
import json
import logging
import os
from datetime import UTC, datetime

import gspread
from google.oauth2.service_account import Credentials

from app.models.partner import Partner

logger = logging.getLogger(__name__)

class ViralLogger:
    def __init__(self):
        self.gs_client = None
        self._gs_sheet_cache = {}
        self._init_google_sheets_client()

    def _init_google_sheets_client(self):
        creds_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "").strip()
        if not creds_json or not (creds_json.startswith('{') and creds_json.endswith('}')):
            return

        try:
            creds_dict = json.loads(creds_json)
            scopes = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
            credentials = Credentials.from_service_account_info(creds_dict, scopes=scopes)
            self.gs_client = gspread.authorize(credentials)
            logger.info("✅ ViralLogger: Google Sheets logging initialized.")
        except Exception as e:
            logger.error(f"❌ ViralLogger: Failed to init Google Sheets: {e}")

    async def log_generation_to_sheets(
        self,
        partner: Partner,
        topic: str,
        audience: str,
        language: str,
        openai_prompt: str,
        gemini_prompt: str,
        duration: float,
        tokens_openai: int,
        tokens_gemini: int,
        title: str,
        body: str,
        image_url: str | None,
        image_model: str = "unknown",
        text_model: str = "unknown"
    ):
        if not self.gs_client:
            return

        try:
            sheet_id = os.getenv("VIRAL_MARKETING_SPREADSHEET_ID") or "1JCxW4ANBthKy3Qeu9RBE3Ds3fFpX8993Q_6JPdmg-_k"
            gid = os.getenv("VIRAL_MARKETING_GID") or "633034160"
            cache_key = f"{sheet_id}_{gid}"
            
            loop = asyncio.get_event_loop()
            
            def get_sheet_sync():
                if cache_key not in self._gs_sheet_cache:
                    spreadsheet = self.gs_client.open_by_key(sheet_id)
                    try:
                        self._gs_sheet_cache[cache_key] = spreadsheet.worksheet("AI Marketing Studio Log")
                    except Exception:
                        self._gs_sheet_cache[cache_key] = spreadsheet.get_worksheet_by_id(int(gid))
                return self._gs_sheet_cache[cache_key]

            sheet = await loop.run_in_executor(None, get_sheet_sync)
            
            if sheet:
                # Text Cost Calculation
                if "gpt-4o" in text_model:
                    openai_cost = (tokens_openai / 1000) * 0.005 if "mini" in text_model else (tokens_openai / 1000) * 0.015
                else:
                    openai_cost = 0.0 # Gemini/Other might be covered by API key or free tier

                # Image Cost Calculation
                if image_model == "dall-e-3":
                    image_cost = 0.040
                elif "imagen" in image_model:
                    # Imagen 3.0/4.0 costs vary, usually ~$0.02-$0.04 or on-demand
                    image_cost = 0.030 
                else:
                    image_cost = 0.0

                row = [
                    datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S"),
                    partner.id,
                    partner.telegram_id or partner.id,
                    topic,
                    audience,
                    language,
                    f"${openai_cost:.4f}",
                    f"${image_cost:.4f}",
                    f"{duration:.2f}s",
                    text_model,
                    image_model,
                    tokens_openai,
                    title,
                    body[:500] + "..." if len(body) > 500 else body,
                    image_url or "N/A"
                ]
                await loop.run_in_executor(None, lambda: sheet.append_row(row))
        except Exception as e:
            logger.error(f"❌ ViralLogger: Failed to log generation: {e}")

    async def log_rss_to_sheets(self, news_items: list[dict]):
        if not self.gs_client or not news_items:
            return

        try:
            sheet_id = os.getenv("VIRAL_MARKETING_SPREADSHEET_ID") or "1JCxW4ANBthKy3Qeu9RBE3Ds3fFpX8993Q_6JPdmg-_k"
            loop = asyncio.get_event_loop()
            
            def get_rss_sheet_sync():
                spreadsheet = self.gs_client.open_by_key(sheet_id)
                try:
                    return spreadsheet.worksheet("RSS News")
                except Exception:
                    return spreadsheet.add_worksheet(title="RSS News", rows="1000", cols="5")

            sheet = await loop.run_in_executor(None, get_rss_sheet_sync)
            
            rows = []
            now_str = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S")
            for item in news_items:
                rows.append([
                    now_str,
                    item.get('source', 'Unknown'),
                    item.get('title', 'N/A'),
                    item.get('link', 'N/A'),
                    item.get('pub_date', 'N/A')
                ])
            
            if rows:
                await loop.run_in_executor(None, lambda: sheet.append_rows(rows, value_input_option='USER_ENTERED'))
        except Exception as e:
            logger.error(f"❌ ViralLogger: Failed to log RSS: {e}")

    async def get_user_story_history(self, partner_id: int) -> list[dict]:
        if not self.gs_client:
            return []
            
        try:
            sheet_id = os.getenv("VIRAL_MARKETING_SPREADSHEET_ID") or "1JCxW4ANBthKy3Qeu9RBE3Ds3fFpX8993Q_6JPdmg-_k"
            loop = asyncio.get_event_loop()
            
            def get_story_sheet_sync():
                spreadsheet = self.gs_client.open_by_key(sheet_id)
                try:
                    return spreadsheet.worksheet("Story Episodes")
                except Exception:
                    return spreadsheet.add_worksheet(title="Story Episodes", rows="1000", cols="6")

            sheet = await loop.run_in_executor(None, get_story_sheet_sync)
            
            if sheet:
                def get_all_records():
                    return sheet.get_all_records(expected_headers=["PartnerID", "Episode", "Title", "Summary", "Date"])
                
                try:
                    records = await loop.run_in_executor(None, get_all_records)
                    user_records = [r for r in records if str(r.get("PartnerID", "")) == str(partner_id)]
                    return user_records
                except Exception as parse_e:
                    logger.warning(f"Story sheet empty or missing headers: {parse_e}")
                    # Initialize headers if empty
                    await loop.run_in_executor(None, lambda: sheet.append_row(["PartnerID", "Episode", "Title", "Summary", "Date"]))
                    return []
        except Exception as e:
            logger.error(f"❌ ViralLogger: Failed to get story history: {e}")
        return []

    async def append_user_story_history(self, partner_id: int, episode_num: int, title: str, summary: str):
        if not self.gs_client:
            return

        try:
            sheet_id = os.getenv("VIRAL_MARKETING_SPREADSHEET_ID") or "1JCxW4ANBthKy3Qeu9RBE3Ds3fFpX8993Q_6JPdmg-_k"
            loop = asyncio.get_event_loop()
            
            def get_story_sheet_sync():
                spreadsheet = self.gs_client.open_by_key(sheet_id)
                try:
                    return spreadsheet.worksheet("Story Episodes")
                except Exception:
                    return spreadsheet.add_worksheet(title="Story Episodes", rows="1000", cols="6")

            sheet = await loop.run_in_executor(None, get_story_sheet_sync)
            
            if sheet:
                now_str = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S")
                row = [str(partner_id), episode_num, title, summary[:1000], now_str]
                await loop.run_in_executor(None, lambda: sheet.append_row(row))
        except Exception as e:
            logger.error(f"❌ ViralLogger: Failed to append story history: {e}")

viral_logger = ViralLogger()
