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
            <div className="grid grid-cols-2 gap-3 px-1 items-stretch">
                {[
                    { id: 'PRO' as const, color: 'blue' },
                    { id: 'PRO_PLUS' as const, color: 'yellow' }
                ].map((plan) => {
                    const isSelected = selectedPlan === plan.id;
                    const isPlus = plan.id === 'PRO_PLUS';
                    const isExpanded = expandedPlan === plan.id;

                    return (
                        <div key={plan.id} className="flex flex-col h-full">
                            <button
                                onClick={() => { selection(); setSelectedPlan(plan.id); }}
                                className={`relative rounded-2xl p-4 flex flex-col items-center justify-between gap-2 border-2 text-center group w-full h-full transition-all duration-300
                                    ${isSelected
                                        ? isPlus
                                            ? 'vibing-yellow-animated border-yellow-400 shadow-[0_15px_30px_-10px_rgba(234,179,8,0.4)] z-10'
                                            : 'vibing-blue-animated border-blue-400 shadow-[0_15px_30px_-10px_rgba(37,99,235,0.4)] z-10'
                                        : 'bg-white/50 dark:bg-white/5 border-slate-100 dark:border-white/5 opacity-60 scale-[0.98] hover:opacity-100'
                                    }`}
                            >
                                {isPlus && (
                                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 flex items-center px-3 py-1 rounded-full text-[8px] font-black tracking-[0.15em] uppercase transition-all duration-500 shadow-lg whitespace-nowrap
                                        ${isSelected
                                            ? 'bg-black text-yellow-400 border border-yellow-400/30'
                                            : 'bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/30'
                                        }`}>
                                        <Zap size={7} className={`mr-1 ${isSelected ? 'fill-yellow-400 animate-pulse' : ''}`} />
                                        <span>{t('pro:subscription.upgrade.viral_badge')}</span>
                                    </div>
                                )}

                                <div className="flex flex-col items-center gap-1 w-full">
                                    <span className={`text-[10px] font-black tracking-[0.2em] uppercase leading-none ${isPlus ? 'mt-2' : ''} ${isSelected ? (isPlus ? 'text-[#0a1000]/50' : 'text-white/60') : 'text-slate-400 dark:text-white/30'}`}>
                                        {isPlus 
                                            ? (isStandardPro ? t('pro:subscription.upgrade.pro_plus_upgrade_title') : t('pro:subscription.upgrade.pro_plus_title'))
                                            : t('pro:subscription.upgrade.pro_title')
                                        }
                                    </span>

                                    <div className="flex flex-col items-center gap-0 mt-1">
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-[12px] font-bold leading-none ${isSelected ? (isPlus ? 'text-[#0a1000]/40' : 'text-white/40') : 'text-slate-400/50'}`}>$</span>
                                            <span className={`text-[clamp(1.5rem,6vw,2.25rem)] font-black tracking-tighter leading-none ${isSelected ? (isPlus ? 'text-[#0a1000]' : 'text-white') : 'text-slate-900 dark:text-white/20'}`}>
                                                {isPlus ? (isStandardPro ? upgradePrice : proPlusPrice) : proPrice}
                                            </span>
                                        </div>
                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${isSelected ? (isPlus ? 'text-[#0a1000]/40' : 'text-white/40') : 'text-slate-400/30'}`}>
                                            {t('pro:subscription.pro_active.lifetime')}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); setExpandedPlan(isExpanded ? null : plan.id); selection(); }}
                                    className={`mt-2 p-1.5 rounded-full transition-all active:scale-90 ${isSelected ? (isPlus ? 'bg-[#0a1000]/10' : 'bg-white/10') : 'bg-slate-200 dark:bg-white/5'}`}
                                >
                                    <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} ${isSelected ? (isPlus ? 'text-[#0a1000]' : 'text-white') : 'text-slate-400'}`} />
                                </button>
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* EXPANDED CONTENT - MOVED OUTSIDE GRID FOR FULL WIDTH */}
            <AnimatePresence mode="wait">
                {expandedPlan && (
                    <motion.div
                        key={expandedPlan}
                        initial={{ height: 0, opacity: 0, y: -10 }}
                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="overflow-hidden mt-4"
                    >
                        {(() => {
                            const isSelected = selectedPlan === expandedPlan;
                            const isPlus = expandedPlan === 'PRO_PLUS';
                            return (
                                <div className={`p-5 rounded-2xl border-2 transition-all duration-500 mx-1 ${isSelected 
                                    ? isPlus ? 'vibing-yellow-animated border-yellow-400/50' : 'vibing-blue-animated border-blue-400/50'
                                    : 'glass-panel-premium border-slate-100 dark:border-white/5'}`}>
                                    
                                    {isPlus && (
                                        <div className={`flex flex-row items-center justify-between gap-2 mb-5 pb-5 border-b ${isSelected ? 'border-black/10' : 'border-slate-100 dark:border-white/10'}`}>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-black/10 text-black' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                    <Clock size={16} strokeWidth={3} className="animate-pulse" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className={`text-[9px] font-medium uppercase tracking-widest leading-none mb-1 ${isSelected ? 'text-black/60' : 'text-slate-500'}`}>{t('pro:subscription.pro_active.lifetime_access')}</span>
                                                    <span className={`text-[11px] font-bold uppercase leading-none ${isSelected ? 'text-black' : 'text-slate-900 dark:text-white'}`}>{t('marketing:income.math.cta_urgency', 'OFFER CLOSING')}</span>
                                                </div>
                                            </div>
                                            <FomoTimer />
                                        </div>
                                    )}

                                    <div className="space-y-5">
                                        <div className="space-y-1.5 px-1">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] leading-none ${isSelected ? (isPlus ? 'text-[#0a1000]/50' : 'text-white/60') : 'text-slate-400'}`}>
                                                {isPlus ? t('pro:subscription.plan_headline_plus') : t('pro:subscription.plan_headline')}
                                            </span>
                                            <p className={`text-[clamp(0.75rem,3.5vw,0.875rem)] font-bold leading-relaxed ${isSelected ? (isPlus ? 'text-[#0a1000]' : 'text-white') : 'text-slate-700 dark:text-white/80'}`}>
                                                {isPlus ? t('pro:subscription.plan_desc_plus') : t('pro:subscription.plan_desc_pro')}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2.5">
                                            {(isPlus ? proPlusBenefits : proBenefits).map((benefit) => (
                                                <div key={benefit.id} className={`flex items-start gap-3 p-3 rounded-xl transition-all ${isSelected ? (isPlus ? 'bg-black/5 hover:bg-black/10' : 'bg-white/10 hover:bg-white/15') : 'bg-slate-50 dark:bg-white/5'}`}>
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${isSelected ? (isPlus ? 'bg-black/10 text-black' : 'bg-white/20 text-white') : 'bg-blue-500/10 text-blue-500'}`}>
                                                        <benefit.icon size={14} strokeWidth={2.5} />
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? (isPlus ? 'text-black/50' : 'text-white/50') : 'text-slate-400'}`}>{benefit.label}</span>
                                                        <span className={`text-[11px] font-bold leading-snug ${isSelected ? (isPlus ? 'text-black' : 'text-white') : 'text-slate-800 dark:text-white/90'}`}>{benefit.desc.split('.')[0]}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

SubscriptionPricing.displayName = 'SubscriptionPricing';
