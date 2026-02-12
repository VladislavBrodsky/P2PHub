import { useQuery } from '@tanstack/react-query';
import { LeagueCard, LeagueTier } from '../components/League/LeagueCard';
import { Section } from '../components/Section';
import { ListSkeleton } from '../components/Skeletons/ListSkeleton';
import { useTranslation } from 'react-i18next';
import { LazyImage } from '../components/ui/LazyImage';

import { apiClient } from '../api/client';
import { getApiUrl } from '../utils/api';
import { useState } from 'react';
import { PartnerBriefingModal } from '../components/Partner/PartnerBriefingModal';
import { Trophy, Shield, Star, Crown } from 'lucide-react';

interface LeaderboardUser {
    id: number;
    username: string;
    first_name: string;
    xp: number;
    level: number;
    photo_url?: string;
    photo_file_id?: string;
    referral_count: number;
}

interface UserStats {
    rank: number;
    xp: number;
    level: number;
    referrals: number;
}

export default function LeaderboardPage() {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    // #comment Rebalanced league thresholds to ensure top partners (4k+ XP) look prestigious.
    // Level 1-2: Wooden, Level 3-5: Silver, Level 6-10: Metal, Level 11-20: Gold, 21+: Platinum
    const getLeague = (level: number): LeagueTier => {
        if (!level || typeof level !== 'number' || level < 3) return 'wooden';
        if (level < 6) return 'silver';
        if (level < 11) return 'metal';
        if (level < 21) return 'gold';
        return 'platinum';
    };

    if (isLoading) return <div className="p-4"><ListSkeleton /></div>;

    return (
        <div className="flex flex-col min-h-[85vh] px-4 pt-4 pb-32">
            <h1 className="text-2xl font-black text-(--color-text-primary) mb-6 tracking-tight uppercase">
                {t('leaderboard.title')}
            </h1>

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

            <Section
                title={t('leaderboard.top_partners')}
                headerAction={
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 active:scale-95 transition-all"
                    >
                        {t('referral.info')}
                    </button>
                }
            >
                <div className="space-y-4">
                    {leaderboard.map((user, index) => (
                        <button
                            key={user.id}
                            onClick={() => setIsModalOpen(true)}
                            className="w-full flex items-center justify-between rounded-[2rem] border border-(--color-brand-border) bg-(--color-bg-surface) p-3 shadow-premium transition-all active:scale-[0.98] group relative overflow-hidden"
                        >
                            {/* Background Glow for Top 3 */}
                            {index < 3 && (
                                <div className={`absolute inset-0 opacity-5 pointer-events-none ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : 'bg-orange-400'
                                    }`} />
                            )}

                            <div className="flex items-center gap-4 relative z-10">
                                <div className="relative">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black shadow-sm ${index === 0 ? 'bg-amber-500 text-white' :
                                        index === 1 ? 'bg-slate-300 text-slate-700' :
                                            index === 2 ? 'bg-orange-300 text-orange-800' :
                                                'bg-slate-100 dark:bg-slate-800 text-(--color-text-secondary)'
                                        }`}>
                                        {index < 3 ? (
                                            index === 0 ? <Trophy size={16} /> :
                                                index === 1 ? <Shield size={16} /> :
                                                    <Star size={16} />
                                        ) : (
                                            <span>#{index + 1}</span>
                                        )}
                                    </div>
                                    {index < 3 && (
                                        <div className="absolute -top-1 -right-1">
                                            <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20" />
                                            <Crown size={12} className={index === 0 ? 'text-amber-500' : 'text-slate-400'} />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className={`h-12 w-12 overflow-hidden rounded-2xl border-2 shadow-sm transition-transform group-hover:scale-105 ${index < 3 ? 'border-white dark:border-white/20 ring-2 ring-amber-500/20' : 'border-(--color-brand-border)'
                                        } bg-slate-200 dark:bg-slate-700`}>
                                        {(user.photo_file_id || user.photo_url) ? (
                                            <LazyImage
                                                src={user.photo_file_id
                                                    ? `${getApiUrl()}/api/partner/photo/${user.photo_file_id}`
                                                    : user.photo_url!
                                                }
                                                alt={user.username || user.first_name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <img
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username || user.first_name}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                                                alt={user.username || user.first_name}
                                                className="h-full w-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-black text-(--color-text-primary) line-clamp-1">{user.first_name || user.username}</p>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <div className="flex items-center gap-1">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${index < 3 ? 'text-amber-600 dark:text-amber-400' : 'text-(--color-text-secondary)'
                                                    }`}>
                                                    {t(`leaderboard.levels.${getLeague(user.level)}`)}
                                                </span>
                                            </div>
                                            <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-(--color-text-secondary)">
                                                <span>LVL {user.level}</span>
                                                <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                                <div className="flex items-center gap-1 text-blue-500/80">
                                                    <Crown size={10} className="stroke-3" />
                                                    <span className="font-black">{user.referral_count.toLocaleString()} {t('referral.members')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 relative z-10">
                                <span className="text-sm font-black text-(--color-text-primary) font-mono tracking-tighter">
                                    {user.xp.toLocaleString()}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">
                                    {t('leaderboard.xp')}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </Section>

            <PartnerBriefingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
