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

# #comment: Import redis service for caching KB responses
from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)

class SupportAgentService:
    """
    AI Support Agent: Expert Customer Care and Support Team.
    Focuses on Pintopay products, maintains positive tone, and sells crypto solutions.
    """
    
    SYSTEM_PROMPT = """
    You are an Expert Customer Care and Support Team manager for Pintopay.
    Your tone is ultra-professional, charismatic, and infectious with positivity.
    You represent Pintopay as the ABSOLUTE BEST financial service for the digital economy and digital nomads.
    We are a elite team that focuses on radical improvements every single day.
    
    GUIDELINES:
    1. Act as a real human manager (e.g., Alex or Sarah from Support). NEVER disclose you are an AI.
    2. Search for information in the Knowledge Base provided in the context.
    3. If instructions are missing in the Knowledge Base, provide professional, high-end advice using your latest knowledge.
    4. Focus on Pintopay products: Virtual/Physical Cards, Setup, Issuance, ApplePay connection, Topups, etc. Highlight how Pintopay is borderless, fast, and secure.
    5. Always maintain a 10/10 positive tone about Pintopay. Use phrases like "Our top-tier cards," "Elite service," and "Improving your experience daily."
    6. If the user asks random or unrelated questions (not about Pintopay or Crypto/Fintech), 
       gracefully guide the conversation back to Pintopay. Sell the vision of Crypto Cards and Crypto Payments as the future of financial freedom.
    7. Provide clear, detailed instructions and premium advice.
    """
    
    CATEGORIES = [
        "Pintopay Card Details",
        "Card Issue & Setup",
        "Top-up & Limits",
        "ApplePay / GooglePay",
        "Earnings & Network",
        "Security & Technical"
    ]
    
    KB_CACHE_KEY = "knowledge_base_cache"
    KB_TTL = 3600  # 1 hour cache
    
    # #comment: Cost tracking constants (Optimized for GPT-4o-Mini)
    # Mini is ~50x cheaper and 3x faster than gpt-4o
    COST_INPUT_1M = 0.15
    COST_OUTPUT_1M = 0.60

    # #comment: Local Memory Cache for Knowledge Base (Scale bypass for Redis)
    _kb_memory_cache: Optional[Dict[str, Any]] = None
    _kb_last_refresh: datetime = datetime.min
    KB_MEMORY_TTL = 300  # 5 minutes in-memory TTL

    def __init__(self):
        openai_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
        if openai_key:
            self.openai_client = AsyncOpenAI(api_key=openai_key)
        else:
            self.openai_client = None
            logger.warning("SupportService: OpenAI API Key missing.")

        self.gs_client = None
        # Initialize Google Sheets (synchronous part)
        self._init_google_sheets_client()

    def _init_google_sheets_client(self):
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

    async def _get_cached_kb(self) -> Dict[str, str]:
        """
        Retrieves KB with dual-layer caching (Memory -> Redis -> Google Sheets).
        Optimized for high-concurrency 10M+ user environments.
        """
        # 1. Level 1 Cache: Local Memory (Sub-millisecond)
        now = datetime.utcnow()
        if self._kb_memory_cache and (now - self._kb_last_refresh).total_seconds() < self.KB_MEMORY_TTL:
            return self._kb_memory_cache

        try:
            # 2. Level 2 Cache: Redis (Network-speed)
            cached_kb = await redis_service.get_json(self.KB_CACHE_KEY)
            
            if cached_kb:
                # Update memory cache
                self._kb_memory_cache = cached_kb
                self._kb_last_refresh = now
                return cached_kb
            
            # 2. Fetch from Google Sheets
            # #comment: Fallback to Google Sheets API if cache is empty
            if self.gs_client:
                sheet_id = os.getenv("SUPPORT_SPREADSHEET_ID")
                if sheet_id:
                    logger.info("🔄 Refreshing Knowledge Base Cache from Google Sheets...")
                    spreadsheet = self.gs_client.open_by_key(sheet_id)
                    
                    # TOV
                    tov_info = ""
                    try:
                        tov_gid = os.getenv("TOV_GID", "0")
                        tov_sheet = spreadsheet.get_worksheet_by_id(int(tov_gid))
                        if tov_sheet:
                            tov_records = tov_sheet.get_all_records()
                            tov_info = "\n".join([f"{r.get('Rule', '')}: {r.get('Value', '')}" for r in tov_records])
                    except Exception as e:
                        logger.warning(f"Could not load TOV tab: {e}")

                    # KB
                    kb_records = []
                    try:
                        kb_gid = os.getenv("KB_GID", "0")
                        kb_sheet = spreadsheet.get_worksheet_by_id(int(kb_gid))
                        if kb_sheet:
                            kb_records = kb_sheet.get_all_records()
                    except Exception as e:
                        logger.warning(f"Could not load KB tab: {e}")
                    
                    # Construct Cache Object
                    kb_data = {
                        "tov": tov_info,
                        "qa": kb_records
                    }
                    
                    # Save to Cache
                    await redis_service.set_json(self.KB_CACHE_KEY, kb_data, expire=self.KB_TTL)
                    logger.info("✅ Knowledge Base Cached Successfully.")
                    return kb_data
        except Exception as e:
            logger.error(f"⚠️ Knowledge Base Cache/Fetch Error: {e}")
            
        return None


    async def get_session(self, user_id: str) -> Dict[str, Any]:
        """Retrieves or creates a support session for a user."""
        session_key = f"support_session:{user_id}"
        
        try:
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
        except Exception as e:
            logger.error(f"❌ Redis Session Error (get_session): {e}")
            # Fallback to ephemeral session so the user can still chat
            return {
                "user_id": user_id,
                "history": [],
                "created_at": datetime.utcnow().isoformat(),
                "last_activity": datetime.utcnow().isoformat(),
                "last_ping": datetime.utcnow().isoformat(),
                "status": "active",
                "category": None,
                "ping_count": 0
            }

    async def update_session(self, user_id: str, session: Dict[str, Any]):
        """Updates the session in Redis and refreshes activity timestamp."""
        try:
            session_key = f"support_session:{user_id}"
            session["last_activity"] = datetime.utcnow().isoformat()
            session["ping_count"] = 0 # Reset pings on activity
            await redis_service.set_json(session_key, session, expire=3600)
        except Exception as e:
            logger.error(f"❌ Redis Update Error (update_session): {e}")

    async def generate_response(self, user_id: str, message: str, user_metadata: Dict[str, Any] = None) -> str:
        """Generates an AI response based on KB and history."""
        if not self.openai_client:
            return "Support service is currently unavailable. Please try again later."

        try:
            session = await self.get_session(user_id)
            
            # #comment: Update session with latest user metadata (if provided)
            if user_metadata:
                session["user_metadata"] = user_metadata
            
            # 1. Search Knowledge Base (FAQ + Google Sheet)
            kb_context, detected_category = await self._search_knowledge_base(message)
            
            # #comment: Update session category if a specific one was found (and not just General)
            if detected_category and detected_category != "General":
                session["category"] = detected_category
            
            # 2. Build messages for LLM
            # #comment: Inject Rich User Context into System Prompt
            user_context_str = "Unknown User"
            if user_metadata:
                user_context_str = (
                    f"User: {user_metadata.get('first_name', '')} {user_metadata.get('last_name', '')} "
                    f"(@{user_metadata.get('username', 'N/A')})\n"
                    f"Level: {user_metadata.get('level', 1)}\n"
                    f"Balance: {user_metadata.get('balance', 0.0)} USDT"
                )
            
            system_msg = (
                f"{self.SYSTEM_PROMPT}\n\n"
                f"--- USER PROFILE ---\n{user_context_str}\n\n"
                f"--- KNOWLEDGE BASE ---\n{kb_context}"
            )
            
            messages = [{"role": "system", "content": system_msg}]
            
            # History window (last 10 messages)
            relevant_history = session.get("history", [])[-10:]
            for m in relevant_history:
                messages.append(m)
                
            messages.append({"role": "user", "content": message})

            response = await self.openai_client.chat.completions.create(
                # #comment: Switched to gpt-4o-mini for hyper-speed and efficiency
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.6,
                max_tokens=500
            )
            answer = response.choices[0].message.content
            
            # #comment: Calculate cost for this turn
            usage = response.usage
            cost = 0.0
            if usage:
                cost = (usage.prompt_tokens / 1_000_000 * self.COST_INPUT_1M) + \
                       (usage.completion_tokens / 1_000_000 * self.COST_OUTPUT_1M)

            # Update local history with cost tracking
            session["history"].append({"role": "user", "content": message, "timestamp": datetime.utcnow().isoformat()})
            session["history"].append({
                "role": "assistant", 
                "content": answer, 
                "timestamp": datetime.utcnow().isoformat(),
                "cost": cost
            })
            
            # Accumulate total session cost
            session["total_cost"] = session.get("total_cost", 0.0) + cost
            
            await self.update_session(user_id, session)
            return answer
        except Exception as e:
            logger.error(f"❌ Error generating AI response: {e}")
            return "I apologize, but I'm processing multiple requests. One moment, please."


    async def _search_knowledge_base(self, query: str) -> tuple[str, str]:
        """
        Searches built-in FAQ and Google Sheet KB using cached data for speed.
        Returns: (kb_context_string, detected_category)
        Optimized for high-concurrency (10M+ users).
        """
        # 1. Core Facts (Always available in memory)
        core_info = """
        - Pintopay Card: USD-denominated Mastercard (Virtual or Physical).
        - Setup: Instant issuance via the app. Must select card type and pay fee.
        - ApplePay: Virtual cards can be added to ApplePay and GooglePay immediately.
        - Top-up: Use crypto (USDT/TON) to top up your card balance instantly.
        - Mission: Best service for digital nomads. Improving every single day.
        - Tone: Pintopay is elite, fast, and borderless.
        - Earnings: Invite friends to earn up to 30% on card fees and 0.5% on top-ups.
        - Support: We resolve issues fast. If technical, provide details.
        """
        
        tov_info = ""
        gs_info = ""
        best_category = "General"

        # 2. Fetch from Cache (Fast Path)
        kb_data = await self._get_cached_kb()
        
        if kb_data:
            tov_info = kb_data.get("tov", "")
            records = kb_data.get("qa", [])
            
            if records:
                # #comment: Optimized linear search for high concurrency
                # Operating on in-memory list (fast) instead of making external API calls
                query_words = set(query.lower().split())
                
                # Rank matches by keyword overlap
                scored_matches = []
                for r in records:
                    q_text = str(r.get('Question', '')).lower()
                    a_text = str(r.get('Answer', '')).lower()
                    
                    # Simple scoring: count how many query words appear in the Question
                    score = sum(1 for word in query_words if word in q_text)
                    if score > 0:
                        # Append tuple: (score, formatted_text, category)
                        scored_matches.append((score, f"Q: {r.get('Question')}\nA: {r.get('Answer')}", r.get('Category', 'General')))
                
                # Sort by score descending
                scored_matches.sort(key=lambda x: x[0], reverse=True)
                
                # Take top 3
                top_matches = scored_matches[:3]
                matches = [m[1] for m in top_matches]
                
                # #comment: Auto-detect category from the highest scoring match
                if top_matches:
                    best_category = top_matches[0][2] # Get category from first match

                if matches:
                    gs_info = "\n\n".join(matches)
                else:
                    # Fallback if no specific match
                    gs_info = "No specific match found in KB. Use general knowledge."
                    best_category = "General"

        return f"CORE RULES:\n{core_info}\n\nTONE OF VOICE & SPECIFIC RULES:\n{tov_info}\n\nKNOWLEDGE BASE MATCHES:\n{gs_info}", best_category
        


    async def save_conversation_to_sheets(self, user_id: str):
        """Saves the entire session history to the specific History tab (GID) in a structured block format."""
        session = await self.get_session(user_id)
        if not session.get("history"):
            return

        chat_session_id = f"SID-{user_id}-{int(datetime.utcnow().timestamp())}"
        
        if self.gs_client:
            try:
                sheet_id = os.getenv("SUPPORT_SPREADSHEET_ID")
                history_gid = os.getenv("HISTORY_GID")
                
                if sheet_id and history_gid:
                    spreadsheet = self.gs_client.open_by_key(sheet_id)
                    sheet = spreadsheet.get_worksheet_by_id(int(history_gid))
                    
                    if sheet:
                        rows = []
                        category = session.get("category", "General")
                        metadata = session.get("user_metadata", {})
                        
                        # #comment: Calculate Metrics
                        start_time = datetime.fromisoformat(session["created_at"])
                        end_time = datetime.utcnow()
                        duration_sec = int((end_time - start_time).total_seconds())
                        total_cost = session.get("total_cost", 0.0)
                        msg_count = len(session["history"])
                        
                        # #comment: Construct "Session Block" Header with detailed metrics
                        # Format: [Session ID] [Date] [Category] [User Info] [User ID] [Duration(s)] [Cost($)] [Msg Count] [Level]
                        
                        header_row = [
                            f"IDs: {chat_session_id}",
                            start_time.strftime("%Y-%m-%d %H:%M:%S"),
                            category,
                            f"@{metadata.get('username','N/A')}",
                            str(user_id),
                            f"{duration_sec}s",
                            f"${total_cost:.5f}",
                            f"{msg_count} msgs",
                            f"Lvl {metadata.get('level', 1)}"
                        ]
                        
                        rows.append(header_row)
                        
                        # #comment: Add individual message rows
                        for entry in session["history"]:
                            # Format: [Time] [Role] [Content] [Cost (visible only for assistant)]
                            cost_str = f"${entry.get('cost', 0):.5f}" if entry.get("cost") else ""
                            rows.append([
                                "", # Indent
                                entry.get("timestamp", datetime.utcnow().isoformat()),
                                entry["role"].upper(),
                                entry["content"],
                                "",
                                "",
                                cost_str # Metric column alignment
                            ])
                        
                        # #comment: Add a separator row for visual clarity
                        rows.append(["-" * 20, "-" * 20, "-" * 20, "-" * 20, "-" * 20])
                        rows.append([]) # Empty row
                        
                        sheet.append_rows(rows)
                        logger.info(f"✅ Saved support history block for {user_id}.")
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
