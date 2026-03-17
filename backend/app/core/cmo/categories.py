from .techniques import CopywritingTechnique

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
