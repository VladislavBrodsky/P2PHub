import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Loader2, Trophy, CheckCircle2, X } from 'lucide-react';

interface SubscriptionStatusModalProps {
    status: 'idle' | 'pending' | 'success' | 'manual_review';
    setStatus: (status: 'idle' | 'pending' | 'success' | 'manual_review') => void;
    infoModal: { title: string; desc: string; icon: any; color: string } | null;
    setInfoModal: (info: any) => void;
    selectedPlan: 'PRO' | 'PRO_PLUS';
    selection: () => void;
    t: any;
}

export const SubscriptionStatusModal = React.memo(({
    status,
    setStatus,
    infoModal,
    setInfoModal,
    selectedPlan,
    selection,
    t
}: SubscriptionStatusModalProps) => {
    if (typeof document === 'undefined') return null;

    // Early return to ensure the portal is destroyed immediately when idle
    if (status === 'idle' && !infoModal) return null;

    return createPortal(
        <AnimatePresence mode="wait">
            {(status !== 'idle' || infoModal) && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl"
                >
                    {infoModal ? (
                        <div className="vibing-premium-panel p-5 w-full max-w-[280px] rounded-2xl text-center relative overflow-hidden shadow-2xl border-white/20">
                            <div className="circuit-decor opacity-30" />
                            <div className="scanning-glow absolute inset-0 opacity-20 pointer-events-none" />
                            {/* Removed background glow */}

                            <div className="relative z-10 flex flex-col items-center">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xl border border-white/20 backdrop-blur-md bg-linear-to-br ${infoModal.color === 'emerald' ? 'from-emerald-400 to-emerald-600' : infoModal.color === 'amber' ? 'from-amber-400 to-amber-600' : 'from-blue-400 to-blue-600'}`}>
                                    {React.createElement(infoModal.icon, { size: 24, className: "text-white drop-shadow-md" })}
                                </div>
                                <h3 className={`text-[clamp(1.125rem,5vw,1.25rem)] font-bold uppercase mb-2 tracking-tight leading-tight ${infoModal.color === 'emerald' ? 'text-emerald-500' : infoModal.color === 'amber' ? 'text-amber-500' : 'text-blue-500'}`}>{infoModal.title}</h3>
                                <div className="px-1 mb-6">
                                    <p className="text-[clamp(0.7rem,2.5vw,0.8rem)] text-slate-600 dark:text-white/70 uppercase font-black tracking-widest leading-relaxed overflow-y-auto max-h-[150px] pr-1">{infoModal.desc}</p>
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
                        <div className="vibing-premium-panel p-5 w-full max-w-[280px] rounded-2xl text-center relative">
                            <button
                                onClick={() => { selection(); setStatus('idle'); }}
                                className="absolute top-3 right-3 text-slate-400 hover:text-slate-900 dark:text-white/30 dark:hover:text-white transition-colors p-1"
                            >
                                <X size={18} />
                            </button>
                            {status === 'pending' && <Loader2 size={32} className="text-amber-500 animate-spin mx-auto mb-4" />}
                            {status === 'success' && <Trophy size={32} className="text-emerald-500 mx-auto mb-4" />}
                            {status === 'manual_review' && <CheckCircle2 size={32} className="text-blue-500 mx-auto mb-4" />}
                            <h2 className="text-[clamp(1rem,4vw,1.125rem)] font-black text-slate-900 dark:text-white uppercase mb-2 tracking-tight">
                                {status === 'pending' ? t('pro:subscription.status.verifying') : status === 'success' ? (selectedPlan === 'PRO_PLUS' ? t('pro:subscription.status.welcome_pro_plus') : t('pro:subscription.status.welcome_pro')) : t('pro:subscription.status.submitted')}
                            </h2>
                            <p className="text-[clamp(0.7rem,2.5vw,0.8rem)] text-slate-500 dark:text-white/40 uppercase font-black tracking-widest mb-6 px-2 leading-relaxed">
                                {status === 'pending' ? t('pro:subscription.status.verifying_p') : status === 'success' ? (selectedPlan === 'PRO_PLUS' ? t('pro:subscription.status.welcome_pro_plus_p') : t('pro:subscription.status.welcome_pro_p')) : t('pro:subscription.status.submitted_p')}
                            </p>
                            <button
                                onClick={() => { selection(); setStatus('idle'); }}
                                className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-indigo-900 rounded-full font-bold text-label uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)] transition-all active:scale-95"
                            >
                                {t('pro:subscription.status.got_it')}
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
});

SubscriptionStatusModal.displayName = 'SubscriptionStatusModal';
