import React from 'react';
import { Flame } from 'lucide-react';

interface ProfitMathProps {
    t: any;
}

export const ProfitMath = ({ t }: ProfitMathProps) => {
    return (
        <div className="mb-6 px-1">
            <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-emerald-500/20 p-5 space-y-4 shadow-xl shadow-slate-200/50 dark:shadow-[0_15px_40px_-10px_rgba(16,185,129,0.15)]">
                {/* Ambient glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl pointer-events-none" />

                <div className="relative flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                    <div className="flex flex-col text-left">
                        <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-label font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 opacity-90">
                                {t('marketing:income.math.subheading_part1')}
                            </span>
                        </div>
                        <h4 className="text-label font-bold text-slate-900 dark:text-white leading-tight uppercase tracking-[0.1em]">
                            {t('marketing:income.math.heading')}
                        </h4>
                    </div>
                    <div className="text-right">
                        <div className="text-button font-bold text-emerald-600 dark:text-emerald-400 tracking-tighter mb-0.5">
                            {t('marketing:income.math.val_month', '$43,200')}
                        </div>
                        <div className="text-label font-bold text-emerald-600/70 dark:text-emerald-500/60 uppercase tracking-widest -mt-1">
                            {t('marketing:income.math.per_month')}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-none">
                        <div className="text-label font-bold text-slate-500 dark:text-white/30 uppercase tracking-[0.2em] mb-0.5">
                            {t('marketing:income.math.per_day')}
                        </div>
                        <div className="text-caption font-bold text-slate-900 dark:text-white tracking-tighter">
                            {t('marketing:income.math.val_day', '$1,440')}
                        </div>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-none">
                        <div className="text-label font-bold text-slate-500 dark:text-white/30 uppercase tracking-[0.2em] mb-0.5">
                            {t('marketing:income.math.per_year')}
                        </div>
                        <div className="text-caption font-bold text-slate-900 dark:text-white tracking-tighter">
                            {t('marketing:income.math.val_year', '$518,400')}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between text-label">
                    <span className="text-slate-500 dark:text-white/30 font-bold italic">
                        {t('marketing:income.math.formula_note')}
                    </span>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                        <Flame className="w-2 h-2 text-rose-500 animate-pulse" />
                        <span className="text-label font-bold text-rose-600 dark:text-rose-400 uppercase tracking-tight">
                            {t('pro:subscription.upgrade.selling_fast')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
