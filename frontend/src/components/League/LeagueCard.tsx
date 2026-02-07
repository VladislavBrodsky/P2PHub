import * as React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Shield, Zap, Star, Flame } from 'lucide-react';

export type LeagueTier = 'wooden' | 'silver' | 'metal' | 'gold' | 'platinum';

interface LeagueCardProps {
    league: LeagueTier;
    rank: number;
    score: number;
    referrals: number;
}

const useLeagueConfig = () => {
    // Mock translation for now
    const t = (key: string, defaultValue: string) => defaultValue;

    return {
        wooden: {
            name: t('league.wooden', 'Wooden League'),
            color: 'from-amber-800/80 to-amber-900',
            textColor: 'text-amber-200',
            borderColor: 'border-amber-700/30',
            icon: Shield,
            description: t('league.wooden_desc', 'New Partner. Just getting started on the journey.')
        },
        silver: {
            name: t('league.silver', 'Silver League'),
            color: 'from-slate-300 to-slate-500',
            textColor: 'text-slate-100',
            borderColor: 'border-slate-400/30',
            icon: Trophy,
            description: t('league.silver_desc', 'Active Partner. Building momentum and gaining traction.')
        },
        metal: {
            name: t('league.metal', 'Metal League'),
            color: 'from-zinc-400 to-zinc-700',
            textColor: 'text-zinc-100',
            borderColor: 'border-zinc-500/30',
            icon: Shield,
            description: t('league.metal_desc', 'Serious Partner. Consistent performance and steady growth.')
        },
        gold: {
            name: t('league.gold', 'Gold League'),
            color: 'from-yellow-400 to-amber-600',
            textColor: 'text-yellow-50',
            borderColor: 'border-yellow-500/30',
            icon: Star,
            description: t('league.gold_desc', 'Elite Partner. High impact and strong influence.')
        },
        platinum: {
            name: t('league.platinum', 'Platinum League'),
            color: 'from-indigo-400 via-purple-500 to-pink-500',
            textColor: 'text-white',
            borderColor: 'border-white/20',
            icon: Flame,
            description: t('league.platinum_desc', 'Legendary Status. Top 10 Partners compete here.')
        }
    };
};

export const LeagueCard: React.FC<LeagueCardProps> = ({ league, rank, score, referrals }) => {
    const LEAGUE_CONFIG = useLeagueConfig();
    const config = LEAGUE_CONFIG[league];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative overflow-hidden rounded-3xl border ${config.borderColor} bg-gradient-to-br ${config.color} p-6 shadow-2xl`}
        >
            {/* Background Decoration */}
            <div className="absolute -right-8 -top-8 h-32 w-32 opacity-20">
                <Icon className="h-full w-full rotate-12" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                        <Icon className={`h-6 w-6 ${config.textColor}`} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Current League</span>
                        <h2 className={`text-2xl font-black tracking-tighter ${config.textColor}`}>{config.name}</h2>
                    </div>
                </div>

                <p className={`mt-4 text-xs font-medium ${config.textColor} opacity-80 leading-relaxed max-w-[80%]`}>
                    {config.description}
                </p>

                <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Global Rank</p>
                        <p className={`text-lg font-black tracking-tighter ${config.textColor}`}>#{rank}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">XP Score</p>
                        <p className={`text-lg font-black tracking-tighter ${config.textColor}`}>{score.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Referrals</p>
                        <p className={`text-lg font-black tracking-tighter ${config.textColor}`}>{referrals}</p>
                    </div>
                </div>

                {league === 'platinum' && (
                    <div className="mt-6 flex items-center gap-2 rounded-xl bg-black/20 p-3 backdrop-blur-sm">
                        <Zap className="h-4 w-4 text-amber-300" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100">
                            Competing for TOP 10 rewards
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
