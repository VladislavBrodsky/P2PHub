import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Crown, CheckCircle2, Wallet, CreditCard,
    Loader2, Sparkles, Zap, ChevronDown, Trophy, Users,
    HelpCircle, Clock, Check, Globe, Shield, Share2, ChevronLeft,
    Flame, Brain, Rocket, Network, Star, Lock, Infinity as InfinityIcon, Target, TrendingUp, Bot,
    Send, BarChart2, Radio
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
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'TON' | 'CRYPTO' | null>(null);
    const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'manual_review'>('idle');
    const [manualHash, setManualHash] = useState('');
    const [sessionData, setSessionData] = useState<{ expires_at: string; transaction_id: number } | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<'PRO' | 'PRO_PLUS'>('PRO_PLUS');
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [expandedBenefit, setExpandedBenefit] = useState<string | null>(null);
    const [proStats, setProStats] = useState<{ sold: number; total: number } | null>(null);
    const [showPaymentOptionsForPro, setShowPaymentOptionsForPro] = useState(false);

    const isPro = user?.is_pro;
    const isProPlus = (user?.subscription_plan || "").includes('PLUS');
    const isStandardPro = isPro && !isProPlus;

    const proPrice = 39;
    const proPlusPrice = 69;
    const upgradePrice = proPlusPrice - proPrice; // 30

    const paymentRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await apiClient.get('/api/pro/stats');
                setProStats(res.data);
            } catch (e) {
                console.error("Failed to fetch pro stats", e);
            }
        };
        const fetchMyTransactions = async () => {
            try {
                const res = await apiClient.get('/api/payment/my-transactions');
                const transactions = res.data;
                const manualPending = transactions.find((t: any) => t.status === 'manual_review');
                if (manualPending) {
                    setStatus('manual_review');
                }
            } catch (e) {
                console.error("Failed to fetch my transactions", e);
            }
        };
        fetchStats();
        fetchMyTransactions();
    }, []);

    useEffect(() => {
        if (!sessionData?.expires_at) { setTimeLeft(null); return; }
        const interval = setInterval(() => {
            const expires = new Date(sessionData.expires_at).getTime();
            const now = new Date().getTime();
            const diff = Math.max(0, Math.floor((expires - now) / 1000));
            setTimeLeft(diff);
            if (diff === 0) { clearInterval(interval); setPaymentMethod(null); setSessionData(null); alert(t('subscription.alerts.expired')); }
        }, 1000);
        return () => clearInterval(interval);
    }, [sessionData, t]);

    // Handle Auto-Upgrade/Purchase Flow from other parts of the app
    useEffect(() => {
        const checkAutoActions = () => {
            const plusFlag = localStorage.getItem('auto_upgrade_pro_plus');
            const proFlag = localStorage.getItem('auto_purchase_pro');

            if (plusFlag === 'true') {
                localStorage.removeItem('auto_upgrade_pro_plus');
                setSelectedPlan('PRO_PLUS');
                setShowPaymentOptionsForPro(true);
                setTimeout(() => {
                    paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    impact('heavy');
                }, 300);
            } else if (proFlag === 'true') {
                localStorage.removeItem('auto_purchase_pro');
                setSelectedPlan('PRO');
                setShowPaymentOptionsForPro(true);
                setTimeout(() => {
                    const el = document.getElementById('currency-selector-anchor');
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else {
                        paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    impact('heavy');
                }, 300);
            }
        };
        checkAutoActions();
        window.addEventListener('focus', checkAutoActions);
        return () => window.removeEventListener('focus', checkAutoActions);
    }, [impact]);

    const formattedTime = useMemo(() => {
        if (timeLeft === null) return null;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, [timeLeft]);

    const planPrice = useMemo(() => {
        if (selectedPlan === 'PRO') return proPrice;
        if (selectedPlan === 'PRO_PLUS') {
            return isStandardPro ? upgradePrice : proPlusPrice;
        }
        return proPlusPrice;
    }, [selectedPlan, isStandardPro, proPrice, proPlusPrice, upgradePrice]);
    const adminUsdt = globalConfig?.admin_usdt_address || "TFp4oZV3fUkMgxiZV9d5SkJTHrA7NYoHCM";

    const handleTonPayment = async () => {
        if (!tonConnectUI.connected) { tonConnectUI.openModal(); return; }
        setIsLoading(true); selection();
        try {
            const sessionRes = await apiClient.post('/api/payment/session', { amount: planPrice, currency: 'TON', network: 'TON' });
            const { amount, address } = sessionRes.data;
            const tx = { validUntil: Math.floor(Date.now() / 1000) + 600, messages: [{ address, amount: Math.ceil(amount * 10 ** 9).toString() }] };
            const result = await tonConnectUI.sendTransaction(tx);
            setStatus('pending');
            const verifyRes = await apiClient.post('/api/payment/verify-ton', { tx_hash: result.boc });
            if (verifyRes.data.status === 'success') { setStatus('success'); notification('success'); await refreshUser(); }
            else { setStatus('manual_review'); }
        } catch (error: any) { console.error('Payment failed:', error); setStatus('idle'); notification('error'); }
        finally { setIsLoading(false); }
    };

    const handleManualSubmit = async () => {
        if (!manualHash) return;
        setIsLoading(true); impact('heavy');
        try {
            await apiClient.post('/api/payment/submit-manual', { tx_hash: manualHash?.trim() || null, currency: 'USDT', network: 'TRC20', amount: planPrice });
            setStatus('manual_review'); notification('success');
        } catch (error: any) { console.error('Manual submission error:', error); alert(`Submission failed: ${error.response?.data?.detail || 'Error'}`); }
        finally { setIsLoading(false); }
    };

    const scrollToPayment = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        selection();
        paymentRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // ─── PRO ACTIVE STATE (already subscriber) ───────────────────────────────
    if (user?.is_pro && !showPaymentOptionsForPro) {
        const isPlus = (user.subscription_plan?.includes('PLUS'));
        const isLifetime = !user.pro_expires_at || user.subscription_plan === 'PRO_LIFETIME';
        return (
            <div className={`flex flex-col items-center justify-center min-h-dvh w-screen sm:w-full -mx-4 sm:mx-0 px-6 pb-32 pt-10 text-center relative overflow-hidden font-sans`}>
                {/* Fixed Background Layer to prevent clipping */}
                <div className={`fixed inset-0 w-full h-full pointer-events-none z-0 bg-slate-950 ${isPlus ? 'bg-linear-to-b from-slate-900 via-indigo-950/40 to-slate-950' : 'bg-linear-to-b from-slate-900 via-amber-950/20 to-slate-950'}`} />

                {/* Glow Effects */}
                <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] blur-[120px] opacity-30 z-0 pointer-events-none ${isPlus ? 'bg-indigo-600' : 'bg-orange-600'}`} />
                <div className={`fixed top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] blur-[100px] opacity-40 z-0 pointer-events-none animate-pulse ${isPlus ? 'bg-indigo-500' : 'bg-amber-500'}`} />

                <div className="relative z-10 w-full max-w-[320px] mx-auto flex flex-col items-center">
                    <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} className="relative mb-8 mt-[-5dvh]">
                        <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-white/20 backdrop-blur-md bg-linear-to-br ${isPlus ? 'from-indigo-400 via-blue-600 to-indigo-900' : 'from-amber-300 via-orange-500 to-amber-800'}`}>
                            <Crown size={56} className="text-white fill-white/20 drop-shadow-lg" />
                        </div>
                    </motion.div>

                    <h1 className="text-4xl font-black mb-2 tracking-tighter text-white uppercase italic drop-shadow-md">
                        {isPlus ? t('subscription.pro_active.title_plus', 'PRO+ EMPIRE') : t('subscription.pro_active.title', 'PRO ACTIVE')}
                    </h1>

                    <p className="text-slate-300 font-bold text-[10px] uppercase tracking-[0.2em] max-w-[280px] mb-12 opacity-80 leading-relaxed">
                        {isPlus ? t('subscription.pro_active.desc_plus') : t('subscription.pro_active.desc')}
                    </p>

                    <div className="w-full space-y-4">
                        <div className="p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl flex items-center justify-between shadow-2xl">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 shadow-inner shrink-0 ${isPlus ? 'text-indigo-300' : 'text-amber-400'}`}>
                                    <Sparkles size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-0.5 whitespace-nowrap">{t('subscription.pro_active.lifetime', 'YOUR PLAN')}</p>
                                    <p className="text-[14px] font-black text-white tracking-tight whitespace-nowrap">{isLifetime ? 'LIFETIME ACCESS' : new Date(user.pro_expires_at!).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-lg md:ml-2">
                                <CheckCircle2 size={16} className="text-emerald-400" />
                            </div>
                        </div>

                        <button
                            onClick={() => { selection(); window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'pro' })); }}
                            className={`w-full h-14 rounded-2xl font-black text-white text-[11px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 border ${isPlus ? 'bg-linear-to-r from-indigo-600 hover:from-indigo-500 to-purple-600 hover:to-purple-500 border-indigo-400/30 shadow-indigo-500/20' : 'bg-linear-to-r from-amber-500 hover:from-amber-400 to-orange-600 hover:to-orange-500 border-orange-400/30 shadow-orange-500/20'}`}
                        >
                            <Trophy size={18} />
                            {t('subscription.pro_active.command_center', 'COMMAND CENTER')}
                        </button>

                        {!isPlus && (
                            <button
                                onClick={() => {
                                    selection();
                                    setSelectedPlan('PRO_PLUS');
                                    setShowPaymentOptionsForPro(true);
                                    scrollToPayment();
                                }}
                                className="w-full h-14 bg-black/40 backdrop-blur-md border border-indigo-500/50 hover:border-indigo-400 hover:bg-indigo-900/40 text-indigo-300 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-500/10"
                            >
                                <Sparkles size={16} fill="currentColor" />
                                {t('subscription.upgrade.pro_plus_upgrade_title', 'PRO+ UPGRADE')}
                            </button>
                        )}

                        {!isLifetime && (
                            <button onClick={() => setShowPaymentOptionsForPro(true)} className="text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors block mx-auto mt-6">
                                {t('subscription.upgrade.extend_membership', 'EXTEND MEMBERSHIP')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ─── PLAN BENEFITS ────────────────────────────────────────────────────────
    const proBenefits = [
        { id: 'ai', icon: Brain, label: t('subscription.benefits.ai_studio'), desc: t('subscription.benefits.ai_studio_desc_pro'), color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10 dark:bg-indigo-500/20' },
        { id: 'network', icon: Network, label: t('subscription.benefits.network_levels'), desc: t('subscription.benefits.network_levels_desc_pro'), color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-500/20' },
        { id: 'tokens', icon: Zap, label: t('subscription.benefits.tokens'), desc: t('subscription.benefits.tokens_desc_pro'), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-500/20' },
        { id: 'cashback', icon: TrendingUp, label: t('subscription.benefits.cashback'), desc: t('subscription.benefits.cashback_desc_pro'), color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 dark:bg-purple-500/20' },
        { id: 'tools', icon: Bot, label: t('subscription.benefits.tools'), desc: t('subscription.benefits.tools_desc_pro'), color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-500/20' },
        { id: 'intel', icon: Target, label: t('subscription.benefits.growth_intel'), desc: t('subscription.benefits.growth_intel_desc'), color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 dark:bg-rose-500/20' },
    ];

    const proPlusBenefits = [
        { id: 'ai', icon: Brain, label: t('subscription.benefits.ai_studio'), desc: t('subscription.benefits.ai_studio_desc_plus'), color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10 dark:bg-indigo-500/20' },
        { id: 'network', icon: Network, label: t('subscription.benefits.network_levels'), desc: t('subscription.benefits.network_levels_desc_plus'), color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-500/20' },
        { id: 'tokens', icon: Zap, label: t('subscription.benefits.tokens'), desc: t('subscription.benefits.tokens_desc_plus'), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-500/20' },
        { id: 'cashback', icon: TrendingUp, label: t('subscription.benefits.cashback'), desc: t('subscription.benefits.cashback_desc_plus'), color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 dark:bg-purple-500/20' },
        { id: 'tools', icon: Bot, label: t('subscription.benefits.tools'), desc: t('subscription.benefits.tools_desc_plus'), color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-500/20' },
        { id: 'omni', icon: InfinityIcon, label: t('subscription.benefits.omni_sync'), desc: t('subscription.benefits.omni_sync_desc'), color: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-500/10 dark:bg-fuchsia-500/20' },
        { id: 'priority', icon: Star, label: t('subscription.benefits.priority_ai'), desc: t('subscription.benefits.priority_ai_desc'), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-500/20' },
        { id: 'empire', icon: Rocket, label: t('subscription.benefits.empire_access'), desc: t('subscription.benefits.empire_access_desc'), color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 dark:bg-rose-500/20' },
        { id: 'channels', icon: Send, label: t('subscription.benefits.tg_multi_channel', '5 Telegram Channels'), desc: t('subscription.benefits.tg_multi_channel_desc', 'Add up to 5 Telegram channels and auto-broadcast to all of them simultaneously from one dashboard.'), color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10 dark:bg-sky-500/20' },
        { id: 'broadcast', icon: Radio, label: t('subscription.benefits.multi_broadcast', 'Multi-Channel Broadcasting'), desc: t('subscription.benefits.multi_broadcast_desc', 'Schedule and blast posts across all your connected channels in one click — maximum reach, zero effort.'), color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10 dark:bg-violet-500/20' },
        { id: 'analytics', icon: BarChart2, label: t('subscription.benefits.content_analytics', 'Content Performance Analytics'), desc: t('subscription.benefits.content_analytics_desc', 'Track reach, engagement, and conversion rates for every post across all channels with real-time insights.'), color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10 dark:bg-teal-500/20' },
    ];

    const currentBenefits = selectedPlan === 'PRO' ? proBenefits : proPlusBenefits;

    const faqs = [
        { icon: Clock, iconColor: 'text-indigo-500 dark:text-indigo-400', q: t('subscription.faq.q1'), a: t('subscription.faq.a1') },
        { icon: Zap, iconColor: 'text-amber-500 dark:text-amber-400', q: t('subscription.faq.q2'), a: t('subscription.faq.a2') },
        { icon: Globe, iconColor: 'text-emerald-500 dark:text-emerald-400', q: t('subscription.faq.q3'), a: t('subscription.faq.a3') },
        { icon: Shield, iconColor: 'text-purple-500 dark:text-purple-400', q: t('subscription.faq.q4'), a: t('subscription.faq.a4') },
        { icon: Network, iconColor: 'text-blue-500 dark:text-blue-400', q: t('subscription.faq.q5'), a: t('subscription.faq.a5') },
        { icon: TrendingUp, iconColor: 'text-rose-500 dark:text-rose-400', q: t('subscription.faq.q6'), a: t('subscription.faq.a6') },
        { icon: Share2, iconColor: 'text-fuchsia-500 dark:text-fuchsia-400', q: t('subscription.faq.q7'), a: t('subscription.faq.a7') },
    ];

    return (
        <div className="flex flex-col px-4 pb-32 pt-0 max-w-lg mx-auto overflow-x-hidden">

            {/* ── HERO SECTION ────────────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-8 pt-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                        <motion.div
                            animate={{ y: [0, -4, 0], rotate: [0, 2, 0, -2, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-500 via-purple-600 to-indigo-900 flex items-center justify-center shadow-2xl border border-white/20 relative z-10"
                        >
                            <Crown size={28} className="text-white fill-white/20 drop-shadow-lg" />
                        </motion.div>
                        <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse" />
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-1.5 px-1">
                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5 backdrop-blur-sm">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">{t('subscription.upgrade.protocol_initialized')}</span>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-orange-500/10 dark:bg-orange-500/10 border border-orange-500/20 flex items-center gap-1.5 backdrop-blur-sm">
                            <Flame size={9} className="text-orange-500" />
                            <span className="text-[8px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest font-mono">{t('subscription.upgrade.limited_offer')}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 space-y-1.5">
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-[calc(-0.06em)] uppercase italic vibing-crystal-text leading-none">{t('common.pro_active')}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold max-w-[240px] mx-auto uppercase tracking-[0.15em] pt-1 opacity-70 leading-relaxed font-mono">
                        {t('subscription.upgrade.desc')}
                    </p>
                </div>

                {proStats && (
                    <div className="mt-5 w-full max-w-[220px] mx-auto group">
                        <div className="flex justify-between text-[8px] font-black mb-1.5 text-slate-400 dark:text-white/30 uppercase tracking-widest">
                            <span className="group-hover:text-indigo-500 transition-colors">{t('subscription.upgrade.lifetime_slots')}</span>
                            <span className="text-slate-900 dark:text-white">{proStats.sold} / {proStats.total}</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden border border-slate-300/30 dark:border-white/5 p-0.5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(proStats.sold / proStats.total) * 100}%` }}
                                className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-fuchsia-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                            />
                        </div>
                    </div>
                )}
            </motion.div>

            {/* ── PLAN SELECTOR ───────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 mb-8 px-1">
                <div className="text-center space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-[0.2em] border border-indigo-500/20"
                    >
                        <Sparkles size={11} fill="currentColor" />
                        {t('subscription.upgrade.badge')}
                    </motion.div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-[0.85]">
                        {t('subscription.upgrade.dominate_network')}
                    </h2>
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold max-w-[280px] mx-auto leading-snug uppercase tracking-wider opacity-80">
                        {t('subscription.upgrade.subheadline')}
                    </p>
                </div>

                {/* Toggle */}
                <div className="relative bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-[2rem] flex gap-1.5 border border-slate-200/80 dark:border-white/10 shadow-inner mt-2 backdrop-blur-xl">
                    <div
                        className={`absolute inset-y-1.5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] rounded-[1.5rem] shadow-premium ${selectedPlan === 'PRO'
                            ? 'left-1.5 w-[calc(50%-0.375rem)] bg-white dark:bg-indigo-600 shadow-indigo-500/20'
                            : 'left-[calc(50%+0.375rem)] w-[calc(50%-0.375rem)] bg-linear-to-br from-indigo-500 via-purple-500 to-fuchsia-500 shadow-purple-500/30'
                            }`}
                    />
                    <button
                        onClick={() => { selection(); setSelectedPlan('PRO'); }}
                        className={`relative flex-1 py-4 flex flex-col items-center gap-1 z-10 transition-colors duration-300 ${selectedPlan === 'PRO' ? 'text-indigo-600 dark:text-white' : 'text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/50'}`}
                    >
                        <span className="text-[9px] font-black tracking-[0.2em] uppercase opacity-80">{t('subscription.upgrade.pro_title')}</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-[14px] font-bold opacity-50">$</span>
                            <span className="text-3xl font-black tracking-tighter hover:scale-105 transition-transform">39</span>
                        </div>
                        <span className="text-[8px] font-black opacity-50 uppercase tracking-widest">{t('subscription.upgrade.monthly_label')}</span>
                    </button>
                    <button
                        onClick={() => { selection(); setSelectedPlan('PRO_PLUS'); }}
                        className={`relative flex-1 py-4 flex flex-col items-center gap-1 z-10 transition-colors duration-300 ${selectedPlan === 'PRO_PLUS' ? 'text-white' : 'text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/50'}`}
                    >
                        <span className="text-[9px] font-black tracking-[0.2em] uppercase opacity-80">{isStandardPro ? t('subscription.upgrade.pro_plus_upgrade_title') || 'PRO+ UPGRADE' : t('subscription.upgrade.pro_plus_title')}</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-[14px] font-bold opacity-50">$</span>
                            <span className="text-3xl font-black tracking-tighter hover:scale-105 transition-transform">{isStandardPro ? upgradePrice : proPlusPrice}</span>
                        </div>
                        <span className="text-[8px] font-black opacity-70 uppercase tracking-widest">{isStandardPro ? t('subscription.upgrade.upgrade_label') || 'ONE-TIME UPGRADE' : t('subscription.upgrade.lifetime_label')}</span>
                        {selectedPlan !== 'PRO_PLUS' && (
                            <div className="absolute -top-2 -right-1 px-2.5 py-0.5 bg-linear-to-r from-amber-400 to-orange-500 text-[8px] font-black text-white rounded-full border-2 border-slate-100 dark:border-slate-800 shadow-lg animate-bounce">
                                🔥 20X
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {/* ── KEY COMPARISON GRID ───────────────────────────────────── */}
            <div className="mb-10 px-1">
                <div className="flex items-center gap-2 mb-4 px-2">
                    <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/40">
                        {t('subscription.comparison.title', 'Key Differences')}
                    </h3>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {[
                        { icon: Network, label: t('subscription.comparison.levels', 'Levels'), pro: '9', plus: '20', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                        { icon: Zap, label: t('subscription.comparison.tokens', 'Tokens'), pro: '250', plus: '500', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                        { icon: Send, label: t('subscription.comparison.channels', 'Nodes'), pro: '1', plus: '5', color: 'text-sky-500', bg: 'bg-sky-500/10' },
                    ].map((item, idx) => (
                        <div key={idx} className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/10 rounded-[1.5rem] p-4 flex flex-col items-center gap-2 relative overflow-hidden group hover:bg-slate-100/80 dark:hover:bg-white/5 transition-colors shadow-sm">
                            <div className={`w-10 h-10 rounded-[1rem] ${item.bg} ${item.color} flex items-center justify-center mb-1 group-hover:scale-110 transition-transform`}>
                                <item.icon size={16} />
                            </div>
                            <span className="text-[9px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest">{item.label}</span>

                            <div className="flex items-center gap-2.5 mt-1">
                                <div className="flex flex-col items-center">
                                    <span className="text-[12px] font-black text-slate-900 dark:text-white/60">{item.pro}</span>
                                    <span className="text-[6px] font-black text-slate-400 dark:text-white/20 uppercase">PRO</span>
                                </div>
                                <div className="w-px h-6 bg-slate-100 dark:bg-white/10" />
                                <div className="flex flex-col items-center">
                                    <span className={`text-[15px] font-black ${selectedPlan === 'PRO_PLUS' ? 'text-indigo-500' : 'text-slate-900 dark:text-white'}`}>{item.plus}</span>
                                    <span className={`text-[6px] font-black uppercase ${selectedPlan === 'PRO_PLUS' ? 'text-indigo-500/60' : 'text-slate-400 dark:text-white/20'}`}>PRO+</span>
                                </div>
                            </div>

                            {selectedPlan === 'PRO_PLUS' && (
                                <motion.div
                                    layoutId={`glow-${idx}`}
                                    className="absolute inset-0 bg-indigo-500/5 pointer-events-none"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                />
                            )}
                            {selectedPlan === 'PRO_PLUS' && (
                                <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-[1.5rem] pointer-events-none" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── PRIMARY CTA & CURRENCY PICKER ─────────────────────────── */}
            <div className="mb-10 px-1 relative z-20">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        selection();
                        const el = document.getElementById('currency-selector-anchor');
                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className={`w-full h-[4.5rem] rounded-[2rem] font-black text-white text-[13px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 relative overflow-hidden group transition-all hover:scale-[1.02] active:scale-95 ${selectedPlan === 'PRO'
                        ? 'bg-linear-to-r from-indigo-500 via-blue-600 to-purple-600 shadow-[0_20px_40px_-10px_rgba(99,102,241,0.4)]'
                        : 'bg-linear-to-r from-purple-500 via-fuchsia-500 to-indigo-500 shadow-[0_20px_40px_-10px_rgba(168,85,247,0.4)]'
                        }`}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <Lock size={18} className="group-hover:scale-110 transition-transform relative z-10" />
                    <span className="relative z-10">
                        {selectedPlan === 'PRO'
                            ? t('subscription.upgrade.buy_pro_btn', 'BUY PRO')
                            : (isStandardPro ? t('subscription.upgrade.upgrade_to_pro_plus_btn', 'UPGRADE TO PRO+') : t('subscription.upgrade.buy_pro_plus_btn', 'BUY PRO+'))}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-white opacity-40 group-hover:scale-150 transition-transform relative z-10" />
                </motion.button>

                <div id="currency-selector-anchor" className="mt-4">
                    {!paymentMethod && (
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <button
                                onClick={() => { selection(); setPaymentMethod('TON'); scrollToPayment(); }}
                                className="group h-16 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all hover:border-indigo-500/50 hover:bg-indigo-500/5 active:scale-95 shadow-sm"
                            >
                                <Wallet size={18} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">PAY WITH TON</span>
                            </button>
                            <button
                                onClick={() => { selection(); setPaymentMethod('CRYPTO'); scrollToPayment(); }}
                                className="group h-16 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5 active:scale-95 shadow-sm"
                            >
                                <CreditCard size={18} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">PAY WITH USDT</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── BENEFITS GRID ───────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedPlan}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="mb-8"
                >
                    {/* Plan headline */}
                    <div className={`rounded-[2rem] p-5 mb-5 border relative overflow-hidden shadow-sm backdrop-blur-md ${selectedPlan === 'PRO'
                        ? 'bg-linear-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-900/20 dark:to-purple-900/10 border-indigo-500/20 dark:border-indigo-500/20'
                        : 'bg-linear-to-br from-purple-500/5 to-fuchsia-500/5 dark:from-purple-900/20 dark:to-fuchsia-900/10 border-purple-500/20 dark:border-purple-500/20'
                        }`}>
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30 -mr-8 -mt-8 bg-indigo-500" />
                        <div className="relative">
                            <div className={`text-[9px] font-black uppercase tracking-[0.25em] mb-1 ${selectedPlan === 'PRO' ? 'text-indigo-600 dark:text-indigo-400' : 'text-purple-600 dark:text-purple-400'}`}>
                                {selectedPlan === 'PRO' ? t('subscription.upgrade.pro_title') : t('subscription.upgrade.pro_plus_title')} — {t('subscription.plan_headline')}
                            </div>
                            <p className="text-[12px] font-bold text-slate-700 dark:text-white/80 leading-snug">
                                {selectedPlan === 'PRO' ? t('subscription.plan_desc_pro') : t('subscription.plan_desc_plus')}
                            </p>
                        </div>
                    </div>

                    {/* Benefits list */}
                    <div className="space-y-3">
                        {currentBenefits.map((b, i) => {
                            const isExpanded = expandedBenefit === b.id;
                            return (
                                <motion.div
                                    key={b.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/10 rounded-[1.5rem] overflow-hidden shadow-sm transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                                >
                                    <button
                                        onClick={() => {
                                            selection();
                                            setExpandedBenefit(isExpanded ? null : b.id);
                                        }}
                                        className="flex items-center gap-3.5 p-3.5 w-full text-left bg-transparent"
                                    >
                                        <div className={`w-9 h-9 rounded-xl ${b.bg} flex items-center justify-center shrink-0 ${b.color}`}>
                                            <b.icon size={18} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-[10px] font-black uppercase tracking-widest ${b.color}`}>{b.label}</div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <Check size={14} className="text-emerald-500" strokeWidth={3} />
                                            <ChevronDown
                                                size={16}
                                                className={`text-slate-400 dark:text-white/20 transition-transform duration-300 block ${isExpanded ? 'rotate-180 text-indigo-500' : ''}`}
                                            />
                                        </div>
                                    </button>
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                            >
                                                <div className="px-5 pb-5 pt-0 ml-[3.25rem]">
                                                    <p className="text-[11px] font-medium text-slate-600 dark:text-white/60 leading-relaxed border-t border-slate-200/50 dark:border-white/10 pt-3">
                                                        {b.desc}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Quick checklist from locale */}
                    <div className="mt-5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/10 rounded-[2rem] p-5 grid grid-cols-2 gap-3 shadow-sm backdrop-blur-md">
                        {(() => {
                            const benefitsArr = t(selectedPlan === 'PRO' ? 'subscription.upgrade.benefits_pro' : 'subscription.upgrade.benefits_pro_plus', { returnObjects: true });
                            const benefitsList = Array.isArray(benefitsArr) ? benefitsArr : [];
                            return benefitsList.map((b: string, i: number) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${selectedPlan === 'PRO' ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'}`}>
                                        <Check size={9} strokeWidth={4} />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-600 dark:text-white/60 uppercase tracking-tight">{b}</span>
                                </div>
                            ));
                        })()}
                    </div>

                </motion.div>
            </AnimatePresence>

            {/* ── PAYMENT SECTION ─────────────────────────────────────────── */}
            <motion.div ref={paymentRef} className="mb-12 relative px-2">
                {/* Background Glows to match Home Style */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/20 blur-[100px] pointer-events-none animate-pulse" />

                <div className="relative z-10 bg-white dark:bg-(--color-bg-app) border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-premium overflow-hidden group">
                    {/* Inner liquid background layer */}
                    <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-fuchsia-500/5 opacity-40 pointer-events-none" />

                    {!paymentMethod ? (
                        <div className="space-y-8 relative z-10">
                            <div className="text-center">
                                <motion.div
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4"
                                    animate={{ boxShadow: ["0 0 0px rgba(99,102,241,0)", "0 0 15px rgba(99,102,241,0.3)", "0 0 0px rgba(99,102,241,0)"] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                    <Shield size={10} className="text-indigo-500" />
                                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">
                                        {t('subscription.upgrade.secure_encryption_active')}
                                    </span>
                                </motion.div>

                                <div className="flex flex-col items-center gap-1 mb-6">
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-sm">
                                            ${planPrice}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase italic font-mono">
                                            / {selectedPlan === 'PRO_PLUS' ? t('subscription.upgrade.lifetime_label') : t('subscription.upgrade.monthly_label')}
                                        </span>
                                    </div>
                                    <h4 className="text-[10px] font-black text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-linear-to-r dark:from-indigo-400 dark:via-fuchsia-400 dark:to-indigo-400 dark:text-animate-shimmer uppercase tracking-[0.2em]">
                                        {selectedPlan === 'PRO' ? t('subscription.upgrade.pro_title') : (isStandardPro ? t('subscription.upgrade.pro_plus_upgrade_title') || 'PRO+ UPGRADE' : t('subscription.upgrade.pro_plus_title'))}
                                    </h4>
                                </div>
                                <div className="w-12 h-1 bg-linear-to-r from-indigo-500 to-fuchsia-500 mx-auto rounded-full opacity-60" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => { selection(); setPaymentMethod('TON'); }}
                                    className="group relative h-24 bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.03] hover:bg-indigo-500/5 hover:border-indigo-500/30 hover:shadow-xl active:scale-95"
                                >
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                                        <Wallet size={22} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-500 dark:text-white/40 group-hover:text-slate-900 dark:group-hover:text-white tracking-widest uppercase transition-colors">{t('subscription.upgrade.ton_wallet')}</span>
                                </button>
                                <button
                                    onClick={() => { selection(); setPaymentMethod('CRYPTO'); }}
                                    className="group relative h-24 bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.03] hover:bg-emerald-500/5 hover:border-emerald-500/30 hover:shadow-xl active:scale-95"
                                >
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                                        <CreditCard size={22} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-500 dark:text-white/40 group-hover:text-slate-900 dark:group-hover:text-white tracking-widest uppercase transition-colors">{t('subscription.upgrade.usdt_trc20_address')}</span>
                                </button>
                            </div>
                            <div className="flex items-center justify-center gap-2 opacity-50 dark:opacity-30">
                                <Shield size={10} className="text-indigo-600 dark:text-indigo-400" />
                                <p className="text-[8px] text-slate-600 dark:text-white font-black uppercase tracking-[0.2em]">{t('subscription.upgrade.protocol_initialized')}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-white/5">
                                <button onClick={() => setPaymentMethod(null)} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white transition-colors">
                                    <ChevronLeft size={14} /> {t('subscription.upgrade.change_method')}
                                </button>
                                {formattedTime && (
                                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-white/10">
                                        <Clock size={10} className="text-indigo-600 dark:text-indigo-400" />
                                        <span className="text-[10px] font-black font-mono text-indigo-600 dark:text-indigo-400">{formattedTime}</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4">
                                {paymentMethod === 'TON' ? (
                                    <div className="space-y-6 text-center">
                                        <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-inner">
                                            <Wallet size={32} className="mx-auto text-indigo-600 dark:text-indigo-400 mb-4" />
                                            <div className="flex justify-center mb-4"><TonConnectButton /></div>
                                        </div>
                                        <button disabled={isLoading} onClick={handleTonPayment} className="w-full h-16 bg-linear-to-r from-indigo-600 via-blue-600 to-purple-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_15px_30px_-10px_rgba(99,102,241,0.5)] active:scale-95 transition-all hover:scale-[1.02] disabled:opacity-50">
                                            {isLoading ? <Loader2 className="animate-spin mx-auto" /> : t('subscription.upgrade.complete_payment')}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div onClick={() => { navigator.clipboard.writeText(adminUsdt); selection(); notification('success'); }} className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-center cursor-pointer group hover:border-emerald-500/50 transition-colors">
                                            <p className="text-[8px] font-black text-slate-400 dark:text-white/30 mb-2 uppercase tracking-widest">{t('subscription.upgrade.tap_to_copy')}</p>
                                            <code className="text-[9px] font-mono text-slate-800 dark:text-white/80 block bg-slate-200/50 dark:bg-black/40 p-2 rounded-lg mb-2 break-all">{adminUsdt}</code>
                                            <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase group-hover:animate-pulse">CLICK TO COPY</span>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[8px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1">{t('subscription.upgrade.paste_tx_hash')}</label>
                                            <input value={manualHash} onChange={(e) => setManualHash(e.target.value)} placeholder="0x..." className="w-full h-12 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-xs text-slate-900 dark:text-white text-center font-mono focus:border-indigo-500/50 outline-none transition-colors" />
                                        </div>
                                        <button onClick={handleManualSubmit} disabled={isLoading || !manualHash} className="w-full h-16 bg-linear-to-r from-indigo-600 via-blue-600 to-purple-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_15px_30px_-10px_rgba(99,102,241,0.5)] active:scale-95 transition-all hover:scale-[1.02] disabled:opacity-40">
                                            {isLoading ? <Loader2 className="animate-spin mx-auto" /> : t('subscription.upgrade.verify_transaction')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ── SOCIAL PROOF STATS ──────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-12 px-2">
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { value: '5,000+', label: t('subscription.stats.partners'), icon: Users, color: 'text-indigo-500 dark:text-blue-400', bg: 'bg-indigo-500/10' },
                        { value: '×100', label: t('subscription.stats.growth'), icon: TrendingUp, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
                        { value: '24/7', label: t('subscription.stats.ai_active'), icon: Bot, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10' },
                    ].map((stat) => (
                        <div key={stat.label} className="p-5 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-white/10 backdrop-blur-xl flex flex-col items-center text-center space-y-3 group transition-all duration-300 hover:scale-[1.03] hover:bg-slate-100/80 dark:hover:bg-white/5 shadow-sm">
                            <div className={`w-10 h-10 rounded-[1rem] shrink-0 ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon size={18} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                                <div className={`text-xl font-black tabular-nums tracking-tighter ${stat.color} drop-shadow-[0_2px_10px_currentColor] opacity-90`}>{stat.value}</div>
                                <div className="text-[9px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.2em] leading-tight mt-1">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* ── FAQ SECTION ─────────────────────────────────────────────── */}
            <section className="mb-10">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 mb-4">
                        <HelpCircle size={10} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">{t('subscription.faq.teaser_badge')}</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                        {t('subscription.faq.header_pre')} <span className="text-indigo-600 dark:text-indigo-400">{t('subscription.faq.header_highlight')}</span>
                    </h2>
                </div>
                <div className="space-y-3">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/10 rounded-[1.5rem] overflow-hidden shadow-sm transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
                            <button
                                onClick={() => { selection(); setExpandedFaq(expandedFaq === idx ? null : idx); }}
                                className="w-full p-4 flex items-center justify-between group text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-[1rem] bg-white dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm ${faq.iconColor}`}>
                                        <faq.icon size={16} />
                                    </div>
                                    <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight pr-4">{faq.q}</span>
                                </div>
                                <ChevronDown size={14} className={`transition-transform duration-300 shrink-0 ${expandedFaq === idx ? 'rotate-180 text-indigo-500' : 'text-slate-400 dark:text-white/30'}`} />
                            </button>
                            <AnimatePresence>
                                {expandedFaq === idx && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <p className="px-5 pb-5 pt-3 text-[11px] text-slate-600 dark:text-white/60 leading-relaxed font-medium border-t border-slate-200/50 dark:border-white/10">{faq.a}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </section>

            <div className="text-center opacity-10 text-[6px] font-mono tracking-[0.5em] mt-4">BUILD: 2026.02.20 | v1.8.1-ELITE</div>

            {/* ── SUCCESS / STATUS MODAL ──────────────────────────────────── */}
            <AnimatePresence>
                {status !== 'idle' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl">
                        <div className="vibing-premium-panel p-8 w-full max-w-sm text-center">
                            {status === 'pending' && <Loader2 size={48} className="text-amber-500 animate-spin mx-auto mb-6" />}
                            {status === 'success' && <Trophy size={48} className="text-emerald-500 mx-auto mb-6" />}
                            {status === 'manual_review' && <CheckCircle2 size={48} className="text-blue-500 mx-auto mb-6" />}
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-2">
                                {status === 'pending' ? 'VERIFYING...' : status === 'success' ? 'WELCOME TO PRO' : 'SUBMITTED'}
                            </h2>
                            <p className="text-[9px] text-slate-500 dark:text-white/40 uppercase font-black tracking-widest mb-8">
                                {status === 'pending' ? 'SCANNING BLOCKCHAIN FOR TRANSACTION' : 'YOUR ACCOUNT ACCESS IS BEING PROVISIONED'}
                            </p>
                            <button onClick={() => setStatus('idle')} className="w-full h-12 bg-indigo-600 text-white dark:bg-white dark:text-indigo-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">GOT IT</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
