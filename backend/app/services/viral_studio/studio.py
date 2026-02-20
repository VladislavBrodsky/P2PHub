import asyncio
import json
import logging
import os
import secrets
import email.utils
import re
from datetime import UTC, datetime, timedelta
from typing import Any

from google import genai as google_genai
from google.genai import types as genai_types
from sqlmodel.ext.asyncio.session import AsyncSession
from bs4 import BeautifulSoup
import httpx

from app.core.config import settings
from app.core.errors import ViralStudioErrorCode
from app.models.partner import Partner, ViralGeneration
from app.core.broker import broker

from . import constants, prompts, adapters, logging as viral_log

logger = logging.getLogger(__name__)

class ViralMarketingStudio:
    """
    Modularized CMO Agent / Viral Marketing Studio Orchestrator.
    Handles AI Content (Text/Image), Social Posting, and Market Intelligence.
    """

    def __init__(self):
        self.openai_client = None
        self.genai_client = None
        self._last_working_imagen_model = 'imagen-3.0-generate-001'
        self._init_clients()

    def _init_clients(self):
        if settings.OPENAI_API_KEY:
            try:
                from openai import AsyncOpenAI
                self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            except Exception as e: logger.error(f"OpenAI Init Error: {e}")
        
        if settings.GOOGLE_API_KEY:
            try:
                self.genai_client = google_genai.Client(api_key=settings.GOOGLE_API_KEY)
            except Exception as e: logger.error(f"Google GenAI Init Error: {e}")

    def get_capabilities(self) -> dict[str, bool]:
        return {"text_generation": bool(self.openai_client), "image_generation": bool(self.genai_client)}

    async def check_tokens_and_reset(self, partner: Partner, session: AsyncSession, min_tokens: int = 1) -> bool:
        if not partner.is_pro: return False
        now = datetime.now(UTC).replace(tzinfo=None)
        last_reset = partner.pro_tokens_last_reset or partner.created_at
        if (now - (last_reset.replace(tzinfo=None) if last_reset.tzinfo else last_reset)).days >= 30:
            is_plus = (partner.subscription_plan == "PRO_PLUS_MONTHLY")
            partner.pro_tokens = settings.PRO_PLUS_TOKENS_MONTHLY if is_plus else settings.PRO_TOKENS_MONTHLY
            partner.pro_tokens_last_reset = now
            session.add(partner)
            await session.commit()
            await session.refresh(partner)
        return partner.pro_tokens >= min_tokens

    async def generate_viral_content(self, partner: Partner, post_type: str, target_audience: str, language: str,
                                   tone_of_voice: str | None = "authoritative", referral_link: str | None = None,
                                   session: AsyncSession | None = None) -> dict[str, Any]:
        if not self.openai_client and not self.genai_client:
            return {"error": "Elite AI engine offline.", "status": "failed"}

        start_time = datetime.now()
        bot_username = getattr(settings, 'BOT_USERNAME', 'pintopaybot')
        
        # Link Setup Strategy
        if post_type == "partners":
            ref_link = f"https://t.me/pintopay_probot?start={partner.referral_code}"
        else:
            if referral_link and referral_link.strip():
                ref_link = referral_link.strip()
            else:
                ref_link = "https://t.me/pintopaybot?start=p_6977c29c66ed9faa401342f3"
        
        intel = prompts.build_viral_audience_intel(target_audience, post_type, language)
        
        # Sync with Predictive Resonance Engine
        resonance_data = None
        if session:
            try:
                from app.services.viral_analytics_service import viral_analytics
                resonance_data = await viral_analytics.get_predictive_insights(partner.id, session)
            except Exception as e:
                logger.warning(f"Resonance sync failed: {e}")

        # Prepare Prompts
        system_prompt = prompts.build_viral_system_prompt(language, target_audience, post_type, tone_of_voice, ref_link, intel, {}, resonance_data=resonance_data)
        user_prompt = prompts.build_viral_user_prompt(target_audience, post_type, language, tone_of_voice, ref_link, intel)
        
        # 🚀 TURBO EXECUTION V6.0 (10-15s Target)
        # We eliminate the secondary AI roundtrip for image prompt engineering.
        # Instead, we use a high-fidelity static builder and prioritize 'Fast' AI models.

        # 🚀 TURBO EXECUTION V7.0 (Content-Aware Calibration)
        # We prioritize quality by waiting for the text content first, 
        # then using it to calibrate the elite image prompt for maximum relevance.

        res_json, tokens_openai = await self._get_text_content(system_prompt, user_prompt)

        if not res_json or "error" in res_json: 
            return res_json or {"error": "Generation failed", "status": "failed"}
        
        # Use elite static builder with actual content awareness
        body_for_image = res_json.get("title", "") + " " + (res_json.get("body") or res_json.get("text") or "")
        image_prompt = prompts.build_viral_image_prompt(intel, body_for_image)
        
        # Generate image based on the specific post theme
        image_url = await self._generate_image(image_prompt, partner.id, turbo_mode=True)


        # Consistency fix for text fields
        body_text = res_json.get("text") or res_json.get("body") or ""
        
        # Safety fallback for ref_link placeholder
        if "{ref_link}" in body_text:
            body_text = body_text.replace("{ref_link}", ref_link)

            
        # CTA LINK REINFORCER...
        has_proper_link = f"({ref_link})" in body_text and "[" in body_text
        if not has_proper_link:
            # Language aware fallback
            cta_fallback = "Присоединиться к сети" if language == "Russian" else "Join the Network"
            
            lines = body_text.split("\n")
            cta_fixed = False
            for i in range(len(lines)-1, -1, -1):
                line = lines[i].strip()
                if not line: continue
                if "**" in line and len(line) < 120 and "]" in line:
                    clean_text = line.replace("**", "").split("](")[0].replace("[", "").replace("]", "").strip()
                    if not clean_text or len(clean_text) < 3: clean_text = cta_fallback
                    lines[i] = f"**[{clean_text}]({ref_link})**"
                    cta_fixed = True
                    break
            if not cta_fixed: 
                body_text = body_text.strip() + f"\n\n**[{cta_fallback}]({ref_link})**"
            else: 
                body_text = "\n".join(lines)

        # Append hashtags strictly (ensuring they are in the body)
        hashtags_list = res_json.get("hashtags", [])
        
        # 🛡️ HASHTAG GUARDIAN (2-4 LIMIT)
        if isinstance(hashtags_list, list):
            if len(hashtags_list) > 4:
                hashtags_list = hashtags_list[:4]
            
            if hashtags_list:
                hashtag_str = " ".join(hashtags_list)
                if hashtag_str not in body_text:
                    body_text = body_text.strip() + f"\n\n{hashtag_str}"
        elif isinstance(hashtags_list, str):
            # Fallback if AI returns a string
            tags = hashtags_list.split()
            if len(tags) > 4:
                hashtags_list = " ".join(tags[:4])
            if hashtags_list not in body_text:
                body_text = body_text.strip() + f"\n\n{hashtags_list}"
            hashtags_list = hashtags_list.split()

        duration = (datetime.now() - start_time).total_seconds()
        
        output = {
            "title": res_json.get("title", "Viral Insight"),
            "text": body_text,
            "body": body_text,
            "hashtags": hashtags_list,
            "image_prompt": image_prompt,
            "image_url": image_url,
            "status": "success",
            "tokens_openai": tokens_openai,
            "duration": duration,
            "image_model": getattr(self, "_last_used_image_model", "unknown"),
            "text_model": getattr(self, "_last_used_text_model", "unknown"),
        }


        # DB Tracking
        if session:
            try:
                gen = ViralGeneration(partner_id=partner.id, topic=post_type, audience=target_audience, language=language, 
                                     tone=tone_of_voice or "authoritative", title=output["title"], body=body_text, image_url=image_url)
                session.add(gen)
                await session.commit()
                await session.refresh(gen)
                output["id"] = gen.id
            except Exception as e: logger.warning(f"DB Log Fail: {e}")

        # TaskIQ Logging
        try:
            from .tasks import log_viral_generation_task
            await log_viral_generation_task.kiq(
                partner_id=partner.id, topic=post_type, audience=target_audience, language=language,
                openai_prompt=user_prompt, gemini_prompt=image_prompt, duration=duration,
                tokens_openai=tokens_openai, tokens_gemini=0, title=output["title"], body=body_text, image_url=image_url,
                image_model=output["image_model"], text_model=output["text_model"]
            )
        except Exception as e: logger.warning(f"TaskIQ Log Fail: {e}")

        return output

    async def _get_text_content(self, system_prompt: str, user_prompt: str, fast_mode: bool = False) -> tuple[dict | None, int]:
        # PRIORITY: OpenAI Flagship Tier (Top-notch text generation as requested)
        if self.openai_client:
            # For fast_mode (like internal prompt engineering), we go straight to mini
            models = ["gpt-4o-mini"] if fast_mode else ["gpt-4o", "gpt-4o-mini"]
            for model_name in models:
                try:
                    res = await self.openai_client.chat.completions.create(
                        model=model_name, 
                        messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
                        response_format={"type": "json_object"}
                    )
                    self._last_used_text_model = model_name
                    return json.loads(res.choices[0].message.content), res.usage.total_tokens
                except: 
                    continue
        
        # SECONDARY/EMERGENCY: Google Gemini Tier
        if self.genai_client:
            # In fast mode, we go straight to Flash
            models = ['gemini-2.0-flash'] if fast_mode else ['gemini-2.0-pro-exp-02-05', 'gemini-1.5-pro', 'gemini-2.0-flash']
            for model in models:
                try:
                    res = await self.genai_client.aio.models.generate_content(
                        model=model, contents=f"SYSTEM: {system_prompt}\n\nUSER: {user_prompt}",
                        config=genai_types.GenerateContentConfig(response_mime_type='application/json', temperature=0.7)
                    )
                    self._last_used_text_model = model
                    return json.loads(res.text), 0
                except: 
                    continue
                
        return None, 0

    async def _generate_image(self, prompt: str, partner_id: int, turbo_mode: bool = False) -> str | None:
        """Sequential image generation trying Google then OpenAI."""
        # 1. Google Imagen (Fastest & Usually Best)
        if self.genai_client:
            # TURBO PRIORITY: Use fast models first to hit 10-15s target
            if turbo_mode:
                models = [
                    'imagen-4.0-fast-generate-001',
                    'imagen-3.0-fast-generate-001',
                    'imagen-4.0-ultra-generate-001',
                    'imagen-3.0-generate-001'
                ]
            else:
                models = [
                    'imagen-4.0-ultra-generate-001', 
                    'imagen-4.0-generate-001', 
                    'imagen-3.0-generate-001', 
                    'imagen-3.0-fast-generate-001'
                ]

            for m in models:
                try:
                    success, url = await self._try_imagen(m, prompt, partner_id)
                    if success:
                        self._last_working_imagen_model = m
                        self._last_used_image_model = m
                        return url
                except Exception as e:
                    logger.warning(f"Imagen model {m} failed: {e}")
        
        # 2. Emergency Alternative: OpenAI DALL-E 3
        if self.openai_client:
            try:
                model_name = "dall-e-3"
                res = await self.openai_client.images.generate(model=model_name, prompt=prompt, n=1)
                img_url = res.data[0].url
                self._last_used_image_model = model_name
                # Persistent local copy
                filename = f"viral_dalle_{partner_id}_{secrets.token_hex(4)}.png"
                save_path = self._get_save_path(filename)
                async with httpx.AsyncClient() as client:
                    img_res = await client.get(img_url)
                    if img_res.status_code == 200:
                        with open(save_path, 'wb') as f: f.write(img_res.content)
                        return f"/generated_media/{filename}"
                return img_url
            except Exception as e:
                logger.error(f"DALL-E 3 failed: {e}")
        
        if not self.openai_client and not self.genai_client:
            logger.error("🛑 CRITICAL: No Image AI client initialized. Check API keys.")
            
        return None

    async def _try_imagen(self, model: str, prompt: str, partner_id: int) -> tuple[bool, str | None]:
        """Attempt to generate an image using a specific Google model."""
        try:
            # Using new google-genai SDK awaitable method
            res = await asyncio.wait_for(
                self.genai_client.aio.models.generate_images(
                    model=model, 
                    prompt=prompt, 
                    config=genai_types.GenerateImagesConfig(number_of_images=1)
                ), 
                timeout=45.0 # Imagen 3 can be slow
            )
            
            if res and res.generated_images:
                img_obj = res.generated_images[0].image
                filename = f"viral_{partner_id}_{secrets.token_hex(4)}.png"
                save_path = self._get_save_path(filename)
                
                # Check format
                if hasattr(img_obj, 'save'): 
                    img_obj.save(save_path)
                elif hasattr(img_obj, 'image_bytes'): 
                    with open(save_path, 'wb') as f: f.write(img_obj.image_bytes)
                else:
                    # Some versions return raw bytes vs PIL Image
                    with open(save_path, 'wb') as f: f.write(img_obj)
                    
                return True, f"/generated_media/{filename}"
            
            logger.warning(f"Imagen {model} returned no images.")
        except Exception as e:
            logger.debug(f"Imagen {model} error: {e}")
        return False, None

    def _get_save_path(self, filename: str) -> str:
        # Step back 4 levels: app/services/viral_studio/studio.py -> backend root
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        save_dir = os.path.join(backend_dir, "generated_media")
        os.makedirs(save_dir, exist_ok=True)
        return os.path.join(save_dir, filename)

    async def post_to_social(self, partner, platform, content, image_path=None, generation_id=None, channel_id=None, session=None) -> dict:
        platform = platform.lower().strip()
        res = {"status": "failed"}
        if platform == "x": res = await adapters.post_to_x(partner, content, image_path)
        elif platform == "telegram": res = await adapters.post_to_telegram(partner, content, image_path, channel_id_override=channel_id)
        elif platform == "linkedin": res = await adapters.post_to_linkedin(partner, content, image_path)
        
        if res.get("status") == "success" and session:
            from app.models.partner import SocialPost
            try:
                ids = res.get("message_ids", [])
                if platform == "x" and res.get("tweet_id"): ids = [str(res["tweet_id"])]
                for ext_id in ids:
                    chan = None
                    if platform == "telegram" and ":" in ext_id: chan, ext_id = ext_id.split(":", 1)
                    session.add(SocialPost(generation_id=generation_id, partner_id=partner.id, platform=platform, 
                                         external_id=str(ext_id), channel_id=chan or partner.telegram_channel_id))
                await session.commit()
            except Exception as e: logger.error(f"Social Tracking Fail: {e}")
        return res

    async def run_global_marketing_audit(self, language="English", force_refresh=False) -> dict:
        from app.services.redis_service import redis_service
        cache_key = f"global_marketing_audit_v4_{language.lower()}"
        
        async def compute_audit():
            news = await self._fetch_rss_global_news()
            if news: 
                try:
                    from .tasks import log_rss_to_sheets_task
                    await log_rss_to_sheets_task.kiq(news)
                except: pass
            
            news_context = "\n".join([f"- [{n['source']}] {n['title']}" for n in news])
            prompt = f"ACT AS ELITE CMO. CONTEXT: {news_context}. Generate high-stakes JSON audit in {language}."
            # ... simplified prompt calling (can be expanded to match original exactly)
            res_json, _ = await self._get_text_content("Elite CMO Persona", prompt)
            return res_json or {"error": "Audit failed"}

        if force_refresh:
            audit = await compute_audit()
            if audit and "error" not in audit: await redis_service.set_json(cache_key, audit, expire=10800)
            return audit
        return await redis_service.get_or_compute(cache_key, compute_audit, expire=10800)

    async def _fetch_rss_global_news(self) -> list[dict]:
        feeds = ["https://cointelegraph.com/rss", "https://www.coindesk.com/arc/outboundfeeds/rss/"]
        news_items = []
        async with httpx.AsyncClient(timeout=10.0) as client:
            for url in feeds:
                try:
                    res = await client.get(url)
                    if res.status_code == 200:
                        soup = BeautifulSoup(res.text, 'xml')
                        for item in soup.find_all('item')[:5]:
                            news_items.append({"title": item.title.text, "link": item.link.text, "source": url.split('/')[2]})
                except: continue
        return news_items

    async def fix_headline(self, headline: str) -> str:
        if not self.openai_client: return headline
        try:
            res = await self.openai_client.chat.completions.create(
                model="gpt-4o-mini", messages=[{"role": "system", "content": "Viral headline expert."}, {"role": "user", "content": headline}], max_tokens=60
            )
            return res.choices[0].message.content.strip()
        except: return headline

    async def generate_bio(self, bio: str) -> str:
        if not self.openai_client: return bio
        try:
            res = await self.openai_client.chat.completions.create(
                model="gpt-4o-mini", messages=[{"role": "system", "content": "Elite Persona Branding expert."}, {"role": "user", "content": bio}], max_tokens=150
            )
            return res.choices[0].message.content.strip()
        except: return bio

    async def fetch_trends(self) -> list[dict]:
        prompt = "Identify 3 top trending crypto narratives for 2026. Format as JSON list."
        res, _ = await self._get_text_content("Strategy Trends Expert", prompt)
        return res if isinstance(res, list) else []

viral_studio = ViralMarketingStudio()
