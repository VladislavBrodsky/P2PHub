import logging
import json
import os
import secrets
from datetime import datetime
from typing import Dict, List, Optional, Any

import google.generativeai as genai
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
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        
        # Initialize Gemini 1.5 Pro for content assistance
        if os.getenv("GOOGLE_API_KEY"):
            genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
            self.gemini_model = genai.GenerativeModel('gemini-1.5-pro')
            # Initialize Gemini GenAI Client for Imagen 3
            self.genai_client = google_genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
        else:
            self.gemini_model = None
            self.genai_client = None
            logger.warning("⚠️ Google API Key for Gemini/Imagen missing.")

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
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            content = json.loads(response.choices[0].message.content)
            image_prompt = content.get("image_description")
            
            # 2. Generate Image via Gemini (Imagen 3)
            image_url = None
            if self.genai_client:
                try:
                    # Use Imagen 3 for premium quality
                    img_response = self.genai_client.models.generate_image(
                        model='imagen-3.0-generate-001',
                        prompt=image_prompt,
                        config=genai_types.GenerateImageConfig(
                            number_of_images=1,
                            include_rai_reasoning=True,
                            output_mime_type='image/png'
                        )
                    )
                    
                    if img_response.generated_images:
                        image = img_response.generated_images[0]
                        filename = f"viral_{partner.id}_{secrets.token_hex(4)}.png"
                        # Save to our served images directory
                        save_path = os.path.join("app_images", "generated", filename)
                        
                        # Ensure directory exists (fallback)
                        os.makedirs(os.path.dirname(save_path), exist_ok=True)
                        
                        image.image.save(save_path)
                        image_url = f"/images/generated/{filename}"
                except Exception as img_err:
                    logger.error(f"Imagen generation failed, falling back to prompt only: {img_err}")

            return {
                "text": content.get("body"),
                "title": content.get("title"),
                "hashtags": content.get("hashtags"),
                "image_prompt": image_prompt,
                "image_url": image_url,
                "status": "success"
            }

        except Exception as e:
            logger.error(f"Error in viral generation: {e}")
            return {"error": str(e)}

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
