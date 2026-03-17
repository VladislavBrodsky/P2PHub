import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Zap, Send } from 'lucide-react';

interface KeyComparisonProps {
    selectedPlan: 'PRO' | 'PRO_PLUS';
    t: any;
    selection: () => void;
    setInfoModal: (info: { title: string; desc: string; icon: any; color: string } | null) => void;
}

export const KeyComparison = ({
    selectedPlan,
    t,
    selection,
    setInfoModal
}: KeyComparisonProps) => {
    const items = [
        { icon: Network, label: t('pro:subscription.comparison.levels'), pro: '9', plus: '20', color: 'text-emerald-500', bg: 'bg-emerald-500/10', desc: t('pro:subscription.benefits.network_levels_desc_plus'), accent: 'emerald' },
        { icon: Zap, label: t('pro:subscription.comparison.tokens'), pro: '250', plus: '500', color: 'text-amber-500', bg: 'bg-amber-500/10', desc: t('pro:subscription.benefits.tokens_desc_plus'), accent: 'amber' },
        { icon: Send, label: t('pro:subscription.comparison.channels'), pro: '1', plus: '5', color: 'text-blue-500', bg: 'bg-blue-500/10', desc: t('pro:subscription.benefits.tg_multi_channel_desc'), accent: 'blue' },
    ];

    return (
        <div className="mb-6 px-1">
            <div className="flex items-center justify-between mb-3 px-3">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-3 bg-blue-600 rounded-full" />
                    <h3 className="text-label sm:text-label font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">
                        {t('pro:subscription.comparison.title')}
                    </h3>
                </div>
                <div className="text-label font-bold text-blue-500/80 uppercase tracking-widest animate-pulse">
                    {t('pro:subscription.comparison.tap_to_explore')}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 px-0.5">
                {items.map((item, idx) => {
                    const activeValue = selectedPlan === 'PRO' ? item.pro : item.plus;
                    const inactiveValue = selectedPlan === 'PRO' ? item.plus : item.pro;
                    return (
                        <div key={idx} className="flex flex-col items-center gap-1.5 min-w-0">
                            <button
                                onClick={() => { selection(); setInfoModal({ title: item.label, desc: item.desc, icon: item.icon, color: item.accent }); }}
                                className="w-full vibing-premium-panel bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 rounded-xl p-1 flex flex-col items-center gap-0.5 transition-all shadow-md active:scale-95 text-center min-w-0"
                            >
                                <div className="circuit-decor opacity-0 group-hover:opacity-10 transition-opacity" />

                                <div className={`w-7 h-7 rounded-lg ${item.bg} ${item.color} flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:rotate-12 mt-1`}>
                                    <item.icon size={12} strokeWidth={2.5} />
                                </div>
                                <span className="text-[8px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-tight w-full px-0.5 leading-tight">
                                    {item.label}
                                </span>

                                <div className="flex items-center justify-center gap-1 mt-0.5 w-full">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 transition-all duration-500">{inactiveValue}</span>
                                    <div className="w-px h-2.5 bg-slate-200 dark:bg-white/10 rounded-full shrink-0" />
                                    <span className={`text-caption font-bold tracking-tighter transition-all duration-500 ${selectedPlan === 'PRO_PLUS' ? 'vibing-purple-text drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]' : 'vibing-yellow-text drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]'}`}>
                                        {activeValue}
                                    </span>
                                </div>
                            </button>

                            <div className="h-0 flex items-center justify-center relative -top-1">
                                <AnimatePresence>
                                    {selectedPlan === 'PRO_PLUS' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5, scale: 0.5 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -5, scale: 0.5 }}
                                            className="z-30"
                                        >
                                            <span className="text-[7px] font-black bg-linear-to-r from-rose-500 to-pink-500 text-white px-1.5 py-0.5 tracking-tight rounded-full shadow-xs uppercase flex items-center gap-0.5">
                                                <Zap size={6} className="fill-white animate-pulse" />
                                                {t('marketing:income.math.turbo_badge', 'TURBO')}
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
