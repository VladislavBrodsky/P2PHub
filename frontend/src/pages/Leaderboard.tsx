import { useState, useEffect } from 'react';
import { LeagueCard, LeagueTier } from '../components/League/LeagueCard';
import { Section } from '../components/Section';
import { ListSkeleton } from '../components/Skeletons/ListSkeleton';
import { useTranslation } from 'react-i18next';

// Mock data
const MOCK_LEADERBOARD = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    name: `Partner_${Math.floor(Math.random() * 1000)}`,
    score: Math.floor(10000 - i * 500),
    league: i < 3 ? 'platinum' : i < 8 ? 'gold' : 'silver'
}));

export default function LeaderboardPage() {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    // Current user mock stats
    const userStats = {
        league: 'gold' as LeagueTier,
        rank: 42,
        score: 4520,
        referrals: 12
    };

    if (isLoading) return <div className="p-4"><ListSkeleton /></div>;

    return (
        <div className="flex flex-col min-h-[85vh] px-4 pt-4 pb-32">
            <h1 className="text-2xl font-bold text-(--color-text-primary) mb-6">{t('leaderboard.title')}</h1>

            {/* 1. Your Card */}
            <div className="mb-8">
                <LeagueCard {...userStats} />
            </div>

            {/* 2. Leaderboard List */}
            <Section title={t('leaderboard.top_partners')}>
                <div className="space-y-3">
                    {MOCK_LEADERBOARD.map((user, index) => (
                        <div
                            key={user.id}
                            className="flex items-center justify-between rounded-xl border border-(--color-brand-border) bg-(--color-bg-surface) p-3 shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <span className={`w-6 text-center text-sm font-black ${index < 3 ? 'text-amber-500' : 'text-(--color-text-secondary)'}`}>
                                    #{index + 1}
                                </span>
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 overflow-hidden rounded-full border-2 ${index < 3 ? 'border-amber-500 shadow-sm' : 'border-(--color-brand-border)'}`}>
                                        <img
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                                            alt={user.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-(--color-text-primary)">{user.name}</p>
                                        <p className="text-[10px] font-bold text-(--color-text-secondary) uppercase">{t(`leaderboard.levels.${user.league}`)}</p>
                                    </div>
                                </div>
                            </div>
                            <span className="text-sm font-black text-(--color-text-primary) font-mono">
                                {user.score.toLocaleString()} {t('leaderboard.xp')}
                            </span>
                        </div>
                    ))}
                </div>
            </Section>
        </div>
    );
}
