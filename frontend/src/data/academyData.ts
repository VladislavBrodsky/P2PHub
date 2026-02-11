import { LucideIcon, Rocket, Flame, Target, Zap, Shield, Medal, Award, Gem, Crown, Trophy, Star, Sparkles, Send, Instagram, MessageCircle, Users, Download, PlayCircle, BookOpen, Bot, TrendingUp, DollarSign, Megaphone, Share2, Ghost } from 'lucide-react';

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
        title: "Ignition: $1/Minute Vision",
        description: "The math behind global financial sovereignty. Why P2PHub is the last tool you'll ever need.",
        icon: Rocket,
        category: 'basics',
        isPro: false,
        rewardXp: 100,
        duration: "5 min"
    },
    {
        id: 2,
        title: "Ecosystem Mastery",
        description: "Understanding the bridge between TON, USDT, and Pintopay banking.",
        icon: Shield,
        category: 'basics',
        isPro: false,
        rewardXp: 150,
        duration: "7 min"
    },
    {
        id: 3,
        title: "The Viral Blueprint",
        description: "How to set up your profile for maximum trust and conversion.",
        icon: Target,
        category: 'viral',
        isPro: false,
        rewardXp: 200,
        duration: "10 min"
    },
    {
        id: 4,
        title: "Ghost Sharing Secrets",
        description: "How to share without being 'salesy'. The psychology of curiosity.",
        icon: Ghost,
        category: 'viral',
        isPro: false,
        rewardXp: 250,
        duration: "8 min"
    },
    {
        id: 5,
        title: "AI Marketing Expert: Part 1",
        description: "Introduction to AI-driven growth. Why humans can't compete with 24/7 automation.",
        icon: Bot,
        category: 'ai',
        isPro: false,
        rewardXp: 300,
        duration: "12 min"
    },
    {
        id: 6,
        title: "AI Auto-Pilot Strategies",
        description: "Exclusive look into generating viral content on autopilot 24/7.",
        icon: Zap,
        category: 'ai',
        isPro: false,
        rewardXp: 350,
        duration: "8 min"
    },
    {
        id: 7,
        title: "TG Channel Architecture",
        description: "Building a structure that retains 90% of new members.",
        icon: MessageCircle,
        category: 'viral',
        isPro: false,
        rewardXp: 400
    },
    {
        id: 8,
        title: "The $100 Day Milestone",
        description: "Step-by-step to your first consistent $100 daily earnings.",
        icon: DollarSign,
        category: 'basics',
        isPro: false,
        rewardXp: 450
    },
    {
        id: 9,
        title: "Instagram Reels Optimization",
        description: "The 3-second hook theory for financial services.",
        icon: Instagram,
        category: 'viral',
        isPro: false,
        rewardXp: 500
    },
    {
        id: 10,
        title: "Community Retention Logic",
        description: "Turning followers into a loyal army of partners.",
        icon: Users,
        category: 'viral',
        isPro: false,
        rewardXp: 550
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
