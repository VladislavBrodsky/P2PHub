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
    const [fluxCount, setFluxCount] = useState(124);

    useEffect(() => {
        const interval = setInterval(() => {
            setFluxCount(prev => prev + (Math.random() > 0.5 ? 1 : 0));
        }, 5000);
        return () => clearInterval(interval);
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
            {/* Premium Floating Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8 relative"
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 w-64 h-64 bg-indigo-500/10 blur-[100px] -z-10" />

                <motion.div
                    animate={{
                        y: [0, -8, 0],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-block mb-4 pt-4"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse" />
                        <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center shadow-2xl relative border border-white/20">
                            <Crown size={32} className="text-white fill-white/10" />
                        </div>
                    </div>
                </motion.div>

                <div className="flex flex-col items-center gap-2 mb-4">
                    <div className="px-4 py-1.5 rounded-full bg-slate-900 dark:bg-white/5 border border-white/10 backdrop-blur-md shadow-xl">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400">
                            System Status: <span className="text-emerald-500 animate-pulse">OPTIMIZED</span>
                        </span>
                    </div>
                </div>

                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter uppercase leading-[0.9] italic">
                    <Trans i18nKey="subscription.upgrade.title" components={{ 1: <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-500 to-fuchsia-500" /> }} />
                </h1>

                <p className="text-slate-600 dark:text-slate-400 text-xs font-medium max-w-[280px] mx-auto leading-relaxed opacity-80 mb-6">
                    {t('subscription.upgrade.desc')}
                </p>

                {/* Viral Flux Ticker */}
                <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="h-px flex-1 bg-linear-to-r from-transparent to-slate-200 dark:to-white/10" />
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
                        <div className="w-1 h-1 rounded-full bg-indigo-500 animate-ping" />
                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{fluxCount} NODES ACTIVE</span>
                    </div>
                    <div className="h-px flex-1 bg-linear-to-l from-transparent to-slate-200 dark:to-white/10" />
                </div>
            </motion.div>

            <div className="p-1 bg-slate-100 dark:bg-white/5 rounded-3xl mb-8 relative flex shadow-inner">
                <motion.div
                    className="absolute inset-y-1 rounded-2xl bg-white dark:bg-white/10 shadow-lg z-0"
                    initial={false}
                    animate={{
                        x: selectedPlan === 'PRO' ? 0 : '100%',
                        width: '50%'
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
                <button
                    onClick={() => { selection(); setSelectedPlan('PRO'); setExpandedFeature(null); }}
                    className={`flex-1 relative z-10 py-4 rounded-2xl flex flex-col items-center justify-center transition-colors duration-300 ${selectedPlan === 'PRO' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}
                >
                    <span className="text-[9px] font-black uppercase tracking-widest mb-0.5">{t('subscription.upgrade.pro_title')}</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black">$39</span>
                        <span className="text-[9px] font-bold opacity-30 italic">LIFE</span>
                    </div>
                </button>
                <button
                    onClick={() => { selection(); setSelectedPlan('PRO_PLUS'); setExpandedFeature(null); }}
                    className={`flex-1 relative z-10 py-4 rounded-2xl flex flex-col items-center justify-center transition-colors duration-300 ${selectedPlan === 'PRO_PLUS' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}
                >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-[8px] font-black text-white px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg animate-bounce">BEST VALUE</div>
                    <span className="text-[9px] font-black uppercase tracking-widest mb-0.5">{t('subscription.upgrade.pro_plus_title')}</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black">$69</span>
                        <span className="text-[9px] font-bold opacity-30 italic">LIFE</span>
                    </div>
                </button>
            </div>

            {/* Features Row - Dynamic Vibing Drops */}
            <div className="flex flex-col gap-3 mb-8">
                {/* TOKENS FEATURE (Marketer 24/7) */}
                <motion.div layout className="relative">
                    {expandedFeature === 'TOKENS' && (
                        <motion.div
                            layoutId="neon-glow-tokens"
                            className="absolute -inset-0.5 bg-linear-to-r from-indigo-500 to-fuchsia-500 rounded-3xl blur opacity-50 -z-10"
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />
                    )}
                    <button
                        onClick={() => { selection(); setExpandedFeature(expandedFeature === 'TOKENS' ? null : 'TOKENS'); }}
                        className={`w-full text-left transition-all duration-500 relative overflow-hidden rounded-3xl border ${expandedFeature === 'TOKENS' ? 'border-indigo-500/50 bg-slate-900 shadow-2xl' : 'border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 hover:border-indigo-500/20 shadow-sm'}`}
                    >
                        {expandedFeature === 'TOKENS' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-linear-to-br from-indigo-600/20 to-fuchsia-600/20 z-0"
                            />
                        )}
                        <div className="p-5 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${expandedFeature === 'TOKENS' ? 'bg-indigo-500 shadow-indigo-500/40 text-white' : 'bg-indigo-500/10 text-indigo-500'}`}>
                                    <Zap size={22} fill={expandedFeature === 'TOKENS' ? 'currentColor' : 'none'} />
                                </div>
                                <div>
                                    <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${expandedFeature === 'TOKENS' ? 'text-indigo-400' : 'text-slate-400'}`}>
                                        {selectedPlan === 'PRO' ? '250 TOKENS' : '500 TOKENS'}
                                    </p>
                                    <h3 className={`text-base font-black uppercase tracking-tight ${expandedFeature === 'TOKENS' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                        Viral Studio
                                    </h3>
                                </div>
                            </div>
                            <motion.div animate={{ rotate: expandedFeature === 'TOKENS' ? 180 : 0 }} className={expandedFeature === 'TOKENS' ? 'text-white' : 'text-slate-300'}>
                                <ChevronDown size={20} />
                            </motion.div>
                        </div>

                        <AnimatePresence mode="wait">
                            {expandedFeature === 'TOKENS' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ type: "spring", duration: 0.4, bounce: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-5 pb-6 relative z-10">
                                        <div className="h-px bg-white/10 mb-5" />
                                        <p className="text-[11px] font-medium text-white/70 leading-relaxed mb-6 italic">
                                            "Self-evolving neural studio for high-retention content synthesis."
                                        </p>

                                        <div className="grid grid-cols-1 gap-2.5 mb-6">
                                            {(t(selectedPlan === 'PRO' ? 'subscription.upgrade.benefits_pro_short' : 'subscription.upgrade.benefits_pro_plus_short', { returnObjects: true }) as string[]).map((item, idx) => (
                                                <motion.div
                                                    initial={{ x: -10, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    transition={{ delay: 0.05 * idx }}
                                                    key={idx}
                                                    className="flex items-center gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/5 backdrop-blur-md"
                                                >
                                                    <CheckCircle2 size={14} className="text-indigo-400 shrink-0" />
                                                    <span className="text-[10px] font-black text-white uppercase tracking-wide">{item}</span>
                                                </motion.div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={scrollToPayment}
                                            className="w-full h-14 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all relative overflow-hidden group/btn"
                                        >
                                            <span className="relative z-10">INITIALIZE STUDIO</span>
                                            <div className="absolute inset-0 bg-indigo-500 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500 opacity-10" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </motion.div>

                {/* LEVELS FEATURE (Autonomous Factory) */}
                <motion.div layout className="relative">
                    {expandedFeature === 'LEVELS' && (
                        <motion.div
                            layoutId="neon-glow-levels"
                            className="absolute -inset-0.5 bg-linear-to-r from-emerald-500 to-teal-500 rounded-3xl blur opacity-50 -z-10"
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                        />
                    )}
                    <button
                        onClick={() => { selection(); setExpandedFeature(expandedFeature === 'LEVELS' ? null : 'LEVELS'); }}
                        className={`w-full text-left transition-all duration-500 relative overflow-hidden rounded-3xl border ${expandedFeature === 'LEVELS' ? 'border-emerald-500/50 bg-slate-900 shadow-2xl' : 'border-slate-100 dark:border-white/5 bg-white dark:bg-white/5 hover:border-emerald-500/20 shadow-sm'}`}
                    >
                        {expandedFeature === 'LEVELS' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-linear-to-br from-emerald-600/20 to-teal-600/20 z-0"
                            />
                        )}
                        <div className="p-5 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${expandedFeature === 'LEVELS' ? 'bg-emerald-500 shadow-emerald-500/40 text-white' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                    <Users size={22} fill={expandedFeature === 'LEVELS' ? 'currentColor' : 'none'} />
                                </div>
                                <div>
                                    <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${expandedFeature === 'LEVELS' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                        {selectedPlan === 'PRO' ? '9 LEVELS' : '20 LEVELS'}
                                    </p>
                                    <h3 className={`text-base font-black uppercase tracking-tight ${expandedFeature === 'LEVELS' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                        Content Factory
                                    </h3>
                                </div>
                            </div>
                            <motion.div animate={{ rotate: expandedFeature === 'LEVELS' ? 180 : 0 }} className={expandedFeature === 'LEVELS' ? 'text-white' : 'text-slate-300'}>
                                <ChevronDown size={20} />
                            </motion.div>
                        </div>

                        <AnimatePresence mode="wait">
                            {expandedFeature === 'LEVELS' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ type: "spring", duration: 0.4, bounce: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-5 pb-6 relative z-10">
                                        <div className="h-px bg-white/10 mb-5" />
                                        <p className="text-[11px] font-medium text-white/70 leading-relaxed mb-6 italic">
                                            "Automated network expansion through AI agent deployment."
                                        </p>

                                        <div className="grid grid-cols-1 gap-2.5 mb-6">
                                            {(t(selectedPlan === 'PRO' ? 'subscription.upgrade.benefits_pro_short_levels' : 'subscription.upgrade.benefits_pro_plus_short_levels', { returnObjects: true }) as string[]).map((item, idx) => (
                                                <motion.div
                                                    initial={{ x: -10, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    transition={{ delay: 0.05 * idx }}
                                                    key={idx}
                                                    className="flex items-center gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/5 backdrop-blur-md"
                                                >
                                                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                                                    <span className="text-[10px] font-black text-white uppercase tracking-wide">{item}</span>
                                                </motion.div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={scrollToPayment}
                                            className="w-full h-14 bg-white text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all relative overflow-hidden group/btn"
                                        >
                                            <span className="relative z-10">DEPLOY FACTORY</span>
                                            <div className="absolute inset-0 bg-emerald-500 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500 opacity-10" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </motion.div>
            </div>

            {/* Price Cards - Key Benefits List (Modernized) */}
            <div className="mb-14 space-y-5">
                <div className="flex items-center justify-between px-2 mb-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 dark:text-white">{t('subscription.upgrade.benefits_title')}</h3>
                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${selectedPlan === 'PRO_PLUS' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                        {selectedPlan === 'PRO' ? 'PRO PLAN' : 'PRO+ EMPIRE'}
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {(t(selectedPlan === 'PRO' ? 'subscription.upgrade.benefits_pro' : 'subscription.upgrade.benefits_pro_plus', { returnObjects: true }) as string[]).map((benefit, idx) => {
                        const isXP = benefit.includes('XP');
                        const isPlus = selectedPlan === 'PRO_PLUS';
                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`p-4 rounded-2xl border flex items-center gap-3.5 transition-all duration-500 ${isPlus ? 'bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/10 shadow-sm' : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 shadow-sm'}`}
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border-2 ${isXP ? (isPlus ? 'bg-indigo-500 border-indigo-400 text-white shadow-xl shadow-indigo-500/30' : 'bg-emerald-500 border-emerald-400 text-white shadow-xl shadow-emerald-500/30') : (isPlus ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/10 text-emerald-500')}`}>
                                    <CheckCircle2 size={16} className={isXP ? 'animate-pulse' : ''} />
                                </div>
                                <span className={`text-[11px] leading-tight ${isXP ? 'font-black text-slate-900 dark:text-white uppercase tracking-tight' : 'font-bold text-slate-600 dark:text-slate-400'}`}>
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
                                <span className="relative z-10 tracking-widest">TON WALLET</span>
                            </button>
                            <button
                                onClick={() => { selection(); setPaymentMethod('CRYPTO'); }}
                                className="h-20 bg-white/10 text-white rounded-2xl font-black text-[10px] flex flex-col items-center justify-center gap-2 active:scale-95 border border-white/20 transition-all hover:bg-white/15 relative overflow-hidden group/btn"
                            >
                                <div className="absolute inset-0 bg-white/5 -translate-y-full group-hover/btn:translate-y-full transition-transform duration-500" />
                                <CreditCard size={22} className="text-white relative z-10" />
                                <span className="relative z-10 tracking-widest">USDT (TRC20)</span>
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
