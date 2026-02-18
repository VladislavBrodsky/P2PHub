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
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'TON' | 'CRYPTO' | null>(null);
    const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'manual_review'>('idle');
    const [manualHash, setManualHash] = useState('');
    const [sessionData, setSessionData] = useState<{ expires_at: string; transaction_id: number } | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<'PRO' | 'PRO_PLUS'>('PRO_PLUS');
    const [expandedFeature, setExpandedFeature] = useState<'TOKENS' | 'LEVELS' | null>(null);

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

    if (user?.is_pro) {
        const isPlus = (user.subscription_plan === 'PRO_PLUS_MONTHLY');
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
                                <p className="text-[10px] font-bold opacity-50 uppercase">{isPlus ? t('subscription.pro_active.plan_pro_plus') : t('subscription.pro_active.plan_pro')}</p>
                                <p className="text-sm font-black">{user.pro_expires_at ? new Date(user.pro_expires_at).toLocaleDateString() : t('subscription.pro_active.lifetime')}</p>
                            </div>
                        </div>
                        <CheckCircle2 size={18} className="text-emerald-500" />
                    </div>

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
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10 mb-6 mt-4">
                    <Crown size={12} className="text-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{t('subscription.upgrade.badge')}</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter uppercase leading-tight">
                    <Trans i18nKey="subscription.upgrade.title" components={{ 1: <span className="text-indigo-600 dark:text-indigo-400" /> }} />
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-xs font-medium max-w-[280px] mx-auto leading-relaxed opacity-70">
                    {t('subscription.upgrade.desc')}
                </p>

                {/* Limited Offer Counter */}
                <div className="mt-6 inline-flex flex-col items-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-widest mb-1">
                        {t('subscription.upgrade.limited_offer')}
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-32 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '49%' }}
                                className="h-full bg-amber-500"
                            />
                        </div>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            {t('subscription.upgrade.limited_count')}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Plan Toggle - Compact */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl mb-8 relative">
                <button
                    onClick={() => { selection(); setSelectedPlan('PRO'); setExpandedFeature(null); }}
                    className={`relative z-10 py-3.5 rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${selectedPlan === 'PRO' ? 'bg-white dark:bg-(--card-bg) shadow-lg' : 'opacity-50'}`}
                >
                    <span className="text-[9px] font-black uppercase tracking-wider opacity-60">{t('subscription.upgrade.pro_title')}</span>
                    <span className="text-xl font-black">$39</span>
                </button>
                <button
                    onClick={() => { selection(); setSelectedPlan('PRO_PLUS'); setExpandedFeature(null); }}
                    className={`relative z-10 py-3.5 rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${selectedPlan === 'PRO_PLUS' ? 'bg-white dark:bg-(--card-bg) shadow-lg ring-2 ring-indigo-500/60' : 'opacity-50'}`}
                >
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-[7px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg z-20">RECOMMENDED</div>
                    <span className="text-[9px] font-black uppercase tracking-wider opacity-60">{t('subscription.upgrade.pro_plus_title')}</span>
                    <span className="text-xl font-black">$69</span>
                </button>
            </div>

            {/* Features Row - Dynamic Vibing Drops */}
            <div className="flex flex-col gap-3 mb-8">
                {/* TOKENS FEATURE */}
                <div className="group">
                    <button
                        onClick={() => { selection(); setExpandedFeature(expandedFeature === 'TOKENS' ? null : 'TOKENS'); }}
                        className={`w-full text-left transition-all duration-300 relative overflow-hidden active:scale-[0.98] rounded-3xl border ${expandedFeature === 'TOKENS' ? 'border-indigo-500/50' : 'border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5'}`}
                    >
                        {selectedPlan === 'PRO_PLUS' && expandedFeature === 'TOKENS' && (
                            <motion.div
                                layoutId="tokens-bg"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-linear-to-br from-purple-600/90 via-fuchsia-600/90 to-indigo-700/90 -z-10"
                            />
                        )}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${expandedFeature === 'TOKENS' && selectedPlan === 'PRO_PLUS' ? 'bg-white/20' : 'bg-indigo-500/10'}`}>
                                    <Zap size={22} className={expandedFeature === 'TOKENS' && selectedPlan === 'PRO_PLUS' ? 'text-white' : 'text-indigo-500'} />
                                </div>
                                <div className="flex-1">
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${expandedFeature === 'TOKENS' && selectedPlan === 'PRO_PLUS' ? 'text-white/60' : 'text-slate-500'}`}>
                                        {t('subscription.upgrade.one_time')}
                                    </p>
                                    <p className={`text-base font-black uppercase leading-none mt-1 ${expandedFeature === 'TOKENS' && selectedPlan === 'PRO_PLUS' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                        {selectedPlan === 'PRO' ? t('subscription.upgrade.tokens_info_pro') : t('subscription.upgrade.tokens_info_pro_plus')}
                                    </p>
                                </div>
                            </div>
                            <motion.div animate={{ rotate: expandedFeature === 'TOKENS' ? 180 : 0 }} className={expandedFeature === 'TOKENS' && selectedPlan === 'PRO_PLUS' ? 'text-white' : 'text-slate-400'}>
                                <ChevronDown size={20} />
                            </motion.div>
                        </div>

                        <AnimatePresence>
                            {expandedFeature === 'TOKENS' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    {selectedPlan === 'PRO_PLUS' ? (
                                        <div className="px-5 pb-6 pt-2 relative">
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                                        <Rocket size={16} className="text-white" />
                                                    </div>
                                                    <h3 className="text-lg font-black text-white tracking-tight">Viral Studio</h3>
                                                </div>
                                                <p className="text-white/80 text-[11px] leading-relaxed mb-5 font-medium">
                                                    Generate 30 Days of Content in 30 Seconds. Get daily fresh viral topics and AI-generated hooks tailored to your audience.
                                                </p>
                                                <div className="space-y-2 mb-6">
                                                    {[
                                                        { label: "Reduce work time by 95%", t_key: "featured.reduction" },
                                                        { label: "AI Keyword Research", t_key: "featured.keywords" },
                                                        { label: "Instant FOMO & CTAs", t_key: "featured.fomo" }
                                                    ].map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-white text-[10px] font-bold">
                                                            <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center">
                                                                <CheckCircle2 size={10} className="text-emerald-400" />
                                                            </div>
                                                            {item.label}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 font-mono text-[10px] border border-white/10 mb-6 group-hover:bg-black/60 transition-colors">
                                                    <div className="text-fuchsia-400 opacity-80 mb-1 animate-pulse">{'>'} Generating viral thread...</div>
                                                    <div className="text-white/60 text-[9px]">{'>'} Analysis: 98% Confidence</div>
                                                </div>
                                                <button
                                                    onClick={scrollToPayment}
                                                    className="w-full h-11 bg-white text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl active:scale-95 transition-all"
                                                >
                                                    Activate Viral Studio
                                                </button>
                                            </div>
                                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full" />
                                        </div>
                                    ) : (
                                        <div className="px-5 pb-6 pt-2 space-y-4">
                                            <div className="p-4 bg-white dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                                                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                                                    Full access to all Studio tools with a monthly allowance of 250 AI tokens for unlimited creativity.
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                {benefits_pro_short.map((b, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                                        {b}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>

                {/* LEVELS FEATURE */}
                <div className="group">
                    <button
                        onClick={() => { selection(); setExpandedFeature(expandedFeature === 'LEVELS' ? null : 'LEVELS'); }}
                        className={`w-full text-left transition-all duration-300 relative overflow-hidden active:scale-[0.98] rounded-3xl border ${expandedFeature === 'LEVELS' ? 'border-emerald-500/50' : 'border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5'}`}
                    >
                        {selectedPlan === 'PRO_PLUS' && expandedFeature === 'LEVELS' && (
                            <motion.div
                                layoutId="levels-bg"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-linear-to-br from-emerald-600/90 via-teal-600/90 to-slate-900/90 -z-10"
                            />
                        )}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${expandedFeature === 'LEVELS' && selectedPlan === 'PRO_PLUS' ? 'bg-white/20' : 'bg-orange-500/10'}`}>
                                    <Users size={22} className={expandedFeature === 'LEVELS' && selectedPlan === 'PRO_PLUS' ? 'text-white' : 'text-orange-500'} />
                                </div>
                                <div className="flex-1">
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${expandedFeature === 'LEVELS' && selectedPlan === 'PRO_PLUS' ? 'text-white/60' : 'text-slate-500'}`}>
                                        {t('subscription.upgrade.lifetime_pro')}
                                    </p>
                                    <p className={`text-base font-black uppercase leading-none mt-1 ${expandedFeature === 'LEVELS' && selectedPlan === 'PRO_PLUS' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                        {selectedPlan === 'PRO' ? t('subscription.upgrade.levels_info_pro') : t('subscription.upgrade.levels_info_pro_plus')}
                                    </p>
                                </div>
                            </div>
                            <motion.div animate={{ rotate: expandedFeature === 'LEVELS' ? 180 : 0 }} className={expandedFeature === 'LEVELS' && selectedPlan === 'PRO_PLUS' ? 'text-white' : 'text-slate-400'}>
                                <ChevronDown size={20} />
                            </motion.div>
                        </div>

                        <AnimatePresence>
                            {expandedFeature === 'LEVELS' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    {selectedPlan === 'PRO_PLUS' ? (
                                        <div className="px-5 pb-6 pt-2 relative">
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                                        <Bot size={16} className="text-emerald-400" />
                                                    </div>
                                                    <h3 className="text-lg font-black text-white tracking-tight">Content Factory</h3>
                                                </div>
                                                <p className="text-white/80 text-[11px] leading-relaxed mb-5 font-medium">
                                                    Autonomous Agent that posts for you while you sleep. Your own full-stack SMM manager. Fully automated autoposting across all platforms.
                                                </p>
                                                <div className="space-y-2 mb-6">
                                                    {[
                                                        "10x Marketing Efficiency",
                                                        "24/7 Autopilot Mode",
                                                        "Multi-platform Sync"
                                                    ].map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-white text-[10px] font-bold">
                                                            <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center">
                                                                <CheckCircle2 size={10} className="text-emerald-400" />
                                                            </div>
                                                            {item}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="bg-black/60 backdrop-blur-md rounded-xl p-4 font-mono text-[10px] border border-white/5 mb-6">
                                                    <div className="text-emerald-400 opacity-80 mb-1">{'>'} Scheduling 42 posts...</div>
                                                    <div className="text-white/40 text-[9px] font-bold">{'>'} Status: ACTIVE</div>
                                                </div>
                                                <button
                                                    onClick={scrollToPayment}
                                                    className="w-full h-11 bg-transparent border border-white/30 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white hover:text-slate-900 transition-all active:scale-95 shadow-lg"
                                                >
                                                    Secure Your AI Agent
                                                </button>
                                            </div>
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />
                                        </div>
                                    ) : (
                                        <div className="px-5 pb-6 pt-2 space-y-4">
                                            <div className="p-4 bg-white dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                                                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                                                    Scale deep with 9 levels of passive commissions from every transaction in your network.
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                {benefits_pro_short_levels.map((b, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                                        {b}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </div>

            {/* Payment Section */}
            <div ref={paymentRef} className={`rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden transition-all duration-700 ${selectedPlan === 'PRO_PLUS' ? 'bg-indigo-600 scale-100' : 'bg-slate-900 scale-[0.98]'}`}>
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Crown size={180} />
                </div>

                {!paymentMethod ? (
                    <div className="space-y-6 relative z-10">
                        <div className="text-center">
                            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-2">{t('subscription.upgrade.complete_payment')}</h3>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-white font-black text-4xl tracking-tighter">${planPrice}</span>
                                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">/ Lifetime</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => { selection(); setPaymentMethod('TON'); }}
                                className="h-16 bg-white text-slate-900 rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-xl hover:bg-slate-50"
                            >
                                <Wallet size={20} className="text-indigo-600" />
                                TON WALLET
                            </button>
                            <button
                                onClick={() => { selection(); setPaymentMethod('CRYPTO'); }}
                                className="h-16 bg-white/10 text-white rounded-2xl font-black text-xs flex flex-col items-center justify-center gap-1 active:scale-95 border border-white/20 transition-all hover:bg-white/15"
                            >
                                <CreditCard size={20} className="text-white" />
                                USDT(TRC20)
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-center text-white">
                            <button onClick={() => setPaymentMethod(null)} className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-1">
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
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
                                    <p className="text-[8px] font-black uppercase tracking-wider text-white/50 mb-2">USDT TRC20 ADDRESS</p>
                                    <div className="flex items-center gap-2 bg-black/20 p-3 rounded-xl border border-white/5">
                                        <code className="text-[10px] font-mono break-all text-white flex-1">{adminUsdt}</code>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        value={manualHash}
                                        onChange={(e) => setManualHash(e.target.value)}
                                        placeholder="Paste Tx Hash"
                                        className="flex-1 h-12 bg-white/10 border border-white/20 rounded-xl px-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white transition-colors"
                                    />
                                    <button
                                        onClick={handleManualSubmit}
                                        disabled={isLoading || !manualHash}
                                        className="h-12 px-6 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-50"
                                    >
                                        SCANNED
                                    </button>
                                </div>
                                <p className="text-[9px] text-white/50 text-center uppercase tracking-widest font-bold">Transfer exactly ${planPrice} USDT</p>
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
            <div className="mt-16 px-2 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-500/5 border border-slate-500/10 mb-6">
                    <HelpCircle size={10} className="text-slate-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('faq.knowledge_base', 'Knowledge Base')}</span>
                </div>

                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 uppercase tracking-tighter">
                    Got <span className="text-indigo-500 text-2xl italic">Questions?</span>
                </h3>

                <div className="space-y-3 mb-8">
                    {[
                        { q: t('subscription.faq.q1', 'Is it really lifetime?'), icon: <Clock size={14} className="text-amber-500" /> },
                        { q: t('subscription.faq.q2', 'How do tokens work?'), icon: <Zap size={14} className="text-indigo-500" /> }
                    ].map((faq, i) => (
                        <button
                            key={i}
                            onClick={() => { selection(); window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'faq' })); }}
                            className="w-full p-5 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
                                    {faq.icon}
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 text-left">{faq.q}</span>
                            </div>
                            <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => { selection(); window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'faq' })); }}
                    className="w-full h-14 bg-slate-900 dark:bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/5"
                >
                    <BookOpen size={16} />
                    View Full FAQ Center
                </button>
            </div>
        </div>
    );
}

const benefits_pro_short = [
    "Viral Studio access",
    "X5 XP Speed",
    "Priority payouts",
    "VIP Support"
];

const benefits_pro_short_levels = [
    "9 levels of commissions",
    "Depth analytics",
    "Instant withdrawals",
    "Network security"
];
