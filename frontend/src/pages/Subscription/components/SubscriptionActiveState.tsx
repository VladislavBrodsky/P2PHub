import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, Trophy, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '../../../utils/routes';

interface SubscriptionActiveStateProps {
    user: any;
    t: any;
    selection: () => void;
    navigateTo: (route: string) => void;
    setSelectedPlan: (plan: 'PRO' | 'PRO_PLUS') => void;
    setShowPaymentOptionsForPro: (show: boolean) => void;
    scrollToPayment: (e?: React.MouseEvent) => void;
}

export const SubscriptionActiveState = ({
    user,
    t,
    selection,
    navigateTo,
    setSelectedPlan,
    setShowPaymentOptionsForPro,
    scrollToPayment
}: SubscriptionActiveStateProps) => {
    const isProPlus = (user?.subscription_plan || "").includes('PLUS');

    return (
        <motion.div
            key="active-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
        >
            <div
                className={`flex flex-col items-center min-h-dvh w-full px-6 pb-32 pt-[calc(var(--header-total-offset,138px)+1rem)] text-center relative overflow-hidden font-sans`}
            >
                <div className="w-full flex items-center justify-center mb-8 relative z-20">
                    <span className="text-label font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-white/30">{t('pro:subscription.pro_active.title')}</span>
                </div>

                <div className={`absolute inset-0 w-full h-full pointer-events-none z-0 bg-bg-app`} />
                <div className={`fixed inset-0 w-full h-full pointer-events-none z-0 ${isProPlus ? 'bg-linear-to-b from-bg-app via-indigo-500/10 to-bg-deep' : 'bg-linear-to-b from-bg-app via-amber-500/8 to-bg-deep'}`} />

                <div className="relative z-10 w-full max-w-[300px] mx-auto flex flex-col items-center">
                    <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} className="relative mb-5 pt-1">
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-md bg-linear-to-br ${isProPlus ? 'from-yellow-300 via-yellow-400 to-orange-500' : 'from-blue-400 via-blue-600 to-blue-900'}`}>
                            <Crown size={32} className="text-white fill-white/20 drop-shadow-md" />
                        </div>
                    </motion.div>

                    <h1 className="text-[clamp(1.75rem,8vw,2.5rem)] font-black mb-2 tracking-tighter text-slate-900 dark:text-white leading-tight text-center max-w-[280px]">
                        {isProPlus ? t('pro:subscription.pro_active.title_plus') : t('pro:subscription.pro_active.title')}
                    </h1>

                    <p className="text-slate-500 dark:text-slate-400 text-body font-medium max-w-[260px] mx-auto leading-relaxed mb-8">
                        {isProPlus ? t('pro:subscription.pro_active.desc_plus') : t('pro:subscription.pro_active.desc')}
                    </p>

                    <div className="w-full space-y-3">
                        <div className="p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl flex items-center justify-between shadow-[0_15px_30px_-10px_rgba(0,0,0,0.4)]">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-[0.75rem] flex items-center justify-center bg-white/5 border border-white/10 shadow-inner shrink-0 ${isProPlus ? 'text-yellow-600' : 'text-blue-400'}`}>
                                    <Sparkles size={16} />
                                </div>
                                <div className="text-left">
                                    <p className="text-label font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest mb-0.5 whitespace-nowrap">{t('pro:subscription.pro_active.lifetime')}</p>
                                    <p className="text-caption font-bold text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                                        {(!user?.pro_expires_at || user?.subscription_plan === 'PRO_LIFETIME')
                                            ? t('pro:subscription.pro_active.lifetime_access')
                                            : new Date(user.pro_expires_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-md">
                                <CheckCircle2 size={14} className="text-emerald-400" />
                            </div>
                        </div>

                        <button
                            onClick={() => { selection(); navigateTo(ROUTES.PRO); }}
                            className={`w-full h-11 rounded-full font-bold text-label tracking-widest uppercase shadow-[0_15px_30px_-5px_rgba(0,102,255,0.3)] flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:brightness-110 overflow-hidden ${isProPlus ? 'vibing-yellow-animated text-[#0a1000]' : 'vibing-blue-animated text-white'}`}
                        >
                            <Trophy size={13} />
                            {t('pro:subscription.pro_active.command_center')}
                        </button>

                        {!isProPlus && (
                            <button
                                onClick={() => {
                                    selection();
                                    setSelectedPlan('PRO_PLUS');
                                    setShowPaymentOptionsForPro(true);
                                    scrollToPayment();
                                }}
                                className="w-full h-12 bg-black/40 backdrop-blur-xl border border-yellow-500/50 text-yellow-500 hover:text-yellow-400 hover:border-yellow-400 rounded-full font-bold text-caption tracking-widest uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm mt-2"
                            >
                                <Sparkles size={14} fill="currentColor" />
                                {t('pro:subscription.upgrade.pro_plus_upgrade_title')}
                            </button>
                        )}

                        {(!user?.pro_expires_at || user?.subscription_plan === 'PRO_LIFETIME') === false && (
                            <button onClick={() => setShowPaymentOptionsForPro(true)} className="text-label font-bold text-white/40 uppercase tracking-widest hover:text-white transition-colors block mx-auto mt-6">
                                {t('pro:subscription.upgrade.extend_membership')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
