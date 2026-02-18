import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Crown, CheckCircle2, Wallet, CreditCard, ChevronRight,
    Loader2, Sparkles, Zap, ChevronDown, Trophy, Users,
    HelpCircle, Clock, BookOpen
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
            <div className="flex flex-col items-center justify-center min-h-[85vh] px-8 text-center overflow-hidden relative">
                {/* Background Vibing Effects */}
                <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] blur-[150px] opacity-20 -z-10 animate-pulse ${isPlus ? 'bg-indigo-600' : 'bg-amber-500'}`} />
                <div className="absolute top-0 inset-x-0 h-64 bg-linear-to-b from-indigo-500/5 to-transparent -z-10" />

                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="relative mb-12"
                >
                    <div className={`absolute inset-0 blur-3xl opacity-40 animate-pulse ${isPlus ? 'bg-indigo-500 shadow-[0_0_100px_rgba(99,102,241,0.5)]' : 'bg-amber-400 shadow-[0_0_100px_rgba(245,158,11,0.5)]'}`} />
                    <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative z-10 border border-white/30 backdrop-blur-sm bg-linear-to-br ${isPlus ? 'from-indigo-400 via-blue-600 to-indigo-800' : 'from-amber-300 via-orange-500 to-amber-700'}`}>
                        <Crown size={56} className="text-white fill-white/20 drop-shadow-lg" />
                    </div>
                    {/* Floating Orbs */}
                    <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 4, repeat: Infinity }} className={`absolute -top-4 -right-4 w-8 h-8 rounded-full blur-xl ${isPlus ? 'bg-indigo-400' : 'bg-amber-400'} opacity-60`} />
                    <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} className={`absolute -bottom-4 -left-4 w-10 h-10 rounded-full blur-xl ${isPlus ? 'bg-blue-400' : 'bg-orange-400'} opacity-60`} />
                </motion.div>

                <h1 className="text-4xl font-black mb-4 tracking-tighter text-slate-900 dark:text-white uppercase leading-tight italic">
                    <span className={isPlus ? 'vibing-crystal-text text-5xl' : 'text-amber-500 text-5xl'}>
                        {isPlus ? t('subscription.pro_active.title_plus') : t('subscription.pro_active.title')}
                    </span>
                </h1>

                <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] leading-relaxed max-w-[280px] mb-12 uppercase tracking-[0.2em] opacity-70">
                    {isPlus ? t('subscription.pro_active.desc_plus') : t('subscription.pro_active.desc')}
                </p>

                <div className="w-full space-y-4 max-w-[320px] relative">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="p-5 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between backdrop-blur-2xl shadow-xl group hover:border-white/20 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPlus ? 'bg-indigo-500/10' : 'bg-amber-500/10'}`}>
                                <Sparkles size={22} className={isPlus ? 'text-indigo-400' : 'text-amber-400'} />
                            </div>
                            <div className="text-left">
                                <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-1">{isPlus ? t('subscription.pro_active.plan_pro_plus') : (isLifetime ? t('subscription.pro_active.plan_pro_lifetime') : t('subscription.pro_active.plan_pro_monthly'))}</p>
                                <p className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                                    {isLifetime ? t('subscription.pro_active.lifetime') : (user && new Date(user.pro_expires_at!).toLocaleDateString())}
                                </p>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <CheckCircle2 size={18} className="text-emerald-500" />
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 gap-3 pt-4">
                        {!isLifetime && (
                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                onClick={() => { selection(); setShowPaymentOptionsForPro(true); }}
                                className="w-full h-15 rounded-2xl font-black text-indigo-400 border-2 border-indigo-500/10 bg-indigo-500/5 hover:bg-indigo-500/10 text-[11px] uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Zap size={16} />
                                {t('subscription.upgrade.extend_membership')}
                            </motion.button>
                        )}

                        <motion.button
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            onClick={() => { selection(); window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'pro' })); }}
                            className={`w-full h-16 rounded-2xl font-black text-white text-[11px] uppercase tracking-[0.25em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 ${isPlus ? 'bg-linear-to-r from-indigo-600 to-blue-600 shadow-indigo-600/30' : 'bg-linear-to-r from-amber-600 to-orange-600 shadow-amber-600/30'}`}
                        >
                            <Trophy size={18} />
                            {t('subscription.pro_active.command_center')}
                        </motion.button>
                    </div>
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
                className="text-center mb-8 relative pt-4"
            >
                {/* Background Vibing Glows */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-24 w-80 h-80 bg-indigo-500/20 blur-[120px] -z-10 animate-pulse" />
                <div className="absolute top-20 left-1/4 w-40 h-40 bg-fuchsia-500/10 blur-[80px] -z-10 animate-float" />

                <motion.div
                    animate={{
                        y: [0, -10, 0],
                        rotate: [0, 2, -2, 0],
                        scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-block mb-4 pt-2"
                >
                    <div className="relative group">
                        <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-30 group-hover:opacity-50 transition-opacity animate-pulse" />
                        <div className="w-16 h-16 rounded-3xl bg-linear-to-br from-indigo-500 via-fuchsia-600 to-indigo-800 flex items-center justify-center shadow-[0_20px_50px_rgba(99,102,241,0.4)] relative border border-white/30 backdrop-blur-sm overflow-hidden">
                            <div className="absolute inset-0 bg-linear-to-tr from-white/10 to-transparent opacity-50" />
                            <Crown size={32} className="text-white fill-white/20 relative z-10 drop-shadow-lg" />
                        </div>
                    </div>
                </motion.div>

                <div className="flex flex-col items-center gap-3 mb-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="px-5 py-2 rounded-2xl bg-white/5 border border-white/10 shadow-2xl relative overflow-hidden group backdrop-blur-md"
                    >
                        <div className="absolute inset-0 bg-linear-to-r from-indigo-500/10 via-fuchsia-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center gap-2.5 relative z-10">
                            <motion.div
                                animate={{
                                    scale: [1, 1.4, 1],
                                    boxShadow: ["0 0 5px #34d399", "0 0 15px #34d399", "0 0 5px #34d399"]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-2 h-2 rounded-full bg-emerald-400"
                            />
                            <span className="text-[11px] font-black uppercase tracking-[0.35em] text-white/90 drop-shadow-sm">
                                {t('subscription.upgrade.protocol_initialized')}
                            </span>
                        </div>
                    </motion.div>

                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none italic flex flex-col items-center mt-2">
                        <motion.span
                            animate={{ opacity: [0.5, 1, 0.5], scale: [0.98, 1, 0.98] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="text-[11px] tracking-[0.5em] not-italic font-black text-indigo-400 mb-2 drop-shadow-md"
                        >
                            {t('subscription.upgrade.dominate_network')}
                        </motion.span>
                        <span className="vibing-crystal-text text-6xl block w-full text-center px-4 font-black transition-all duration-500 hover:scale-105 cursor-default select-none">
                            PRO STATUS
                        </span>
                    </h1>
                </div>

                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold max-w-[280px] mx-auto leading-relaxed uppercase tracking-[0.25em] mb-6 text-center opacity-80">
                    <span className="inline-block px-1 border-b border-indigo-500/30 pb-0.5">
                        {t('subscription.upgrade.desc')}
                    </span>
                </p>

                <div className="flex flex-col items-center gap-2 mb-6">
                    {proStats && (
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="w-full max-w-[240px] px-4 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-linear-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-center mb-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-500/90">{t('subscription.upgrade.lifetime_slots')}</span>
                                </div>
                                <span className="text-xs font-black text-white/90">{proStats.sold}/{proStats.total}</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-px">
                                <motion.div
                                    className="h-full bg-linear-to-r from-amber-400 via-orange-500 to-amber-600 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(proStats.sold / proStats.total) * 100}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>

            <div className="p-1.5 bg-slate-950/20 dark:bg-black/20 rounded-[2rem] mb-6 relative flex shadow-inner backdrop-blur-xl border border-white/5 mx-auto w-full max-w-[360px]">
                <motion.div
                    className="absolute inset-y-1.5 rounded-[1.8rem] bg-indigo-600 shadow-[0_10px_30px_rgba(99,102,241,0.4)] z-0"
                    initial={false}
                    animate={{
                        x: selectedPlan === 'PRO' ? 0 : '100%',
                        width: '50%'
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
                <button
                    onClick={() => { selection(); setSelectedPlan('PRO'); setExpandedFeature(null); }}
                    className={`flex-1 relative z-10 py-4 rounded-[1.8rem] flex flex-col items-center justify-center transition-all duration-300 ${selectedPlan === 'PRO' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] mb-1">{t('subscription.upgrade.pro_title')}</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black">$39</span>
                        <span className="text-[9px] font-bold opacity-40 italic uppercase">{(proStats && proStats.sold >= proStats.total) ? '30D' : 'LIFE'}</span>
                    </div>
                </button>
                <button
                    onClick={() => { selection(); setSelectedPlan('PRO_PLUS'); setExpandedFeature(null); }}
                    className={`flex-1 relative z-10 py-4 rounded-[1.8rem] flex flex-col items-center justify-center transition-all duration-300 ${selectedPlan === 'PRO_PLUS' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-[8px] font-black text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_5px_15px_rgba(245,158,11,0.4)] z-20 whitespace-nowrap border border-white/20">{t('subscription.upgrade.best_badge')}</div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] mb-1">{t('subscription.upgrade.pro_plus_title')}</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black">$69</span>
                        <span className="text-[9px] font-bold opacity-40 italic uppercase">{t('subscription.upgrade.lifetime_pro')}</span>
                    </div>
                </button>
            </div>

            <div className="flex flex-col gap-4 mb-8">
                {/* TOKENS FEATURE (Marketer 24/7) */}
                <motion.div
                    layout
                    className="relative"
                >
                    {expandedFeature === 'TOKENS' && (
                        <div className="absolute -inset-1 bg-indigo-500/10 rounded-[2.2rem] blur-2xl -z-10 animate-pulse" />
                    )}
                    <button
                        onClick={() => { selection(); setExpandedFeature(expandedFeature === 'TOKENS' ? null : 'TOKENS'); }}
                        className={`w-full text-left transition-all duration-300 overflow-hidden rounded-[2rem] border group ${expandedFeature === 'TOKENS' ? 'border-white/20 bg-linear-to-br from-indigo-600/90 via-purple-600/90 to-slate-900/90 shadow-2xl scale-[1.02]' : (selectedPlan === 'PRO_PLUS' ? 'border-indigo-500/20 bg-white dark:bg-white/3 shadow-lg' : 'border-slate-100 dark:border-white/5 bg-white dark:bg-white/2 shadow-sm')}`}
                    >
                        <div className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${expandedFeature === 'TOKENS' ? 'bg-white/20 text-white rotate-12' : 'bg-indigo-500/10 text-indigo-400 group-hover:rotate-6'}`}>
                                    <Zap size={22} fill={expandedFeature === 'TOKENS' ? 'currentColor' : 'none'} className={expandedFeature === 'TOKENS' ? 'animate-pulse' : ''} />
                                </div>
                                <div>
                                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-0.5 ${expandedFeature === 'TOKENS' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        {selectedPlan === 'PRO' ? '250 TOKENS' : '500 TOKENS'}
                                    </p>
                                    <h3 className={`text-base font-black uppercase tracking-tight ${expandedFeature === 'TOKENS' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                        {t('subscription.upgrade.viral_studio_label')}
                                    </h3>
                                </div>
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${expandedFeature === 'TOKENS' ? 'bg-white/20 rotate-180' : 'bg-slate-100 dark:bg-white/5'}`}>
                                <ChevronDown size={18} className={expandedFeature === 'TOKENS' ? 'text-white' : 'text-slate-400'} />
                            </div>
                        </div>

                        <AnimatePresence initial={false}>
                            {expandedFeature === 'TOKENS' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                    className="overflow-hidden bg-black/30"
                                >
                                    <div className="px-6 pb-8 pt-2">
                                        <div className="h-px bg-white/10 mb-6" />
                                        <p className="text-xs text-indigo-100/70 italic leading-relaxed mb-6 font-medium">
                                            {t(selectedPlan === 'PRO' ? 'subscription.upgrade.viral_studio_desc_pro' : 'subscription.upgrade.viral_studio_desc_pro_plus')}
                                        </p>
                                        <div className="grid grid-cols-1 gap-2 mb-8">
                                            {(t(selectedPlan === 'PRO' ? 'subscription.upgrade.benefits_pro' : 'subscription.upgrade.benefits_pro_plus', { returnObjects: true }) as string[]).map((benefit, idx) => (
                                                <motion.div
                                                    initial={{ x: -10, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    key={idx}
                                                    className="flex items-center gap-3 py-2.5 px-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
                                                >
                                                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                                        <CheckCircle2 size={12} className="text-indigo-400" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">{benefit}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={scrollToPayment}
                                            className="w-full h-14 bg-white text-indigo-600 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:shadow-white/10 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Trophy size={16} />
                                            {t('subscription.upgrade.initialize_studio')}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </motion.div>

                {/* LEVELS FEATURE (Network Factory) */}
                <motion.div
                    layout
                    className="relative"
                >
                    {expandedFeature === 'LEVELS' && (
                        <div className="absolute -inset-1 bg-emerald-500/10 rounded-[2.2rem] blur-2xl -z-10 animate-pulse" />
                    )}
                    <button
                        onClick={() => { selection(); setExpandedFeature(expandedFeature === 'LEVELS' ? null : 'LEVELS'); }}
                        className={`w-full text-left transition-all duration-300 overflow-hidden rounded-[2rem] border group ${expandedFeature === 'LEVELS' ? 'border-white/20 bg-linear-to-br from-emerald-600/90 via-teal-700/90 to-slate-900/90 shadow-2xl scale-[1.02]' : (selectedPlan === 'PRO_PLUS' ? 'border-emerald-500/20 bg-white dark:bg-white/3 shadow-lg' : 'border-slate-100 dark:border-white/5 bg-white dark:bg-white/2 shadow-sm')}`}
                    >
                        <div className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${expandedFeature === 'LEVELS' ? 'bg-white/20 text-white rotate-12' : 'bg-emerald-500/10 text-emerald-400 group-hover:rotate-6'}`}>
                                    <Users size={22} fill={expandedFeature === 'LEVELS' ? 'currentColor' : 'none'} className={expandedFeature === 'LEVELS' ? 'animate-pulse' : ''} />
                                </div>
                                <div className="text-left">
                                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-0.5 ${expandedFeature === 'LEVELS' ? 'text-emerald-200' : 'text-slate-400'}`}>
                                        {selectedPlan === 'PRO' ? '9 LEVELS' : '20 LEVELS'}
                                    </p>
                                    <h3 className={`text-base font-black uppercase tracking-tight ${expandedFeature === 'LEVELS' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                        {t('subscription.upgrade.content_factory_label')}
                                    </h3>
                                </div>
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${expandedFeature === 'LEVELS' ? 'bg-white/20 rotate-180' : 'bg-slate-100 dark:bg-white/5'}`}>
                                <ChevronDown size={18} className={expandedFeature === 'LEVELS' ? 'text-white' : 'text-slate-400'} />
                            </div>
                        </div>

                        <AnimatePresence initial={false}>
                            {expandedFeature === 'LEVELS' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                    className="overflow-hidden bg-black/30"
                                >
                                    <div className="px-6 pb-8 pt-2">
                                        <div className="h-px bg-white/10 mb-6" />
                                        <p className="text-xs text-emerald-100/70 italic leading-relaxed mb-6 font-medium">
                                            {t(selectedPlan === 'PRO' ? 'subscription.upgrade.content_factory_desc_pro' : 'subscription.upgrade.content_factory_desc_pro_plus')}
                                        </p>
                                        <div className="grid grid-cols-1 gap-2 mb-8">
                                            {(t(selectedPlan === 'PRO' ? 'subscription.upgrade.benefits_pro' : 'subscription.upgrade.benefits_pro_plus', { returnObjects: true }) as string[]).map((benefit, idx) => (
                                                <motion.div
                                                    initial={{ x: -10, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    key={idx}
                                                    className="flex items-center gap-3 py-2.5 px-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
                                                >
                                                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                        <CheckCircle2 size={12} className="text-emerald-400" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">{benefit}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={scrollToPayment}
                                            className="w-full h-14 bg-white text-emerald-600 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:shadow-white/10 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Zap size={16} />
                                            {t('subscription.upgrade.deploy_factory')}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </motion.div>
            </div>

            {/* Premium Payment Window */}
            <motion.div
                ref={paymentRef}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="vibing-premium-panel p-8 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] relative z-10"
            >
                {/* Decorative Elements */}
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-500/10 blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-fuchsia-500/10 blur-[80px] pointer-events-none" />

                <motion.div
                    animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.15, 1],
                        y: [0, -15, 0]
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-16 -right-16 opacity-[0.07] pointer-events-none transform rotate-12"
                >
                    <Crown size={280} className="text-white fill-white" />
                </motion.div>

                {!paymentMethod ? (
                    <div className="space-y-10 relative z-10">
                        <div className="text-center space-y-3">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-2"
                            >
                                <Sparkles size={10} className="text-indigo-400" />
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50">{t('subscription.upgrade.complete_payment')}</span>
                            </motion.div>

                            <div className="flex flex-col items-baseline justify-center gap-1 group/price">
                                <div className="flex items-baseline justify-center gap-2">
                                    <span className="text-white font-black text-6xl tracking-tighter drop-shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-500 group-hover/price:scale-110 group-hover/price:tracking-normal group-hover/price:text-indigo-200">${planPrice}</span>
                                    <span className="text-white/30 text-[11px] font-black uppercase tracking-[0.2em] italic">
                                        / {(proStats && proStats.sold >= proStats.total && selectedPlan === 'PRO') ? t('subscription.upgrade.monthly_label') : t('subscription.upgrade.lifetime_label')}
                                    </span>
                                </div>
                                <div className="w-full h-1 bg-linear-to-r from-transparent via-indigo-500/30 to-transparent scale-x-50 group-hover/price:scale-x-100 transition-transform duration-700" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { selection(); setPaymentMethod('TON'); }}
                                className="h-28 bg-white text-slate-950 rounded-[2.5rem] font-black text-[10px] flex flex-col items-center justify-center gap-3 active:scale-90 transition-all shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] relative overflow-hidden group/btn hover:shadow-[0_25px_50px_-12px_rgba(255,255,255,0.3)]"
                            >
                                <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover/btn:bg-indigo-100 transition-colors">
                                    <Wallet size={26} className="text-indigo-600" />
                                </div>
                                <span className="tracking-[0.15em] font-black uppercase">{t('subscription.upgrade.ton_wallet')}</span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { selection(); setPaymentMethod('CRYPTO'); }}
                                className="h-28 bg-white/5 text-white rounded-[2.5rem] font-black text-[10px] flex flex-col items-center justify-center gap-3 active:scale-90 border border-white/10 transition-all hover:bg-white/10 hover:border-white/20 relative overflow-hidden group/btn shadow-2xl"
                            >
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover/btn:bg-white/10 transition-colors border border-white/10">
                                    <CreditCard size={26} className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                                </div>
                                <span className="tracking-[0.15em] font-black uppercase">USDT (TRC20)</span>
                            </motion.button>
                        </div>

                        <p className="text-[9px] text-white/30 text-center uppercase tracking-widest font-black opacity-50">
                            {t('subscription.upgrade.secure_encryption_active', { defaultValue: 'SECURE ENCRYPTED TRANSACTION' })}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 relative z-10">
                        <div className="flex justify-between items-center text-white pb-2 border-b border-white/5">
                            <button
                                onClick={() => { setPaymentMethod(null); setShowPaymentOptionsForPro(false); }}
                                className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2 hover:opacity-100 transition-opacity group"
                            >
                                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10">
                                    <ChevronRight size={14} className="rotate-180" />
                                </div>
                                {t('subscription.upgrade.change_method')}
                            </button>
                            {formattedTime && (
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                                    <Clock size={12} className="text-indigo-400" />
                                    <span className="text-[11px] font-black font-mono text-indigo-400">{formattedTime}</span>
                                </div>
                            )}
                        </div>

                        {paymentMethod === 'TON' && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-2xl shadow-inner flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-2">
                                        <Wallet size={40} className="text-indigo-400" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">{t('subscription.upgrade.connect_and_pay')}</p>
                                        <div className="flex justify-center scale-110">
                                            <TonConnectButton />
                                        </div>
                                    </div>
                                </div>
                                <button
                                    disabled={isLoading}
                                    onClick={handleTonPayment}
                                    className="w-full h-16 bg-white text-indigo-600 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.25em] shadow-[0_20px_40px_rgba(255,255,255,0.2)] active:scale-95 transition-all disabled:opacity-50 hover:bg-slate-50 flex items-center justify-center"
                                >
                                    {isLoading ? <Loader2 size={24} className="animate-spin" /> : t('subscription.upgrade.complete_payment')}
                                </button>
                            </motion.div>
                        )}

                        {paymentMethod === 'CRYPTO' && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-5"
                            >
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(adminUsdt);
                                        selection();
                                        notification('success');
                                    }}
                                    className="w-full text-left group"
                                >
                                    <div className="p-5 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-2xl group-active:scale-[0.98] transition-all relative overflow-hidden">
                                        <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                <p className="text-[9px] font-black uppercase tracking-widest text-white/50">{t('subscription.upgrade.usdt_trc20_address')}</p>
                                            </div>
                                            <span className="text-[9px] font-black text-indigo-400 opacity-60 group-hover:opacity-100 transition-opacity uppercase tracking-widest">{t('subscription.upgrade.tap_to_copy')}</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-black/40 p-4 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
                                            <code className="text-[11px] font-mono break-all text-white/90 flex-1 leading-relaxed">{adminUsdt}</code>
                                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                                                <CheckCircle2 size={16} className="text-emerald-500 opacity-0 group-active:opacity-100 transition-opacity" />
                                                <CreditCard size={16} className="text-white/20 group-active:opacity-0 transition-opacity absolute" />
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                <div className="grid grid-cols-1 gap-3">
                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            selection();
                                            window.location.href = `tron:${adminUsdt}`;
                                        }}
                                        className="h-14 bg-white/10 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest border border-white/10 hover:bg-white/15 transition-all flex items-center justify-center gap-3"
                                    >
                                        <Wallet size={18} className="text-indigo-400" />
                                        {t('subscription.upgrade.open_wallet_app')}
                                    </motion.button>

                                    <div className="relative py-4">
                                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                            <div className="w-full border-t border-white/10"></div>
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="bg-slate-900 px-4 text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">{t('subscription.upgrade.then_verify')}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="relative group">
                                            <input
                                                value={manualHash}
                                                onChange={(e) => setManualHash(e.target.value)}
                                                placeholder={t('subscription.upgrade.paste_tx_hash')}
                                                className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-6 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-black/60 transition-all text-center font-mono"
                                            />
                                            <div className="absolute inset-x-6 bottom-0 h-px bg-linear-to-r from-transparent via-indigo-500/50 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
                                        </div>

                                        <motion.button
                                            whileHover={{ y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleManualSubmit}
                                            disabled={isLoading || !manualHash}
                                            className="h-14 w-full bg-linear-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center"
                                        >
                                            {isLoading ? <Loader2 size={24} className="animate-spin" /> : t('subscription.upgrade.verify_transaction')}
                                        </motion.button>
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                                    <p className="text-[10px] text-amber-200/60 text-center font-bold leading-relaxed uppercase tracking-wider">
                                        {t('subscription.upgrade.trc20_warning', { defaultValue: 'USE TRC20 NETWORK ONLY' })} • {t('subscription.upgrade.transfer_exact', { amount: planPrice, defaultValue: `SEND EXACTLY $${planPrice} USDT` })}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}
            </motion.div>

            <AnimatePresence>
                {status !== 'idle' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-200 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className="vibing-premium-panel p-10 w-full max-w-sm text-center shadow-2xl border-white/20 relative"
                        >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 w-32 h-32 bg-indigo-500/20 blur-3xl -z-10" />

                            {status === 'pending' && <Loader2 size={64} className="text-amber-500 animate-spin mx-auto mb-8 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />}
                            {status === 'success' && <Trophy size={64} className="text-emerald-500 mx-auto mb-8 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />}
                            {status === 'manual_review' && <CheckCircle2 size={64} className="text-blue-500 mx-auto mb-8 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />}

                            <h2 className="text-2xl font-black mb-3 text-white uppercase tracking-tighter italic">
                                {status === 'pending' ? t('subscription.status.verifying') : status === 'success' ? t('subscription.status.welcome_pro') : t('subscription.status.submitted')}
                            </h2>
                            <p className="text-sm text-white/50 mb-10 leading-relaxed font-bold uppercase tracking-widest text-[10px]">
                                {status === 'pending' ? t('subscription.status.verifying_p') : status === 'success' ? t('subscription.status.welcome_pro_p') : t('subscription.status.submitted_p')}
                            </p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="w-full h-14 bg-white text-indigo-900 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:bg-slate-50 transition-all active:scale-95"
                            >
                                {t('subscription.status.got_it')}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Knowledge Base Teaser */}
            <div className="mt-10 px-2 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-500/5 border border-slate-500/10 mb-4">
                    <HelpCircle size={10} className="text-slate-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('subscription.faq.teaser_badge')}</span>
                </div>

                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tighter">
                    {t('subscription.faq.header_pre')} <span className="text-indigo-500 text-2xl italic">{t('subscription.faq.header_highlight')}</span>
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
                    {t('subscription.faq.view_center')}
                </button>

                <div className="mt-8 opacity-10 text-[7px] font-mono tracking-widest text-slate-500">
                    BUILD: 2026.02.18 | v1.7.3
                </div>
            </div>
        </div>
    );
}
