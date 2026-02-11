import asyncio
import random
from typing import Optional, Dict, Any
from app.core.config import settings

# Try to import openai, but don't crash if it's missing (unless used)
try:
    from openai import AsyncOpenAI
except ImportError:
    AsyncOpenAI = None

class ViralCopywriter:
    """
    AI-Powered Viral Content Generator for Pintopay Blog.
    Specializes in high-conversion, FOMO-driven, and sales-focused articles.
    """
    
    CATEGORIES = {
        "brand_awareness": {
            "goal": "Brand Awareness",
            "tone": "Visionary, Authoritative, Inspiring",
            "focus": "Establish Pintopay as the inevitable future of finance.",
            "hook_style": "The world is changing fast. Are you ready?",
        },
        "problem_solution": {
            "goal": "Problem Solution",
            "tone": "Empathetic, Analytical, Solution-Oriented",
            "focus": "Highlight pain points (blocked crypto, high fees) and present Pintopay Card as the only improved solution.",
            "hook_style": "Stop losing money to banks.",
        },
        "global_trends": {
            "goal": "Global FinTech & Crypto Mass Adoption",
            "tone": "Urgent, Data-Driven, Insider",
            "focus": "Show the massive shift to digital finance and how early adopters win.",
            "hook_style": "Trillions are moving on-chain. Here's what it means for you.",
        },
        "promotional": {
            "goal": "Promotional (Sale/PRO)",
            "tone": "Exciting, Exclusive, Limited-Time",
            "focus": "Directly sell the benefits of PRO membership and the Card.",
            "hook_style": "This offer disappears in 24 hours.",
        },
        "entertainment": {
            "goal": "Entertainment & Engagement",
            "tone": "Fun, Relatable, Meme-friendly",
            "focus": "Crypto culture, relatable struggles, quizzes, and fun facts.",
            "hook_style": "You won't believe what just happened.",
        },
        "hype_viral": {
            "goal": "Hype, Viral & FOMO",
            "tone": "Electric, Secretive, Urgent",
            "focus": "Create massive fear of missing out (FOMO) and social proof.",
            "hook_style": "Everyone is talking about this secret strategy.",
        }
    }

    REFERRAL_LINK = "https://t.me/pintopaybot?start=p_6977c29c66ed9faa401342f3"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        if self.api_key and AsyncOpenAI:
            self.client = AsyncOpenAI(api_key=self.api_key)
        else:
            self.client = None
            print("⚠️ ViralCopywriter: OpenAI API Key not found or openai lib missing. Service limited.")

    async def generate_article(self, category: str, topic: str, language: str = "en") -> Dict[str, str]:
        """
        Generates a viral article based on the category and topic.
        """
        if not self.client:
            return {
                "error": "OpenAI API Key is missing. Please configure OPENAI_API_KEY in settings."
            }
        
        if category not in self.CATEGORIES:
            raise ValueError(f"Invalid category. Choose from: {list(self.CATEGORIES.keys())}")

        cat_config = self.CATEGORIES[category]
        
        system_prompt = self._build_system_prompt(cat_config)
        user_prompt = f"Topic: {topic}\nLanguage: {language}\n\nGenerate the viral article now."

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.75, # High creativity but focused
                max_tokens=1500
            )
            
            content = response.choices[0].message.content
            return self._parse_response(content)
        except Exception as e:
            print(f"❌ ViralCopywriter Error: {e}")
            return {"error": str(e)}

    def _build_system_prompt(self, cat_config: Dict[str, str]) -> str:
        """
        Constructs the high-converting system prompt.
        """
        return f"""
You are an Elite Viral Copywriter and Professional Sales Expert.
You write for the 'Pintopay Hub' blog, a leading platform for P2P finance and Crypto Cards.

**OBJECTIVE:**
Write a viral, high-conversion blog article.
Category: {cat_config['goal']}
Tone: {cat_config['tone']}
Core Focus: {cat_config['focus']}
Hook Style: {cat_config['hook_style']}

**MANDATORY RULES:**
1. **The 'Between the Lines' Sales Technique**:
    - Do NOT be "salesy" in the main body. Be valuable, educational, or entertaining.
    - HOWEVER, subtly weave in the "Pintopay Crypto Card" as the *obvious* tool to solve the problem or achieve the goal discussed.
    - Position the card/platform not as a "product" but as a "secret weapon" or "smart money move".

2. **Viral Structure**:
    - **Headline**: Must be click-bait but deliver value (e.g., 'Why 99% of Crypto Users Fail', 'The $1/Minute Trick').
    - **The Hook**: First sentence must grab attention instantly.
    - **The Meat**: 3-5 punchy paragraphs or bullet points.
    - **The Turn**: Reveal the Pintopay solution naturally.

3. **Call to Action (CTA) & Closing**:
    - YOU MUST include this specific link for the Pintopay Card: {self.REFERRAL_LINK}
    - Add a **Viral Hook** at the end (e.g., "This loophole closes soon").
    - Add **FOMO** (e.g., "Only 50 cards left in this batch").
    - Add **Social Proof** (e.g., "Join 10,000+ smart earners").
    - Explicitly ask the user to share the article.

4. **Formatting**:
    - Use Markdown.
    - Keep paragraphs short (1-3 sentences).
    - Use bolding for emphasis.
    - Return the output as JSON with keys: "title", "excerpt", "content" (markdown), "cta_text".

**EXAMPLE CTA ENDING:**
"Don't let the banks hold you back. The smart money is already moving.
👉 **[Get Your Pintopay Card Now]({self.REFERRAL_LINK})** 
*(Warning: High demand. Batch closing soon.)*

**Share this with 3 friends to lock in your spot.**"
"""

    def _parse_response(self, content: str) -> Dict[str, str]:
        """
        Parses the LLM response (handling potential JSON wrapping).
        """
        import json
        import re
        
        # Cleanup code blocks if present
        content = re.sub(r'^```json\s*', '', content)
        content = re.sub(r'^```\s*', '', content)
        content = re.sub(r'\s*```$', '', content)
        
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            # Fallback if specific formatting failed
            return {
                "title": "Viral Article Generated (Parse Error)",
                "excerpt": "Content generated but JSON parsing failed.",
                "content": content,
                "cta_text": f"Get started: {self.REFERRAL_LINK}"
            }

# Singleton instance
copywriter = ViralCopywriter()
