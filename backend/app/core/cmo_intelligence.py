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
            "name": "Cryptocurrency Traders",
            "psychographics": {
                "pain_points": [
                    "High fees eating into profits",
                    "Exchange restrictions and KYC hell",
                    "Fiat off-ramp friction",
                    "Tax complexity",
                    "Fear of missing the next 100x"
                ],
                "desires": [
                    "Financial sovereignty",
                    "Quick liquidity without slippage",
                    "Tax optimization",
                    "Status in crypto communities",
                    "Early access to opportunities"
                ],
                "values": ["Decentralization", "Privacy", "Risk-taking", "Innovation"],
                "language_patterns": ["Technical precision", "Data-driven", "Skeptical of hype", "Insider jargon"],
                "triggers": ["FOMO", "Social proof from whales", "Alpha leaks", "Arbitrage opportunities"]
            },
            "tov": {
                "style": "Sharp, analytical, insider",
                "formality": "Semi-formal with crypto slang",
                "humor": "Dry, meme-aware",
                "emojis": "💎🚀📈⚡🔥",
                "sentence_length": "Short, punchy. Data-heavy.",
                "power_words": ["alpha", "degen", "moon", "ape", "diamond hands", "stack sats"]
            },
            "hooks": [
                "The {number}% fee you're paying is crushing your alpha",
                "Why whales never use traditional banks for crypto",
                "This card trick bypassed {obstacle} (used by top 1%)",
                "The {specific metric} most traders ignore (costs you ${amount}/month)"
            ],
            "visual_base": "A focused crypto trader, mid-30s, tech-wear aesthetic, clean grooming, subtle luxury wrist-wear, in a high-end multi-monitor trading command center.",
            "cta_style": "Urgent, exclusive, data-backed"
        },
        
        "nomads": {
            "name": "Digital Nomads",
            "psychographics": {
                "pain_points": [
                    "Blocked accounts when traveling",
                    "Currency conversion fees",
                    "No fixed address for banking",
                    "Income volatility",
                    "Isolation from traditional finance"
                ],
                "desires": [
                    "Location independence",
                    "Seamless global payments",
                    "Community and belonging",
                    "Freedom from 9-5",
                    "Lifestyle optimization"
                ],
                "values": ["Freedom", "Adventure", "Flexibility", "Experiences over things"],
                "language_patterns": ["Aspirational", "Story-driven", "Visual", "Community-focused"],
                "triggers": ["Lifestyle imagery", "Time freedom", "Remote work tools", "Exotic locations"]
            },
            "tov": {
                "style": "Inspirational, conversational, friend-to-friend",
                "formality": "Casual, warm",
                "humor": "Light, relatable",
                "emojis": "🌍✈️🏝️💻🌴☕",
                "sentence_length": "Medium. Storytelling flow.",
                "power_words": ["freedom", "remote", "escape", "adventure", "anywhere", "passport"]
            },
            "hooks": [
                "I've lived in {number} countries this year. Here's how I manage money.",
                "The banking hack that saved me ${amount} while traveling full-time",
                "Why digital nomads are ditching traditional banks (and what they use instead)",
                "From {location} to {location}: My financial setup for the laptop lifestyle"
            ],
            "visual_base": "A free-spirited digital nomad, minimalist high-end street-wear, working on a premium laptop at a luxury beach club or mountain resort in Bali context.",
            "cta_style": "Lifestyle-based, community-driven"
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
            "cta_style": "ROI-focused, A/B tested language"
        },
        
        "builders": {
            "name": "Network Builders",
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
            "visual_base": "A visionary leader, authoritative and inspiring, sophisticated tailored clothing, collaborating in a premium glass-walled corporate innovation suite.",
            "cta_style": "Vision-driven, team-focused"
        },
        
        "parents": {
            "name": "Stay-at-home Parents",
            "psychographics": {
                "pain_points": [
                    "Financial dependence",
                    "Limited time for complex systems",
                    "Need for security/stability",
                    "Guilt over spending",
                    "Isolation from professional world"
                ],
                "desires": [
                    "Financial contribution to household",
                    "Simple, trustworthy systems",
                    "Time with family",
                    "Personal achievement",
                    "Future security for kids"
                ],
                "values": ["Family", "Security", "Simplicity", "Trustworthiness"],
                "language_patterns": ["Empathetic", "Practical", "Supportive", "Non-technical"],
                "triggers": ["Family benefits", "Time-saving", "Safety", "Success stories from peers"]
            },
            "tov": {
                "style": "Warm, supportive, empowering",
                "formality": "Conversational, like a friend over coffee",
                "humor": "Gentle, relatable",
                "emojis": "💕👨‍👩‍👧‍👦✨🏡💪🌸",
                "sentence_length": "Medium. Easy to digest.",
                "power_words": ["simple", "family", "secure", "peace of mind", "deserve", "empower"]
            },
            "hooks": [
                "How I contribute ${amount}/month to our family while staying home",
                "The {number}-minute-a-day financial tool I wish I'd discovered sooner",
                "Why {percentage}% of stay-at-home parents are using this card (and you should too)",
                "From dependent to partner: My journey to financial contribution"
            ],
            "visual_base": "A successful, elegant parent, cozy high-end leisurewear, in a sun-drenched, modern minimalist luxury home with warm lighting.",
            "cta_style": "Gentle, reassuring, empowering"
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
                "How gen-Z is bypassing banks (and stacking wealth early)",
                "The {tool} that let me quit my part-time job (still in school)",
                "While your friends get rejected by banks, you're already scaling",
                "From broke student to ${amount}/month: The financial cheat code"
            ],
            "visual_base": "An ambitious Gen-Z student/hustler, premium street-wear, working with intense focus on a tablet in a vibrant, futuristic tech-cafe hub.",
            "cta_style": "High-energy, FOMO-driven, peer-proof"
        },
        
        "burnouts": {
            "name": "Corporate Burnouts",
            "psychographics": {
                "pain_points": [
                    "Golden handcuffs syndrome",
                    "Soul-crushing routine",
                    "Limited upside potential",
                    "Inability to escape due to bills",
                    "Identity crisis"
                ],
                "desires": [
                    "Escape the 9-5",
                    "Reclaim autonomy",
                    "Build something meaningful",
                    "Financial bridge to freedom",
                    "Second act success"
                ],
                "values": ["Autonomy", "Purpose", "Courage", "Authenticity"],
                "language_patterns": ["Reflective", "Liberation-focused", "Strategic", "Wisdom-based"],
                "triggers": ["Escape stories", "Second chances", "Life's too short", "Regret avoidance"]
            },
            "tov": {
                "style": "Reflective, strategic, empowering",
                "formality": "Mature, thoughtful",
                "humor": "Dry, ironic about corporate life",
                "emojis": "💼🔓🌅✨🚪🗝️",
                "sentence_length": "Longer. Thoughtful.",
                "power_words": ["escape", "freedom", "reclaim", "bridge", "transition", "awaken"]
            },
            "hooks": [
                "I left my ${salary} job using this financial tool (here's the plan)",
                "The bridge between corporate prison and entrepreneurial freedom",
                "How {number} ex-corporate refugees are building their exit strategy",
                "You're one financial system away from saying 'I quit'"
            ],
            "visual_base": "A relieved former corporate professional, relaxed premium linen clothing, peaceful and happy, enjoying a luxury balcony view during sunrise.",
            "cta_style": "Empowering, strategic, transformational"
        },
        
        "partners": {
            "name": "Wealth Hackers",
            "psychographics": {
                "pain_points": [
                    "Slow network growth",
                    "Lower referral commissions",
                    "Complexity of manual marketing",
                    "Limited reach",
                    "Team stagnation"
                ],
                "desires": [
                    "Grow network 100x faster",
                    "Turn $1 into $1000",
                    "Automated viral loops",
                    "Geometric team expansion",
                    "Elite partner status"
                ],
                "values": ["Leverage", "Velocity", "Automation", "Synergy"],
                "language_patterns": ["High-energy", "Visionary", "System-focused", "Growth-obsessed"],
                "triggers": ["100x Speed", "Exponential Profit", "Viral Powerhouse", "Partner Success"]
            },
            "tov": {
                "style": "Electrifying, visionary, elite",
                "formality": "Professional speaker energy",
                "humor": "Arrogantly confident (in a good way)",
                "emojis": "⚡🚀💎👑🤝💹",
                "sentence_length": "Punchy and rhythmic.",
                "power_words": ["100x", "powerhouse", "velocity", "geometric", "synergy", "dominate"]
            },
            "hooks": [
                "What if your network grew 100x faster while you slept?",
                "The $1 per minute strategy the elite 1% of partners use",
                "How to turn one partner into a viral empire in 30 days",
                "STOP chasing referrals. START architecting a viral powerhouse."
            ],
            "visual_base": "An elite wealth hacker, presence of a tech visionary, standing in a high-tech glass-walled operations center with global networking maps glowing in the background.",
            "cta_style": "High-velocity, exclusive, visionary"
        },
        
        "passive_seekers": {
            "name": "Passive Income Seekers",
            "psychographics": {
                "pain_points": ["Trading time for money", "Inflation", "Lack of scalable systems", "Complex investment tools"],
                "desires": ["Sleep income", "Financial freedom", "Simple automation", "Secure returns"],
                "values": ["Freedom", "Simplicity", "Security", "Time"],
                "language_patterns": ["Ease-focused", "Results-oriented", "Relatable"],
                "triggers": ["Automatic", "Quiet wealth", "Time freedom", "Low effort"]
            },
            "tov": {
                "style": "Calm, reassuring, authoritative",
                "formality": "Casual but professional",
                "humor": "Relatable about 9-5 grind",
                "emojis": "📈🛌💰🏝️✨",
                "sentence_length": "Clear and flowing.",
                "power_words": ["passive", "automated", "sleep", "freedom", "residual", "leverage"]
            },
            "hooks": [
                "The 'Sleep Income' protocol that runs on autopilot",
                "How to build a $1/minute residual income stream",
                "Why smart money is moving to automated referral networks",
                "Escape the time-for-money trap with this one system"
            ],
            "visual_base": "A serene individual enjoying a luxury breakfast on a sun-drenched terrace, looking at a tablet showing consistent passive earnings growth.",
            "cta_style": "Ease-oriented, trust-based"
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
