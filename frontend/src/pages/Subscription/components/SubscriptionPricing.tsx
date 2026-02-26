import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface SubscriptionPricingProps {
    selectedPlan: 'PRO' | 'PRO_PLUS';
    setSelectedPlan: (plan: 'PRO' | 'PRO_PLUS') => void;
    isStandardPro: boolean;
    proPrice: number;
    proPlusPrice: number;
    upgradePrice: number;
    selection: () => void;
    t: any;
}

export const SubscriptionPricing = React.memo(({
    selectedPlan,
    setSelectedPlan,
    isStandardPro,
    proPrice,
    proPlusPrice,
    upgradePrice,
    selection,
    t
}: SubscriptionPricingProps) => {
    return (
        <div className="relative px-3 pb-6 border-t border-slate-100 dark:border-white/5 pt-6">
            <div className="text-center mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center justify-center gap-2 mb-2 px-2.5 py-1 bg-blue-500/5 border border-blue-500/10 rounded-full"
                >
                    <div className="w-1 h-1 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)] animate-pulse" />
                    <span className="text-label font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">{t('pro:subscription.upgrade.badge')}</span>
                </motion.div>

                <h2 className="text-heading sm:text-heading font-bold tracking-tight text-slate-900 dark:text-white leading-tight text-center mb-3 uppercase px-4 max-w-[340px] mx-auto">
                    {t('pro:subscription.upgrade.dominate_network')}
                </h2>

                <p className="text-label sm:text-caption text-slate-500 dark:text-slate-400 font-bold leading-tight max-w-[280px] mx-auto opacity-70">
                    {t('pro:subscription.upgrade.subheadline')}
                </p>
            </div>

            <div className="flex items-stretch gap-2 px-1">
                {/* PRO Card */}
                <button
                    onClick={() => { selection(); setSelectedPlan('PRO'); }}
                    className={`relative flex-1 rounded-2xl px-3 py-3 flex flex-col items-center gap-0.5 transition-all duration-300 border overflow-hidden
                        ${selectedPlan === 'PRO'
                            ? 'vibing-yellow-animated border-yellow-400/30 shadow-[0_6px_20px_-4px_rgba(234,179,8,0.3)] scale-100'
                            : 'bg-white/5 dark:bg-white/3 border-slate-200/30 dark:border-white/8 opacity-50 scale-[0.97] hover:opacity-70'
                        }`}
                >
                    <span className={`text-[9px] font-black tracking-[0.2em] uppercase leading-none ${selectedPlan === 'PRO' ? 'text-black/50' : 'text-slate-400 dark:text-white/30'}`}>
                        {t('pro:subscription.upgrade.pro_title')}
                    </span>
                    <div className="flex items-baseline gap-0.5 mt-0.5">
                        <span className={`text-label font-bold leading-none ${selectedPlan === 'PRO' ? 'text-black/40' : 'text-slate-400/50'}`}>$</span>
                        <span className={`text-[28px] font-black tracking-tighter leading-none ${selectedPlan === 'PRO' ? 'text-black' : 'text-slate-400/40 dark:text-white/25'}`}>{proPrice}</span>
                    </div>
                </button>

                {/* Divider */}
                <div className="flex items-center justify-center shrink-0 w-4">
                    <div className="w-px h-8 bg-slate-200/60 dark:bg-white/10 rounded-full" />
                </div>

                {/* PRO+ Card */}
                <button
                    onClick={() => { selection(); setSelectedPlan('PRO_PLUS'); }}
                    className={`relative flex-1 rounded-2xl px-3 py-3 flex flex-col items-center gap-0.5 transition-all duration-300 border overflow-hidden
                        ${selectedPlan === 'PRO_PLUS'
                            ? 'vibing-crystal-purple-animated border-white/20 shadow-[0_6px_20px_-4px_rgba(168,85,247,0.35)] scale-100'
                            : 'bg-white/5 dark:bg-white/3 border-slate-200/30 dark:border-white/8 opacity-50 scale-[0.97] hover:opacity-70'
                        }`}
                >
                    <div className={`absolute -top-px left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-2 py-0.5 rounded-b-lg text-[7px] font-black tracking-[0.1em] uppercase transition-all duration-300
                        ${selectedPlan === 'PRO_PLUS'
                            ? 'bg-linear-to-r from-fuchsia-500 to-indigo-500 text-white shadow-[0_4px_12px_rgba(168,85,247,0.4)]'
                            : 'bg-slate-200/60 dark:bg-white/10 text-slate-400 dark:text-white/30'
                        }`}>
                        <Zap size={6} className={selectedPlan === 'PRO_PLUS' ? 'fill-white animate-pulse' : ''} />
                        <span>{t('pro:subscription.upgrade.viral_badge')}</span>
                    </div>

                    <span className={`text-[9px] font-black tracking-[0.15em] uppercase leading-none mt-2.5 ${selectedPlan === 'PRO_PLUS' ? 'text-white/80' : 'text-slate-400 dark:text-white/30'}`}>
                        {isStandardPro ? t('pro:subscription.upgrade.pro_plus_upgrade_title') : t('pro:subscription.upgrade.pro_plus_title')}
                    </span>
                    <div className="flex items-baseline gap-0.5 mt-0.5">
                        <span className={`text-label font-bold leading-none ${selectedPlan === 'PRO_PLUS' ? 'text-white/50' : 'text-slate-400/50'}`}>$</span>
                        <span className={`text-[28px] font-black tracking-tighter leading-none ${selectedPlan === 'PRO_PLUS' ? 'text-white' : 'text-slate-400/40 dark:text-white/25'}`}>
                            {isStandardPro ? upgradePrice : proPlusPrice}
                        </span>
                    </div>
                </button>
            </div>
        </div>
    );
});

SubscriptionPricing.displayName = 'SubscriptionPricing';
