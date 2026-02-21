import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { LeagueCard, LeagueTier } from '../components/League/LeagueCard';
import { Section } from '../components/Section';
import { ListSkeleton } from '../components/Skeletons/ListSkeleton';
import { useTranslation } from 'react-i18next';
import { LazyImage } from '../components/ui/LazyImage';

import { apiClient } from '../api/client';
import { getApiUrl } from '../utils/api';
import { useState } from 'react';
import { PartnerBriefingModal } from '../components/Partner/PartnerBriefingModal';
import { Trophy, Shield, Star, Crown, User } from 'lucide-react';
import { useHaptic } from '../hooks/useHaptic';
import { ProPlusBadge } from '../components/ui/ProPlusBadge';
import { useUser } from '../context/UserContext';

interface LeaderboardUser {
    id: number;
    username: string;
    first_name: string;
    xp: number;
    level: number;
    photo_url?: string;
    photo_file_id?: string;
    referral_count: number;
    subscription_plan?: string;
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
    const [showAll, setShowAll] = useState(false);
    const [timeframe, setTimeframe] = useState<'all' | 'monthly' | 'weekly'>('all');
    const { user: currentUser } = useUser();
    const { selection } = useHaptic();

    const { data: leaderboard = [], isLoading: isLeaderboardLoading } = useQuery<LeaderboardUser[]>({
        queryKey: ['leaderboard', timeframe],
        queryFn: async () => {
            const res = await apiClient.get(`/api/leaderboard/global?timeframe=${timeframe}&limit=50`);
            return Array.isArray(res.data) ? res.data : [];
        },
        staleTime: 30 * 1000,
    });

    const { data: userStats, isLoading: isStatsLoading } = useQuery<UserStats>({
        queryKey: ['leaderboard', 'me', timeframe],
        queryFn: async () => {
            const res = await apiClient.get(`/api/leaderboard/me?timeframe=${timeframe}`);
            return res.data;
        },
        staleTime: 30 * 1000,
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

    const displayCount = showAll ? 50 : 10;
    const visiblePartners = leaderboard.slice(0, displayCount);

    if (isLoading) return <div className="p-4"><ListSkeleton /></div>;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col min-h-[85vh] px-4 pt-4 pb-32"
        >
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="flex flex-col items-center mb-6 gap-2"
            >
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-500">Live Rankings</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase text-center leading-none">
                    {t('leaderboard.title')}
                </h1>

                {/* Timeframe Toggle */}
                <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl mt-2 w-full max-w-[300px] border border-slate-200/50 dark:border-white/5 shadow-inner">
                    {(['weekly', 'monthly', 'all'] as const).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => {
                                selection();
                                setTimeframe(tf);
                                setShowAll(false);
                            }}
                            className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all relative ${timeframe === tf
                                ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                        >
                            {t(`leaderboard.timeframes.${tf}`)}
                            {timeframe === tf && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-white dark:bg-white/10 rounded-lg -z-10"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </motion.div>

            {userStats && (
                <div className="mb-8">
                    <LeagueCard
                        league={getLeague(userStats.level)}
                        rank={userStats.rank}
                        score={userStats.xp}
                        referrals={userStats.referrals}
                        subscription_plan={currentUser?.subscription_plan || undefined}
                    />
                </div>
            )}

            <Section
                title={t('leaderboard.top_partners')}
            >
                <div className="space-y-2">
                    {visiblePartners.map((user, index) => (
                        <motion.button
                            key={user.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.04, 0.6), type: 'spring', stiffness: 400, damping: 30 }}
                            onClick={() => {
                                selection();
                                setIsModalOpen(true);
                            }}
                            className="w-full flex items-center justify-between rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 p-2.5 shadow-premium transition-all active:scale-[0.98] group relative overflow-hidden"
                        >
                            {/* Background Glow for Top 3 */}
                            {index < 3 && (
                                <div className={`absolute inset-0 opacity-5 pointer-events-none ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : 'bg-orange-400'
                                    }`} />
                            )}

                            <div className="flex items-center gap-3 relative z-10">
                                <div className="relative">
                                    {/* #comment Switched to rounded-full for the rank circle to satisfy the "perfect circle" aesthetic requested. */}
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black shadow-sm ${index === 0 ? 'bg-amber-500 text-white' :
                                        index === 1 ? 'bg-slate-300 text-slate-700' :
                                            index === 2 ? 'bg-orange-300 text-orange-800' :
                                                'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                        }`}>
                                        {index < 3 ? (
                                            index === 0 ? <Trophy size={14} /> :
                                                index === 1 ? <Shield size={14} /> :
                                                    <Star size={14} />
                                        ) : (
                                            <span>#{index + 1}</span>
                                        )}
                                    </div>
                                    {index < 3 && (
                                        <div className="absolute -top-1 -right-1">
                                            <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20" />
                                            <Crown size={10} className={index === 0 ? 'text-amber-500' : 'text-slate-400'} />
                                        </div>
                                    )}
                                    {(user.subscription_plan || '').includes('PLUS') && (
                                        <div className="absolute -bottom-1 -left-1 z-20">
                                            <ProPlusBadge size="sm" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2.5">
                                    {/* #comment Forced perfect circle with rounded-full and aspect-square. Removed rounded-2xl. */}
                                    <div className={`h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 shadow-sm transition-transform group-hover:scale-105 ${index < 3 ? 'border-white dark:border-white/20 ring-2 ring-amber-500/20' : 'border-slate-200 dark:border-white/10'
                                        } bg-slate-200 dark:bg-slate-700 aspect-square`}>
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
                                            <div className={`h-full w-full flex items-center justify-center bg-linear-to-br ${['from-blue-500 to-indigo-500', 'from-emerald-400 to-teal-500', 'from-violet-500 to-fuchsia-500', 'from-rose-400 to-red-500', 'from-amber-400 to-orange-500'][user.id % 5]
                                                } text-white font-black text-lg shadow-inner`}>
                                                {(user.first_name || user.username || '?').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-xs font-black text-slate-900 dark:text-white line-clamp-1 leading-tight">{user.first_name || user.username}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                                <span>LVL {user.level}</span>
                                                <div className="h-0.5 w-0.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                                                <div className="flex items-center gap-1 text-blue-500/70">
                                                    <Crown size={8} className="stroke-3" />
                                                    <span className="font-black">{user.referral_count.toLocaleString()} {t('referral.members')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-0.5 relative z-10">
                                <span className="text-xs font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                                    {user.xp.toLocaleString()}
                                </span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500/80 leading-none">
                                    {t('leaderboard.xp')}
                                </span>
                            </div>
                        </motion.button>
                    ))}

                    {/* Show All toggle button */}
                    {leaderboard.length > 10 && (
                        <button
                            onClick={() => {
                                selection();
                                setShowAll(!showAll);
                            }}
                            className="w-full mt-2 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
                        >
                            {showAll ? t('common.show_less') : `${t('common.show_more')} (TOP 50)`}
                        </button>
                    )}
                </div>
            </Section>

            <PartnerBriefingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </motion.div>
    );
}
