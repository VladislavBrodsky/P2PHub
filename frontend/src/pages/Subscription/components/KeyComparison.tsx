import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Zap, Send, Sparkles } from 'lucide-react';

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
        <div className="mb-10 px-1">
            <div className="flex items-center justify-between mb-4 px-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-4 bg-linear-to-b from-blue-500 to-indigo-600 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-900 dark:text-white/60">
                        {t('pro:subscription.comparison.title')}
                    </h3>
                </div>
                <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest animate-pulse flex items-center gap-1">
                    <Sparkles size={8} className="fill-current" />
                    {t('pro:subscription.comparison.tap_to_explore')}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 px-1">
                {items.map((item, idx) => {
                    const activeValue = selectedPlan === 'PRO' ? item.pro : item.plus;
                    const inactiveValue = selectedPlan === 'PRO' ? item.plus : item.pro;
                    const isPlus = selectedPlan === 'PRO_PLUS';
                    
                    return (
                        <div key={idx} className="flex flex-col items-center gap-2 min-w-0 group">
                            <button
                                onClick={() => { selection(); setInfoModal({ title: item.label, desc: item.desc, icon: item.icon, color: item.accent }); }}
                                className="w-full relative overflow-hidden bg-white/40 dark:bg-white/5 backdrop-blur-md border border-slate-200/50 dark:border-white/10 rounded-2xl p-2.5 flex flex-col items-center gap-1.5 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 text-center min-w-0 group/card"
                            >
                                {/* Ambient Hover Glow */}
                                <div className={`absolute -inset-4 opacity-0 group-hover/card:opacity-20 blur-xl transition-opacity duration-500 bg-${item.accent}-500`} />

                                <div className={`w-9 h-9 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0 transition-all duration-500 group-hover/card:scale-110 group-hover/card:rotate-6 shadow-sm relative z-10`}>
                                    <item.icon size={16} strokeWidth={2.5} />
                                </div>
                                <span className="text-[9px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest w-full px-0.5 leading-none relative z-10">
                                    {item.label}
                                </span>

                                <div className="flex items-center justify-center gap-2 mt-0.5 w-full relative z-10">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-white/20 transition-all duration-500 line-through decoration-slate-400/30">{inactiveValue}</span>
                                    <div className="w-px h-3 bg-slate-200 dark:bg-white/10 rounded-full shrink-0" />
                                    <span className={`text-[15px] font-black tracking-tighter transition-all duration-500 ${isPlus ? 'text-indigo-500 drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]' : 'text-blue-500 drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]'}`}>
                                        {activeValue}
                                    </span>
                                </div>
                            </button>

                            <div className="h-0 flex items-center justify-center relative -top-1.5 overflow-visible">
                                <AnimatePresence>
                                    {isPlus && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5, scale: 0.5 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -5, scale: 0.5 }}
                                            className="z-30 pointer-events-none"
                                        >
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-rose-500 blur-md opacity-40 animate-pulse" />
                                                <span className="relative flex items-center gap-1 text-[8px] font-black bg-linear-to-r from-rose-500 via-pink-600 to-rose-500 bg-size-[200%_auto] animate-vibing-gradient text-white px-2.5 py-1 tracking-[0.1em] rounded-full shadow-lg border border-white/20 uppercase whitespace-nowrap">
                                                    <Zap size={8} className="fill-white" />
                                                    {t('marketing:income.math.turbo_badge', 'TURBO')}
                                                </span>
                                            </div>
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
