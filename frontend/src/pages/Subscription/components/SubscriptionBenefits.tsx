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
                transition={{ duration: 0.3 }}
                className="mb-12"
            >
                {/* Plan headline - Modernized */}
                <div className={`rounded-2xl p-6 mb-8 border-2 relative overflow-hidden transition-all duration-500 ${selectedPlan === 'PRO'
                    ? 'bg-blue-600 border-blue-400 shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)]'
                    : 'bg-yellow-400 border-yellow-300 shadow-[0_20px_40px_-10px_rgba(234,179,8,0.3)]'
                    }`}>

                    <motion.div
                        animate={{
                            x: ['-100%', '200%'],
                            opacity: [0, 0.3, 0]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className={`absolute inset-0 pointer-events-none bg-linear-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] z-0`}
                    />

                    <div className="relative z-10">
                        <div className={`text-label font-black uppercase tracking-[0.3em] mb-2 ${selectedPlan === 'PRO' ? 'text-white/60' : 'text-[#0a1000]/50'}`}>
                            {selectedPlan === 'PRO'
                                ? t('pro:subscription.plan_headline')
                                : t('pro:subscription.plan_headline_plus')}
                        </div>
                        <p className={`text-body font-bold leading-relaxed ${selectedPlan === 'PRO' ? 'text-white' : 'text-[#0a1000]'}`}>
                            {selectedPlan === 'PRO' ? t('pro:subscription.plan_desc_pro') : t('pro:subscription.plan_desc_plus')}
                        </p>
                    </div>
                </div>

                {/* Benefits Grid (Bento Style) */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    {currentBenefits.map((b, i) => (
                        <motion.div
                            key={b.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="glass-panel-premium group p-4 rounded-xl border border-slate-100 dark:border-white/5 flex flex-col gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <div className={`w-10 h-10 rounded-xl ${b.bg} flex items-center justify-center shrink-0 shadow-sm ${b.color} group-hover:rotate-6 transition-transform`}>
                                <b.icon size={18} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-white/30 leading-none">{b.label}</span>
                                <p className="text-label font-bold text-slate-700 dark:text-white/80 leading-tight">
                                    {b.desc.split('.')[0]}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Quick checklist - Premium Box */}
                <div className="bg-slate-50 dark:bg-black/40 border-2 border-slate-100 dark:border-white/5 rounded-xl p-5 space-y-3 shadow-xl">
                    <div className="flex items-center gap-2 mb-1">
                        <Check size={14} className="text-emerald-500" strokeWidth={3} />
                        <span className="text-label font-black uppercase tracking-widest text-slate-400 dark:text-white/30">
                            {t('pro:subscription.benefits.full_access')}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                        {(() => {
                            const benefitsArr = t(selectedPlan === 'PRO' ? 'pro:subscription.upgrade.benefits_pro' : 'pro:subscription.upgrade.benefits_pro_plus', { returnObjects: true });
                            const benefitsList = Array.isArray(benefitsArr) ? benefitsArr : [];
                            return benefitsList.map((b: string, i: number) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${selectedPlan === 'PRO' ? 'bg-blue-500/10 text-blue-600' : 'bg-yellow-400/20 text-yellow-600'}`}>
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                    <span className="text-caption font-bold text-slate-700 dark:text-white/70 uppercase tracking-tight leading-none">{b}</span>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
});

SubscriptionBenefits.displayName = 'SubscriptionBenefits';
