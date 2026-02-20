from typing import Any
from .constants import (
    CMO_PERSONA, 
    FORMATTING_MASTERY, 
    TEXT_RULES, 
    STORYTELLING_PROTOCOL,
    IMAGE_RULES
)
from app.core.cmo_intelligence import (
    AudienceProfile,
    ContentCategory,
    NativeLanguageOptimization,
)

def build_viral_audience_intel(target_audience: str, post_type: str, language: str) -> dict[str, Any]:
    return {
        "audience": AudienceProfile.PROFILES.get(target_audience, {}),
        "strategy": ContentCategory.STRATEGIES.get(post_type, {}),
        "dna": NativeLanguageOptimization.LANGUAGE_DNA.get(language, {})
    }

def build_viral_system_prompt(language, target_audience, post_type, tone, ref_link, intel, best_practices, resonance_data=None) -> str:
    audience_intel = intel["audience"]
    category_strategy = intel["strategy"]
    language_dna = intel["dna"]
    
    psycho_context = _build_audience_context(target_audience, audience_intel)
    strategy_context = _build_strategy_context(post_type, category_strategy)
    lang_context = _build_language_context(language, language_dna)
    
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
Write in {language} for {target_audience} using the {post_type} strategy.
Persona Tone: {tone.upper()}
Product: Pintopay Crypto Card + Partner Network
Referral Link (MUST INCLUDE): {ref_link}

**OUTPUT FORMAT (JSON ONLY):**
{{
  "title": "A high-status strategic title <10 words",
  "body": "**Chapter X: [Title]**\\n\\n[THE ALPHA HOOK]\\n\\n[Value/Strategy Context]\\n\\n[LEAD MAGNET OFFER: Offer a blueprint/setup for a comment]\\n\\n**[Action Oriented CTA]({ref_link})** (Replace {ref_link} with the actual URL: {ref_link})",
  "hashtags": ["#Sovereignty", "#Fintech", "#DeFi", "#ExitStrategy"],
  "image_description": "Elite Leica M11 prompt following the SPECIFICATION."
}}
"""

def build_viral_user_prompt(target_audience, post_type, language, tone, ref_link, intel) -> str:
    audience_intel = intel["audience"]
    category_strategy = intel["strategy"]
    hook_examples = audience_intel.get("hooks", []) if audience_intel else []
    visual_base = audience_intel.get("visual_base", "A successful person")
    visual_scene = category_strategy.get("visual_scene", "experiencing a transformation")
    
    hook_inspo = "\n".join(['- ' + hook for hook in hook_examples[:2]])

    return f"""
EXECUTE CMO AGENT MODE.

Target: {target_audience}
Category: {post_type}
Style/Tone: {tone.upper()}
Language: {language} (write as NATIVE speaker)
Referral Link: {ref_link}

**STORYTELLING CONTEXT:**
Arc: {category_strategy.get('storytelling', {}).get('arc', 'General Transformation')}
Focus: {category_strategy.get('storytelling', {}).get('chapter_focus', 'None')}
Available Episodes: {category_strategy.get('storytelling', {}).get('episodes', [])}

**HOOK INSPIRATION (adapt, don't copy):**
{hook_inspo}

**CONTENT REQUIREMENTS (STRICT):**
1. **VISIONARY TONE:** Be professional, friendly, and inspiring. Talk about the "Global Financial Shift" and "Digital Gold Rush" as positive opportunities for everyone to grow together.
2. **NO BLAME:** Do NOT mention or blame banks, the government, or 'the system'. Do not be aggressive or rebellious.
3. **GLOBAL LEADERSHIP:** Write as a Professional Native Speaker and Global Leader. Use sophisticated, high-status yet inclusive language.
4. **EPISODIC ANCHOR:** The first line of the 'body' MUST be: "**Chapter [X]: [Visionary Title]**".
5. **OPPORTUNITY ASSET:** Mid-post, offer a 'Growth Asset' (e.g., "Signal 'GOLD' for the blueprint to geometric networking").
6. **CTA SUPREMACY:** The final line MUST be a bold markdown link: **[Action Text]({ref_link})**.
7. **BANNED:** Never use "Pintopay" in the hook. No exclamations. No aggresive 'Red Pill' terminology.

**VISUAL STORYTELLING (for context):**
The generated image for this post will feature: {visual_base} {visual_scene}. Ensure your copy resonates with this visual aesthetic.

**IMAGE SPECIFICATION (CRITICAL):**
Generate a prompt for a Leica M11 editorial shot. 
Base: {visual_base}
Scene: {visual_scene}
Note: Absolutely NO neon, NO screens, NO cash. Focus on Chiaroscuro lighting, luxury textures (stone, silk, walnut), and a sense of 'Expensive Silence'. Subject must look thoughtful and high-status, not 'posing'.

RETURN ONLY VALID JSON. NO EXPLANATIONS OUTSIDE JSON.
"""

def build_viral_image_prompt(intel: dict, post_content: str = "") -> str:
    audience_intel = intel.get("audience", {})
    category_strategy = intel.get("strategy", {})
    
    audience_desc = audience_intel.get("visual_base", "An authoritative and sophisticated individual of undeniable status.")
    scene_desc = category_strategy.get("visual_scene", "navigating a moment of high-stakes breakthrough in a private, ultra-modern setting.")

    return (
        f"{IMAGE_RULES}\n\n"
        f"CONTEXTUAL SYNERGY: The image must visually represent the core emotion of this content: \"{post_content[:200]}\"\n"
        f"SCENE SETUP: {audience_desc} {scene_desc}. \n"
        f"EMOTION: High-stakes tension, quiet confidence, or profound relief. \n"
        f"LIGHTING: Deep Chiaroscuro with Rembrandt highlights on the face. \n"
        f"BRANDING/TEXT: If any title/text is visible on background elements (like a premium dossier or screen), it must be in the 'Onest' font style and 100% grammatically correct. \n"
        f"SPECS: Photorealistic 8K, cinematic depth of field, Leica M11 rendering."
    )

def _build_audience_context(target_audience: str, audience_intel: dict) -> str:
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
