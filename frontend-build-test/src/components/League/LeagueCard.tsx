import * as React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Shield, Zap, Star, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ProPlusBadge } from '../ui/ProPlusBadge';

export type LeagueTier = 'wooden' | 'silver' | 'metal' | 'gold' | 'platinum';

interface LeagueCardProps {
    league: LeagueTier;
    rank: number;
    score: number;
    referrals: number;
    subscription_plan?: string;
}

const useLeagueConfig = () => {
    const { t } = useTranslation(['social', 'common']);

    return {
        wooden: {
            name: t('leaderboard.levels.wooden', 'Wooden League'),
            color: 'from-amber-700/90 via-amber-800 to-amber-950',
            textColor: 'text-amber-50',
            borderColor: 'border-amber-500/30',
            icon: Shield,
            description: t('league.wooden_desc', 'New Partner. Just getting started on the journey.')
        },
        silver: {
            name: t('leaderboard.levels.silver', 'Silver League'),
            color: 'from-slate-400 via-slate-500 to-slate-700',
            textColor: 'text-white',
            borderColor: 'border-white/20',
            icon: Trophy,
            description: t('league.silver_desc', 'Active Partner. Building momentum and gaining traction.')
        },
        metal: {
            name: t('leaderboard.levels.metal', 'Metal League'),
            color: 'from-zinc-700 via-zinc-800 to-zinc-950',
            textColor: 'text-zinc-50',
            borderColor: 'border-zinc-500/40',
            icon: Shield,
            description: t('league.metal_desc', 'Serious Partner. Consistent performance and steady growth.')
        },
        gold: {
            name: t('leaderboard.levels.gold', 'Gold League'),
            color: 'from-amber-400 via-yellow-500 to-orange-600',
            textColor: 'text-white',
            borderColor: 'border-yellow-400/40',
            icon: Star,
            description: t('league.gold_desc', 'Elite Partner. High impact and strong influence.')
        },
        platinum: {
            name: t('leaderboard.levels.platinum', 'Platinum Tier'),
            color: 'from-[#6366f1] via-[#a855f7] to-[#ec4899]',
            textColor: 'text-white',
            borderColor: 'border-white/30',
            icon: Flame,
            description: t('league.platinum_desc', 'Legendary Status. Top 10 Partners compete here.')
        }
    };
};

export const LeagueCard: React.FC<LeagueCardProps> = ({ league, rank, score, referrals, subscription_plan }) => {
    const { t } = useTranslation(['social', 'common']);
    const LEAGUE_CONFIG = useLeagueConfig();
    const config = LEAGUE_CONFIG[league];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative overflow-hidden rounded-2xl border ${config.borderColor} bg-linear-to-br ${config.color} p-6 sm:p-8 shadow-2xl`}
        >
            {/* Background Decoration */}
            <div className="absolute -right-8 -top-8 h-48 w-48 opacity-[0.03] text-white">
                <Icon className="h-full w-full rotate-12" />
            </div>

            {/* Glossy Highlight */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 sm:gap-5">
                    <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xl border border-white/20 shadow-inner">
                        <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${config.textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-label sm:text-label font-black uppercase tracking-widest sm:tracking-[0.2em] text-white/60 leading-none block whitespace-nowrap truncate">
                            {t('leaderboard.current_league')}
                        </span>
                        <h2 className={`text-2xl sm:text-3xl font-black tracking-tighter ${config.textColor} mt-1 sm:mt-1.5 drop-shadow-sm whitespace-nowrap truncate`}>{config.name}</h2>
                    </div>
                    {(subscription_plan || '').includes('PLUS') && (
                        <div className="ml-auto shrink-0 pl-2">
                            <ProPlusBadge size="lg" />
                        </div>
                    )}
                </div>

                <p className={`mt-5 text-caption font-bold ${config.textColor} text-white/90 leading-relaxed max-w-[95%] italic`}>
                    {config.description}
                </p>

                <div className="mt-8 grid grid-cols-3 gap-6 border-t border-white/20 pt-8">
                    <div className="min-w-0">
                        <p className="text-label font-black uppercase tracking-[0.15em] text-white/50 mb-2 truncate">
                            {t('leaderboard.global_rank')}
                        </p>
                        <p className={`text-2xl font-black tracking-tighter ${config.textColor} drop-shadow-md`}>#{rank}</p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-label font-black uppercase tracking-[0.15em] text-white/50 mb-2 truncate">
                            {t('leaderboard.xp_score')}
                        </p>
                        <p className={`text-2xl font-black tracking-tighter ${config.textColor} drop-shadow-md font-mono tracking-tighter`}>{Math.floor(score).toLocaleString()}</p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-label font-black uppercase tracking-[0.15em] text-white/50 mb-2 truncate">
                            {t('leaderboard.referrals')}
                        </p>
                        <p className={`text-2xl font-black tracking-tighter ${config.textColor} drop-shadow-md`}>{referrals}</p>
                    </div>
                </div>

                {league === 'platinum' && (
                    <div className="mt-6 flex items-center gap-2 rounded-xl bg-black/30 py-1.5 px-3 backdrop-blur-md border border-white/10 shadow-lg group overflow-hidden relative w-fit">
                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <Zap className="h-3 w-3 shrink-0 text-yellow-400 animate-pulse drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                        <span className="text-label font-black uppercase tracking-widest text-white whitespace-nowrap">
                            Competing for TOP 10 rewards
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
