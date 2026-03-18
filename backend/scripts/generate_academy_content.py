import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import asyncio
import json
import os
import sys


from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from google import genai
from google.genai import types

from app.core.config import settings

# ANSI color codes
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
CYAN = '\033[96m'
ENDC = '\033[0m'

def cprint(text, color=""):
    color_code = ENDC
    if color == "green": color_code = GREEN
    elif color == "yellow": color_code = YELLOW
    elif color == "red": color_code = RED
    elif color == "cyan": color_code = CYAN
    print(f"{color_code}{text}{ENDC}")


FRONTEND_LOCALES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "src", "locales")

PROMPT_TEMPLATE = """You are an Elite Viral Copywriter and P2P Networking Expert writing for the 'Pintopay Academy'.
Your task is to generate the content for Academy Stage {stage_id}: {title}
Description: {desc}
Language: {language}

**CRITICAL STANDARDS:**
1. **Professional Native Quality**: If the language is Russian (ru), write like a top-tier native Russian copywriter (Maxim Ilyakhov style). No robotic translations or literal English idioms.
2. **Viral & Compelling**: Content must be high-energy, authoritative, and focused on viral psychology, P2P network building, or AI automation tactics.
3. Return a STRICT JSON object with EXACTLY these keys:
   - "lesson_intro": Strong hook (1-2 sentences). May use **bold** markdown.
   - "lesson_secret_title": Short UPPERCASE title for the secret (e.g. "THE HIDDEN MULTIPLIER").
   - "lesson_secret": 1-2 sentence mind-blowing core truth. Max 200 characters.
   - "lesson_body": Main lesson content. 2-4 short paragraphs. Use **bold markdown** for emphasis.
   - "lesson_outro": Mission statement for this stage (e.g. "Your mission: ...").
   - "lesson_viral_rule": One-sentence golden rule (e.g. "The Rule of X: ...").

Output ONLY the raw JSON object. No markdown code fences, no extra text."""

async def generate_stage_google(client, stage_id: int, title: str, desc: str, language: str) -> dict:
    prompt = PROMPT_TEMPLATE.format(stage_id=stage_id, title=title, desc=desc, language=language)
    try:
        response = await asyncio.to_thread(
            client.models.generate_content,
            model="gemini-2.0-flash",
            contents=prompt
        )
        text = response.text.strip()
        # Strip markdown fences if present
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        # Remove non-printable control characters (except \n, \r, \t used in JSON structure)
        import re
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Fallback: escape literal newlines/tabs inside string values
            cleaned = text.replace('\r\n', '\\n').replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
            return json.loads(cleaned)
    except Exception as e:
        cprint(f"  Error generating stage {stage_id} in {language}: {e}", "red")
        return None

async def main():
    api_key = settings.GOOGLE_API_KEY
    if not api_key:
        cprint("GOOGLE_API_KEY is missing.", "red")
        return

    client = genai.Client(api_key=api_key)

    en_path = os.path.join(FRONTEND_LOCALES_DIR, "en", "academy.json")
    ru_path = os.path.join(FRONTEND_LOCALES_DIR, "ru", "academy.json")

    en_temp_path = os.path.join(os.path.dirname(__file__), "data", "academy_en_temp.json")
    ru_temp_path = os.path.join(os.path.dirname(__file__), "data", "academy_ru_temp.json")

    os.makedirs(os.path.dirname(en_temp_path), exist_ok=True)

    with open(en_path, encoding="utf-8") as f:
        en_data = json.load(f)
    with open(ru_path, encoding="utf-8") as f:
        ru_data = json.load(f)

    # Start from where we left off or specified
    start_stage = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 39
    end_stage = 100

    cprint(f"Starting Gemini Academy generation from stage {start_stage} to {end_stage}...", "cyan")

    for i in range(start_stage, end_stage + 1):
        title_key = f"stage_{i}_title"
        desc_key = f"stage_{i}_desc"

        title = en_data["academy_content"].get(title_key, f"Stage {i}")
        desc = en_data["academy_content"].get(desc_key, "")

        # Skip only if BOTH EN and RU already have real viral content
        existing_en = en_data["academy_content"].get(f"stage_{i}_lesson_intro", "")
        existing_ru = ru_data["academy_content"].get(f"stage_{i}_lesson_intro", "")
        en_ok = bool(existing_en) and "Welcome to Stage" not in existing_en
        ru_ok = bool(existing_ru) and "Добро пожаловать на Этап" not in existing_ru
        if en_ok and ru_ok:
            cprint(f"Stage {i} already has content - skipping.", "cyan")
            continue

        cprint(f"\nGenerating Stage {i}: {title}", "yellow")

        # Generate EN
        en_res = await generate_stage_google(client, i, title, desc, "en")
        if en_res:
            en_data["academy_content"][f"stage_{i}_lesson_intro"] = en_res.get("lesson_intro", "")
            en_data["academy_content"][f"stage_{i}_lesson_secret_title"] = en_res.get("lesson_secret_title", "")
            en_data["academy_content"][f"stage_{i}_lesson_secret"] = en_res.get("lesson_secret", "")
            en_data["academy_content"][f"stage_{i}_lesson_body"] = en_res.get("lesson_body", "")
            en_data["academy_content"][f"stage_{i}_lesson_outro"] = en_res.get("lesson_outro", "")
            en_data["academy_content"][f"stage_{i}_lesson_viral_rule"] = en_res.get("lesson_viral_rule", "")
            cprint("  - EN ✅", "green")
        else:
            cprint("  - EN ❌ (failed, skipping)", "red")

        await asyncio.sleep(1)  # Rate limit buffer between EN and RU

        # Generate RU
        ru_res = await generate_stage_google(client, i, title, desc, "ru")
        if ru_res:
            ru_data["academy_content"][f"stage_{i}_lesson_intro"] = ru_res.get("lesson_intro", "")
            ru_data["academy_content"][f"stage_{i}_lesson_secret_title"] = ru_res.get("lesson_secret_title", "")
            ru_data["academy_content"][f"stage_{i}_lesson_secret"] = ru_res.get("lesson_secret", "")
            ru_data["academy_content"][f"stage_{i}_lesson_body"] = ru_res.get("lesson_body", "")
            ru_data["academy_content"][f"stage_{i}_lesson_outro"] = ru_res.get("lesson_outro", "")
            ru_data["academy_content"][f"stage_{i}_lesson_viral_rule"] = ru_res.get("lesson_viral_rule", "")
            cprint("  - RU ✅", "green")
        else:
            cprint("  - RU ❌ (failed, skipping)", "red")

        # Save after every stage to avoid data loss
        with open(en_temp_path, "w", encoding="utf-8") as f:
            json.dump(en_data, f, indent=2, ensure_ascii=False)
        with open(ru_temp_path, "w", encoding="utf-8") as f:
            json.dump(ru_data, f, indent=2, ensure_ascii=False)

        await asyncio.sleep(1)

    cprint("\nGeneration complete!", "green")

if __name__ == "__main__":
    asyncio.run(main())
