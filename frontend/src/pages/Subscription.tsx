import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Crown, CheckCircle2, Wallet, CreditCard, ChevronRight,
    Loader2, Sparkles, Zap, Rocket, Bot, ChevronDown, Trophy, Users
} from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { useTonConnectUI, TonConnectButton } from '@tonconnect/ui-react';
import { useUser } from '../context/UserContext';
import { apiClient } from '../api/client';
import { useHaptic } from '../hooks/useHaptic';
import { useConfig } from '../context/ConfigContext';

export default function SubscriptionPage() {
    // #comment: Trigger deployment update
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
    const [expandedItem, setExpandedItem] = useState<string | null>(null);

    // #comment: Timer logic to calculate and update remaining time for the payment session.
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

    const [selectedPlan, setSelectedPlan] = useState<'PRO' | 'PRO_PLUS'>('PRO_PLUS');
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
        <div className="flex flex-col px-4 pb-32 pt-2 max-w-lg mx-auto">
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

            {/* Plan Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl mb-8 relative">
                <button
                    onClick={() => { selection(); setSelectedPlan('PRO'); }}
                    className={`relative z-10 py-4 rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${selectedPlan === 'PRO' ? 'bg-white dark:bg-slate-800 shadow-md' : 'opacity-50'}`}
                >
                    <span className="text-[10px] font-black uppercase tracking-wider">{t('subscription.upgrade.pro_title')}</span>
                    <span className="text-lg font-black">$39</span>
                </button>
                <button
                    onClick={() => { selection(); setSelectedPlan('PRO_PLUS'); }}
                    className={`relative z-10 py-4 rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${selectedPlan === 'PRO_PLUS' ? 'bg-white dark:bg-slate-800 shadow-md ring-2 ring-indigo-500/30' : 'opacity-50'}`}
                >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-[8px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">RECOMMENDED</div>
                    <span className="text-[10px] font-black uppercase tracking-wider">{t('subscription.upgrade.pro_plus_title')}</span>
                    <span className="text-lg font-black">$69</span>
                </button>
            </div>

            {/* Features Row */}
            <div className="flex flex-col gap-3 mb-10">
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl transition-all duration-500">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                        <Zap size={20} className="text-indigo-500" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('subscription.upgrade.one_time')}</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                            {selectedPlan === 'PRO' ? t('subscription.upgrade.tokens_info_pro') : t('subscription.upgrade.tokens_info_pro_plus')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl transition-all duration-500">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                        <Users size={20} className="text-orange-500" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('subscription.upgrade.lifetime_pro')}</p>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase">
                            {t('subscription.upgrade.levels_info')}
                        </p>
                    </div>
                </div>

                {/* Detailed Benefits List */}
                <div className="mt-4 px-2 space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        {t('subscription.upgrade.benefits_title', 'Key Benefits')}
                    </h4>
                    {(t(selectedPlan === 'PRO' ? 'subscription.upgrade.benefits_pro' : 'subscription.upgrade.benefits_pro_plus', { returnObjects: true }) as string[]).map((benefit, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-3"
                        >
                            <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={12} className="text-emerald-500" />
                            </div>
                            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                {benefit}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Payment Section */}
            <div className={`rounded-[2rem] p-6 shadow-2xl relative overflow-hidden transition-colors duration-500 ${selectedPlan === 'PRO_PLUS' ? 'bg-indigo-600' : 'bg-slate-900'}`}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Crown size={120} />
                </div>

                {!paymentMethod ? (
                    <div className="space-y-4 relative z-10">
                        <div className="text-center mb-2">
                            <h3 className="text-white font-black text-sm uppercase tracking-widest">{t('subscription.upgrade.complete_payment')}</h3>
                            <p className="text-white/60 text-xs font-bold mt-1">Total: ${planPrice}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => { selection(); setPaymentMethod('TON'); }}
                                className="h-14 bg-white text-slate-900 rounded-xl font-black text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-xl"
                            >
                                <Wallet size={18} />
                                TON Wallet
                            </button>
                            <button
                                onClick={() => { selection(); setPaymentMethod('CRYPTO'); }}
                                className="h-14 bg-white/10 text-white rounded-xl font-black text-xs flex flex-col items-center justify-center gap-1 active:scale-95 border border-white/20 transition-all"
                            >
                                <CreditCard size={18} />
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
                                <div className="flex justify-center bg-white/5 p-4 rounded-2xl border border-white/10">
                                    <TonConnectButton />
                                </div>
                                <button
                                    disabled={isLoading}
                                    onClick={handleTonPayment}
                                    className="w-full h-14 bg-white text-indigo-600 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 size={20} className="animate-spin mx-auto" /> : t('subscription.upgrade.complete_payment')}
                                </button>
                            </div>
                        )}

                        {paymentMethod === 'CRYPTO' && (
                            <div className="space-y-4">
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                                    <p className="text-[8px] font-black uppercase tracking-wider text-white/50 mb-2">USDT TRC20 ADDRESS</p>
                                    <div className="flex items-center gap-2 bg-black/20 p-3 rounded-xl">
                                        <code className="text-[10px] font-mono break-all text-white flex-1">{adminUsdt}</code>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        value={manualHash}
                                        onChange={(e) => setManualHash(e.target.value)}
                                        placeholder="Paste Tx Hash"
                                        className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white"
                                    />
                                    <button
                                        onClick={handleManualSubmit}
                                        disabled={isLoading || !manualHash}
                                        className="h-12 px-6 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-50"
                                    >
                                        SCANNED
                                    </button>
                                </div>
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
                        className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 w-full max-w-sm text-center"
                        >
                            {status === 'pending' && <Loader2 size={48} className="text-amber-500 animate-spin mx-auto mb-6" />}
                            {status === 'success' && <Trophy size={48} className="text-emerald-500 mx-auto mb-6" />}
                            {status === 'manual_review' && <CheckCircle2 size={48} className="text-blue-500 mx-auto mb-6" />}

                            <h2 className="text-2xl font-black mb-2 text-slate-900 dark:text-white uppercase tracking-tighter">
                                {status === 'pending' ? t('subscription.status.verifying') : status === 'success' ? t('subscription.status.welcome_pro') : t('subscription.status.submitted')}
                            </h2>
                            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                                {status === 'pending' ? t('subscription.status.verifying_p') : status === 'success' ? t('subscription.status.welcome_pro_p') : t('subscription.status.submitted_p')}
                            </p>
                            <button onClick={() => setStatus('idle')} className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">{t('subscription.status.got_it')}</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Support/FAQ Section */}
            <div className="mt-12 px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 text-center">{t('subscription.faq.title', 'Frequently Asked Questions')}</h3>
                <div className="space-y-4">
                    {[
                        { q: t('subscription.faq.q1', 'Is it really lifetime?'), a: t('subscription.faq.a1', 'Yes. Pay once, use forever. No monthly fees, no hidden costs.') },
                        { q: t('subscription.faq.q2', 'How do tokens work?'), a: t('subscription.faq.a2', 'You get 500 tokens immediately. Tokens reset every month if you run out.') },
                        { q: t('subscription.faq.q3', 'Can I use multiple accounts?'), a: t('subscription.faq.a3', 'The license is tied to your Telegram ID. One purchase per account.') }
                    ].map((faq, i) => (
                        <div key={i} className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                            <h4 className="text-[11px] font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{faq.q}</h4>
                            <p className="text-[10px] text-slate-700 dark:text-slate-400 font-medium leading-relaxed">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
