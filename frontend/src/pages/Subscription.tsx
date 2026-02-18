import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Crown, CheckCircle2, Wallet, CreditCard, ChevronRight,
    Loader2, Sparkles, Zap, Rocket, Bot, ChevronDown, Trophy, Users,
    HelpCircle, Clock, BookOpen
} from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { useTonConnectUI, TonConnectButton } from '@tonconnect/ui-react';
import { useUser } from '../context/UserContext';
import { apiClient } from '../api/client';
import { useHaptic } from '../hooks/useHaptic';
import { useConfig } from '../context/ConfigContext';

export default function SubscriptionPage() {
    const { t } = useTranslation();
    const { user, refreshUser } = useUser();
    const { config: globalConfig } = useConfig();
    const { selection, notification, impact } = useHaptic();
    const [tonConnectUI] = useTonConnectUI();
    useEffect(() => { console.log("Subscription Page v1.7.3-premium-fix"); }, []);
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'TON' | 'CRYPTO' | null>(null);
    const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'manual_review'>('idle');
    const [manualHash, setManualHash] = useState('');
    const [sessionData, setSessionData] = useState<{ expires_at: string; transaction_id: number } | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<'PRO' | 'PRO_PLUS'>('PRO_PLUS');
    const [expandedFeature, setExpandedFeature] = useState<'TOKENS' | 'LEVELS' | null>(null);
    const [proStats, setProStats] = useState<{ sold: number; total: number } | null>(null);
    const [showPaymentOptionsForPro, setShowPaymentOptionsForPro] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await apiClient.get('/api/pro/stats');
                setProStats(res.data);
            } catch (e) {
                console.error("Failed to fetch pro stats", e);
            }
        };
        fetchStats();
    }, []);

    const liquidAnimation = {
        animate: {
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            transition: { duration: 15, repeat: Infinity, ease: "linear" }
        }
    };

    useEffect(() => {
        if (!sessionData?.expires_at) {
            setTimeLeft(null);
            return;
        }

        const interval = setInterval(() => {
            const expires = new Date(sessionData.expires_at).getTime();
            const now = new Date().getTime();
            const diff = Math.max(0, Math.floor((expires - now) / 1000));
            setTimeLeft(diff);

            if (diff === 0) {
                clearInterval(interval);
                setPaymentMethod(null);
                setSessionData(null);
                alert(t('subscription.alerts.expired'));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [sessionData, t]);

    const formattedTime = useMemo(() => {
        if (timeLeft === null) return null;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, [timeLeft]);

    const planPrice = selectedPlan === 'PRO_PLUS' ? 69 : 39;
    const adminUsdt = globalConfig?.admin_usdt_address || "TFp4oZV3fUkMgxiZV9d5SkJTHrA7NYoHCM";

    const handleTonPayment = async () => {
        if (!tonConnectUI.connected) {
            tonConnectUI.openModal();
            return;
        }

        setIsLoading(true);
        selection();

        try {
            const sessionRes = await apiClient.post('/api/payment/session', {
                amount: planPrice, currency: 'TON', network: 'TON'
            });

            const { amount, address } = sessionRes.data;

            const tx = {
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [
                    {
                        address: address,
                        amount: Math.ceil(amount * 10 ** 9).toString(),
                    }
                ]
            };

            const result = await tonConnectUI.sendTransaction(tx);
            const txHash = result.boc;

            setStatus('pending');
            const verifyRes = await apiClient.post('/api/payment/verify-ton', {
                tx_hash: txHash
            });

            if (verifyRes.data.status === 'success') {
                setStatus('success');
                notification('success');
                await refreshUser();
            } else {
                setStatus('manual_review');
            }

        } catch (error: any) {
            console.error('Payment failed:', error);
            setStatus('idle');
            notification('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualSubmit = async () => {
        if (!manualHash) return;
        setIsLoading(true);
        impact('heavy');
        try {
            await apiClient.post('/api/payment/submit-manual', {
                tx_hash: manualHash?.trim() || null,
                currency: 'USDT',
                network: 'TRC20',
                amount: planPrice
            });
            setStatus('manual_review');
            notification('success');
        } catch (error: any) {
            console.error('Manual submission error:', error);
            alert(`Submission failed: ${error.response?.data?.detail || 'Error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const paymentRef = React.useRef<HTMLDivElement>(null);

    const scrollToPayment = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        selection();
        paymentRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    if (user?.is_pro && !showPaymentOptionsForPro) {
        const isPlus = (user.subscription_plan?.includes('PLUS'));
        const isLifetime = !user.pro_expires_at || user.subscription_plan === 'PRO_LIFETIME';

        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center overflow-hidden">
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="relative mb-8"
                >
                    <div className={`absolute inset-0 blur-3xl opacity-30 animate-pulse ${isPlus ? 'bg-indigo-500' : 'bg-amber-400'}`} />
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl relative z-10 bg-linear-to-br ${isPlus ? 'from-indigo-400 via-blue-600 to-indigo-700' : 'from-amber-300 via-orange-500 to-amber-600'}`}>
                        <Crown size={48} className="text-white fill-white/20" />
                    </div>
                </motion.div>

                <h1 className="text-3xl font-black mb-4 tracking-tighter text-slate-900 dark:text-white uppercase leading-none">
                    {isPlus ? t('subscription.pro_active.title_plus') : t('subscription.pro_active.title')}
                </h1>

                <p className="text-slate-500 dark:text-slate-400 font-medium text-xs leading-relaxed max-w-[280px] mb-10">
                    {isPlus ? t('subscription.pro_active.desc_plus') : t('subscription.pro_active.desc')}
                </p>

                <div className="w-full space-y-3 max-w-xs">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Sparkles size={18} className={isPlus ? 'text-indigo-500' : 'text-amber-500'} />
                            <div className="text-left">
                                <p className="text-[10px] font-bold opacity-50 uppercase">{isPlus ? t('subscription.pro_active.plan_pro_plus') : (isLifetime ? 'PRO LIFETIME' : 'PRO MONTHLY')}</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white">
                                    {isLifetime ? t('subscription.pro_active.lifetime') : new Date(user.pro_expires_at!).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <CheckCircle2 size={18} className="text-emerald-500" />
                    </div>

                    {!isLifetime && (
                        <button
                            onClick={() => { selection(); setShowPaymentOptionsForPro(true); }}
                            className="w-full h-14 rounded-xl font-black text-indigo-600 dark:text-indigo-400 border-2 border-indigo-500/20 text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                        >
                            Extend Membership
                        </button>
                    )}

                    <button
                        onClick={() => { selection(); window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'pro' })); }}
                        className={`w-full h-14 rounded-xl font-black text-white text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all ${isPlus ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-amber-600 shadow-amber-500/20'}`}
                    >
                        {t('subscription.pro_active.command_center')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col px-4 pb-32 pt-2 max-w-lg mx-auto overflow-x-hidden">
            {/* Premium Floating Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6 relative"
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 w-64 h-64 bg-indigo-500/10 blur-[100px] -z-10" />

                <motion.div
                    animate={{
                        y: [0, -8, 0],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-block mb-3 pt-2"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse" />
                        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center shadow-2xl relative border border-white/20">
                            <Crown size={28} className="text-white fill-white/10" />
                        </div>
                    </div>
                </motion.div>

                <div className="flex flex-col items-center gap-1.5 mb-2">
                    <div className="px-2.5 py-0.5 rounded-full bg-slate-900/50 dark:bg-white/5 border border-white/10 backdrop-blur-md">
                        <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">
                            System: <span className="text-emerald-500">READY</span>
                        </span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none italic flex flex-col items-center">
                        <span className="opacity-40 text-sm tracking-normal not-italic lowercase">{t('subscription.upgrade.upgrade_to')}</span>
                        <span className="vibing-crystal-text text-4xl block w-full text-center px-4">PRO STATUS</span>
                    </h1>
                </div>

                <p className="text-slate-500 dark:text-slate-400 text-[8px] font-bold max-w-[240px] mx-auto leading-tight uppercase tracking-[0.15em] mb-4 text-center">
                    {t('subscription.upgrade.desc')}
                </p>

                <div className="flex flex-col items-center gap-2 mb-4 scale-90">
                    {proStats && (
                        <div className="w-full max-w-[220px] px-3 py-2 bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-xl backdrop-blur-md">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 dark:text-amber-400 opacity-80">LIFETIME SLOTS</span>
                                <span className="text-[9px] font-black text-slate-900 dark:text-white">{proStats.sold}/{proStats.total}</span>
                            </div>
                            <div className="h-1 w-full bg-slate-900/10 dark:bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-linear-to-r from-amber-400 to-orange-600"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(proStats.sold / proStats.total) * 100}%` }}
                                    transition={{ duration: 0.8 }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            <div className="p-1 bg-slate-100 dark:bg-white/5 rounded-2xl mb-4 relative flex shadow-inner">
                <motion.div
                    className="absolute inset-y-1 rounded-xl bg-white dark:bg-white/10 shadow-lg z-0"
                    initial={false}
                    animate={{
                        x: selectedPlan === 'PRO' ? 0 : '100%',
                        width: '50%'
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
                <button
                    onClick={() => { selection(); setSelectedPlan('PRO'); setExpandedFeature(null); }}
                    className={`flex-1 relative z-10 py-3 rounded-xl flex flex-col items-center justify-center transition-colors duration-200 ${selectedPlan === 'PRO' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}
                >
                    <span className="text-[8px] font-black uppercase tracking-widest mb-0.5">{t('subscription.upgrade.pro_title')}</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black">$39</span>
                        <span className="text-[8px] font-bold opacity-30 italic">{(proStats && proStats.sold >= proStats.total) ? '30D' : 'LIFE'}</span>
                    </div>
                </button>
                <button
                    onClick={() => { selection(); setSelectedPlan('PRO_PLUS'); setExpandedFeature(null); }}
                    className={`flex-1 relative z-10 py-3 rounded-xl flex flex-col items-center justify-center transition-colors duration-200 ${selectedPlan === 'PRO_PLUS' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}
                >
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-[7px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg">BEST</div>
                    <span className="text-[8px] font-black uppercase tracking-widest mb-0.5">{t('subscription.upgrade.pro_plus_title')}</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black">$69</span>
                        <span className="text-[8px] font-bold opacity-30 italic">LIFE</span>
                    </div>
                </button>
            </div>

            <div className="flex flex-col gap-3 mb-6">
                {/* TOKENS FEATURE (Marketer 24/7) */}
                <div className="relative">
                    {expandedFeature === 'TOKENS' && (
                        <div className="absolute -inset-1 bg-indigo-500/20 rounded-[1.8rem] blur-xl -z-10 animate-pulse" />
                    )}
                    <button
                        onClick={() => { selection(); setExpandedFeature(expandedFeature === 'TOKENS' ? null : 'TOKENS'); }}
                        className={`w-full text-left transition-all duration-100 overflow-hidden rounded-2xl border ${expandedFeature === 'TOKENS' ? 'border-white/20 bg-linear-to-br from-indigo-600 via-purple-600 to-indigo-800 shadow-xl' : (selectedPlan === 'PRO_PLUS' ? 'border-indigo-500/20 bg-linear-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 dark:bg-indigo-900/10 shadow-sm' : 'border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 shadow-sm')}`}
                    >
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${expandedFeature === 'TOKENS' ? 'bg-white/20 text-white' : 'bg-indigo-500/10 text-indigo-500'}`}>
                                    <Zap size={18} fill={expandedFeature === 'TOKENS' ? 'currentColor' : 'none'} />
                                </div>
                                <div>
                                    <p className={`text-[8px] font-black uppercase tracking-widest ${expandedFeature === 'TOKENS' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        {selectedPlan === 'PRO' ? '250 TOKENS' : '500 TOKENS'}
                                    </p>
                                    <h3 className={`text-sm font-black uppercase tracking-tight ${expandedFeature === 'TOKENS' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                        Viral Studio
                                    </h3>
                                </div>
                            </div>
                            <ChevronDown size={18} className={`transition-transform duration-200 ${expandedFeature === 'TOKENS' ? 'rotate-180 text-white' : 'text-slate-300'}`} />
                        </div>

                        <AnimatePresence initial={false}>
                            {expandedFeature === 'TOKENS' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.1, ease: "linear" }}
                                    className="overflow-hidden bg-black/20"
                                >
                                    <div className="px-5 pb-6 pt-2">
                                        <div className="h-px bg-white/10 mb-4" />
                                        <p className="text-[10px] text-white/70 italic leading-relaxed mb-4">
                                            {t(selectedPlan === 'PRO' ? 'subscription.upgrade.viral_studio_desc_pro' : 'subscription.upgrade.viral_studio_desc_pro_plus')}
                                        </p>
                                        <div className="grid grid-cols-1 gap-1 mb-6">
                                            {(t(selectedPlan === 'PRO' ? 'subscription.upgrade.benefits_pro' : 'subscription.upgrade.benefits_pro_plus', { returnObjects: true }) as string[]).map((benefit, idx) => (
                                                <div key={idx} className="flex items-center gap-2 py-1.5 px-3 bg-white/5 rounded-xl border border-white/5">
                                                    <CheckCircle2 size={10} className="text-indigo-400" />
                                                    <span className="text-[9px] font-bold text-white/90 uppercase">{benefit}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={scrollToPayment} className="w-full h-12 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                                            INITIALIZE STUDIO
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>

                {/* LEVELS FEATURE (Network Factory) */}
                <div className="relative">
                    {expandedFeature === 'LEVELS' && (
                        <div className="absolute -inset-1 bg-emerald-500/20 rounded-[1.8rem] blur-xl -z-10 animate-pulse" />
                    )}
                    <button
                        onClick={() => { selection(); setExpandedFeature(expandedFeature === 'LEVELS' ? null : 'LEVELS'); }}
                        className={`w-full text-left transition-all duration-100 overflow-hidden rounded-2xl border ${expandedFeature === 'LEVELS' ? 'border-white/20 bg-linear-to-br from-emerald-600/90 via-teal-700/90 to-slate-900/90 shadow-xl' : (selectedPlan === 'PRO_PLUS' ? 'border-emerald-500/20 bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 dark:bg-emerald-900/10 shadow-sm' : 'border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 shadow-sm')}`}
                    >
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${expandedFeature === 'LEVELS' ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                    <Users size={18} fill={expandedFeature === 'LEVELS' ? 'currentColor' : 'none'} />
                                </div>
                                <div className="text-left">
                                    <p className={`text-[8px] font-black uppercase tracking-widest ${expandedFeature === 'LEVELS' ? 'text-emerald-300' : 'text-slate-400'}`}>
                                        {selectedPlan === 'PRO' ? '9 LEVELS' : '20 LEVELS'}
                                    </p>
                                    <h3 className={`text-sm font-black uppercase tracking-tight ${expandedFeature === 'LEVELS' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                        Content Factory
                                    </h3>
                                </div>
                            </div>
                            <ChevronDown size={18} className={`transition-transform duration-200 ${expandedFeature === 'LEVELS' ? 'rotate-180 text-white' : 'text-slate-300'}`} />
                        </div>

                        <AnimatePresence initial={false}>
                            {expandedFeature === 'LEVELS' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.1, ease: "linear" }}
                                    className="overflow-hidden bg-black/20"
                                >
                                    <div className="px-5 pb-6 pt-2">
                                        <div className="h-px bg-white/10 mb-4" />
                                        <p className="text-[10px] text-white/70 italic leading-relaxed mb-4">
                                            {t(selectedPlan === 'PRO' ? 'subscription.upgrade.content_factory_desc_pro' : 'subscription.upgrade.content_factory_desc_pro_plus')}
                                        </p>
                                        <div className="grid grid-cols-1 gap-1 mb-6">
                                            {(t(selectedPlan === 'PRO' ? 'subscription.upgrade.benefits_pro' : 'subscription.upgrade.benefits_pro_plus', { returnObjects: true }) as string[]).map((benefit, idx) => (
                                                <div key={idx} className="flex items-center gap-2 py-1.5 px-3 bg-white/5 rounded-xl border border-white/5">
                                                    <CheckCircle2 size={10} className="text-emerald-400" />
                                                    <span className="text-[9px] font-bold text-white/90 uppercase">{benefit}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={scrollToPayment} className="w-full h-12 bg-white text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                                            DEPLOY FACTORY
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </div>

            {/* Payment Section */}
            <div ref={paymentRef} className="rounded-3xl p-6 shadow-2xl relative overflow-hidden transition-all duration-700 bg-slate-900 group">
                <motion.div
                    className={`absolute inset-0 -z-10 ${selectedPlan === 'PRO_PLUS' ? 'bg-linear-to-br from-indigo-600 via-fuchsia-600 to-indigo-800' : 'bg-linear-to-br from-slate-800 via-slate-900 to-black'}`}
                    animate={liquidAnimation.animate}
                />
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                    <Crown size={200} />
                </div>

                {!paymentMethod ? (
                    <div className="space-y-8 relative z-10">
                        <div className="text-center">
                            <h3 className="text-white/60 font-black text-[10px] uppercase tracking-[0.3em] mb-3">{t('subscription.upgrade.complete_payment')}</h3>
                            <div className="flex items-baseline justify-center gap-2">
                                <span className="text-white font-black text-5xl tracking-tighter">${planPrice}</span>
                                <span className="text-white/30 text-[11px] font-black uppercase tracking-widest">
                                    / {selectedPlan === 'PRO' ? ((proStats && proStats.sold >= proStats.total) ? 'Monthly' : 'Lifetime') : 'Lifetime'}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => { selection(); setPaymentMethod('TON'); }}
                                className="h-18 bg-white text-slate-900 rounded-2xl font-black text-[9px] flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-2xl hover:shadow-indigo-500/20 relative overflow-hidden group/btn"
                            >
                                <div className="absolute inset-0 bg-indigo-500/5 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-500" />
                                <Wallet size={20} className="text-indigo-600 relative z-10" />
                                <span className="relative z-10 tracking-widest">TON WALLET</span>
                            </button>
                            <button
                                onClick={() => { selection(); setPaymentMethod('CRYPTO'); }}
                                className="h-18 bg-white/10 text-white rounded-2xl font-black text-[9px] flex flex-col items-center justify-center gap-1 active:scale-95 border border-white/20 transition-all hover:bg-white/15 relative overflow-hidden group/btn"
                            >
                                <div className="absolute inset-0 bg-white/5 -translate-y-full group-hover/btn:translate-y-full transition-transform duration-500" />
                                <CreditCard size={20} className="text-white relative z-10" />
                                <span className="relative z-10 tracking-widest">USDT (TRC20)</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-center text-white">
                            <button onClick={() => { setPaymentMethod(null); setShowPaymentOptionsForPro(false); }} className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-1">
                                <ChevronRight size={14} className="rotate-180" /> {t('subscription.upgrade.change_method')}
                            </button>
                            {formattedTime && <span className="text-[10px] font-black font-mono bg-white/10 px-2 py-1 rounded-lg">{formattedTime}</span>}
                        </div>

                        {paymentMethod === 'TON' && (
                            <div className="space-y-4">
                                <div className="flex justify-center bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                                    <TonConnectButton />
                                </div>
                                <button
                                    disabled={isLoading}
                                    onClick={handleTonPayment}
                                    className="w-full h-14 bg-white text-indigo-600 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 size={24} className="animate-spin mx-auto" /> : t('subscription.upgrade.complete_payment')}
                                </button>
                            </div>
                        )}

                        {paymentMethod === 'CRYPTO' && (
                            <div className="space-y-4">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(adminUsdt);
                                        selection();
                                        notification('success');
                                    }}
                                    className="w-full text-left group"
                                >
                                    <div className="p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md group-active:scale-[0.98] transition-all">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-[8px] font-black uppercase tracking-wider text-white/50">USDT TRC20 ADDRESS</p>
                                            <span className="text-[8px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Tap to Copy</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-black/20 p-3 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">
                                            <code className="text-[10px] font-mono break-all text-white flex-1">{adminUsdt}</code>
                                            <CheckCircle2 size={12} className="text-emerald-500 opacity-0 group-active:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        selection();
                                        window.location.href = `tron:${adminUsdt}`;
                                    }}
                                    className="w-full h-12 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <Wallet size={16} />
                                    OPEN WALLET APP
                                </button>

                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="w-full border-t border-white/10"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-slate-900 px-2 text-[8px] font-black text-white/30 uppercase tracking-widest">THEN VERIFY</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <input
                                        value={manualHash}
                                        onChange={(e) => setManualHash(e.target.value)}
                                        placeholder="Paste Transaction Hash (TxID)"
                                        className="h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all text-center"
                                    />
                                    <button
                                        onClick={handleManualSubmit}
                                        disabled={isLoading || !manualHash}
                                        className="h-12 w-full bg-linear-to-r from-indigo-600 to-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all"
                                    >
                                        VERIFY TRANSACTION
                                    </button>
                                </div>
                                <p className="text-[9px] text-white/40 text-center font-medium leading-relaxed px-4">
                                    Funds must be sent via <span className="text-white font-bold">TRC20 Network</span>. <br />
                                    Transfer exactly <span className="text-white font-bold">${planPrice} USDT</span>.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal for Status */}
            <AnimatePresence>
                {status !== 'idle' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 w-full max-w-sm text-center shadow-2xl"
                        >
                            {status === 'pending' && <Loader2 size={64} className="text-amber-500 animate-spin mx-auto mb-6" />}
                            {status === 'success' && <Trophy size={64} className="text-emerald-500 mx-auto mb-6" />}
                            {status === 'manual_review' && <CheckCircle2 size={64} className="text-blue-500 mx-auto mb-6" />}

                            <h2 className="text-2xl font-black mb-2 text-slate-900 dark:text-white uppercase tracking-tighter">
                                {status === 'pending' ? t('subscription.status.verifying') : status === 'success' ? t('subscription.status.welcome_pro') : t('subscription.status.submitted')}
                            </h2>
                            <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
                                {status === 'pending' ? t('subscription.status.verifying_p') : status === 'success' ? t('subscription.status.welcome_pro_p') : t('subscription.status.submitted_p')}
                            </p>
                            <button onClick={() => setStatus('idle')} className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-600/20">{t('subscription.status.got_it')}</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Knowledge Base Teaser */}
            <div className="mt-10 px-2 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-500/5 border border-slate-500/10 mb-4">
                    <HelpCircle size={10} className="text-slate-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">FAQ</span>
                </div>

                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tighter">
                    Got <span className="text-indigo-500 text-2xl italic">Questions?</span>
                </h3>

                <div className="space-y-2 mb-6">
                    {[
                        { q: t('subscription.faq.q1', 'Is it really lifetime?'), icon: <Clock size={12} className="text-amber-500" /> },
                        { q: t('subscription.faq.q2', 'How do tokens work?'), icon: <Zap size={12} className="text-indigo-500" /> }
                    ].map((faq, i) => (
                        <button
                            key={i}
                            onClick={() => { selection(); window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'faq' })); }}
                            className="w-full p-4 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all"
                        >
                            <div className="flex items-center gap-3">
                                {faq.icon}
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 text-left uppercase tracking-tight">{faq.q}</span>
                            </div>
                            <ChevronRight size={14} className="text-slate-400 group-hover:text-indigo-500 transition-all" />
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => { selection(); window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'faq' })); }}
                    className="w-full h-12 bg-slate-900 dark:bg-white/5 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/5"
                >
                    <BookOpen size={14} />
                    View FAQ Center
                </button>

                <div className="mt-8 opacity-10 text-[7px] font-mono tracking-widest text-slate-500">
                    BUILD: 2026.02.18 | v1.7.3
                </div>
            </div>
        </div>
    );
}
