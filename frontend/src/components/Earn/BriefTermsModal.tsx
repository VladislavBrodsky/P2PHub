import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Target, BookOpen, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';

interface BriefTermsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BriefTermsModal({ isOpen, onClose }: BriefTermsModalProps) {
    const { t } = useTranslation();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    />
                    <motion.div
                        initial={{ y: 100, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 100, opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="w-full max-w-md bg-[#020617] border border-white/10 rounded-[2rem] relative shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 pb-4 border-b border-white/5 bg-white/5 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                    {t('referral.brief.title')}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-4 h-4 text-white/50" />
                                </button>
                            </div>
                        </div>

                        {/* Content Scrollable Area */}
                        <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">

                            {/* Mission / Goal */}
                            <section className="space-y-3">
                                <div className="flex items-center gap-2 text-blue-400">
                                    <Target className="w-4 h-4" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider">{t('referral.brief.goal_title')}</h3>
                                </div>
                                <div className="p-4 rounded-2xl bg-linear-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                                    <p className="text-sm font-medium text-blue-100 leading-relaxed">
                                        <Trans i18nKey="referral.brief.goal_desc">
                                            Our mission is to build the world's largest decentralized partner network.
                                            <span className="text-white font-bold"> Your goal is simple:</span> Expand the network, earn XP, and unlock the <span className="text-emerald-400 font-bold">$1/minute passive income stream.</span>
                                        </Trans>
                                    </p>
                                </div>
                            </section>

                            {/* Manual / How it Works */}
                            <section className="space-y-3">
                                <div className="flex items-center gap-2 text-violet-400">
                                    <BookOpen className="w-4 h-4" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider">{t('referral.brief.manual_title')}</h3>
                                </div>
                                <ul className="space-y-3">
                                    {[1, 2, 3].map((step) => (
                                        <li key={step} className="flex gap-3 items-start p-3 rounded-xl bg-white/5 border border-white/5">
                                            <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5 border border-violet-500/30">
                                                <span className="text-xs font-bold text-violet-300">{step}</span>
                                            </div>
                                            <p className="text-xs text-gray-300 leading-5">
                                                {t(`referral.brief.manual_step_${step}`)}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            {/* Rules & Anti-Fraud */}
                            <section className="space-y-3">
                                <div className="flex items-center gap-2 text-rose-400">
                                    <AlertTriangle className="w-4 h-4" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider">{t('referral.brief.rules_title')}</h3>
                                </div>
                                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-4">
                                    <div className="flex gap-3">
                                        <div className="shrink-0 mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                        </div>
                                        <p className="text-xs font-medium text-rose-200 leading-relaxed">
                                            <span className="text-white font-bold block mb-1">{t('referral.brief.rule_1_title')}</span>
                                            {t('referral.brief.rule_1_desc')}
                                        </p>
                                    </div>
                                    <div className="h-px bg-rose-500/20" />
                                    <div className="flex gap-3">
                                        <div className="shrink-0 mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                        </div>
                                        <p className="text-xs font-medium text-rose-200 leading-relaxed">
                                            <span className="text-white font-bold block mb-1">{t('referral.brief.rule_2_title')}</span>
                                            {t('referral.brief.rule_2_desc')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 bg-rose-950/30 rounded-lg border border-rose-900/50">
                                    <ShieldCheck className="w-3 h-3 text-rose-500" />
                                    <p className="text-[10px] font-bold text-rose-400 uppercase">{t('referral.brief.antibot_active')}</p>
                                </div>
                            </section>

                            {/* Motivation / Benefits */}
                            <section className="pt-2">
                                <div className="relative overflow-hidden group rounded-2xl bg-linear-to-r from-emerald-900/40 to-emerald-800/20 border border-emerald-500/30 p-5">
                                    <div className="absolute top-0 right-0 p-3 opacity-10">
                                        <Zap className="w-24 h-24 text-emerald-500" />
                                    </div>
                                    <h3 className="text-lg font-black text-white mb-2 relative z-10">
                                        {t('referral.brief.motivation_title')}
                                    </h3>
                                    <p className="text-xs text-emerald-100/80 mb-4 relative z-10 leading-relaxed">
                                        {t('referral.brief.motivation_desc')}
                                    </p>
                                    <button
                                        onClick={onClose}
                                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 relative z-10"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        {t('referral.brief.cta')}
                                    </button>
                                </div>
                            </section>

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
