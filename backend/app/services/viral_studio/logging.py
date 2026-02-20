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
        image_url: str | None
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
                    except:
                        self._gs_sheet_cache[cache_key] = spreadsheet.get_worksheet_by_id(int(gid))
                return self._gs_sheet_cache[cache_key]

            sheet = await loop.run_in_executor(None, get_sheet_sync)
            
            if sheet:
                openai_cost = (tokens_openai / 1000) * 0.015
                google_cost = (tokens_gemini / 1000) * 0.005 if tokens_gemini > 0 else 0.004 # Imagen flat rate or tokens
                
                row = [
                    datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S"),
                    partner.id,
                    partner.telegram_id or partner.id,
                    topic,
                    audience,
                    language,
                    f"${openai_cost:.4f}",
                    f"${google_cost:.4f}",
                    f"{duration:.2f}s",
                    tokens_openai,
                    tokens_gemini,
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
                except:
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

viral_logger = ViralLogger()
