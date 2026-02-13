import os
import json
import logging
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

import gspread
from google.oauth2.service_account import Credentials
from openai import AsyncOpenAI

from app.core.config import settings
from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)

class SupportAgentService:
    """
    AI Support Agent: Expert Customer Care and Support Team.
    Focuses on Pintopay products, maintains positive tone, and sells crypto solutions.
    """
    
    SYSTEM_PROMPT = """
    You are an Expert Customer Care and Support Team manager for Pintopay.
    Your tone is professional, helpful, and always positive.
    You represent Pintopay as the best financial service for the digital economy.
    You focus on improvements every single day.
    
    GUIDELINES:
    1. Act as a real manager. DO NOT mention you are an AI.
    2. Search for information in the Knowledge Base provided in the context.
    3. If instructions are missing in the Knowledge Base, provide professional advice using your latest knowledge (GPT-4o).
    4. Focus on Pintopay products: Virtual/Physical Cards, Setup, Issuance, ApplePay connection, Topups, etc.
    5. Always maintain a positive tone about Pintopay.
    6. If the user asks random or unrelated questions (not about Pintopay or Crypto/Fintech), 
       gracefully guide the conversation back to Pintopay and sell the idea of Crypto Cards and Crypto Payments.
    7. Provide clear instructions and advice.
    """
    
    CATEGORIES = [
        "Pintopay Card Details",
        "Card Issue & Setup",
        "Top-up & Limits",
        "ApplePay / GooglePay",
        "Earnings & Network",
        "Security & Technical"
    ]

    def __init__(self):
        openai_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
        if openai_key:
            self.openai_client = AsyncOpenAI(api_key=openai_key)
        else:
            self.openai_client = None
            logger.warning("SupportService: OpenAI API Key missing.")

        self.gs_client = None
        self._init_google_sheets()

    def _init_google_sheets(self):
        """Initializes Google Sheets client using service account info from environment."""
        creds_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
        if creds_json:
            try:
                creds_dict = json.loads(creds_json)
                scopes = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
                credentials = Credentials.from_service_account_info(creds_dict, scopes=scopes)
                self.gs_client = gspread.authorize(credentials)
                logger.info("✅ SupportService: Google Sheets client initialized.")
            except Exception as e:
                logger.error(f"❌ SupportService: Failed to init Google Sheets: {e}")

    async def get_session(self, user_id: str) -> Dict[str, Any]:
        """Retrieves or creates a support session for a user."""
        session_key = f"support_session:{user_id}"
        session = await redis_service.get_json(session_key)
        if not session:
            session = {
                "user_id": user_id,
                "history": [],
                "created_at": datetime.utcnow().isoformat(),
                "last_activity": datetime.utcnow().isoformat(),
                "last_ping": datetime.utcnow().isoformat(),
                "status": "active",
                "category": None,
                "ping_count": 0
            }
            await redis_service.set_json(session_key, session, expire=3600)
        return session

    async def update_session(self, user_id: str, session: Dict[str, Any]):
        """Updates the session in Redis and refreshes activity timestamp."""
        session_key = f"support_session:{user_id}"
        session["last_activity"] = datetime.utcnow().isoformat()
        session["ping_count"] = 0 # Reset pings on activity
        await redis_service.set_json(session_key, session, expire=3600)

    async def generate_response(self, user_id: str, message: str) -> str:
        """Generates an AI response based on KB and history."""
        if not self.openai_client:
            return "Support service is currently unavailable. Please try again later."

        session = await self.get_session(user_id)
        
        # 1. Search Knowledge Base (FAQ + Google Sheet)
        kb_context = await self._search_knowledge_base(message)
        
        # 2. Build messages for LLM
        messages = [{"role": "system", "content": f"{self.SYSTEM_PROMPT}\n\nContext from Knowledge Base:\n{kb_context}"}]
        
        # History window (last 10 messages)
        relevant_history = session.get("history", [])[-10:]
        for m in relevant_history:
            messages.append(m)
            
        messages.append({"role": "user", "content": message})

        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                temperature=0.6,
                max_tokens=500
            )
            answer = response.choices[0].message.content
            
            # Update local history
            session["history"].append({"role": "user", "content": message, "timestamp": datetime.utcnow().isoformat()})
            session["history"].append({"role": "assistant", "content": answer, "timestamp": datetime.utcnow().isoformat()})
            
            await self.update_session(user_id, session)
            return answer
        except Exception as e:
            logger.error(f"❌ Error generating AI response: {e}")
            return "I apologize, but I'm processing multiple requests. One moment, please."

    async def _search_knowledge_base(self, query: str) -> str:
        """
        Searches built-in FAQ and Google Sheet KB.
        For now, returns a curated combined context.
        """
        # Hardcoded core Pintopay facts (as specified in Task)
        core_info = """
        - Pintopay Card: USD-denominated Mastercard (Virtual or Physical).
        - Setup: Instant issuance via the app. Must select card type and pay fee.
        - ApplePay: Virtual cards can be added to ApplePay and GooglePay immediately.
        - Top-up: Use crypto (USDT/TON) to top up your card balance instantly.
        - Mission: Best service for digital nomads. Improving every single day.
        - Tone: Pintopay is elite, fast, and borderless.
        """
        
        # Dynamic search from Google Sheet if available
        gs_info = ""
        if self.gs_client:
            try:
                kb_sheet_id = os.getenv("GOOGLE_KNOWLEDGE_BASE_SHEET_ID")
                if kb_sheet_id:
                    # Simulation of search: would typically fetch all and filter or use a search API
                    sheet = self.gs_client.open_by_key(kb_sheet_id).sheet1
                    # Simple first-page fetch for context
                    records = sheet.get_all_records()
                    # Filter records by keyword or just provide a summary
                    gs_info = "\n".join([f"{r['Question']}: {r['Answer']}" for r in records[:5]])
            except Exception as e:
                logger.error(f"⚠️ KB Sheet Search Error: {e}")
        
        return f"{core_info}\n\nAdditional KB Info:\n{gs_info}"

    async def save_conversation_to_sheets(self, user_id: str):
        """Saves the entire session history to a structured Google Sheet."""
        session = await self.get_session(user_id)
        if not session.get("history"):
            return

        chat_session_id = f"SID-{user_id}-{int(datetime.utcnow().timestamp())}"
        
        if self.gs_client:
            try:
                history_sheet_id = os.getenv("SUPPORT_HISTORY_SHEET_ID")
                if history_sheet_id:
                    sheet = self.gs_client.open_by_key(history_sheet_id).sheet1
                    
                    # Columns: SessionID, UserID, Timestamp, Role, Message, Category
                    rows = []
                    category = session.get("category", "General")
                    for entry in session["history"]:
                        rows.append([
                            chat_session_id,
                            user_id,
                            entry.get("timestamp", datetime.utcnow().isoformat()),
                            entry["role"],
                            entry["content"],
                            category
                        ])
                    
                    sheet.append_rows(rows)
                    logger.info(f"✅ Saved support history for {user_id} to Google Sheets.")
            except Exception as e:
                logger.error(f"❌ Failed to save history to Google Sheets: {e}")

    async def close_session(self, user_id: str):
        """Finalizes and removes session."""
        await self.save_conversation_to_sheets(user_id)
        session_key = f"support_session:{user_id}"
        await redis_service.delete(session_key)
        logger.info(f"🏁 Support session for {user_id} closed and salvaged.")

# Singleton Instance
support_service = SupportAgentService()
