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

def build_viral_system_prompt(language, target_audience, post_type, tone, ref_link, intel, best_practices) -> str:
    audience_intel = intel["audience"]
    category_strategy = intel["strategy"]
    language_dna = intel["dna"]
    
    psycho_context = _build_audience_context(target_audience, audience_intel)
    strategy_context = _build_strategy_context(post_type, category_strategy)
    lang_context = _build_language_context(language, language_dna)
    
    universal_rules_str = ""
    if best_practices and 'universal_rules' in best_practices:
        universal_rules_str = "\n".join(['- ' + rule for rule in best_practices['universal_rules'][:8]])

    return f"""{CMO_PERSONA}

{psycho_context}

{strategy_context}

{lang_context}

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
  "title": "Viral headline <15 words",
  "body": "Full post with **bold**, _italic_, and [hyperlink]({ref_link}) formatting",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "image_description": "Detailed scene description for 4K Ultra-Realistic Cinematic quality"
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

**CONTENT REQUIREMENTS:**
1. **NARRATIVE ARC:** Select ONE Episode from the 'Available Episodes' list (matching the output language) and write the post as that specific Chapter.
2. **STORY-DRIVEN HOOK:** The first sentence MUST be the chosen Episode Title (e.g. "Chapter 2: No Banks, No Limits").
3. **EPISODIC CLIFFHANGER:** End the text with a 'cliffhanger' that hints at the next chapter (e.g. "Tomorrow, I'll reveal why most traders fail at this step...").
4. **USER INVOLVEMENT CTA:** Ask followers to comment a specific word (e.g. "Comment 'MATRIX' for the full strategy") to keep the story alive.
5. **PRODUCT WEAVING:** Naturally weave in Pintopay Card/Network as the 'Key' to the story's transformation.
6. **PSYCHOLOGICAL TRIGGERS:** {', '.join(category_strategy.get('psychological_triggers', ['FOMO', 'Social Proof'])[:3])}
7. **FORMATTING:** Format with **bold** (4-6x), _italic_ (2-3x), and [descriptive link]({ref_link}) in the story bridge.
8. **LENGTH:** Keep content UNDER 900 characters total.
9. **AUTHENTICITY:** Write as if you are living this story right now in {language}.

**VISUAL STORYTELLING (for context):**
The generated image for this post will feature: {visual_base} {visual_scene}. Ensure your copy resonates with this visual aesthetic.

**IMAGE DESCRIPTION:**
Create a 4K prompt for this specific chapter. 
Base: {visual_base}
Scene: {visual_scene}
Note: Add a 'Cinematic Narrative' flair—high contrast, dramatic shadows, mysterious but premium atmosphere. Technical: 35mm, f/1.4, Unreal Engine 5 render style.

RETURN ONLY VALID JSON. NO EXPLANATIONS OUTSIDE JSON.
"""

def build_viral_image_prompt(intel: dict) -> str:
    audience_intel = intel.get("audience", {})
    category_strategy = intel.get("strategy", {})
    
    audience_desc = audience_intel.get("visual_base", "A successful and authoritative person.")
    scene_desc = category_strategy.get("visual_scene", "experiencing a breakthrough moment of financial freedom.")

    return (
        f"PROFESSIONAL CINEMATIC PHOTOGRAPHY - NARRATIVE 4K QUALITY: {audience_desc} "
        f"The subject is {scene_desc} "
        f"Atmosphere: Cinematic Narrative, high contrast, dramatic shadows, mysterious but premium atmosphere, storytelling vibes. "
        f"Technical Specs: 35mm lens, f/1.4 wide aperture, masterful cinematic lighting, 8K textures, Unreal Engine 5 render style, professional color grading. "
        f"Visual Anchor: The image tells a story of transformation and elite status, incorporating a 'Pintopay' element with photorealistic precision. "
        f"STRICT NEGATIVE PROMPT: cartoon, CGI, anime, 3D render, illustration, drawing, painting, stock photo style, fake smile, distorted hands, extra fingers, "
        f"unrealistic proportions, oversaturated colors, generic poses, misspelled text, low quality"
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
