import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, CheckCircle2, Wallet, CreditCard, ChevronRight, X, Loader2, Sparkles, Send } from 'lucide-react';
import { useTonConnectUI, TonConnectButton } from '@tonconnect/ui-react';
import { useUser } from '../context/UserContext';
import { apiClient } from '../api/client';
import { useHaptic } from '../hooks/useHaptic';
import { useConfig } from '../context/ConfigContext';

export default function SubscriptionPage() {
    const { user, refreshUser } = useUser();
    const { config: globalConfig, isLoading: isConfigLoading } = useConfig();
    const { selection, notification } = useHaptic();
    const [tonConnectUI] = useTonConnectUI();
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'TON' | 'CRYPTO' | null>(null);
    const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'manual_review'>('idle');
    const [manualHash, setManualHash] = useState('');
    const [tonPrice, setTonPrice] = useState<number | null>(null);

    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const res = await fetch('https://tonapi.io/v2/rates?tokens=ton&currencies=usd');
                const data = await res.json();
                setTonPrice(data.rates.TON.prices.USD);
            } catch (e) {
                setTonPrice(5.5); // Fallback
            }
        };
        fetchPrice();
    }, []);

    const proPrice = 39; // Base price
    const adminTon = globalConfig?.admin_ton_address || "UQD_n02bdxQxFztKTXpWBaFDxo713qIuETyefIeK7wiUB0DN";
    const adminUsdt = globalConfig?.admin_usdt_address || "TFp4oZV3fUkMgxiZV9d5SkJTHrA7NYoHCM";
    const tonAmountNano = tonPrice ? Math.ceil((proPrice / tonPrice) * 10 ** 9).toString() : "8000000000";

    const handleTonPayment = async () => {
        if (!tonConnectUI.connected) {
            tonConnectUI.openModal();
            return;
        }

        setIsLoading(true);
        selection();

        try {
            await apiClient.post('/api/payment/create', {
                amount: proPrice,
                currency: 'TON',
                network: 'TON'
            });

            const tx = {
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [
                    {
                        address: adminTon,
                        amount: tonAmountNano,
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

        } catch (error) {
            console.error('Payment failed:', error);
            notification('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualSubmit = async () => {
        if (!manualHash) return;
        setIsLoading(true);
        try {
            await apiClient.post('/api/payment/submit-manual', {
                tx_hash: manualHash,
                currency: 'USDT',
                network: 'TRC20',
                amount: proPrice
            });
            setStatus('manual_review');
            notification('success');
        } catch (error) {
            alert('Submission failed');
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
                    className="text-4xl font-black mb-4 tracking-tighter text-(--color-text-primary)"
                >
                    WELCOME TO THE <span className="text-linear-to-r from-amber-400 to-orange-600 bg-clip-text text-transparent">ELITE</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-(--color-text-secondary) font-medium text-sm leading-relaxed max-w-[280px] mb-10"
                >
                    You've unlocked the full potential of Pintopay. Your journey to x10 profits has officially begun.
                </motion.p>

                <div className="w-full space-y-4 max-w-xs">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Sparkles size={20} className="text-amber-500" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-bold opacity-50 uppercase">Active Until</p>
                                <p className="text-sm font-black">{user.pro_expires_at ? new Date(user.pro_expires_at).toLocaleDateString() : 'Lifetime Plan'}</p>
                            </div>
                        </div>
                        <CheckCircle2 className="text-emerald-500" />
                    </div>

                    <button
                        onClick={() => window.location.href = '#/partner'} // Redirect to network vision
                        className="w-full h-16 bg-linear-to-r from-amber-400 to-orange-600 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        Explore Your Empire
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col px-6 pb-32 pt-4">
            {/* Promo Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
                    <Sparkles size={12} className="text-amber-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">Premium Membership</span>
                </div>
                <h1 className="text-3xl font-black text-(--color-text-primary) mb-2 tracking-tight">
                    Upgrade to <span className="text-linear-to-br from-amber-500 to-orange-600 bg-clip-text text-transparent">PRO</span>
                </h1>
                <p className="text-(--color-text-secondary) font-medium text-xs leading-relaxed max-w-[260px] mx-auto">
                    Unlock exclusive benefits, higher referral rewards, and premium features.
                </p>
            </motion.div>

            {/* Pricing Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl shadow-indigo-500/10 mb-6 overflow-hidden"
            >
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20" />

                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-lg font-bold opacity-80 mb-0.5">Lifetime PRO</h2>
                            <p className="text-[10px] font-medium opacity-50 uppercase tracking-widest">One-time payment</p>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-black">${proPrice}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-2 mb-6 border-y border-white/5 py-4">
                        {[
                            '9-Level Affiliate',
                            'X5 Fast XP',
                            'Priority Pay',
                            'VIP Support',
                            'Custom Refs'
                        ].map((benefit, i) => (
                            <div key={i} className="flex items-center gap-1.5 min-w-0">
                                <CheckCircle2 size={12} className="text-amber-400 shrink-0" />
                                <span className="text-[10px] font-bold opacity-90 truncate">{benefit}</span>
                            </div>
                        ))}
                    </div>

                    {!paymentMethod ? (
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => { setPaymentMethod('TON'); selection(); }}
                                className="h-12 bg-white text-slate-900 rounded-xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            >
                                <Wallet size={16} />
                                TON
                            </button>
                            <button
                                onClick={() => { setPaymentMethod('CRYPTO'); selection(); }}
                                className="h-12 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            >
                                <CreditCard size={16} />
                                Crypto
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => setPaymentMethod(null)}
                                className="text-xs font-bold opacity-50 hover:opacity-100 transition-opacity flex items-center gap-1"
                            >
                                <ChevronRight size={14} className="rotate-180" /> Change Method
                            </button>

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
                                        {isLoading ? 'Processing...' : 'Complete Payment'}
                                    </button>
                                </div>
                            )}

                            {paymentMethod === 'CRYPTO' && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">USDT TRC20 Address</p>
                                        <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
                                            <code className="text-xs font-mono break-all flex-1">{adminUsdt}</code>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Transaction Hash</p>
                                        <div className="flex gap-2">
                                            <input
                                                value={manualHash}
                                                onChange={(e) => setManualHash(e.target.value)}
                                                placeholder="Paste TX hash here..."
                                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-xs focus:outline-none focus:border-amber-500"
                                            />
                                            <button
                                                onClick={handleManualSubmit}
                                                disabled={!manualHash || isLoading}
                                                className="p-3 bg-amber-500 rounded-xl disabled:opacity-50"
                                            >
                                                <Send size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] opacity-40 text-center italic">
                                        Verified within 24 hours by our team.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Status Modals */}
            <AnimatePresence>
                {status !== 'idle' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-slate-950/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-(--color-bg-surface) rounded-[2.5rem] p-8 w-full max-w-sm text-center shadow-2xl"
                        >
                            {status === 'pending' && (
                                <>
                                    <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Loader2 size={40} className="text-amber-500 animate-spin" />
                                    </div>
                                    <h2 className="text-2xl font-black mb-3 text-(--color-text-primary)">Verifying...</h2>
                                    <p className="text-sm text-(--color-text-secondary) mb-8">
                                        Checking on-chain data. This usually takes 30-60 seconds.
                                    </p>
                                </>
                            )}

                            {status === 'success' && (
                                <>
                                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 size={40} className="text-emerald-500" />
                                    </div>
                                    <h2 className="text-2xl font-black mb-3 text-(--color-text-primary)">Welcome to PRO!</h2>
                                    <p className="text-sm text-(--color-text-secondary) mb-8">
                                        Your account has been successfully upgraded.
                                    </p>
                                    <button
                                        onClick={() => setStatus('idle')}
                                        className="w-full h-14 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black"
                                    >
                                        Get Started
                                    </button>
                                </>
                            )}

                            {status === 'manual_review' && (
                                <>
                                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CreditCard size={40} className="text-blue-500" />
                                    </div>
                                    <h2 className="text-2xl font-black mb-3 text-(--color-text-primary)">Submitted</h2>
                                    <p className="text-sm text-(--color-text-secondary) mb-8">
                                        Our team is verifying your payment. You'll be notified once approved.
                                    </p>
                                    <button
                                        onClick={() => setStatus('idle')}
                                        className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black"
                                    >
                                        Got it
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
