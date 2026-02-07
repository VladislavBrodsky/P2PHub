export interface Rank {
    tier: number;
    name: string;
    minLevel: number;
    badgeColor: string;
}

export const RANKS: Rank[] = [
    { tier: 1, name: 'Beginner', minLevel: 1, badgeColor: '#94a3b8' }, // Slate
    { tier: 2, name: 'Novice', minLevel: 2, badgeColor: '#64748b' },
    { tier: 3, name: 'Apprentice', minLevel: 3, badgeColor: '#475569' },
    { tier: 4, name: 'Contributor', minLevel: 4, badgeColor: '#334155' },
    { tier: 5, name: 'Pioneer', minLevel: 5, badgeColor: '#0ea5e9' }, // Sky
    { tier: 6, name: 'Pathbreaker', minLevel: 6, badgeColor: '#0284c7' },
    { tier: 7, name: 'Adventurer', minLevel: 8, badgeColor: '#0369a1' },
    { tier: 8, name: 'Voyager', minLevel: 10, badgeColor: '#075985' },
    { tier: 9, name: 'Ambassador', minLevel: 12, badgeColor: '#10b981' }, // Emerald
    { tier: 10, name: 'Leader', minLevel: 15, badgeColor: '#059669' },
    { tier: 11, name: 'Senior Leader', minLevel: 18, badgeColor: '#047857' },
    { tier: 12, name: 'Executive', minLevel: 22, badgeColor: '#065f46' },
    { tier: 13, name: 'Director', minLevel: 26, badgeColor: '#f59e0b' }, // Amber
    { tier: 14, name: 'President', minLevel: 30, badgeColor: '#d97706' },
    { tier: 15, name: 'Global Partner', minLevel: 35, badgeColor: '#b45309' },
    { tier: 16, name: 'World Partner', minLevel: 40, badgeColor: '#92400e' },
    { tier: 17, name: 'Elite', minLevel: 45, badgeColor: '#8b5cf6' }, // Violet
    { tier: 18, name: 'Master', minLevel: 50, badgeColor: '#7c3aed' },
    { tier: 19, name: 'Grandmaster', minLevel: 55, badgeColor: '#6d28d9' },
    { tier: 20, name: 'Legend', minLevel: 60, badgeColor: '#5b21b6' },
    { tier: 21, name: 'VIP', minLevel: 65, badgeColor: '#f43f5e' }, // Rose
    { tier: 22, name: 'VIP II', minLevel: 70, badgeColor: '#e11d48' },
    { tier: 23, name: 'VIP III', minLevel: 75, badgeColor: '#be123c' },
    { tier: 24, name: 'VIP Elite', minLevel: 80, badgeColor: '#9f1239' },
    { tier: 25, name: 'Premium', minLevel: 85, badgeColor: '#2dd4bf' }, // Teal
    { tier: 26, name: 'Premium Plus', minLevel: 90, badgeColor: '#0d9488' },
    { tier: 27, name: 'PRO', minLevel: 95, badgeColor: '#2563eb' }, // Blue
    { tier: 28, name: 'PRO Max', minLevel: 100, badgeColor: '#1d4ed8' },
    { tier: 29, name: 'Immortal', minLevel: 110, badgeColor: '#1e3a8a' },
    { tier: 30, name: 'Eternal', minLevel: 125, badgeColor: '#000000' }, // Black
];

export function getRank(level: number): Rank {
    return [...RANKS].reverse().find(r => level >= r.minLevel) || RANKS[0];
}

export function getXPProgress(level: number, currentXP: number) {
    const xpNeeded = level * 100;
    const progress = Math.min(100, (currentXP / xpNeeded) * 100);
    return {
        current: currentXP,
        total: xpNeeded,
        percent: progress
    };
}
