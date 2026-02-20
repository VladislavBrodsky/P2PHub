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
        ref_link = referral_link or f"https://t.me/{bot_username}?start=r_{partner.id}"
        
        intel = prompts.build_viral_audience_intel(target_audience, post_type, language)
        
        # Sync with Predictive Resonance Engine
        resonance_data = None
        if session:
            try:
                from app.services.viral_analytics_service import viral_analytics
                resonance_data = await viral_analytics.get_predictive_insights(partner.id, session)
            except Exception as e:
                logger.warning(f"Resonance sync failed: {e}")

        system_prompt = prompts.build_viral_system_prompt(language, target_audience, post_type, tone_of_voice, ref_link, intel, {}, resonance_data=resonance_data)
        user_prompt = prompts.build_viral_user_prompt(target_audience, post_type, language, tone_of_voice, ref_link, intel)

        # 1. Text Generation
        res_json, tokens_openai = await self._get_text_content(system_prompt, user_prompt)
        if not res_json or "error" in res_json: return res_json or {"error": "Generation failed", "status": "failed"}

        # Use 'body' or 'text' from response (consistency fix)
        body_text = res_json.get("text") or res_json.get("body") or ""
        
        # Safety fallback for ref_link placeholder
        if "{ref_link}" in body_text:
            body_text = body_text.replace("{ref_link}", ref_link)
            
        # CTA LINK REINFORCER: Ensure a link exists. If not, append one.
        if ref_link not in body_text:
            # Check if there is a bold line that looks like a CTA
            lines = body_text.split("\n")
            cta_line_found = False
            for i in range(len(lines)-1, -1, -1):
                if "**" in lines[i] and len(lines[i]) < 100:
                    # Transform existing bold line to link
                    clean_text = lines[i].replace("**", "").replace("[", "").replace("]", "").strip()
                    lines[i] = f"**[{clean_text}]({ref_link})**"
                    cta_line_found = True
                    break
            
            if not cta_line_found:
                body_text += f"\n\n**[Start Your Journey Here]({ref_link})**"
            else:
                body_text = "\n".join(lines)

        # 2. Image Generation
        image_prompt = res_json.get("image_description") or prompts.build_viral_image_prompt(intel, body_text)
        image_url = await self._generate_image(image_prompt, partner.id)

        duration = (datetime.now() - start_time).total_seconds()
        
        output = {
            "title": res_json.get("title", "Viral Insight"),
            "text": body_text,
            "body": body_text,
            "hashtags": res_json.get("hashtags", []),
            "image_prompt": image_prompt,
            "image_url": image_url,
            "status": "success",
            "tokens_openai": tokens_openai,
            "duration": duration,
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
                tokens_openai=tokens_openai, tokens_gemini=0, title=output["title"], body=body_text, image_url=image_url
            )
        except Exception as e: logger.warning(f"TaskIQ Log Fail: {e}")

        return output

    async def _get_text_content(self, system_prompt: str, user_prompt: str) -> tuple[dict | None, int]:
        if self.genai_client:
            for model in ['gemini-3-pro', 'gemini-2.0-pro', 'gemini-2.0-flash']:
                try:
                    res = await self.genai_client.aio.models.generate_content(
                        model=model, contents=f"SYSTEM: {system_prompt}\n\nUSER: {user_prompt}",
                        config=genai_types.GenerateContentConfig(response_mime_type='application/json', temperature=0.7)
                    )
                    return json.loads(res.text), 0
                except: continue
        
        if self.openai_client:
            try:
                res = await self.openai_client.chat.completions.create(
                    model="gpt-4o-mini", messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
                    response_format={"type": "json_object"}
                )
                return json.loads(res.choices[0].message.content), res.usage.total_tokens
            except: pass
        return None, 0

    async def _generate_image(self, prompt: str, partner_id: int) -> str | None:
        if self.genai_client:
            # Prioritizing Gemini 3 Pro (Nano Banana) and Imagen 3.0
            models = ['gemini-3-pro-nano-banana', 'gemini-3-pro', 'imagen-3.0-generate-001', 'imagen-3.0-fast-generate-001']
            for m in models:
                success, url = await self._try_imagen(m, prompt, partner_id)
                if success:
                    self._last_working_imagen_model = m
                    return url
        
        if self.openai_client:
            try:
                res = await self.openai_client.images.generate(model="dall-e-3", prompt=prompt, n=1)
                img_url = res.data[0].url
                # Persistent local copy
                filename = f"viral_dalle_{partner_id}_{secrets.token_hex(4)}.png"
                save_path = self._get_save_path(filename)
                async with httpx.AsyncClient() as client:
                    img_res = await client.get(img_url)
                    if img_res.status_code == 200:
                        with open(save_path, 'wb') as f: f.write(img_res.content)
                        return f"/generated_media/{filename}"
                return img_url
            except: pass
        return None

    async def _try_imagen(self, model, prompt, partner_id) -> tuple[bool, str | None]:
        try:
            res = await asyncio.wait_for(
                self.genai_client.aio.models.generate_images(
                    model=model, prompt=prompt, config=genai_types.GenerateImagesConfig(number_of_images=1)
                ), timeout=25.0
            )
            if res and res.generated_images:
                img_obj = res.generated_images[0].image
                filename = f"viral_{partner_id}_{secrets.token_hex(4)}.png"
                save_path = self._get_save_path(filename)
                if hasattr(img_obj, 'save'): img_obj.save(save_path)
                elif hasattr(img_obj, 'image_bytes'): 
                    with open(save_path, 'wb') as f: f.write(img_obj.image_bytes)
                return True, f"/generated_media/{filename}"
        except: pass
        return False, None

    def _get_save_path(self, filename: str) -> str:
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        save_dir = os.path.join(backend_dir, "generated_media")
        os.makedirs(save_dir, exist_ok=True)
        return os.path.join(save_dir, filename)

    async def post_to_social(self, partner, platform, content, image_path=None, generation_id=None, session=None) -> dict:
        platform = platform.lower().strip()
        res = {"status": "failed"}
        if platform == "x": res = await adapters.post_to_x(partner, content, image_path)
        elif platform == "telegram": res = await adapters.post_to_telegram(partner, content, image_path)
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
