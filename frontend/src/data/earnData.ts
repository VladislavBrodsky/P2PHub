import {
    LucideIcon, Users, MessageCircle, CreditCard, Send, CheckCircle2, Zap, Star, Trophy, Crown, Shield,
    Diamond, Medal, Gem, Flame, Rocket, Target, Award
} from 'lucide-react';

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
        reward: 25, // PRO: 125
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
        reward: 25, // PRO: 125
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
        reward: 25, // PRO: 125
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
        reward: 25, // PRO: 125
        type: 'social',
        link: 'https://t.me/pintopaygrowth',
        minLevel: 1
    },

    // Level 1: Viral Loop (The core mechanic)
    {
        id: 'invite_1_friend',
        title: 'Invite 1 Friend',
        description: 'Your first step to building a network.',
        platform: 'internal',
        icon: Users,
        reward: 100,
        type: 'referral',
        requirement: 1,
        minLevel: 1
    },
    {
        id: 'invite_3_friends',
        title: 'Invite 3 Friends',
        description: 'Build your initial network to unlock Level 2.',
        platform: 'internal',
        icon: Users,
        reward: 150,
        type: 'referral',
        requirement: 3,
        minLevel: 1,
        image: '/images/2026-02-05_03.35.36.webp'
    },
    {
        id: 'daily_checkin_5',
        title: '5 Day Streak',
        description: 'Open the app 5 days in a row.',
        platform: 'internal',
        icon: CheckCircle2,
        reward: 100,
        type: 'action',
        requirement: 5,
        minLevel: 1
    },
    {
        id: 'invite_5_friends',
        title: 'Squad Goals',
        description: 'Expand your circle to 5 partners.',
        platform: 'internal',
        icon: Users,
        reward: 200,
        type: 'referral',
        requirement: 5,
        minLevel: 2
    },
    {
        id: 'invite_10_friends',
        title: 'Network Builder',
        description: 'Expand your team to 10 partners.',
        platform: 'internal',
        icon: Users,
        reward: 350,
        type: 'referral',
        requirement: 10,
        minLevel: 3
    },
    {
        id: 'invite_25_friends',
        title: 'Community Leader',
        description: 'Lead a team of 25 partners.',
        platform: 'internal',
        icon: Users,
        reward: 500, // PRO: 2500 (As requested)
        type: 'referral',
        requirement: 25,
        minLevel: 5
    },
    {
        id: 'invite_50_friends',
        title: 'Influencer Status',
        description: 'Grow your network to 50 partners.',
        platform: 'internal',
        icon: Crown,
        reward: 700, // PRO: 3500
        type: 'referral',
        requirement: 50,
        minLevel: 10
    },
    {
        id: 'invite_100_friends',
        title: 'Viral Master',
        description: 'Reach 100 direct referrals.',
        platform: 'internal',
        icon: Zap,
        reward: 1200,
        type: 'referral',
        requirement: 100,
        minLevel: 15
    },
    {
        id: 'invite_250_friends',
        title: 'Grand Connector',
        description: 'Build a massive network of 250 partners.',
        platform: 'internal',
        icon: Star,
        reward: 2500,
        type: 'referral',
        requirement: 250,
        minLevel: 20
    },
    {
        id: 'invite_500_friends',
        title: 'Network Legend',
        description: 'Achieve the ultimate goal: 500 referrals.',
        platform: 'internal',
        icon: Trophy,
        reward: 5000,
        type: 'referral',
        requirement: 500,
        minLevel: 25
    }
];

export const ACHIEVEMENTS: Achievement[] = [
    // Level 1-5: The Hook
    {
        id: 'early_1',
        level: 1,
        reward: 'referral.rewards.items.onboard_1',
        icon: Rocket,
        color: 'text-orange-400',
        instruction: 'Ignition! Start your journey by visiting the Growth hub.',
        taskType: 'checkin'
    },
    {
        id: 'ghost_share',
        level: 2,
        reward: 'referral.rewards.items.viral_blitz',
        icon: Flame,
        color: 'text-red-400',
        instruction: 'Viral Spark: Share your referral link to ignite the network.',
        taskType: 'share'
    },
    {
        id: 'early_3',
        level: 3,
        reward: 'referral.rewards.items.streak_3',
        icon: Target,
        color: 'text-emerald-400',
        instruction: 'Precision: Open the app for 3 consecutive days.',
        taskType: 'checkin'
    },
    {
        id: 'viral_blitz',
        level: 4,
        reward: 'referral.rewards.items.viral_blitz',
        icon: Zap,
        color: 'text-yellow-400',
        instruction: 'Overdrive: Bring in 3 partners within 24 hours.',
        taskType: 'viral'
    },
    {
        id: 'early_5',
        level: 5,
        reward: 'referral.rewards.items.ref_node',
        icon: Shield,
        color: 'text-blue-500',
        instruction: 'Fortress: Reach Level 5 and solidify your position.',
        taskType: 'level'
    },

    // Level 6-15: Growth
    {
        id: 'early_7',
        level: 7,
        reward: 'referral.rewards.items.streak_7',
        icon: Medal,
        color: 'text-indigo-400',
        instruction: 'Veteran: Maintain your streak and help your team grow.',
        taskType: 'invite'
    },
    {
        id: 'early_10',
        level: 10,
        reward: 'referral.rewards.items.silver_badge',
        icon: Award,
        color: 'text-slate-300',
        instruction: 'Silver Elite: Earn the mark of a true Network Builder.',
        taskType: 'level'
    },
    {
        id: 'growth_15',
        level: 15,
        reward: 'referral.rewards.items.viral_tsunami',
        icon: Gem,
        color: 'text-cyan-400',
        instruction: 'Tsunami: Unlock team-wide multipliers at Level 15.',
        taskType: 'level'
    },

    // 20+ Tiers: Professional
    {
        id: 'legacy_20',
        level: 20,
        reward: 'referral.rewards.items.free_virtual_card',
        icon: CreditCard,
        color: 'text-white',
        instruction: 'Tech Pioneer: Claim your first mastercharge virtual card.',
        taskType: 'level'
    },
    { id: 'growth_25', level: 25, reward: 'referral.rewards.items.network_pro', icon: Rocket, color: 'text-blue-400' },
    { id: 'prof_30', level: 30, reward: 'referral.rewards.items.ambassador', icon: Medal, color: 'text-amber-400' },
    { id: 'prof_33', level: 33, reward: 'referral.rewards.items.executive_access', icon: Diamond, color: 'text-blue-300' },
    { id: 'prof_35', level: 35, reward: 'referral.rewards.items.director_node', icon: Crown, color: 'text-yellow-500' },
    { id: 'elite_40', level: 40, reward: 'referral.rewards.items.president_status', icon: Trophy, color: 'text-amber-500' },
    {
        id: 'legacy_44',
        level: 44,
        reward: 'referral.rewards.items.fee_discount',
        icon: Gem,
        color: 'text-emerald-500',
        instruction: 'Iron Will: Unlock the -10% Physical Card issuance discount.',
        taskType: 'level'
    },
    { id: 'elite_45', level: 45, reward: 'referral.rewards.items.global_partner', icon: Star, color: 'text-blue-400' },
    { id: 'elite_50', level: 50, reward: 'referral.rewards.items.black_card', icon: CreditCard, color: 'text-white' },
];

export const MILESTONES = [
    { level: 60, reward: 'referral.rewards.items.grandmaster', icon: Crown, color: 'text-purple-500', instruction: 'Grandmaster: Command the network from Level 60.' },
    { level: 70, reward: 'referral.rewards.items.vip_status', icon: Diamond, color: 'text-pink-500', instruction: 'VIP: Pure Diamond status achieved.' },
    { level: 80, reward: 'referral.rewards.items.premium_access', icon: Shield, color: 'text-emerald-400', instruction: 'Titan: Unbreakable network at Level 80.' },
    { level: 90, reward: 'referral.rewards.items.immortal_tier', icon: Flame, color: 'text-orange-600', instruction: 'Immortal: Your legacy is permanent.' },
    { level: 100, reward: 'referral.rewards.items.platinum_physical', icon: Trophy, color: 'text-slate-100', instruction: 'Apex: The Physical Platinum Card is yours.' },
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
