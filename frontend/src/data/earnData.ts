import { LucideIcon, Users, MessageCircle, CreditCard, Send, CheckCircle2, Lock, Gift, Zap, Star, Trophy, Crown, UserPlus, Shield, Share2 } from 'lucide-react';

export interface Achievement {
    id: string;
    level: number;
    reward: string;
    icon: LucideIcon;
    color: string;
    instruction?: string;
    taskType?: 'invite' | 'share' | 'checkin' | 'level' | 'viral';
}

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

export const ACHIEVEMENTS: Achievement[] = [
    // Level 1-5: The Hook
    {
        id: 'early_1',
        level: 1,
        reward: 'referral.rewards.items.onboard_1',
        icon: Zap,
        color: 'text-yellow-400',
        instruction: 'Launch your journey. Open the Growth tab for the first time.',
        taskType: 'checkin'
    },
    {
        id: 'ghost_share',
        level: 2,
        reward: 'referral.rewards.items.viral_blitz',
        icon: Share2,
        color: 'text-blue-400',
        instruction: 'Spread the word. Share your unique invite link with 1 friend.',
        taskType: 'share'
    },
    {
        id: 'early_3',
        level: 3,
        reward: 'referral.rewards.items.streak_3',
        icon: Star,
        color: 'text-emerald-400',
        instruction: 'Show commitment. Open the app for 3 consecutive days.',
        taskType: 'checkin'
    },
    {
        id: 'viral_blitz',
        level: 4,
        reward: 'referral.rewards.items.viral_blitz',
        icon: Zap,
        color: 'text-orange-500',
        instruction: 'Speed run! Invite 3 friends within your first 24 hours.',
        taskType: 'viral'
    },
    {
        id: 'early_5',
        level: 5,
        reward: 'referral.rewards.items.ref_node',
        icon: UserPlus,
        color: 'text-blue-500',
        instruction: 'Node Active. Reach Level 5 to unlock your first passive income stream.',
        taskType: 'level'
    },

    // Level 6-10: Momentum
    {
        id: 'ghost_recruiter',
        level: 7,
        reward: 'referral.rewards.items.streak_7',
        icon: Users,
        color: 'text-indigo-400',
        instruction: 'Shadow growth. Your first L2 partner (friend of a friend) has joined.',
        taskType: 'invite'
    },
    {
        id: 'early_10',
        level: 10,
        reward: 'referral.rewards.items.silver_badge',
        icon: Shield,
        color: 'text-slate-300',
        instruction: 'Silver Guardian. reach Level 10 to receive the Silver Badge of Honor.',
        taskType: 'level'
    },

    // 15+ Tiers
    {
        id: 'growth_15',
        level: 15,
        reward: 'referral.rewards.items.viral_tsunami',
        icon: Zap,
        color: 'text-yellow-400',
        instruction: 'Force of nature. Reach Level 15 and unlock the Tsunami effect (+5% XP for team)',
        taskType: 'level'
    },
    {
        id: 'legacy_20',
        level: 20,
        reward: 'referral.rewards.items.free_virtual_card',
        icon: CreditCard,
        color: 'text-indigo-400',
        instruction: 'Legacy Reward: Level 20 Pioneers get 1x Mastercharge Virtual Card for free.',
        taskType: 'level'
    },
    { id: 'growth_25', level: 25, reward: 'referral.rewards.items.network_pro', icon: Users, color: 'text-blue-400' },
    { id: 'prof_30', level: 30, reward: 'referral.rewards.items.ambassador', icon: Star, color: 'text-amber-400' },
    { id: 'prof_33', level: 33, reward: 'referral.rewards.items.executive_access', icon: Shield, color: 'text-slate-100' },
    { id: 'prof_35', level: 35, reward: 'referral.rewards.items.director_node', icon: Crown, color: 'text-yellow-500' },
    { id: 'elite_40', level: 40, reward: 'referral.rewards.items.president_status', icon: Trophy, color: 'text-amber-500' },
    {
        id: 'legacy_44',
        level: 44,
        reward: 'referral.rewards.items.fee_discount',
        icon: CreditCard,
        color: 'text-emerald-500',
        instruction: 'Legacy Reward: Level 44 Elite gets a permanent 10% Discount on Physical Card issuance.',
        taskType: 'level'
    },
    { id: 'elite_45', level: 45, reward: 'referral.rewards.items.global_partner', icon: Star, color: 'text-blue-400' },
    { id: 'elite_50', level: 50, reward: 'referral.rewards.items.black_card', icon: CreditCard, color: 'text-white' },
];

export const MILESTONES = [
    { level: 60, reward: 'referral.rewards.items.grandmaster', icon: Crown, color: 'text-purple-500', instruction: 'The ultimate rank. Achieve Level 60.' },
    { level: 70, reward: 'referral.rewards.items.vip_status', icon: Star, color: 'text-rose-500', instruction: 'VIP Status unlocked.' },
    { level: 80, reward: 'referral.rewards.items.premium_access', icon: Shield, color: 'text-emerald-400', instruction: 'Premium features enabled.' },
    { level: 90, reward: 'referral.rewards.items.immortal_tier', icon: Zap, color: 'text-blue-600', instruction: 'Beyond limits. Level 90.' },
    { level: 100, reward: 'referral.rewards.items.platinum_physical', icon: Trophy, color: 'text-slate-100', instruction: 'The Physical Platinum Card is yours.' },
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
                reward: 'referral.rewards.items.level_elite',
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
