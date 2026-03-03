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
                "triggers": ["Exponential Alpha", "Institutional bypass", "Liquidity leaks", "Elite social proof", "Frontrunning the Legacy"],
            },
            "archetype": "The Strategist",
            "hidden_need": "Significance through Mastery",
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
                "Your asymmetric alpha isn't in the chart; it's in the infrastructure.",
                "Sovereign Velocity: Why the elite move assets outside the 'Legacy Box'.",
                "The institutional bypass for the new crypto aristocracy."
            ],
            "visual_base": "A world-class Crypto Strategist and Alpha Whale, mid-30s, embodying 'Quiet Luxury' in a bespoke charcoal blazer. A look of profound strategic focus; the subject is captured mid-thought, radiating strategic power. Shot on Leica M11, 35mm f/1.4.",
            "cta_style": "Stealth, authoritative, high-stakes",
            "scene_pool": ["fintech_bank", "luxury_car", "rooftop_dubai", "conference"],
            "viral_hashtags": ["#CryptoAlpha", "#WhaleStrategy", "#AsymmetricBeta", "#CapitalMobility"]
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
                "triggers": ["Lifestyle arbitrage", "Freedom metrics", "Private travel hacks", "Status signals", "Geofence escape"],
            },
            "archetype": "The Explorer",
            "hidden_need": "Autonomy through Mobility",
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
            "visual_base": "A high-status 'Global Sovereign' in premium, wrinkle-free leisure wear (cashmere and neutral tones). The subject is poised, looking towards the horizon with a sense of absolute calm and purposeful mobility. Natural light highlighting high-status accessories.",
            "cta_style": "Inspirational, high-status",
            "scene_pool": ["airport_lounge", "cafe_nomad", "luxury_train", "rooftop_dubai"],
            "viral_hashtags": ["#SovereignNomad", "#GlobalMobility", "#WealthArbitrage", "#DigitalEmpire"]
        },
        
        "affiliates": {
            "name": "Affiliate Marketers",
            "performing_keywords_2026": ["Commission Scale", "Payout Infrastructure", "Traffic Sovereignty", "Conversion Alpha"],
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
                "triggers": ["Revenue increase", "Efficiency gains", "Competitive edge", "Case studies", "Shadowban Protection"],
            },
            "archetype": "The Optimization Master",
            "hidden_need": "Financial Leverage",
            "tov": {
                "style": "Results-driven, tactical, no-BS",
                "formality": "Professional but direct",
                "humor": "Minimal, sarcastic if any",
                "emojis": "📊💰🎯🔥💡",
                "sentence_length": "Short. Action-oriented.",
                "power_words": ["convert", "scale", "ROI", "margin", "optimize", "funnel"]
            },
            "hooks": [
                "I was looking at my margin leakage last quarter, and it was brutal. Until I switched the architecture.",
                "The payment infrastructure that the top 1% of our network quietly uses. Let's talk about it.",
                "Most people are still losing 5% on payout friction. We completely eliminated it.",
                "I tested every payment rail out there. Only one actually scaled without holding my liquidity hostage."
            ],
            "visual_base": "A charismatic marketing visionary in modern casual-luxury attire, holding a sleek titanium smartphone. The subject radiates energy and analytical mastery, with a posture of confident command over their digital empire.",
            "lead_magnets": ["The 2026 Conversion Cheat-Sheet", "Affiliate Alpha: The Margin Optimization Blueprint", "The Instant Payout Protocol"],
            "cta_style": "ROI-focused, A/B tested language",
            "scene_pool": ["coworking", "luxury_life", "conference", "luxury_car"],
            "viral_hashtags": ["#AffiliateMarketing", "#ROIHunter", "#ScalableIncome", "#ConversionMaster"]
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
                "triggers": ["Duplication", "Team success stories", "Rank advancement", "Passive income", "Tribe Loyalty"],
            },
            "archetype": "The Architect",
            "hidden_need": "Influence through Infrastructure",
            "tov": {
                "style": "Visionary, empowering, magnetic",
                "formality": "Motivational speaker energy",
                "humor": "Uplifting, positive",
                "emojis": "🚀🌟💎👑🔥⚡",
                "sentence_length": "Varied. Rhythm for emphasis.",
                "power_words": ["team", "empire", "legacy", "duplicate", "residual", "exponential"]
            },
            "hooks": [
                "You can't build a massive network on fragile infrastructure. Here is what we changed.",
                "Retention used to be our biggest bottleneck. Then we upgraded the financial base.",
                "Why the strongest leaders in my circle are migrating their entire structure to sovereign rails.",
                "From a scattered team to a synchronized global architecture. Here is the exact blueprint."
            ],
            "visual_base": "An elite FinTech leader and Community Architect with magnetic energy. Dressed in sharp, bespoke attire; the subject is captured in a moment of visionary command, gesturing towards an unseen display of growth. Aura of high-status leadership.",
            "lead_magnets": ["The Duplication Masterclass: 0 to 10k", "The Team Retention Blueprint", "The Legacy Network Architecture (Video)"],
            "cta_style": "Vision-driven, team-focused",
            "scene_pool": ["conference", "coworking", "luxury_life", "rooftop_dubai"],
            "viral_hashtags": ["#NetworkEmpire", "#GrowthLeader", "#LegacyWealth", "#P2PRevolution"]
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
                "triggers": ["Future security", "Simplicity hacks", "Quiet confidence", "Legacy stories", "Absolute Safety"],
            },
            "archetype": "The Guardian",
            "hidden_need": "Generational Legacy",
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
            "visual_base": "A sophisticated 'Legacy Architect' parent in premium organic textures (linen, silk). A moment of profound peace and control; a look of 'reached the finish line' satisfaction. Representing calm generational success.",
            "lead_magnets": ["The Family Sovereign Trust Setup", "Generational Yield: A Legacy Masterclass", "The 15-Minute Passive Abundance Guide"],
            "cta_style": "Graceful, empowering, trust-focused",
            "scene_pool": ["luxury_life", "cafe_nomad", "rooftop_dubai", "luxury_car"],
            "viral_hashtags": ["#FamilyLegacy", "#PassiveWealth", "#SecureFuture", "#LegacyBuilding"]
        },
        
        "hustlers": {
            "name": "Emerging Alpha Architects",
            "performing_keywords_2026": ["Asymmetric Hustle", "Early Momentum", "Neural Income", "Status Stacking"],
            "psychographics": {
                "pain_points": [
                    "Debt-fueled education cycles",
                    "Credential stagnation",
                    "Missing the early adoption wave",
                    "Geographic financial friction",
                    "Identity suppression in junior roles"
                ],
                "desires": [
                    "Leapfrog the corporate ladder",
                    "Build a 7-figure personal brand",
                    "Absolute autonomous income",
                    "Early retirement before 30",
                    "Global peer status"
                ],
                "values": ["Velocity", "Innovation", "Risk Mastery", "Freedom"],
                "language_patterns": ["High-energy", "Visionary", "Analytical", "Rebellious"],
                "triggers": ["Early advantage", "Peer-led revolutions", "Anti-legacy banking", "Rapid status gains", "The Leapfrog Effect"],
            },
            "archetype": "The Rebel",
            "hidden_need": "Status through Velocity",
            "tov": {
                "style": "High-velocity, rebellious, future-proof",
                "formality": "Casual mastery",
                "humor": "Self-aware, forward-leaning",
                "emojis": "⚡💸🎓🚀🔥",
                "sentence_length": "Short. Punchy. Relentless.",
                "power_words": ["momentum", "asymmetric", "stack", "leapfrog", "architect", "alpha"]
            },
            "hooks": [
                "The corporate ladder is broken. We built a elevator outside the building.",
                "Why I stopped trading grades for debt and started trading insights for liquidity.",
                "Alpha Stacking: How to build a financial fortress before your first interview.",
                "Chapter 1: Decoupling your potential from your credentials."
            ],
            "visual_base": "A high-status 'Emerging Alpha' in clean, architectural streetwear. A look of high-velocity ambition and technical focus; checking a premium device with a sense of rebellious mastery. Raw energy meets tactical precision.",
            "lead_magnets": ["The Asymmetric Income Protocol", "Status Stacking: The Early Wealth Blueprint", "The 1-Click Sovereign Setup"],
            "cta_style": "High-velocity, action-oriented",
            "scene_pool": ["luxury_car", "airport_lounge", "conference", "luxury_life"],
            "viral_hashtags": ["#AlphaArchitect", "#StudentWealth", "#EarlyMomentum", "#HustleRevolution"]
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
                "triggers": ["Exit blueprints", "Second acts", "Autonomy metrics", "Identity shifts", "The Redemption Arc"],
            },
            "archetype": "The Seeker",
            "hidden_need": "Redemption from the Suit",
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
            "visual_base": "A serene former executive in premium weekend-luxe (cashmere and silk). A sense of ultimate liberation and quiet wealth; a subtle, knowing smile of absolute autonomy. Decoupled from the corporate cycle.",
            "lead_magnets": ["The 18-Month Sovereign Exit Blueprint", "Identity Decoupling: The Boardroom to Freedom Guide", "Corporate Escape: The Liquidity Bridge Protocol"],
            "cta_style": "Strategic, empowering, elite",
            "scene_pool": ["luxury_life", "cafe_nomad", "rooftop_dubai", "airport_lounge"],
            "viral_hashtags": ["#CorporateExit", "#FreedomProtocol", "#SovereignIdentity", "#ExitStrategy"]
        },
        
        "partners": {
            "name": "Global Network Architects",
            "performing_keywords_2026": ["Geometric Network", "Viral Infrastructure", "Global Sovereignty", "Team Duplication", "Leverage Architecture", "Revenue Velocity"],
            "psychographics": {
                "pain_points": [
                    "Manual marketing limitations",
                    "Network stagnation",
                    "Low duplication velocity",
                    "Lack of global viral infrastructure",
                    "Centralized payment bottlenecks",
                    "Fragmentation of team energy"
                ],
                "desires": [
                    "Geometric network expansion",
                    "Global team authority",
                    "Automated viral growth loops",
                    "High-status leadership positioning",
                    "Synergistic revenue acceleration",
                    "Absolute operational autonomy"
                ],
                "values": ["Universal Growth", "Velocity of Trust", "Leveraged Leadership", "Visionary Abundance", "Infrastructure over Hustle"],
                "language_patterns": ["Professional Native Mastery", "Authoritative yet Inspiring", "Global Context", "Viral Dynamics", "Strategic Minimalist"],
                "triggers": ["Exponential Opportunity", "Global Financial Shift", "Team Empowerment", "Systemic Mastery", "Universal Synergy", "Institutional Alpha"],
            },
            "archetype": "The Global Architect",
            "hidden_need": "Global Impact through Infrastructure",
            "tov": {
                "style": "Global Leader, Professional Native Speaker, Viral Strategist",
                "formality": "High-status professional with magnetic visionary energy",
                "humor": "Sophisticated, global, empowering",
                "emojis": "✨🌍🤝💎👑⚡",
                "sentence_length": "Rhythmic, powerful, and impeccably structured.",
                "power_words": ["velocity", "transformation", "geometric", "synergy", "global", "ecosystem", "leverage", "infrastructure"]
            },
            "hooks": [
                "The Global Financial Shift isn't a challenge; it's our greatest shared opportunity.",
                "How to architect a viral powerhouse that scales across borders while you inspire.",
                "The 100x Growth Blueprint: Turning geometric networking into a global standard.",
                "Universal Abundance: The leadership strategy for the Digital Gold Rush.",
                "Why the elite 1% are abandoning manual hustle for automated global systems."
            ],
            "visual_base": "A world-class Global Network Architect embodying 'Investment Banking' status. Dressed in bespoke, sun-drenched luxury. A posture of international authority and expansive vision, looking towards a global future. Shot on Leica M11, 50mm f/0.95.",
            "lead_magnets": ["The Global Expansion Protocol", "Cross-Border Wealth: The 2026 Masterplan", "The Universal Viral Reach Guide"],
            "cta_style": "High-status, visionary, collaborative",
            "scene_pool": ["airport_lounge", "conference", "fintech_bank", "luxury_car", "rooftop_dubai"],
            "viral_hashtags": ["#NetworkArchitect", "#GlobalGrowth", "#ViralLeadership", "#GeometricWealth", "#SovereignPartner"]
        },
        
        "passive_seekers": {
            "name": "Liquidity Sovereigns",
            "performing_keywords_2026": ["Passive Density", "Autonomous Yield", "Geometric Cashflow", "Velocity of Trust"],
            "psychographics": {
                "pain_points": ["Time-exchange friction", "Inflationary decay", "Systemic complexity", "Manual outreach burnout"],
                "desires": ["Sleep-velocity income", "Unrestricted time-wealth", "Systemic automation", "Resilient capital abundance"],
                "values": ["Freedom", "Efficiency", "Logic", "Legacy"],
                "language_patterns": ["Ease-focused", "Metrics-driven", "Visionary"],
                "triggers": ["Geometric scaling", "Autonomous yield", "Life-optimization", "Quiet wealth", "Effortless Logic"],
            },
            "archetype": "The Sage",
            "hidden_need": "Financial Peace",
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
            "visual_base": "A world-class 'Liquidity Sovereign' relaxed in a high-end minimalist setting. Natural light casting soft shadows on rich textures (linen, stone, silk). Embodying effortless authority and the spirit of 'Sleep-Velocity' wealth. Shot on Leica M11.",
            "lead_magnets": ["The Autonomous Yield Protocol", "Geometric Cashflow: The 2026 Architecture", "Quiet Wealth: The 1-Click Setup"],
            "cta_style": "Effortless, logical, high-value",
            "scene_pool": ["cafe_nomad", "luxury_life", "rooftop_dubai", "airport_lounge"],
            "viral_hashtags": ["#PassiveIncome", "#FinancialAutonomy", "#WealthDensity", "#SleepVelocity"]
        },
        
        "growth_masters": {
            "name": "Growth Masters",
            "performing_keywords_2026": ["Scale Velocity", "Algorithmic Leverage", "Conversion Optimization", "Growth Protocol"],
            "psychographics": {
                "pain_points": ["Saturation", "Low conversion rates", "Manual outreach burnout", "Ineffective funnels"],
                "desires": ["Extreme scale", "Algorithmic advantage", "Market dominance", "Efficient duplication"],
                "values": ["Efficiency", "Metrics", "Speed", "Innovation"],
                "language_patterns": ["Data-driven", "Strategic", "Direct"],
                "triggers": ["Scale", "Optimization", "Competitive edge", "Viral loops", "Algorithmic Dominance"],
            },
            "archetype": "The Tactician",
            "hidden_need": "Significance through Growth",
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
            "visual_base": "A sharp, modern growth strategist embodying 'Results Mastery'. Dressed in minimalist, high-status office-luxe; leaning forward with a sense of analytical obsession and tactical command.",
            "lead_magnets": ["The High-Conversion Funnel Blueprint", "Algorithmic Advantage: The Viral Loop Setup", "The 100x Growth Screener"],
            "cta_style": "Data-backed, high-conversion",
            "scene_pool": ["coworking", "fintech_bank", "conference", "rooftop_dubai"],
            "viral_hashtags": ["#GrowthMaster", "#ScaleExpert", "#MarketingAlpha", "#VelocityGrowth"]
        },
        
        "automation_kings": {
            "name": "Automation Kings",
            "performing_keywords_2026": ["Autonomous Systems", "Neural Protocols", "Set-and-Forget Wealth", "Systemic Autonomy"],
            "psychographics": {
                "pain_points": ["Manual overhead", "Human error", "Inconsistency", "Time drain"],
                "desires": ["Full autonomy", "Perfect systems", "Set and forget income", "Infinite scalability"],
                "values": ["Logic", "Productivity", "Freedom", "Consistency"],
                "language_patterns": ["Technical", "Logical", "System-oriented"],
                "triggers": ["Hands-free", "Systematic", "Zero effort", "Infinite scale", "Perfect Consistency"],
            },
            "archetype": "The Magician",
            "hidden_need": "Freedom through Automation",
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
            "visual_base": "A tech-savvy entrepreneur and 'Magician of Systems'. Captured relaxed in a high-tech setting, reflecting the spirit of 'set and forget' wealth. A sense of cool, effortless command over complex systems.",
            "lead_magnets": ["The Hands-Free Wealth Protocol", "Infinite Scale: The Automation Stack", "The Set and Forget Setup Guide"],
            "cta_style": "System-focused, efficiency-driven",
            "scene_pool": ["luxury_life", "coworking", "airport_lounge", "rooftop_dubai"],
            "viral_hashtags": ["#AutomationKing", "#PassiveAutopilot", "#WealthTech", "#SystemMastery"]
        },
        
        "empire_builders": {
            "name": "Empire Builders",
            "performing_keywords_2026": ["Global Empire", "Financial Dynasty", "Legacy Architecture", "Sovereign Dominance"],
            "psychographics": {
                "pain_points": ["Small thinking", "Slow progression", "Lack of legacy", "Weak infrastructure"],
                "desires": ["Generational wealth", "Global influence", "Massive team legacy", "The $1/minute lifestyle"],
                "values": ["Legacy", "Power", "Ambition", "Sustainability"],
                "language_patterns": ["Visionary", "Grand", "Inspirational"],
                "triggers": ["Legacy", "Empire", "Financial Dynasty", "Global Reach", "Generational Power"],
            },
            "archetype": "The Ruler",
            "hidden_need": "Legacy Dominance",
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
            "visual_base": "A powerful and visionary 'Ruler' of a global dynasty. Captured overlooking a vast metropolitan landscape; embodying ultimate status, power, and generational success. High-status, commanding posture.",
            "lead_magnets": ["The Empire Architecture Blueprint", "Generational Wealth Dynasty Guide", "The $1/Minute Roadmap"],
            "cta_style": "Legacy-themed, visionary",
            "scene_pool": ["luxury_life", "luxury_car", "rooftop_dubai", "fintech_bank"],
            "viral_hashtags": ["#EmpireBuilder", "#DynastyWealth", "#GlobalLegacy", "#SovereignPower"]
        },
        
        "travelers": {
            "name": "Global Mobility Sovereigns (Travelers & Immigrants)",
            "performing_keywords_2026": ["Border-Free Liquidity", "Portable Wealth", "Safe-Haven Asset Mobility", "Family Support Network"],
            "psychographics": {
                "pain_points": [
                    "High remittance fees to home countries",
                    "Currency devaluation and inflation",
                    "Banking geofencing and frozen accounts",
                    "Difficulty proving credit history internationally",
                    "Bureaucratic friction in global movement"
                ],
                "desires": [
                    "Dollar-denominated stability for families",
                    "Instant cross-border card spending",
                    "Financial identity portability",
                    "Safety-haven assets outside domestic systems",
                    "Elite status and recognition in transit"
                ],
                "values": ["Family", "Stability", "Mobility", "Resilience"],
                "language_patterns": ["Hopeful/Aspirational", "Safety-oriented", "Practical", "Community-minded"],
                "triggers": ["Family security", "Zero-free remittance", "Inflation protection", "Status in transit", "Portable Home"],
            },
            "archetype": "The Pioneer",
            "hidden_need": "Belonging through Mobility",
            "tov": {
                "style": "Practical, warm, authoritative",
                "formality": "High but accessible",
                "humor": "Minimal, focusing on resilience",
                "emojis": "🌍🏠💳✨🛡️",
                "sentence_length": "Clear. Direct. Reassuring.",
                "power_words": ["stability", "sovereign", "portable", "secure", "home", "freedom"]
            },
            "hooks": [
                "The portable financial identity for the new global citizen.",
                "Stop losing your wealth to domestic inflation and remittance fees.",
                "Your assets should be as mobile as you are. Here is the protocol.",
                "Building a dollarized bridge to support my family from any continent."
            ],
            "visual_base": "A poised and determined 'Pioneer' in a high-contrast transit setting. Premium travel gear, a sense of absolute calm and purposeful mobility. The embodiment of border-free financial identity.",
            "lead_magnets": ["The Sovereign Traveler's Financial Toolkit", "Zero-Fee Remittance: The 2026 Guide", "The Portable Wealth Blueprint"],
            "cta_style": "Safety-focused, empowering",
            "scene_pool": ["luxury_train", "airport_lounge", "cafe_nomad", "luxury_life"],
            "viral_hashtags": ["#GlobalSovereignty", "#TravelerFinance", "#WealthMobility", "#FamilyFirst"]
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
            "visual_scene": "In a moment of profound success, holding the matte-black, laser-etched Pintopay card. Warm lighting catches the metallic details, reflecting a new era of financial power.",
            "scene_bias": ["conference", "fintech_bank", "luxury_car"],
            "viral_hashtags": ["#PostLaunch", "#NewAlpha", "#P2PRevolution"],
            "seo_keywords": ["Product Launch", "Exclusive Access", "Financial Innovation"]
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
            "visual_scene": "Observing a surge of geometric growth on a minimalist display. Cinematic side-lighting and a sense of high-stakes urgency and strategic realization.",
            "scene_bias": ["fintech_bank", "conference", "luxury_car"],
            "viral_hashtags": ["#CryptoFOMO", "#AlphaLeak", "#LimitedSlots"],
            "seo_keywords": ["FOMO Marketing", "Urgent Opportunity", "Crypto Growth"]
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
            "visual_scene": "Sharing elite insights within a sophisticated digital sanctuary. Surrounded by clean, architectural data-visualizations reflecting intellectual mastery and calm authority.",
            "scene_bias": ["fintech_bank", "conference", "coworking"],
            "viral_hashtags": ["#ExpertInsight", "#SystemMastry", "#ThoughtLeader"],
            "seo_keywords": ["Industry Trends", "Market Analysis", "Strategic Authority"]
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
            "visual_scene": "Embodying modern freedom; a sunset reflection on the polished surfaces of a luxury environment, signifying a life decoupled from traditional constraints.",
            "scene_bias": ["luxury_life", "airport_lounge", "cafe_nomad"],
            "viral_hashtags": ["#EliteLifestyle", "#FreedomGoals", "#WealthPivot"],
            "seo_keywords": ["Financial Freedom", "Lifestyle Design", "Success Stories"]
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
            "visual_scene": "A subtle, high-status notification on a premium device. The background is a blurred, sun-drenched sanctuary of success and quiet abundance.",
            "scene_bias": ["rooftop_dubai", "luxury_car", "luxury_life"],
            "viral_hashtags": ["#PassiveIncome", "#CryptoEarnings", "#WealthVelocity"],
            "seo_keywords": ["Passive Income", "Crypto ROI", "Earning Potential"]
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
            "visual_scene": "Inside a world-class architectural co-working space. An atmosphere of shared elite achievement and magnetic network energy.",
            "scene_bias": ["coworking", "conference", "luxury_life"],
            "viral_hashtags": ["#TeamGrowth", "#NetworkScale", "#LeverageWealth"],
            "seo_keywords": ["Network Marketing", "Team Building", "Exponential Growth"]
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
            "visual_scene": "Effortlessly navigating a sleek, 1-click wealth protocol on a high-end interface. The aesthetic is clean, fast, and empowering.",
            "scene_bias": ["cafe_nomad", "fintech_bank", "airport_lounge"],
            "viral_hashtags": ["#Web3Tutorial", "#CryptoGuide", "#WealthProtocol"],
            "seo_keywords": ["Web3 Education", "Crypto How-To", "Financial Literacy"]
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
                "Tangibility",
                "Social Significance"
            ],
            "formatting_rules": {
                "bold": ["FINANCIAL SOVEREIGNTY", "NO BANKS", "INSTANT PAYMENTS", "CRYPTO CARD", "GLOBAL ACCEPTANCE", "ELITE STATUS"],
                "italic": ["Chapter 1: The Escape", "Total control of your money"],
                "hyperlink": ["Order Your Elite Card", "Get Early Access", "Secure My Card"]
            },
            "visual_scene": "A macro shot of the bespoke Pintopay card resting on a marble surface in an elite lounge. The light catches the intricate etchings and the 'authorized' status pulse. Highly detailed, cinematic texture.",
            "scene_bias": ["airport_lounge", "luxury_life", "luxury_car"],
            "viral_hashtags": ["#CryptoCard", "#LiquidityFreedom", "#PintopayElite", "#StatusSymbol"],
            "seo_keywords": ["Crypto Debit Card", "Financial Freedom", "Legacy Banking Exit", "Premium Crypto Banking"]
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
                "Wealth velocity",
                "Duplication Magic"
            ],
            "formatting_rules": {
                "bold": ["GEOMETRIC SCALING", "VIRAL LOOPS", "RESIDUAL INCOME", "NETWORK EMPIRE", "AUTOMATED GROWTH", "DUPLICATION VELOCITY"],
                "italic": ["Episode 1: The Architecture", "Grow while you sleep"],
                "hyperlink": ["Build My Empire", "Join Elite Partners", "Scale My Network"]
            },
            "visual_scene": "Inside a high-stakes vision suite. A partner observes a 3D golden network expanding across continents—a minimalist, cinematic representation of global geometric scale. Warm, high-status illumination.",
            "scene_bias": ["conference", "fintech_bank", "rooftop_dubai", "luxury_car"],
            "viral_hashtags": ["#EmpireScaling", "#ViralLoops", "#WealthMachine", "#GeometricGrowth", "#LegacyNetwork"],
            "seo_keywords": ["Network Architecture", "Passive Income Systems", "Geometric Scaling", "Viral Marketing Automation"]
        }
    }




class ToneIntelligence:
    """Psychological and viral markers for each Tone of Voice."""
    
    TONES = {
        "provocative": {
            "viral_hashtags": ["#GameChanger", "#MarketShift", "#UnpopularOpinion", "#RealityCheck"],
            "seo_keywords": ["Transformation", "Market Disruption", "Shocking Truth"]
        },
        "authoritative": {
            "viral_hashtags": ["#MarketInsights", "#ExpertAnalysis", "#FinancialStability", "#MarketAlpha"],
            "seo_keywords": ["Strategic Analysis", "Data-Driven Wealth", "Institutional Quality"]
        },
        "empathetic": {
            "viral_hashtags": ["#PersonalGrowth", "#CommunityFirst", "#SharedSuccess", "#HumanSide"],
            "seo_keywords": ["Community Value", "Personal Journey", "Empowerment"]
        },
        "cynical": {
            "viral_hashtags": ["#AntiHype", "#NoBS", "#MarketFilter", "#RealValue"],
            "seo_keywords": ["Zero Fluff", "Market Integrity", "Transparent Finance"]
        },
        "minimalist": {
            "viral_hashtags": ["#EliteStatus", "#PureAlpha", "#MinimalistWealth", "#HighSignal"],
            "seo_keywords": ["Quiet Luxury", "High Signal Wealth", "Minimalist Success"]
        },
        "aggressive": {
            "viral_hashtags": ["#DirectResults", "#ScaleNow", "#WealthVelocity", "#Execute"],
            "seo_keywords": ["High Pressure Success", "Rapid Scaling", "Immediate Results"]
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
        "stat_shock": "I was looking at the data on {topic}, and {audience} are quietly losing their edge because of this...",
        "secret_reveal": "There’s a shift happening in {industry} that most people won't notice until 2027.",
        "transformation": "It took me {timeframe} to get out of the {pain point} trap. The turning point was understanding {tool}.",
        "contrarian": "I stopped believing in {common belief} when I realized it was built to keep us stuck. Here is what I do instead.",
        "insider": "My private network has been quietly deploying {tool} to {achieve result}. Let me show you the architecture.",
        "question": "If you had absolute autonomy over your {provocative scenario}, what would you build next?",
        "personal": "A few months ago, I was dealing with {struggle}. I didn't want a quick fix, I wanted a systemic solution. And I found it."
    }
    
    CTA_FORMULAS = {
        "scarcity": "⚡ **[Join the Network]({link})** — The window for this specific architecture won't stay open.",
        "social_proof": "🚀 **[Join the Network]({link})** — We are building something unstoppable.",
        "risk_reversal": "✅ **[Join the Network]({link})** | Step into absolute financial autonomy.",
        "exclusivity": "💎 **[Join the Network]({link})** — An elite circle reserved for visionaries.",
        "urgency": "⏰ **[Join the Network]({link})** — The Global Shift is happening. Choose your side."
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
