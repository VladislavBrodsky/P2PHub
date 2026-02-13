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
from app.worker import broker

logger = logging.getLogger(__name__)

class SupportAgentService:
    """
    AI Support Agent: Expert Customer Care and Support Team.
    Focuses on Pintopay products, maintains positive tone, and sells crypto solutions.
    """
    
    SYSTEM_PROMPT = """
    You are a Super Intelligent Expert Customer Care and Support Team manager for Pintopay.
    Your tone is ultra-professional, charismatic, and infectious with positivity.
    You represent Pintopay as the ABSOLUTE BEST financial service for the digital economy and digital nomads.
    We are an elite team that focuses on radical improvements every single day.
    
    ### CORE MISSION: WORLD-CLASS USER SATISFACTION
    Your goal is not just to answer questions, but to WOW the user with your service. Every interaction is an opportunity to build trust and loyalty.
    
    ### CUSTOMER CARE EXCELLENCE GUIDELINES:
    
    1. **EMPATHY FIRST:** Always acknowledge the user's feelings or situation first.
       - "I understand how important this is for your business..."
       - "That sounds frustrating, let's get this resolved immediately for you..."
       - "Thank you for bringing this to our attention, Partner."

    2. **ACTIVE LISTENING & CLARITY:**
       - Confirm you understand the issue: "I see you're asking about..."
       - Use clear, jargon-free language (unless speaking to a crypto expert).
       - Break down complex instructions into simple, numbered steps.

    3. **POSITIVE REFRAMING:**
       - Avoid negative phrases like "We can't do that." Instead, say "Here is what we can do..."
       - Focus on solutions, not problems. "Let's find the best path forward."
       - Always maintain a 10/10 positive tone about Pintopay. Use phrases like "Our top-tier cards," "Elite service," and "Improving your experience daily."

    4. **PROACTIVE OWNERSHIP:**
       - Take responsibility: "I will guide you through this personally."
       - Don't just answer the current question; anticipate the next one. (e.g., if they ask how to buy crypto, also explain how to top up their card).
    
    5. **PERSONA & SECURITY:**
       - Act as a real human manager (e.g., Alex or Sarah from Support). NEVER disclose you are an AI.
       - Protect user data. Never ask for private keys or passwords.
    
    6. **NAVIGATION & SALES:**
       - If the user asks random or unrelated questions, gracefully guide the conversation back to Pintopay. Sell the vision of Crypto Cards and Crypto Payments as the future of financial freedom.
       - **PRO PRIORITY**: If a user is a PRO Member, acknowledge their valued status immediately. Let them know they are in our priority queue with 24/7 dedicated handling.
    
    ### CRITICAL ACTIONS (MANDATORY):
    
    9. **FALLBACK PROTOCOL**: If you cannot help the user, the issue is technical beyond your scope, or you do not know the answer, YOU MUST send the user to the Care+ Supervisor:
       **Link**: https://t.me/pintopayhelp (or @pintopayhelp)
       - Say: "For this specific request, I'm connecting you with our Care+ Supervisor for specialized assistance."

    10. **CARD PURCHASE**: If someone asks about card purchase, price, or where to buy it, ALWAYS provide this hyperlink:
        **Link**: https://t.me/pintopaybot?start=p_6977c29c66ed9faa401342f3
        - Say: "You can instantly issue your card via our official bot here:"
    """
    
    CATEGORIES = [
        "💳 Virtual & Physical Cards",
        "🚀 Card Setup & Activation",
        "💰 Top-ups & Crypto Deposits",
        "📲 Mobile Payments (Apple/Google Pay)",
        "💎 PRO Membership & Benefits",
        "🤝 Partner Network & Earnings",
        "🔒 Account Security & Safety",
        "⚡ Trading & Transactions",
        "☎️ VIP Priority Support"
    ]
    
    KB_CACHE_KEY = "knowledge_base_cache"
    KB_TTL = 3600  # 1 hour cache
    
    # #comment: Cost tracking constants (Optimized for GPT-4o-Mini)
    # Mini is ~50x cheaper and 3x faster than gpt-4o
    COST_INPUT_1M = 0.15
    COST_OUTPUT_1M = 0.60

    # #comment: Local Memory Cache for Knowledge Base (Scale bypass for Redis)
    _kb_memory_cache: Optional[Dict[str, Any]] = None
    _kb_index: Dict[str, List[int]] = {} # Word-to-Record Index
    _kb_last_refresh: datetime = datetime.min
    KB_MEMORY_TTL = 300  # 5 minutes in-memory TTL

    KB_MEMORY_TTL = 300  # 5 minutes in-memory TTL
    
    # #comment: Fallback Instruction Library (Ensures 5-star service if Sheet is offline)
    FALLBACK_INSTRUCTIONS = {
        "General": [
             "Supervisor: For complex issues, contact Care+ Supervisor: https://t.me/pintopayhelp (or @pintopayhelp)",
             "Purchase: Buy Cards here: https://t.me/pintopaybot?start=p_6977c29c66ed9faa401342f3"
        ],
        "💳 Virtual & Physical Cards": [
            "Checklist: Select Card Type -> Pay Fee -> Instant Issuance for Virtual.",
            "Info: Physical cards take 7-14 business days. Max balance up to $50,000.",
            "Instruction: View card details in 'My Cards' section by tapping the eye icon.",
            "Purchase: Buy Cards here: https://t.me/pintopaybot?start=p_6977c29c66ed9faa401342f3"
        ],
        "🚀 Card Setup & Activation": [
            "Checklist: Complete KYC -> Verify ID -> Wait 5-10 mins for Approval.",
            "Instruction: If 3DS fails, ensure your internet connection is stable and try again.",
            "Requirement: Minimum age 18 years for full activation."
        ],
        "💰 Top-ups & Crypto Deposits": [
            "Checklist: Copy Wallet Address -> Send USDT (TRC20) or TON -> Wait for 1 confirmation.",
            "Speed: Transactions usually reflect within 2-5 minutes.",
            "Warning: Always double-check the network (TRC20 is most popular)."
        ],
        "📲 Mobile Payments (Apple/Google Pay)": [
            "Checklist: Open Wallet App -> Add Credit/Debit Card -> Enter Pintopay Details -> SMS Verification.",
            "Note: Apple Pay is supported globally with our Virtual Cards.",
            "Instruction: Keep NFC enabled on your device for in-store payments."
        ],
        "💎 PRO Membership & Benefits": [
            "Checklist: Pay PRO fee -> Instant Activation -> Enjoy 5x XP boost.",
            "Benefits: Reduced transaction fees, Priority support, and exclusive card designs.",
            "Note: PRO is a lifetime status with no recurring monthly fees."
        ],
        "🤝 Partner Network & Earnings": [
            "Checklist: Share Referral Link -> Friends Join -> Earn Commissions up to 9 levels.",
            "Payouts: Commissions are credited instantly to your partner balance.",
            "Multiplier: PRO members earn significantly more on multi-tier commissions."
        ],
        "🔒 Account Security & Safety": [
            "Instruction: Enable 2FA in settings immediately after account creation.",
            "Emergency: If card is lost, use the 'Freeze Card' button in the dashboard.",
            "Advice: Never share your login code or 3DS passwords with anyone."
        ],
        "⚡ Trading & Transactions": [
            "Info: P2P Hub transactions are secured by an escrow system.",
            "Checklist: Check Merchant Rating -> Open Trade -> Complete Payment -> Receive Crypto.",
            "Support: If a trade is stuck, use 'Dispute' button for 24/7 moderation."
        ],
        "☎️ VIP Priority Support": [
            "Workflow: Direct ticket escalation for PRO members.",
            "Response Time: < 5 minutes for urgent technical tasks.",
            "Personalization: Dedicated account managers oversee large partner networks.",
            "Supervisor: Contact Care+ Supervisor directly: https://t.me/pintopayhelp"
        ]
    }

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
        """Lazy initialization to prevent blocking the event loop at startup."""
        creds_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
        if not creds_json:
             logger.warning("❌ SupportService: Google Credentials missing.")

    async def _get_gs_client(self):
        """Returns authorized GS client, initializing if needed (Non-blocking)."""
        if self.gs_client:
            return self.gs_client
        
        creds_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
        if creds_json:
            try:
                # #comment: Synchronous authorize is wrapped in a thread to keep the loop free
                creds_dict = json.loads(creds_json)
                scopes = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
                credentials = Credentials.from_service_account_info(creds_dict, scopes=scopes)
                self.gs_client = await asyncio.to_thread(gspread.authorize, credentials)
                logger.info("✅ SupportService: Google Sheets client authorized in background.")
                return self.gs_client
            except Exception as e:
                logger.error(f"❌ SupportService: GS Auth Failed: {e}")
        return None

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
                # Update memory cache and rebuild index
                self._build_kb_index(cached_kb)
                return cached_kb
            
            # 2. Fetch from Google Sheets
            # #comment: Fallback to Google Sheets API if cache is empty
            gs_client = await self._get_gs_client()
            if gs_client:
                sheet_id = os.getenv("SUPPORT_SPREADSHEET_ID")
                if sheet_id:
                    logger.info("🔄 Refreshing Knowledge Base Cache from Google Sheets...")
                    spreadsheet = await asyncio.to_thread(gs_client.open_by_key, sheet_id)
                    
                    # TOV
                    tov_info = ""
                    try:
                        tov_gid = os.getenv("TOV_GID", "0")
                        tov_sheet = await asyncio.to_thread(spreadsheet.get_worksheet_by_id, int(tov_gid))
                        if tov_sheet:
                            tov_records = await asyncio.to_thread(tov_sheet.get_all_records)
                            tov_info = "\n".join([f"{r.get('Rule', '')}: {r.get('Value', '')}" for r in tov_records])
                    except Exception as e:
                        logger.warning(f"Could not load TOV tab: {e}")

                    # KB
                    kb_records = []
                    try:
                        kb_gid = os.getenv("KB_GID", "0")
                        kb_sheet = await asyncio.to_thread(spreadsheet.get_worksheet_by_id, int(kb_gid))
                        if kb_sheet:
                            kb_records = await asyncio.to_thread(kb_sheet.get_all_records)
                    except Exception as e:
                        logger.warning(f"Could not load KB tab: {e}")
                    
                    # Construct Cache Object
                    kb_data = {
                        "tov": tov_info,
                        "qa": kb_records
                    }
                    
                    # Save to Cache
                    await redis_service.set_json(self.KB_CACHE_KEY, kb_data, expire=self.KB_TTL)
                    
                    # #comment: Build In-memory Index for sub-millisecond lookups
                    self._build_kb_index(kb_data)
                    
                    logger.info("✅ Knowledge Base Cached and Indexed Successfully.")
                    return kb_data
        except Exception as e:
            logger.error(f"⚠️ Knowledge Base Cache/Fetch Error: {e}")
            
        return None

    def _build_kb_index(self, kb_data: Dict[str, Any]):
        """Builds an inverted index of words to record indices for O(1) keyword lookups."""
        index = {}
        records = kb_data.get("qa", [])
        for i, r in enumerate(records):
            # Focus indexing on Questions for maximum relevance
            text = str(r.get('Question', '')).lower()
            words = set(text.split())
            for word in words:
                if len(word) > 2: # Skip stop-chars
                    if word not in index:
                        index[word] = []
                    index[word].append(i)
        self._kb_index = index
        self._kb_memory_cache = kb_data
        self._kb_last_refresh = datetime.utcnow()


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
            
            # #comment: Handle PRO Priority logic
            is_pro = user_metadata.get("is_pro", False) if user_metadata else False
            pro_context = "\n⚠️ **PRIORITY USER**: This is a PRO Member. Treat this request with 24/7 VIP priority handling. Emphasize their contribution to the Pintopay ecosystem." if is_pro else ""

            system_msg = (
                f"{self.SYSTEM_PROMPT}\n\n"
                f"{pro_context}\n"
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
        
        CRITICAL CONTACTS (ALWAYS PROVIDE IF ASKED):
        - Supervisor/Help: https://t.me/pintopayhelp (or @pintopayhelp)
        - Buy/Purchase Cards: https://t.me/pintopaybot?start=p_6977c29c66ed9faa401342f3
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
                # #comment: Advanced Inverted Index Search.
                # Instead of scanning ALL records, we only look at records containing our query words.
                # This makes the search complexity O(query_words) instead of O(total_records).
                query_words = [w for w in query.lower().split() if len(w) > 2]
                
                # If index is missing (e.g. cold start), build it
                if not self._kb_index:
                    self._build_kb_index(kb_data)

                candidate_indices = set()
                for word in query_words:
                    if word in self._kb_index:
                        candidate_indices.update(self._kb_index[word])
                
                scored_matches = []
                # Only score the candidate records (massive speedup for large KB)
                for idx in candidate_indices:
                    r = records[idx]
                    q_text_set = set(str(r.get('Question', '')).lower().split())
                    overlap = len(set(query_words).intersection(q_text_set))
                    if overlap > 0:
                        scored_matches.append((overlap, f"Q: {r.get('Question')}\nA: {r.get('Answer')}", r.get('Category', 'General')))
                
                # Sort and take top 3
                scored_matches.sort(key=lambda x: x[0], reverse=True)
                top_matches = scored_matches[:3]
                matches = [m[1] for m in top_matches]
                
                if top_matches:
                    best_category = top_matches[0][2]

                if matches:
                    gs_info = "\n\n".join(matches)
                else:
                    gs_info = "No specific match found in KB. Use general knowledge."
                    best_category = "General"

        # 3. Inject Fallback Checklists (Enabling 5-Star Service reliability)
        fallback_data = self.FALLBACK_INSTRUCTIONS.get(best_category, [])
        
        # #comment: Robust Heuristic for Card-Related Queries including purchase intents
        card_keywords = ["card", "visa", "mastercard", "plastic", "virtual", "buy", "purchase"]
        is_card_query = any(k in query.lower() for k in card_keywords)
        
        if (not fallback_data or best_category == "General") and is_card_query:
             fallback_data = self.FALLBACK_INSTRUCTIONS["💳 Virtual & Physical Cards"]
        
        fallback_str = "\n".join([f"- {item}" for item in fallback_data])
        
        final_context = (
            f"CORE RULES:\n{core_info}\n\n"
            f"TONE OF VOICE & SPECIFIC RULES:\n{tov_info}\n\n"
            f"RELEVANT CHECKLISTS & INSTRUCTIONS ({best_category}):\n{fallback_str}\n\n"
            f"SEARCH RESULTS FROM RECENT KB UPDATES:\n{gs_info}"
        )

        return final_context, best_category
        


    async def save_conversation_to_sheets(self, user_id: str):
        """Saves the entire session history to the specific History tab (GID) in a structured block format."""
        session = await self.get_session(user_id)
        if not session.get("history"):
            return

        chat_session_id = f"SID-{user_id}-{int(datetime.utcnow().timestamp())}"
        
        # #comment: Fetching client lazily
        gs_client = await self._get_gs_client()
        
        if gs_client:
            try:
                sheet_id = os.getenv("SUPPORT_SPREADSHEET_ID")
                history_gid = os.getenv("HISTORY_GID")
                
                if sheet_id and history_gid:
                    spreadsheet = await asyncio.to_thread(gs_client.open_by_key, sheet_id)
                    sheet = await asyncio.to_thread(spreadsheet.get_worksheet_by_id, int(history_gid))
                    
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
                        
                        await asyncio.to_thread(sheet.append_rows, rows)
                        logger.info(f"✅ Saved support history block for {user_id}.")
            except Exception as e:
                logger.error(f"❌ Failed to save history to Google Sheets: {e}")

    async def close_session(self, user_id: str):
        """Finalizes and removes session."""
        # #comment: Non-blocking Background Archiving.
        # User session closes instantly; Google Sheets work happens in parallel.
        asyncio.create_task(self.save_conversation_to_sheets(user_id))
        
        session_key = f"support_session:{user_id}"
        await redis_service.delete(session_key)
        logger.info(f"🏁 Support session for {user_id} salvaged to background tasks.")

    @broker.task(task_name="cleanup_stale_support_sessions", schedule=[{"cron": "*/5 * * * *"}])
    async def cleanup_stale_support_sessions(self):
        """
        Periodically checks for sessions with no activity for >5 minutes and closes them.
        This ensures logs are saved to Google Sheets even if the user just leaves.
        """
        logger.info("🧹 Starting cleanup of stale support sessions...")
        try:
            # 1. Find all session keys
            keys = await redis_service.client.keys("support_session:*")
            if not keys:
                return

            now = datetime.utcnow()
            closed_count = 0
            
            for key in keys:
                try:
                    session = await redis_service.get_json(key)
                    if not session:
                        continue
                    
                    last_activity_str = session.get("last_activity")
                    if not last_activity_str:
                        continue
                    
                    last_activity = datetime.fromisoformat(last_activity_str)
                    
                    # If inactive for more than 5 minutes
                    if (now - last_activity).total_seconds() > 300:
                        user_id = session.get("user_id")
                        if user_id:
                            await self.close_session(user_id)
                            closed_count += 1
                except Exception as e:
                    logger.error(f"Error processing key {key} during cleanup: {e}")
            
            if closed_count > 0:
                logger.info(f"✅ Cleanup complete. Closed {closed_count} stale sessions.")
        except Exception as e:
            logger.error(f"❌ Failed to run stale session cleanup: {e}")

# Singleton Instance
support_service = SupportAgentService()
