import * as React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Shield, Zap, Star, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ProBadge } from '../ui/ProPlusBadge';
import { LiquidCounter } from '../../pages/Pro/utils/LiquidCounter';
import { USDTLogo } from '../ui/USDTLogo';
import { LeagueRewardsPopup } from './LeagueRewardsPopup';

export type LeagueTier = 'wooden' | 'silver' | 'metal' | 'gold' | 'platinum';

interface LeagueCardProps {
    league: LeagueTier;
    rank: number;
    score: number;
    total_earned_usdt: number;
    subscription_plan?: string;
}

const useLeagueConfig = () => {
    const { t } = useTranslation(['social', 'common']);

    return {
        wooden: {
            name: t('leaderboard.levels.wooden'),
            color: 'from-amber-700/90 via-amber-800 to-amber-950',
            textColor: 'text-amber-50',
            borderColor: 'border-amber-500/30',
            icon: Shield,
            description: t('league.wooden_desc')
        },
        silver: {
            name: t('leaderboard.levels.silver'),
            color: 'from-slate-400 via-slate-500 to-slate-700',
            textColor: 'text-white',
            borderColor: 'border-white/20',
            icon: Trophy,
            description: t('league.silver_desc')
        },
        metal: {
            name: t('leaderboard.levels.metal'),
            color: 'from-zinc-700 via-zinc-800 to-zinc-950',
            textColor: 'text-zinc-50',
            borderColor: 'border-zinc-500/40',
            icon: Shield,
            description: t('league.metal_desc')
        },
        gold: {
            name: t('leaderboard.levels.gold'),
            color: 'from-amber-400 via-yellow-500 to-orange-600',
            textColor: 'text-white',
            borderColor: 'border-yellow-400/40',
            icon: Star,
            description: t('league.gold_desc')
        },
        platinum: {
            name: t('leaderboard.levels.platinum'),
            color: 'from-[#6366f1] via-[#a855f7] to-[#ec4899] bg-size-[200%_auto] animate-vibing-gradient',
            textColor: 'text-white',
            borderColor: 'border-white/30',
            icon: Flame,
            description: t('league.platinum_desc')
        }
    };
};

export const LeagueCard: React.FC<LeagueCardProps> = ({ league, rank, score, total_earned_usdt, subscription_plan }) => {
    const { t } = useTranslation(['social', 'common']);
    const [isRewardsPopupOpen, setIsRewardsPopupOpen] = React.useState(false);

    const LEAGUE_CONFIG = useLeagueConfig();
    const config = LEAGUE_CONFIG[league];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`relative overflow-hidden rounded-2xl border ${config.borderColor} bg-linear-to-br ${config.color} p-4 shadow-2xl`}
        >
            {/* Glossy Highlight */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent)] pointer-events-none" />
            {/* Big Icon Watermark */}
            <div className="absolute -right-6 -top-6 h-36 w-36 opacity-[0.04] text-white pointer-events-none">
                <Icon className="h-full w-full rotate-12" />
            </div>

            <div className="relative z-10">
                {/* Top Row: Icon + Name + Badge */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xl border border-white/20 shadow-inner">
                        <Icon className={`h-5 w-5 ${config.textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-label font-bold uppercase tracking-[0.2em] text-white/60 block leading-none">
                            {t('leaderboard.current_league')}
                        </span>
                        <h2 className={`text-subheading font-bold tracking-tight ${config.textColor} mt-0.5`}>
                            {config.name}
                        </h2>
                    </div>
                    {(subscription_plan || '').includes('PRO') && (
                        <div className="shrink-0">
                            <ProBadge
                                variant={(subscription_plan || '').includes('PLUS') ? 'pro-plus' : 'pro'}
                                size="lg"
                            />
                        </div>
                    )}
                </div>

                {/* Stats Row */}
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/15 pt-3">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-0.5 truncate">
                            {t('leaderboard.global_rank')}
                        </p>
                        <p className={`text-xl font-bold tracking-tight ${config.textColor} drop-shadow-md`}>#{rank}</p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-0.5 truncate">
                            {t('leaderboard.xp_score')}
                        </p>
                        <p className={`text-xl font-bold tracking-tight ${config.textColor} drop-shadow-md font-mono`}>{Math.floor(score).toLocaleString()}</p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-0.5 truncate">
                            {t('partner_dashboard.total_earned')}
                        </p>
                        <div className={`text-xl font-bold tracking-tight ${config.textColor} drop-shadow-md flex items-center gap-1`}>
                            <USDTLogo className="w-3.5 h-3.5" />
                            <LiquidCounter value={total_earned_usdt} />
                        </div>
                    </div>
                </div>

                {/* Rewards Badge */}
                <button
                    onClick={() => setIsRewardsPopupOpen(true)}
                    className="mt-3 flex items-center gap-1.5 rounded-xl bg-black/25 py-2 px-3 backdrop-blur-md border border-white/10 shadow-lg w-full sm:w-fit overflow-hidden relative group transition-transform active:scale-95"
                >
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <Zap className="h-3.5 w-3.5 shrink-0 text-yellow-400 animate-pulse drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                    <span className="text-label font-bold uppercase tracking-widest text-white whitespace-nowrap">
                        {t('league.competing_top10')}
                    </span>
                </button>
            </div>

            <LeagueRewardsPopup
                isOpen={isRewardsPopupOpen}
                onClose={() => setIsRewardsPopupOpen(false)}
                currentLeague={league}
            />
        </motion.div>
    );
};
