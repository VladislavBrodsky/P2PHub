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
import { TONLogo } from '../components/ui/CryptoIcons';
import { USDTLogo } from '../components/ui/USDTLogo';
import { SectionHeader } from '../components/ui/SectionHeader';



export default function SubscriptionPage() {
    const { t } = useTranslation(['pro', 'marketing', 'common']);
    const { user, refreshUser } = useUser();
    const { config: globalConfig } = useConfig();
    const { selection, notification, impact } = useHaptic();
    const { navigateTo } = useNavigation();
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
                alert(`Submission failed: ${error.response?.data?.detail || 'Error'}`);
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
                        <div className={`fixed inset-0 w-full h-full pointer-events-none z-0 ${(user?.subscription_plan?.includes('PLUS')) ? 'bg-linear-to-b from-bg-app via-indigo-500/10 to-bg-deep' : 'bg-linear-to-b from-bg-app via-amber-500/8 to-bg-deep'}`} />

                        <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] blur-[120px] opacity-10 dark:opacity-30 z-0 pointer-events-none ${(user?.subscription_plan?.includes('PLUS')) ? 'bg-yellow-500' : 'bg-blue-600'}`} />
                        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] blur-[100px] opacity-15 dark:opacity-40 z-0 pointer-events-none animate-pulse ${(user?.subscription_plan?.includes('PLUS')) ? 'bg-yellow-400' : 'bg-blue-500'}`} />

                        <div className="relative z-10 w-full max-w-[300px] mx-auto flex flex-col items-center">
                            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} className="relative mb-5 pt-1">
                                <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-md bg-linear-to-br ${(user?.subscription_plan?.includes('PLUS')) ? 'from-yellow-300 via-yellow-400 to-orange-500' : 'from-blue-400 via-blue-600 to-blue-900'}`}>
                                    <Crown size={32} className="text-white fill-white/20 drop-shadow-md" />
                                </div>
                            </motion.div>

                            <h1 className="text-[32px] sm:text-[42px] font-black mb-2 tracking-tighter text-slate-900 dark:text-white leading-tight text-center max-w-[280px]">
                                {(user?.subscription_plan?.includes('PLUS')) ? t('pro:subscription.pro_active.title_plus') : t('pro:subscription.pro_active.title')}
                            </h1>

                            <p className="text-slate-500 dark:text-slate-400 text-body font-medium max-w-[260px] mx-auto leading-relaxed mb-8">
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
                                    onClick={() => { selection(); navigateTo(ROUTES.PRO); }}
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
                </motion.div>
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
                        className="absolute left-4 top-4 z-50 w-8 h-8 rounded-full bg-slate-100/10 dark:bg-white/10 backdrop-blur-md border border-slate-200/20 dark:border-white/20 flex items-center justify-center text-slate-900/50 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/20 dark:hover:bg-white/20 transition-all active:scale-95 shadow-sm"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <div className="flex flex-col px-3 pb-24 pt-(--header-total-offset,138px) max-w-lg mx-auto overflow-x-hidden">
                        <div className="sticky top-0 w-full flex items-center justify-center py-4 mb-2 z-50 px-4">
                            <div className="h-4" />
                        </div>

                        <div className="relative overflow-hidden rounded-xl bg-white dark:bg-bg-app border border-slate-200/60 dark:border-white/10 shadow-premium-sm mb-5">
                            <div className="relative z-10 w-full p-4">
                                {/* Ambient Background Glows - Mirroring Dashboard */}
                                <div className="absolute top-0 left-1/4 w-[150%] h-[150%] bg-blue-500/5 dark:bg-blue-600/10 blur-[120px] rounded-full animate-pulse pointer-events-none" />
                                <div className="absolute bottom-1/4 right-0 w-full h-full bg-indigo-500/5 dark:bg-indigo-600/10 blur-[100px] rounded-full animate-pulse pointer-events-none" />






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

                            {/* ── DEADLINE STICKY HEADER ── */}
                            <StickyFomoHeader t={t} />

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

                            <SectionHeader
                                badge={t('pro:subscription.benefits.badge')}
                                title={t('pro:subscription.benefits.title')}
                                description={t('pro:subscription.benefits.desc')}
                                className="mb-8"
                            />

                            {/* ── BENEFITS SECTION ── */}
                            <SubscriptionBenefits
                                selectedPlan={selectedPlan}
                                isStandardPro={!!isStandardPro}
                                currentBenefits={currentBenefits}
                                expandedBenefit={expandedBenefit}
                                setExpandedBenefit={setExpandedBenefit}
                                selection={selection}
                                t={t}
                            />

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

                            {/* ── SOCIAL PROOF STATS ──────────────────────────────────────── */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-12 px-1">
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: '5K+', label: t('subscription.stats.partners'), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                        { value: '×100', label: t('subscription.stats.growth'), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                        { value: '24/7', label: t('subscription.stats.ai_active'), icon: Bot, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                                    ].map((stat) => (
                                        <div key={stat.label} className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 backdrop-blur-xl flex flex-col items-center text-center gap-2 group transition-all duration-300 hover:scale-[1.05] shadow-xl">
                                            <div className={`w-9 h-9 rounded-xl shrink-0 ${stat.bg} flex items-center justify-center ${stat.color} group-hover:rotate-12 transition-transform`}>
                                                <stat.icon size={16} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex flex-col items-center gap-0.5">
                                                <div className={`text-button font-black tabular-nums tracking-tighter ${stat.color} leading-none`}>{stat.value}</div>
                                                <div className="text-[8px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest leading-tight">{stat.label}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

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
