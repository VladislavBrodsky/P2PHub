import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactDOM from 'react-dom';
import { X, Shield, FileText, Scale } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';

export const Footer = () => {
    const { t } = useTranslation();
    const [activeDoc, setActiveDoc] = useState<'terms' | 'privacy' | null>(null);

    const docContent = {
        terms: {
            title: t('legal.terms_title'),
            icon: Scale,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            content: (
                <div className="space-y-6 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {[1, 2, 3, 4, 5].map(i => (
                        <p key={i}>
                            <strong className="text-slate-900 dark:text-white block mb-1">{t(`legal.terms.${i}_title`)}</strong>
                            {t(`legal.terms.${i}_desc`)}
                        </p>
                    ))}
                </div>
            )
        },
        privacy: {
            title: t('legal.privacy_title'),
            icon: Shield,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            content: (
                <div className="space-y-6 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {[1, 2, 3, 4].map(i => (
                        <p key={i}>
                            <strong className="text-slate-900 dark:text-white block mb-1">{t(`legal.privacy.${i}_title`)}</strong>
                            {t(`legal.privacy.${i}_desc`)}
                        </p>
                    ))}
                </div>
            )
        }
    };

    return (
        <footer className="px-6 pb-8 pt-8 border-t border-(--color-border-glass) bg-(--color-bg-deep) relative z-50">
            <div className="max-w-md mx-auto space-y-6">
                {/* Disclaimer Section */}
                <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400/80">
                        {t('legal.disclaimer_title')}
                    </h5>
                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                        <Trans i18nKey="legal.disclaimer_desc">
                            We are a community of digital nomads and online entrepreneurs who search for global trends. We act as a <span className="text-slate-900 dark:text-white font-bold">Third-Party Ambassador Agency</span> and do not have an official corporate connection to Pintopay.
                        </Trans>
                    </p>
                    <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl flex gap-3 items-start relative overflow-hidden">
                        <Shield className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5 relative z-10" />
                        <p className="text-[10px] text-rose-600 dark:text-rose-300 leading-relaxed font-bold relative z-10">
                            {t('legal.risk_warning')}
                        </p>
                    </div>
                </div>

                {/* Links */}
                <div className="flex flex-wrap gap-4 justify-center items-center pt-4 border-t border-slate-200 dark:border-white/10">
                    <button
                        onClick={() => setActiveDoc('terms')}
                        className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-wider flex items-center gap-1.5"
                    >
                        <Scale className="w-3 h-3" />
                        {t('legal.terms_title')}
                    </button>
                    <button
                        onClick={() => setActiveDoc('privacy')}
                        className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-wider flex items-center gap-1.5"
                    >
                        <FileText className="w-3 h-3" />
                        {t('legal.privacy_title')}
                    </button>
                </div>

                <div className="text-center space-y-2">
                    <p className="text-[10px] text-slate-400/60 font-bold tracking-widest uppercase">
                        {t('legal.copyright')}
                    </p>
                </div>
            </div>

            {/* Document Modals */}
            {typeof document !== 'undefined' && ReactDOM.createPortal(
                <AnimatePresence>
                    {activeDoc && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setActiveDoc(null)}
                                className="fixed inset-0 z-9999 bg-black/60 backdrop-blur-md"
                            />
                            <div className="fixed inset-0 z-10000 flex items-end sm:items-center justify-center pointer-events-none">
                                <motion.div
                                    initial={{ y: "100%" }}
                                    animate={{ y: 0 }}
                                    exit={{ y: "100%" }}
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                    className="pointer-events-auto bg-(--color-surface) border-t sm:border border-(--color-border-glass) w-full max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                                >
                                    {/* Header */}
                                    <div className="p-5 border-b border-(--color-border-glass) flex justify-between items-center bg-(--color-bg-glass) backdrop-blur-xl relative z-10">
                                        <div className="flex items-center gap-3">
                                            {activeDoc && (() => {
                                                const Icon = docContent[activeDoc].icon;
                                                return (
                                                    <div className={`w-8 h-8 rounded-full ${docContent[activeDoc].bg} flex items-center justify-center`}>
                                                        <Icon className={`w-4 h-4 ${docContent[activeDoc].color}`} />
                                                    </div>
                                                );
                                            })()}
                                            <h3 className="text-sm font-black text-(--color-text-primary) uppercase tracking-wider">
                                                {activeDoc && docContent[activeDoc].title}
                                            </h3>
                                        </div>
                                        <button
                                            onClick={() => setActiveDoc(null)}
                                            className="w-8 h-8 rounded-full bg-(--color-text-primary)/5 hover:bg-(--color-text-primary)/10 flex items-center justify-center transition-colors"
                                        >
                                            <X className="w-4 h-4 text-(--color-text-secondary)" />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 overflow-y-auto custom-scrollbar">
                                        {docContent[activeDoc].content}
                                    </div>

                                    {/* Footer */}
                                    <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                                        <button
                                            onClick={() => setActiveDoc(null)}
                                            className="w-full py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 active:scale-[0.98] font-bold rounded-xl transition-all text-xs tracking-wider uppercase"
                                        >
                                            {t('legal.understand')}
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </footer>
    );
};

