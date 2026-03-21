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
            className="group"
        >
            <div className={`relative overflow-hidden rounded-2xl border ${config.borderColor} bg-linear-to-br ${config.color} p-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]`}>
            {/* Glossy / Glass Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
            <div className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent pointer-events-none" />
            
            {/* Big Icon Watermark with subtle glow */}
            <div className="absolute -right-8 -top-8 h-44 w-44 opacity-[0.06] text-white pointer-events-none blur-[1px]">
                <Icon className="h-full w-full rotate-12" />
            </div>

            <div className="relative z-10">
                {/* Top Row: Icon + Name + Badge */}
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-2xl border border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]">
                        <Icon className={`h-6 w-6 ${config.textColor} drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50 block leading-none mb-1">
                            {t('leaderboard.current_league')}
                        </span>
                        <h2 className={`text-2xl font-black tracking-tighter ${config.textColor} leading-none drop-shadow-md`}>
                            {config.name}
                        </h2>
                    </div>
                    {(subscription_plan || '').includes('PRO') && (
                        <div className="shrink-0 scale-110 origin-right">
                            <ProBadge
                                variant={(subscription_plan || '').includes('PLUS') ? 'pro-plus' : 'pro'}
                                size="lg"
                            />
                        </div>
                    )}
                </div>

                {/* Stats Row */}
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 truncate">
                            {t('leaderboard.global_rank')}
                        </p>
                        <p className={`text-2xl font-black tracking-tighter ${config.textColor} drop-shadow-lg`}>#{rank}</p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 truncate">
                            {t('leaderboard.xp_score')}
                        </p>
                        <p className={`text-2xl font-black tracking-tighter ${config.textColor} drop-shadow-lg font-mono`}>
                            {Math.floor(score).toLocaleString()}
                        </p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 truncate">
                            {t('partner_dashboard.total_earned')}
                        </p>
                        <div className={`text-2xl font-black tracking-tighter ${config.textColor} drop-shadow-lg flex items-center gap-1.5`}>
                            <USDTLogo className="w-4 h-4 drop-shadow-[0_0_8px_rgba(38,161,123,0.5)]" />
                            <LiquidCounter value={total_earned_usdt} />
                        </div>
                    </div>
                </div>

                {/* Rewards Badge - Viral Style */}
                <button
                    onClick={() => setIsRewardsPopupOpen(true)}
                    className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 py-3 px-4 backdrop-blur-xl border border-white/10 shadow-2xl w-full group transition-all active:scale-[0.97]"
                >
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <div className="relative flex items-center gap-2">
                        <div className="p-1 bg-yellow-400 rounded-lg animate-bounce-subtle">
                            <Zap className="h-3.5 w-3.5 text-slate-900" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.15em] text-white">
                            {t('league.competing_top10')}
                        </span>
                    </div>
                </button>
            </div>

            <LeagueRewardsPopup
                isOpen={isRewardsPopupOpen}
                onClose={() => setIsRewardsPopupOpen(false)}
                currentLeague={league}
            />
            </div>
        </motion.div>
    );
};
