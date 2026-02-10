import { useQuery } from '@tanstack/react-query';
import { LeagueCard, LeagueTier } from '../components/League/LeagueCard';
import { Section } from '../components/Section';
import { ListSkeleton } from '../components/Skeletons/ListSkeleton';
import { useTranslation } from 'react-i18next';
import { LazyImage } from '../components/ui/LazyImage';

import { apiClient } from '../api/client';

interface LeaderboardUser {
    id: number;
    username: string;
    first_name: string;
    xp: number;
    level: number;
    photo_url?: string;
}

interface UserStats {
    rank: number;
    xp: number;
    level: number;
    referrals: number;
}

export default function LeaderboardPage() {
    const { t } = useTranslation();

    const { data: leaderboard = [], isLoading: isLeaderboardLoading } = useQuery<LeaderboardUser[]>({
        queryKey: ['leaderboard', 'global'],
        queryFn: async () => {
            const res = await apiClient.get('/api/leaderboard/global?limit=50');
            return Array.isArray(res.data) ? res.data : [];
        },
        staleTime: 60 * 1000, // Fresh for 1 minute
    });

    const { data: userStats, isLoading: isStatsLoading } = useQuery<UserStats>({
        queryKey: ['leaderboard', 'me'],
        queryFn: async () => {
            const res = await apiClient.get('/api/leaderboard/me');
            return res.data;
        },
        staleTime: 60 * 1000,
    });

    const isLoading = isLeaderboardLoading || isStatsLoading;

    const getLeague = (level: number): LeagueTier => {
        if (!level || typeof level !== 'number' || level < 5) return 'wooden';
        if (level < 15) return 'silver';
        if (level < 30) return 'metal';
        if (level < 50) return 'gold';
        return 'platinum';
    };

    if (isLoading) return <div className="p-4"><ListSkeleton /></div>;

    return (
        <div className="flex flex-col min-h-[85vh] px-4 pt-4 pb-32">
            <h1 className="text-2xl font-bold text-(--color-text-primary) mb-6">{t('leaderboard.title')}</h1>

            {userStats && (
                <div className="mb-8">
                    <LeagueCard
                        league={getLeague(userStats.level)}
                        rank={userStats.rank}
                        score={userStats.xp}
                        referrals={userStats.referrals}
                    />
                </div>
            )}

            <Section title={t('leaderboard.top_partners')}>
                <div className="space-y-3">
                    {leaderboard.map((user, index) => (
                        <div
                            key={user.id}
                            className="flex items-center justify-between rounded-xl border border-(--color-brand-border) bg-(--color-bg-surface) p-3 shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <span className={`w-6 text-center text-sm font-black ${index < 3 ? 'text-amber-500' : 'text-(--color-text-secondary)'}`}>
                                    #{index + 1}
                                </span>
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 overflow-hidden rounded-full border-2 ${index < 3 ? 'border-amber-500 shadow-sm' : 'border-(--color-brand-border)'} bg-slate-200 dark:bg-slate-700`}>
                                        {user.photo_url ? (
                                            <LazyImage
                                                src={user.photo_url}
                                                alt={user.username || user.first_name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <LazyImage
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || user.first_name}`}
                                                alt={user.username || user.first_name}
                                                className="h-full w-full object-cover"
                                            />
                                        )}

                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-(--color-text-primary)">{user.first_name || user.username}</p>
                                        <p className="text-[10px] font-bold text-(--color-text-secondary) uppercase">{t(`leaderboard.levels.${getLeague(user.level)}`)}</p>
                                    </div>
                                </div>
                            </div>
                            <span className="text-sm font-black text-(--color-text-primary) font-mono">
                                {user.xp.toLocaleString()} {t('leaderboard.xp')}
                            </span>
                        </div>
                    ))}
                </div>
            </Section>
        </div>
    );
}
