import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTMALock } from '../../hooks/useTMALock';
import { usePerformance } from '../../hooks/usePerformance';
import { cn } from '../../lib/utils';

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade: () => void;
}

export function PremiumModal({ isOpen, onClose, onUpgrade }: PremiumModalProps) {
    const { t } = useTranslation(['cards', 'common']);
    useTMALock(isOpen);

    const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-6">
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%', opacity: 0 }}
                        animate={isDesktop ? { scale: 1, opacity: 1 } : { y: 0, opacity: 1 }}
                        exit={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%', opacity: 0 }}
                        transition={isDesktop ? { duration: 0.2, ease: "easeOut" } : { type: 'spring', damping: 30, stiffness: 250 }}
                        className="relative w-full max-w-sm rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] overflow-hidden overscroll-none"
                        style={{ overscrollBehavior: 'none' }}
                    >
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-50 dark:bg-blue-500/5 rounded-full blur-3xl opacity-60 dark:opacity-20" />
                        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-cyan-50 dark:bg-cyan-500/5 rounded-full blur-3xl opacity-60 dark:opacity-20" />

                        <button
                            onClick={onClose}
                            className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                            <X size={20} className="text-slate-400 dark:text-slate-500" />
                        </button>

                        <div className="relative flex flex-col items-center text-center">
                            {/* Premium Icon Badge */}
                            <div className="mb-6 relative">
                                <div className="h-20 w-20 rounded-2xl bg-linear-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <Crown size={40} className="text-white fill-white/20" />
                                </div>
                                <div className="absolute -inset-2 border-2 border-dashed border-blue-200 dark:border-blue-500/20 rounded-full opacity-50 animate-slow-rotate" />
                            </div>

                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                                {t('cards.modal.title')}
                            </h2>

                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-8 px-2">
                                {t('cards.modal.desc')}
                            </p>

                            {/* Instruction List */}
                            <div className="w-full space-y-3 mb-8 text-left">
                                {(t('cards.modal.steps', { returnObjects: true }) as string[]).map((step, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/10">
                                        <div className="h-6 w-6 rounded-lg bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-label font-bold text-blue-500 border border-slate-100 dark:border-white/10">
                                            {i + 1}
                                        </div>
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{step}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={onUpgrade}
                                className="w-full h-16 rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-[0_15px_30px_-5px_rgba(37,99,235,0.3)] hover:bg-blue-700 flex items-center justify-center gap-2 group transition-all active:scale-[0.98] cursor-pointer"
                            >
                                <span>{t('cards.modal.upgrade')}</span>
                                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                            </button>

                            <button
                                onClick={onClose}
                                className="mt-4 text-label font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors cursor-pointer"
                            >
                                {t('cards.modal.later')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
