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
        <div className="relative px-3 pb-6 pt-2">
            <div className="text-center mb-8 px-4">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center justify-center gap-2 mb-3 px-3 py-1 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 rounded-full"
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">{t('pro:subscription.upgrade.badge')}</span>
                </motion.div>

                <h2 className="text-display font-black tracking-tighter text-slate-900 dark:text-white leading-[1.1] text-center mb-3 uppercase max-w-[320px] mx-auto">
                    {t('pro:subscription.upgrade.dominate_network')}
                </h2>

                <p className="text-caption text-slate-500 dark:text-slate-400 font-bold leading-relaxed max-w-[280px] mx-auto opacity-70">
                    {t('pro:subscription.upgrade.subheadline')}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 px-1">
                {/* PRO Card */}
                <button
                    onClick={() => { selection(); setSelectedPlan('PRO'); }}
                    className={`relative rounded-2xl p-5 flex flex-col items-center gap-2 transition-all duration-500 border-2 text-center group
                        ${selectedPlan === 'PRO'
                            ? 'bg-blue-600 border-blue-400 shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] scale-100 z-10'
                            : 'bg-white/50 dark:bg-white/5 border-slate-100 dark:border-white/5 opacity-60 scale-[0.96] hover:opacity-100'
                        }`}
                >
                    <div className="circuit-decor opacity-0 group-hover:opacity-10 transition-opacity" />
                    
                    <span className={`text-[10px] font-black tracking-[0.2em] uppercase leading-none ${selectedPlan === 'PRO' ? 'text-white/60' : 'text-slate-400 dark:text-white/30'}`}>
                        {t('pro:subscription.upgrade.pro_title')}
                    </span>
                    <div className="flex flex-col items-center gap-1 mt-1">
                        <div className="flex items-baseline gap-1">
                            <span className={`text-label font-bold leading-none ${selectedPlan === 'PRO' ? 'text-white/40' : 'text-slate-400/50'}`}>$</span>
                            <span className={`text-[clamp(1.75rem,8vw,2.625rem)] font-black tracking-tighter leading-none ${selectedPlan === 'PRO' ? 'text-white' : 'text-slate-900 dark:text-white/20'}`}>{proPrice}</span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedPlan === 'PRO' ? 'text-white/40' : 'text-slate-400/30'}`}>
                            {t('pro:subscription.pro_active.lifetime')}
                        </span>
                    </div>
                </button>

                {/* PRO+ Card */}
                <button
                    onClick={() => { selection(); setSelectedPlan('PRO_PLUS'); }}
                    className={`relative rounded-2xl p-5 flex flex-col items-center gap-2 transition-all duration-500 border-2 text-center group
                        ${selectedPlan === 'PRO_PLUS'
                            ? 'vibing-yellow-animated border-yellow-400 shadow-[0_20px_40px_-10px_rgba(234,179,8,0.4)] scale-100 z-10'
                            : 'bg-white/50 dark:bg-white/5 border-slate-100 dark:border-white/5 opacity-60 scale-[0.96] hover:opacity-100'
                        }`}
                >
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-[8px] font-black tracking-[0.15em] uppercase transition-all duration-500 shadow-lg
                        ${selectedPlan === 'PRO_PLUS'
                            ? 'bg-black text-yellow-400 border border-yellow-400/30'
                            : 'bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/30'
                        }`}>
                        <Zap size={8} className={selectedPlan === 'PRO_PLUS' ? 'fill-yellow-400 animate-pulse' : ''} />
                        <span>{t('pro:subscription.upgrade.viral_badge')}</span>
                    </div>

                    <span className={`text-[10px] font-black tracking-[0.2em] uppercase leading-none mt-2 ${selectedPlan === 'PRO_PLUS' ? 'text-[#0a1000]/50' : 'text-slate-400 dark:text-white/30'}`}>
                        {isStandardPro ? t('pro:subscription.upgrade.pro_plus_upgrade_title') : t('pro:subscription.upgrade.pro_plus_title')}
                    </span>
                    <div className="flex flex-col items-center gap-1 mt-1">
                        <div className="flex items-baseline gap-1">
                            <span className={`text-label font-bold leading-none ${selectedPlan === 'PRO_PLUS' ? 'text-[#0a1000]/40' : 'text-slate-400/50'}`}>$</span>
                            <span className={`text-[42px] font-black tracking-tighter leading-none ${selectedPlan === 'PRO_PLUS' ? 'text-[#0a1000]' : 'text-slate-900 dark:text-white/20'}`}>
                                {isStandardPro ? upgradePrice : proPlusPrice}
                            </span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${selectedPlan === 'PRO_PLUS' ? 'text-[#0a1000]/40' : 'text-slate-400/30'}`}>
                            {t('pro:subscription.pro_active.lifetime')}
                        </span>
                    </div>
                </button>
            </div>
        </div>
    );
});

SubscriptionPricing.displayName = 'SubscriptionPricing';
