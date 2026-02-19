import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Crown, CheckCircle2, Wallet, CreditCard, ChevronRight,
    Loader2, Sparkles, Zap, ChevronDown, Trophy, Users,
    HelpCircle, Clock, BookOpen, Check, Globe, Shield, Share2, ChevronLeft
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
    const [expandedFeature, setExpandedFeature] = useState<'TOKENS' | 'LEVELS' | null>(null);
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
                messages: [{ address, amount: Math.ceil(amount * 10 ** 9).toString() }]
            };
            const result = await tonConnectUI.sendTransaction(tx);
            setStatus('pending');
            const verifyRes = await apiClient.post('/api/payment/verify-ton', { tx_hash: result.boc });
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
                <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] blur-[150px] opacity-20 -z-10 animate-pulse ${isPlus ? 'bg-indigo-600' : 'bg-amber-500'}`} />
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="relative mb-8"
                >
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
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between backdrop-blur-xl">
                        <div className="flex items-center gap-3">
                            <Sparkles size={18} className={isPlus ? 'text-indigo-400' : 'text-amber-400'} />
                            <div className="text-left">
                                <p className="text-[8px] font-black opacity-40 uppercase tracking-widest">{t('subscription.pro_active.lifetime')}</p>
                                <p className="text-sm font-black">{isLifetime ? 'LIFETIME ACCESS' : new Date(user.pro_expires_at!).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <CheckCircle2 size={16} className="text-emerald-500" />
                    </div>
                    <button
                        onClick={() => { selection(); window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'pro' })); }}
                        className={`w-full h-14 rounded-2xl font-black text-white text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 ${isPlus ? 'bg-indigo-600' : 'bg-amber-600'}`}
                    >
                        <Trophy size={16} />
                        {t('subscription.pro_active.command_center')}
                    </button>
                    {!isLifetime && (
                        <button onClick={() => setShowPaymentOptionsForPro(true)} className="text-[8px] font-black text-white/30 uppercase tracking-widest hover:text-white transition-colors">
                            {t('subscription.upgrade.extend_membership')}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col px-4 pb-32 pt-2 max-w-lg mx-auto overflow-x-hidden">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 pt-4">
                <div className="inline-block mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-indigo-500 via-fuchsia-600 to-indigo-800 flex items-center justify-center shadow-xl relative border border-white/30">
                        <Crown size={24} className="text-white fill-white/20" />
                    </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 inline-flex items-center gap-2 mb-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/70">{t('subscription.upgrade.protocol_initialized')}</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic vibing-crystal-text">PRO STATUS</h1>
                <p className="text-slate-500 dark:text-slate-400 text-[9px] font-bold max-w-[250px] mx-auto uppercase tracking-widest mt-2">{t('subscription.upgrade.desc')}</p>

                {proStats && (
                    <div className="mt-6 w-full max-w-[220px] mx-auto">
                        <div className="flex justify-between text-[8px] font-black mb-1 opacity-50">
                            <span>{t('subscription.upgrade.lifetime_slots')}</span>
                            <span>{proStats.sold}/{proStats.total}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(proStats.sold / proStats.total) * 100}%` }} className="h-full bg-linear-to-r from-amber-400 to-orange-500" />
                        </div>
                    </div>
                )}
            </motion.div>

            <div className="p-1.5 bg-slate-950/20 rounded-[1.8rem] mb-6 flex shadow-inner border border-white/5 mx-auto w-full max-w-[320px] relative">
                <motion.div
                    className="absolute inset-y-1.5 rounded-[1.6rem] bg-indigo-600 shadow-xl z-0"
                    animate={{ x: selectedPlan === 'PRO' ? 0 : '100%', width: '50%' }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
                <button onClick={() => { selection(); setSelectedPlan('PRO'); }} className={`flex-1 relative z-10 py-2.5 rounded-[1.6rem] flex flex-col items-center justify-center ${selectedPlan === 'PRO' ? 'text-white' : 'text-white/30'}`}>
                    <span className="text-[7px] font-black uppercase tracking-widest mb-0.5">STANDARD PRO</span>
                    <span className="text-lg font-black">$39</span>
                </button>
                <button onClick={() => { selection(); setSelectedPlan('PRO_PLUS'); }} className={`flex-1 relative z-10 py-2.5 rounded-[1.6rem] flex flex-col items-center justify-center ${selectedPlan === 'PRO_PLUS' ? 'text-white' : 'text-white/30'}`}>
                    <span className="text-[7px] font-black uppercase tracking-widest mb-0.5">ELITE PRO+</span>
                    <span className="text-lg font-black">$69</span>
                </button>
            </div>

            <div className="space-y-3 mb-8">
                {['TOKENS', 'LEVELS'].map((feat) => {
                    const isTokens = feat === 'TOKENS';
                    const active = expandedFeature === feat;
                    return (
                        <div key={feat} className="relative">
                            <button
                                onClick={() => { selection(); setExpandedFeature(active ? null : (feat as any)); }}
                                className={`w-full p-4 rounded-3xl border transition-all ${active ? 'bg-indigo-600 border-indigo-400 shadow-2xl scale-[1.02]' : 'bg-white/3 border-white/5'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${active ? 'bg-white/20' : 'bg-indigo-500/10'}`}>
                                            {isTokens ? <Zap size={20} className={active ? 'text-white' : 'text-indigo-400'} /> : <Users size={20} className={active ? 'text-white' : 'text-emerald-400'} />}
                                        </div>
                                        <div className="text-left">
                                            <p className={`text-[8px] font-black uppercase tracking-widest ${active ? 'text-indigo-200' : 'text-white/30'}`}>
                                                {isTokens ? (selectedPlan === 'PRO' ? '250 TOKENS' : '500 TOKENS') : (selectedPlan === 'PRO' ? '9 LEVELS' : '20 LEVELS')}
                                            </p>
                                            <h3 className="text-sm font-black uppercase text-white">{isTokens ? t('subscription.upgrade.viral_studio_label') : t('subscription.upgrade.content_factory_label')}</h3>
                                        </div>
                                    </div>
                                    <ChevronDown size={14} className={`transition-transform duration-300 ${active ? 'rotate-180 text-white' : 'text-white/20'}`} />
                                </div>
                                <AnimatePresence>
                                    {active && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4 pt-4 border-t border-white/10">
                                            <p className="text-[10px] text-white/60 leading-relaxed italic mb-4">
                                                {isTokens ? t(selectedPlan === 'PRO' ? 'subscription.upgrade.viral_studio_desc_pro' : 'subscription.upgrade.viral_studio_desc_pro_plus') : t(selectedPlan === 'PRO' ? 'subscription.upgrade.content_factory_desc_pro' : 'subscription.upgrade.content_factory_desc_pro_plus')}
                                            </p>
                                            <button onClick={scrollToPayment} className="w-full py-3 bg-white text-indigo-600 rounded-xl font-black text-[9px] uppercase tracking-widest">{t('subscription.upgrade.initialize_studio')}</button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>
                    );
                })}
            </div>

            <motion.div ref={paymentRef} className="mb-10">
                <AnimatePresence mode="wait">
                    <motion.div key={selectedPlan} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-4 px-2">
                        <div className="bg-white/3 border border-white/5 rounded-3xl p-4 grid grid-cols-2 gap-2">
                            {(selectedPlan === 'PRO' ? (t('subscription.upgrade.benefits_pro', { returnObjects: true }) as string[]) : (t('subscription.upgrade.benefits_pro_plus', { returnObjects: true }) as string[])).map((b, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full flex items-center justify-center shrink-0 ${selectedPlan === 'PRO' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                        <Check size={8} strokeWidth={4} />
                                    </div>
                                    <span className="text-[8px] font-black text-white/50 uppercase tracking-tight line-clamp-1">{b}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className="vibing-premium-panel p-6 shadow-premium-xl relative z-10 mx-auto max-w-[340px]">
                    {!paymentMethod ? (
                        <div className="space-y-8">
                            <div className="text-center">
                                <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">${planPrice} ACTIVE PROTOCOL</div>
                                <div className="flex items-baseline justify-center gap-1.5 mb-1">
                                    <span className="text-4xl font-black text-white">${planPrice}</span>
                                    <span className="text-[8px] font-black text-white/30 uppercase italic">/ {selectedPlan === 'PRO_PLUS' ? 'LIFETIME' : '30 DAYS'}</span>
                                </div>
                                <div className="w-12 h-0.5 bg-indigo-500/50 mx-auto" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => { selection(); setPaymentMethod('TON'); }} className="h-16 bg-white text-indigo-600 rounded-2xl font-black text-[8px] flex flex-col items-center justify-center gap-1 active:scale-95 transition-all">
                                    <Wallet size={18} />
                                    <span>TON WALLET</span>
                                </button>
                                <button onClick={() => { selection(); setPaymentMethod('CRYPTO'); }} className="h-16 bg-white/5 text-white border border-white/10 rounded-2xl font-black text-[8px] flex flex-col items-center justify-center gap-1 active:scale-95 transition-all">
                                    <CreditCard size={18} />
                                    <span>USDT (TRC20)</span>
                                </button>
                            </div>
                            <p className="text-[7px] text-white/20 text-center uppercase tracking-widest">SECURE ENCRYPTED NETWORK ACTIVE</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <button onClick={() => setPaymentMethod(null)} className="flex items-center gap-2 text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors">
                                <ChevronLeft size={14} /> {t('subscription.upgrade.change_method')}
                            </button>
                            <div className="mt-4">
                                {paymentMethod === 'TON' ? (
                                    <div className="space-y-6 text-center">
                                        <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                            <Wallet size={32} className="mx-auto text-indigo-400 mb-4" />
                                            <div className="flex justify-center mb-4"><TonConnectButton /></div>
                                        </div>
                                        <button disabled={isLoading} onClick={handleTonPayment} className="w-full h-14 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest">{isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'COMPLETE PAYMENT'}</button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div onClick={() => { navigator.clipboard.writeText(adminUsdt); selection(); notification('success'); }} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center cursor-pointer">
                                            <p className="text-[8px] font-black text-white/30 mb-2 uppercase">TRC20 ADDRESS (TAP TO COPY)</p>
                                            <code className="text-[9px] font-mono text-white/80 block bg-black/40 p-2 rounded-lg mb-2">{adminUsdt}</code>
                                            <span className="text-[8px] font-black text-indigo-400 uppercase">COPY SUCCESSFUL</span>
                                        </div>
                                        <input value={manualHash} onChange={(e) => setManualHash(e.target.value)} placeholder="PASTE TX HASH" className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-xs text-white text-center font-mono" />
                                        <button onClick={handleManualSubmit} disabled={isLoading || !manualHash} className="w-full h-12 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest">{isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'VERIFY TRANSACTION'}</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            <section className="mt-10 mb-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
                    <HelpCircle size={10} className="text-indigo-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">{t('subscription.faq.teaser_badge')}</span>
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6 italic">{t('subscription.faq.header_pre')} <span className="text-indigo-500">{t('subscription.faq.header_highlight')}</span></h2>
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((idx) => (
                        <div key={idx} className="bg-white/3 border border-white/5 rounded-2xl overflow-hidden">
                            <button onClick={() => { selection(); setExpandedFaq(expandedFaq === idx ? null : idx); }} className="w-full p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                                        {idx === 1 ? <Clock size={14} className="text-amber-500" /> : idx === 2 ? <Zap size={14} className="text-indigo-400" /> : idx === 3 ? <Globe size={14} className="text-emerald-400" /> : idx === 4 ? <Shield size={14} className="text-purple-400" /> : <Share2 size={14} className="text-fuchsia-400" />}
                                    </div>
                                    <span className="text-[10px] font-black text-white uppercase tracking-tight text-left">{t(`subscription.faq.q${idx}`)}</span>
                                </div>
                                <ChevronDown size={14} className={`transition-transform ${expandedFaq === idx ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {expandedFaq === idx && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                        <p className="p-4 pt-0 text-[10px] text-white/50 leading-relaxed font-bold uppercase tracking-tight italic border-t border-white/5">{t(`subscription.faq.a${idx}`)}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </section>

            <div className="text-center opacity-10 text-[6px] font-mono tracking-[0.5em] mt-10">BUILD: 2026.02.18 | v1.7.3-ELITE</div>

            <AnimatePresence>
                {status !== 'idle' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl">
                        <div className="vibing-premium-panel p-8 w-full max-w-sm text-center">
                            {status === 'pending' && <Loader2 size={48} className="text-amber-500 animate-spin mx-auto mb-6" />}
                            {status === 'success' && <Trophy size={48} className="text-emerald-500 mx-auto mb-6" />}
                            {status === 'manual_review' && <CheckCircle2 size={48} className="text-blue-500 mx-auto mb-6" />}
                            <h2 className="text-xl font-black text-white uppercase italic mb-2">{status === 'pending' ? 'VERIFYING...' : status === 'success' ? 'WELCOME TO PRO' : 'SUBMITTED'}</h2>
                            <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-8">{status === 'pending' ? 'SCANNING BLOCKCHAIN FOR TRANSACTION' : 'YOUR ACCOUNT ACCESS IS BEING PROVISIONED'}</p>
                            <button onClick={() => setStatus('idle')} className="w-full h-12 bg-white text-indigo-900 rounded-xl font-black text-[10px] uppercase">GOT IT</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
