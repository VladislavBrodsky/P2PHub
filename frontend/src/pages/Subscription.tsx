import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Crown, CheckCircle2, Wallet, CreditCard,
    Loader2, Sparkles, Zap, ChevronDown, Trophy, Users,
    HelpCircle, Clock, Check, Globe, Shield, Share2, ChevronLeft,
    Flame, Brain, Rocket, Network, Star, Lock, Infinity, Target, TrendingUp, Bot
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
    const [proStats, setProStats] = useState<{ sold: number; total: number } | null>(null);
    const [showPaymentOptionsForPro, setShowPaymentOptionsForPro] = useState(false);

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
        fetchStats();
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

    const formattedTime = useMemo(() => {
        if (timeLeft === null) return null;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, [timeLeft]);

    const planPrice = selectedPlan === 'PRO_PLUS' ? 69 : 39;
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
            <div className="flex flex-col items-center justify-center min-h-[85vh] px-8 text-center overflow-hidden relative">
                <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] blur-[150px] opacity-20 -z-10 animate-pulse ${isPlus ? 'bg-indigo-600' : 'bg-amber-500'}`} />
                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} className="relative mb-8">
                    <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl relative z-10 border border-white/30 backdrop-blur-sm bg-linear-to-br ${isPlus ? 'from-indigo-400 via-blue-600 to-indigo-800' : 'from-amber-300 via-orange-500 to-amber-700'}`}>
                        <Crown size={48} className="text-white fill-white/20" />
                    </div>
                </motion.div>
                <h1 className="text-3xl font-black mb-2 tracking-tighter text-slate-900 dark:text-white uppercase italic">
                    {isPlus ? t('subscription.pro_active.title_plus') : t('subscription.pro_active.title')}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-[9px] uppercase tracking-widest max-w-[250px] mb-10 opacity-70">
                    {isPlus ? t('subscription.pro_active.desc_plus') : t('subscription.pro_active.desc')}
                </p>
                <div className="w-full space-y-4 max-w-[300px]">
                    <div className="p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Sparkles size={18} className={isPlus ? 'text-indigo-400' : 'text-amber-400'} />
                            <div className="text-left">
                                <p className="text-[8px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest">{t('subscription.pro_active.lifetime')}</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white">{isLifetime ? 'LIFETIME ACCESS' : new Date(user.pro_expires_at!).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <CheckCircle2 size={16} className="text-emerald-500" />
                    </div>
                    <button
                        onClick={() => { selection(); window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'pro' })); }}
                        className={`w-full h-14 rounded-2xl font-black text-white text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 ${isPlus ? 'bg-linear-to-r from-indigo-600 to-purple-600' : 'bg-linear-to-r from-amber-500 to-orange-600'}`}
                    >
                        <Trophy size={16} />
                        {t('subscription.pro_active.command_center')}
                    </button>
                    {!isLifetime && (
                        <button onClick={() => setShowPaymentOptionsForPro(true)} className="text-[8px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors">
                            {t('subscription.upgrade.extend_membership')}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ─── PLAN BENEFITS ────────────────────────────────────────────────────────
    const proBenefits = [
        { icon: Brain, label: t('subscription.benefits.ai_studio'), desc: t('subscription.benefits.ai_studio_desc_pro'), color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10 dark:bg-indigo-500/20' },
        { icon: Network, label: t('subscription.benefits.network_levels'), desc: t('subscription.benefits.network_levels_desc_pro'), color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-500/20' },
        { icon: Zap, label: t('subscription.benefits.tokens'), desc: t('subscription.benefits.tokens_desc_pro'), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-500/20' },
        { icon: TrendingUp, label: t('subscription.benefits.cashback'), desc: t('subscription.benefits.cashback_desc_pro'), color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 dark:bg-purple-500/20' },
        { icon: Bot, label: t('subscription.benefits.tools'), desc: t('subscription.benefits.tools_desc_pro'), color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-500/20' },
        { icon: Target, label: t('subscription.benefits.growth_intel'), desc: t('subscription.benefits.growth_intel_desc'), color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 dark:bg-rose-500/20' },
    ];

    const proPlusBenefits = [
        { icon: Brain, label: t('subscription.benefits.ai_studio'), desc: t('subscription.benefits.ai_studio_desc_plus'), color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10 dark:bg-indigo-500/20' },
        { icon: Network, label: t('subscription.benefits.network_levels'), desc: t('subscription.benefits.network_levels_desc_plus'), color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-500/20' },
        { icon: Zap, label: t('subscription.benefits.tokens'), desc: t('subscription.benefits.tokens_desc_plus'), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-500/20' },
        { icon: TrendingUp, label: t('subscription.benefits.cashback'), desc: t('subscription.benefits.cashback_desc_plus'), color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 dark:bg-purple-500/20' },
        { icon: Bot, label: t('subscription.benefits.tools'), desc: t('subscription.benefits.tools_desc_plus'), color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-500/20' },
        { icon: Infinity, label: t('subscription.benefits.omni_sync'), desc: t('subscription.benefits.omni_sync_desc'), color: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-500/10 dark:bg-fuchsia-500/20' },
        { icon: Star, label: t('subscription.benefits.priority_ai'), desc: t('subscription.benefits.priority_ai_desc'), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-500/20' },
        { icon: Rocket, label: t('subscription.benefits.empire_access'), desc: t('subscription.benefits.empire_access_desc'), color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 dark:bg-rose-500/20' },
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
        <div className="flex flex-col px-4 pb-32 pt-2 max-w-lg mx-auto overflow-x-hidden">

            {/* ── HERO SECTION ────────────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 pt-6">
                <div className="flex flex-col items-center gap-4 mb-2">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-linear-to-br from-indigo-500 via-fuchsia-600 to-indigo-800 flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)] border-2 border-white/30 relative z-10">
                            <Crown size={32} className="text-white fill-white/20" />
                        </div>
                        <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse" />
                    </div>
                    <div className="px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">{t('subscription.upgrade.protocol_initialized')}</span>
                    </div>
                </div>
                <div className="mt-4 space-y-2">
                    <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-linear-to-r from-red-500/10 to-amber-500/10 border border-red-500/20 mb-2 animate-pulse">
                        <Flame size={10} className="text-red-500 mr-1.5" />
                        <span className="text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-[0.2em] font-mono">{t('subscription.upgrade.limited_offer')}</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic vibing-crystal-text leading-[0.8]">{t('common.pro_active')}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold max-w-[260px] mx-auto uppercase tracking-widest mt-4 leading-tight">{t('subscription.upgrade.desc')}</p>
                </div>

                {proStats && (
                    <div className="mt-8 w-full max-w-[240px] mx-auto">
                        <div className="flex justify-between text-[9px] font-black mb-2 text-slate-500 dark:text-white/40 uppercase tracking-tighter">
                            <span>{t('subscription.upgrade.lifetime_slots')}</span>
                            <span className="text-slate-900 dark:text-white font-black">{proStats.sold} / {proStats.total}</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-slate-300/50 dark:border-white/10">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(proStats.sold / proStats.total) * 100}%` }}
                                className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-fuchsia-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                            />
                        </div>
                    </div>
                )}
            </motion.div>

            {/* ── PLAN SELECTOR ───────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 mb-8">
                <div className="text-center space-y-2">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider border border-indigo-500/20"
                    >
                        <Sparkles size={12} fill="currentColor" />
                        {t('subscription.upgrade.badge')}
                    </motion.div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                        {t('subscription.upgrade.dominate_network')}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold max-w-[280px] mx-auto leading-snug">
                        {t('subscription.upgrade.subheadline')}
                    </p>
                </div>

                {/* Toggle */}
                <div className="relative bg-slate-100 dark:bg-white/5 p-1.5 rounded-[2.5rem] flex gap-1.5 border border-slate-200 dark:border-white/10 shadow-inner mt-2">
                    <div
                        className={`absolute inset-y-1.5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] rounded-[2rem] shadow-xl ${selectedPlan === 'PRO'
                            ? 'left-1.5 w-[calc(50%-0.375rem)] bg-white dark:bg-indigo-600 shadow-indigo-500/20'
                            : 'left-[calc(50%+0.375rem)] w-[calc(50%-0.375rem)] bg-linear-to-br from-indigo-500 via-purple-500 to-fuchsia-500 shadow-purple-500/30'
                            }`}
                    />
                    <button
                        onClick={() => { selection(); setSelectedPlan('PRO'); }}
                        className={`relative flex-1 py-4 flex flex-col items-center gap-0.5 z-10 transition-colors duration-300 ${selectedPlan === 'PRO' ? 'text-indigo-600 dark:text-white' : 'text-slate-400 dark:text-white/30'}`}
                    >
                        <span className="text-[9px] font-black tracking-[0.2em] uppercase opacity-70">{t('subscription.upgrade.pro_title')}</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-[14px] font-bold opacity-50">$</span>
                            <span className="text-3xl font-black tracking-tighter">39</span>
                        </div>
                        <span className="text-[8px] font-black opacity-40 uppercase tracking-widest">{t('subscription.upgrade.monthly_label')}</span>
                    </button>
                    <button
                        onClick={() => { selection(); setSelectedPlan('PRO_PLUS'); }}
                        className={`relative flex-1 py-4 flex flex-col items-center gap-0.5 z-10 transition-colors duration-300 ${selectedPlan === 'PRO_PLUS' ? 'text-white' : 'text-slate-400 dark:text-white/30'}`}
                    >
                        <span className="text-[9px] font-black tracking-[0.2em] uppercase opacity-70">{t('subscription.upgrade.pro_plus_title')}</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-[14px] font-bold opacity-50">$</span>
                            <span className="text-3xl font-black tracking-tighter">69</span>
                        </div>
                        <span className="text-[8px] font-black opacity-60 uppercase tracking-widest">{t('subscription.upgrade.lifetime_label')}</span>
                        {selectedPlan !== 'PRO_PLUS' && (
                            <div className="absolute -top-1.5 -right-1 px-2 py-0.5 bg-linear-to-r from-amber-400 to-orange-500 text-[8px] font-black text-white rounded-full border-2 border-slate-100 dark:border-slate-800 shadow-lg">
                                🔥 BEST
                            </div>
                        )}
                    </button>
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
                    <div className={`rounded-2xl p-4 mb-4 border relative overflow-hidden ${selectedPlan === 'PRO'
                        ? 'bg-linear-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-500/30'
                        : 'bg-linear-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/40 dark:to-fuchsia-950/30 border-purple-200 dark:border-purple-500/30'
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
                    <div className="space-y-2.5">
                        {currentBenefits.map((b, i) => (
                            <motion.div
                                key={b.label}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-white/8 shadow-sm"
                            >
                                <div className={`w-10 h-10 rounded-xl ${b.bg} flex items-center justify-center shrink-0 ${b.color}`}>
                                    <b.icon size={18} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${b.color}`}>{b.label}</div>
                                    <div className="text-[11px] font-bold text-slate-700 dark:text-white/80 leading-snug">{b.desc}</div>
                                </div>
                                <Check size={14} className="text-emerald-500 shrink-0 mt-1" strokeWidth={3} />
                            </motion.div>
                        ))}
                    </div>

                    {/* Quick checklist from locale */}
                    <div className="mt-4 bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/8 rounded-2xl p-4 grid grid-cols-2 gap-2">
                        {(() => {
                            const benefits = t(selectedPlan === 'PRO' ? 'subscription.upgrade.benefits_pro' : 'subscription.upgrade.benefits_pro_plus', { returnObjects: true }) as string[];
                            return Array.isArray(benefits) ? benefits.map((b: string, i: number) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${selectedPlan === 'PRO' ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'}`}>
                                        <Check size={9} strokeWidth={4} />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-600 dark:text-white/60 uppercase tracking-tight">{b}</span>
                                </div>
                            )) : null;
                        })()}
                    </div>

                    {/* CTA inside benefits */}
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={scrollToPayment}
                        className={`w-full mt-5 h-14 rounded-2xl font-black text-white text-[11px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 ${selectedPlan === 'PRO'
                            ? 'bg-linear-to-r from-indigo-500 to-purple-600 shadow-indigo-500/25'
                            : 'bg-linear-to-r from-purple-500 via-fuchsia-500 to-indigo-500 shadow-purple-500/25'
                            }`}
                    >
                        <Lock size={14} />
                        {t('subscription.upgrade.secure_slot_btn')} →
                    </motion.button>
                </motion.div>
            </AnimatePresence>

            {/* ── PAYMENT SECTION ─────────────────────────────────────────── */}
            <motion.div ref={paymentRef} className="mb-10">
                <div className="vibing-premium-panel p-6 shadow-premium-xl relative z-10 mx-auto max-w-[340px]">
                    {!paymentMethod ? (
                        <div className="space-y-8">
                            <div className="text-center relative">
                                <div className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.3em] mb-4">
                                    {t('subscription.upgrade.secure_encryption_active')}
                                </div>
                                <div className="flex items-baseline justify-center gap-1.5 mb-1">
                                    <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">${planPrice}</span>
                                    <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase italic font-mono">
                                        / {selectedPlan === 'PRO_PLUS' ? t('subscription.upgrade.lifetime_label') : t('subscription.upgrade.monthly_label')}
                                    </span>
                                </div>
                                <p className="text-[9px] text-slate-400 dark:text-white/30 font-black uppercase tracking-widest mb-3">
                                    {selectedPlan === 'PRO' ? t('subscription.upgrade.pro_title') : t('subscription.upgrade.pro_plus_title')}
                                </p>
                                <div className="w-16 h-1 bg-linear-to-r from-indigo-500 to-fuchsia-500 mx-auto rounded-full" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => { selection(); setPaymentMethod('TON'); }}
                                    className="group relative h-20 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-1.5 transition-all duration-300 hover:scale-[1.02] hover:border-indigo-500/40 hover:shadow-xl active:scale-95"
                                >
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                        <Wallet size={20} />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-900 dark:text-white tracking-widest uppercase">{t('subscription.upgrade.ton_wallet')}</span>
                                </button>
                                <button
                                    onClick={() => { selection(); setPaymentMethod('CRYPTO'); }}
                                    className="group relative h-20 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-1.5 transition-all duration-300 hover:scale-[1.02] hover:border-emerald-500/40 hover:shadow-xl active:scale-95"
                                >
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                        <CreditCard size={20} />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-900 dark:text-white tracking-widest uppercase">{t('subscription.upgrade.usdt_trc20_address')}</span>
                                </button>
                            </div>
                            <div className="flex items-center justify-center gap-2 opacity-30">
                                <Shield size={10} className="text-indigo-500" />
                                <p className="text-[8px] text-slate-500 dark:text-white font-black uppercase tracking-[0.2em]">{t('subscription.upgrade.protocol_initialized')}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-white/5">
                                <button onClick={() => setPaymentMethod(null)} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:text-white/40 dark:hover:text-white transition-colors">
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
                                        <button disabled={isLoading} onClick={handleTonPayment} className="w-full h-14 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50">
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
                                            <label className="text-[8px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest ml-1">{t('subscription.upgrade.paste_tx_hash')}</label>
                                            <input value={manualHash} onChange={(e) => setManualHash(e.target.value)} placeholder="0x..." className="w-full h-12 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-xs text-slate-900 dark:text-white text-center font-mono focus:border-indigo-500/50 outline-none transition-colors" />
                                        </div>
                                        <button onClick={handleManualSubmit} disabled={isLoading || !manualHash} className="w-full h-12 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-40">
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-10">
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { value: '5,000+', label: t('subscription.stats.partners'), icon: Users, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
                        { value: '×100', label: t('subscription.stats.growth'), icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
                        { value: '24/7', label: t('subscription.stats.ai_active'), icon: Bot, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white dark:bg-white/3 border border-slate-100 dark:border-white/8 rounded-2xl p-3 text-center shadow-sm">
                            <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-2 ${stat.color}`}>
                                <stat.icon size={16} />
                            </div>
                            <div className={`text-lg font-black tracking-tighter ${stat.color}`}>{stat.value}</div>
                            <div className="text-[8px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest leading-tight">{stat.label}</div>
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
                <div className="space-y-2">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                            <button
                                onClick={() => { selection(); setExpandedFaq(expandedFaq === idx ? null : idx); }}
                                className="w-full p-4 flex items-center justify-between group text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform ${faq.iconColor}`}>
                                        <faq.icon size={14} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight pr-4">{faq.q}</span>
                                </div>
                                <ChevronDown size={14} className={`transition-transform duration-300 shrink-0 ${expandedFaq === idx ? 'rotate-180 text-indigo-500' : 'text-slate-400 dark:text-white/30'}`} />
                            </button>
                            <AnimatePresence>
                                {expandedFaq === idx && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                        <p className="px-4 pb-4 pt-3 text-[11px] text-slate-600 dark:text-white/60 leading-relaxed font-medium border-t border-slate-100 dark:border-white/5">{faq.a}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </section>

            <div className="text-center opacity-10 text-[6px] font-mono tracking-[0.5em] mt-4">BUILD: 2026.02.18 | v1.8.0-ELITE</div>

            {/* ── SUCCESS / STATUS MODAL ──────────────────────────────────── */}
            <AnimatePresence>
                {status !== 'idle' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl">
                        <div className="vibing-premium-panel p-8 w-full max-w-sm text-center">
                            {status === 'pending' && <Loader2 size={48} className="text-amber-500 animate-spin mx-auto mb-6" />}
                            {status === 'success' && <Trophy size={48} className="text-emerald-500 mx-auto mb-6" />}
                            {status === 'manual_review' && <CheckCircle2 size={48} className="text-blue-500 mx-auto mb-6" />}
                            <h2 className="text-xl font-black text-white uppercase italic mb-2">
                                {status === 'pending' ? 'VERIFYING...' : status === 'success' ? 'WELCOME TO PRO' : 'SUBMITTED'}
                            </h2>
                            <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-8">
                                {status === 'pending' ? 'SCANNING BLOCKCHAIN FOR TRANSACTION' : 'YOUR ACCOUNT ACCESS IS BEING PROVISIONED'}
                            </p>
                            <button onClick={() => setStatus('idle')} className="w-full h-12 bg-white text-indigo-900 rounded-xl font-black text-[10px] uppercase tracking-widest">GOT IT</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
