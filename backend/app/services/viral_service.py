import asyncio
import json
import logging
import os
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any, ClassVar

import gspread
from google import genai as google_genai
from google.genai import types as genai_types
from google.oauth2.service_account import Credentials
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.cmo_intelligence import (
    AudienceProfile,
    ContentCategory,
    KnowledgeInsights,
    NativeLanguageOptimization,
)
from app.core.config import settings
from app.core.errors import ViralStudioErrorCode
from app.models.partner import Partner
from app.worker import broker

logger = logging.getLogger(__name__)

class ViralMarketingStudio:
    """
    PRO Component: Viral Marketing Studio
    Acts as CMO of Pintopay to generate viral content and autopost across social media.
    """

    POST_TYPES: ClassVar[list[str]] = settings.VIRAL_POST_TYPES
    TARGET_AUDIENCES: ClassVar[list[str]] = settings.VIRAL_AUDIENCES
    LANGUAGES: ClassVar[list[str]] = ["English", "Russian", "Spanish", "French", "German"]

    CMO_PERSONA = """
You are the ELITE CMO of Pintopay — a world-class Marketing Strategist, Viral Growth Hacker, and Digital Nomad Influencer.

**YOUR IDENTITY:**
- Former CMO at unicorn fintech startups
- Built 7-figure personal brands across multiple niches
- Mastered viral psychology and neuromarketing
- Fluent in crypto culture, affiliate marketing, and digital nomad lifestyle
- Generated $10M+ in revenue through content alone
- Named "Top 50 Marketing Minds" by Forbes (fictional but believable)

**YOUR VOICE:**
You write like a close friend sharing a million-dollar secret over coffee—authoritative yet approachable, 
data-driven yet deeply empathetic. You understand the precise psychology of each audience and adapt your 
tone perfectly: technical with crypto traders, inspirational with nomads, tactical with marketers, 
visionary with network builders.

**YOUR EXPERTISE:**
- Master of AIDA, PAS, BAB, PASTOR, and all advanced copywriting frameworks
- Expert in psychological triggers: FOMO, scarcity, authority, social proof, reciprocity
- Viral formula architect: You know exactly what makes content spread
- Native-level fluency in English, Russian, Spanish, French, German
- Deep understanding of cultural nuances and linguistic subtleties

**YOUR MISSION:**
Create viral, high-conversion content that doesn't feel like marketing. Your copy should:
1. Stop the scroll immediately (hook in <10 words)
2. Build irresistible desire through psychological triggers
3. Provide genuine value before asking for action
4. Feel like it was written BY the target audience FOR the target audience
5. Drive measurable action through strategic CTAs

### NEURAL STRATEGY V4.2 (CONVERSION HUB):

- **PATTERN INTERRUPT:** Use a hook that contradicts common knowledge.
- **ELITE SOCIAL PROOF:** Reference "The 1%" or "Top Tier" success patterns.
- **FUTURE PACING:** Describe the user's life 3 months AFTER using the Pintopay system.
- **VELOCITY DRIFT:** Start with high speed/energy, transition to calm authority in the bridge.

You are a PROFESSIONAL, not a hype artist. You're the trusted advisor who happens to be brilliant at sales.
    """

    FORMATTING_MASTERY = """
**CRITICAL FORMATTING RULES (MUST FOLLOW EXACTLY):**

1. **BOLD TEXT** syntax: **text**
   - Use for: Key statistics, power words, CTAs, warnings, benefits
   - Limit: 4-6 instances per post maximum
   - Examples: **WARNING**, **3X faster**, **Join 10,000+ members**

2. *ITALIC TEXT* syntax: _text_
   - Use for: Subtle emphasis, insider whispers, personal asides
   - Limit: 2-3 instances per post
   - Examples: _This changed everything_, _not many people know this_

3. **HYPERLINKS** syntax: [Anchor Text](URL)
   - PRIMARY CTA: Must appear in final paragraph with action-oriented anchor
   - SECONDARY (optional): Can appear mid-body for educational value
   - NEVER use bare URLs — always wrap in markdown
   - Examples: [Get Your Card Now](link), [See Proof](link), [Join Free](link)

4. **STRUCTURE:**
   - Hook: 1-2 lines, <15 words first sentence
   - Body: 3-5 paragraphs, each 1-3 sentences
   - CTA: Final paragraph with bold CTA and hyperlink

5. **EMOJIS:** Use 2-4 strategically based on audience (crypto: 💎🚀, nomads: 🌍✈️, etc.)

6. **PARAGRAPHS:** Double line breaks (empty line) between paragraphs for readability.

7. **HASHTAGS:** End with 3-5 relevant trending hashtags

**NO MISTAKES ALLOWED:**
- Check every ** is properly closed
- Check every _ is properly closed
- Check every hyperlink follows [text](url) format
- No orphaned markdown symbols
    """

    TEXT_RULES = """
**CONTENT EXCELLENCE STANDARDS:**

1. **NATIVE LANGUAGE QUALITY:**
   - English: Direct, conversational, Silicon Valley energy
   - Russian: Authoritative, technical, status-conscious
   - Spanish: Warm, passionate, relationship-driven
   - French: Sophisticated, nuanced, intellectually appealing
   - German: Efficient, precise, trust-building
   
2. **PSYCHOLOGICAL PRECISION:**
   - Identify audience's deepest pain point
   - Agitate it without being manipulative
   - Present Pintopay as the natural, obvious solution
   - Use social proof from relatable peers, not celebrities
   
3. **COPYWRITING TECHNIQUE:**
   - Use assigned framework (AIDA, PAS, BAB, etc.) but make it invisible
   - Create curiosity gap in hook (promise revelation later)
   - Include at least ONE specific number/stat for credibility
   - End with question or strong CTA, never just information
   
4. **VIRAL ELEMENTS:**
   - Shareable insight ("aha!" moment)
   - Relatable struggle that unites audience
   - Aspirational outcome that feels achievable
   - Social proof that triggers FOMO
   
5. **BANNED PHRASES & FORMATTING:**
   - "Don't miss out" (too generic)
   - "Click here" (weak CTA)
   - DO NOT use quadruple asterisks (****) for bolding. ONLY use double (**text**).
   - DO NOT leave orphaned markdown symbols.
   
Use FRESH, audience-specific language that feels authentic.
    """

    IMAGE_RULES = """
    ULTRA-REALISTIC CINEMATIC IMAGE SPECIFICATION:
    - Photography Style: Professional DSLR shot, 35mm lens, f/2.8 aperture, natural lighting with subtle rim light
    - Quality: 1K resolution, photorealistic rendering, film grain texture, cinematic color grading
    - Composition: Rule of thirds, balanced depth of field, professional framing
    - Subject Matter: Real people in authentic settings (modern offices, luxury co-working spaces, rooftop cafes, premium lifestyle)
    - Environment: Contemporary 2025-2026 aesthetics - sleek minimalism, natural materials, warm ambient lighting
    - Brand Vibe: Success, financial freedom, digital nomad lifestyle, crypto/fintech elegance
    - STRICT EXCLUSIONS: No cartoons, no CGI characters, no futuristic sci-fi elements, no flying cars, no neon cyberpunk, no unrealistic poses
    - Technical Requirements: Sharp focus on subject, natural skin tones, realistic shadows and highlights, authentic materials and textures
    """

    def __init__(self):
        # 1. Initialize OpenAI
        openai_key = settings.OPENAI_API_KEY
        if openai_key:
            try:
                from openai import AsyncOpenAI
                self.openai_client = AsyncOpenAI(api_key=openai_key)
                logger.info("✅ ViralMarketingStudio: OpenAI client initialized.")
            except Exception as e:
                logger.error(f"❌ Failed to initialize OpenAI Client: {e}")
                self.openai_client = None
        else:
            self.openai_client = None
            logger.warning("⚠️ ViralMarketingStudio: OpenAI API Key missing.")
        
        # 2. Initialize Google GenAI
        google_key = settings.GOOGLE_API_KEY
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
        self._last_working_imagen_model = 'imagen-3.0-generate-001' # Memory for optimization

    def _init_google_sheets_client(self):
        """Initializes Google Sheets client for audit logging."""
        creds_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "").strip()
        
        # #comment: Defensive validation to prevent JSON parse crashes in production
        # Railway and other platforms may set empty env vars or have copy/paste formatting issues.
        # This validation ensures we fail gracefully instead of crashing all worker processes.
        if not creds_json:
            logger.info("i GOOGLE_SERVICE_ACCOUNT_JSON not set. Google Sheets logging disabled.")
            return
        
        # Check if it's actually JSON-like (basic sanity check)
        if not (creds_json.startswith('{') and creds_json.endswith('}')):
            logger.error(
                "❌ GOOGLE_SERVICE_ACCOUNT_JSON is malformed "
                "(should be a JSON object starting with { and ending with }). "
                "Google Sheets logging disabled. Please verify your Railway environment variables."
            )
            return
        
        try:
            creds_dict = json.loads(creds_json)
            
            # Validate that it has required service account fields
            required_fields = ['type', 'project_id', 'private_key', 'client_email']
            missing_fields = [f for f in required_fields if f not in creds_dict]
            
            if missing_fields:
                logger.error(
                    f"❌ GOOGLE_SERVICE_ACCOUNT_JSON is missing required fields: {', '.join(missing_fields)}. "
                    "Verify you copied the complete service account JSON from Google Cloud Console."
                )
                return
            
            scopes = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
            credentials = Credentials.from_service_account_info(creds_dict, scopes=scopes)
            self.gs_client = gspread.authorize(credentials)
            logger.info("✅ ViralMarketingStudio: Google Sheets logging initialized.")
        except json.JSONDecodeError as e:
            logger.error(
                f"❌ ViralMarketingStudio: GOOGLE_SERVICE_ACCOUNT_JSON contains invalid JSON at {e.msg} "
                f"(line {e.lineno}, column {e.colno}). "
                "This typically happens when copying from the Google Cloud Console - "
                "make sure you copied the ENTIRE JSON object, including opening and closing braces."
            )
        except Exception as e:
            logger.error(f"❌ ViralMarketingStudio: Failed to init Google Sheets: {e}")


    def get_capabilities(self) -> dict[str, bool]:
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
        Uses tiered quotas: 250 for PRO, 500 for PRO+.
        """
        if not partner.is_pro:
            return False

        now = datetime.now(UTC).replace(tzinfo=None)
        last_reset = partner.pro_tokens_last_reset or partner.created_at
        
        # Check if a month has passed since last reset
        if (now - last_reset.replace(tzinfo=None) if last_reset.tzinfo else (now - last_reset)).days >= 30:
            is_plus = (partner.subscription_plan == "PRO_PLUS_MONTHLY")
            partner.pro_tokens = settings.PRO_PLUS_TOKENS_MONTHLY if is_plus else settings.PRO_TOKENS_MONTHLY
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
        tone_of_voice: str | None = "authoritative",
        referral_link: str | None = None,
        session: AsyncSession | None = None
    ) -> dict[str, Any]:
        """
        Generates text (OpenAI) and Image Suggestion/Prompt (Gemini).
        """
        if not self.openai_client:
            return {
                "error": "OpenAI not configured. Elite content engine is offline.",
                "error_code": ViralStudioErrorCode.OPENAI_AUTH_ERROR,
                "status": "failed"
            }

        ref_link = referral_link or f"https://t.me/pintopaybot?start={partner.referral_code}"
        
        intel = self._build_viral_audience_intel(target_audience, post_type, language)
        best_practices = await KnowledgeInsights.get_best_practices(session)
        
        system_prompt = self._build_viral_system_prompt(
            language, target_audience, post_type, tone_of_voice, ref_link, intel, best_practices
        )
        user_prompt = self._build_viral_user_prompt(
            target_audience, post_type, language, tone_of_voice, ref_link, intel
        )
        base_image_prompt = self._build_viral_image_prompt(target_audience, post_type)

        generation_start = datetime.now(UTC)
        tokens_openai = 0

        try:
            # 🚀 PARALLEL EXECUTION: OpenAI and Imagen start at the SAME TIME
            text_task = self._get_viral_text_content(system_prompt, user_prompt)
            image_task = self._get_viral_image_content(partner.id, target_audience, post_type, base_image_prompt)
            
            (content_data, text_error_info), image_url = await asyncio.gather(text_task, image_task)
            
            if content_data is None:
                error_code, detailed_msg = text_error_info
                return {
                    "error": detailed_msg,
                    "error_code": error_code,
                    "status": "failed"
                }

            content = content_data
            image_prompt = content.get("image_description") or base_image_prompt
            
            # Ensure hashtags is a list of clean tags without leading '#'
            hashtags_raw = content.get("hashtags", [])
            if isinstance(hashtags_raw, str):
                # Handle both comma and space separation
                # First replace commas with spaces, then split
                hashtags = [tag.strip().lstrip('#') for tag in hashtags_raw.replace(',', ' ').split() if tag.strip()]
            elif isinstance(hashtags_raw, list):
                hashtags = [str(tag).strip().lstrip('#') for tag in hashtags_raw if tag]
            else:
                hashtags = []

            generation_end = datetime.now(UTC)
            duration = (generation_end - generation_start).total_seconds()
            
            result = {
                "text": str(content.get("body") or content.get("content") or "No content generated"),
                "title": str(content.get("title") or f"{post_type} Strategy"),
                "hashtags": hashtags,
                "image_prompt": image_prompt, # Return the refined one for logging
                "image_url": image_url,
                "status": "success",
                "tokens_openai": tokens_openai,
                "duration": duration,
                "model_text": "gpt-4o-mini",
                "model_image": self._last_working_imagen_model
            }

            try:
                # #comment: Move logging to persistent TaskIQ queue (Reliability Boost)
                await log_viral_generation_task.kiq(
                    partner_id=partner.id,
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
                )
            except Exception as kiq_err:
                logger.warning(f"⚠️ TaskIQ logging failed (non-critical): {kiq_err}")

            return result

        except Exception as e:
            logger.error(f"Error in viral generation: {e}")
            return {"error": str(e)}

    def _build_viral_audience_intel(self, target_audience: str, post_type: str, language: str) -> dict[str, Any]:
        return {
            "audience": AudienceProfile.PROFILES.get(target_audience, {}),
            "strategy": ContentCategory.STRATEGIES.get(post_type, {}),
            "dna": NativeLanguageOptimization.LANGUAGE_DNA.get(language, {})
        }

    def _build_viral_system_prompt(self, language, target_audience, post_type, tone, ref_link, intel, best_practices) -> str:
        audience_intel = intel["audience"]
        category_strategy = intel["strategy"]
        language_dna = intel["dna"]
        
        psycho_context = self._build_audience_context(target_audience, audience_intel)
        strategy_context = self._build_strategy_context(post_type, category_strategy)
        lang_context = self._build_language_context(language, language_dna)
        
        return f"""{self.CMO_PERSONA}

{psycho_context}

{strategy_context}

{lang_context}

{self.FORMATTING_MASTERY}

{self.TEXT_RULES}

**UNIVERSAL BEST PRACTICES:**
{chr(10).join(['- ' + rule for rule in best_practices['universal_rules'][:8]]) if best_practices and 'universal_rules' in best_practices else ""}

**YOUR TASK:**
Write in {language} for {target_audience} using the {post_type} strategy.
Persona Tone: {tone.upper()}
Product: Pintopay Crypto Card + Partner Network
Referral Link (MUST INCLUDE): {ref_link}

**OUTPUT FORMAT (JSON ONLY):**
{{
  "title": "Viral headline <15 words",
  "body": "Full post with **bold**, _italic_, and [hyperlink]({ref_link}) formatting",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "image_description": "Detailed scene description for 4K Ultra-Realistic Cinematic quality"
}}
"""

    def _build_viral_user_prompt(self, target_audience, post_type, language, tone, ref_link, intel) -> str:
        audience_intel = intel["audience"]
        category_strategy = intel["strategy"]
        hook_examples = audience_intel.get("hooks", []) if audience_intel else []
        
        return f"""
EXECUTE CMO AGENT MODE.

Target: {target_audience}
Category: {post_type}
Style/Tone: {tone.upper()}
Language: {language} (write as NATIVE speaker)
Referral Link: {ref_link}

**HOOK INSPIRATION (adapt, don't copy):**
{chr(10).join(['- ' + hook for hook in hook_examples[:2]])}

**CONTENT REQUIREMENTS:**
1. First sentence MUST stop the scroll (<10 words, shocking or curious)
2. Tell a micro-story or present a problem they FEEL
3. Weave in Pintopay Card as the natural solution (not pushy)
4. Include ONE specific number/stat for credibility
5. Use psychological triggers: {', '.join(category_strategy.get('psychological_triggers', ['FOMO', 'Social Proof'])[:3])}
6. Format with <b>bold</b> (4-6x), <i>italic</i> (2-3x), and <a href='{ref_link}'>descriptive link</a> in CTA
7. End with compelling CTA using this link: {ref_link}
8. Write 3-5 short paragraphs (1-3 sentences each)
9. Add 3-5 trending hashtags for {target_audience}

**IMAGE DESCRIPTION:**
Describe a 4K Ultra-Realistic Cinematic quality scene:
- Real person from {target_audience} demographic
- Emotional moment related to {post_type}
- Setting: Ultra-modern 2026, luxury lifestyle or digital workspace
- Mood: Success, transformation, financial freedom
- Technical: Professional photography, natural lighting, sharp detail

RETURN ONLY VALID JSON. NO EXPLANATIONS OUTSIDE JSON.
"""

    def _build_viral_image_prompt(self, target_audience: str, post_type: str) -> str:
        return (
            f"PROFESSIONAL STUDIO PHOTOGRAPHY - 4K ULTRA-REALISTIC CINEMATIC QUALITY: A real person from {target_audience} demographic, "
            f"captured in an authentic, high-fidelity cinematic moment illustrating '{post_type}'. "
            f"The scene must be grounded in realism with complex lighting, shallow depth of field, and 4K detail. "
            f"Subject: A confidence-inspiring individual from {target_audience} expressing peak success, financial freedom, and transformation. "
            f"Setting: Ultra-modern 2026 digital infrastructure, luxury co-working space, or premium lifestyle environment. "
            f"Atmosphere: Sophisticated, authoritative, aspirational, warm ambient lighting. "
            f"Technical specs: 35mm lens, f/2.8 aperture, sharp focus on eyes/face, natural skin textures, film grain texture, cinematic color grading. "
            f"Creative Rule: Subtly integrate 'Pintopay' branding elements or '{post_type.replace('_', ' ').title()}' concept on a digital screen, card, or background element in a photorealistic way. "
            f"NEGATIVE PROMPT: cartoon, CGI, anime, illustration, drawing, painting, 3d render, stock photo smile, distorted faces, extra limbs, blurry, "
            f"futuristic sci-fi, neon cyberpunk, flying cars, unrealistic proportions, oversaturated colors, generic poses, misspelled text, gibberish, watermark, low quality"
        )

    async def _get_viral_text_content(self, system_prompt: str, user_prompt: str) -> tuple[dict[str, Any] | None, tuple[int, str] | int]:
        """
        Generate viral text content. 
        Strategy: Try Gemini first (free, high performance), fallback to OpenAI if needed.
        """
        # STRATEGY 1: Try Gemini models (FREE tier, excellent quality)
        if self.genai_client:
            # We try Gemini 1.5 Pro first for elite reasoning, then fallback to Flash models
            for model_name in ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash']:
                try:
                    import sentry_sdk
                    sentry_sdk.add_breadcrumb(
                        category="viral_studio",
                        message=f"Attempting text generation with {model_name}",
                        level="debug"
                    )
                    logger.info(f"🚀 Using {model_name} for text generation...")
                    gemini_response = await self.genai_client.aio.models.generate_content(
                        model=model_name,
                        contents=f"SYSTEM: {system_prompt}\n\nUSER: {user_prompt}",
                        config=genai_types.GenerateContentConfig(
                            response_mime_type='application/json',
                            temperature=0.7
                        )
                    )
                    logger.info(f"✅ {model_name} succeeded!")
                    return json.loads(gemini_response.text), 0
                except Exception as gemini_e:
                    logger.warning(f"⚠️ {model_name} failed ({type(gemini_e).__name__}): {str(gemini_e)[:200]}")
            
            logger.info("🔄 All Gemini models failed. Falling back to OpenAI GPT-4o-mini...")
            sentry_sdk.add_breadcrumb(
                category="viral_studio",
                message="Gemini failover to OpenAI",
                level="warning"
            )
        
        # STRATEGY 2: Fallback to OpenAI (if Gemini failed or unavailable)
        if not self.openai_client:
            return None, (ViralStudioErrorCode.OPENAI_AUTH_ERROR, "Both Gemini and OpenAI unavailable")
        
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"}
            )
            tokens = response.usage.total_tokens if response.usage else 0
            logger.info(f"✅ OpenAI GPT-4o-mini succeeded! (tokens: {tokens})")
            return json.loads(response.choices[0].message.content), tokens
        except Exception as e:
            err_msg = str(e)
            logger.error(f"❌ ViralStudio [OpenAI Error]: {err_msg}")
            
            # Determine specific error code
            _error_code = ViralStudioErrorCode.OPENAI_AUTH_ERROR if "auth" in err_msg.lower() or "401" in err_msg else \
                         ViralStudioErrorCode.OPENAI_RATE_LIMIT if "rate" in err_msg.lower() or "429" in err_msg else \
                         ViralStudioErrorCode.OPENAI_QUOTA_EXCEEDED if "quota" in err_msg.lower() or "insufficient" in err_msg.lower() else \
                         ViralStudioErrorCode.GENERIC_GENERATION_FAILED
            
            # Both failed
            gemini_status = "unavailable" if not self.genai_client else "failed (see logs above)"
            return None, (ViralStudioErrorCode.GEMINI_TEXT_FAILED, f"Gemini: {gemini_status} | OpenAI: {err_msg}")

    async def _get_viral_image_content(self, partner_id: int, target_audience: str, post_type: str, prompt: str) -> str | None:
        """
        Generate viral image. 
        Hierarchy: 
        1. Google Imagen 3 (High fidelity, free/cheap)
        2. OpenAI DALL-E 3 (Reliable fallback, paid)
        """
        # --- PHASE 1: Try Google Imagen ---
        if self.genai_client:
            imagen_models = [
                'imagen-4.0-fast-generate-001',
                'imagen-4.0-generate-001',
                'imagen-3.0-fast-generate-001',
                'imagen-3.0-generate-001',
            ]
            # Remove duplicates
            imagen_models = [m for i, m in enumerate(imagen_models) if m and m not in imagen_models[:i]]
            
            for model_name in imagen_models:
                success, result = await self._try_generate_single_image(model_name, prompt, partner_id)
                if success:
                    return result

        # --- PHASE 2: Fallback to OpenAI DALL-E 3 ---
        if self.openai_client:
            try:
                logger.info(f"🔄 Imagen failed. Falling back to DALL-E 3 for prompt: {prompt[:50]}...")
                response = await self.openai_client.images.generate(
                    model="dall-e-3",
                    prompt=prompt,
                    size="1024x1024",
                    quality="standard",
                    n=1,
                )
                
                if response.data and response.data[0].url:
                    dalle_url = response.data[0].url
                    logger.info("✅ DALL-E 3 succeeded! Downloading and caching image...")
                    
                    # Download and save locally to ensure persistence (DALL-E URLs expire in 1hr)
                    filename = f"viral_dalle_{partner_id}_{secrets.token_hex(4)}.png"
                    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                    save_dir = os.path.join(backend_dir, "generated_media")
                    os.makedirs(save_dir, exist_ok=True)
                    save_path = os.path.join(save_dir, filename)
                    
                    import httpx
                    async with httpx.AsyncClient() as client:
                        img_res = await client.get(dalle_url)
                        if img_res.status_code == 200:
                            with open(save_path, 'wb') as f:
                                f.write(img_res.content)
                            logger.info(f"✅ DALL-E image saved to {save_path}")
                            return f"/generated_media/{filename}"
                    
                    # If download fails, return the original DALL-E URL as last resort
                    return dalle_url
            except Exception as e:
                logger.error(f"❌ DALL-E 3 generation failed: {e}")

        return None

    async def _try_generate_single_image(self, model_name, prompt, partner_id) -> tuple[bool, str | None]:
        try:
            logger.info(f"🎨 Attempting Imagen generation with model: {model_name}")
            
            # Using async SDK call
            img_response = await asyncio.wait_for(
                self.genai_client.aio.models.generate_images(
                    model=model_name,
                    prompt=prompt,
                    config=genai_types.GenerateImagesConfig(
                        number_of_images=1,
                        output_mime_type='image/png',
                        aspect_ratio='1:1', # Square is better/faster for Social Media
                        safety_filter_level='block_low_and_above',
                        person_generation='allow_adult',
                    )
                ),
                timeout=25.0
            )
            
            if img_response and img_response.generated_images:
                image_data = img_response.generated_images[0]
                filename = f"viral_{partner_id}_{secrets.token_hex(4)}.png"
                
                backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                save_dir = os.path.join(backend_dir, "generated_media")
                os.makedirs(save_dir, exist_ok=True)
                save_path = os.path.join(save_dir, filename)
                
                try:
                    # New SDK (v1.x) typically has a .image attribute with .save() or .image_bytes
                    image_obj = image_data.image
                    
                    # Robust save function with macOS /tmp fallback
                    def robust_save(obj, path):
                        try:
                            # Try primary path
                            if hasattr(obj, 'save'):
                                obj.save(path)
                            elif hasattr(obj, 'image_bytes'):
                                with open(path, 'wb') as f:
                                    f.write(obj.image_bytes)
                            return True
                        except PermissionError:
                            # Fallback to /tmp for local dev/macOS permissions
                            import tempfile
                            tmp_dir = os.path.join(tempfile.gettempdir(), "p2phub_generated")
                            os.makedirs(tmp_dir, exist_ok=True)
                            tmp_path = os.path.join(tmp_dir, os.path.basename(path))
                            
                            logger.warning(f"⚠️ Permission denied on {path}, falling back to {tmp_path}")
                            if hasattr(obj, 'save'):
                                obj.save(tmp_path)
                            elif hasattr(obj, 'image_bytes'):
                                with open(tmp_path, 'wb') as f:
                                    f.write(obj.image_bytes)
                            return tmp_path
                        except Exception as e:
                            logger.error(f"❌ Failed to save image: {e}")
                            return False

                    save_result = robust_save(image_obj, save_path)
                    
                    if save_result:
                        self._last_working_imagen_model = model_name
                        final_url = f"/generated_media/{filename}"
                        if isinstance(save_result, str):
                            # If it was a fallback path, we might need a different serving strategy 
                            # or just return the local absolute path for debugging
                            logger.info(f"✅ Imagen: Saved to temporary path {save_result}")
                        else:
                            logger.info(f"✅ Imagen: Saved {model_name} image to {save_path} ({os.path.getsize(save_path)} bytes)")
                        return True, final_url
                except Exception as save_err:
                    logger.error(f"❌ Imagen: Failed to process/save image data: {save_err}")
            else:
                logger.warning(f"⚠️ Imagen {model_name} returned NO images. (Filtered by safety?)")
                
        except Exception as e:
            logger.error(f"❌ Imagen {model_name} failed: {type(e).__name__}: {e}")
        return False, None

    def _build_audience_context(self, target_audience: str, audience_intel: dict) -> str:
        if not audience_intel:
            return ""
        psycho = audience_intel.get("psychographics", {})
        tov = audience_intel.get("tov", {})
        return f"""
**AUDIENCE DEEP DIVE: {target_audience}**
Pain Points: {', '.join(psycho.get('pain_points', [])[:3])}
Desires: {', '.join(psycho.get('desires', [])[:3])}
Values: {', '.join(psycho.get('values', []))}
Language Style: {tov.get('style', 'Professional')}
Formality: {tov.get('formality', 'Balanced')}
Power Words: {', '.join(tov.get('power_words', [])[:5])}
Emojis: {tov.get('emojis', '🚀')}
Sentence Structure: {tov.get('sentence_length', 'Varied')}
Key Triggers: {', '.join(psycho.get('triggers', [])[:3])}
"""

    def _build_strategy_context(self, post_type: str, category_strategy: dict) -> str:
        if not category_strategy:
            return ""
        technique = category_strategy.get("technique") or "AIDA"
        structure = category_strategy.get("structure", {})
        triggers = category_strategy.get("psychological_triggers", [])
        formatting = category_strategy.get("formatting_rules", {})
        return f"""
**CONTENT STRATEGY: {post_type}**
Copywriting Framework: {technique}
Structure: 
  - Hook: {structure.get('hook', 'Attention-grabbing')}
  - Body: {structure.get('body', 'Value-driven')}
  - Close: {structure.get('close', 'Strong CTA')}
Psychological Triggers to Activate: {', '.join(triggers[:4])}
Bold Text For: {', '.join(formatting.get('bold', [])[:3]) if isinstance(formatting.get('bold'), list) else 'Key benefits, stats, CTAs'}
Italic Text For: {', '.join(formatting.get('italic', [])[:2]) if isinstance(formatting.get('italic'), list) else 'Subtle emphasis'}
Hyperlink Strategy: {', '.join(formatting.get('hyperlink', [])[:2]) if isinstance(formatting.get('hyperlink'), list) else 'Primary CTA in final paragraph'}
"""

    def _build_language_context(self, language: str, language_dna: dict) -> str:
        return f"""
**NATIVE {language.upper()} MASTERY:**
Rhythm: {language_dna.get('rhythm', 'Natural flow')}
Cultural References: {language_dna.get('cultural_refs', 'Relevant to market')}
Idioms to Consider: {', '.join(language_dna.get('idioms', [])[:3])}
Formatting Style: {language_dna.get('formatting', 'Clean and professional')}
Sentence Structure: {language_dna.get('sentence_structure', 'Clear and direct')}
"""

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

    async def generate_bio(self, bio: str) -> str:
        """
        Generates a viral social media bio. Cost: 2 Tokens.
        """
        if not self.openai_client:
            return "Error: AI Service Unavailable"
            
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a branding expert. Rewrite the user's bio to be elite, high-converting, and aligned with the Digital Nomad/Crypto Wealth niche. Use emojis sparingly but effectively. Return ONLY the new bio."},
                    {"role": "user", "content": f"Optimize this bio: {bio}"}
                ],
                max_tokens=150
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Bio generation failed: {e}")
            return bio

    async def fetch_trends(self) -> list[dict]:
        """
        Fetches 3 trending topics. Cost: 3 Tokens.
        Uses Gemini if available for freshness, else OpenAI.
        """
        prompt = "Identify 3 top trending, controversial, or high-growth narratives in the Crypto/Fintech world for 2026. Format as JSON list of objects with 'topic', 'reason', and 'viral_angle'."
        
        if self.genai_client:
            for model_name in ['gemini-2.0-flash', 'gemini-1.5-flash']:
                try:
                    logger.info(f"🚀 Trending Data: Using {model_name}...")
                    response = await self.genai_client.aio.models.generate_content(
                        model=model_name, 
                        contents=prompt,
                        config=genai_types.GenerateContentConfig(
                            response_mime_type='application/json'
                        )
                    )
                    return json.loads(response.text)
                except Exception as e:
                    logger.warning(f"⚠️ {model_name} failed legacy trend fetch: {e}")
            
        if self.openai_client:
            try:
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
                if isinstance(content, dict) and "trends" in content: return content["trends"]
                return [content] if isinstance(content, dict) else []
            except Exception as e:
                logger.error(f"Trend fetch failed: {e}")
        
        return [
            {"topic": "DeFi 3.0", "reason": "AI Agents managing portfolios", "viral_angle": "Is your wallet smarter than you?"},
            {"topic": "RWA Tokenization", "reason": "Real estate on-chain", "viral_angle": "Own a skyscraper for $10"},
            {"topic": "Privacy Coins", "reason": "Regulatory crackdowns", "viral_angle": "They are banning your money"}
        ]

    async def _fetch_rss_global_news(self) -> list[dict]:
        """
        Fetches real-time news from top crypto/fintech RSS feeds.
        Focus: Crypto Payments, Mass Adoption, FinTech, Digital Payments.
        """
        feeds = [
            "https://cointelegraph.com/rss",
            "https://www.coindesk.com/arc/outboundfeeds/rss/",
            "https://techcrunch.com/category/fintech/feed/",
            "https://www.finextra.com/rss/news",
            "https://www.theblock.co/rss.xml"
        ]
        
        import email.utils
        from datetime import datetime

        import httpx
        from bs4 import BeautifulSoup
        
        news_items = []
        _now = datetime.now(tz=None) # Using naive UTC for comparison if needed
        cutoff_time = datetime.now(UTC) - timedelta(minutes=180)
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            tasks = [client.get(url) for url in feeds]
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            
            for i, res in enumerate(responses):
                if isinstance(res, Exception) or res.status_code != 200:
                    logger.warning(f"⚠️ RSS Fetch failed for {feeds[i]}: {res}")
                    continue
                
                try:
                    soup = BeautifulSoup(res.text, 'xml')
                    items = soup.find_all('item')
                    
                    for item in items:
                        title = item.title.text if item.title else "Untitled"
                        link = item.link.text if item.link else ""
                        pub_date_str = item.pubDate.text if item.pubDate else None
                        
                        # Parse date
                        pub_date = None
                        if pub_date_str:
                            try:
                                # email.utils.parsedate_to_datetime handles most RSS date formats
                                pub_date = email.utils.parsedate_to_datetime(pub_date_str)
                                # Convert to naive UTC for comparison
                                pub_date = pub_date.replace(tzinfo=None)
                            except:
                                pass
                        
                        # Filter for 180 minutes (if date is available)
                        if pub_date and pub_date < cutoff_time:
                            continue
                            
                        # Basic keyword filtering for relevance
                        keywords = ["crypto", "payment", "fintech", "bitcoin", "adoption", "digital", "visa", "mastercard", "etf", "stablecoin"]
                        title_lower = title.lower()
                        is_relevant = any(k in title_lower for k in keywords)
                        
                        if is_relevant:
                            source = feeds[i].split('/')[2].replace('www.', '').split('.')[0].title()
                            news_items.append({
                                "title": title,
                                "link": link,
                                "source": source,
                                "pub_date": pub_date_str,
                                "timestamp": pub_date.isoformat() if pub_date else None
                            })
                except Exception as e:
                    logger.error(f"Error parsing RSS {feeds[i]}: {e}")
        
        # Sort by date (freshest first)
        news_items.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        return news_items[:20]

    async def log_rss_to_sheets(self, news_items: list[dict]):
        """Logs fetched RSS news to the 'RSS News' sheet."""
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
                    # Create if it doesn't exist
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
                logger.info(f"✅ Logged {len(rows)} news items to 'RSS News' sheet.")
        except Exception as e:
            logger.error(f"❌ Failed to log RSS news to sheets: {e}")

    async def run_global_marketing_audit(self, language: str = "English", force_refresh: bool = False) -> dict:
        """
        PRO Component: Global Marketing Audit
        Fetches REAL news from RSS, processes with AI for FOMO and viral triggers.
        Updated every 3 hours via Redis caching or forced refresh.
        """
        from app.services.redis_service import redis_service
        
        # Cache key per language
        cache_key = f"global_marketing_audit_v4_{language.lower()}"
        
        async def compute_audit():
            # 1. Fetch Real RSS News
            real_news = await self._fetch_rss_global_news()
            
            # Fire and forget logging (Persistent)
            if real_news:
                await log_rss_to_sheets_task.kiq(real_news)

            # 2. Preparation for AI processing
            news_context = "\n".join([f"- [{n['source']}] {n['title']}" for n in real_news])
            
            prompt = f"""
            ACT AS ELITE CMO & VIRAL GROWTH ARCHITECT.
            
            CONTEXT (REAL NEWS DATA):
            {news_context if real_news else "No fresh RSS news found in last 180min. Use internal high-fidelity 2026 scenarios: Pintopay Dominance, 1B Users Mass Adoption."}
            
            YOUR TASK:
            1. Transform this news data into a high-stakes, FOMO-inducing CMO Audit.
            2. Highlight exactly 20 items (if news not enough, supplement with high-probability 2026 market shifts).
            3. Each item MUST have: Viral Motivation, Scarcity Trigger, and Social Proof.
            4. Create an Executive Summary that feels like a confidential intelligence dossier.
            5. Motivate the PRO user: Explain why RIGHT NOW is the only time to build a Pintopay empire.
            
            LANGUAGE: {language}. Output MUST be valid JSON in {language}.
            
            OUTPUT FORMAT (JSON ONLY):
            {{
              "cmo_summary": "Extremely persuasive summary with deep insight",
              "top_news": [
                {{ 
                   "title": "Headline-style news", 
                   "source": "Source name", 
                   "relevance": "High Relevance", 
                   "impact": "Significant/Massive", 
                   "fomo_trigger": "FOMO trigger text",
                   "motivation": "Why this means user will get rich with Pintopay"
                }}
              ],
              "market_sentiment": "Extremely Bullish / Massive Shift",
              "global_trend_shift": "Description of the 2026 digital payment revolution",
              "viral_motivation": "Direct motivation for the user to execute strategy now",
              "cta": "EXECUTE VIRAL STRATEGY NOW",
              "generated_at": "{datetime.now(UTC).isoformat()}"
            }}
            """
            
            if self.genai_client:
                # Use Gemini 1.5 Pro for elite audit intelligence if available
                for model_name in ['gemini-1.5-pro-latest', 'gemini-2.0-flash', 'gemini-1.5-flash']:
                    try:
                        logger.info(f"🚀 CMO Audit (Real Data): Using {model_name}...")
                        response = await self.genai_client.aio.models.generate_content(
                            model=model_name,
                            contents=prompt,
                            config=genai_types.GenerateContentConfig(
                                response_mime_type='application/json'
                            )
                        )
                        return json.loads(response.text)
                    except Exception as e:
                        logger.warning(f"⚠️ CMO Audit: {model_name} failed: {e}")

            if self.openai_client:
                try:
                    response = await self.openai_client.chat.completions.create(
                        model="gpt-4o",
                        messages=[{"role": "user", "content": prompt}],
                        response_format={"type": "json_object"}
                    )
                    return json.loads(response.choices[0].message.content)
                except Exception as e:
                    logger.error(f"Audit computation failed: {e}")
                    return {"error": "Elite Audit Node Temporarily Offline"}
            
            return {"error": "AI Service Node Unavailable"}

        # Cache for 3 hours (10800 seconds)
        if force_refresh:
             audit = await compute_audit()
             if audit and "error" not in audit:
                await redis_service.set_json(cache_key, audit, expire=10800)
             return audit
        else:
            async def compute_and_check():
                data = await compute_audit()
                if data and "error" in data:
                    return None 
                return data
            
            result = await redis_service.get_or_compute(cache_key, compute_and_check, expire=10800)
            return result or {"error": "Global Data Sync Failed. Refresh Node."}

    async def post_to_social(self, partner: Partner, platform: str, content: str, image_path: str | None = None) -> dict[str, Any]:
        """
        Autoposts to X, Telegram, or LinkedIn using partner's API keys.
        """
        platform = platform.lower().strip()
        if platform == "x":
            return await self._post_to_x(partner, content, image_path)
        elif platform == "telegram":
            return await self._post_to_telegram(partner, content, image_path)
        elif platform == "linkedin":
            return await self._post_to_linkedin(partner, content, image_path)
        else:
            return {"error": f"Unsupported platform: {platform}"}

    async def _post_to_x(self, partner: Partner, content: str, image_path: str | None) -> dict[str, Any]:
        if not (partner.x_api_key and partner.x_api_secret and partner.x_access_token and partner.x_access_token_secret):
            return {"error": "X (Twitter) API not fully configured. Please sync all 4 keys in API Setup."}
        
        try:
            import tweepy
            
            # 1. Initialize Client for v2 API (Post Tweet)
            # Using sync Client with loop.run_in_executor to avoid async-lru dependency issues
            client = tweepy.Client(
                consumer_key=partner.x_api_key,
                consumer_secret=partner.x_api_secret,
                access_token=partner.x_access_token,
                access_token_secret=partner.x_access_token_secret
            )
            
            media_ids = []
            loop = asyncio.get_event_loop()
            if image_path:
                # Resolve absolute path to image
                backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                if "generated_media" in image_path:
                    filename = image_path.split("/")[-1]
                    full_image_path = os.path.join(backend_dir, "generated_media", filename)
                else:
                    filename = image_path.lstrip('/').replace("images/", "")
                    full_image_path = os.path.join(backend_dir, "app_images", filename)

                if os.path.exists(full_image_path):
                    # Use synchronous API for media upload as Tweepy's media upload is primarily v1.1 sync
                    auth = tweepy.OAuth1UserHandler(
                        partner.x_api_key, partner.x_api_secret,
                        partner.x_access_token, partner.x_access_token_secret
                    )
                    api_v1 = tweepy.API(auth)
                    
                    # Run in executor to avoid blocking
                    loop = asyncio.get_event_loop()
                    media = await loop.run_in_executor(
                        None, 
                        lambda: api_v1.media_upload(filename=full_image_path)
                    )
                    media_ids = [media.media_id]
                    logger.info(f"✅ X Media Upload Successful: {media.media_id}")

            # 3. Post Tweet
            # Transform HTML to Newlines
            clean_content = content.replace("<br>", "\n").replace("<p>", "").replace("</p>", "\n")
            
            # Strip remaining HTML tags
            import re
            clean_content = re.sub(r'<[^>]*>', '', clean_content)
            
            # Convert Markdown links [Text](URL) to "Text: URL" for better readability on X
            clean_content = re.sub(r'\[(.*?)\]\((https?://.*?)\)', r'\1: \2', clean_content)

            # Remove Markdown bold/italic
            clean_content = clean_content.replace('**', '').replace('__', '').replace('*', '')

            # For X Premium users, we allow full content length.
            # Twitter API v2 will accept it if the account has Note Tweets enabled.
            final_text = clean_content.strip()

            response = await loop.run_in_executor(
                None,
                lambda: client.create_tweet(text=final_text, media_ids=media_ids if media_ids else None)
            )
            
            tweet_id = response.data.get("id")
            logger.info(f"✅ X Posting Successful: Tweet ID {tweet_id}")
            
            return {
                "status": "success", 
                "platform": "x", 
                "msg": f"Successfully posted to X! Tweet ID: {tweet_id}",
                "tweet_id": tweet_id
            }
            
        except tweepy.errors.Forbidden as e:
            logger.error(f"❌ X API Forbidden (Auth Error): {e}")
            return {"error": "X API Permission Error: Ensure your App has 'Read and Write' permissions in Developer Portal."}
        except tweepy.errors.Unauthorized as e:
            logger.error(f"❌ X API Unauthorized (Invalid Keys): {e}")
            return {"error": "X API Auth Error: Invalid API Keys or Access Tokens. Please re-check."}
        except Exception as e:
            logger.error(f"❌ X Posting failed: {e}")
            return {"error": f"X API error: {e!s}"}

    async def _post_to_telegram(self, partner: Partner, content: str, image_path: str | None) -> dict[str, Any]:
        if not partner.telegram_channel_id:
            return {"error": "Telegram Channel ID missing. Please configure it in API Setup."}
        
        channels = self._prepare_telegram_channels(partner.telegram_channel_id)
        if not channels:
            return {"error": "No valid Telegram channels found."}

        formatted_content = self._format_telegram_content(content)
        results = []
        success_count = 0
        
        full_image_path = self._resolve_image_path(image_path) if image_path else None
        
        if full_image_path:
            if not os.path.exists(full_image_path):
                logger.error(f"❌ Image path resolved to {full_image_path} but file DOES NOT EXIST. Working dir: {os.getcwd()}")
            else:
                logger.info(f"✅ Image found at {full_image_path}")

        if full_image_path and os.path.exists(full_image_path):
            for channel_id in channels:
                # If content is too long for a caption (1024 chars), send photo first, then text
                if len(formatted_content) > 1000:
                    # Send photo with a short intro teaser
                    teaser = formatted_content[:200].rsplit(' ', 1)[0] + "..."
                    await self._send_telegram_photo(channel_id, full_image_path, teaser)
                    # Then send the full formatted message immediately after
                    success = await self._send_telegram_message(channel_id, formatted_content)
                else:
                    success = await self._send_telegram_photo(channel_id, full_image_path, formatted_content)

                if success: success_count += 1
                results.append(f"{'✅' if success else '❌'} {channel_id}")
        else:
            if full_image_path:
                logger.warning(f"⚠️ Image not found at {full_image_path}, sending text only.")
            for channel_id in channels:
                success = await self._send_telegram_message(channel_id, formatted_content)
                if success: success_count += 1
                results.append(f"{'✅' if success else '❌'} {channel_id}")

        if success_count == 0:
            return {
                "error": f"Failed to publish to any Telegram channels. Ensure Bot is Admin in {', '.join(channels)}.",
                "details": results
            }

        return {
            "status": "success",
            "platform": "telegram",
            "msg": f"Post attempt complete: {', '.join(results)}",
            "details": results
        }

    def _prepare_telegram_channels(self, channel_id_str: str) -> list[str]:
        import json
        channels = []
        try:
            if channel_id_str.strip().startswith("["):
                channels = json.loads(channel_id_str)
            else:
                channels = [channel_id_str]
        except Exception:
            channels = [channel_id_str]
        return sorted(list(set([ch.strip() for ch in channels if ch and ch.strip()])))

    def _format_telegram_content(self, content: str) -> str:
        import re
        content = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', content)
        content = re.sub(r'_(.*?)_', r'<i>\1</i>', content)
        content = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2">\1</a>', content)
        
        # Determine if we need to fix paragraph spacing
        # If there are NO double newlines, but multiple single newlines, assume they meant paragraphs
        # We use a regex to look for single newlines that are NOT surrounded by other newlines
        if '\n\n' not in content and '\n' in content:
            # Replace single newline with double newline, but protect existing doubles (though check says none exist)
            # Using lookaround to only match isolated newlines
            content = re.sub(r'(?<!\n)\n(?!\n)', '\n\n', content)
        
        return content

    def _resolve_image_path(self, image_path: str) -> str:
        import os
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        if "generated_media" in image_path:
            filename = image_path.split("/")[-1]
            return os.path.join(backend_dir, "generated_media", filename)
        filename = image_path.lstrip('/').replace("images/", "")
        return os.path.join(backend_dir, "app_images", filename)

    async def _send_telegram_photo(self, channel_id: str, image_path: str, content: str) -> bool:
        from aiogram.types import FSInputFile

        from bot import bot
        try:
            photo = FSInputFile(image_path)
            await bot.send_photo(
                chat_id=channel_id,
                photo=photo,
                caption=content[:1024],
                parse_mode="HTML"
            )
            return True
        except Exception as e:
            logger.error(f"Failed to post photo to {channel_id}: {e}")
            return False

    async def _send_telegram_message(self, channel_id: str, content: str) -> bool:
        from bot import bot
        try:
            await bot.send_message(
                chat_id=channel_id,
                text=content[:4096],
                parse_mode="HTML"
            )
            return True
        except Exception as e:
            logger.error(f"Failed to post message to {channel_id}: {e}")
            return False

    async def _post_to_linkedin(self, partner: Partner, content: str, image_path: str | None) -> dict[str, Any]:
        if not partner.linkedin_access_token:
            return {"error": "LinkedIn API not configured. Upgrade to ELITE integration required."}
        # Simulation for now as LinkedIn requires formal App approval and OAuth flow
        return {"status": "success", "platform": "linkedin", "msg": "Syndicated to LinkedIn Network (PRO Simulation)"}

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
        """
        Audit logging to AI Marketing Studio Log with detailed time and cost tracking.
        Logs each generation with comprehensive metrics for performance monitoring.
        """
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
                    # Try to get by name first, fallback to GID
                    try:
                        self._gs_sheet_cache[cache_key] = spreadsheet.worksheet("AI Marketing Studio Log")
                        logger.info("✅ Using 'AI Marketing Studio Log' sheet")
                    except:
                        self._gs_sheet_cache[cache_key] = spreadsheet.get_worksheet_by_id(int(gid))
                        logger.info(f"✅ Using sheet GID: {gid}")
                return self._gs_sheet_cache[cache_key]

            # Offload blocking GS API calls to thread pool
            sheet = await loop.run_in_executor(None, get_sheet_sync)
            
            if sheet:
                # Calculate costs (OpenAI GPT-4 pricing: $0.01/1K input, $0.03/1K output tokens)
                # Simplified: assuming avg 50/50 split, ~$0.02/1K tokens
                openai_cost = (tokens_openai / 1000) * 0.015
                
                # Imagen 4.0 pricing: ~$0.004 per image
                imagen_cost = 0.004 if image_url else 0.0
                
                total_cost = openai_cost + imagen_cost
                
                # Calculate time components (estimate based on parallel execution)
                # Duration is total time, but we can estimate breakdown
                text_time = duration * 0.45  # ~45% of time
                image_time = duration * 0.50  # ~50% of time
                
                # Current timestamp
                timestamp = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")
                
                # Enhanced row format with time and cost tracking
                row = [
                    # Basic Info
                    timestamp,
                    f"@{partner.username or partner.telegram_id}",
                    str(partner.id),
                    
                    # Generation Config
                    topic,
                    audience,
                    language,
                    
                    # Performance Metrics
                    f"{duration:.2f}",  # Total time in seconds
                    f"{text_time:.2f}",  # Text gen time (est)
                    f"{image_time:.2f}",  # Image gen time (est)
                    
                    # Cost Tracking
                    f"{total_cost:.4f}",  # Total cost in USD
                    f"{openai_cost:.4f}",  # OpenAI cost
                    f"{imagen_cost:.4f}",  # Imagen cost
                    
                    # Token Usage
                    tokens_openai,
                    tokens_gemini,
                    
                    # Content
                    title[:100],  # Truncate title
                    len(body),  # Body length
                    "Yes" if image_url else "No",  # Image generated?
                    image_url or "N/A",
                    
                    # Status
                    "SUCCESS"
                ]
                
                # Append row to sheet (thread executor)
                await loop.run_in_executor(None, lambda: sheet.append_row(row, value_input_option='USER_ENTERED'))
                
                logger.info(
                    f"✅ Logged to AI Marketing Studio: "
                    f"Duration={duration:.2f}s, Cost=${total_cost:.4f}, "
                    f"User=@{partner.username or partner.id}"
                )
        except Exception as e:
            logger.error(f"❌ Failed to log to Google Sheets: {e}")

# Singleton
viral_studio = ViralMarketingStudio()

@broker.task(task_name="log_viral_generation_task")
async def log_viral_generation_task(
    partner_id: int,
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
    """Background task to log viral content generation to Google Sheets."""
    from sqlalchemy.orm import sessionmaker
    from sqlmodel.ext.asyncio.session import AsyncSession

    from app.models.partner import Partner, engine
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        partner = await session.get(Partner, partner_id)
        if not partner:
            return
            
        await viral_studio.log_generation_to_sheets(
            partner=partner,
            topic=topic,
            audience=audience,
            language=language,
            openai_prompt=openai_prompt,
            gemini_prompt=gemini_prompt,
            duration=duration,
            tokens_openai=tokens_openai,
            tokens_gemini=tokens_gemini,
            title=title,
            body=body,
            image_url=image_url
        )

@broker.task(task_name="log_rss_to_sheets_task")
async def log_rss_to_sheets_task(news_items: list[dict]):
    """Background task to log RSS news items to Google Sheets."""
    await viral_studio.log_rss_to_sheets(news_items)
