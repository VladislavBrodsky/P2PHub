"""
CMO Intelligence System - Elite Viral Marketing Knowledge Base
Self-learning AI system for audience-specific copy generation.
"""

from enum import Enum


class CopywritingTechnique(str, Enum):
    """Advanced copywriting frameworks."""
    AIDA = "AIDA"  # Attention, Interest, Desire, Action
    PAS = "PAS"  # Problem, Agitate, Solution
    BAB = "BAB"  # Before, After, Bridge
    FAB = "FAB"  # Features, Advantages, Benefits
    QUEST = "QUEST"  # Qualify, Understand, Educate, Stimulate, Transition
    PASTOR = "PASTOR"  # Problem, Amplify, Story, Transformation, Offer, Response
    SSS = "SSS"  # Star, Story, Solution


class AudienceProfile:
    """Deep psychological profile for each target audience."""
    
    PROFILES = {
        "traders": {
            "name": "Alpha Strategists & Crypto Whales",
            "performing_keywords_2026": ["Sovereign Velocity", "Liquidity Density", "Asymmetric Alpha", "Basis-Point Dominance"],
            "psychographics": {
                "pain_points": [
                    "High slippage and execution tax",
                    "Institutional KYC barriers",
                    "Off-ramp bottleneck fatigue",
                    "Regulatory overreach",
                    "Missing the exponential curve"
                ],
                "desires": [
                    "Elite financial sovereignty",
                    "Frictionless asset mobility",
                    "Stealth wealth execution",
                    "High-status peer networks",
                    "Absolute capital autonomy"
                ],
                "values": ["Decentralization", "Capital Efficiency", "Privacy", "Velocity"],
                "language_patterns": ["Technical precision", "Minimalist authority", "Data-centric", "Skeptical of hype"],
                "triggers": ["Exponential Alpha", "Institutional bypass", "Liquidity leaks", "Elite social proof"]
            },
            "tov": {
                "style": "Sharp, authoritative, minimal",
                "formality": "Professional mastery",
                "humor": "Dry, insider wit",
                "emojis": "💎♟️🌊⚡",
                "sentence_length": "Short. Lethal. Data-packed.",
                "power_words": ["velocity", "density", "sovereign", "asymmetric", "alpha", "execution"]
            },
            "hooks": [
                "The 3% liquidity leak most whales are ignoring.",
                "Why the elite 1% move their assets outside the 'Legacy Box'.",
                "Sovereign Velocity: The standard for 2026 capital execution.",
                "Your asymmetric alpha isn't in the chart; it's in the infrastructure."
            ],
            "visual_base": "A world-class Crypto Strategist, mid-30s, embodying 'Quiet Luxury'. Captured in a desaturated, high-contrast private office with subtle holographic data ambient glow. Shot on Leica M11.",
            "cta_style": "Stealth, authoritative, high-stakes"
        },
        
        "nomads": {
            "name": "Global Mobility Sovereigns",
            "performing_keywords_2026": ["Borderless Wealth", "Lifestyle Arbitrage", "Digital Sovereignty", "Global Mobility Nodes"],
            "psychographics": {
                "pain_points": [
                    "Banking geofencing",
                    "Currency conversion erosion",
                    "Lack of high-status financial tools",
                    "Travel friction and blocked access",
                    "Disconnected community hubs"
                ],
                "desires": [
                    "Unrestricted global movement",
                    "Seamless multi-currency liquidity",
                    "Elite digital nomad status",
                    "Financial independence 2.0",
                    "Belonging to a sovereign elite"
                ],
                "values": ["Freedom", "Mobility", "Experiences", "Autonomy"],
                "language_patterns": ["Inspirational", "Sophisticated", "Global-aware", "Minimalist"],
                "triggers": ["Lifestyle arbitrage", "Freedom metrics", "Private travel hacks", "Status signals"]
            },
            "tov": {
                "style": "Sophisticated, global, magnetic",
                "formality": "Elevated and casual",
                "humor": "Cultured, world-traveler wit",
                "emojis": "🌍✈️🏝️✨",
                "sentence_length": "Rhythmic. Evocative.",
                "power_words": ["borderless", "sovereign", "mobility", "freedom", "global", "arbitrage"]
            },
            "hooks": [
                "The borderless protocol for the new global elite.",
                "How I unlocked 100% financial mobility across 5 continents.",
                "Lifestyle Arbitrage: The hidden math of the modern sovereign.",
                "Chapter 7: Why your current bank is anchoring your global potential."
            ],
            "visual_base": "A high-status 'Global Sovereign' in a first-class private lounge, 35mm f/2.8 lens. Natural light, sophisticated neutral tones, expensive silence. Embodying the ultimate freedom lifestyle.",
            "cta_style": "Inspirational, high-status"
        },
        
        "affiliates": {
            "name": "Affiliate Marketers",
            "psychographics": {
                "pain_points": [
                    "Payment processor holds/delays",
                    "High payout thresholds",
                    "Cannot receive crypto commissions",
                    "Scaling limitations",
                    "Compliance complexity"
                ],
                "desires": [
                    "Instant commission access",
                    "Higher profit margins",
                    "Scalable infrastructure",
                    "Tax efficiency",
                    "Competitive advantage"
                ],
                "values": ["ROI", "Optimization", "Leverage", "Automation"],
                "language_patterns": ["Metrics-heavy", "Conversion-focused", "Strategic", "Tactical"],
                "triggers": ["Revenue increase", "Efficiency gains", "Competitive edge", "Case studies"]
            },
            "tov": {
                "style": "Results-driven, tactical, no-BS",
                "formality": "Professional but direct",
                "humor": "Minimal, sarcastic if any",
                "emojis": "📊💰🎯🔥💡",
                "sentence_length": "Short. Action-oriented.",
                "power_words": ["convert", "scale", "ROI", "margin", "optimize", "funnel"]
            },
            "hooks": [
                "How this card increased my affiliate margins by {percentage}%",
                "The payment infrastructure top affiliates are switching to",
                "{Number} ways to cut {percentage}% from your payout costs",
                "I tested {number} payment methods. Only one scaled past ${amount}/month."
            ],
            "visual_base": "A charismatic marketing entrepreneur, energetic presence, modern casual luxury attire, holding a high-end smartphone in a sun-drenched urban loft.",
            "lead_magnets": ["The 2026 Conversion Cheat-Sheet", "Affiliate Alpha: The Margin Optimization Blueprint", "The Instant Payout Protocol"],
            "cta_style": "ROI-focused, A/B tested language"
        },
        
        "builders": {
            "name": "Network Builders",
            "performing_keywords_2026": ["Duplication Velocity", "Network Architecture", "Sovereign Yield", "Exponential Nodes"],
            "psychographics": {
                "pain_points": [
                    "Slow team payments",
                    "Trust issues with centralized platforms",
                    "Commission tracking complexity",
                    "Retention challenges",
                    "Market saturation"
                ],
                "desires": [
                    "Exponential growth",
                    "Passive income systems",
                    "Team empowerment",
                    "Legacy building",
                    "Recognition and status"
                ],
                "values": ["Relationships", "Leverage", "Leadership", "Abundance mindset"],
                "language_patterns": ["Motivational", "Visionary", "Team-centric", "Growth metaphors"],
                "triggers": ["Duplication", "Team success stories", "Rank advancement", "Passive income"]
            },
            "tov": {
                "style": "Visionary, empowering, magnetic",
                "formality": "Motivational speaker energy",
                "humor": "Uplifting, positive",
                "emojis": "🚀🌟💎👑🔥⚡",
                "sentence_length": "Varied. Rhythm for emphasis.",
                "power_words": ["team", "empire", "legacy", "duplicate", "residual", "exponential"]
            },
            "hooks": [
                "How I built a {size} team in {timeframe} (the tool they never told you about)",
                "The payment system that tripled my team retention",
                "Why top leaders are migrating to crypto-based compensation",
                "From {starting point} to {achievement}: The infrastructure that changed everything"
            ],
            "visual_base": "An elite FinTech Partnership leader and community architect, possessing magnetic visionary energy. Captured in a high-stakes strategy session on a luxury terrace overlooking a metropolitan financial district. Shot on Leica M11, desaturated tones, realistic lighting.",
            "lead_magnets": ["The Duplication Masterclass: 0 to 10k", "The Team Retention Blueprint", "The Legacy Network Architecture (Video)"],
            "cta_style": "Vision-driven, team-focused"
        },
        
        "parents": {
            "name": "Legacy Matriarchs & Patriarchs",
            "performing_keywords_2026": ["Generational Wealth", "Legacy Yield", "Family Sovereignty", "Automated Abundance"],
            "psychographics": {
                "pain_points": [
                    "Financial dependence fragility",
                    "Time poverty",
                    "Security concerns for the future",
                    "Complex systems overwhelm",
                    "Identity erosion in domestic roles"
                ],
                "desires": [
                    "Generational financial security",
                    "Simple, autonomous wealth systems",
                    "High-status contribution to family",
                    "Legacy building for children",
                    "Personal professional awakening"
                ],
                "values": ["Legacy", "Security", "Simplicity", "Connection"],
                "language_patterns": ["Empathetic", "Graceful", "Visionary", "Clear"],
                "triggers": ["Future security", "Simplicity hacks", "Quiet confidence", "Legacy stories"]
            },
            "tov": {
                "style": "Graceful, supportive, visionary",
                "formality": "Elegant and warm",
                "humor": "Gentle, wise",
                "emojis": "✨🏡🤍🧸",
                "sentence_length": "Balanced. Flowing.",
                "power_words": ["legacy", "abundance", "secure", "generations", "simple", "sovereign"]
            },
            "hooks": [
                "The quiet system I use to architect my family's financial legacy.",
                "Simple, autonomous, and generational. This is the new family standard.",
                "How to build a financial fortress for your children while staying present.",
                "Chapter 3: The transition from domestic stability to financial sovereignty."
            ],
            "visual_base": "An elegant, successful 'Legacy Architect' parent in a sun-drenched, high-end minimalist kitchen or reading nook. Soft lighting, expensive textures, a sense of profound peace and control. Shot on Leica M11.",
            "lead_magnets": ["The Family Sovereign Trust Setup", "Generational Yield: A Legacy Masterclass", "The 15-Minute Passive Abundance Guide"],
            "cta_style": "Graceful, empowering, trust-focused"
        },
        
        "hustlers": {
            "name": "Student Hustlers",
            "psychographics": {
                "pain_points": [
                    "Student loan debt",
                    "Limited credit history",
                    "Side hustle payment friction",
                    "Traditional banks rejecting them",
                    "Need to move fast on opportunities"
                ],
                "desires": [
                    "Financial independence from parents",
                    "Build wealth early",
                    "Status among peers",
                    "Escape the 'broke student' trap",
                    "Future-proof career"
                ],
                "values": ["Ambition", "Speed", "Street smarts", "Hustle culture"],
                "language_patterns": ["Energetic", "Trendy", "Rebellious", "Peer-influenced"],
                "triggers": ["Early advantage", "Peer success", "Anti-establishment", "Future wealth"]
            },
            "tov": {
                "style": "Energetic, rebellious, future-focused",
                "formality": "Very casual, Gen-Z coded",
                "humor": "Meme-heavy, self-aware",
                "emojis": "🔥💸🎓📚⚡🚀",
                "sentence_length": "Short. Fast-paced.",
                "power_words": ["hustle", "grind", "stack", "escape", "future", "retire early"]
            },
            "hooks": [
                "How Gen-Z is leading the Digital Gold Rush (and building wealth together)",
                "The {tool} that empowered me to build my own future while in school",
                "The new era of finance is here, and we're leading the charge",
                "From student to {amount}/month: My journey in the Global Financial Shift"
            ],
            "visual_base": "An ambitious Gen-Z visionary, premium modern attire, collaborating with peers in a vibrant, futuristic innovation hub filled with light and energy.",
            "lead_magnets": ["The Student Hustle Stack (2026)", "From Loan to Legacy: The Early Wealth Guide", "The 1-Click Independent Income Setup"],
            "cta_style": "Visionary, inclusive, community-proof"
        },
        
        "burnouts": {
            "name": "Corporate Escape Architects",
            "performing_keywords_2026": ["Autonomy Pivot", "Sovereign Exit", "Identity Decoupling", "Liquidity Bridges"],
            "psychographics": {
                "pain_points": [
                    "Golden handcuff suffocation",
                    "Soul-eroding corporate cycles",
                    "Upside stagnation",
                    "Identity tied to a title, not a person",
                    "Fear of the bridge into freedom"
                ],
                "desires": [
                    "Full autonomy exit strategy",
                    "Purpose-driven entrepreneurship",
                    "High-status second act",
                    "Liquidity bridge to independence",
                    "Legacy beyond the boardroom"
                ],
                "values": ["Autonomy", "Purpose", "Courage", "Strategic Mastery"],
                "language_patterns": ["Strategic", "Reflective", "Analytical", "Liberation-focused"],
                "triggers": ["Exit blueprints", "Second acts", "Autonomy metrics", "Identity shifts"]
            },
            "tov": {
                "style": "Strategic, reflective, magnetic",
                "formality": "Senior leadership energy",
                "humor": "Dry, boardroom wit",
                "emojis": "🚪🗝️🌅✨",
                "sentence_length": "Deliberate. Powerful.",
                "power_words": ["exit", "sovereign", "autonomy", "bridge", "identity", "pivot"]
            },
            "hooks": [
                "I decoupling my identity from my title. Here is the liquidity bridge I used.",
                "The Corporate Exit: How to flip the script on golden handcuffs.",
                "Why strategic autonomy is the ultimate 2026 career luxury.",
                "Chapter 5: The blueprint for your high-status second act."
            ],
            "visual_base": "A serene former executive, dressed in premium weekend-luxe (Cashmere, silk), enjoying an expensive silence in a Mediterranean garden. Shot on Leica M11. Natural golden-hour light.",
            "lead_magnets": ["The 18-Month Sovereign Exit Blueprint", "Identity Decoupling: The Boardroom to Freedom Guide", "Corporate Escape: The Liquidity Bridge Protocol"],
            "cta_style": "Strategic, empowering, elite"
        },
        
        "partners": {
            "name": "Global Network Architects",
            "psychographics": {
                "pain_points": [
                    "Manual marketing limitations",
                    "Network stagnation",
                    "Low duplication velocity",
                    "Lack of global viral infrastructure",
                    "Centralized payment bottlenecks"
                ],
                "desires": [
                    "Geometric network expansion",
                    "Global team authority",
                    "Automated viral growth loops",
                    "High-status leadership positioning",
                    "Synergistic revenue acceleration"
                ],
                "values": ["Universal Growth", "Velocity of Trust", "Leveraged Leadership", "Visionary Abundance"],
                "language_patterns": ["Professional Native Mastery", "Authoritative yet Inspiring", "Global Context", "Viral Dynamics"],
                "triggers": ["Exponential Opportunity", "Global Financial Shift", "Team Empowerment", "Systemic Mastery"]
            },
            "tov": {
                "style": "Global Leader, Professional Native Speaker, Viral Influencer",
                "formality": "High-status professional with magnetic visionary energy",
                "humor": "Sophisticated, global, empowering",
                "emojis": "✨🌍🤝💎👑",
                "sentence_length": "Rhythmic, powerful, and impeccably structured.",
                "power_words": ["velocity", "transformation", "geometric", "synergy", "global", "ecosystem"]
            },
            "hooks": [
                "The Global Financial Shift isn't a challenge; it's our greatest shared opportunity.",
                "How to architect a viral powerhouse that scales across borders while you inspire.",
                "The 100x Growth Blueprint: Turning geometric networking into a global standard.",
                "Universal Abundance: The leadership strategy for the Digital Gold Rush."
            ],
            "visual_base": "A world-class Global Network Architect and Community Leader, embodying the ultimate 'Investment Banking Traveler' aesthetic. Dressed in bespoke, sun-drenched luxury. Captured in a cinematic moment of high-level partnership inside a sleek, futuristic aviation hub or a private Mediterranean lounge.",
            "lead_magnets": ["The Global Expansion Protocol", "Cross-Border Wealth: The 2026 Masterplan", "The Universal Viral Reach Guide"],
            "cta_style": "High-status, visionary, collaborative"
        },
        
        "passive_seekers": {
            "name": "Liquidity Sovereigns",
            "performing_keywords_2026": ["Passive Density", "Autonomous Yield", "Geometric Cashflow", "Velocity of Trust"],
            "psychographics": {
                "pain_points": ["Time-exchange friction", "Inflationary decay", "Systemic complexity", "Manual outreach burnout"],
                "desires": ["Sleep-velocity income", "Unrestricted time-wealth", "Systemic automation", "Resilient capital abundance"],
                "values": ["Freedom", "Efficiency", "Logic", "Legacy"],
                "language_patterns": ["Ease-focused", "Metrics-driven", "Visionary"],
                "triggers": ["Geometric scaling", "Autonomous yield", "Life-optimization", "Quiet wealth"]
            },
            "tov": {
                "style": "Calm, magnetic, logical",
                "formality": "Casual mastery",
                "humor": "Minimalist, effortless",
                "emojis": "🌊🏖️💎⛲",
                "sentence_length": "Clear. Flowing. Rhythmic.",
                "power_words": ["sovereign", "autonomous", "geometric", "velocity", "yield", "density"]
            },
            "hooks": [
                "The protocol for building passive density in an inflationary era.",
                "How to decouple your time from your wealth velocity.",
                "Geometric cashflow: Why the new elite don't trade hours for dollars.",
                "Chapter 2: The architecture of an autonomous wealth machine."
            ],
            "visual_base": "A world-class 'Liquidity Sovereign' relaxed in a high-end minimalist setting, embodying effortless authority. Natural light hitting expensive textures (linen, stone). Shot on Leica M11.",
            "lead_magnets": ["The Autonomous Yield Protocol", "Geometric Cashflow: The 2026 Architecture", "Quiet Wealth: The 1-Click Setup"],
            "cta_style": "Effortless, logical, high-value"
        },
        
        "growth_masters": {
            "name": "Growth Masters",
            "psychographics": {
                "pain_points": ["Saturation", "Low conversion rates", "Manual outreach burnout", "Ineffective funnels"],
                "desires": ["Extreme scale", "Algorithmic advantage", "Market dominance", "Efficient duplication"],
                "values": ["Efficiency", "Metrics", "Speed", "Innovation"],
                "language_patterns": ["Data-driven", "Strategic", "Direct"],
                "triggers": ["Scale", "Optimization", "Competitive edge", "Viral loops"]
            },
            "tov": {
                "style": "Tactical, sharp, results-obsessed",
                "formality": "Direct and semi-formal",
                "humor": "Minimal, focused on 'winning'",
                "emojis": "📊🔥🚀🎯💎",
                "sentence_length": "Short and action-heavy.",
                "power_words": ["scale", "optimize", "dominate", "leverage", "metrics", "velocity"]
            },
            "hooks": [
                "The algorithmic hack for 100x team growth",
                "Scale your partner network with surgical precision",
                "Why manual outreach is dead (and what replaced it)",
                "The blueprint for market dominance in the P2P space"
            ],
            "visual_base": "A sharp, modern growth strategist analyzing high-resolution data visualizations on a sleek holographic interface in a luxury penthouse office.",
            "lead_magnets": ["The High-Conversion Funnel Blueprint", "Algorithmic Advantage: The Viral Loop Setup", "The 100x Growth Screener"],
            "cta_style": "Data-backed, high-conversion"
        },
        
        "automation_kings": {
            "name": "Automation Kings",
            "psychographics": {
                "pain_points": ["Manual overhead", "Human error", "Inconsistency", "Time drain"],
                "desires": ["Full autonomy", "Perfect systems", "Set and forget income", "Infinite scalability"],
                "values": ["Logic", "Productivity", "Freedom", "Consistency"],
                "language_patterns": ["Technical", "Logical", "System-oriented"],
                "triggers": ["Hands-free", "Systematic", "Zero effort", "Infinite scale"]
            },
            "tov": {
                "style": "Cool, logical, precise",
                "formality": "Semi-formal",
                "humor": "Irony about 'working hard'",
                "emojis": "🤖⚙️📡💎🔋",
                "sentence_length": "Logical steps, concise.",
                "power_words": ["automate", "system", "autonomy", "hands-free", "logic", "protocol"]
            },
            "hooks": [
                "Build a partner empire that runs 100% on autopilot",
                "Zero manual work. Infinite referral growth.",
                "The 'Set and Forget' system for global network expansion",
                "How I automated the growth of 1,000+ partners"
            ],
            "visual_base": "A tech-savvy entrepreneur relaxing in a futuristic high-tech lounge, while autonomous systems glow softly around them representing a network in motion.",
            "lead_magnets": ["The Hands-Free Wealth Protocol", "Infinite Scale: The Automation Stack", "The Set and Forget Setup Guide"],
            "cta_style": "System-focused, efficiency-driven"
        },
        
        "empire_builders": {
            "name": "Empire Builders",
            "psychographics": {
                "pain_points": ["Small thinking", "Slow progression", "Lack of legacy", "Weak infrastructure"],
                "desires": ["Generational wealth", "Global influence", "Massive team legacy", "The $1/minute lifestyle"],
                "values": ["Legacy", "Power", "Ambition", "Sustainability"],
                "language_patterns": ["Visionary", "Grand", "Inspirational"],
                "triggers": ["Legacy", "Empire", "Financial Dynasty", "Global Reach"]
            },
            "tov": {
                "style": "Grand, authoritative, magnetic",
                "formality": "Formal and inspiring",
                "humor": "Sophisticated",
                "emojis": "👑🏰🌍💎🔥",
                "sentence_length": "Varied, powerful cadence.",
                "power_words": ["empire", "legacy", "dynasty", "global", "unlimited", "sovereign"]
            },
            "hooks": [
                "Stop building a business. Start architecting an empire.",
                "The architecture of a global $1/minute financial dynasty",
                "How the new elite are building legacies through P2P networks",
                "Transform your network into an unstoppable global powerhouse"
            ],
            "visual_base": "A powerful and visionary leader overlooking a vast, modern city at dusk from a private infinity pool deck, embodying ultimate status and success.",
            "lead_magnets": ["The Empire Architecture Blueprint", "Generational Wealth Dynasty Guide", "The $1/Minute Roadmap"],
            "cta_style": "Legacy-themed, visionary"
        },
    }



class ContentCategory:
    """Strategic frameworks for each post category."""
    
    STRATEGIES = {
        "launch": {
            "name": "Product Launch",
            "technique": CopywritingTechnique.AIDA,
            "structure": {
                "hook": "NEW + EXCLUSIVE + SCARCITY",
                "body": "Feature transformation + Social proof + Limited availability",
                "close": "Strong CTA with deadline"
            },
            "psychological_triggers": [
                "Novelty bias",
                "Fear of missing out",
                "Social proof",
                "Scarcity principle"
            ],
            "formatting_rules": {
                "bold": ["NEW", "EXCLUSIVE", "LAUNCH", "LIMITED", "key benefits"],
                "italic": ["Subtle urgency phrases", "timestamps"],
                "hyperlink": ["Product link", "Waitlist", "Early access"]
            },
            "visual_scene": "celebrating a major product breakthrough, holding a sleek matte-black Pintopay crypto card with gold laser-etched details."
        },
        
        "fomo": {
            "name": "FOMO Builder",
            "technique": CopywritingTechnique.PAS,
            "structure": {
                "hook": "SHOCKING STAT or MISSED OPPORTUNITY",
                "body": "Amplify the pain + Reveal the secret others use",
                "close": "Act now or lose out forever"
            },
            "psychological_triggers": [
                "Loss aversion",
                "Regret avoidance",
                "Herd behavior",
                "Temporal scarcity"
            ],
            "formatting_rules": {
                "bold": ["WARNING", "stats", "DON'T WAIT", "CLOSING SOON"],
                "italic": ["Whispers of insider info"],
                "hyperlink": ["Join now", "Secure spot", "Limited access"]
            },
            "visual_scene": "experiencing an intense 'don't miss out' moment, looking at a screen with rapid upward growth curves, dramatic cinematic side-lighting."
        },
        
        "authority": {
            "name": "System Authority",
            "technique": CopywritingTechnique.PASTOR,
            "structure": {
                "hook": "INDUSTRY PROBLEM everyone accepts",
                "body": "Why you're right to question it + The better way + Proof",
                "close": "Join the revolution"
            },
            "psychological_triggers": [
                "Authority bias",
                "Contrarian appeal",
                "Social proof from experts",
                "Thought leadership"
            ],
            "formatting_rules": {
                "bold": ["TRUTH", "statistics", "expert quotes", "THE REAL PROBLEM"],
                "italic": ["Industry myths", "common assumptions"],
                "hyperlink": ["Case study", "Whitepaper", "Proof"]
            },
            "visual_scene": "sharing elite financial insights, poised and knowledgeable, surrounded by holographic-style clean digital data on glass screens."
        },
        
        "lifestyle": {
            "name": "Lifestyle Flex",
            "technique": CopywritingTechnique.BAB,
            "structure": {
                "hook": "BEFORE: relatable struggle",
                "body": "AFTER: aspirational result + BRIDGE: the tool",
                "close": "Your transformation starts here"
            },
            "psychological_triggers": [
                "Aspiration trigger",
                "Relatability",
                "Transformation promise",
                "Social comparison"
            ],
            "formatting_rules": {
                "bold": ["FROM", "TO", "transformation keywords", "lifestyle benefits"],
                "italic": ["Personal reflections", "quotes"],
                "hyperlink": ["Start your journey", "See how", "Transform now"]
            },
            "visual_scene": "enjoying the rewards of decentralization, a sunset view from a luxury car interior or private marina, symbols of ultimate freedom."
        },
        
        "income": {
            "name": "Passive Income Proof",
            "technique": CopywritingTechnique.FAB,
            "structure": {
                "hook": "SPECIFIC INCOME CLAIM with proof",
                "body": "Features that enable it + Advantages over alternatives + Benefits to you",
                "close": "Start earning today"
            },
            "psychological_triggers": [
                "Greed (in healthy sense)",
                "Proof and credibility",
                "Passive income dream",
                "Concrete results"
            ],
            "formatting_rules": {
                "bold": ["Income figures", "PASSIVE", "MONTHLY", "RECURRING", "key mechanisms"],
                "italic": ["Disclaimers", "personal journey"],
                "hyperlink": ["See my results", "Start earning", "Join network"]
            },
            "visual_scene": "viewing a notification on a premium smartphone showing a large successful USDT deposit from P2PHub system."
        },
        
        "network": {
            "name": "Network Growth",
            "technique": CopywritingTechnique.QUEST,
            "structure": {
                "hook": "QUALIFY: Are you ready to scale?",
                "body": "UNDERSTAND the bottleneck + EDUCATE on leverage + STIMULATE vision",
                "close": "TRANSITION: Join the winning team"
            },
            "psychological_triggers": [
                "Qualification (exclusivity)",
                "Leverage principle",
                "Team/tribe belonging",
                "Exponential thinking"
            ],
            "formatting_rules": {
                "bold": ["SCALE", "growth metrics", "TEAM", "EXPONENTIAL", "multiplication factors"],
                "italic": ["Visionary statements"],
                "hyperlink": ["Build your network", "Join movement", "Partner program"]
            },
            "visual_scene": "surrounded by a high-energy collaborative team in a modern premium co-working space, high-fives and shared success energy."
        },
        
        "tutorial": {
            "name": "Web3 Tutorial",
            "technique": CopywritingTechnique.SSS,
            "structure": {
                "hook": "STAR: This changed everything for [audience]",
                "body": "STORY: How they did it (tutorial) + SOLUTION: You can too",
                "close": "Get started in 5 minutes"
            },
            "psychological_triggers": [
                "Social proof via story",
                "Educational value",
                "Simplification of complex topic",
                "Empowerment"
            ],
            "formatting_rules": {
                "bold": ["STEP 1", "STEP 2", "action items", "key concepts"],
                "italic": ["Pro tips", "warnings"],
                "hyperlink": ["Tutorial", "Resources", "Start here", "Guide"]
            },
            "visual_scene": "explaining a simple 1-click wealth protocol on a user-friendly mobile app, pointing at a clear 'Activate' button on the screen."
        },
        
        "partners_cards": {
            "name": "Card Authority (Product Focus)",
            "technique": CopywritingTechnique.BAB,
            "structure": {
                "hook": "THE LIQUIDITY REVOLUTION",
                "body": "Daily crypto spending reality + Freedom from banks + The physical card flex",
                "close": "Join the Elite Cardholders"
            },
            "storytelling": {
                "arc": "The Journey to Financial Sovereignty",
                "chapter_focus": "Eliminating the middleman and holding the keys to your own liquidity.",
                "episodes": [
                    {"en": "Chapter 1: The Liquidity Escape", "ru": "Глава 1: Побег в Ликвидность"},
                    {"en": "Chapter 2: No Banks, No Limits", "ru": "Глава 2: Без Банков, Без Границ"},
                    {"en": "Chapter 3: Holding the Master Key", "ru": "Глава 3: Владение Мастер-Ключом"},
                    {"en": "Chapter 4: Global Spending Power", "ru": "Глава 4: Глобальная Покупательная Способность"},
                    {"en": "Chapter 5: Absolute Sovereignty", "ru": "Глава 5: Абсолютный Суверенитет"}
                ]
            },
            "psychological_triggers": [
                "Status",
                "Utility",
                "Freedom",
                "Tangibility"
            ],
            "formatting_rules": {
                "bold": ["FINANCIAL SOVEREIGNTY", "NO BANKS", "INSTANT PAYMENTS", "CRYPTO CARD", "GLOBAL ACCEPTANCE"],
                "italic": ["Chapter 1: The Escape", "Total control of your money"],
                "hyperlink": ["Order Your Elite Card", "Get Early Access", "Secure My Card"]
            },
            "visual_scene": "A close-up of a matte black, laser-etched Pintopay card being used at a high-end luxury boutique or a private airport lounge, glowing with an 'authorized' neon pulse."
        },
        "partners_network": {
            "name": "Empire Scaling (Network Focus)",
            "technique": CopywritingTechnique.PASTOR,
            "structure": {
                "hook": "THE GEOMETRIC GROWTH PROTOCOL",
                "body": "Viral loops reveal + Automated team scaling + The $1/minute vision",
                "close": "Initiate My Partner Empire"
            },
            "storytelling": {
                "arc": "The Architect's Blueprint",
                "chapter_focus": "Building an autonomous wealth machine that outlives your effort.",
                "episodes": [
                    {"en": "Episode 1: The Architecture of Wealth", "ru": "Эпизод 1: Архитектура Богатства"},
                    {"en": "Episode 2: Geometric Scaling Protocol", "ru": "Эпизод 2: Протокол Геометрического Масштабирования"},
                    {"en": "Episode 3: The $1/Minute Vision", "ru": "Эпизод 3: Видение $1 в Минуту"},
                    {"en": "Episode 4: Autonomous Empire", "ru": "Эпизод 4: Автономная Империя"},
                    {"en": "Episode 5: The Legacy Protocol", "ru": "Эпизод 5: Протокол Наследия"}
                ]
            },
            "psychological_triggers": [
                "Leverage",
                "Exponential scaling",
                "Legacy",
                "Wealth velocity"
            ],
            "formatting_rules": {
                "bold": ["GEOMETRIC SCALING", "VIRAL LOOPS", "RESIDUAL INCOME", "NETWORK EMPIRE", "AUTOMATED GROWTH"],
                "italic": ["Episode 1: The Architecture", "Grow while you sleep"],
                "hyperlink": ["Build My Empire", "Join Elite Partners", "Scale My Network"]
            },
            "visual_scene": "A futuristic operations center where a partner is watching a 3D hologram of their global network expanding in real-time, nodes connecting across continents in a web of golden light."
        }
    }



class NativeLanguageOptimization:
    """Native-speaker quality for each language."""
    
    LANGUAGE_DNA = {
        "English": {
            "rhythm": "Direct, action-oriented, conversational",
            "idioms": ["game-changer", "no-brainer", "level up", "crack the code"],
            "cultural_refs": "Western business culture, Silicon Valley mindset",
            "formatting": "Bold for emphasis, em-dashes for rhythm",
            "sentence_structure": "SVO (Subject-Verb-Object), active voice preferred"
        },
        
        "Russian": {
            "rhythm": "Authoritative, technical precision, status-aware",
            "idioms": ["ключ к успеху", "золотая жила", "прорыв года", "инсайдерская информация"],
            "cultural_refs": "Post-Soviet entrepreneurial spirit, crypto-forward",
            "formatting": "Bold for key facts, less emoji, more data",
            "sentence_structure": "Flexible word order, uses cases for emphasis"
        },
        
        "Spanish": {
            "rhythm": "Warm, relationship-driven, passionate",
            "idioms": ["cambiar el juego", "oportunidad de oro", "revolución financiera"],
            "cultural_refs": "Latin American hustle culture, family values",
            "formatting": "Emoji-friendly, exclamation marks for energy",
            "sentence_structure": "SVO but allows flexibility, descriptive adjectives"
        },
        
        "French": {
            "rhythm": "Sophisticated, nuanced, slightly formal even when casual",
            "idioms": ["occasion en or", "révolution", "l'avenir de la finance"],
            "cultural_refs": "European financial elegance, intellectual appeal",
            "formatting": "Subtle emphasis, less bold, more italics",
            "sentence_structure": "Precise grammar, complex sentences acceptable"
        },
        
        "German": {
            "rhythm": "Efficient, technical, trust-building",
            "idioms": ["Durchbruch", "Zukunft des Geldes", "revolutionäres System"],
            "cultural_refs": "Engineering mindset, security-focused",
            "formatting": "Clear structure, bold for data, minimal emoji",
            "sentence_structure": "V2 word order, compound words, detailed precision"
        }
    }


class ViralFormulas:
    """Proven viral content patterns."""
    
    HOOK_TEMPLATES = {
        "stat_shock": "{Shocking number}% of {audience} are {missing out on/wasting/ignoring} {opportunity}",
        "secret_reveal": "The {industry} secret that {authority figure} don't want you to know about {topic}",
        "transformation": "From {pain point} to {desired state} in {timeframe}: My {tool} story",
        "contrarian": "Why {common belief} is actually {wrong/costing you/outdated}",
        "insider": "{Number} {insider group} are quietly using {tool} to {achieve result}",
        "question": "What if {provocative scenario}? (This {tool} makes it possible)",
        "personal": "I {struggled with struggle}. Then I discovered {solution}. Here's what happened..."
    }
    
    CTA_FORMULAS = {
        "scarcity": "⚡ **[Action] Now** — Only {number} {thing} left | Limited time: {deadline}",
        "social_proof": "🚀 **Join {number}+ {audience}** who are already {benefit} → [Hyperlink]",
        "risk_reversal": "✅ **Try It Risk-Free** | {guarantee} | [Start Here](link)",
        "exclusivity": "💎 **Elite Access** — Not for everyone. Are you ready? → [Apply](link)",
        "urgency": "⏰ **{Benefit} Before {deadline}** or miss out on {lost opportunity} [Act Now](link)"
    }


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
        Optimized with alru_cache to prevent excessive DB calls.
        """
        if session:
            try:
                # fetch dynamic rules
                result = await session.exec(select(KnowledgeBaseItem).where(KnowledgeBaseItem.confidence_score > 0.7))
                items = result.all()
                
                # If we have items, merge them into cache or return them
                if items:
                    dynamic_rules = [item.value for item in items if item.category == "universal_rules"]
                    if dynamic_rules:
                        # Override or extend static rules
                        return {
                            "universal_rules": dynamic_rules,
                            # Keep other static parts for now unless we structure DB better
                            "psychological_triggers": KnowledgeInsights._get_static_triggers(),
                            "formatting_precision": KnowledgeInsights._get_static_formatting()
                        }
            except Exception as e:
                # Log error but fallback gracefully
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
            "italic_usage": "Use for: Personal asides, subtle urgency, disclaimers, quotes",
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
                "Use _italic_ for subtle emphasis, whispers, insider info (2-3 times max)",
                "Keep paragraphs 1-3 sentences for mobile readability",
                "End with a question or CTA to drive engagement",
                "Include 3-5 relevant hashtags that are trending in the niche",
                "Use emojis strategically (2-4) for visual scanning, aligned with audience",
                "Create a 'scroll-stopping' first line under 10 words",
                "Include specific numbers (not 'many' or 'some') for credibility",
                "Use active voice 90% of the time for urgency"
            ],
            "psychological_triggers": KnowledgeInsights._get_static_triggers(),
            "formatting_precision": KnowledgeInsights._get_static_formatting()
        }
