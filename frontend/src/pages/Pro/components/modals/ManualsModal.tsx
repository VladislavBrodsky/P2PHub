import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Flame, Sparkles, ArrowRight } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { renderMarkdown } from '../../utils/renderMarkdown';


interface ManualsModalProps {
    showManual: string | null;
    setShowManual: (manual: string | null) => void;
    selection: () => void;
}

export const ManualsModal: React.FC<ManualsModalProps> = ({
    showManual,
    setShowManual,
    selection
}) => {
    const { t } = useTranslation('pro');

    return (
        <AnimatePresence>
            {showManual && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/90 backdrop-blur-md"
                    onClick={() => setShowManual(null)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg rounded-[2.5rem] border border-slate-200 dark:border-white/10 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl shadow-3xl flex flex-col max-h-[85vh] relative"
                    >
                        {/* Decorative elements */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-blue-500 to-pink-500 opacity-50" />
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full" />
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full" />

                        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500 dark:bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                                    <BookOpen size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
                                        {showManual === 'studio' ? t('academy.studio_manual.title') :
                                            showManual === 'tools' ? t('tools.headline.title') :
                                                showManual === 'academy' ? t('academy.protocols.title') :
                                                    showManual === 'setup_x' ? t('setup.x_manual.title') :
                                                        showManual === 'setup_tg' ? t('setup.tg_manual.title') :
                                                            showManual === 'setup_linkedin' ? t('setup.linkedin_manual.title') :
                                                                showManual === 'setup_facebook' ? t('setup.facebook_manual.title') :
                                                                    showManual === 'setup_discord' ? t('setup.discord_manual.title') :
                                                                        t('academy.viral_assets.title')}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        <p className="text-label font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] opacity-80">
                                            {showManual === 'setup_x' ? t('setup.x_manual.subtitle') :
                                                showManual === 'setup_tg' ? t('setup.tg_manual.subtitle') :
                                                    showManual === 'setup_linkedin' ? t('setup.linkedin_manual.subtitle') :
                                                        showManual === 'setup_facebook' ? t('setup.facebook_manual.subtitle') :
                                                            showManual === 'setup_discord' ? t('setup.discord_manual.subtitle') :
                                                                t('academy.studio_manual.subtitle')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowManual(null)}
                                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors group"
                            >
                                <X size={20} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-8 space-y-6 relative z-10">
                            {['studio', 'setup_x', 'setup_tg', 'setup_linkedin', 'setup_pinterest', 'setup_threads', 'setup_facebook', 'setup_discord'].includes(showManual || '') ? (
                                (() => {
                                    const key = showManual === 'studio' ? 'academy.studio_manual.steps' :
                                        showManual === 'setup_x' ? 'setup.x_manual.steps' :
                                            showManual === 'setup_tg' ? 'setup.tg_manual.steps' :
                                                showManual === 'setup_linkedin' ? 'setup.linkedin_manual.steps' :
                                                    showManual === 'setup_pinterest' ? 'setup.pinterest_manual.steps' :
                                                        showManual === 'setup_threads' ? 'setup.threads_manual.steps' :
                                                            showManual === 'setup_facebook' ? 'setup.facebook_manual.steps' :
                                                                'setup.discord_manual.steps';
                                    const steps = t(key, { returnObjects: true });
                                    if (Array.isArray(steps)) {
                                        return steps.map((step: any, i: number) => (
                                            <div key={i} className="flex gap-5 items-start relative group">
                                                {i < steps.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-slate-100 dark:bg-white/10" />}
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-label font-bold text-blue-500 dark:text-blue-400 shrink-0 shadow-sm group-hover:border-blue-500/30 transition-colors z-10">
                                                    {(i + 1).toString().padStart(2, '0')}
                                                </div>
                                                <div className="space-y-1.5 pt-1">
                                                    <h4 className="text-caption font-bold text-slate-900 dark:text-white uppercase tracking-tight">{step.title}</h4>
                                                    <div className="text-label font-medium text-slate-500 dark:text-slate-400 leading-relaxed opacity-80">{renderMarkdown(step.desc)}</div>

                                                </div>
                                            </div>
                                        ));
                                    }
                                    return null;
                                })()
                            ) : showManual === 'tools' ? (
                                <div className="space-y-6">
                                    <div className="p-5 bg-linear-to-br from-pink-500/5 to-transparent dark:bg-white/5 rounded-3xl border border-pink-500/10 dark:border-white/5 space-y-3 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <Flame size={14} className="text-pink-500" />
                                            <h4 className="text-label font-bold text-pink-600 dark:text-pink-500 uppercase tracking-widest">{t('tools.headline.title')}</h4>
                                        </div>
                                        <p className="text-label font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic opacity-85">"{t('tools.headline.desc')}"</p>
                                        <div className="p-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-white dark:border-white/5 text-label text-slate-500 dark:text-slate-400 leading-relaxed">
                                            {t('tools.headline.neural_desc')}
                                        </div>
                                    </div>
                                    <div className="p-5 bg-linear-to-br from-amber-500/5 to-transparent dark:bg-white/5 rounded-3xl border border-amber-500/10 dark:border-white/5 space-y-3 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={14} className="text-amber-500" />
                                            <h4 className="text-label font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">{t('tools.bio.title')}</h4>
                                        </div>
                                        <p className="text-label font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic opacity-85">"{t('tools.bio.desc')}"</p>
                                        <div className="p-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-white dark:border-white/5 text-label text-slate-500 dark:text-slate-400 leading-relaxed">
                                            {t('tools.bio.neural_desc')}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="p-6 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/10 flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                                            <Sparkles className="text-white" size={24} />
                                        </div>
                                        <p className="text-caption font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-snug">
                                            <Trans i18nKey="academy.protocols.growth_promo">
                                                PRO Members grow their network <span className="text-blue-600 dark:text-blue-400">x5 faster</span> using these elite protocols.
                                            </Trans>
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-label font-bold text-slate-400 uppercase tracking-widest px-1">{t('academy.protocols.methodology_title')}</h4>
                                        <p className="text-caption font-medium text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-white/5 p-5 rounded-3xl border border-slate-100 dark:border-white/5">
                                            {t('academy.protocols.methodology_desc')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 sm:p-8 bg-slate-50 dark:bg-black/40 border-t border-slate-100 dark:border-white/5 relative z-10">
                            <button
                                onClick={() => { selection(); setShowManual(null); }}
                                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-label uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                {t('academy.understand_protocol_btn')}
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
