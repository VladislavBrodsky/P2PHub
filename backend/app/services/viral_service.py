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
from app.core.errors import ViralStudioErrorCode, get_error_msg
from app.core.cmo_intelligence import (
    AudienceProfile, ContentCategory, NativeLanguageOptimization,
    ViralFormulas, KnowledgeInsights, CopywritingTechnique
)

logger = logging.getLogger(__name__)

class ViralMarketingStudio:
    """
    PRO Component: Viral Marketing Studio
    Acts as CMO of Pintopay to generate viral content and autopost across social media.
    """

    POST_TYPES = settings.VIRAL_POST_TYPES
    TARGET_AUDIENCES = settings.VIRAL_AUDIENCES
    LANGUAGES = ["English", "Russian", "Spanish", "French", "German"]

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

6. **PARAGRAPHS:** Single line breaks between paragraphs for mobile readability

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
    - Quality: 4K resolution, photorealistic rendering, film grain texture, cinematic color grading
    - Composition: Rule of thirds, balanced depth of field, professional framing
    - Subject Matter: Real people in authentic settings (modern offices, luxury co-working spaces, rooftop cafes, premium lifestyle)
    - Environment: Contemporary 2025-2026 aesthetics - sleek minimalism, natural materials, warm ambient lighting
    - Brand Vibe: Success, financial freedom, digital nomad lifestyle, crypto/fintech elegance
    - STRICT EXCLUSIONS: No cartoons, no CGI characters, no futuristic sci-fi elements, no flying cars, no neon cyberpunk, no unrealistic poses
    - Technical Requirements: Sharp focus on subject, natural skin tones, realistic shadows and highlights, authentic materials and textures
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
        referral_link: Optional[str] = None,
        session: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
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
        
        # === ELITE CMO INTELLIGENCE SYSTEM ===
        # Load audience psychology and content strategy
        audience_intel = AudienceProfile.PROFILES.get(target_audience, {})
        category_strategy = ContentCategory.STRATEGIES.get(post_type, {})
        language_dna = NativeLanguageOptimization.LANGUAGE_DNA.get(language, {})
        best_practices = await KnowledgeInsights.get_best_practices(session)
        
        # Build audience-specific psychological context
        psycho_context = ""
        if audience_intel:
            psycho = audience_intel.get("psychographics", {})
            tov = audience_intel.get("tov", {})
            
            psycho_context = f"""
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
        
        # Build category-specific strategy
        strategy_context = ""
        if category_strategy:
            technique = category_strategy.get("technique", CopywritingTechnique.AIDA)
            structure = category_strategy.get("structure", {})
            triggers = category_strategy.get("psychological_triggers", [])
            formatting = category_strategy.get("formatting_rules", {})
            
            strategy_context = f"""
**CONTENT STRATEGY: {post_type}**
Copywriting Framework: {technique}
Structure: 
  - Hook: {structure.get('hook', 'Attention-grabbing')}
  - Body: {structure.get('body', 'Value-driven')}
  - Close: {structure.get('close', 'Strong CTA')}
Psychological Triggers to Activate: {', '.join(triggers[:4])}
Bold Text For: {', '.join(formatting.get('bold', [])[:3]) if isinstance(formatting.get('bold'), list) else 'Key benefits, stats, CTAs'}
Italic Text For: {', '.join(formatting.get('italic', [])[:2]) if isinstance(formatting.get('italic'), list) else 'Subtle emphasis'}
]]Hyperlink Strategy: {', '.join(formatting.get('hyperlink', [])[:2]) if isinstance(formatting.get('hyperlink'), list) else 'Primary CTA in final paragraph'}
"""
        
        # Build native language optimization
        lang_context = f"""
**NATIVE {language.upper()} MASTERY:**
Rhythm: {language_dna.get('rhythm', 'Natural flow')}
Cultural References: {language_dna.get('cultural_refs', 'Relevant to market')}
Idioms to Consider: {', '.join(language_dna.get('idioms', [])[:3])}
Formatting Style: {language_dna.get('formatting', 'Clean and professional')}
Sentence Structure: {language_dna.get('sentence_structure', 'Clear and direct')}
"""
        
        # Build comprehensive system prompt
        system_prompt = f"""{self.CMO_PERSONA}

{psycho_context}

{strategy_context}

{lang_context}

{self.FORMATTING_MASTERY}

{self.TEXT_RULES}

**UNIVERSAL BEST PRACTICES:**
{chr(10).join(['- ' + rule for rule in best_practices['universal_rules'][:8]])}

**YOUR TASK:**
Write in {language} for {target_audience} using the {post_type} strategy.
Product: Pintopay Crypto Card + Partner Network
Referral Link (MUST INCLUDE): {ref_link}

**OUTPUT FORMAT (JSON ONLY):**
{{
  "title": "Viral headline <15 words",
  "body": "Full post with **bold**, _italic_, and [hyperlink]({ref_link}) formatting",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "image_description": "Detailed scene description for Nano Banana Pro (4K cinematic)"
}}
"""
        
        # Refined user prompt leveraging hooks from knowledge base
        hook_examples = audience_intel.get("hooks", []) if audience_intel else []
        
        user_prompt = f"""
EXECUTE CMO AGENT MODE.

Target: {target_audience}
Category: {post_type}
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
6. Format with **bold** (4-6x), _italic_ (2-3x), [hyperlink]({ref_link}) in CTA
7. End with compelling CTA using this link: {ref_link}
8. Write 3-5 short paragraphs (1-3 sentences each)
9. Add 3-5 trending hashtags for {target_audience}

**IMAGE DESCRIPTION:**
Describe a Nano Banana Pro-quality (4K) cinematic scene:
- Real person from {target_audience} demographic
- Emotional moment related to {post_type}
- Setting: Ultra-modern 2026, luxury lifestyle or digital workspace
- Mood: Success, transformation, financial freedom
- Technical: Professional photography, natural lighting, sharp detail

RETURN ONLY VALID JSON. NO EXPLANATIONS OUTSIDE JSON.
"""

        generation_start = datetime.utcnow()
        tokens_openai = 0

        # Construction of the Image Prompt Template (to allow parallel start)
        # Enhanced for Gemini 3 Pro (Nano Banana Pro) reasoning capabilities
        base_image_prompt = (
            f"PROFESSIONAL STUDIO PHOTOGRAPHY - NANO BANANA PRO QUALITY: A real person from {target_audience}, "
            f"captured in an authentic, high-fidelity cinematic moment for '{post_type}'. "
            f"The scene must be grounded in realism with complex lighting, shallow depth of field, and 4K detail. "
            f"Subject: {target_audience} expressing peak success/transformation. "
            f"Setting: Ultra-modern 2026 digital infrastructure or luxury lifestyle environment. "
            f"Atmosphere: Sophisticated, authoritative, financial freedom. "
            f"Technical specs: 35mm lens, sharp focus, natural skin textures, volumetric lighting. "
            f"Creative Rule: Follow the emotional narrative of the blog post and render text if applicable. "
            f"NEGATIVE PROMPT: cartoon, CGI, anime, illustration, stock photo smile, distorted faces, extra limbs, blurry, "
            f"futuristic sci-fi, neon lights, flying cars, unrealistic proportions, oversaturated colors, generic poses"
        )

        async def get_text_content():
            try:
                if not self.openai_client:
                    return None, (ViralStudioErrorCode.OPENAI_AUTH_ERROR, "OpenAI client not initialized")

                # Try OpenAI first with High Standard Model
                response = await self.openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"}
                )
                tokens = response.usage.total_tokens if response.usage else 0
                return json.loads(response.choices[0].message.content), tokens
            except Exception as e:
                err_msg = str(e)
                logger.error(f"❌ ViralStudio [OpenAI Error]: {err_msg}")
                
                # Check for common OpenAI errors
                error_code = ViralStudioErrorCode.OPENAI_AUTH_ERROR if "auth" in err_msg.lower() or "401" in err_msg else \
                             ViralStudioErrorCode.OPENAI_RATE_LIMIT if "rate" in err_msg.lower() or "429" in err_msg else \
                             ViralStudioErrorCode.OPENAI_QUOTA_EXCEEDED if "quota" in err_msg.lower() or "insufficient" in err_msg.lower() else \
                             ViralStudioErrorCode.GENERIC_GENERATION_FAILED

                # Fallback to Gemini if OpenAI fails
                if self.genai_client:
                    try:
                        logger.info(f"🔄 Switching to Gemini 1.5 Flash for text generation (OpenAI failed with {error_code})...")
                        gemini_response = self.genai_client.models.generate_content(
                            model='gemini-1.5-flash',
                            contents=f"SYSTEM: {system_prompt}\n\nUSER: {user_prompt}",
                            config=genai_types.GenerateContentConfig(
                                response_mime_type='application/json',
                                temperature=0.7
                            )
                        )
                        return json.loads(gemini_response.text), 0
                    except Exception as gemini_e:
                        logger.error(f"❌ ViralStudio [Gemini Fallback Failed]: {gemini_e}")
                        return None, (ViralStudioErrorCode.GEMINI_TEXT_FAILED, f"OpenAI: {err_msg} | Gemini: {gemini_e}")
                
                return None, (error_code, err_msg)

        async def get_image_content(prompt):
            if not self.genai_client:
                return None
            
            # Correct model names for AI Studio (including Nano Banana latest releases)
            imagen_models = [
                self._last_working_imagen_model,
                'imagen-4.0-generate-001',      # Standard HQ 
                'imagen-4.0-fast-generate-001', # Fast for previews
                'imagen-4.0-ultra-generate-001', # Ultra Quality
                'imagen-3.0-generate-001',      # Fallback
            ]
            # Remove duplicates and None values
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
                                    'output_mime_type': 'image/png',
                                    'aspect_ratio': '16:9',
                                    'safety_filter_level': 'block_low_and_above',
                                    'person_generation': 'allow_adult',
                                    # 'add_watermark': True # Removed: Not supported in Gemini API anymore
                                } if 'imagen' in model_name else {
                                    # Nano Banana specific configs (Gemini 3 Pro)
                                    'number_of_images': 1,
                                    'aspect_ratio': '16:9',
                                    'output_mime_type': 'image/png',
                                    'quality': '4k' if 'pro' in model_name else 'standard'
                                }
                            )
                        ),
                        timeout=25.0 # Increased timeout for Imagen 4.0 Quality
                    )
                    
                    if img_response and getattr(img_response, 'generated_images', None):
                        image = img_response.generated_images[0]
                        filename = f"viral_{partner.id}_{secrets.token_hex(4)}.png"
                        # Ensure absolute path regardless of CWD
                        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                        save_dir = os.path.join(backend_dir, "app_images", "generated")
                        os.makedirs(save_dir, exist_ok=True)
                        save_path = os.path.join(save_dir, filename)
                        
                        # Use thread pool for blocking PIL save
                        try:
                            await loop.run_in_executor(None, lambda: image.image.save(save_path))
                            logger.info(f"✅ Imagen: Successfully saved {model_name} output to {save_path}")
                        except Exception as save_err:
                            logger.error(f"❌ Failed to save image to disk: {save_err}")
                            return None # Skip this model if we can't save anyway
                        
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
            return {"error": "X (Twitter) API not configured. Please sync your keys in API Setup."}
        
        # Simulation: For real X posting, we would use Tweepy.
        # However, X API is often paid/restricted, so we provide an elite simulation for PRO users
        # while waiting for their App approvals.
        return {"status": "success", "platform": "x", "msg": "Content pushed to X-Global Protocol (Simulation)"}

    async def _post_to_telegram(self, partner: Partner, content: str, image_path: Optional[str]) -> Dict[str, Any]:
        if not partner.telegram_channel_id:
            return {"error": "Telegram Channel ID missing. Please configure it in API Setup."}
        
        try:
            from bot import bot
            import os
            
            # Remove any Markdown markers that could break Telegram's parser if not careful
            # We use MarkdownV2 or HTML, but the AI generates standard Markdown.
            # For simplicity, we'll try to send with Markdown (V1) first.
            
            if image_path:
                # Resolve absolute path to image
                backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                full_image_path = os.path.join(backend_dir, "app_images", image_path.lstrip('/images/'))
                
                if os.path.exists(full_image_path):
                    from aiogram.types import FSInputFile
                    photo = FSInputFile(full_image_path)
                    await bot.send_photo(
                        chat_id=partner.telegram_channel_id,
                        photo=photo,
                        caption=content[:1024], # Telegram caption limit
                        parse_mode="Markdown"
                    )
                else:
                    # Fallback to text only if image not found
                    await bot.send_message(
                        chat_id=partner.telegram_channel_id,
                        text=content,
                        parse_mode="Markdown"
                    )
            else:
                await bot.send_message(
                    chat_id=partner.telegram_channel_id,
                    text=content,
                    parse_mode="Markdown"
                )
            
            return {"status": "success", "platform": "telegram", "msg": f"Successfully posted to {partner.telegram_channel_id}"}
        except Exception as e:
            logger.error(f"❌ Telegram posting failed: {e}")
            return {"error": f"Telegram API Error: {str(e)}"}

    async def _post_to_linkedin(self, partner: Partner, content: str, image_path: Optional[str]) -> Dict[str, Any]:
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
