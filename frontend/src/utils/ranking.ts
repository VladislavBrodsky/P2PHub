export interface Rank {
    tier: number;
    name: string;
    minLevel: number;
    badgeColor: string;
}

export const RANKS: Rank[] = [
    { tier: 1, name: 'Beginner', minLevel: 1, badgeColor: '#94a3b8' },
    { tier: 2, name: 'Novice', minLevel: 3, badgeColor: '#64748b' },
    { tier: 3, name: 'Apprentice', minLevel: 6, badgeColor: '#475569' },
    { tier: 4, name: 'Contributor', minLevel: 9, badgeColor: '#334155' },
    { tier: 5, name: 'Pioneer', minLevel: 12, badgeColor: '#0ea5e9' }, // Milestone at 12 instead of 5
    { tier: 6, name: 'Pathbreaker', minLevel: 15, badgeColor: '#0284c7' },
    { tier: 7, name: 'Adventurer', minLevel: 18, badgeColor: '#0369a1' },
    { tier: 8, name: 'Voyager', minLevel: 21, badgeColor: '#075985' },
    { tier: 9, name: 'Ambassador', minLevel: 24, badgeColor: '#10b981' },
    { tier: 10, name: 'Leader', minLevel: 27, badgeColor: '#059669' },
    { tier: 11, name: 'Senior Leader', minLevel: 30, badgeColor: '#047857' },
    { tier: 12, name: 'Executive', minLevel: 33, badgeColor: '#065f46' },
    { tier: 13, name: 'Director', minLevel: 36, badgeColor: '#f59e0b' },
    { tier: 14, name: 'President', minLevel: 40, badgeColor: '#d97706' },
    { tier: 15, name: 'Global Partner', minLevel: 44, badgeColor: '#b45309' },
    { tier: 16, name: 'World Partner', minLevel: 48, badgeColor: '#92400e' },
    { tier: 17, name: 'Elite', minLevel: 52, badgeColor: '#8b5cf6' },
    { tier: 18, name: 'Master', minLevel: 56, badgeColor: '#7c3aed' },
    { tier: 19, name: 'Grandmaster', minLevel: 60, badgeColor: '#6d28d9' }, // Milestone shift
    { tier: 20, name: 'Legend', minLevel: 64, badgeColor: '#5b21b6' },
    { tier: 21, name: 'VIP', minLevel: 68, badgeColor: '#f43f5e' }, // VIP starts near 70
    { tier: 22, name: 'VIP II', minLevel: 72, badgeColor: '#e11d48' },
    { tier: 23, name: 'VIP III', minLevel: 76, badgeColor: '#be123c' },
    { tier: 24, name: 'VIP Elite', minLevel: 80, badgeColor: '#9f1239' },
    { tier: 25, name: 'Premium', minLevel: 84, badgeColor: '#2dd4bf' },
    { tier: 26, name: 'Premium Plus', minLevel: 88, badgeColor: '#0d9488' },
    { tier: 27, name: 'PRO', minLevel: 92, badgeColor: '#2563eb' },
    { tier: 28, name: 'PRO Max', minLevel: 96, badgeColor: '#1d4ed8' },
    { tier: 29, name: 'Immortal', minLevel: 100, badgeColor: '#1e3a8a' }, // The goal!
    { tier: 30, name: 'Eternal', minLevel: 110, badgeColor: '#000000' },
];

export function getRank(level: number): Rank {
    return [...RANKS].reverse().find(r => level >= r.minLevel) || RANKS[0];
}

export function getXPProgress(level: number, totalXP: number) {
    // XP at start of current level: sum(i=1 to level-1) of i*100
    const startXP = 50 * (level - 1) * level;
    // XP needed to complete current level
    const levelXP = level * 100;

    // XP earned within current level
    const currentLevelXP = Math.max(0, totalXP - startXP);
    const progress = Math.min(100, (currentLevelXP / levelXP) * 100);

    return {
        current: currentLevelXP,
        total: levelXP,
        percent: progress
    };
}
