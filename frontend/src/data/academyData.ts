import { LucideIcon, Rocket, Target, Zap, Award, Gem, Sparkles, MessageCircle, Users, Bot, TrendingUp, DollarSign, Megaphone, Share2, Ghost } from 'lucide-react';

export interface AcademyStage {
    id: number;
    title: string;
    description: string;
    icon: LucideIcon;
    category: 'basics' | 'viral' | 'ai' | 'sales' | 'elite';
    isPro: boolean;
    rewardXp: number;
    content?: string; // Markdown or reference to a content file/id
    duration?: string; // Estimated time to master
}

export const ACADEMY_STAGES: AcademyStage[] = [
    // --- STAGES 1-20: THE FOUNDATION (FREE) ---
    {
        id: 1,
        title: "The $1/Minute Blueprint",
        description: "Why P2PHub is the elite partner ecosystem. Learn the math of reaching $1/min through network multipliers.",
        icon: Rocket,
        category: 'basics',
        isPro: false,
        rewardXp: 100,
        duration: "3 min"
    },
    {
        id: 2,
        title: "Growth Hacking 101",
        description: "Viral loops and referrals. How to turn 1 invite into 10 active nodes using our onboarding engine.",
        icon: Target,
        category: 'viral',
        isPro: false,
        rewardXp: 150,
        duration: "5 min"
    },
    {
        id: 3,
        title: "Digital Marketing Guru 2026",
        description: "The shift to AI-driven social growth. Strategy for Telegram, Instagram, and Web3 audience acquisition.",
        icon: TrendingUp,
        category: 'basics',
        isPro: false,
        rewardXp: 200,
        duration: "7 min"
    },
    {
        id: 4,
        title: "Ghost Sharing Mastery",
        description: "Marketing secret: How to share your link without 'promoting'. The psychology of passive curiosity.",
        icon: Ghost,
        category: 'viral',
        isPro: false,
        rewardXp: 250,
        duration: "6 min"
    },
    {
        id: 5,
        title: "AI Marketing Expert: Intro",
        description: "FIRST LOOK: Exclusive AI Marketing section for PRO members. Generate viral content on autopilot 24/7.",
        icon: Bot,
        category: 'ai',
        isPro: false,
        rewardXp: 300,
        duration: "10 min"
    },
    {
        id: 6,
        title: "Automated Content Cycles",
        description: "How to use AI to auto-post content exactly to your target audience. spend less time, get maximum result.",
        icon: Sparkles,
        category: 'ai',
        isPro: false,
        rewardXp: 350,
        duration: "8 min"
    },
    {
        id: 7,
        title: "Sales Mastery: Level 1",
        description: "Best sales techniques for 2026. Closing partners by showing value, not asking for investment.",
        icon: DollarSign,
        category: 'sales',
        isPro: false,
        rewardXp: 400,
        duration: "12 min"
    },
    {
        id: 8,
        title: "TG Community Domination",
        description: "Step-by-step: From 0 to 5,000 members in your private partner group using viral hooks.",
        icon: MessageCircle,
        category: 'viral',
        isPro: false,
        rewardXp: 450,
        duration: "10 min"
    },
    {
        id: 9,
        title: "The Targeted Ads Secret",
        description: "How to run ads that pay for themselves. The self-liquidating offer model for P2P partners.",
        icon: Megaphone,
        category: 'basics',
        isPro: false,
        rewardXp: 500,
        duration: "15 min"
    },
    {
        id: 10,
        title: "Elite Retention Logic",
        description: "Your best friend in growth: Turning partners into leaders who build their own 10k+ networks.",
        icon: Users,
        category: 'viral',
        isPro: false,
        rewardXp: 550,
        duration: "10 min"
    },
    // Stages 11-20 continue the foundation...
    ...Array.from({ length: 10 }, (_, i) => ({
        id: i + 11,
        title: `Phase ${i + 11}: Foundation Mastery`,
        description: "Continuing your journey to financial freedom with elite techniques.",
        icon: Award,
        category: 'basics' as const,
        isPro: false,
        rewardXp: 600 + (i * 50)
    })),

    // --- STAGES 21-100: ELITE MASTERY (PRO) ---
    {
        id: 21,
        title: "AI Auto-Pilot 24/7: Implementation",
        description: "EXCLUSIVE: Generating and auto-posting viral content exactly to your target audience.",
        icon: Zap,
        category: 'ai',
        isPro: true,
        rewardXp: 1000,
        duration: "20 min"
    },
    {
        id: 22,
        title: "Psychology of High-Ticket Sales",
        description: "Advanced closing techniques for whale partners and high-stake deals.",
        icon: TrendingUp,
        category: 'sales',
        isPro: true,
        rewardXp: 1100
    },
    {
        id: 23,
        title: "Targeted Ads Mastery: Part 1",
        description: "Running profitable ads on Telegram and Meta for Pintopay ecosystem.",
        icon: Megaphone,
        category: 'elite',
        isPro: true,
        rewardXp: 1200
    },
    {
        id: 24,
        title: "Viral Loop Automation",
        description: "Scaling your network to 10k+ using AI-managed social cycles.",
        icon: Share2,
        category: 'viral',
        isPro: true,
        rewardXp: 1300
    },
    ...Array.from({ length: 76 }, (_, i) => ({
        id: i + 25,
        title: `Elite Mastery Stage ${i + 25}`,
        description: "Advanced strategies for reaching $1/minute and beyond.",
        icon: Gem,
        category: 'elite' as const,
        isPro: true,
        rewardXp: 1500 + (i * 100)
    }))
];

export const getCategoryColor = (category: AcademyStage['category']) => {
    switch (category) {
        case 'basics': return 'text-blue-500 bg-blue-500/10';
        case 'viral': return 'text-orange-500 bg-orange-500/10';
        case 'ai': return 'text-purple-500 bg-purple-500/10';
        case 'sales': return 'text-emerald-500 bg-emerald-500/10';
        case 'elite': return 'text-amber-500 bg-amber-500/10';
        default: return 'text-slate-500 bg-slate-500/10';
    }
};
