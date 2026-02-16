import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, CheckCircle2, Wallet, CreditCard, ChevronRight, Loader2, Sparkles, Send, Zap, Rocket, Bot } from 'lucide-react';
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
    const { selection, notification } = useHaptic();
    const [tonConnectUI] = useTonConnectUI();
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'TON' | 'CRYPTO' | null>(null);
    const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'manual_review'>('idle');
    const [manualHash, setManualHash] = useState('');
    const [sessionData, setSessionData] = useState<{ expires_at: string; transaction_id: number } | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    // #comment: Timer logic to calculate and update remaining time for the payment session.
    // This provides urgency and clarity to the user about their payment window.
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

    const proPrice = 39; // Base price
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
                amount: proPrice
            });

            const { amount_ton, address } = sessionRes.data;

            const tx = {
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [
                    {
                        address: address,
                        amount: Math.ceil(amount_ton * 10 ** 9).toString(),
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
            if (error.response?.status === 400) {
                alert(t('subscription.alerts.failed'));
            }
            setStatus('idle');
            notification('error');
        } finally {
            setIsLoading(false);
        }


    };

    const handleManualSubmit = async () => {
        setIsLoading(true);
        try {
            await apiClient.post('/api/payment/submit-manual', {
                tx_hash: manualHash?.trim() || null,
                currency: 'USDT',
                network: 'TRC20',
                amount: proPrice
            });
            setStatus('manual_review');
            notification('success');
        } catch (error: any) {
            console.error('Manual submission error:', error);
            const errorMessage = error.response?.data?.detail || error.message || 'Submission failed';
            alert(`Submission failed: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (user?.is_pro) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center overflow-hidden">
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="relative mb-8"
                >
                    <div className="absolute inset-0 bg-amber-400 blur-3xl opacity-30 animate-pulse" />
                    <div className="w-32 h-32 rounded-full bg-linear-to-br from-amber-300 via-orange-500 to-amber-600 flex items-center justify-center shadow-[0_0_50px_rgba(251,191,36,0.4)] relative z-10">
                        <Crown size={64} className="text-white fill-white/20 drop-shadow-lg" />
                    </div>
                    {/* Floating Orbs */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute -top-4 -right-4 w-12 h-12 bg-indigo-500 rounded-full blur-xl opacity-40"
                    />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-black mb-4 tracking-tighter text-slate-900 dark:text-white"
                >
                    <Trans i18nKey="subscription.pro_active.title">
                        WELCOME TO THE <span className="text-linear-to-r from-amber-400 to-orange-600 bg-clip-text text-transparent">ELITE</span>
                    </Trans>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed max-w-[280px] mb-10"
                >
                    {t('subscription.pro_active.desc')}
                </motion.p>

                <div className="w-full space-y-4 max-w-xs">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Sparkles size={20} className="text-amber-500" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-bold opacity-50 uppercase">{t('subscription.pro_active.active_until')}</p>
                                <p className="text-sm font-black">{user.pro_expires_at ? new Date(user.pro_expires_at).toLocaleDateString() : t('subscription.pro_active.lifetime')}</p>
                            </div>
                        </div>
                        <CheckCircle2 className="text-emerald-500" />
                    </div>

                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'pro' }))}
                        className="w-full h-16 bg-linear-to-r from-indigo-500 to-purple-700 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        {t('subscription.pro_active.command_center')}
                        <Sparkles size={20} />
                    </button>

                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'partner' }))}
                        className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl font-black text-slate-500 dark:text-slate-400 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        {t('subscription.pro_active.explore_empire')}
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col px-4 md:px-6 pb-32 pt-4">
            {/* Promo Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-linear-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 mb-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-500">{t('subscription.upgrade.badge')}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter leading-none">
                    <Trans i18nKey="subscription.upgrade.title">
                        Upgrade to <span className="text-linear-to-br from-amber-400 via-orange-500 to-amber-600 bg-clip-text text-transparent">PRO</span>
                    </Trans>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed max-w-[280px] mx-auto opacity-80">
                    {t('subscription.upgrade.desc')}
                </p>
            </motion.div>

            {/* PRO Arsenal Section */}
            <div className="mb-12">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter flex items-center justify-center gap-3">
                        {t('subscription.arsenal.title')}
                        <Zap size={28} className="text-amber-500 fill-amber-500/20" />
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-10">
                        {t('subscription.arsenal.subtitle')}
                    </p>

                    {/* Marketing Pitch / Sale on Start */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-linear-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 text-white mb-10 text-left relative overflow-hidden shadow-2xl shadow-indigo-500/30"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Sparkles size={120} />
                        </div>
                        <h3 className="text-2xl font-black mb-4 leading-tight">
                            {t('subscription.arsenal.pitch.title')}
                        </h3>
                        <p className="text-indigo-100 text-sm mb-6 font-medium leading-relaxed">
                            <Trans i18nKey="subscription.arsenal.pitch.description">
                                Unlock PRO and receive <span className="text-amber-400 font-black">500 Tokens</span> instantly. This is your engine for growth:
                            </Trans>
                        </p>
                        <div className="space-y-4">
                            {(t('subscription.arsenal.pitch.items', { returnObjects: true }) as string[]).map((p, i) => (
                                <div key={i} className="flex gap-4 items-start bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-black shrink-0 shadow-lg shadow-amber-400/20">
                                        {i + 1}
                                    </div>
                                    <p className="text-xs font-bold leading-relaxed pt-1">
                                        <Trans>{p}</Trans>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                        {(t('subscription.arsenal.items', { returnObjects: true }) as any[]).map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative bg-[#0F172A] border border-white/5 rounded-[2.5rem] p-6 text-left overflow-hidden h-full flex flex-col"
                            >
                                {/* Animated Gradient Overlay */}
                                <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.id === 'studio' ? 'bg-pink-500/10 text-pink-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                            {item.id === 'studio' ? <Rocket size={24} /> : <Bot size={24} />}
                                        </div>
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${item.id === 'studio' ? 'bg-pink-500 shadow-[0_0_10px_#ec4899]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`} />
                                    </div>

                                    <h3 className="text-xl font-black text-white mb-2">{item.title}</h3>
                                    <p className="text-slate-400 text-xs leading-relaxed mb-6">
                                        {item.desc}
                                    </p>

                                    <div className="space-y-3 mb-6 flex-grow">
                                        {item.stats.map((stat: string, sIdx: number) => (
                                            <div key={sIdx} className="flex items-center gap-2">
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${item.id === 'studio' ? 'bg-pink-500/20 text-pink-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                                    <CheckCircle2 size={10} />
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-300">
                                                    <Trans>
                                                        {stat}
                                                    </Trans>
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Console Preview */}
                                    <div className="bg-black/40 rounded-2xl p-4 mb-6 font-mono text-[10px] space-y-1 border border-white/5">
                                        {item.terminal.map((line: string, lIdx: number) => (
                                            <div key={lIdx} className={lIdx === 0 ? 'text-slate-500' : (item.id === 'studio' ? 'text-pink-400' : 'text-emerald-400')}>
                                                {line}
                                            </div>
                                        ))}
                                    </div>

                                    <button className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-95 border ${item.id === 'studio' ? 'bg-pink-500/5 border-pink-500/20 hover:bg-pink-500/10' : 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'}`}>
                                        {item.btn}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* PRO+ Coming Soon Banner */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="p-6 bg-slate-900/50 border border-white/5 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                                <Crown size={24} />
                            </div>
                            <div className="text-left">
                                <h4 className="text-sm font-black text-white">{t('subscription.arsenal.coming_soon.plan')}</h4>
                                <p className="text-[10px] font-bold text-slate-500">Ultimate Viral Scaling & Matrix Protocol</p>
                            </div>
                        </div>
                        <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10">
                            <span className="text-[9px] font-black tracking-widest text-slate-500">{t('subscription.arsenal.coming_soon.status')}</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Pricing Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-slate-900 rounded-[3rem] p-6 md:p-8 text-white shadow-2xl shadow-indigo-500/20 mb-12 overflow-hidden border border-white/5"
            >
                {/* Visual Background Accents */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500 rounded-full blur-[100px] opacity-20" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20" />

                <div className="relative z-10">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-3">
                                <Crown size={10} className="text-amber-500" />
                                <span className="text-[8px] font-black uppercase tracking-wider text-amber-500">{t('subscription.upgrade.one_time')}</span>
                            </div>
                            <h2 className="text-2xl font-black text-white">{t('subscription.upgrade.lifetime_pro')}</h2>
                        </div>
                        <div className="text-right">
                            <span className="text-5xl font-black tracking-tighter">${proPrice}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-8">
                        {(t('subscription.upgrade.benefits', { returnObjects: true }) as string[]).map((benefit, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={16} className="text-amber-500" />
                                </div>
                                <span className="text-xs font-bold text-slate-200">{benefit}</span>
                            </div>
                        ))}
                    </div>

                    {/* 9-Level Viral Network Visual */}
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">9-Level Referral Network</h4>
                            <span className="text-[10px] font-bold text-indigo-400">UNRESTRICTED</span>
                        </div>
                        <div className="flex items-end gap-1 h-12 mb-2">
                            {[0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h * 100}%` }}
                                    transition={{ delay: 0.5 + i * 0.05 }}
                                    className={`flex-1 rounded-t-sm ${i === 8 ? 'bg-amber-500' : 'bg-indigo-500/40'}`}
                                />
                            ))}
                        </div>
                        <p className="text-[8px] font-medium text-slate-400 text-center">
                            Earn from thousands of partners across 9 deep tiers.
                        </p>
                    </div>

                    {!paymentMethod ? (
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={async () => {
                                    setPaymentMethod('TON');
                                    selection();
                                    try {
                                        const res = await apiClient.post('/api/payment/session', { amount: proPrice, currency: 'TON', network: 'TON' });
                                        setSessionData(res.data);
                                    } catch (e) {
                                        console.error("Failed to create TON session");
                                    }
                                }}
                                className="h-12 bg-white text-slate-900 rounded-xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            >
                                <Wallet size={16} />
                                TON
                            </button>
                            <button
                                onClick={async () => {
                                    setPaymentMethod('CRYPTO');
                                    selection();
                                    try {
                                        const res = await apiClient.post('/api/payment/session', { amount: proPrice, currency: 'USDT', network: 'TRC20' });
                                        setSessionData(res.data);
                                    } catch (e) {
                                        console.error("Failed to create USDT session");
                                    }
                                }}
                                className="h-12 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            >
                                <CreditCard size={16} />
                                Crypto
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => { setPaymentMethod(null); setSessionData(null); }}
                                    className="text-xs font-bold opacity-50 hover:opacity-100 transition-opacity flex items-center gap-1"
                                >
                                    <ChevronRight size={14} className="rotate-180" /> {t('subscription.upgrade.change_method')}
                                </button>
                                {formattedTime && (
                                    <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black text-amber-500 font-mono tracking-tighter">{formattedTime}</span>
                                    </div>
                                )}
                            </div>

                            {paymentMethod === 'TON' && (
                                <div className="space-y-4">
                                    <div className="flex justify-center">
                                        <TonConnectButton />
                                    </div>
                                    <button
                                        disabled={isLoading}
                                        onClick={handleTonPayment}
                                        className="w-full h-14 bg-amber-500 rounded-2xl font-black flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" /> : <Crown size={20} />}
                                        {isLoading ? t('subscription.upgrade.processing') : t('subscription.upgrade.complete_payment')}
                                    </button>
                                </div>
                            )}

                            {paymentMethod === 'CRYPTO' && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">{t('subscription.upgrade.usdt_address')}</p>
                                        <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
                                            <code className="text-xs font-mono break-all flex-1">{adminUsdt}</code>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">{t('subscription.upgrade.tx_hash_label')}</p>
                                        <div className="flex gap-2">
                                            <input
                                                value={manualHash}
                                                onChange={(e) => setManualHash(e.target.value)}
                                                placeholder={t('subscription.upgrade.tx_hash_placeholder')}
                                                className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 text-xs focus:outline-none focus:border-amber-500"
                                            />
                                            <button
                                                onClick={handleManualSubmit}
                                                disabled={isLoading}
                                                className={`px-3 md:px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 ${manualHash
                                                    ? "bg-white/10 text-white"
                                                    : "bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20"
                                                    }`}
                                            >
                                                {manualHash ? <Send size={16} /> : <CheckCircle2 size={16} />}
                                                {manualHash ? "" : t('subscription.upgrade.i_paid')}
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] opacity-60 text-center italic leading-tight">
                                        <Trans i18nKey="subscription.upgrade.manual_review_p">
                                            Verified within 24 hours by our team.<br />
                                            <span className="text-amber-500 font-bold">Please complete your transfer within 30 minutes.</span>
                                        </Trans>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Status Modals */}
            <AnimatePresence>
                {
                    status !== 'idle' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-slate-950/80 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 w-full max-w-sm text-center shadow-2xl"
                            >
                                {status === 'pending' && (
                                    <>
                                        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Loader2 size={40} className="text-amber-500 animate-spin" />
                                        </div>
                                        <h2 className="text-2xl font-black mb-3 text-slate-900 dark:text-white">{t('subscription.status.verifying')}</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                                            {t('subscription.status.verifying_p')}
                                        </p>
                                    </>
                                )}

                                {status === 'success' && (
                                    <>
                                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle2 size={40} className="text-emerald-500" />
                                        </div>
                                        <h2 className="text-2xl font-black mb-3 text-slate-900 dark:text-white">{t('subscription.status.welcome_pro')}</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                                            {t('subscription.status.welcome_pro_p')}
                                        </p>
                                        <button
                                            onClick={() => setStatus('idle')}
                                            className="w-full h-14 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black"
                                        >
                                            {t('subscription.status.get_started')}
                                        </button>
                                    </>
                                )}

                                {status === 'manual_review' && (
                                    <>
                                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <CreditCard size={40} className="text-blue-500" />
                                        </div>
                                        <h2 className="text-2xl font-black mb-3 text-slate-900 dark:text-white">{t('subscription.status.submitted')}</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                                            {t('subscription.status.submitted_p')}
                                        </p>
                                        <button
                                            onClick={() => setStatus('idle')}
                                            className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black"
                                        >
                                            {t('subscription.status.got_it')}
                                        </button>
                                    </>
                                )}
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </div >
    );
}
