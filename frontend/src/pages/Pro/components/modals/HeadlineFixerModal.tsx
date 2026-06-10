import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../../../../store/useNotificationStore';
import { useTMALock } from '../../../../hooks/useTMALock';

interface HeadlineFixerModalProps {
    showHeadlineModal: boolean;
    setShowHeadlineModal: (show: boolean) => void;
    handleFixHeadline?: (headline: string) => Promise<string | undefined>;
    isFixingHeadline?: boolean;
    proTokens: number;
}

export const HeadlineFixerModal: React.FC<HeadlineFixerModalProps> = ({
    showHeadlineModal,
    setShowHeadlineModal,
    handleFixHeadline,
    isFixingHeadline,
    proTokens
}) => {
    const { t } = useTranslation('pro');
    const { showNotification } = useNotificationStore();

    useTMALock(showHeadlineModal);

    const [headlineInput, setHeadlineInput] = useState('');
    const [headlineResult, setHeadlineResult] = useState('');

    const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const onFixHeadline = async () => {
        if (!handleFixHeadline || !headlineInput) return;
        setHeadlineResult('');
        try {
            const result = await handleFixHeadline(headlineInput);
            if (result) setHeadlineResult(result);
        } catch (e) {
            // Error handled in parent
        }
    };

    useEffect(() => {
        setHeadlineResult('');
    }, [headlineInput]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {showHeadlineModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/40 backdrop-blur-md"
                    onClick={() => setShowHeadlineModal(false)}
                >
                    <motion.div
                        initial={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%', opacity: 0 }}
                        animate={isDesktop ? { scale: 1, opacity: 1 } : { y: 0, opacity: 1 }}
                        exit={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%', opacity: 0 }}
                        transition={isDesktop ? { duration: 0.2, ease: "easeOut" } : { type: 'spring', damping: 30, stiffness: 250 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg rounded-[2.5rem] border border-slate-200 dark:border-white/10 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl shadow-3xl flex flex-col max-h-[85vh] relative"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-blue-500 to-pink-500 opacity-50" />

                        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-linear-to-r from-blue-500/5 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <Zap size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">{t('tools.headline.title')}</h3>
                                    <div className="flex items-center gap-2">
                                        <p className="text-label font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] opacity-80">
                                            {t('tools.headline.curiosity_loop')}
                                        </p>
                                        <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
                                        <div className="flex items-center gap-1.5">
                                            <Zap size={10} className="text-blue-500 animate-pulse" />
                                            <span className="text-label font-bold text-slate-400 uppercase tracking-widest tabular-nums">{proTokens}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowHeadlineModal(false)}
                                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                            >
                                <X size={20} className="text-slate-900 dark:text-white/60" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-8 space-y-6">
                            <div className="space-y-3 relative group/field">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-label font-bold text-slate-400 uppercase tracking-widest">{t('tools.headline.label', 'Input Headline')}</label>
                                    {headlineInput && (
                                        <button onClick={() => setHeadlineInput('')} className="text-label font-bold text-rose-500 uppercase tracking-widest hover:opacity-70 transition-opacity flex items-center gap-1">
                                            <X size={10} /> {t('common:delete')}
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    value={headlineInput}
                                    onChange={(e) => setHeadlineInput(e.target.value)}
                                    className="w-full h-32 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-medium focus:border-blue-500 outline-hidden transition-all text-slate-900 dark:text-white placeholder:text-slate-400/50 resize-none shadow-inner"
                                    placeholder={t('tools.headline.placeholder')}
                                />
                            </div>

                            {headlineResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-5 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/20 space-y-3 relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 p-3">
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                    </div>
                                    <h4 className="text-label font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{t('tools.headline.synthesized_title')}</h4>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                        {headlineResult}
                                    </p>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(headlineResult);
                                            showNotification({ title: t('notifications.success'), message: t('notifications.headline_copied'), type: 'success' });
                                        }}
                                        className="text-label font-bold text-blue-500 uppercase tracking-widest hover:text-blue-600 transition-colors"
                                    >
                                        {t('tools.copy_btn')}
                                    </button>
                                </motion.div>
                            )}

                            <div className="p-4 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/10 flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-blue-500 mt-0.5" />
                                <p className="text-label text-blue-700 dark:text-blue-400 leading-relaxed italic">
                                    {t('tools.headline.neural_desc')}
                                </p>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8 bg-slate-50 dark:bg-black/40 border-t border-slate-100 dark:border-white/5">
                            <button
                                onClick={onFixHeadline}
                                disabled={isFixingHeadline || !headlineInput}
                                className="w-full h-13 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-label uppercase tracking-[0.15em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:grayscale"
                            >
                                {isFixingHeadline ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        {t('tools.processing')}
                                    </>
                                ) : (
                                    <>
                                        {t('tools.headline.btn').toUpperCase()} <Sparkles size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
