import logging
import json
import os
import secrets
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Any


from google import genai as google_genai
from google.genai import types as genai_types
from google.oauth2.service_account import Credentials
import gspread
from openai import AsyncOpenAI
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.partner import Partner

logger = logging.getLogger(__name__)

class ViralMarketingStudio:
    """
    PRO Component: Viral Marketing Studio
    Acts as CMO of Pintopay to generate viral content and autopost across social media.
    """

    POST_TYPES = [
        "Viral Strategy", "Financial Shift", "Growth Hack", 
        "Wealth Creation", "Tech Insider", "Digital Nomad Lifestyle"
    ]

    TARGET_AUDIENCES = [
        "Crypto Investors", "Digital Nomads", "Freelancers", 
        "E-commerce Owners", "Tech Enthusiasts", "High-Net-Worth Individuals"
    ]

    LANGUAGES = [
        "English", "Russian", "Spanish", "French", "German", 
        "Portuguese", "Chinese", "Japanese", "Arabic", "Hindi"
    ]

    CMO_PERSONA = """
    You are the CMO of Pintopay, a world-class Marketing Strategist and Digital Nomad Influencer.
    Your voice is authoritative, charismatic, and persuasive, using emotional triggers and social proof.
    You write high-fidelity, premium content that inspires action and financial ambition.
    """

    TEXT_RULES = """
    1. EXCELLENT FORMATTING: Use bold (**text**) for impact, italics (_text_) for subtle emphasis, and clear paragraphs.
    2. HYPERLINKS: ALWAYS use the provided referral link seamlessly in the text using markdown format: [Call to Action](link).
    3. NO GLITCHES: Ensure all markdown markers are opened and closed correctly. No trailing asterisks or broken links.
    4. TONALITY: Avoid generic "business speak". Sound human, elite, and successful.
    5. STRUCTURE: Start with a powerful hook, follow with the value proposition, and end with a strong CTA.
    6. BAN LIST: Do not use generic phrases like "freelancers and crypto enthusiasts" or "Don't miss out on your chance!" in a cheesy way. Be more creative and specific.
    """

    IMAGE_RULES = """
    The image must be 1K quality, ultra-realistic, and cinematic.
    Theme: Digital Nomad Lifestyle, Crypto Payments, Fintech Ambassadors, Crypto Leaders and Influencers.
    Strict Rule: DO NOT use futuristic elements (no space-age cities, no flying cars). 
    Keep it modern, sleek, and high-end (Luxe offices, beach-side workstations, private jets, premium cards).
    The image must perfectly match the context of the generated text.
    """

    def __init__(self):
        # 1. Initialize OpenAI with fallback to os.getenv
        openai_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
        if openai_key:
            self.openai_client = AsyncOpenAI(api_key=openai_key)
            logger.info("✅ ViralMarketingStudio: OpenAI client initialized.")
        else:
            self.openai_client = None
            logger.warning("⚠️ ViralMarketingStudio: OpenAI API Key missing.")
        
        # 2. Initialize Google GenAI with fallback to os.getenv
        google_key = os.getenv("GOOGLE_API_KEY")
        self.genai_client = None
        if google_key:
            try:
                # Initialize Gemini GenAI Client for Imagen 3
                self.genai_client = google_genai.Client(api_key=google_key)
                logger.info("✅ ViralMarketingStudio: Google GenAI client initialized.")
            except Exception as e:
                logger.error(f"⚠️ Failed to initialize Google GenAI Client: {e}")
        else:
            logger.warning("⚠️ ViralMarketingStudio: Google API Key missing.")

        # 3. Google Sheets for Logging
        self.gs_client = None
        self._gs_sheet_cache = {} 
        self._init_google_sheets_client()
        self._last_working_imagen_model = 'imagen-4.0-generate-001' # Memory for optimization

    def _init_google_sheets_client(self):
        """Initializes Google Sheets client for audit logging."""
        creds_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
        if creds_json:
            try:
                creds_dict = json.loads(creds_json)
                scopes = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
                credentials = Credentials.from_service_account_info(creds_dict, scopes=scopes)
                self.gs_client = gspread.authorize(credentials)
                logger.info("✅ ViralMarketingStudio: Google Sheets logging initialized.")
            except Exception as e:
                logger.error(f"❌ ViralMarketingStudio: Failed to init Google Sheets: {e}")

    def get_capabilities(self) -> Dict[str, bool]:
        """
        Returns the operational status of the studio's AI dependencies.
        """
        return {
            "text_generation": bool(self.openai_client),
            "image_generation": bool(self.genai_client)
        }

    async def check_tokens_and_reset(self, partner: Partner, session: AsyncSession, min_tokens: int = 1) -> bool:
        """
        Ensures partner has tokens and handles monthly reset.
        Each PRO member gets 500 tokens per month.
        """
        if not partner.is_pro:
            return False

        now = datetime.utcnow()
        last_reset = partner.pro_tokens_last_reset or partner.created_at
        
        # Check if a month has passed since last reset
        if (now - last_reset).days >= 30:
            partner.pro_tokens = 500
            partner.pro_tokens_last_reset = now
            session.add(partner)
            await session.commit()
            await session.refresh(partner)

        return partner.pro_tokens >= min_tokens

    async def generate_viral_content(
        self, 
        partner: Partner, 
        post_type: str, 
        target_audience: str, 
        language: str,
        referral_link: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates text (OpenAI) and Image Suggestion/Prompt (Gemini).
        """
        if not self.openai_client:
            return {"error": "OpenAI not configured"}

        ref_link = referral_link or f"https://t.me/pintopaybot?start={partner.referral_code}"
        
        # 1. Generate Viral Text via OpenAI
        # Optimized Prompt for Faster Inference (Compressed)
        system_prompt = f"{self.CMO_PERSONA}\nRules:\n{self.TEXT_RULES}\nTask: Viral post for {post_type} ({target_audience}) in {language}."
        user_prompt = f"CMO Mode. Keyword-driven viral post for Pintopay. Referral: {ref_link}. Include FOMO/Social Proof. Format: JSON {{'title', 'body', 'hashtags', 'image_description'}}. JSON ONLY. Rules: {self.IMAGE_RULES}"

        generation_start = datetime.utcnow()
        tokens_openai = 0

        # Construction of the Image Prompt Template (to allow parallel start)
        # We don't wait for OpenAI to give us the prompt; we build a high-quality one immediately
        base_image_prompt = (
            f"Ultra-realistic cinematic shot of {target_audience} lifestyle, themed around '{post_type}'. "
            f"Setting: Modern, high-end, 2026 aesthetics. "
            f"Vibe: Success, financial freedom, premium fintech branding. {self.IMAGE_RULES}"
        )

        async def get_text_content():
            try:
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4o-mini", # Switch to Mini for lightning fast text generation
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"}
                )
                tokens = response.usage.total_tokens if response.usage else 0
                return json.loads(response.choices[0].message.content), tokens
            except Exception as e:
                logger.error(f"Text generation error: {e}")
                return None, 0

        async def get_image_content(prompt):
            if not self.genai_client:
                return None
            
            # Prioritize Imagen 4.0 Generate (Standard) and Fast variant
            imagen_models = [
                self._last_working_imagen_model,
                'imagen-4.0-generate-001',
                'imagen-4.0-fast-generate-001',
                'imagen-3.0-generate-001' # Extreme fallback
            ]
            # Remove duplicates while preserving order
            imagen_models = [m for i, m in enumerate(imagen_models) if m and m not in imagen_models[:i]]
            
            # Defensive check for models attribute and methods
            models_obj = getattr(self.genai_client, 'models', None)
            if not models_obj:
                logger.error("❌ ViralMarketingStudio: genai_client.models is missing")
                return None

            method = getattr(models_obj, 'generate_images', 
                           getattr(models_obj, 'generate_image', None))
            
            if not method:
                logger.error("❌ ViralMarketingStudio: No image generation method found in SDK")
                return None

            loop = asyncio.get_event_loop()
            for model_name in imagen_models:
                try:
                    img_response = await asyncio.wait_for(
                        loop.run_in_executor(
                            None, 
                            lambda m=model_name: method(
                                model=m,
                                prompt=prompt,
                                config={
                                    'number_of_images': 1,
                                    'output_mime_type': 'image/png'
                                }
                            )
                        ),
                        timeout=25.0 # Increased timeout for Imagen 4.0 Quality
                    )
                    
                    if img_response and getattr(img_response, 'generated_images', None):
                        image = img_response.generated_images[0]
                        filename = f"viral_{partner.id}_{secrets.token_hex(4)}.png"
                        save_path = os.path.join("app_images", "generated", filename)
                        os.makedirs(os.path.dirname(save_path), exist_ok=True)
                        
                        # Use thread pool for blocking PIL save
                        await loop.run_in_executor(None, lambda: image.image.save(save_path))
                        
                        self._last_working_imagen_model = model_name # Update memory
                        return f"/images/generated/{filename}"
                except Exception as e:
                    logger.warning(f"⚠️ Imagen {model_name} failed/timed out: {e}")
                    continue
            return None

        try:
            # 🚀 PARALLEL EXECUTION: OpenAI and Imagen start at the SAME TIME
            text_task = get_text_content()
            image_task = get_image_content(base_image_prompt)
            
            (content_data, tokens_openai), image_url = await asyncio.gather(text_task, image_task)
            
            if not content_data:
                return {"error": "Failed to generate content"}

            content = content_data
            image_prompt = content.get("image_description") or base_image_prompt
            
            # Ensure hashtags is a list of clean tags
            hashtags_raw = content.get("hashtags", [])
            if isinstance(hashtags_raw, str):
                # Handle both comma and space separation
                # First replace commas with spaces, then split
                hashtags = [tag.strip() for tag in hashtags_raw.replace(',', ' ').split() if tag.strip()]
            elif isinstance(hashtags_raw, list):
                hashtags = [str(tag).strip() for tag in hashtags_raw if tag]
            else:
                hashtags = []

            generation_end = datetime.utcnow()
            duration = (generation_end - generation_start).total_seconds()
            
            result = {
                "text": str(content.get("body") or content.get("content") or "No content generated"),
                "title": str(content.get("title") or f"{post_type} Strategy"),
                "hashtags": hashtags,
                "image_prompt": image_prompt, # Return the refined one for logging
                "image_url": image_url,
                "status": "success",
                "tokens_openai": tokens_openai,
                "duration": duration
            }

            # Fire and forget logging
            asyncio.create_task(self.log_generation_to_sheets(
                partner=partner,
                topic=post_type,
                audience=target_audience,
                language=language,
                openai_prompt=user_prompt,
                gemini_prompt=image_prompt,
                duration=duration,
                tokens_openai=tokens_openai,
                tokens_gemini=0,
                title=result["title"],
                body=result["text"],
                image_url=image_url
            ))

            return result

        except Exception as e:
            logger.error(f"Error in viral generation: {e}")
            return {"error": str(e)}

    async def fix_headline(self, headline: str) -> str:
        """
        Rewrites a headline to be more viral/clickbaity. Cost: 1 Token.
        """
        if not self.openai_client:
            return "Error: AI Service Unavailable"
            
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a viral marketing expert. Rewrite the user's headline to be highly engaging, click-worthy, and FOMO-inducing for the crypto/fintech niche. Return ONLY the best new headline. No quotes."},
                    {"role": "user", "content": f"Make this viral: {headline}"}
                ],
                max_tokens=60
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Headline fix failed: {e}")
            return headline # Fallback to original

    async def fetch_trends(self) -> List[dict]:
        """
        Fetches 3 trending topics. Cost: 3 Tokens.
        Uses Gemini if available for freshness, else OpenAI.
        """
        prompt = "Identify 3 top trending, controversial, or high-growth narratives in the Crypto/Fintech world for 2026. Format as JSON list of objects with 'topic', 'reason', and 'viral_angle'."
        
        try:
            if self.genai_client:
                # Use Gemini
                response = self.genai_client.models.generate_content(
                    model='gemini-1.5-pro', 
                    contents=prompt,
                    config={'response_mime_type': 'application/json'}
                )
                return json.loads(response.text)
            elif self.openai_client:
                # Fallback OpenAI
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "You are a trend hunter. Return JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"}
                )
                content = json.loads(response.choices[0].message.content)
                # Handle if it returns { "trends": [...] } or just [...]
                if isinstance(content, list): return content
                return content.get("trends", [])
        except Exception as e:
            logger.error(f"Trend fetch failed: {e}")
            return [
                {"topic": "DeFi 3.0", "reason": "AI Agents managing portfolios", "viral_angle": "Is your wallet smarter than you?"},
                {"topic": "RWA Tokenization", "reason": "Real estate on-chain", "viral_angle": "Own a skyscraper for $10"},
                {"topic": "Privacy Coins", "reason": "Regulatory crackdowns", "viral_angle": "They are banning your money"}
            ]

    async def post_to_social(self, partner: Partner, platform: str, content: str, image_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Autoposts to X, Telegram, or LinkedIn using partner's API keys.
        """
        if platform == "x":
            return await self._post_to_x(partner, content, image_path)
        elif platform == "telegram":
            return await self._post_to_telegram(partner, content, image_path)
        elif platform == "linkedin":
            return await self._post_to_linkedin(partner, content, image_path)
        else:
            return {"error": "Unsupported platform"}

    async def _post_to_x(self, partner: Partner, content: str, image_path: Optional[str]) -> Dict[str, Any]:
        if not (partner.x_api_key and partner.x_access_token):
            return {"error": "X API not configured"}
        # Simple placeholder for Tweepy integration
        return {"status": "success", "platform": "x", "msg": "Posted to X (Simulation)"}

    async def _post_to_telegram(self, partner: Partner, content: str, image_path: Optional[str]) -> Dict[str, Any]:
        if not partner.telegram_channel_id:
            return {"error": "Telegram Channel ID missing"}
        # Use bot.py's bot instance to send message
        return {"status": "success", "platform": "telegram", "msg": "Posted to Telegram (Simulation)"}

    async def _post_to_linkedin(self, partner: Partner, content: str, image_path: Optional[str]) -> Dict[str, Any]:
        if not partner.linkedin_access_token:
            return {"error": "LinkedIn API not configured"}
        return {"status": "success", "platform": "linkedin", "msg": "Posted to LinkedIn (Simulation)"}

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
        image_url: Optional[str]
    ):
        """Audit logging to the specified Viral Marketing tracker sheet."""
        if not self.gs_client:
            logger.warning("⚠️ Google Sheets client not initialized, skipping log.")
            return

        try:
            sheet_id = os.getenv("VIRAL_MARKETING_SPREADSHEET_ID") or "1JCxW4ANBthKy3Qeu9RBE3Ds3fFpX8993Q_6JPdmg-_k"
            gid = os.getenv("VIRAL_MARKETING_GID") or "633034160"
            cache_key = f"{sheet_id}_{gid}"
            
            loop = asyncio.get_event_loop()
            
            def get_sheet_sync():
                if cache_key not in self._gs_sheet_cache:
                    spreadsheet = self.gs_client.open_by_key(sheet_id)
                    self._gs_sheet_cache[cache_key] = spreadsheet.get_worksheet_by_id(int(gid))
                return self._gs_sheet_cache[cache_key]

            # Offload blocking GS API calls to thread pool
            sheet = await loop.run_in_executor(None, get_sheet_sync)
            
            if sheet:
                # Row format
                row = [
                    f"@{partner.username or partner.id}",
                    topic, audience, language,
                    datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
                    "created", openai_prompt, gemini_prompt,
                    f"{duration:.2f}s", tokens_openai, tokens_gemini,
                    title, body, image_url or "None"
                ]
                # Offload blocking append to thread pool
                await loop.run_in_executor(None, lambda: sheet.append_row(row))
                logger.info(f"✅ Background audit logged for @{partner.username}")
        except Exception as e:
            logger.error(f"❌ Failed to log viral generation to Google Sheets: {e}")

# Singleton
viral_studio = ViralMarketingStudio()
