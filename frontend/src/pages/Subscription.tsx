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
            {/* Plan Toggle - Compact (Modernized) */}
            <div className="grid grid-cols-2 gap-3 p-2 bg-slate-100 dark:bg-white/5 rounded-3xl mb-10 relative">
                <button
                    onClick={() => { selection(); setSelectedPlan('PRO'); setExpandedFeature(null); }}
                    className={`relative z-10 py-4 px-2 rounded-2xl flex flex-col items-center justify-center transition-all duration-500 overflow-hidden ${selectedPlan === 'PRO' ? 'text-white' : 'text-slate-500 dark:text-slate-400 opacity-60'}`}
                >
                    {selectedPlan === 'PRO' && (
                        <motion.div
                            layoutId="active-plan-bg"
                            className="absolute inset-0 bg-linear-to-br from-indigo-500 via-indigo-600 to-indigo-800 -z-10"
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: 1,
                                backgroundSize: "200% 200%",
                                ...liquidAnimation.animate
                            }}
                        />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest mb-1">{t('subscription.upgrade.pro_title')}</span>
                    <span className="text-2xl font-black">$39</span>
                </button>
                <button
                    onClick={() => { selection(); setSelectedPlan('PRO_PLUS'); setExpandedFeature(null); }}
                    className={`relative z-10 py-4 px-2 rounded-2xl flex flex-col items-center justify-center transition-all duration-500 overflow-hidden ${selectedPlan === 'PRO_PLUS' ? 'text-white' : 'text-slate-500 dark:text-slate-400 opacity-60'}`}
                >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-amber-500 text-[8px] font-black text-white px-2.5 py-1 rounded-full uppercase tracking-tight shadow-xl z-20 whitespace-nowrap border border-white/20">RECOMMENDED</div>
                    {selectedPlan === 'PRO_PLUS' && (
                        <motion.div
                            layoutId="active-plan-bg"
                            className="absolute inset-0 bg-linear-to-r from-indigo-600 via-fuchsia-600 to-indigo-700 -z-10"
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: 1,
                                backgroundSize: "200% 200%",
                                ...liquidAnimation.animate
                            }}
                        />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest mb-1">{t('subscription.upgrade.pro_plus_title')}</span>
                    <span className="text-2xl font-black">$69</span>
                </button>
            </div>

            {/* Features Row - Dynamic Vibing Drops */}
            <div className="flex flex-col gap-3 mb-8">
                {/* TOKENS FEATURE (Marketer 24/7) */}
                <div className="group">
                    <button
                        onClick={() => { selection(); setExpandedFeature(expandedFeature === 'TOKENS' ? null : 'TOKENS'); }}
                        className={`w-full text-left transition-all duration-700 relative overflow-hidden active:scale-[0.98] rounded-[2rem] border-2 ${expandedFeature === 'TOKENS' ? (selectedPlan === 'PRO_PLUS' ? 'border-indigo-500/40 shadow-2xl shadow-indigo-500/20' : 'border-indigo-400/40 shadow-xl') : 'border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:border-indigo-500/20'}`}
                    >
                        {expandedFeature === 'TOKENS' && (
                            <motion.div
                                layoutId="tokens-bg"
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: 1,
                                    backgroundSize: "200% 200%",
                                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                                }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className={`absolute inset-0 -z-10 ${selectedPlan === 'PRO_PLUS' ? 'bg-linear-to-br from-indigo-600 via-fuchsia-600 to-indigo-700' : 'bg-linear-to-br from-indigo-500/90 via-blue-600/90 to-indigo-700/90'}`}
                            />
                        )}
                        <div className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${expandedFeature === 'TOKENS' ? 'bg-white/20' : 'bg-indigo-500/10 dark:bg-indigo-500/20'}`}>
                                    <Zap size={22} className={expandedFeature === 'TOKENS' ? 'text-white' : 'text-indigo-500'} />
                                </div>
                                <div className="flex-1">
                                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${expandedFeature === 'TOKENS' ? 'text-white/70' : 'text-indigo-500 dark:text-indigo-400'}`}>
                                        {selectedPlan === 'PRO' ? t('subscription.upgrade.tokens_info_pro') : t('subscription.upgrade.tokens_info_pro_plus')}
                                    </p>
                                    <p className={`text-[15px] font-black uppercase leading-none mt-1.5 ${expandedFeature === 'TOKENS' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                        {t('subscription.upgrade.tokens_btn_name')}
                                    </p>
                                </div>
                            </div>
                            <motion.div animate={{ rotate: expandedFeature === 'TOKENS' ? 180 : 0 }} className={expandedFeature === 'TOKENS' ? 'text-white' : 'text-slate-400'}>
                                <ChevronDown size={20} />
                            </motion.div>
                        </div>

                        <AnimatePresence>
                            {expandedFeature === 'TOKENS' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden bg-white/5 backdrop-blur-sm"
                                >
                                    <div className="px-6 pb-8 pt-2">
                                        <div className="h-px w-full bg-white/10 mb-6" />
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-5">
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/20 shadow-lg backdrop-blur-md">
                                                    <Rocket size={18} className="text-white" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <h3 className="text-lg font-black tracking-tight text-white uppercase italic">Viral Studio</h3>
                                                    <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Neural Synthesis Active</span>
                                                </div>
                                            </div>

                                            <p className="text-xs leading-relaxed mb-6 font-medium text-white/90 bg-black/20 p-4 rounded-2xl border border-white/5">
                                                {t('faq.pro_promo.desc')}
                                            </p>

                                            <div className="grid grid-cols-1 gap-3 mb-8">
                                                {(t(selectedPlan === 'PRO' ? 'subscription.upgrade.benefits_pro_short' : 'subscription.upgrade.benefits_pro_plus_short', { returnObjects: true }) as string[]).map((item, idx) => {
                                                    return (
                                                        <motion.div
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.3 + (idx * 0.1) }}
                                                            key={idx}
                                                            className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5"
                                                        >
                                                            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-white text-indigo-600 shadow-lg">
                                                                <CheckCircle2 size={12} />
                                                            </div>
                                                            <span className="text-[11px] font-black text-white uppercase tracking-wide">
                                                                {item}
                                                            </span>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>

                                            <div className="backdrop-blur-xl rounded-2xl p-4 font-mono text-[10px] border bg-black/40 border-white/10 mb-8 relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                                <div className="text-fuchsia-400 opacity-90 mb-1.5 flex items-center gap-2">
                                                    <span className="animate-pulse">●</span>
                                                    <span>{'>'} Generating viral thread...</span>
                                                </div>
                                                <div className="text-white/60 text-[9px] flex items-center justify-between">
                                                    <span>{'>'} Analysis: 98% Confidence</span>
                                                    <span className="text-[8px] opacity-40">NODE_04 active</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={scrollToPayment}
                                                className="w-full h-14 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl active:scale-95 transition-all bg-white text-indigo-600 hover:bg-slate-50 relative overflow-hidden group"
                                            >
                                                <span className="relative z-10">{t('faq.pro_promo.cta')}</span>
                                                <div className="absolute inset-0 bg-linear-to-r from-transparent via-indigo-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>

                {/* LEVELS FEATURE (Autonomous Factory) */}
                <div className="group">
                    <button
                        onClick={() => { selection(); setExpandedFeature(expandedFeature === 'LEVELS' ? null : 'LEVELS'); }}
                        className={`w-full text-left transition-all duration-700 relative overflow-hidden active:scale-[0.98] rounded-[2rem] border-2 ${expandedFeature === 'LEVELS' ? (selectedPlan === 'PRO_PLUS' ? 'border-emerald-500/40 shadow-2xl shadow-emerald-500/20' : 'border-emerald-400/40 shadow-xl') : 'border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:border-emerald-500/20'}`}
                    >
                        {expandedFeature === 'LEVELS' && (
                            <motion.div
                                layoutId="levels-bg"
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: 1,
                                    backgroundSize: "200% 200%",
                                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                                }}
                                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                                className={`absolute inset-0 -z-10 ${selectedPlan === 'PRO_PLUS' ? 'bg-linear-to-br from-emerald-600 via-teal-600 to-slate-900' : 'bg-linear-to-br from-emerald-500/90 via-teal-600/90 to-emerald-800/90'}`}
                            />
                        )}
                        <div className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${expandedFeature === 'LEVELS' ? 'bg-white/20' : 'bg-orange-500/10 dark:bg-emerald-500/20'}`}>
                                    <Users size={22} className={expandedFeature === 'LEVELS' ? 'text-white' : 'text-orange-500 dark:text-emerald-500'} />
                                </div>
                                <div className="flex-1">
                                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${expandedFeature === 'LEVELS' ? 'text-white/70' : 'text-orange-600 dark:text-emerald-400'}`}>
                                        {selectedPlan === 'PRO' ? t('subscription.upgrade.levels_info_pro') : t('subscription.upgrade.levels_info_pro_plus')}
                                    </p>
                                    <p className={`text-[15px] font-black uppercase leading-none mt-1.5 ${expandedFeature === 'LEVELS' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                        {t('subscription.upgrade.content_factory_btn_name')}
                                    </p>
                                </div>
                            </div>
                            <motion.div animate={{ rotate: expandedFeature === 'LEVELS' ? 180 : 0 }} className={expandedFeature === 'LEVELS' ? 'text-white' : 'text-slate-400'}>
                                <ChevronDown size={20} />
                            </motion.div>
                        </div>

                        <AnimatePresence>
                            {expandedFeature === 'LEVELS' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden bg-white/5 backdrop-blur-sm"
                                >
                                    <div className="px-6 pb-8 pt-2">
                                        <div className="h-px w-full bg-white/10 mb-6" />
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-5">
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/20 shadow-lg backdrop-blur-md">
                                                    <Bot size={18} className="text-white" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <h3 className="text-lg font-black tracking-tight text-white uppercase italic">Content Autopilot</h3>
                                                    <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Network Growth Node</span>
                                                </div>
                                            </div>

                                            <p className="text-xs leading-relaxed mb-6 font-medium text-white/90 bg-black/20 p-4 rounded-2xl border border-white/5">
                                                {t('faq.questions.8.a')}
                                            </p>

                                            <div className="grid grid-cols-1 gap-3 mb-8">
                                                {(t(selectedPlan === 'PRO' ? 'subscription.upgrade.benefits_pro_short_levels' : 'subscription.upgrade.benefits_pro_plus_short_levels', { returnObjects: true }) as string[]).map((item, idx) => {
                                                    return (
                                                        <motion.div
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.3 + (idx * 0.1) }}
                                                            key={idx}
                                                            className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5"
                                                        >
                                                            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-white text-emerald-600 shadow-lg">
                                                                <CheckCircle2 size={12} />
                                                            </div>
                                                            <span className="text-[11px] font-black text-white uppercase tracking-wide">
                                                                {item}
                                                            </span>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>

                                            <div className="backdrop-blur-xl rounded-2xl p-4 font-mono text-[10px] border bg-black/40 border-white/10 mb-8 relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                                <div className="text-emerald-400 opacity-90 mb-1.5 flex items-center gap-2">
                                                    <span className="animate-pulse">●</span>
                                                    <span>{'>'} Scheduling 42 posts...</span>
                                                </div>
                                                <div className="text-white/60 text-[9px] flex items-center justify-between">
                                                    <span>{'>'} Status: DEPLOYING AI AGENT</span>
                                                    <span className="text-[8px] opacity-40">SYNC_SUCCESS</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={scrollToPayment}
                                                className="w-full h-14 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl active:scale-95 transition-all bg-emerald-500 text-white hover:bg-emerald-400 relative overflow-hidden group border border-white/20"
                                            >
                                                <span className="relative z-10">Activate Growth Protocol</span>
                                                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </div>

            {/* Price Cards - Key Benefits List (Modernized) */}
            <div className="mb-14 space-y-5">
                <div className="flex items-center justify-between px-2 mb-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 dark:text-white">{t('subscription.upgrade.benefits_title')}</h3>
                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${selectedPlan === 'PRO_PLUS' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                        {selectedPlan === 'PRO' ? 'PRO PLAN' : 'PRO+ EMPIRE'}
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-3.5">
                    {(t(selectedPlan === 'PRO' ? 'subscription.upgrade.benefits_pro' : 'subscription.upgrade.benefits_pro_plus', { returnObjects: true }) as string[]).map((benefit, idx) => {
                        const isXP = benefit.includes('XP');
                        const isPlus = selectedPlan === 'PRO_PLUS';
                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.08 }}
                                className={`p-4.5 rounded-3xl border flex items-center gap-4 transition-all duration-500 ${isPlus ? 'bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/10 shadow-sm' : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 shadow-sm'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 ${isXP ? (isPlus ? 'bg-indigo-500 border-indigo-400 text-white shadow-xl shadow-indigo-500/30' : 'bg-emerald-500 border-emerald-400 text-white shadow-xl shadow-emerald-500/30') : (isPlus ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/10 text-emerald-500')}`}>
                                    <CheckCircle2 size={18} className={isXP ? 'animate-pulse' : ''} />
                                </div>
                                <span className={`text-xs leading-tight ${isXP ? 'font-black text-slate-900 dark:text-white uppercase tracking-tight' : 'font-bold text-slate-600 dark:text-slate-400'}`}>
                                    {benefit}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Payment Section */}
            <div ref={paymentRef} className="rounded-[3rem] p-8 shadow-2xl relative overflow-hidden transition-all duration-700 bg-slate-900 group">
                {/* Liquid Background for Payment Section */}
                <motion.div
                    className={`absolute inset-0 -z-10 ${selectedPlan === 'PRO_PLUS' ? 'bg-linear-to-br from-indigo-600 via-fuchsia-600 to-indigo-800' : 'bg-linear-to-br from-slate-800 via-slate-900 to-black'}`}
                    animate={{
                        backgroundSize: "200% 200%",
                        ...liquidAnimation.animate
                    }}
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
                                <span className="text-white/30 text-[11px] font-black uppercase tracking-widest">/ Lifetime</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => { selection(); setPaymentMethod('TON'); }}
                                className="h-20 bg-white text-slate-900 rounded-2xl font-black text-[10px] flex flex-col items-center justify-center gap-2 active:scale-95 transition-all shadow-2xl hover:shadow-indigo-500/20 relative overflow-hidden group/btn"
                            >
                                <div className="absolute inset-0 bg-indigo-500/5 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-500" />
                                <Wallet size={22} className="text-indigo-600 relative z-10" />
                                <span className="relative z-10 tracking-[0.1em]">TON WALLET</span>
                            </button>
                            <button
                                onClick={() => { selection(); setPaymentMethod('CRYPTO'); }}
                                className="h-20 bg-white/10 text-white rounded-2xl font-black text-[10px] flex flex-col items-center justify-center gap-2 active:scale-95 border border-white/20 transition-all hover:bg-white/15 relative overflow-hidden group/btn"
                            >
                                <div className="absolute inset-0 bg-white/5 -translate-y-full group-hover/btn:translate-y-full transition-transform duration-500" />
                                <CreditCard size={22} className="text-white relative z-10" />
                                <span className="relative z-10 tracking-[0.1em]">USDT (TRC20)</span>
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
