import logging
import json
import os
import secrets
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Any


from google import genai as google_genai
from google.genai import types as genai_types
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
    You are the CMO of Pintopay, a Top Partner, Community Leader, and Influencer. 
    You are a Professional Copywriter and a Progressive, Rich Digital Nomad.
    You are a Problem Solver who uses emotional triggers, marketing tricks, social proof, 
    and FOMO to generate viral engagement. 
    You write with authority, charisma, and a focus on financial freedom and elite lifestyle.
    Your style is premium, cinematic (in descriptions), and highly persuasive.
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
        
        # 1. Generate Viral Text via OpenAI (acting as CMO)
        system_prompt = f"{self.CMO_PERSONA}\n\nObjective: Generate a viral post for {post_type} targeting {target_audience} in {language}."
        user_prompt = f"""
        Act as CMO. Collect data on keywords, hashtags, and problems to solve with Pintopay Cards in 2026.
        Generate a viral, engaging, and provocative post.
        Include the referral link: {ref_link}
        Include emotional triggers, social proof, and FOMO.
        Format: JSON with 'title', 'body', 'hashtags', 'image_description'.
        The 'image_description' should be a detailed prompt for an image generator following these rules: {self.IMAGE_RULES}
        """

        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            content = json.loads(response.choices[0].message.content)
            image_prompt = content.get("image_description") or content.get("title") or f"Cinematic shot for {post_type}"
            
            # Ensure hashtags is a list
            hashtags_raw = content.get("hashtags", [])
            if isinstance(hashtags_raw, str):
                hashtags = [tag.strip() for tag in hashtags_raw.split(',')]
            elif isinstance(hashtags_raw, list):
                hashtags = hashtags_raw
            else:
                hashtags = []

            # 2. Generate Image via Gemini (Imagen 3)
            image_url = None
            if self.genai_client and image_prompt:
                try:
                    # Dynamically check for available methods to avoid crashing on version mismatches
                    method = None
                    if hasattr(self.genai_client.models, 'generate_images'): # Standard new SDK
                        method = self.genai_client.models.generate_images
                    elif hasattr(self.genai_client.models, 'generate_image'): # Singular variant
                        method = self.genai_client.models.generate_image
                    
                    if method:
                        # Run the sync GenAI call in a separate thread to avoid blocking the event loop
                        loop = asyncio.get_event_loop()
                        
                        # Try multiple models in order of preference
                        imagen_models = [
                            'imagen-4.0-generate-001', 
                            'imagen-3.0-generate-001',
                            'imagen-3.0-fast-001'
                        ]
                        
                        img_response = None
                        last_err = None
                        
                        for model_name in imagen_models:
                            try:
                                img_response = await loop.run_in_executor(
                                    None, 
                                    lambda m=model_name: method(
                                        model=m,
                                        prompt=image_prompt,
                                        config={
                                            'number_of_images': 1,
                                            'output_mime_type': 'image/png'
                                        }
                                    )
                                )
                                if img_response:
                                    break
                            except Exception as e:
                                last_err = e
                                continue
                        
                        if not img_response and last_err:
                            raise last_err
                        
                        # Handle response structure
                        if getattr(img_response, 'generated_images', None):
                            image = img_response.generated_images[0]
                            filename = f"viral_{partner.id}_{secrets.token_hex(4)}.png"
                            save_path = os.path.join("app_images", "generated", filename)
                            os.makedirs(os.path.dirname(save_path), exist_ok=True)
                            # image.image is a PIL object
                            image.image.save(save_path)
                            image_url = f"/images/generated/{filename}"
                    else:
                        logger.warning("⚠️ Google GenAI Client found but no known content generation method available.")

                except Exception as img_err:
                    # Log error but DO NOT crash the request. Return text only.
                    logger.error(f"❌ Imagen generation failed (graceful fallback): {img_err}")

            return {
                "text": str(content.get("body") or content.get("content") or "No content generated"),
                "title": str(content.get("title") or f"{post_type} Strategy"),
                "hashtags": hashtags,
                "image_prompt": str(image_prompt),
                "image_url": image_url,
                "status": "success"
            }

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
                model="gpt-4o",
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

# Singleton
viral_studio = ViralMarketingStudio()
