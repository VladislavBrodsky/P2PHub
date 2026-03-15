import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Wallet, Share2, AlertTriangle, Fingerprint, CheckCircle2, HelpCircle, CreditCard, Shield } from 'lucide-react';
import { TonConnectButton } from '@tonconnect/ui-react';
import { TONLogo, USDTLogo } from '../../../components/ui/CryptoIcons';
import { PaymentSessionTimer } from './SubscriptionTimers';
import { copyToClipboard } from '../../../utils/clipboard';
import { useNotificationStore } from '../../../store/useNotificationStore';

interface SubscriptionPaymentProps {
    paymentMethod: 'TON' | 'CRYPTO' | 'STRIPE' | null;
    setPaymentMethod: (method: 'TON' | 'CRYPTO' | 'STRIPE' | null) => void;
    handleTonPayment: () => void;
    handleManualSubmit: () => void;
    handleStripePayment: () => void;
    isLoading: boolean;
    manualHash: string;
    setManualHash: (hash: string) => void;
    status: string;
    setStatus: (status: 'idle' | 'pending' | 'success' | 'manual_review') => void;
    sessionData: any;
    setSessionData: (data: any) => void;
    selectedPlan: 'PRO' | 'PRO_PLUS';
    planPrice: number;
    isStandardPro: boolean;
    adminUsdt: string;
    selection: () => void;
    notification: (type: 'success' | 'error' | 'warning') => void;
    scrollToPayment: (e?: React.MouseEvent) => void;
    t: any;
    paymentRef: React.RefObject<HTMLDivElement>;
}

export const SubscriptionPayment = React.memo(({
    paymentMethod,
    setPaymentMethod,
    handleTonPayment,
    handleManualSubmit,
    handleStripePayment,
    isLoading,
    manualHash,
    setManualHash,
    status,
    setStatus,
    sessionData,
    setSessionData,
    selectedPlan,
    planPrice,
    isStandardPro,
    adminUsdt,
    selection,
    notification,
    scrollToPayment,
    t,
    paymentRef
}: SubscriptionPaymentProps) => {
    const { showNotification } = useNotificationStore();

    const handleCopyAddress = async () => {
        const success = await copyToClipboard(adminUsdt);
        selection();
        
        if (success) {
            notification('success');
            showNotification({
                title: t('notifications.success'),
                message: t('notifications.text_copied'),
                type: 'success',
                icon: <CheckCircle2 size={16} className="text-emerald-500" />
            });
        }
    };

    return (
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
                                <span className="text-caption">←</span> {t('subscription.upgrade.change_method')}
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
                            ) : paymentMethod === 'STRIPE' ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                                        <CreditCard className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500" size={24} />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('subscription.upgrade.processing_stripe')}</h3>
                                        <p className="text-label text-slate-500 dark:text-white/40 uppercase tracking-widest mt-1">{t('subscription.upgrade.redirecting_to_bank')}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {/* STEP 1: COPY ADDRESS */}
                                    <div className="relative group">
                                        <div className="absolute -left-3 top-0 bottom-0 w-1 bg-emerald-500 rounded-full opacity-50" />
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white text-label font-bold flex items-center justify-center shadow-lg">1</div>
                                                <span className="text-label font-bold text-slate-900 dark:text-white uppercase tracking-widest">{t('subscription.upgrade.steps.copy_address')}</span>
                                            </div>
                                            <div
                                                onClick={handleCopyAddress}
                                                className="vibing-premium-panel bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 p-4 cursor-pointer group hover:border-emerald-500/50 transition-all active:scale-[0.98] shadow-sm"
                                            >
                                                <p className="text-label font-bold text-slate-400 dark:text-white/30 mb-2 uppercase tracking-[0.2em]">{t('subscription.upgrade.tap_to_copy')}</p>
                                                <div className="bg-white dark:bg-black/40 p-3 rounded-xl mb-2 flex items-center gap-3 border border-slate-100 dark:border-white/5">
                                                    <code className="text-label font-mono text-slate-800 dark:text-white/80 break-all flex-1">{adminUsdt}</code>
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-md shrink-0">
                                                        <Share2 size={14} />
                                                    </div>
                                                </div>
                                                <span className="text-label font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-center block w-full group-hover:animate-pulse">{t('subscription.upgrade.tap_to_copy')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* STEP 2: PASTE HASH */}
                                    <div className="relative group">
                                        <div className="absolute -left-3 top-0 bottom-0 w-1 bg-blue-500 rounded-full opacity-50" />
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-label font-bold flex items-center justify-center shadow-lg">2</div>
                                                <span className="text-label font-bold text-slate-900 dark:text-white uppercase tracking-widest">{t('subscription.upgrade.steps.paste_hash')}</span>
                                            </div>

                                            {/* CRITICAL INSTRUCTION ALERT */}
                                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-1 flex gap-2 items-start animate-pulse">
                                                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                                <p className="text-label font-bold text-amber-600 dark:text-amber-500 uppercase leading-normal tracking-tight">
                                                    {t('subscription.upgrade.final_instruction')}
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
                                                        {t('subscription.upgrade.hash_help')}
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
                                                    <span>{status === 'manual_review' ? t('subscription.upgrade.pending_review') : t('subscription.upgrade.verify_transaction')}</span>
                                                </>
                                            )}
                                        </div>
                                    </button>

                                    {/* HELP SECTION */}
                                    <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-white/2 border border-blue-500/10 dark:border-white/5 text-center">
                                        <p className="text-label font-bold text-blue-600/60 dark:text-blue-400/50 uppercase tracking-[0.2em] mb-1">{t('subscription.upgrade.help_title')}</p>
                                        <p className="text-label text-slate-500 dark:text-white/40 font-medium">{t('subscription.upgrade.help_desc')}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
});

SubscriptionPayment.displayName = 'SubscriptionPayment';
