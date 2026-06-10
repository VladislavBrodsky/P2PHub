import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface ProfitMathProps {
    t: any;
}

export const ProfitMath = ({ t }: ProfitMathProps) => {
    return (
        <div className="mb-8 px-1">
            <div className="relative overflow-hidden rounded-3xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-slate-200/50 dark:border-emerald-500/20 p-6 space-y-6 shadow-xl group">
                {/* High-Fidelity Ambient Glows */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 blur-[80px] pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 blur-[60px] pointer-events-none" />

                <div className="relative flex items-center justify-between border-b border-slate-100/50 dark:border-white/5 pb-5">
                    <div className="flex flex-col text-left">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
                                {t('marketing:income.math.subheading_part1')}
                            </span>
                        </div>
                        <h4 className="text-[11px] font-black text-slate-900 dark:text-white leading-none uppercase tracking-[0.15em] opacity-80">
                            {t('marketing:income.math.heading')}
                        </h4>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter leading-none mb-1 drop-shadow-sm">
                            {t('marketing:income.math.val_month', '$43,200')}
                        </div>
                        <div className="text-[9px] font-black text-emerald-600/60 dark:text-emerald-500/50 uppercase tracking-[0.2em] leading-none">
                            {t('marketing:income.math.per_month')}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm group/card hover:bg-white dark:hover:bg-white/10 transition-colors">
                        <div className="text-[9px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] mb-1.5">
                            {t('marketing:income.math.per_day')}
                        </div>
                        <div className="text-lg font-black text-slate-900 dark:text-white tracking-tighter group-hover:scale-105 transition-transform origin-left">
                            {t('marketing:income.math.val_day', '$1,440')}
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm group/card hover:bg-white dark:hover:bg-white/10 transition-colors">
                        <div className="text-[9px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] mb-1.5">
                            {t('marketing:income.math.per_year')}
                        </div>
                        <div className="text-lg font-black text-slate-900 dark:text-white tracking-tighter group-hover:scale-105 transition-transform origin-left">
                            {t('marketing:income.math.val_year', '$518,400')}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] text-slate-500 dark:text-white/30 font-bold italic tracking-wide uppercase opacity-70">
                        {t('marketing:income.math.formula_note')}
                    </span>
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500 text-white shadow-[0_5px_15px_-5px_rgba(244,63,94,0.4)]"
                    >
                        <Flame className="w-3 h-3 fill-current animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                            {t('pro:subscription.upgrade.selling_fast')}
                        </span>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
