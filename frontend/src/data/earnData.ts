import { LucideIcon, Users, MessageCircle, CreditCard, Send, CheckCircle2, Lock, Gift, Zap, Star, Trophy, Crown } from 'lucide-react';

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

export const MILESTONES = [
    { level: 12, reward: 'Pioneer Badge', icon: CheckCircle2, color: 'text-blue-500' },
    { level: 24, reward: 'Ambassador Status', icon: Star, color: 'text-blue-400' },
    { level: 35, reward: '500 XP Boost', icon: Gift, color: 'text-emerald-500' },
    { level: 44, reward: '10% Card Fee Discount', icon: Zap, color: 'text-yellow-400' },
    { level: 56, reward: 'Black Physical Card', icon: CreditCard, color: 'text-neutral-950 dark:text-white' },
    { level: 68, reward: 'VIP Support', icon: Star, color: 'text-rose-500' },
    { level: 80, reward: 'Elite Dashboard', icon: Trophy, color: 'text-indigo-400' },
    { level: 92, reward: 'Founder Access', icon: Lock, color: 'text-emerald-400' },
    { level: 100, reward: 'Physical Platinum Card', icon: Crown, color: 'text-slate-200' }
];
