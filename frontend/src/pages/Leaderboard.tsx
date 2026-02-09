import { useState, useEffect } from 'react';
import { LeagueCard, LeagueTier } from '../components/League/LeagueCard';
import { Section } from '../components/Section';
import { ListSkeleton } from '../components/Skeletons/ListSkeleton';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { getSafeLaunchParams } from '../utils/tma';
import { getApiUrl } from '../utils/api';

interface LeaderboardUser {
    id: number;
    username: string;
    first_name: string;
    xp: number;
    level: number;
}

interface UserStats {
    rank: number;
    xp: number;
    level: number;
    referrals: number;
}

export default function LeaderboardPage() {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [userStats, setUserStats] = useState<UserStats | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const lp = getSafeLaunchParams();
                const initDataRaw = lp.initDataRaw || '';

                const headers = { 'X-Telegram-Init-Data': initDataRaw };
                const apiUrl = getApiUrl();

                const [leaderboardRes, statsRes] = await Promise.all([
                    axios.get(`${apiUrl}/api/leaderboard/global?limit=50`, { headers }),
                    axios.get(`${apiUrl}/api/leaderboard/me`, { headers })
                ]);

                setLeaderboard(leaderboardRes.data);
                setUserStats(statsRes.data);
            } catch (error) {
                console.error('Failed to fetch leaderboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const getLeague = (level: number): LeagueTier => {
        if (level >= 30) return 'platinum';
        if (level >= 15) return 'gold';
        return 'silver';
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
                                    <div className={`h-10 w-10 overflow-hidden rounded-full border-2 ${index < 3 ? 'border-amber-500 shadow-sm' : 'border-(--color-brand-border)'}`}>
                                        <img
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || user.first_name}`}
                                            alt={user.username || user.first_name}
                                            className="h-full w-full object-cover"
                                        />
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
