import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

interface BenefitItem {
    id: string;
    icon: any;
    label: string;
    desc: string;
    color: string;
    bg: string;
}

interface SubscriptionBenefitsProps {
    selectedPlan: 'PRO' | 'PRO_PLUS';
    isStandardPro: boolean;
    currentBenefits: BenefitItem[];
    expandedBenefit: string | null;
    setExpandedBenefit: (id: string | null) => void;
    selection: () => void;
    t: any;
}

export const SubscriptionBenefits = React.memo(({
    selectedPlan,
    isStandardPro,
    currentBenefits,
    expandedBenefit,
    setExpandedBenefit,
    selection,
    t
}: SubscriptionBenefitsProps) => {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={selectedPlan}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="mb-8"
            >
                {/* Plan headline */}
                <div className={`rounded-2xl p-5 mb-5 border relative overflow-hidden shadow-premium backdrop-blur-md transition-all duration-500 ${selectedPlan === 'PRO'
                    ? 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20 dark:border-blue-500/20'
                    : 'bg-yellow-500/5 dark:bg-yellow-500/10 border-yellow-500/20 dark:border-yellow-500/20'
                    }`}>

                    <motion.div
                        animate={{
                            x: ['-100%', '200%'],
                            opacity: [0, 0.4, 0]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                            repeatDelay: 1.5
                        }}
                        className={`absolute inset-0 pointer-events-none bg-linear-to-r from-transparent ${selectedPlan === 'PRO' ? 'via-white/40' : 'via-yellow-300/40'} to-transparent skew-x-[-20deg] z-0`}
                    />

                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-12 -mt-12 ${selectedPlan === 'PRO' ? 'bg-blue-500' : 'bg-yellow-500'} transition-colors duration-500`} />
                    <div className="relative z-10">
                        <div className={`text-label font-bold uppercase tracking-[0.25em] mb-1 ${selectedPlan === 'PRO' ? 'text-blue-600 dark:text-blue-400' : 'text-yellow-600 dark:text-yellow-500'}`}>
                            {selectedPlan === 'PRO'
                                ? `${t('pro:subscription.upgrade.pro_title')} — ${t('pro:subscription.plan_headline')}`
                                : t('pro:subscription.plan_headline_plus')}
                        </div>
                        <p className="text-caption font-bold text-slate-700 dark:text-white/80 leading-snug">
                            {selectedPlan === 'PRO' ? t('pro:subscription.plan_desc_pro') : t('pro:subscription.plan_desc_plus')}
                        </p>
                    </div>
                </div>

                {/* Benefits list */}
                <div className="grid grid-cols-1 gap-2.5">
                    {currentBenefits.map((b, i) => {
                        const isExpanded = expandedBenefit === b.id;
                        return (
                            <motion.div
                                key={b.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="relative group focus-within:ring-2 focus-within:ring-blue-500/50 rounded-2xl transition-all"
                            >
                                <button
                                    onClick={() => {
                                        selection();
                                        setExpandedBenefit(isExpanded ? null : b.id);
                                    }}
                                    className={`w-full text-left rounded-2xl border transition-all duration-300 ${isExpanded ? 'bg-white dark:bg-white/10 border-blue-500/30 shadow-lg' : 'bg-white/40 dark:bg-black/20 border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'}`}
                                >
                                    <div className="px-4 py-2.5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-xl ${b.bg} flex items-center justify-center shrink-0 shadow-sm ${b.color} group-hover:scale-110 transition-transform`}>
                                                <b.icon size={14} />
                                            </div>
                                            <span className="text-label font-bold uppercase tracking-wider text-slate-700 dark:text-white/90">{b.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Check size={10} className="text-emerald-500 opacity-60" strokeWidth={4} />
                                            <ChevronDown
                                                size={12}
                                                className={`text-slate-400 dark:text-white/20 transition-transform duration-500 ${isExpanded ? 'rotate-180 text-blue-500' : ''}`}
                                            />
                                        </div>
                                    </div>
                                </button>
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                                        >
                                            <div className="px-4 pb-4 pt-0">
                                                <div className="pl-12 pr-4 py-3 border-t border-slate-100 dark:border-white/5">
                                                    <p className="text-label font-medium text-slate-500 dark:text-white/50 leading-relaxed italic">
                                                        {b.desc}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Quick checklist - Compacted */}
                <div className="mt-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/10 rounded-xl p-3 grid grid-cols-1 gap-1.5 shadow-sm backdrop-blur-md">
                    {(() => {
                        const benefitsArr = t(selectedPlan === 'PRO' ? 'subscription.upgrade.benefits_pro' : 'subscription.upgrade.benefits_pro_plus', { returnObjects: true });
                        const benefitsList = Array.isArray(benefitsArr) ? benefitsArr : [];
                        return benefitsList.map((b: string, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${selectedPlan === 'PRO' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' : 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-500'}`}>
                                    <Check size={8} strokeWidth={4} />
                                </div>
                                <span className="text-[10px] font-black text-slate-500 dark:text-white/60 uppercase tracking-tight leading-tight">{b}</span>
                            </div>
                        ));
                    })()}
                </div>
            </motion.div>
        </AnimatePresence>
    );
});

SubscriptionBenefits.displayName = 'SubscriptionBenefits';
