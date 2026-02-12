import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpgrade: () => void;
}

export function PremiumModal({ isOpen, onClose, onUpgrade }: PremiumModalProps) {
    const { t } = useTranslation();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-sm rounded-[2.5rem] bg-white border border-slate-100 p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] overflow-hidden"
                    >
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60" />
                        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-60" />

                        <button
                            onClick={onClose}
                            className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-50 transition-colors"
                        >
                            <X size={20} className="text-slate-400" />
                        </button>

                        <div className="relative flex flex-col items-center text-center">
                            {/* Premium Icon Badge */}
                            <div className="mb-6 relative">
                                <div className="h-20 w-20 rounded-[2rem] bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <Crown size={40} className="text-white fill-white/20" />
                                </div>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute -inset-2 border-2 border-dashed border-indigo-200 rounded-full opacity-50"
                                />
                            </div>

                            <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                                {t('cards.modal.title')}
                            </h2>

                            <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8 px-2">
                                {t('cards.modal.desc')}
                            </p>

                            {/* Instruction List */}
                            <div className="w-full space-y-3 mb-8 text-left">
                                {(t('cards.modal.steps', { returnObjects: true }) as string[]).map((step, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-(--color-bg-app)/50 border border-(--color-border-glass)">
                                        <div className="h-6 w-6 rounded-lg bg-(--color-bg-surface) shadow-sm flex items-center justify-center text-[10px] font-black text-indigo-500 border border-(--color-border-glass)">
                                            {i + 1}
                                        </div>
                                        <span className="text-xs font-bold text-(--color-text-secondary)">{step}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={onUpgrade}
                                className="w-full h-16 rounded-2xl bg-indigo-600 text-white font-black text-lg shadow-[0_15px_30px_-5px_rgba(79,70,229,0.3)] hover:bg-indigo-700 flex items-center justify-center gap-2 group transition-all active:scale-[0.98]"
                            >
                                <span>{t('cards.modal.upgrade')}</span>
                                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                            </button>

                            <button
                                onClick={onClose}
                                className="mt-4 text-[11px] font-black uppercase tracking-widest text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors"
                            >
                                {t('cards.modal.later')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
