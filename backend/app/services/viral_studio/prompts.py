import random
from typing import Any

from app.core.cmo_intelligence import (
    AudienceProfile,
    ContentCategory,
    NativeLanguageOptimization,
    ToneIntelligence,
)

from .constants import (
    CMO_PERSONA,
    FORMATTING_MASTERY,
    IMAGE_RULES,
    LUXURY_SCENE_POOL,
    STORYTELLING_PROTOCOL,
    TEXT_RULES,
    VISUAL_GRADING_MAP,
)


def build_viral_audience_intel(target_audience: str, post_type: str, language: str) -> dict[str, Any]:
    return {
        "audience": AudienceProfile.PROFILES.get(target_audience, {}),
        "strategy": ContentCategory.STRATEGIES.get(post_type, {}),
        "dna": NativeLanguageOptimization.LANGUAGE_DNA.get(language, {})
    }

def build_viral_system_prompt(language, target_audience, post_type, tone, ref_link, intel, best_practices, resonance_data=None, story_history=None, brand_mention=True) -> str:
    audience_intel = intel["audience"]
    category_strategy = intel["strategy"]
    language_dna = intel["dna"]
    
    psycho_context = _build_audience_context(target_audience, audience_intel)
    strategy_context = _build_strategy_context(post_type, category_strategy)
    lang_context = _build_language_context(language, language_dna)
    
    # Platform-specific and Language-specific calibration
    cta_text = "Присоединиться к сети" if language == "Russian" else "Join the Network"
    
    # 🎯 VIRAL HASHTAG ENGINE V2.0 (Dynamic & Multi-Parameter)
    audience_tags = audience_intel.get("viral_hashtags", [])
    strategy_tags = category_strategy.get("viral_hashtags", [])
    tone_tags = ToneIntelligence.TONES.get(tone.lower(), {}).get("viral_hashtags", [])
    
    # Combine all relevant tags and ensure uniqueness
    all_potential_hashtags = list(set(audience_tags + strategy_tags + tone_tags))
    if not all_potential_hashtags:
        # Fallback if none found
        all_potential_hashtags = ["#PintopayPRO", "#FinancialFreedom", "#ViralGrowth"]
    
    # SEO Intelligence Calibration
    audience_seo = audience_intel.get("performing_keywords_2026", [])
    strategy_seo = category_strategy.get("seo_keywords", [])
    tone_seo = ToneIntelligence.TONES.get(tone.lower(), {}).get("seo_keywords", [])
    list(set(audience_seo + strategy_seo + tone_seo))

    resonance_context = ""
    if resonance_data and "top_resonance_segments" in resonance_data:
        recs = resonance_data["top_resonance_segments"][:2]
        if recs:
            resonance_context = "**PREDICTIVE RESONANCE CALIBRATION (CRITICAL):**\n"
            resonance_context += "The following patterns have shown high engagement for this user:\n"
            for r in recs:
                resonance_context += f"- Hook Pattern: {r['headline']} (Engagement Boost: {r['resonance_score']})\n"
            resonance_context += "\nCalibrate your content specifically to mimic these winners while maintaining novelty."

    universal_rules_str = ""
    if best_practices and 'universal_rules' in best_practices:
        universal_rules_str = "\n".join(['- ' + rule for rule in best_practices['universal_rules'][:8]])

    story_context = ""
    chapter_rule_system = "DO NOT write 'Chapter X' or 'Episode X' anywhere in the output."
    
    # Activate storytelling if user has history OR explicitly chose story/empathy tone
    is_story_tone = tone and ("empath" in tone.lower() or "story" in tone.lower())
    should_activate_story = is_story_tone or (story_history and len(story_history) > 0)

    if should_activate_story:
        chapter_rule_system = "Use 'Episode X' or 'Chapter X' natively in your output. Maintain narrative continuity."
        story_context += "**EMPATHETIC (STORY) - LONG STORY PROTOCOL:**\n"
        story_context += "Create a viral, engaging, episodic 'Long Story'.\n"
        story_context += "Themes to weave in: Global Financial Transformation, Web3 Finance, Crypto Cards, Borderless Payments, $1 per Minute strategy, Viral Community Growth, Growth Hacks, x100 Viral Growth with AI Marketing Studio and Automated Content Generation 24/7.\n"
        if story_history and len(story_history) > 0:
            story_context += "PREVIOUS EPISODES SUMMARY:\n"
            for ep in story_history[-3:]:
                story_context += f"- Ep {ep.get('Episode')}: {ep.get('Title')} ({ep.get('Summary')})\n"
            next_ep = len(story_history) + 1
            story_context += f"\nNow, write **Episode {next_ep}**.\n"
        else:
            story_context += "\nNow, write **Episode 1** to hook the audience.\n"

    return f"""{CMO_PERSONA}

{psycho_context}

{strategy_context}

{lang_context}
{resonance_context}

{FORMATTING_MASTERY}

{TEXT_RULES}
{STORYTELLING_PROTOCOL}

**UNIVERSAL BEST PRACTICES:**
{universal_rules_str}

**YOUR TASK:**
Write a HUMANIZED, NATIVE-level post in {language} for {target_audience} using the {post_type} strategy.
Persona Tone: {tone.upper()}
Product: {"Pintopay Ecosystem (Crypto Cards & Partner Center)" if brand_mention else "A sovereign, borderless wealth ecosystem (DO NOT MENTION PINTOPAY BY NAME)"}
Referral Link (MANDATORY): {ref_link}

**BRANDING & CTA STRATEGY:**
{"EXPLICIT: You MUST mention 'Pintopay' naturally in the narrative." if brand_mention else "BETWEEN THE LINES: DO NOT mention the word 'Pintopay'. Sell the lifestyle, the autonomy, and the geometric growth results instead."}
CRITICAL: Even when selling 'Between the Lines', you MUST include the Referral Link with a high-status, FOMO-driven CTA.

**CTA VARIATION PROTOCOL:**
Do NOT use 'Join the Network' repeatedly. Use elite, varied, and deadline-oriented CTAs. Examples of high-conversion anchor text:
- Secure My Slot
- Initiate My Protocol
- Bridge to Independence
- Join the Sovereign Elite
- Final 24 Hours to Pivot
- Claim My Alpha Advantage
- Locked in My Velocity

**CRITICAL INSTRUCTION: LENGTH & FORMATTING.**
Generate the entire content (title, body) as a single coherent narrative. DO NOT split the message into multiple parts.
The TOTAL length of the 'body' MUST be strictly between 700 and 1000 characters (symbols). This is critical for depth while remaining readable on mobile.
{chapter_rule_system} Use elite copywriting techniques (e.g., the 'Between the Lines' sales technique).

**CRITICAL LANGUAGE INSTRUCTION:**
All output (title, body, hashtags) MUST be in {language}. 
Write as a high-status NATIVE {language} CMO embodying the **{audience_intel.get('archetype', 'Visionary')}** archetype. Every word must feel earned, authentic, and sophisticated.
Your primary objective is to satisfy the audience's hidden need: **{audience_intel.get('hidden_need', 'Autonomy')}**.

**OUTPUT FORMAT (JSON ONLY):**
**CRITICAL FORMATTING RULE:** NEVER use _underscore_ formatting for italics. It renders literally on X (Twitter) and Telegram. Use CAPS for emphasis instead. Do NOT wrap brand names in underscores (e.g., write 'Pintopay' NOT '_Pintopay_').
{{
  "title": "A high-status strategic title <10 words",
  "body": "**[HUMANIZED ALPHA HOOK]**\\n\\n[Paragraph 1 - short, 1-2 sentences]\\n\\n[Paragraph 2 - short, 1-2 sentences]\\n\\n[Paragraph 3 - short, 1-2 sentences]\\n\\n**[{cta_text}]({ref_link})**",
"hashtags": "#Tag1 #Tag2 #Tag3" 
}}
(Choose exactly 2-4 unique hashtags. Output them ONLY in the 'hashtags' field. DO NOT include them in the 'body' string. This is a strict formatting rule to avoid duplication. {"Exclude #Pintopay from hashtags." if not brand_mention else ""})

"""

def build_viral_user_prompt(target_audience, post_type, language, tone, ref_link, intel, story_history=None, brand_mention=True) -> str:
    audience_intel = intel["audience"]
    category_strategy = intel["strategy"]
    hook_examples = audience_intel.get("hooks", []) if audience_intel else []
    audience_intel.get("tov", {}) if audience_intel else {}
    audience_intel.get("visual_base", "A successful person")
    category_strategy.get("visual_scene", "experiencing a transformation")
    
    "\n".join(['- ' + hook for hook in hook_examples[:2]])

    # 🎯 SEO & VIRAL HASHTAG PROTOCOL (CRITICAL)
    audience_tags = audience_intel.get("viral_hashtags", [])
    strategy_tags = category_strategy.get("viral_hashtags", [])
    tone_tags = ToneIntelligence.TONES.get(tone.lower(), {}).get("viral_hashtags", [])
    # Guarantee uniqueness of potential tags
    all_potential_hashtags = list(dict.fromkeys(audience_tags + strategy_tags + tone_tags))
    
    audience_seo = audience_intel.get("performing_keywords_2026", [])
    strategy_seo = category_strategy.get("seo_keywords", [])
    tone_seo = ToneIntelligence.TONES.get(tone.lower(), {}).get("seo_keywords", [])
    seo_keywords = list(set(audience_seo + strategy_seo + tone_seo))

    cta_fallback = "Присоединиться к сети" if language == "Russian" else "Join the Network"
    
    story_context = ""
    if story_history:
        recent_episodes = "\n".join([f"Ep {ep.get('Episode', '?')}: {ep.get('Title', '')} ({ep.get('Summary', '')})" for ep in story_history[-3:]])
        story_context = f"**STORY CONTINUATION CONTEXT:**\n{recent_episodes}\n(Pick up seamlessly from here, progressing the narrative arc.)"
        
    return f"""
EXECUTE ELITE CMO MODE (VERSION 2026).

**MISSION BRIEFING:**
Target: {target_audience}
Category: {post_type}
Style/Tone: {tone.upper()}
Language: {language} (Write as a sophisticated NATIVE speaker)
Referral Link: {ref_link}

**AUDIENCE INTELLIGENCE (USE THESE INSIGHTS):**
- Pain Points: {', '.join(audience_intel.get('psychographics', {}).get('pain_points', [])[:3])}
- Desires: {', '.join(audience_intel.get('psychographics', {}).get('desires', [])[:3])}
- Performing Keywords: {', '.join(seo_keywords)}

{story_context if story_history is not None else ''}

**HUMANIZATION & CM-LEVEL COPYWRITING:**
1. **DITCH THE CLICHES:** No "In today's world", no "Unlock potential". Write with the authority of someone who has managed $100M+ budgets.
2. **PATTERN INTERRUPT:** Start with a hook that stops the scroll. 
3. **SALES BY SUBTLETY:** {"Weave the product (Pintopay) into the narrative as an essential tool." if brand_mention else "Sell the TRANSFORMATION and the SOVEREIGNTY. DO NOT mention 'Pintopay' by name. Sell the idea between the lines."}
4. **EMOTIONAL RESONANCE:** Agitate a real, visceral pain point before presenting the elegant solution.
5. **NATIVE FLUENCY:** Use business idioms and cultural nuances specific to {language}.
6. **ARCHETYPE VOICE:** Embody the **{audience_intel.get('archetype', 'The Visionary')}** archetype. Speak to their hidden need for **{audience_intel.get('hidden_need', 'Autonomy')}**.

**STRUCTURE & FORMATTING:**
- Hook: **Bold**
- Paragraphs: 3-5 short, sharp blocks with double line breaks.
- CTA: Final line MUST be a high-conversion markdown link: **[Varied High-Status Anchor Text]({ref_link})**
- Hashtags: 2-4 unique tags. DO NOT include them in the body text. ONLY in the hashtags field.

**LENGTH PROTOCOL:**
Write a deep, meaningful transmission. Target length: 700-1000 characters. 
Do not worry about X (Twitter) limits for this synthesis—the system will handle distribution. Focus on RAW VALUE and EMOTIONAL IMPACT.

RETURN ONLY VALID JSON.
"""

# Gender pools for diverse image generation
_GENDER_VARIANTS = [
    {
        "label": "man",
        "subject": "a self-assured, high-status man",
        "descriptors": "sharp jawline, calm confidence, well-groomed",
    },
    {
        "label": "woman",
        "subject": "a poised, high-status woman",
        "descriptors": "elegant features, radiant confidence, effortlessly stylish",
    },
]


def build_viral_image_prompt(intel: dict, tone: str | None = None, post_content: str = "", brand_mention: bool = True) -> str:
    """
    Builds a high-status, photorealistic image prompt using a Layered Architecture.
    Layers: Foundation (Rules) -> Environment (Scene) -> Subject (Audience) -> Grading (Tone) -> Detail (Strategy)
    """
    audience_intel = intel.get("audience", {})
    category_strategy = intel.get("strategy", {})
    
    # ── 1. FOUNDATION LAYER (Global Rules) ──────────────────────────────────
    foundation = f"{IMAGE_RULES}\n"

    # ── 2. ENVIRONMENT LAYER (Strategic Scene) ──────────────────────────────
    audience_scenes = audience_intel.get("scene_pool", ["coworking"])
    strategy_scenes = category_strategy.get("scene_bias", ["luxury_life"])
    preferred_pool = [s for s in audience_scenes if s in strategy_scenes]
    fallback_pool = list(set(audience_scenes + strategy_scenes))
    final_pool = preferred_pool if preferred_pool else fallback_pool
    
    selected_scene_key = random.choice(final_pool)
    scene_description = LUXURY_SCENE_POOL.get(selected_scene_key, "An authoritative and sophisticated setting.")
    environment_layer = f"SCENE SETUP: {scene_description}\n"

    # ── 3. SUBJECT LAYER (Audience Identity) ────────────────────────────────
    audience_visual = audience_intel.get(
        "visual_base",
        "An authoritative and sophisticated individual of undeniable status.",
    )
    
    # Gender diversity injection
    gender = random.choice(_GENDER_VARIANTS)
    gender_directive = (
        f"CENTRAL SUBJECT: {gender['subject']} ({gender['descriptors']}). "
        f"This is a strict requirement — do not substitute with a group.\n"
    )
    
    # ── 3.1 BRAND INTEGRATION (Pintopay Card) ─────────────────────────────
    brand_layer = ""
    if brand_mention:
        brand_layer = (
            "PRODUCT FOCUS: A matte charcoal Pintopay Card with laser-etched details and a subtle charcoal titanium texture. "
            "It must be featured as an elite accessory — held elegantly, resting on a marble/leather surface, or catching the light. "
            "The card itself is a work of industrial art.\n"
        )
    else:
        brand_layer = "PRODUCT FOCUS: No explicit brand logos. Focus on the high-status lifestyle accessories: a luxury watch, a premium leather passport holder, or a sleek custom smartphone.\n"

    subject_layer = f"SUBJECT DESCRIPTION: {audience_visual}\n{gender_directive}{brand_layer}"

    # ── 4. GRADING & MOOD LAYER (Tone Resonance) ────────────────────────────
    # Fallback to 'authoritative' grading if tone is unknown
    tone_key = (tone or "authoritative").lower().split()[0] # Get first word (e.g. 'empathetic' from 'Empath')
    grading_instruction = VISUAL_GRADING_MAP.get(tone_key, VISUAL_GRADING_MAP["authoritative"])
    grading_layer = f"VISUAL DNA: {grading_instruction}\n"

    # ── 5. DETAIL LAYER (Contextual Strategy Hook) ─────────────────────────
    # Subtly inject the strategy-specific visual scene
    strategy_hook = category_strategy.get("visual_scene", "")
    detail_layer = f"CONTEXTUAL DETAIL: {strategy_hook}\n" if strategy_hook else ""
    
    if post_content:
        clean_content = post_content.replace("\n", " ")[:250]
        detail_layer += f"CONTENT THEME: {clean_content}\n"

    # ── ASSEMBLY ───────────────────────────────────────────────────────────
    return (
        f"{foundation}\n"
        f"{environment_layer}"
        f"{subject_layer}"
        f"{grading_layer}"
        f"{detail_layer}\n"
        f"EMOTION: High-status human resonance and deep authenticity. \n"
        f"ATMOSPHERE: Visionary breakthrough, calm authority, and absolute freedom. \n"
        f"SPECS: Photorealistic 8K, VIBRANT NATURAL COLORS, shallow depth of field, sharp focus on eyes, rich organic textures, award-winning luxury photography.\n"
        f"CRITICAL: DO NOT render any text, words, letters, or gibberish logos (except the Pintopay card details if mentioned). The image must be completely TEXT-FREE."
    )


def _build_audience_context(target_audience: str, audience_intel: dict) -> str:
    if not audience_intel:
        return ""
    psycho = audience_intel.get("psychographics", {})
    tov = audience_intel.get("tov", {})
    return f"""
**AUDIENCE DEEP DIVE: {target_audience}**
Archetype: {audience_intel.get('archetype', 'The Visionary')}
Hidden Need: {audience_intel.get('hidden_need', 'Autonomy')}
Performing Keywords (2026): {', '.join(audience_intel.get('performing_keywords_2026', []))}
Lead Magnets to Tease: {', '.join(audience_intel.get('lead_magnets', []))}
Pain Points: {', '.join(psycho.get('pain_points', [])[:3])}
Desires: {', '.join(psycho.get('desires', [])[:3])}
Values: {', '.join(psycho.get('values', []))}
Language Style: {tov.get('style', 'Professional')}
Formality: {tov.get('formality', 'Balanced')}
Power Words: {', '.join(tov.get('power_words', [])[:5])}
Emojis: {tov.get('emojis', '🚀')}
Sentence Structure: {tov.get('sentence_length', 'Varied')}
Key Triggers: {', '.join(psycho.get('triggers', [])[:3])}
Visual Identity: {audience_intel.get('visual_base', 'Professional and authoritative')}
"""

def _build_strategy_context(post_type: str, category_strategy: dict) -> str:
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
NOTE: Do NOT use _italic_ (underscores) formatting as it renders literally on social platforms.
Hyperlink Strategy: {', '.join(formatting.get('hyperlink', [])[:2]) if isinstance(formatting.get('hyperlink'), list) else 'Primary CTA in final paragraph'}
Visual Scene: {category_strategy.get('visual_scene', 'High-impact breakthrough')}
"""

def _build_language_context(language: str, language_dna: dict) -> str:
    return f"""
**NATIVE {language.upper()} MASTERY:**
Rhythm: {language_dna.get('rhythm', 'Natural flow')}
Cultural References: {language_dna.get('cultural_refs', 'Relevant to market')}
Idioms to Consider: {', '.join(language_dna.get('idioms', [])[:3])}
Formatting Style: {language_dna.get('formatting', 'Clean and professional')}
Sentence Structure: {language_dna.get('sentence_structure', 'Clear and direct')}
"""

def build_growth_advice_system_prompt(language: str) -> str:
    return f"""{CMO_PERSONA}

{FORMATTING_MASTERY}

{TEXT_RULES}

**MISSION:**
You are the Lead Growth Architect for Pintopay. Your goal is to analyze a partner's network metrics and provide elite, actionable strategy that turns them into a "Network Whale".

**OUTPUT FORMAT (JSON ONLY):**
{{
  "title": "A high-status strategic title <10 words",
  "body": "## [ANALYSIS: CURRENT STATUS]\\n\\n[Markdown formatted analysis of their metrics... describe their level, growth momentum, and critical bottlenecks]\\n\\n## [GROWTH TRANSFORMATION: 30-DAY HACKS]\\n\\n[Provide 3-4 specific, actionable 'Growth Hacks' with bolded key terms. Use paragraphs and bullet points for clarity.]\\n\\n**[MISSION OBJECTIVE]**\\n\\n[A final inspiring paragraph about their transformation.]"
}}

**CRITICAL RULES:**
1. All output MUST be in {language}.
2. Use ELITE markdown (## for headers, **bold** for emphasis).
3. DO NOT use underscores for italics.
4. Maintain the high-status, slightly provocative but deeply professional CMO persona.
"""

def build_growth_advice_user_prompt(partner_level: int, xp: int, total_size: int, l1: int, l2: int, earned: float, growth_7d: float, new_members_7d: int) -> str:
    return f"""
EXECUTE STRATEGIC AUDIT V4.2.

**METRICS DATA:**
- Current Level: {partner_level}
- XP: {xp}
- Total Network: {total_size}
- L1 (Directs): {l1}
- L2 (Indirects): {l2}
- L1/L2 Ratio: {l1/l2 if l2 > 0 else l1}:1
- Total Earned: {earned} USDT
- 7D Growth: {growth_7d}% (+{new_members_7d} members)

**TASK:**
Synthesize these numbers into a high-status growth strategy.
1. Identify the 'Invisible Ceiling' holding them back.
2. Provide 3-4 specific, actionable 'Alpha Hacks'.
3. Use the required JSON structure.
"""
