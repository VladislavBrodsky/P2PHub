import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Star, Flame, Gift, CreditCard, Laptop, Smartphone, Cpu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { USDTLogo } from '../ui/USDTLogo';
import { LeagueTier } from './LeagueCard';

interface PrizeEntry {
    rank: string;
    prize: string;
    sublabel?: string;
    color: string;
    glow: string;
    icon: React.ReactNode;
}

const LEAGUE_PRIZES: Record<LeagueTier, PrizeEntry[]> = {
    wooden: [
        {
            rank: '🥇 1–3',
            prize: 'Pintopay Virtual Card',
            sublabel: 'Free card',
            color: 'from-amber-400 to-yellow-500',
            glow: 'rgba(251,191,36,0.4)',
            icon: <CreditCard size={15} className="text-white" />,
        },
        {
            rank: '4–10',
            prize: 'PRO Plan',
            sublabel: '1 month free',
            color: 'from-indigo-400 to-violet-500',
            glow: 'rgba(129,140,248,0.3)',
            icon: <Gift size={15} className="text-white" />,
        },
    ],
    silver: [
        {
            rank: '🥇 1–3',
            prize: 'Virtual + Physical Card',
            sublabel: '2 Pintopay cards',
            color: 'from-amber-400 to-yellow-500',
            glow: 'rgba(251,191,36,0.4)',
            icon: <CreditCard size={15} className="text-white" />,
        },
        {
            rank: '4–10',
            prize: 'PRO+ Plan',
            sublabel: '1 month free',
            color: 'from-violet-500 to-fuchsia-500',
            glow: 'rgba(167,139,250,0.3)',
            icon: <Gift size={15} className="text-white" />,
        },
    ],
    metal: [
        {
            rank: '🥇 1–3',
            prize: 'Virtual + Physical Card',
            sublabel: '2 Pintopay cards',
            color: 'from-amber-400 to-yellow-500',
            glow: 'rgba(251,191,36,0.4)',
            icon: <CreditCard size={15} className="text-white" />,
        },
        {
            rank: '4–10',
            prize: 'PRO+ Plan',
            sublabel: '1 month free',
            color: 'from-violet-500 to-fuchsia-500',
            glow: 'rgba(167,139,250,0.3)',
            icon: <Gift size={15} className="text-white" />,
        },
    ],
    gold: [
        {
            rank: '🥇 1–3',
            prize: 'Virtual + Physical Card',
            sublabel: '2 Pintopay cards',
            color: 'from-amber-400 to-yellow-500',
            glow: 'rgba(251,191,36,0.4)',
            icon: <CreditCard size={15} className="text-white" />,
        },
        {
            rank: '4–10',
            prize: 'PRO+ Plan',
            sublabel: '1 month free',
            color: 'from-violet-500 to-fuchsia-500',
            glow: 'rgba(167,139,250,0.3)',
            icon: <Gift size={15} className="text-white" />,
        },
    ],
    platinum: [
        {
            rank: '🥇 #1',
            prize: 'MacBook Pro',
            sublabel: 'Apple MacBook Pro M4',
            color: 'from-amber-400 to-yellow-500',
            glow: 'rgba(251,191,36,0.5)',
            icon: <Laptop size={15} className="text-white" />,
        },
        {
            rank: '🥈 #2',
            prize: 'DJI Mini 5 Pro',
            sublabel: 'Professional drone',
            color: 'from-slate-300 to-slate-400',
            glow: 'rgba(148,163,184,0.4)',
            icon: <Cpu size={15} className="text-white" />,
        },
        {
            rank: '🥉 #3',
            prize: 'iPhone 17 Pro',
            sublabel: 'Apple iPhone 17 Pro',
            color: 'from-orange-400 to-amber-500',
            glow: 'rgba(251,146,60,0.4)',
            icon: <Smartphone size={15} className="text-white" />,
        },
        {
            rank: '4–10',
            prize: '$300 USDT each',
            sublabel: 'Cash reward',
            color: 'from-emerald-400 to-teal-500',
            glow: 'rgba(52,211,153,0.3)',
            icon: <USDTLogo className="w-4 h-4" />,
        },
    ],
};

interface LeaguePrizesProps {
    league: LeagueTier;
    showHeader?: boolean;
}

export const LeaguePrizes: React.FC<LeaguePrizesProps> = ({ league, showHeader = true }) => {
    const { t } = useTranslation(['social', 'common']);
    const prizes = LEAGUE_PRIZES[league];

    return (
        <div className="mt-4 mb-2">
            {/* Section header */}
            {showHeader && (
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-5 w-5 flex items-center justify-center rounded-lg bg-linear-to-br from-amber-400 to-yellow-500 shadow-[0_2px_10px_rgba(251,191,36,0.4)]">
                        <Trophy size={11} className="text-white" />
                    </div>
                    <h3 className="text-subheading font-bold text-slate-900 dark:text-white tracking-tight">
                        {t('league.prizes_title', 'Monthly Prizes')}
                    </h3>
                    <span className="ml-auto text-label font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {t('league.top_10', 'TOP 10')}
                    </span>
                </div>
            )}

            {/* Prize rows */}
            <div className="space-y-2">
                {prizes.map((entry, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + i * 0.07, type: 'spring', stiffness: 400, damping: 30 }}
                        className={[
                            'flex items-center gap-3 rounded-2xl p-3 border transition-colors',
                            'bg-white/70 border-slate-200/70 dark:bg-white/4 dark:border-white/[0.07]',
                        ].join(' ')}
                        style={{ boxShadow: `0 4px 20px -8px ${entry.glow}` }}
                    >
                        {/* Rank badge */}
                        <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${entry.color} shadow-sm`}
                            style={{ boxShadow: `0 4px 12px -4px ${entry.glow}` }}
                        >
                            {entry.icon}
                        </div>

                        {/* Rank label */}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                {t('league.rank', 'Rank')} {entry.rank}
                            </p>
                            {entry.sublabel && (
                                <p className="text-label text-slate-400 dark:text-slate-500">{entry.sublabel}</p>
                            )}
                        </div>

                        {/* Prize chip */}
                        <div
                            className={`shrink-0 flex items-center gap-1 rounded-xl bg-linear-to-r ${entry.color} px-2.5 py-1.5 shadow-sm`}
                            style={{ boxShadow: `0 2px 10px -3px ${entry.glow}` }}
                        >
                            <span className="text-label font-bold text-white whitespace-nowrap">{entry.prize}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Reset notice */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center text-label text-slate-400 dark:text-slate-500 mt-3"
            >
                🔄 {t('league.prizes_reset_note', 'Updates on the 1st of each month')}
            </motion.p>
        </div>
    );
};
