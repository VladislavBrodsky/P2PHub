import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, CheckCircle2, Wallet, CreditCard, ChevronRight, X, Loader2, Sparkles, Send } from 'lucide-react';
import { useTonConnectUI, TonConnectButton } from '@tonconnect/ui-react';
import { useUser } from '../context/UserContext';
import { apiClient } from '../api/client';
import { useHaptic } from '../hooks/useHaptic';

export default function SubscriptionPage() {
    const { user, refreshUser } = useUser();
    const { selection, notification } = useHaptic();
    const [tonConnectUI] = useTonConnectUI();
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'TON' | 'CRYPTO' | null>(null);
    const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'manual_review'>('idle');
    const [manualHash, setManualHash] = useState('');

    const PRO_PRICE_USD = 39;
    const ADMIN_TON_ADDRESS = "UQDCv0H3Hk5_1sQ6v7Z_L_c3v_Z_L_c3v_Z_L_c3v_P2PHUB"; // Placeholder
    const ADMIN_USDT_ADDRESS = "Txxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"; // Placeholder

    const handleTonPayment = async () => {
        if (!tonConnectUI.connected) {
            tonConnectUI.openModal();
            return;
        }

        setIsLoading(true);
        selection();

        try {
            // 1. Create transaction on backend
            const res = await apiClient.post('/api/payment/create', {
                amount: PRO_PRICE_USD,
                currency: 'TON',
                network: 'TON'
            });
            const transaction = res.data;

            // 2. Send transaction via TonConnect
            // Note: We'd normally calculate TON amount based on USD price
            const tonAmount = "15000000000"; // Placeholder: 15 TON in nanoTON

            const tx = {
                validUntil: Math.floor(Date.now() / 1000) + 360,
                messages: [
                    {
                        address: ADMIN_TON_ADDRESS,
                        amount: tonAmount,
                    }
                ]
            };

            const result = await tonConnectUI.sendTransaction(tx);
            const txHash = result.boc; // Simplified hash for demo

            // 3. Verify on backend
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
            alert('Payment failed or cancelled');
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
                amount: PRO_PRICE_USD
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
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
                <div className="w-24 h-24 rounded-full bg-linear-to-br from-amber-400 to-orange-600 flex items-center justify-center mb-6 shadow-xl animate-pulse">
                    <Crown size={48} className="text-white fill-white/20" />
                </div>
                <h1 className="text-3xl font-black mb-2 text-(--color-text-primary)">YOU ARE PRO!</h1>
                <p className="text-(--color-text-secondary) mb-8">
                    Your subscription is active until {user.pro_expires_at ? new Date(user.pro_expires_at).toLocaleDateString() : 'Forever'}
                </p>
                <div className="w-full max-w-xs p-1 bg-linear-to-r from-amber-400 via-orange-500 to-amber-400 rounded-2xl overflow-hidden">
                    <div className="bg-(--color-bg-surface) rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle2 className="text-orange-500" />
                        <span className="font-bold text-sm">All Features Unlocked</span>
                    </div>
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
                className="text-center mb-12"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 mb-6">
                    <Sparkles size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Premium Membership</span>
                </div>
                <h1 className="text-4xl font-black text-(--color-text-primary) mb-4 tracking-tight">
                    Upgrade to <span className="text-linear-to-br from-amber-500 to-orange-600 bg-clip-text text-transparent">PRO</span>
                </h1>
                <p className="text-(--color-text-secondary) font-medium text-sm leading-relaxed max-w-[280px] mx-auto">
                    Unlock exclusive benefits, higher referral rewards, and premium features.
                </p>
            </motion.div>

            {/* Pricing Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-500/10 mb-8 overflow-hidden"
            >
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20" />

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-xl font-bold opacity-70 mb-1">Lifetime PRO</h2>
                            <p className="text-sm font-medium opacity-50">One-time payment</p>
                        </div>
                        <div className="text-right">
                            <span className="text-4xl font-black">${PRO_PRICE_USD}</span>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        {[
                            '9-Level Affiliate Network',
                            'X5 Faster Leveling',
                            'Priority Withdrawal',
                            'VIP Support Access',
                            'Custom Referral Codes'
                        ].map((benefit, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="p-1 rounded-full bg-white/10">
                                    <CheckCircle2 size={16} className="text-amber-400" />
                                </div>
                                <span className="text-sm font-medium opacity-90">{benefit}</span>
                            </div>
                        ))}
                    </div>

                    {!paymentMethod ? (
                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => { setPaymentMethod('TON'); selection(); }}
                                className="w-full h-14 bg-white text-slate-900 rounded-2xl font-black flex items-center justify-center gap-3 active:scale-95 transition-transform"
                            >
                                <Wallet size={20} />
                                Pay with TON
                            </button>
                            <button
                                onClick={() => { setPaymentMethod('CRYPTO'); selection(); }}
                                className="w-full h-14 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl font-black flex items-center justify-center gap-3 active:scale-95 transition-transform"
                            >
                                <CreditCard size={20} />
                                Other Crypto
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
                                            <code className="text-xs font-mono break-all flex-1">{ADMIN_USDT_ADDRESS}</code>
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
