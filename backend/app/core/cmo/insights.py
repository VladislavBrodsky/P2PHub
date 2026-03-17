from async_lru import alru_cache
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.models.knowledge_base_item import KnowledgeBaseItem

class KnowledgeInsights:
    """Self-learning system for continuous improvement."""
    
    @staticmethod
    @alru_cache(maxsize=1, ttl=3600) # Cache for 1 hour
    async def get_best_practices(session: AsyncSession = None):
        """
        Retrieves best practices from DB if available, falling back to static rules.
        """
        if session:
            try:
                result = await session.exec(select(KnowledgeBaseItem).where(KnowledgeBaseItem.confidence_score > 0.7))
                items = result.all()
                
                if items:
                    dynamic_rules = [item.value for item in items if item.category == "universal_rules"]
                    if dynamic_rules:
                        return {
                            "universal_rules": dynamic_rules,
                            "psychological_triggers": KnowledgeInsights._get_static_triggers(),
                            "formatting_precision": KnowledgeInsights._get_static_formatting()
                        }
            except Exception as e:
                print(f"⚠️ Failed to fetch KnowledgeBaseItems: {e}")
        
        return KnowledgeInsights._get_static_defaults()

    @staticmethod
    def _get_static_triggers():
        return {
            "curiosity_gap": "Tease information without full reveal in hook",
            "social_proof": "Mention specific numbers of users/success stories",
            "authority": "Reference data, studies, or expert consensus",
            "reciprocity": "Provide value upfront before asking for action",
            "consistency": "Appeal to audience's self-image and values",
            "liking": "Mirror audience's language and pain points",
            "scarcity": "Time limits or quantity limits (be honest)",
            "urgency": "Tie to real deadlines or market conditions"
        }

    @staticmethod
    def _get_static_formatting():
        return {
            "bold_usage": "Reserve for: Stats, key benefits, WARNING/NEW, power words, CTA text",
            "italic_usage": "NEVER use underscores for italics. Use ALL CAPS for emphasis instead.",
            "hyperlink_rules": [
                "ALWAYS use markdown format: [Anchor Text](https://url)",
                "Anchor text should be action-oriented: 'Get Started', 'Unlock Now', 'Join Free'",
                "Place primary CTA hyperlink in final paragraph",
                "Can include secondary hyperlink mid-body if educational",
                "NEVER use bare URLs - always wrap in markdown"
            ],
            "structure": "Hook (1-2 lines) → Body (3-5 short paragraphs) → CTA (final paragraph with hyperlink)"
        }

    @staticmethod
    def _get_static_defaults():
        return {
            "universal_rules": [
                "Always include ONE clear hyperlink CTA in markdown format: [Text](URL)",
                "Use **bold** for power words, stats, and key benefits (3-5 per post max)",
                "NEVER use _underscore_ formatting. Use CAPS for emphasis instead.",
                "Keep paragraphs 1-3 sentences for mobile readability",
                "End with a question or CTA to drive engagement",
                "Include 2-4 relevant hashtags that are trending in the niche",
                "Use emojis strategically (2-4) for visual scanning, aligned with audience",
                "Create a 'scroll-stopping' first line under 10 words",
                "Include specific numbers (not 'many' or 'some') for credibility",
                "Use active voice 90% of the time for urgency"
            ],
            "psychological_triggers": KnowledgeInsights._get_static_triggers(),
            "formatting_precision": KnowledgeInsights._get_static_formatting()
        }
