import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Crown, CheckCircle2, Wallet, CreditCard,
    Loader2, Sparkles, Zap, ChevronDown, Trophy, Users,
    HelpCircle, Clock, Check, Globe, Shield, Share2, ChevronLeft,
    Flame, Brain, Rocket, Network, Star, Lock, Infinity as InfinityIcon, Target, TrendingUp, Bot,
    Send, BarChart2, Radio, X, Fingerprint, AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTonConnectUI, TonConnectButton } from '@tonconnect/ui-react';
import { useUser } from '../context/UserContext';
import { apiClient } from '../api/client';
import { useHaptic } from '../hooks/useHaptic';
import { useConfig } from '../context/ConfigContext';
import { useSystemClock } from '../hooks/usePerformance';
import { SectionHeader } from '../components/ui/SectionHeader';
import { TONLogo, USDTLogo } from '../components/ui/CryptoIcons';
import { useUI } from '../context/UIContext';

// --- ISOLATED PERFORMANCE COMPONENTS ---
const FomoTimer = React.memo(() => {
    const tick = useSystemClock();
    const [deadLine, setDeadLine] = useState({ h: 5, m: 22, s: 41 });

    useEffect(() => {
        setDeadLine(prev => {
            let { h, m, s } = prev;
            s--;
            if (s < 0) { s = 59; m--; }
            if (m < 0) { m = 59; h--; }
            if (h < 0) { h = 23; }
            return { h, m, s };
        });
    }, [tick]);

    return (
        <div className="relative z-10 flex items-center gap-1 font-mono shrink-0 bg-black/5 p-1 rounded-lg">
            {[deadLine.h, deadLine.m, deadLine.s].map((val, i) => (
                <React.Fragment key={i}>
                    <div className="bg-black text-yellow-400 rounded-md px-1.5 py-0.5 text-label font-bold min-w-[28px] text-center shadow-lg">
                        {val.toString().padStart(2, '0')}
                    </div>
                    {i < 2 && <span className="text-label font-bold text-black/80 animate-pulse">:</span>}
                </React.Fragment>
            ))}
        </div>
    );
});

const PaymentSessionTimer = React.memo(({ expiresAt, onExpire }: { expiresAt?: string; onExpire: () => void }) => {
    const tick = useSystemClock();
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        if (!expiresAt) { setTimeLeft(null); return; }
        const expires = new Date(expiresAt).getTime();
        const now = new Date().getTime();
        const diff = Math.max(0, Math.floor((expires - now) / 1000));
        setTimeLeft(diff);
        if (diff === 0) {
            onExpire();
        }
    }, [expiresAt, onExpire, tick]);

    const formattedTime = useMemo(() => {
        if (timeLeft === null) return null;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, [timeLeft]);

    if (!formattedTime) return null;

    return (
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-white/10">
            <Clock size={10} className="text-blue-600 dark:text-blue-400" />
            <span className="text-label font-bold font-mono text-blue-600 dark:text-blue-400">{formattedTime}</span>
        </div>
    );
});

export default function SubscriptionPage() {
    const { t } = useTranslation(['pro', 'marketing', 'common']);
    const { user, refreshUser } = useUser();
    const { config: globalConfig } = useConfig();
    const { selection, notification, impact } = useHaptic();
    const [tonConnectUI] = useTonConnectUI();
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'TON' | 'CRYPTO' | 'STRIPE' | null>(null);
    const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'manual_review'>('idle');
    const [manualHash, setManualHash] = useState('');
    const [sessionData, setSessionData] = useState<{ expires_at: string; transaction_id: number } | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<'PRO' | 'PRO_PLUS'>('PRO_PLUS');
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [expandedBenefit, setExpandedBenefit] = useState<string | null>(null);
    const [proStats, setProStats] = useState<{ sold: number; total: number } | null>(null);
    const [showPaymentOptionsForPro, setShowPaymentOptionsForPro] = useState(false);
    const [infoModal, setInfoModal] = useState<{ title: string; desc: string; icon: any; color: string } | null>(null);
    const [isSelectingCurrency, setIsSelectingCurrency] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const isPro = user?.is_pro;
    const isProPlus = (user?.subscription_plan || "").includes('PLUS');
    const isStandardPro = isPro && !isProPlus;

    const proPrice = 39;
    const proPlusPrice = 69;
    const upgradePrice = proPlusPrice - proPrice; // 30

    const paymentRef = React.useRef<HTMLDivElement>(null);
    const { setHeaderVisible, setFooterVisible, setNotificationsVisible } = useUI();

    // UI Cleanup 
    useEffect(() => {
        setHeaderVisible(false);
        setFooterVisible(false);
        setNotificationsVisible(false);
        return () => {
            setHeaderVisible(true);
            setFooterVisible(true);
            setNotificationsVisible(true);
        };
    }, [setHeaderVisible, setFooterVisible, setNotificationsVisible]);

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
                const stripePending = transactions.find((t: any) => t.status === 'pending' && t.network === 'STRIPE');

                if (manualPending) {
                    setStatus('manual_review');
                } else if (stripePending) {
                    // Start polling if we see a pending stripe transaction
                    setStatus('pending');
                }
            } catch (e) {
                console.error("Failed to fetch my transactions", e);
            }
        };
        fetchStats();
        fetchMyTransactions();

        // Small delay to let user state settle and prevent flashes
        const timer = setTimeout(() => setIsReady(true), 150);
        return () => clearTimeout(timer);
    }, []);

    // ─── POST-STRIPE RETURN AUTO-REFRESH ───
    useEffect(() => {
        // When the user closes the native Telegram link browser, the window regains visibility
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && paymentMethod === 'STRIPE' && status === 'pending') {
                console.log('[STRIPE] User returned. Refreshing user state...');
                await refreshUser();

                // Secondary check in case the webhook was delayed
                // Secondary check in case the webhook was delayed
                const checkStatus = async () => {
                    try {
                        const res = await apiClient.get('/api/payment/my-transactions');
                        const hasSuccess = res.data.some((t: any) => t.status === 'success' && t.network === 'STRIPE');

                        if (hasSuccess) {
                            setStatus('success');
                            notification('success');
                            return true;
                        }
                        return false;
                    } catch (e) {
                        console.error("Failed to check transaction status on return", e);
                        return false;
                    }
                };

                const initialSuccess = await checkStatus();

                // If not successful immediately, start a short polling mechanism (max 15 seconds)
                if (!initialSuccess) {
                    let attempts = 0;
                    const maxAttempts = 5; // 5 * 3s = 15s max polling

                    const pollInterval = setInterval(async () => {
                        attempts++;
                        console.log(`[STRIPE] Polling webhook status... Attempt ${attempts}/${maxAttempts}`);

                        const success = await checkStatus();
                        if (success || attempts >= maxAttempts) {
                            clearInterval(pollInterval);
                            if (!success && attempts >= maxAttempts) {
                                console.log('[STRIPE] Polling timed out. Returning to idle state.');
                                setStatus('idle'); // Give up and let the user try again or assume it failed
                            } else if (success) {
                                await refreshUser(); // Final refresh when succeed
                            }
                        }
                    }, 3000);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleVisibilityChange);
        };
    }, [paymentMethod, status, refreshUser, notification]);

    // Unified FOMO Effects - slotsLeft and deadLine removed from here
    // as they are now managed in isolated sub-components to prevent full-page re-renders.

    // Scroll locking for modals
    useEffect(() => {
        const scroller = document.getElementById('main-scroll-root');
        if (scroller) {
            if (infoModal || status !== 'idle') {
                scroller.style.overflow = 'hidden';
            } else {
                scroller.style.overflow = 'auto';
            }
        }
        return () => { if (scroller) scroller.style.overflow = 'auto'; };
    }, [infoModal, status]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('stripe') === 'success') {
            setStatus('success');
            notification('success');
            refreshUser();
            window.history.replaceState({}, '', window.location.pathname);
        } else if (urlParams.get('stripe') === 'cancel') {
            setStatus('idle');
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [notification, refreshUser]);

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
        window.addEventListener('trigger-auto-purchase', checkAutoActions);
        return () => {
            window.removeEventListener('focus', checkAutoActions);
            window.removeEventListener('trigger-auto-purchase', checkAutoActions);
        };
    }, [impact]);


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
        finally { setIsLoading(false); setIsSelectingCurrency(false); }
    };

    const handleManualSubmit = async () => {
        if (!manualHash) return;
        setIsLoading(true); impact('heavy');
        try {
            // 1. Try automated verification first
            const verifyRes = await apiClient.post('/api/payment/verify-usdt', {
                tx_hash: manualHash.trim(),
                network: 'TRC20' // Default to TRC20, we can add a toggle if needed
            });

            if (verifyRes.data.status === 'success') {
                setStatus('success');
                notification('success');
                await refreshUser();
            } else {
                // Fallback to manual review submission
                await apiClient.post('/api/payment/submit-manual', {
                    tx_hash: manualHash.trim(),
                    currency: 'USDT',
                    network: 'TRC20',
                    amount: planPrice
                });
                setStatus('manual_review');
                notification('success');
            }
        } catch (error: any) {
            console.error('USDT verification error:', error);
            // If verification failed (400), submit for manual review as backup
            try {
                await apiClient.post('/api/payment/submit-manual', {
                    tx_hash: manualHash.trim(),
                    currency: 'USDT',
                    network: 'TRC20',
                    amount: planPrice
                });
                setStatus('manual_review');
                notification('success');
            } catch (innerError) {
                alert(`Submission failed: ${error.response?.data?.detail || 'Error'}`);
            }
        }
        finally { setIsLoading(false); setIsSelectingCurrency(false); }
    };

    const handleStripePayment = async () => {
        if (isLoading) return;
        setIsLoading(true);
        setPaymentMethod('STRIPE');
        selection();
        try {
            const res = await apiClient.post('/api/payment/stripe/session', { plan: selectedPlan });
            if (res.data.checkout_url) {
                // Set pending status BEFORE opening the link so the visibility listener knows what to look for
                setStatus('pending');

                // Open Stripe Checkout in an external/in-app browser to avoid TWA UI overlap
                if (typeof window !== 'undefined' && window.Telegram?.WebApp?.openLink) {
                    window.Telegram.WebApp.openLink(res.data.checkout_url);
                } else {
                    window.location.assign(res.data.checkout_url);
                }
            } else {
                throw new Error('No checkout URL received');
            }
        } catch (error: any) {
            console.error('[STRIPE] Session creation failed:', error);
            setStatus('idle');
            notification('error');
            // Reset loading so user can try again if it was a transient error
            setIsLoading(false);
            setIsSelectingCurrency(false);
        }
    };

    const scrollToPayment = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        selection();
        paymentRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // ─── BENEFITS DATA MEMOIZATION ───
    const proBenefits = useMemo(() => [
        { id: 'ai', icon: Brain, label: t('pro:subscription.benefits.ai_studio'), desc: t('pro:subscription.benefits.ai_studio_desc_pro'), color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-500/20' },
        { id: 'network', icon: Network, label: t('pro:subscription.benefits.network_levels'), desc: t('pro:subscription.benefits.network_levels_desc_pro'), color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-500/20' },
        { id: 'tokens', icon: Zap, label: t('pro:subscription.benefits.tokens'), desc: t('pro:subscription.benefits.tokens_desc_pro'), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-500/20' },
        { id: 'cashback', icon: TrendingUp, label: t('pro:subscription.benefits.cashback'), desc: t('pro:subscription.benefits.cashback_desc_pro'), color: 'text-yellow-600 dark:text-yellow-500', bg: 'bg-indigo-500/10 dark:bg-indigo-500/20' },
        { id: 'tools', icon: Bot, label: t('pro:subscription.benefits.tools'), desc: t('pro:subscription.benefits.tools_desc_pro'), color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-500/20' },
        { id: 'intel', icon: Target, label: t('pro:subscription.benefits.growth_intel'), desc: t('pro:subscription.benefits.growth_intel_desc'), color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 dark:bg-rose-500/20' },
    ], [t]);

    const proPlusBenefits = useMemo(() => [
        { id: 'ai', icon: Brain, label: t('pro:subscription.benefits.ai_studio'), desc: t('pro:subscription.benefits.ai_studio_desc_plus'), color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-500/20' },
        { id: 'network', icon: Network, label: t('pro:subscription.benefits.network_levels'), desc: t('pro:subscription.benefits.network_levels_desc_plus'), color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 dark:bg-emerald-500/20' },
        { id: 'omni', icon: InfinityIcon, label: t('pro:subscription.benefits.omni_sync'), desc: t('pro:subscription.benefits.omni_sync_desc') + " " + t('pro:subscription.benefits.tg_multi_channel_desc'), color: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-500/10 dark:bg-fuchsia-500/20' },
        { id: 'priority', icon: Star, label: t('pro:subscription.benefits.priority_ai'), desc: t('pro:subscription.benefits.priority_ai_desc'), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 dark:bg-amber-500/20' },
        { id: 'analytics', icon: BarChart2, label: t('pro:subscription.benefits.content_analytics'), desc: t('pro:subscription.benefits.content_analytics_desc'), color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10 dark:bg-teal-500/20' },
        { id: 'empire', icon: Rocket, label: t('pro:subscription.benefits.empire_access'), desc: t('pro:subscription.benefits.empire_access_desc'), color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 dark:bg-rose-500/20' },
    ], [t]);

    const faqs = useMemo(() => [
        { icon: Clock, iconColor: 'text-blue-500 dark:text-blue-400', q: t('pro:subscription.faq.q1'), a: t('pro:subscription.faq.a1') },
        { icon: Zap, iconColor: 'text-amber-500 dark:text-amber-400', q: t('pro:subscription.faq.q2'), a: t('pro:subscription.faq.a2') },
        { icon: Globe, iconColor: 'text-emerald-500 dark:text-emerald-400', q: t('pro:subscription.faq.q3'), a: t('pro:subscription.faq.a3') },
        { icon: Shield, iconColor: 'text-purple-500 dark:text-purple-400', q: t('pro:subscription.faq.q4'), a: t('pro:subscription.faq.a4') },
        { icon: Network, iconColor: 'text-blue-500 dark:text-blue-400', q: t('pro:subscription.faq.q5'), a: t('pro:subscription.faq.a5') },
        { icon: TrendingUp, iconColor: 'text-rose-500 dark:text-rose-400', q: t('pro:subscription.faq.q6'), a: t('pro:subscription.faq.a6') },
        { icon: Share2, iconColor: 'text-fuchsia-500 dark:text-fuchsia-400', q: t('pro:subscription.faq.q7'), a: t('pro:subscription.faq.a7') },
    ], [t]);

    const currentBenefits = selectedPlan === 'PRO' ? proBenefits : proPlusBenefits;

    // ─── CONTENT BLOCKS ───
    // ─── CONTENT BLOCKS ───
    const proActiveContent = (
        <div
            className={`flex flex-col items-center min-h-dvh w-full px-6 pb-32 pt-[calc(var(--spacing-safe-top,32px)+1rem)] text-center relative overflow-hidden font-sans`}
        >
            <div className="w-full flex items-center justify-center mb-8 relative z-20">
                <span className="text-label font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-white/30">{t('pro:subscription.pro_active.title')}</span>
            </div>

            <div className={`absolute inset-0 w-full h-full pointer-events-none z-0 bg-bg-app`} />
            <div className={`fixed inset-0 w-full h-full pointer-events-none z-0 ${(user?.subscription_plan?.includes('PLUS')) ? 'bg-linear-to-b from-bg-app via-indigo-500/10 to-bg-deep' : 'bg-linear-to-b from-bg-app via-amber-500/8 to-bg-deep'}`} />

            <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] blur-[120px] opacity-10 dark:opacity-30 z-0 pointer-events-none ${(user?.subscription_plan?.includes('PLUS')) ? 'bg-yellow-500' : 'bg-blue-600'}`} />
            <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] blur-[100px] opacity-15 dark:opacity-40 z-0 pointer-events-none animate-pulse ${(user?.subscription_plan?.includes('PLUS')) ? 'bg-yellow-400' : 'bg-blue-500'}`} />

            <div className="relative z-10 w-full max-w-[300px] mx-auto flex flex-col items-center">
                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} className="relative mb-5 pt-1">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-md bg-linear-to-br ${(user?.subscription_plan?.includes('PLUS')) ? 'from-yellow-300 via-yellow-400 to-orange-500' : 'from-blue-400 via-blue-600 to-blue-900'}`}>
                        <Crown size={32} className="text-white fill-white/20 drop-shadow-md" />
                    </div>
                </motion.div>

                <h1 className="text-heading font-bold mb-1.5 tracking-tight text-slate-900 dark:text-white leading-tight text-center max-w-[240px]">
                    {(user?.subscription_plan?.includes('PLUS')) ? t('pro:subscription.pro_active.title_plus') : t('pro:subscription.pro_active.title')}
                </h1>

                <p className="text-slate-500 dark:text-slate-400 text-label font-medium max-w-[240px] mx-auto leading-relaxed mb-6">
                    {(user?.subscription_plan?.includes('PLUS')) ? t('pro:subscription.pro_active.desc_plus') : t('pro:subscription.pro_active.desc')}
                </p>

                <div className="w-full space-y-3">
                    <div className="p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl flex items-center justify-between shadow-[0_15px_30px_-10px_rgba(0,0,0,0.4)]">
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-[0.75rem] flex items-center justify-center bg-white/5 border border-white/10 shadow-inner shrink-0 ${(user?.subscription_plan?.includes('PLUS')) ? 'text-yellow-600' : 'text-blue-400'}`}>
                                <Sparkles size={16} />
                            </div>
                            <div className="text-left">
                                <p className="text-label font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest mb-0.5 whitespace-nowrap">{t('pro:subscription.pro_active.lifetime')}</p>
                                <p className="text-caption font-bold text-slate-900 dark:text-white tracking-tight whitespace-nowrap">{(!user?.pro_expires_at || user?.subscription_plan === 'PRO_LIFETIME') ? t('pro:subscription.pro_active.lifetime_access') : new Date(user?.pro_expires_at!).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-md">
                            <CheckCircle2 size={14} className="text-emerald-400" />
                        </div>
                    </div>

                    <button
                        onClick={() => { selection(); window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'pro' })); }}
                        className={`w-full h-11 rounded-full font-bold text-label tracking-widest uppercase shadow-[0_15px_30px_-5px_rgba(0,102,255,0.3)] flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:brightness-110 overflow-hidden ${(user?.subscription_plan?.includes('PLUS')) ? 'vibing-yellow-animated text-[#0a1000]' : 'vibing-blue-animated text-white'}`}
                    >
                        <Trophy size={13} />
                        {t('pro:subscription.pro_active.command_center')}
                    </button>

                    {!(user?.subscription_plan?.includes('PLUS')) && (
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
    );

    return (
        <AnimatePresence mode="wait">
            {!isReady ? (
                <motion.div
                    key="loading-shell"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center min-h-dvh w-full bg-bg-app"
                >
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
                </motion.div>
            ) : isPro && !showPaymentOptionsForPro ? (
                <motion.div
                    key="active-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full"
                >
                    {proActiveContent}
                </motion.div>
            ) : (
                <motion.div
                    key="purchase-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full"
                >
                    <div className="flex flex-col px-3 pb-24 pt-(--spacing-safe-top,32px) max-w-lg mx-auto overflow-x-hidden">
                        <div className="sticky top-0 w-full flex items-center justify-center py-4 mb-2 z-50 bg-white/80 dark:bg-bg-app/80 backdrop-blur-md px-4">
                            <div className="h-10" />
                        </div>

                        <div className="relative overflow-hidden rounded-xl bg-white dark:bg-bg-app border border-slate-200/60 dark:border-white/10 shadow-premium-sm mb-5">
                            <div className="relative z-10 w-full p-4">
                                {/* Background Depth Orbs */}
                                <div className="absolute top-0 -left-20 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none" />
                                <div className="absolute bottom-0 -right-20 w-64 h-64 bg-fuchsia-500/10 blur-[100px] pointer-events-none" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)] pointer-events-none" />






                                {/* ── HERO / STATUS BOARD ─────────────────────────── */}
                                <div className="relative px-6 pt-8 pb-10 text-center flex flex-col items-center">
                                    {/* Elite Crown Badge */}
                                    <div className="relative mb-6">
                                        <motion.div
                                            animate={{ y: [0, -4, 0] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                            className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 via-indigo-600 to-indigo-800 flex items-center justify-center shadow-[0_12px_32px_-8px_rgba(99,102,241,0.6)] border border-white/20 relative z-10"
                                        >
                                            <Crown size={32} className="text-white fill-white/10" />
                                        </motion.div>
                                        <div className="absolute inset-0 bg-indigo-500/30 blur-2xl animate-pulse scale-150 z-0" />
                                    </div>





                                    {/* Intensive FOMO Stats Board - Robust Responsive Layout */}
                                    {proStats && (
                                        <div className="w-full max-w-[320px] p-4 bg-white dark:bg-black/40 border border-slate-200/60 dark:border-white/10 rounded-xl shadow-sm relative overflow-hidden group mx-auto">
                                            <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-rose-500/5 pointer-events-none" />

                                            <div className="flex flex-row items-center justify-between gap-4 mb-3 relative z-10 px-1">
                                                <div className="flex flex-col items-start min-w-0">
                                                    <div className="flex items-center gap-1 text-label font-bold text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] whitespace-nowrap">
                                                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-ping shrink-0" />
                                                        {t('pro:subscription.upgrade.live_demand')}
                                                    </div>
                                                    <div className="text-[10px] font-black text-slate-900 dark:text-white tracking-tighter leading-tight uppercase mt-0.5 wrap-break-word">
                                                        {t('pro:subscription.upgrade.lifetime_slots')}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end shrink-0">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-heading font-bold text-slate-900 dark:text-white tabular-nums leading-none">
                                                            {proStats.total - proStats.sold}
                                                        </span>
                                                    </div>
                                                    <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mt-0.5 animate-pulse whitespace-nowrap">
                                                        {t('pro:subscription.upgrade.selling_fast')}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="relative h-2.5 bg-slate-100 dark:bg-black/60 rounded-full overflow-hidden p-[1.5px] border border-slate-200/40 dark:border-white/5 mx-1 mb-3">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(proStats.sold / proStats.total) * 100}%` }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                    className="h-full bg-linear-to-r from-indigo-600 via-fuchsia-600 to-orange-500 rounded-full relative shadow-[0_0_12px_rgba(79,70,229,0.3)]"
                                                >
                                                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent w-full h-full animate-shimmer-slide" />
                                                </motion.div>
                                            </div>

                                        </div>
                                    )}
                                </div>

                                {/* ── PLAN SELECTION BLOCK - Compacted ── */}
                                <div className="relative px-3 pb-6 border-t border-slate-100 dark:border-white/5 pt-6">
                                    <div className="text-center mb-6">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            className="inline-flex items-center justify-center gap-2 mb-2 px-2.5 py-1 bg-blue-500/5 border border-blue-500/10 rounded-full"
                                        >
                                            <div className="w-1 h-1 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)] animate-pulse" />
                                            <span className="text-label font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">{t('pro:subscription.upgrade.badge')}</span>
                                        </motion.div>

                                        <h2 className="text-heading sm:text-heading font-bold tracking-tight text-slate-900 dark:text-white leading-tight text-center mb-3 uppercase px-4 max-w-[340px] mx-auto">
                                            {t('pro:subscription.upgrade.dominate_network')}
                                        </h2>

                                        <p className="text-label sm:text-caption text-slate-500 dark:text-slate-400 font-bold leading-tight max-w-[280px] mx-auto opacity-70">
                                            {t('pro:subscription.upgrade.subheadline')}
                                        </p>
                                    </div>

                                    <div className="relative flex items-stretch gap-3 px-1.5">
                                        <motion.div
                                            layoutId="plan-selector-bg"
                                            className={`absolute inset-y-1.5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] rounded-xl shadow-[0_0_25px_rgba(255,255,255,0.1)] ${selectedPlan === 'PRO'
                                                ? 'left-1.5 w-[calc(50%-0.75rem)] vibing-yellow-animated border border-yellow-400/30 shadow-[0_0_20px_rgba(234,179,8,0.2)]'
                                                : 'left-[calc(50%+0.15rem)] w-[calc(50%-0.6rem)] vibing-crystal-purple-animated border border-white/20 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                                                }`}
                                        />

                                        {/* PRO Card Action */}
                                        <button
                                            onClick={() => { selection(); setSelectedPlan('PRO'); }}
                                            className={`relative flex-1 py-4 flex flex-col items-center gap-0.5 z-10 transition-all duration-300 ${selectedPlan === 'PRO' ? 'scale-105 active:scale-100' : 'opacity-40 scale-95 hover:opacity-70'}`}
                                        >
                                            <span className={`text-label font-bold tracking-widest uppercase mb-0.5 ${selectedPlan === 'PRO' ? 'text-black/60' : 'text-slate-400 dark:text-white/40'}`}>
                                                {t('pro:subscription.upgrade.pro_title')}
                                            </span>
                                            <div className="flex items-baseline gap-0.5">
                                                <span className={`text-caption font-bold ${selectedPlan === 'PRO' ? 'text-black/30' : 'text-slate-400/30'}`}>$</span>
                                                <span className={`text-3xl font-bold tracking-tighter leading-none ${selectedPlan === 'PRO' ? 'text-black' : 'text-slate-900/40 dark:text-white/40'}`}>
                                                    39
                                                </span>
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${selectedPlan === 'PRO' ? 'text-black/50' : 'text-slate-400/30 dark:text-white/20'}`}>
                                                {t('pro:subscription.upgrade.monthly_label')}
                                            </span>
                                        </button>

                                        {/* PRO+ Card Action */}
                                        <button
                                            onClick={() => { selection(); setSelectedPlan('PRO_PLUS'); }}
                                            className={`relative flex-1 py-4 flex flex-col items-center gap-0.5 z-10 transition-all duration-300 ${selectedPlan === 'PRO_PLUS' ? 'scale-105 active:scale-100' : 'opacity-40 scale-95 hover:opacity-70'}`}
                                        >
                                            <AnimatePresence>
                                                {selectedPlan === 'PRO_PLUS' && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10, scale: 0.5 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: -10, scale: 0.5 }}
                                                        className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-linear-to-r from-indigo-500 via-fuchsia-500 to-rose-500 text-white text-[8px] font-black rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)] z-20 flex items-center gap-1 border border-white/20 whitespace-nowrap"
                                                    >
                                                        <Zap size={7} className="fill-white animate-pulse" />
                                                        <span className="leading-none">{t('pro:subscription.upgrade.viral_badge')}</span>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <span className={`text-label font-bold tracking-[0.15em] uppercase mb-0.5 ${selectedPlan === 'PRO_PLUS' ? 'text-white/90' : 'text-slate-400 dark:text-white/40'}`}>
                                                {isStandardPro ? t('pro:subscription.upgrade.pro_plus_upgrade_title') : t('pro:subscription.upgrade.pro_plus_title')}
                                            </span>
                                            <div className="flex items-baseline gap-0.5">
                                                <span className={`text-caption font-bold ${selectedPlan === 'PRO_PLUS' ? 'text-white/50' : 'text-slate-400/30'}`}>$</span>
                                                <span className={`text-3xl font-bold tracking-tighter leading-none ${selectedPlan === 'PRO_PLUS' ? 'text-white' : 'text-slate-900/40 dark:text-white/40'}`}>
                                                    {isStandardPro ? upgradePrice : proPlusPrice}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${selectedPlan === 'PRO_PLUS' ? 'text-white/70' : 'text-slate-400/30 dark:text-white/20'}`}>
                                                {isStandardPro ? t('pro:subscription.upgrade.upgrade_label') : t('pro:subscription.upgrade.lifetime_label')}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ── DEADLINE STICKY HEADER ── */}
                            <div className="mb-4 mt-1 px-1 sticky top-[72px] z-40">
                                <div className="rounded-xl overflow-hidden px-3 py-2 bg-yellow-400/90 backdrop-blur-md border border-yellow-500/30 flex flex-row items-center justify-between gap-2 relative group shadow-lg">
                                    <div className="absolute inset-0 bg-linear-to-r from-yellow-400 via-yellow-300 to-yellow-500 opacity-100" />
                                    <div className="scanning-glow absolute inset-0 opacity-20 pointer-events-none" />

                                    <div className="relative z-10 flex items-center gap-2 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-black/10 flex items-center justify-center text-black shrink-0">
                                            <Clock size={14} className="animate-pulse" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[9px] font-bold text-black/60 uppercase tracking-widest leading-none truncate">{t('pro:subscription.pro_active.lifetime_access')}</span>
                                            <span className="text-label font-black text-black uppercase tracking-tighter leading-normal truncate">{t('marketing:income.math.cta_urgency', 'OFFER CLOSING')}</span>
                                        </div>
                                    </div>

                                    <FomoTimer />
                                </div>
                            </div>

                            {/* ── PROFIT MATH SECTION ── */}
                            <div className="mb-6 px-1">
                                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-emerald-500/20 p-5 space-y-4 shadow-xl shadow-slate-200/50 dark:shadow-[0_15px_40px_-10px_rgba(16,185,129,0.15)]">
                                    {/* Ambient glow */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl pointer-events-none" />

                                    <div className="relative flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                                        <div className="flex flex-col text-left">
                                            <div className="flex items-center gap-1 mb-0.5">
                                                <span className="text-label font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 opacity-90">
                                                    {t('marketing:income.math.subheading_part1')}
                                                </span>
                                            </div>
                                            <h4 className="text-label font-bold text-slate-900 dark:text-white leading-tight uppercase tracking-[0.1em]">
                                                {t('marketing:income.math.heading')}
                                            </h4>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-button font-bold text-emerald-600 dark:text-emerald-400 tracking-tighter mb-0.5">$43,200</div>
                                            <div className="text-label font-bold text-emerald-600/70 dark:text-emerald-500/60 uppercase tracking-widest -mt-1">{t('marketing:income.math.per_month')}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-none">
                                            <div className="text-label font-bold text-slate-500 dark:text-white/30 uppercase tracking-[0.2em] mb-0.5">{t('marketing:income.math.per_day')}</div>
                                            <div className="text-caption font-bold text-slate-900 dark:text-white tracking-tighter">$1,440</div>
                                        </div>
                                        <div className="p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-none">
                                            <div className="text-label font-bold text-slate-500 dark:text-white/30 uppercase tracking-[0.2em] mb-0.5">{t('marketing:income.math.per_year')}</div>
                                            <div className="text-caption font-bold text-slate-900 dark:text-white tracking-tighter">$518,400</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-label">
                                        <span className="text-slate-500 dark:text-white/30 font-bold italic">{t('marketing:income.math.formula_note')}</span>
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                                            <Flame className="w-2 h-2 text-rose-500 animate-pulse" />
                                            <span className="text-label font-bold text-rose-600 dark:text-rose-400 uppercase tracking-tight">{t('subscription.upgrade.selling_fast')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── KEY COMPARISON GRID ───────────────────────────────────── */}
                            <div className="mb-6 px-1">
                                <div className="flex items-center justify-between mb-3 px-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-3 bg-blue-600 rounded-full" />
                                        <h3 className="text-label sm:text-label font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">
                                            {t('pro:subscription.comparison.title')}
                                        </h3>
                                    </div>
                                    <div className="text-label font-bold text-blue-500/80 uppercase tracking-widest animate-pulse">
                                        {t('pro:subscription.comparison.tap_to_explore')}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-1.5 px-0.5">
                                    {[
                                        { icon: Network, label: t('pro:subscription.comparison.levels'), pro: '9', plus: '20', color: 'text-emerald-500', bg: 'bg-emerald-500/10', desc: t('pro:subscription.benefits.network_levels_desc_plus'), accent: 'emerald' },
                                        { icon: Zap, label: t('pro:subscription.comparison.tokens'), pro: '250', plus: '500', color: 'text-amber-500', bg: 'bg-amber-500/10', desc: t('pro:subscription.benefits.tokens_desc_plus'), accent: 'amber' },
                                        { icon: Send, label: t('pro:subscription.comparison.channels'), pro: '1', plus: '5', color: 'text-blue-500', bg: 'bg-blue-500/10', desc: t('pro:subscription.benefits.tg_multi_channel_desc'), accent: 'blue' },
                                    ].map((item, idx) => {
                                        const activeValue = selectedPlan === 'PRO' ? item.pro : item.plus;
                                        const inactiveValue = selectedPlan === 'PRO' ? item.plus : item.pro;
                                        return (
                                            <div key={idx} className="flex flex-col items-center gap-1.5 min-w-0">
                                                <button
                                                    onClick={() => { selection(); setInfoModal({ title: item.label, desc: item.desc, icon: item.icon, color: item.accent }); }}
                                                    className="w-full vibing-premium-panel bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 rounded-xl p-1 flex flex-col items-center gap-0.5 transition-all shadow-md active:scale-95 text-center min-w-0"
                                                >
                                                    <div className="circuit-decor opacity-0 group-hover:opacity-10 transition-opacity" />

                                                    <div className={`w-7 h-7 rounded-lg ${item.bg} ${item.color} flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:rotate-12 mt-1`}>
                                                        <item.icon size={12} strokeWidth={2.5} />
                                                    </div>
                                                    <span className="text-[8px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-tight w-full px-0.5 leading-tight">
                                                        {item.label}
                                                    </span>

                                                    <div className="flex items-center justify-center gap-1 mt-0.5 w-full">
                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 transition-all duration-500">{inactiveValue}</span>
                                                        <div className="w-px h-2.5 bg-slate-200 dark:bg-white/10 rounded-full shrink-0" />
                                                        <span className={`text-caption font-bold tracking-tighter transition-all duration-500 ${selectedPlan === 'PRO_PLUS' ? 'vibing-purple-text drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]' : 'vibing-yellow-text drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]'}`}>
                                                            {activeValue}
                                                        </span>
                                                    </div>
                                                </button>

                                                <div className="h-0 flex items-center justify-center relative -top-1">
                                                    <AnimatePresence>
                                                        {selectedPlan === 'PRO_PLUS' && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -5, scale: 0.5 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: -5, scale: 0.5 }}
                                                                className="z-30"
                                                            >
                                                                <span className="text-[7px] font-black bg-linear-to-r from-rose-500 to-pink-500 text-white px-1.5 py-0.5 tracking-tight rounded-full shadow-xs uppercase flex items-center gap-0.5">
                                                                    <Zap size={6} className="fill-white animate-pulse" />
                                                                    {t('marketing:income.math.turbo_badge', 'TURBO')}
                                                                </span>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── PRIMARY CTA & CURRENCY PICKER ─────────────────────────── */}
                            <div className="mb-10 px-1 relative z-20">
                                <AnimatePresence mode="wait">
                                    {!isSelectingCurrency ? (
                                        <motion.button
                                            key={`buy-btn-${selectedPlan}`}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                selection();
                                                setIsSelectingCurrency(true);
                                            }}
                                            className={`group relative w-full flex items-center justify-center gap-2 h-10 px-6 rounded-full font-bold text-label tracking-[0.15em] uppercase overflow-hidden transition-all active:scale-[0.98] hover:brightness-110 ${selectedPlan === 'PRO'
                                                ? 'vibing-blue-animated text-white shadow-[0_12px_25px_-5px_rgba(0,102,255,0.25)]'
                                                : 'vibing-yellow-animated text-[#0a1000] shadow-[0_12px_25px_-5px_rgba(255,215,0,0.25)]'
                                                }`}
                                        >
                                            <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                            <Lock size={12} className="group-hover:scale-110 transition-transform relative z-10" />
                                            <span className="relative z-10">
                                                {isProPlus
                                                    ? t('pro:subscription.pro_active.title_plus')
                                                    : (selectedPlan === 'PRO'
                                                        ? t('pro:subscription.upgrade.buy_pro_btn')
                                                        : (isStandardPro ? t('pro:subscription.upgrade.upgrade_to_pro_plus_btn') : t('pro:subscription.upgrade.buy_pro_plus_btn')))}
                                            </span>
                                        </motion.button>
                                    ) : (
                                        <motion.div
                                            key="currency-picker"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="space-y-4"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-label font-bold text-slate-400 dark:text-white/40 uppercase tracking-[0.2em]">{t('pro:subscription.upgrade.select_currency')}</span>
                                                <button
                                                    onClick={() => setIsSelectingCurrency(false)}
                                                    className="text-label font-bold text-blue-500 uppercase tracking-widest"
                                                >
                                                    {t('common:cancel', 'CANCEL')}
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    disabled={isLoading}
                                                    onClick={() => { selection(); setPaymentMethod('TON'); scrollToPayment(); setIsSelectingCurrency(false); }}
                                                    className="group h-20 bg-white dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all hover:border-blue-500/50 hover:bg-blue-500/5 active:scale-95 shadow-sm disabled:opacity-50"
                                                >
                                                    <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                                        {isLoading && paymentMethod === 'TON' ? <Loader2 className="w-5 h-5 animate-spin" /> : <TONLogo className="w-5 h-5" />}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-tighter">{t('pro:subscription.upgrade.ton_wallet')}</span>
                                                </button>
                                                <button
                                                    disabled={isLoading}
                                                    onClick={() => { selection(); setPaymentMethod('CRYPTO'); scrollToPayment(); setIsSelectingCurrency(false); }}
                                                    className="group h-20 bg-white dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5 active:scale-95 shadow-sm disabled:opacity-50"
                                                >
                                                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                                        {isLoading && paymentMethod === 'CRYPTO' ? <Loader2 className="w-5 h-5 animate-spin" /> : <USDTLogo className="w-5 h-5" />}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-tighter">{t('pro:subscription.upgrade.usdt_trc20_address')}</span>
                                                </button>
                                                <button
                                                    disabled={isLoading}
                                                    onClick={() => { handleStripePayment(); setIsSelectingCurrency(false); }}
                                                    className="group h-20 bg-white dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all hover:border-indigo-500/50 hover:bg-indigo-500/5 active:scale-95 shadow-sm disabled:opacity-50"
                                                >
                                                    <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                                        {isLoading && paymentMethod === 'STRIPE' ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-tighter">{t('pro:subscription.upgrade.stripe_card')}</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div id="currency-selector-anchor" className="absolute -top-20" />
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
                                    <div className={`rounded-2xl p-5 mb-5 border relative overflow-hidden shadow-premium backdrop-blur-md transition-all duration-500 ${selectedPlan === 'PRO'
                                        ? 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20 dark:border-blue-500/20'
                                        : 'bg-yellow-500/5 dark:bg-yellow-500/10 border-yellow-500/20 dark:border-yellow-500/20'
                                        }`}>

                                        {/* Shimmer Light Gradient Animation */}
                                        <motion.div
                                            animate={{
                                                x: ['-100%', '200%'],
                                                opacity: [0, 0.4, 0]
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: "linear",
                                                repeatDelay: 1.5
                                            }}
                                            className={`absolute inset-0 pointer-events-none bg-linear-to-r from-transparent ${selectedPlan === 'PRO' ? 'via-white/40' : 'via-yellow-300/40'} to-transparent skew-x-[-20deg] z-0`}
                                        />

                                        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-12 -mt-12 ${selectedPlan === 'PRO' ? 'bg-blue-500' : 'bg-yellow-500'} transition-colors duration-500`} />
                                        <div className="relative z-10">
                                            <div className={`text-label font-bold uppercase tracking-[0.25em] mb-1 ${selectedPlan === 'PRO' ? 'text-blue-600 dark:text-blue-400' : 'text-yellow-600 dark:text-yellow-500'}`}>
                                                {selectedPlan === 'PRO'
                                                    ? `${t('pro:subscription.upgrade.pro_title')} — ${t('pro:subscription.plan_headline')}`
                                                    : t('pro:subscription.plan_headline_plus')}
                                            </div>
                                            <p className="text-caption font-bold text-slate-700 dark:text-white/80 leading-snug">
                                                {selectedPlan === 'PRO' ? t('pro:subscription.plan_desc_pro') : t('pro:subscription.plan_desc_plus')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Benefits list */}
                                    <div className="grid grid-cols-1 gap-2.5">
                                        {currentBenefits.map((b, i) => {
                                            const isExpanded = expandedBenefit === b.id;
                                            return (
                                                <motion.div
                                                    key={b.id}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="relative group focus-within:ring-2 focus-within:ring-blue-500/50 rounded-2xl transition-all"
                                                >
                                                    <button
                                                        onClick={() => {
                                                            selection();
                                                            setExpandedBenefit(isExpanded ? null : b.id);
                                                        }}
                                                        className={`w-full text-left rounded-2xl border transition-all duration-300 ${isExpanded ? 'bg-white dark:bg-white/10 border-blue-500/30 shadow-lg' : 'bg-white/40 dark:bg-black/20 border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'}`}
                                                    >
                                                        <div className="px-4 py-2.5 flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-xl ${b.bg} flex items-center justify-center shrink-0 shadow-sm ${b.color} group-hover:scale-110 transition-transform`}>
                                                                    <b.icon size={14} />
                                                                </div>
                                                                <span className="text-label font-bold uppercase tracking-wider text-slate-700 dark:text-white/90">{b.label}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Check size={10} className="text-emerald-500 opacity-60" strokeWidth={4} />
                                                                <ChevronDown
                                                                    size={12}
                                                                    className={`text-slate-400 dark:text-white/20 transition-transform duration-500 ${isExpanded ? 'rotate-180 text-blue-500' : ''}`}
                                                                />
                                                            </div>
                                                        </div>
                                                    </button>
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                                                            >
                                                                <div className="px-4 pb-4 pt-0">
                                                                    <div className="pl-12 pr-4 py-3 border-t border-slate-100 dark:border-white/5">
                                                                        <p className="text-label font-medium text-slate-500 dark:text-white/50 leading-relaxed italic">
                                                                            {b.desc}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {/* Quick checklist - Compacted */}
                                    <div className="mt-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/10 rounded-xl p-3 grid grid-cols-1 gap-1.5 shadow-sm backdrop-blur-md">
                                        {(() => {
                                            const benefitsArr = t(selectedPlan === 'PRO' ? 'subscription.upgrade.benefits_pro' : 'subscription.upgrade.benefits_pro_plus', { returnObjects: true });
                                            const benefitsList = Array.isArray(benefitsArr) ? benefitsArr : [];
                                            return benefitsList.map((b: string, i: number) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${selectedPlan === 'PRO' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' : 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-500'}`}>
                                                        <Check size={8} strokeWidth={4} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-500 dark:text-white/60 uppercase tracking-tight leading-tight">{b}</span>
                                                </div>
                                            ));
                                        })()}
                                    </div>

                                </motion.div>
                            </AnimatePresence>

                            {/* ── PAYMENT SECTION ─────────────────────────────────────────── */}
                            <motion.div ref={paymentRef} className="mb-12 relative px-2">
                                {/* Background Glows to match Home Style */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/20 blur-[100px] pointer-events-none animate-pulse" />

                                <div className="relative z-10 bg-white dark:bg-bg-app border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-premium overflow-hidden group">
                                    {/* Inner liquid background layer */}
                                    <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-yellow-500/5 opacity-40 pointer-events-none" />

                                    {!paymentMethod ? (
                                        <div className="space-y-8 relative z-10">
                                            <div className="text-center">


                                                <div className="flex flex-col items-center gap-0.5 mb-5">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-4xl font-bold text-slate-900 dark:text-white tracking-tighter drop-shadow-sm">
                                                            ${planPrice}
                                                        </span>
                                                        <span className="text-label font-bold text-slate-400 dark:text-white/30 uppercase font-mono">
                                                            / {selectedPlan === 'PRO_PLUS' ? t('subscription.upgrade.lifetime_label') : t('subscription.upgrade.monthly_label')}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-label font-bold text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-linear-to-r dark:from-blue-400 dark:via-yellow-400 dark:to-blue-400 dark:text-animate-shimmer uppercase tracking-[0.2em]">
                                                        {selectedPlan === 'PRO' ? t('subscription.upgrade.pro_title') : (isStandardPro ? t('subscription.upgrade.pro_plus_upgrade_title') || 'PRO+ UPGRADE' : t('subscription.upgrade.pro_plus_title'))}
                                                    </h4>
                                                </div>
                                                <div className="w-12 h-1 bg-linear-to-r from-blue-500 to-yellow-500 mx-auto rounded-full opacity-60" />
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    disabled={isLoading}
                                                    onClick={() => { setPaymentMethod('TON'); }}
                                                    className="group relative h-20 bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 hover:scale-[1.02] hover:bg-blue-500/5 hover:border-blue-500/30 active:scale-95 disabled:opacity-50"
                                                >
                                                    <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                                        {isLoading && paymentMethod === 'TON' ? <Loader2 className="w-5 h-5 animate-spin" /> : <TONLogo className="w-5 h-5" />}
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-500 dark:text-white/30 group-hover:text-slate-900 dark:group-hover:text-white tracking-widest uppercase transition-colors">{t('subscription.upgrade.ton_wallet')}</span>
                                                </button>
                                                <button
                                                    disabled={isLoading}
                                                    onClick={() => { setPaymentMethod('CRYPTO'); }}
                                                    className="group relative h-20 bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 hover:scale-[1.02] hover:bg-emerald-500/5 hover:border-emerald-500/30 active:scale-95 disabled:opacity-50"
                                                >
                                                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                                                        {isLoading && paymentMethod === 'CRYPTO' ? <Loader2 className="w-5 h-5 animate-spin" /> : <USDTLogo className="w-5 h-5" />}
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-500 dark:text-white/30 group-hover:text-slate-900 dark:group-hover:text-white tracking-widest uppercase transition-colors">{t('subscription.upgrade.usdt_trc20_address')}</span>
                                                </button>
                                                <button
                                                    disabled={isLoading}
                                                    onClick={handleStripePayment}
                                                    className="group relative h-20 bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 hover:scale-[1.02] hover:bg-indigo-500/5 hover:border-indigo-500/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                                                        {isLoading && (paymentMethod === 'STRIPE' || !paymentMethod) ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-500 dark:text-white/30 group-hover:text-slate-900 dark:group-hover:text-white tracking-widest uppercase transition-colors">{t('subscription.upgrade.stripe_card')}</span>
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-center gap-2 opacity-50 dark:opacity-30">
                                                <Shield size={10} className="text-blue-600 dark:text-blue-400" />
                                                <p className="text-label text-slate-600 dark:text-white font-bold uppercase tracking-[0.2em]">{t('subscription.upgrade.protocol_initialized')}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-white/5">
                                                <button onClick={() => setPaymentMethod(null)} className="flex items-center gap-2 text-label font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white transition-colors">
                                                    <ChevronLeft size={14} /> {t('subscription.upgrade.change_method')}
                                                </button>
                                                <PaymentSessionTimer expiresAt={sessionData?.expires_at} onExpire={() => { setPaymentMethod(null); setSessionData(null); alert(t('subscription.alerts.expired')); }} />
                                            </div>
                                            <div className="mt-4">
                                                {paymentMethod === 'TON' ? (
                                                    <div className="space-y-6 text-center">
                                                        <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-inner">
                                                            <Wallet size={32} className="mx-auto text-blue-600 dark:text-blue-400 mb-4" />
                                                            <div className="flex justify-center mb-4"><TonConnectButton /></div>
                                                        </div>
                                                        <button disabled={isLoading} onClick={handleTonPayment} className={`w-full h-12 rounded-full font-bold text-caption uppercase tracking-widest shadow-[0_15px_30px_-5px_rgba(0,102,255,0.3)] active:scale-[0.98] transition-all hover:scale-[1.02] hover:brightness-110 disabled:opacity-50 ${selectedPlan === 'PRO' ? 'vibing-blue-animated text-white' : 'vibing-yellow-animated text-[#0a1000]'}`}>
                                                            {isLoading ? <Loader2 className="animate-spin mx-auto" /> : t('subscription.upgrade.complete_payment')}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-5">
                                                        {/* STEP 1: COPY ADDRESS */}
                                                        <div className="relative group">
                                                            <div className="absolute -left-3 top-0 bottom-0 w-1 bg-emerald-500 rounded-full opacity-50" />
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white text-label font-bold flex items-center justify-center shadow-lg">1</div>
                                                                    <span className="text-label font-bold text-slate-900 dark:text-white uppercase tracking-widest">{t('pro:subscription.upgrade.steps.copy_address')}</span>
                                                                </div>
                                                                <div
                                                                    onClick={() => { navigator.clipboard.writeText(adminUsdt); selection(); notification('success'); }}
                                                                    className="vibing-premium-panel bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 p-4 cursor-pointer group hover:border-emerald-500/50 transition-all active:scale-[0.98] shadow-sm"
                                                                >
                                                                    <p className="text-label font-bold text-slate-400 dark:text-white/30 mb-2 uppercase tracking-[0.2em]">{t('subscription.upgrade.tap_to_copy')}</p>
                                                                    <div className="bg-white dark:bg-black/40 p-3 rounded-xl mb-2 flex items-center gap-3 border border-slate-100 dark:border-white/5">
                                                                        <code className="text-label font-mono text-slate-800 dark:text-white/80 break-all flex-1">{adminUsdt}</code>
                                                                        <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-md shrink-0">
                                                                            <Share2 size={14} />
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-label font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-center block w-full group-hover:animate-pulse">{t('pro:subscription.upgrade.tap_to_copy')}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* STEP 2: PASTE HASH */}
                                                        <div className="relative group">
                                                            <div className="absolute -left-3 top-0 bottom-0 w-1 bg-blue-500 rounded-full opacity-50" />
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-label font-bold flex items-center justify-center shadow-lg">2</div>
                                                                    <span className="text-label font-bold text-slate-900 dark:text-white uppercase tracking-widest">{t('pro:subscription.upgrade.steps.paste_hash')}</span>
                                                                </div>

                                                                {/* CRITICAL INSTRUCTION ALERT */}
                                                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-1 flex gap-2 items-start animate-pulse">
                                                                    <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                                                    <p className="text-label font-bold text-amber-600 dark:text-amber-500 uppercase leading-normal tracking-tight">
                                                                        {t('pro:subscription.upgrade.final_instruction')}
                                                                    </p>
                                                                </div>

                                                                <div className="vibing-premium-panel bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 p-5 shadow-sm">
                                                                    <div className="relative mb-3">
                                                                        <input
                                                                            value={manualHash}
                                                                            onChange={(e) => setManualHash(e.target.value)}
                                                                            placeholder="0x..."
                                                                            className="w-full h-12 bg-white dark:bg-black/40 border-2 border-slate-200 dark:border-white/10 rounded-2xl px-4 text-xs text-slate-900 dark:text-white text-center font-mono focus:border-blue-500 outline-none transition-all shadow-inner"
                                                                        />
                                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                                                                            <Fingerprint size={16} />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 px-2">
                                                                        <HelpCircle size={10} className="text-slate-400 shrink-0" />
                                                                        <p className="text-label text-slate-400 dark:text-white/30 font-bold uppercase leading-tight">
                                                                            {t('pro:subscription.upgrade.hash_help')}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={handleManualSubmit}
                                                            disabled={isLoading || !manualHash || status === 'manual_review'}
                                                            className={`w-full h-14 rounded-xl font-bold text-caption uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all hover:scale-[1.02] hover:brightness-110 disabled:opacity-30 relative overflow-hidden group ${selectedPlan === 'PRO' ? 'vibing-blue-animated text-white' : 'vibing-yellow-animated text-[#0a1000]'}`}
                                                        >
                                                            <div className="absolute inset-x-0 top-0 h-1/2 bg-white/10 -skew-y-12 -translate-y-full group-hover:translate-y-[200%] transition-transform duration-1000" />
                                                            <div className="flex items-center justify-center gap-3">
                                                                {isLoading ? <Loader2 className="animate-spin" /> : (
                                                                    <>
                                                                        <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
                                                                        <span>{status === 'manual_review' ? t('pro:subscription.upgrade.pending_review') : t('pro:subscription.upgrade.verify_transaction')}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </button>

                                                        {/* HELP SECTION */}
                                                        <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-white/2 border border-blue-500/10 dark:border-white/5 text-center">
                                                            <p className="text-label font-bold text-blue-600/60 dark:text-blue-400/50 uppercase tracking-[0.2em] mb-1">{t('pro:subscription.upgrade.help_title')}</p>
                                                            <p className="text-label text-slate-500 dark:text-white/40 font-medium">{t('pro:subscription.upgrade.help_desc')}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* ── SOCIAL PROOF STATS ──────────────────────────────────────── */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-12 px-1">
                                <div className="grid grid-cols-3 gap-1.5">
                                    {[
                                        { value: '5K+', label: t('subscription.stats.partners'), icon: Users, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-500/10' },
                                        { value: '×100', label: t('subscription.stats.growth'), icon: TrendingUp, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
                                        { value: '24/7', label: t('subscription.stats.ai_active'), icon: Bot, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10' },
                                    ].map((stat) => (
                                        <div key={stat.label} className="p-2 rounded-xl bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-white/10 backdrop-blur-xl flex flex-col items-center text-center gap-1 group transition-all duration-300 hover:scale-[1.03] shadow-sm">
                                            <div className={`w-7 h-7 rounded-lg shrink-0 ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                                                <stat.icon size={12} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <div className={`text-caption font-bold tabular-nums tracking-tighter ${stat.color} opacity-90 leading-none`}>{stat.value}</div>
                                                <div className="text-[7px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest leading-tight mt-0.5">{stat.label}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* ── FAQ SECTION ─────────────────────────────────────────────── */}
                            <section className="mb-10 pt-[128px]">
                                <SectionHeader
                                    badge={t('subscription.faq.teaser_badge')}
                                    title={<>{t('subscription.faq.header_pre')} <span className="text-blue-600 dark:text-blue-400">{t('subscription.faq.header_highlight')}</span></>}
                                    className="mb-8"
                                />
                                <div className="space-y-3">
                                    {faqs.map((faq, idx) => (
                                        <div key={idx} className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/10 rounded-xl overflow-hidden shadow-sm transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
                                            <button
                                                onClick={() => { selection(); setExpandedFaq(expandedFaq === idx ? null : idx); }}
                                                className="w-full p-4 flex items-center justify-between group text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-[1rem] bg-white dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm ${faq.iconColor}`}>
                                                        <faq.icon size={16} />
                                                    </div>
                                                    <span className="text-label font-bold text-slate-900 dark:text-white uppercase tracking-tight pr-4">{faq.q}</span>
                                                </div>
                                                <ChevronDown size={14} className={`transition-transform duration-300 shrink-0 ${expandedFaq === idx ? 'rotate-180 text-blue-500' : 'text-slate-400 dark:text-white/30'}`} />
                                            </button>
                                            <AnimatePresence>
                                                {expandedFaq === idx && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <p className="px-5 pb-5 pt-3 text-label text-slate-600 dark:text-white/60 leading-relaxed font-medium border-t border-slate-200/50 dark:border-white/10">{faq.a}</p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <div className="text-center opacity-10 text-label font-mono tracking-[0.5em] mt-4">BUILD: 2026.02.20 | v1.8.15-ELITE</div>
                        </div>
                    </div>

                    {/* ── SUCCESS / STATUS MODAL ──────────────────────────────────── */}
                    {typeof document !== 'undefined' && createPortal(
                        <AnimatePresence>
                            {(status !== 'idle' || infoModal) && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
                                    {infoModal ? (
                                        <div className="vibing-premium-panel p-5 w-full max-w-[280px] rounded-2xl text-center relative overflow-hidden shadow-2xl border-white/20">
                                            <div className="circuit-decor opacity-30" />
                                            <div className="scanning-glow absolute inset-0 opacity-20 pointer-events-none" />
                                            <div className={`absolute top-0 right-0 w-48 h-48 blur-[80px] rounded-full opacity-20 -mr-20 -mt-20 ${infoModal.color === 'emerald' ? 'bg-emerald-500' : infoModal.color === 'amber' ? 'bg-amber-500' : 'bg-blue-500'}`} />

                                            <div className="relative z-10 flex flex-col items-center">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xl border border-white/20 backdrop-blur-md bg-linear-to-br ${infoModal.color === 'emerald' ? 'from-emerald-400 to-emerald-600' : infoModal.color === 'amber' ? 'from-amber-400 to-amber-600' : 'from-blue-400 to-blue-600'}`}>
                                                    {React.createElement(infoModal.icon, { size: 24, className: "text-white drop-shadow-md" })}
                                                </div>
                                                <h3 className={`text-lg font-bold uppercase mb-2 tracking-tighter leading-none ${infoModal.color === 'emerald' ? 'text-emerald-500' : infoModal.color === 'amber' ? 'text-amber-500' : 'text-blue-500'}`}>{infoModal.title}</h3>
                                                <div className="px-1 mb-6">
                                                    <p className="text-label text-slate-600 dark:text-white/70 uppercase font-bold tracking-widest leading-normal overflow-y-auto max-h-[100px] scrollbar-hide">{infoModal.desc}</p>
                                                </div>
                                                <button
                                                    onClick={() => { selection(); setInfoModal(null); }}
                                                    className={`w-full h-10 rounded-full font-bold text-label uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl border border-white/10 ${infoModal.color === 'emerald' ? 'vibing-emerald-animated text-white' : infoModal.color === 'amber' ? 'vibing-yellow-animated text-[#0a1000]' : 'vibing-blue-animated text-white'}`}
                                                >
                                                    {t('common:close')}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="vibing-premium-panel p-5 w-full max-w-[280px] rounded-2xl text-center">
                                            {status === 'pending' && <Loader2 size={32} className="text-amber-500 animate-spin mx-auto mb-4" />}
                                            {status === 'success' && <Trophy size={32} className="text-emerald-500 mx-auto mb-4" />}
                                            {status === 'manual_review' && <CheckCircle2 size={32} className="text-blue-500 mx-auto mb-4" />}
                                            <h2 className="text-md font-bold text-slate-900 dark:text-white uppercase mb-2">
                                                {status === 'pending' ? t('pro:subscription.status.verifying') : status === 'success' ? (selectedPlan === 'PRO_PLUS' ? t('pro:subscription.status.welcome_pro_plus') : t('pro:subscription.status.welcome_pro')) : t('pro:subscription.status.submitted')}
                                            </h2>
                                            <p className="text-label text-slate-500 dark:text-white/40 uppercase font-bold tracking-widest mb-6 px-4">
                                                {status === 'pending' ? t('pro:subscription.status.verifying_p') : status === 'success' ? (selectedPlan === 'PRO_PLUS' ? t('pro:subscription.status.welcome_pro_plus_p') : t('pro:subscription.status.welcome_pro_p')) : t('pro:subscription.status.submitted_p')}
                                            </p>
                                            <button onClick={() => setStatus('idle')} className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-indigo-900 rounded-full font-bold text-label uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)] transition-all active:scale-95">{t('pro:subscription.status.got_it')}</button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>,
                        document.body
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
