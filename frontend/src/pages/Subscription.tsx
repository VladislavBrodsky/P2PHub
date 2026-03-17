import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Crown, CheckCircle2, Wallet, CreditCard,
    Loader2, Sparkles, Zap, ChevronDown, Trophy, Users,
    HelpCircle, Clock, Check, Globe, Shield, Share2, ChevronLeft,
    Flame, Brain, Rocket, Network, Star, Lock, Infinity as InfinityIcon, Target, TrendingUp, Bot,
    Send, BarChart2, Radio, X, Fingerprint, AlertTriangle, RefreshCw,
    ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTonConnectUI, TonConnectButton } from '@tonconnect/ui-react';
import { useUser } from '../context/UserContext';
import { apiClient } from '../api/client';
import { useHaptic } from '../hooks/useHaptic';
import { useConfig } from '../context/ConfigContext';
import { ROUTES } from '../utils/routes';
import { useNavigation } from '../hooks/useNavigation';
import { useUI } from '../context/UIContext';
import { useTabActive } from '../components/ui/TabPanel';

// --- Sub-components ---
import { FomoTimer, PaymentSessionTimer, StickyFomoHeader } from './Subscription/components/SubscriptionTimers';
import { SubscriptionFAQ } from './Subscription/components/SubscriptionFAQ';
import { SubscriptionPricing } from './Subscription/components/SubscriptionPricing';
import { SubscriptionBenefits } from './Subscription/components/SubscriptionBenefits';
import { SubscriptionPayment } from './Subscription/components/SubscriptionPayment';
import { SubscriptionStatusModal } from './Subscription/components/SubscriptionStatusModal';
import { SubscriptionActiveState } from './Subscription/components/SubscriptionActiveState';
import { ProfitMath } from './Subscription/components/ProfitMath';
import { KeyComparison } from './Subscription/components/KeyComparison';
import { SocialProofStats } from './Subscription/components/SocialProofStats';
import { TONLogo } from '../components/ui/CryptoIcons';
import { USDTLogo } from '../components/ui/USDTLogo';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useNotificationStore } from '../store/useNotificationStore';



export default function SubscriptionPage() {
    const { t } = useTranslation(['pro', 'marketing', 'common']);
    const { user, refreshUser } = useUser();
    const { config: globalConfig } = useConfig();
    const { selection, notification, impact } = useHaptic();
    const { navigateTo } = useNavigation();
    const [tonConnectUI] = useTonConnectUI();
    const { showNotification } = useNotificationStore();
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
    const isStandardPro = !!isPro && !isProPlus;

    const proPrice = 39;
    const proPlusPrice = 69;
    const upgradePrice = proPlusPrice - proPrice; // 30

    const paymentRef = React.useRef<HTMLDivElement>(null);
    const { setHeaderVisible, setFooterVisible, setNotificationsVisible } = useUI();
    const isActive = useTabActive();

    // UI Cleanup 
    useEffect(() => {
        if (isActive) {
            setHeaderVisible(false);
            setFooterVisible(false);
            setNotificationsVisible(false);
        } else {
            setHeaderVisible(true);
            setFooterVisible(true);
            setNotificationsVisible(true);
        }
        return () => {
            setHeaderVisible(true);
            setFooterVisible(true);
            setNotificationsVisible(true);
        };
    }, [isActive, setHeaderVisible, setFooterVisible, setNotificationsVisible]);

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

                if (manualPending || stripePending) {
                    console.log("[Subscription] Found pending transactions, but keeping UI idle as requested.");
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
        setIsLoading(true); impact('medium');
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
                showNotification({
                    title: t('pro:notifications.error'),
                    message: error.response?.data?.detail || t('common:error'),
                    type: 'error'
                });
            }
        }
        finally { setIsLoading(false); setIsSelectingCurrency(false); }
    };

    const handleStripePayment = async () => {
        if (isLoading) return;
        setIsLoading(true);
        setPaymentMethod('STRIPE');
        impact('medium');
        try {
            const res = await apiClient.post('/api/payment/stripe/session', { plan: selectedPlan });
            if (res.data.checkout_url) {
                // Set pending status BEFORE opening the link
                setStatus('pending');

                // Using Telegram.WebApp.openLink to open Stripe in a native overlay browser.
                // This natively respects safe areas and avoids the Mini App header overlap.
                if (window.Telegram?.WebApp && 'openLink' in window.Telegram.WebApp) {
                    (window.Telegram.WebApp as any).openLink(res.data.checkout_url);
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
                <SubscriptionActiveState
                    user={user}
                    t={t}
                    selection={selection}
                    navigateTo={navigateTo}
                    setSelectedPlan={setSelectedPlan}
                    setShowPaymentOptionsForPro={setShowPaymentOptionsForPro}
                    scrollToPayment={scrollToPayment}
                />
            ) : (
                <motion.div
                    key="purchase-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full relative"
                >
                    {/* --- BACK BUTTON --- */}
                    <button
                        onClick={() => { selection(); window.history.back(); }}
                        className="absolute left-4 top-[100px] z-50 w-8 h-8 rounded-full bg-slate-100/10 dark:bg-white/10 backdrop-blur-md border border-slate-200/20 dark:border-white/20 flex items-center justify-center text-slate-900/50 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/20 dark:hover:bg-white/20 transition-all active:scale-95 shadow-sm"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <div className="flex flex-col px-3 pb-24 pt-[110px] max-w-lg mx-auto overflow-x-hidden">
                        <div className="relative overflow-hidden rounded-xl bg-transparent dark:bg-bg-app border-none dark:border dark:border-white/10 shadow-none dark:shadow-premium-sm mb-5">
                            <div className="relative z-10 w-full p-4">
                                {/* #comment: Ambient Background Glows removed for Unified Background Continuity */}






                                {/* ── HERO / STATUS BOARD ─────────────────────────── */}

                                {/* ── PLAN SELECTION BLOCK ── */}
                                <SubscriptionPricing
                                    selectedPlan={selectedPlan}
                                    setSelectedPlan={setSelectedPlan}
                                    isStandardPro={isStandardPro ?? false}
                                    proPrice={39}
                                    upgradePrice={upgradePrice}
                                    proPlusPrice={proPlusPrice}
                                    selection={selection}
                                    t={t}
                                />
                            </div>


                            <ProfitMath t={t} />

                            {/* ── KEY COMPARISON GRID ───────────────────────────────────── */}
                            <KeyComparison
                                selectedPlan={selectedPlan}
                                t={t}
                                selection={selection}
                                setInfoModal={setInfoModal}
                            />

                            {/* ── PRIMARY CTA & CURRENCY PICKER ─────────────────────────── */}
                            <div className="mb-10 px-1 relative z-20">
                                <div className="relative w-full flex items-center justify-center gap-2 h-10 px-6 rounded-full font-bold text-label tracking-[0.15em] uppercase overflow-hidden">
                                    <AnimatePresence mode="wait">
                                        {!isSelectingCurrency ? (
                                            <motion.button
                                                key="subscription-action-btn"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => {
                                                    selection();
                                                    setIsSelectingCurrency(true);
                                                }}
                                                className={`group absolute inset-0 w-full h-full flex items-center justify-center gap-2 rounded-full transition-colors ${selectedPlan === 'PRO'
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
                                                className="w-full space-y-4"
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
                                </div>
                                <div id="currency-selector-anchor" className="absolute -top-20" />
                            </div>

                            <SectionHeader
                                badge={t('pro:subscription.benefits.badge')}
                                title={t('pro:subscription.benefits.title')}
                                description={t('pro:subscription.benefits.desc')}
                                className="mb-0 overflow-hidden h-0 opacity-0 pointer-events-none"
                            />

                            {/* ── BENEFITS SECTION ── */}
                            {/* <SubscriptionBenefits
                                selectedPlan={selectedPlan}
                                isStandardPro={!!isStandardPro}
                                currentBenefits={currentBenefits}
                                expandedBenefit={expandedBenefit}
                                setExpandedBenefit={setExpandedBenefit}
                                selection={selection}
                                t={t}
                            /> */}

                            {/* ── PAYMENT SECTION ── */}
                            <SubscriptionPayment
                                paymentRef={paymentRef}
                                selectedPlan={selectedPlan}
                                planPrice={planPrice}
                                isStandardPro={isStandardPro}
                                paymentMethod={paymentMethod}
                                setPaymentMethod={setPaymentMethod}
                                isLoading={isLoading}
                                sessionData={sessionData}
                                setSessionData={setSessionData}
                                manualHash={manualHash}
                                setManualHash={setManualHash}
                                status={status}
                                setStatus={setStatus}
                                handleTonPayment={handleTonPayment}
                                handleManualSubmit={handleManualSubmit}
                                handleStripePayment={handleStripePayment}
                                scrollToPayment={scrollToPayment}
                                selection={selection}
                                notification={notification}
                                t={t}
                                adminUsdt={adminUsdt}
                            />

                            <SocialProofStats t={t} />

                            <SectionHeader
                                badge={t('pro:subscription.faq.badge', 'SUPPORT')}
                                title={t('pro:subscription.faq.title')}
                                description={t('pro:subscription.faq.desc')}
                                className="mb-8"
                            />

                            {/* ── FAQ SECTION ── */}
                            <SubscriptionFAQ
                                expandedFaq={expandedFaq}
                                setExpandedFaq={setExpandedFaq}
                                faqs={faqs}
                                selection={selection}
                                t={t}
                            />

                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                onClick={async () => {
                                    impact('light');
                                    const prevStatus = isPro;
                                    await refreshUser();
                                    if (user?.is_pro && !prevStatus) {
                                        notification('success');
                                    } else {
                                        impact('rigid');
                                    }
                                }}
                                className="mx-auto flex items-center gap-2 px-4 py-2 mt-2 mb-6 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-colors active:scale-95"
                            >
                                <RefreshCw size={14} />
                                <span className="text-xs uppercase font-bold tracking-widest">{t('common:restore_purchases', 'Restore Purchases')}</span>
                            </motion.button>

                            <div className="text-center opacity-10 text-label font-mono tracking-[0.5em] mt-4">BUILD: 2026.02.20 | v1.8.15-ELITE</div>
                        </div>
                    </div>

                    <SubscriptionStatusModal
                        status={status}
                        setStatus={setStatus}
                        infoModal={infoModal}
                        setInfoModal={setInfoModal}
                        selectedPlan={selectedPlan}
                        selection={selection}
                        t={t}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
