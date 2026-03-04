import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Star, Flame, Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { USDTLogo } from '../ui/USDTLogo';

interface PrizeEntry {
    rank: number | string;
    prize: string;
    color: string;
    glow: string;
    icon: React.ReactNode;
}

const PRIZES: PrizeEntry[] = [
    {
        rank: '🥇 1',
        prize: '$500 USDT',
        color: 'from-amber-400 to-yellow-500',
        glow: 'rgba(251,191,36,0.35)',
        icon: <Crown size={16} className="text-white" />,
    },
    {
        rank: '🥈 2',
        prize: '$300 USDT',
        color: 'from-slate-300 to-slate-400',
        glow: 'rgba(148,163,184,0.3)',
        icon: <Trophy size={16} className="text-white" />,
    },
    {
        rank: '🥉 3',
        prize: '$150 USDT',
        color: 'from-orange-400 to-amber-500',
        glow: 'rgba(251,146,60,0.3)',
        icon: <Star size={16} className="text-white" />,
    },
    {
        rank: '4–5',
        prize: '$75–100 USDT',
        color: 'from-indigo-400 to-violet-500',
        glow: 'rgba(129,140,248,0.25)',
        icon: <Flame size={16} className="text-white" />,
    },
    {
        rank: '6–10',
        prize: '$25–50 USDT',
        color: 'from-sky-400 to-cyan-500',
        glow: 'rgba(125,211,252,0.2)',
        icon: <Gift size={16} className="text-white" />,
    },
];

export const LeaguePrizes: React.FC = () => {
    const { t } = useTranslation(['social', 'common']);

    return (
        <div className="mt-4 mb-2">
            {/* Section header */}
            <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-5 flex items-center justify-center rounded-lg bg-linear-to-br from-amber-400 to-yellow-500 shadow-[0_2px_10px_rgba(251,191,36,0.4)]">
                    <Trophy size={11} className="text-white" />
                </div>
                <h3 className="text-subheading font-bold text-slate-900 dark:text-white tracking-tight">
                    {t('league.prizes_title', 'Ежемесячные призы')}
                </h3>
                <span className="ml-auto text-label font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {t('league.top_10', 'ТОП-10')}
                </span>
            </div>

            {/* Prizes grid */}
            <div className="space-y-2">
                {PRIZES.map((entry, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + i * 0.05, type: 'spring', stiffness: 400, damping: 30 }}
                        className={[
                            'flex items-center gap-3 rounded-2xl p-3 border transition-colors',
                            'bg-white/70 border-slate-200/70 dark:bg-white/4 dark:border-white/[0.07]',
                        ].join(' ')}
                        style={{ boxShadow: `0 4px 20px -6px ${entry.glow}` }}
                    >
                        {/* Gradient rank badge */}
                        <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${entry.color} shadow-sm`}
                            style={{ boxShadow: `0 4px 12px -4px ${entry.glow}` }}
                        >
                            {entry.icon}
                        </div>

                        {/* Rank label */}
                        <p className="flex-1 text-xs font-bold text-slate-900 dark:text-white">
                            {t('league.rank', 'Место')} {entry.rank}
                        </p>

                        {/* Prize amount */}
                        <div className={`flex items-center gap-1.5 rounded-xl bg-linear-to-r ${entry.color} px-3 py-1.5 shadow-sm`}
                            style={{ boxShadow: `0 2px 10px -3px ${entry.glow}` }}>
                            <USDTLogo className="w-3 h-3" />
                            <span className="text-label font-bold text-white">{entry.prize}</span>
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
                🔄 {t('league.prizes_reset_note', 'Обновляется 1-го числа каждого месяца')}
            </motion.p>
        </div>
    );
};
