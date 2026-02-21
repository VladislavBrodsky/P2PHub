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
    STORYTELLING_PROTOCOL,
    TEXT_RULES,
)


def build_viral_audience_intel(target_audience: str, post_type: str, language: str) -> dict[str, Any]:
    return {
        "audience": AudienceProfile.PROFILES.get(target_audience, {}),
        "strategy": ContentCategory.STRATEGIES.get(post_type, {}),
        "dna": NativeLanguageOptimization.LANGUAGE_DNA.get(language, {})
    }

def build_viral_system_prompt(language, target_audience, post_type, tone, ref_link, intel, best_practices, resonance_data=None, story_history=None) -> str:
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
    chapter_rule_system = "DO NOT write 'Chapter X' anywhere in the output."
    if story_history is not None:
        chapter_rule_system = "Use 'Episode X' or 'Chapter X' natively in your output. Maintain narrative continuity."
        story_context += "**EMPATHETIC (STORY) - LONG STORY PROTOCOL:**\n"
        story_context += "Create a viral, engaging, episodic 'Long Story'.\n"
        story_context += "Themes to weave in: Global Financial Transformation, Web3 Finance, Crypto Cards, Borderless Payments, $1 per Minute strategy, Viral Community Growth, Growth Hacks, x100 Viral Growth with AI Marketing Studio and Automated Content Generation 24/7.\n"
        if story_history:
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
Product: Partner Center (Центр Партнеров) + Sovereign Ecosystem
Referral Link (MUST INCLUDE): {ref_link}

**CRITICAL INSTRUCTION: LENGTH, FORMATTING & HASHTAGS.**
Generate the entire content (title, body) as a single coherent narrative. DO NOT split the message.
The TOTAL length of the 'body' MUST be strictly between 700 and 900 characters (symbols). This is critical to fit perfectly in a Telegram photo caption while maximizing depth.
{chapter_rule_system} Use the best copywriting techniques (e.g., the 'Between the Lines' sales technique).

**CRITICAL LANGUAGE INSTRUCTION:**
All output (title, body, hashtags) MUST be in {language}. 
Write as a high-status NATIVE {language} leader. Every word must feel earned and authentic.

**OUTPUT FORMAT (JSON ONLY):**
{{
  "title": "A high-status strategic title <10 words",
  "body": "**[Strategic Title]**\\n\\n**[HUMANIZED ALPHA HOOK]**\\n\\n[Paragraph 1 - short, 1-2 sentences]\\n\\n[Paragraph 2 - short, 1-2 sentences]\\n\\n[Paragraph 3 - short, 1-2 sentences]\\n\\n**[{cta_text}]({ref_link})**",
  "hashtags": "#Tag1 #Tag2 #Tag3 #Tag4" 
}}
(Choose exactly 2-4 most viral, strictly unique hashtags from: {', '.join(all_potential_hashtags)}. DO NOT repeat them. Output them in exactly 1 line separated by spaces. Do NOT include hashtags in the body itself.)

"""

def build_viral_user_prompt(target_audience, post_type, language, tone, ref_link, intel, story_history=None) -> str:
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
EXECUTE GLOBAL PARTNER ARCHITECT MODE.

Target: {target_audience}
Category: {post_type}
Style/Tone: {tone.upper()}
Language: {language} (write as NATIVE HUMAN speaker)
Referral Link: {ref_link}

**HUMANIZATION & ADVANCED COPYWRITING PROTOCOL (CRITICAL):**
1. **NO AI CLICHES:** Avoid empty jargon like "In the rapidly evolving world...", "Unlock your potential...", or "Here's the secret...". Every word must be deliberately chosen to provide deep, super intelligent value.
2. **PERSONAL VOICE & UNIQUE THOUGHT:** Write as if you are sending a private, high-status note to a trusted partner. Bring unique mental models (e.g., asymmetric risk, liquidity fragmentation, sovereign mechanics). Use "I built this because...", "We are seeing a shift...", "This is why I moved...".
3. **SOUL & RHYTHM:** Use varying sentence lengths. Use silence/breaks for impact. Your copywriting must be elite, advanced, and uniquely differentiated from standard marketing.
4. **ADVANCED TRANSLATION:** If writing in a non-English language, do NOT simply translate. Localize the concepts using highly advanced, native-level business slang, cultural fluency, and unparalleled phrasing.
5. **NO SPLITTING:** The final generation MUST be a complete, unified message. Title + Body + CTA + Hashtags in ONE JSON response.
{("5. **STORY CONTINUITY:** Make an attractive template for this story. Continue the episodes seamlessly with strong hooks." if story_history is not None else "5. **NO CHAPTER HEADINGS:** DO NOT write 'Chapter 1:' or 'Chapter X:' or any other chapter headings. This is absolutely forbidden.")}

**VIRAL & SEO CALIBRATION:**
1. **GOLDEN FORMATTING RULES:** 
   - ALWAYS make the Title, Hook, and CTA strictly **bold**. 
   - Split text into 3-5 distinct short paragraphs (1-3 sentences maximum per paragraph) with double line breaks for mobile readability.
   - 🚫 ABSOLUTELY NO weird markdown asterisks (e.g., *Passive Income System* or *Sovereign Abundance*) around random words. Keep the text naturally clean.
   - 🎯 EMOJIS: Place emojis ONLY at the beginning of a paragraph or sentence. NEVER at the end of a sentence or paragraph. Use 1-2 maximum.
2. **HASHTAGS:** Strict limit of 2-4 UNIQUE hashtags in one line. Do not put them in the body text or use them inline. ALL hashtags MUST be translated into {language} (e.g. if Russian, use Russian text in the hashtag, not English).
3. **SEO OPTIMIZATION:** Naturally integrate these high-performing keywords: {', '.join(seo_keywords)}.

**STORYTELLING CONTEXT:**
Arc: {category_strategy.get('storytelling', {}).get('arc', 'General Transformation')}
Focus: {category_strategy.get('storytelling', {}).get('chapter_focus', 'None')}
{story_context if story_history is not None else ''}

**CONTENT REQUIREMENTS (2026 HUMANIZED PROTOCOL):**
1. **KEYWORD INTELLIGENCE:** Integrate high-performing keywords for {target_audience}: {', '.join(audience_intel.get('performing_keywords_2026', []))}. Use them naturally.
2. **SALES BETWEEN THE LINES (Copywriter Strategy):** Master subtle persuasion. Do not pitch directly. Instead, provide immense value, and subtly weave in the "Pintopay Crypto Card" or "Partner Center" as the *obvious* tool or 'secret weapon' to solve the problem. Position it as a smart money move.
3. **EMOTION:** Start by mirroring the audience's deep internal monologue or pain point.
4. **ENGAGEMENT architecture:** End with a provocative thought, FOMO, or a "Signal Request".
5. **CTA:** The final line MUST be: **[{cta_fallback}]({ref_link})**
6. **TOTAL LENGTH LIMIT (ABSOLUTE CRITICAL):** Keep the ENTIRE body text under **700 characters**. Telegram's strict limit is 1024 characters, and you MUST always write at least 20% fewer characters than the absolute limit to account for spacing, emojis, and link structures. If you exceed 750 characters, the system will fail. Count your characters and keep it short, punchy, and dense.
RETURN ONLY VALID JSON. NO EXPLANATIONS OUTSIDE JSON.
"""

def build_viral_image_prompt(intel: dict, post_content: str = "") -> str:
    audience_intel = intel.get("audience", {})
    category_strategy = intel.get("strategy", {})
    
    audience_desc = audience_intel.get("visual_base", "An authoritative and sophisticated individual of undeniable status.")
    scene_desc = category_strategy.get("visual_scene", "navigating a moment of high-stakes breakthrough in a private, ultra-modern setting.")

    # Extract core theme from content if provided
    theme_context = ""
    if post_content:
        # Use a short snippet to guide the AI without over-complicating
        clean_content = post_content.replace("\n", " ")[:250]
        theme_context = f"CONTEXTUAL THEME: {clean_content}\n"

    return (
        f"{IMAGE_RULES}\n\n"
        f"SCENE SETUP: {audience_desc} {scene_desc} \n"
        f"{theme_context}"
        f"EMOTION: Professional focus, calm authority, and visionary breakthrough. \n"
        f"LIGHTING: Masterful cinematic lighting. \n"
        f"SPECS: Photorealistic 8K, depth of field, sharp focus on eyes, rich textures, award-winning photography.\n"
        f"CRITICAL: DO NOT render any text, words, letters, logos, or titles in the image. The image must be completely TEXT-FREE."
    )


def _build_audience_context(target_audience: str, audience_intel: dict) -> str:
    if not audience_intel:
        return ""
    psycho = audience_intel.get("psychographics", {})
    tov = audience_intel.get("tov", {})
    return f"""
**AUDIENCE DEEP DIVE: {target_audience}**
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
Italic Text For: {', '.join(formatting.get('italic', [])[:2]) if isinstance(formatting.get('italic'), list) else 'Subtle emphasis'}
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
