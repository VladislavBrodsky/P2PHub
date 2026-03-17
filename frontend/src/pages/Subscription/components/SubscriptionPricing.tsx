import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronDown, Check, Clock, Brain, Network, TrendingUp, Bot, Target, Star, BarChart2, Rocket, Infinity as InfinityIcon } from 'lucide-react';
import { FomoTimer } from './SubscriptionTimers';

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
    const [expandedPlan, setExpandedPlan] = useState<'PRO' | 'PRO_PLUS' | null>(null);

    const proBenefits = [
        { id: 'ai', icon: Brain, label: t('pro:subscription.benefits.ai_studio'), desc: t('pro:subscription.benefits.ai_studio_desc_pro') },
        { id: 'network', icon: Network, label: t('pro:subscription.benefits.network_levels'), desc: t('pro:subscription.benefits.network_levels_desc_pro') },
        { id: 'tokens', icon: Zap, label: t('pro:subscription.benefits.tokens'), desc: t('pro:subscription.benefits.tokens_desc_pro') },
        { id: 'cashback', icon: TrendingUp, label: t('pro:subscription.benefits.cashback'), desc: t('pro:subscription.benefits.cashback_desc_pro') },
        { id: 'tools', icon: Bot, label: t('pro:subscription.benefits.tools'), desc: t('pro:subscription.benefits.tools_desc_pro') },
        { id: 'intel', icon: Target, label: t('pro:subscription.benefits.growth_intel'), desc: t('pro:subscription.benefits.growth_intel_desc') },
    ];

    const proPlusBenefits = [
        { id: 'ai', icon: Brain, label: t('pro:subscription.benefits.ai_studio'), desc: t('pro:subscription.benefits.ai_studio_desc_plus') },
        { id: 'network', icon: Network, label: t('pro:subscription.benefits.network_levels'), desc: t('pro:subscription.benefits.network_levels_desc_plus') },
        { id: 'omni', icon: InfinityIcon, label: t('pro:subscription.benefits.omni_sync'), desc: t('pro:subscription.benefits.omni_sync_desc') },
        { id: 'priority', icon: Star, label: t('pro:subscription.benefits.priority_ai'), desc: t('pro:subscription.benefits.priority_ai_desc') },
        { id: 'analytics', icon: BarChart2, label: t('pro:subscription.benefits.content_analytics'), desc: t('pro:subscription.benefits.content_analytics_desc') },
        { id: 'empire', icon: Rocket, label: t('pro:subscription.benefits.empire_access'), desc: t('pro:subscription.benefits.empire_access_desc') },
    ];
    return (
        <div className="relative px-3 pb-6 pt-2">
            <div className="text-center mb-8 px-4">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center justify-center gap-2 mb-3 px-3 py-1 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 rounded-full"
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
                    <span className="text-[clamp(0.5rem,1.8vw,0.6rem)] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">{t('pro:subscription.upgrade.badge')}</span>
                </motion.div>

                <h2 className="text-display font-black tracking-tighter text-slate-900 dark:text-white leading-tight text-center mb-3 uppercase max-w-[320px] mx-auto">
                    {t('pro:subscription.upgrade.dominate_network')}
                </h2>

                <p className="text-caption text-slate-500 dark:text-slate-400 font-bold leading-relaxed max-w-[280px] mx-auto opacity-70">
                    {t('pro:subscription.upgrade.subheadline')}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 px-1 items-start">
                {[
                    { id: 'PRO' as const, color: 'blue' },
                    { id: 'PRO_PLUS' as const, color: 'yellow' }
                ].map((plan) => {
                    const isSelected = selectedPlan === plan.id;
                    const isPlus = plan.id === 'PRO_PLUS';
                    const isExpanded = expandedPlan === plan.id;

                    return (
                        <div key={plan.id} className="flex flex-col gap-2">
                            <button
                                onClick={() => { selection(); setSelectedPlan(plan.id); }}
                                className={`relative rounded-2xl p-5 flex flex-col items-center gap-2 border-2 text-center group w-full
                                    ${isSelected
                                        ? isPlus
                                            ? 'vibing-yellow-animated border-yellow-400 shadow-[0_20px_40px_-10px_rgba(234,179,8,0.4)] z-10'
                                            : 'vibing-blue-animated border-blue-400 shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] z-10'
                                        : 'bg-white/50 dark:bg-white/5 border-slate-100 dark:border-white/5 opacity-60 scale-[0.96] hover:opacity-100 transition-all duration-300'
                                    }`}
                            >
                                {isPlus && (
                                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-[clamp(0.45rem,1.5vw,0.55rem)] font-black tracking-[0.15em] uppercase transition-all duration-500 shadow-lg
                                        ${isSelected
                                            ? 'bg-black text-yellow-400 border border-yellow-400/30'
                                            : 'bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/30'
                                        }`}>
                                        <Zap size={8} className={isSelected ? 'fill-yellow-400 animate-pulse' : ''} />
                                        <span>{t('pro:subscription.upgrade.viral_badge')}</span>
                                    </div>
                                )}

                                <span className={`text-[clamp(0.55rem,2vw,0.7rem)] font-black tracking-[0.2em] uppercase leading-none ${isPlus ? 'mt-2' : ''} ${isSelected ? (isPlus ? 'text-[#0a1000]/50' : 'text-white/60') : 'text-slate-400 dark:text-white/30'}`}>
                                    {isPlus 
                                        ? (isStandardPro ? t('pro:subscription.upgrade.pro_plus_upgrade_title') : t('pro:subscription.upgrade.pro_plus_title'))
                                        : t('pro:subscription.upgrade.pro_title')
                                    }
                                </span>

                                <div className="flex flex-col items-center gap-1 mt-1">
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-label font-bold leading-none ${isSelected ? (isPlus ? 'text-[#0a1000]/40' : 'text-white/40') : 'text-slate-400/50'}`}>$</span>
                                        <span className={`text-[clamp(1.75rem,7vw,2.625rem)] font-black tracking-tighter leading-none ${isSelected ? (isPlus ? 'text-[#0a1000]' : 'text-white') : 'text-slate-900 dark:text-white/20'}`}>
                                            {isPlus ? (isStandardPro ? upgradePrice : proPlusPrice) : proPrice}
                                        </span>
                                    </div>
                                    <span className={`text-[clamp(0.55rem,2vw,0.7rem)] font-bold uppercase tracking-widest ${isSelected ? (isPlus ? 'text-[#0a1000]/40' : 'text-white/40') : 'text-slate-400/30'}`}>
                                        {t('pro:subscription.pro_active.lifetime')}
                                    </span>
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); setExpandedPlan(isExpanded ? null : plan.id); selection(); }}
                                    className={`mt-2 p-1 rounded-full transition-all ${isSelected ? (isPlus ? 'bg-[#0a1000]/10' : 'bg-white/10') : 'bg-slate-200 dark:bg-white/5'}`}
                                >
                                    <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} ${isSelected ? (isPlus ? 'text-[#0a1000]' : 'text-white') : 'text-slate-400'}`} />
                                </button>
                            </button>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        className="overflow-hidden"
                                    >
                                        <div className={`p-4 mt-1 rounded-2xl border-2 transition-all duration-500 ${isSelected 
                                            ? isPlus ? 'bg-yellow-400 border-yellow-300' : 'bg-blue-600 border-blue-400'
                                            : 'glass-panel-premium border-slate-100 dark:border-white/5'}`}>
                                            
                                            {isPlus && isSelected && (
                                                <div className="flex flex-row items-center justify-between gap-2 mb-4 pb-4 border-b border-black/10">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <Clock size={14} className="animate-pulse text-black" />
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-[clamp(0.45rem,1.5vw,0.55rem)] font-medium text-black/60 uppercase leading-none mb-1">{t('pro:subscription.pro_active.lifetime_access')}</span>
                                                            <span className="text-[clamp(0.5rem,1.8vw,0.6rem)] font-bold text-black uppercase leading-none">{t('marketing:income.math.cta_urgency', 'OFFER CLOSING')}</span>
                                                        </div>
                                                    </div>
                                                    <FomoTimer />
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <span className={`text-[clamp(0.55rem,2vw,0.7rem)] font-bold uppercase tracking-wider leading-none ${isSelected ? (isPlus ? 'text-[#0a1000]/50' : 'text-white/60') : 'text-slate-400'}`}>
                                                        {isPlus ? t('pro:subscription.plan_headline_plus') : t('pro:subscription.plan_headline')}
                                                    </span>
                                                    <p className={`text-[clamp(0.55rem,2vw,0.7rem)] font-medium leading-relaxed ${isSelected ? (isPlus ? 'text-[#0a1000]' : 'text-white') : 'text-slate-600 dark:text-white/70'}`}>
                                                        {isPlus ? t('pro:subscription.plan_desc_plus') : t('pro:subscription.plan_desc_pro')}
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-1 gap-2">
                                                    {(isPlus ? proPlusBenefits : proBenefits).map((benefit) => (
                                                        <div key={benefit.id} className={`flex items-start gap-2 p-2 rounded-lg ${isSelected ? (isPlus ? 'bg-black/5' : 'bg-white/10') : 'bg-slate-100 dark:bg-white/5'}`}>
                                                            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isSelected ? (isPlus ? 'bg-black/10 text-black' : 'bg-white/20 text-white') : 'bg-blue-500/10 text-blue-500'}`}>
                                                                <benefit.icon size={12} strokeWidth={2.5} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className={`text-[clamp(0.5rem,1.8vw,0.6rem)] font-bold uppercase tracking-wider ${isSelected ? (isPlus ? 'text-black/50' : 'text-white/50') : 'text-slate-400'}`}>{benefit.label}</span>
                                                                <span className={`text-[clamp(0.5rem,1.8vw,0.6rem)] font-medium leading-tight ${isSelected ? (isPlus ? 'text-black' : 'text-white') : 'text-slate-700 dark:text-white/80'}`}>{benefit.desc.split('.')[0]}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className={`pt-3 border-t ${isSelected ? (isPlus ? 'border-black/5' : 'border-white/10') : 'border-slate-100 dark:border-white/5'}`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Check size={12} className={isSelected ? (isPlus ? 'text-black' : 'text-white') : 'text-emerald-500'} strokeWidth={3} />
                                                        <span className={`text-[clamp(0.5rem,1.8vw,0.6rem)] font-black uppercase tracking-widest ${isSelected ? (isPlus ? 'text-black/50' : 'text-white/50') : 'text-slate-400'}`}>
                                                            {t('pro:subscription.benefits.full_access')}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        {(t(isPlus ? 'pro:subscription.upgrade.benefits_pro_plus' : 'pro:subscription.upgrade.benefits_pro', { returnObjects: true }) as string[]).map((b, i) => (
                                                            <div key={i} className="flex items-center gap-2">
                                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${isSelected ? (isPlus ? 'bg-[#0a1000]/10 text-[#0a1000]' : 'bg-white/10 text-white') : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                                    <Check size={8} strokeWidth={3} />
                                                                </div>
                                                                <span className={`text-[clamp(0.55rem,2vw,0.7rem)] font-bold uppercase tracking-tight ${isSelected ? (isPlus ? 'text-[#0a1000]' : 'text-white') : 'text-slate-700 dark:text-white/70'}`}>{b}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

SubscriptionPricing.displayName = 'SubscriptionPricing';
