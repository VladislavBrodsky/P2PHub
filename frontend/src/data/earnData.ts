import { LucideIcon, Users, MessageCircle, CreditCard, Send, CheckCircle2, Lock, Gift, Zap, Star, Trophy, Crown, UserPlus, Shield } from 'lucide-react';

export interface Task {
    id: string;
    title: string;
    description: string;
    platform?: 'telegram' | 'twitter' | 'youtube' | 'internal';
    icon: LucideIcon;
    reward: number;
    type: 'social' | 'referral' | 'milestone' | 'action';
    requirement?: number; // e.g., 3 referrals
    link?: string;
    minLevel: number;
    image?: string;
    isRecurring?: boolean;
}

export const EARN_TASKS: Task[] = [
    // Level 1: Onboarding
    {
        id: 'telegram_bot',
        title: 'Open Pintopay Bot',
        description: 'Start your journey with our official bot.',
        platform: 'telegram',
        icon: Send,
        reward: 100,
        type: 'social',
        link: 'https://t.me/pintopaybot?start=p_6977c29c66ed9faa401342f3',
        minLevel: 1
    },
    {
        id: 'banking_app',
        title: 'Join Banking Super App',
        description: 'Connect with the future of finance.',
        platform: 'telegram',
        icon: CreditCard,
        reward: 150,
        type: 'social',
        link: 'https://t.me/+voIV_gzh0ag0ZWE5',
        minLevel: 1
    },
    {
        id: 'community_chat',
        title: 'Join Community',
        description: 'Meet other partners and share strategies.',
        platform: 'telegram',
        icon: MessageCircle,
        reward: 100,
        type: 'social',
        link: 'https://t.me/pintopayworld',
        minLevel: 1
    },
    {
        id: 'ambassador_hub',
        title: 'Web3 Ambassador Hub',
        description: 'Follow for growth tips and updates.',
        platform: 'telegram',
        icon: Users,
        reward: 200,
        type: 'social',
        link: 'https://t.me/pintopaygrowth',
        minLevel: 1
    },

    // Level 1: Viral Loop (The core mechanic)
    {
        id: 'invite_3_friends',
        title: 'Invite 3 Friends',
        description: 'Build your initial network to unlock Level 2.',
        platform: 'internal',
        icon: Users,
        reward: 500,
        type: 'referral',
        requirement: 3,
        minLevel: 1,
        image: 'https://placehold.co/600x400/0066FF/FFFFFF/png?text=Invite+Friends'
    },

    // Level 5: Consistency
    {
        id: 'daily_checkin_5',
        title: '5 Day Streak',
        description: 'Open the app 5 days in a row.',
        platform: 'internal',
        icon: CheckCircle2,
        reward: 250,
        type: 'action',
        minLevel: 5,
        requirement: 5
    },

    // Level 10: Expansion
    {
        id: 'invite_10_friends',
        title: 'Network Builder',
        description: 'Expand your team to 10 partners.',
        platform: 'internal',
        icon: Users,
        reward: 1000,
        type: 'referral',
        requirement: 10,
        minLevel: 10
    }
];

export const ACHIEVEMENTS = [
    // Onboarding Tier
    { id: 'onboard_1', level: 1, reward: 'Day 1 Vanguard', icon: CheckCircle2, color: 'text-emerald-400' },
    { id: 'streak_3', level: 3, reward: '3 Day Warrior', icon: Zap, color: 'text-yellow-400' },
    { id: 'streak_7', level: 7, reward: '7 Day Elite', icon: Zap, color: 'text-yellow-500' },

    // Viral Tier
    { id: 'viral_blitz', level: 2, reward: 'Blitz 10 (24h)', icon: Users, color: 'text-rose-500' },
    { id: 'viral_tsunami', level: 15, reward: 'Viral Tsunami', icon: Shield, color: 'text-purple-500' },

    // Referral Tier
    { id: 'ref_node', level: 5, reward: 'Active Node', icon: UserPlus, color: 'text-blue-400' },
    { id: 'ref_star', level: 12, reward: 'Rising Star', icon: Star, color: 'text-blue-300' },
    { id: 'ref_ambassador', level: 24, reward: 'Global Ambassador', icon: Users, color: 'text-indigo-400' },
    { id: 'ref_monarch', level: 50, reward: 'Network Monarch', icon: Crown, color: 'text-amber-500' },
];

export const MILESTONES = [
    { level: 3, reward: 'Founder Access', icon: Lock, color: 'text-slate-400' },
    { level: 10, reward: 'Silver Badge', icon: Shield, color: 'text-slate-300' },
    { level: 25, reward: 'Card Fee -10%', icon: CreditCard, color: 'text-blue-400' },
    { level: 50, reward: 'Black Card Ready', icon: CreditCard, color: 'text-neutral-900 dark:text-white' },
    { level: 75, reward: 'Empire Status', icon: Trophy, color: 'text-amber-500' },
    { level: 100, reward: 'Platinum Physical', icon: Crown, color: 'text-slate-100' },
];

// Helper to generate a massive list of progression-based placeholders to reach 100+
export const getAllAchievements = () => {
    const list = [...ACHIEVEMENTS];
    // Add generated achievements for levels 1-100
    for (let i = 1; i <= 100; i++) {
        if (!list.find(a => a.level === i)) {
            list.push({
                id: `lvl_ach_${i}`,
                level: i,
                reward: `Level ${i} Elite`,
                icon: Trophy,
                color: 'text-slate-600'
            });
        }
    }
    return list.sort((a, b) => a.level - b.level);
};

export const getAllMilestones = () => {
    const list = [...MILESTONES];
    // Ensure we have something for every major step
    return list.sort((a, b) => a.level - b.level);
};
