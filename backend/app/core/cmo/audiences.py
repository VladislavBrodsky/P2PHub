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
