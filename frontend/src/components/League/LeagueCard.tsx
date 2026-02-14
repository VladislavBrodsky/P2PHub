import * as React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Shield, Zap, Star, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type LeagueTier = 'wooden' | 'silver' | 'metal' | 'gold' | 'platinum';

interface LeagueCardProps {
    league: LeagueTier;
    rank: number;
    score: number;
    referrals: number;
}

const useLeagueConfig = () => {
    const { t } = useTranslation();

    return {
        wooden: {
            name: t('leaderboard.levels.wooden', 'Wooden League'),
            color: 'from-amber-800/80 to-amber-900',
            textColor: 'text-amber-200',
            borderColor: 'border-amber-700/30',
            icon: Shield,
            description: t('league.wooden_desc', 'New Partner. Just getting started on the journey.')
        },
        silver: {
            name: t('leaderboard.levels.silver', 'Silver League'),
            color: 'from-slate-300 to-slate-500',
            textColor: 'text-slate-100',
            borderColor: 'border-slate-400/30',
            icon: Trophy,
            description: t('league.silver_desc', 'Active Partner. Building momentum and gaining traction.')
        },
        metal: {
            name: t('leaderboard.levels.metal', 'Metal League'),
            color: 'from-zinc-600 to-zinc-900',
            textColor: 'text-zinc-100',
            borderColor: 'border-zinc-500/30',
            icon: Shield,
            description: t('league.metal_desc', 'Serious Partner. Consistent performance and steady growth.')
        },
        gold: {
            name: t('leaderboard.levels.gold', 'Gold League'),
            color: 'from-yellow-400 to-amber-600',
            textColor: 'text-yellow-50',
            borderColor: 'border-yellow-500/30',
            icon: Star,
            description: t('league.gold_desc', 'Elite Partner. High impact and strong influence.')
        },
        platinum: {
            name: t('leaderboard.levels.platinum', 'Platinum League'),
            color: 'from-indigo-400 via-purple-500 to-pink-500',
            textColor: 'text-white',
            borderColor: 'border-white/20',
            icon: Flame,
            description: t('league.platinum_desc', 'Legendary Status. Top 10 Partners compete here.')
        }
    };
};

export const LeagueCard: React.FC<LeagueCardProps> = ({ league, rank, score, referrals }) => {
    const { t } = useTranslation();
    const LEAGUE_CONFIG = useLeagueConfig();
    const config = LEAGUE_CONFIG[league];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative overflow-hidden rounded-[2rem] border ${config.borderColor} bg-linear-to-br ${config.color} p-6 sm:p-8 shadow-2xl`}
        >
            {/* Background Decoration */}
            <div className="absolute -right-8 -top-8 h-48 w-48 opacity-[0.03] text-white">
                <Icon className="h-full w-full rotate-12" />
            </div>

            {/* Glossy Highlight */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                        <Icon className={`h-6 w-6 ${config.textColor}`} />
                    </div>
                    <div>
                        <span className="text-[8px] font-black uppercase tracking-wider opacity-50 text-white leading-none block">
                            {t('leaderboard.current_league')}
                        </span>
                        <h2 className={`text-2xl font-black tracking-tighter ${config.textColor} mt-0.5`}>{config.name}</h2>
                    </div>
                </div>

                <p className={`mt-4 text-[11px] font-medium ${config.textColor} opacity-70 leading-relaxed max-w-[90%]`}>
                    {config.description}
                </p>

                <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                    <div className="min-w-0">
                        <p className="text-[8px] font-black uppercase tracking-wider opacity-50 text-white mb-1.5 truncate">
                            {t('leaderboard.global_rank')}
                        </p>
                        <p className={`text-xl font-black tracking-tighter ${config.textColor}`}>#{rank}</p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[8px] font-black uppercase tracking-wider opacity-50 text-white mb-1.5 truncate">
                            {t('leaderboard.xp_score')}
                        </p>
                        <p className={`text-xl font-black tracking-tighter ${config.textColor}`}>{score.toLocaleString()}</p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[8px] font-black uppercase tracking-wider opacity-50 text-white mb-1.5 truncate">
                            {t('leaderboard.referrals')}
                        </p>
                        <p className={`text-xl font-black tracking-tighter ${config.textColor}`}>{referrals}</p>
                    </div>
                </div>

                {league === 'platinum' && (
                    <div className="mt-8 flex items-center gap-3 rounded-2xl bg-black/20 p-4 backdrop-blur-sm border border-white/5">
                        <Zap className="h-4 w-4 text-amber-300" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-100">
                            Competing for TOP 10 rewards
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
