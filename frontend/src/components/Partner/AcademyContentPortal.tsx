import React from 'react';
import { motion } from 'framer-motion';
import { X, Zap, CheckCircle2, ArrowRight, Lock, Trophy, Lightbulb, Wand2 } from 'lucide-react';
import { AcademyStage } from '../../data/academyData';
import { useTranslation, Trans } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { useUI } from '../../context/UIContext';

interface AcademyContentPortalProps {
    stage: AcademyStage;
    onClose: () => void;
    onComplete: (id: number) => void;
    isLocked: boolean;
}

export const AcademyContentPortal: React.FC<AcademyContentPortalProps> = ({ stage, onClose, onComplete, isLocked }) => {
    const { t } = useTranslation();
    const { user } = useUser();
    const { setHeaderVisible } = useUI();

    // Prevent body scroll when portal is open
    React.useEffect(() => {
        setHeaderVisible(false);
        const main = document.querySelector('main');
        const originalOverflow = main ? main.style.overflow : '';
        if (main) main.style.overflow = 'hidden';

        return () => {
            setHeaderVisible(true);
            if (main) main.style.overflow = originalOverflow;
        };
    }, [setHeaderVisible]);

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />

            {/* Modal Content */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-[1.5rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh]"
            >
                {/* Fixed Header Bar - Premium Glassmorphism */}
                <div className="sticky top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/10 dark:bg-black/20 backdrop-blur-2xl border-b border-white/10">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="pointer-events-auto p-2 rounded-xl bg-white/20 backdrop-blur-xl border border-white/30 text-slate-900 dark:text-white hover:scale-105 active:scale-90 transition-all shadow-lg flex items-center gap-2 group"
                    >
                        <X className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest pr-1 hidden sm:block">{t('common.close')}</span>
                    </button>

                    {/* Stats Badge */}
                    <div className="pointer-events-auto flex items-center gap-1.5 p-1 pr-3 rounded-xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-lg">
                        <div className="px-2 py-1 rounded-lg bg-white/90 dark:bg-slate-900 border border-white/50 shadow-sm flex items-center gap-1.5 min-w-[45px] justify-center">
                            <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-tighter">LVL</span>
                            <span className="text-xs font-black text-slate-900 dark:text-white leading-none">{user?.level || 1}</span>
                            <Trophy className="w-2.5 h-2.5 text-amber-500" />
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-slate-900 dark:text-white leading-none">{user?.xp || 0}</span>
                            <span className="text-[6.5px] font-black text-green-500 uppercase tracking-widest">XP</span>
                        </div>
                    </div>
                </div>

                {/* Content Area (Scrollable) */}
                <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar scroll-smooth">
                    {/* Decorative Liquid Header */}
                    <div className="h-32 branding-liquid-gradient relative flex items-center justify-center pt-4">
                        <div className="absolute inset-0 bg-linear-to-t from-white dark:from-[#0f172a] to-transparent" />
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative z-10 w-20 h-20 rounded-2xl bg-white/40 dark:bg-white/10 backdrop-blur-2xl border border-white/40 flex items-center justify-center shadow-2xl"
                        >
                            <stage.icon className="w-10 h-10 text-slate-900 dark:text-white" />
                        </motion.div>
                    </div>

                    <div className="p-5 pt-0 space-y-6">
                        {isLocked ? (
                            /* PRO Lock View */
                            <div className="flex flex-col items-center text-center space-y-6 py-8">
                                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                    <Lock className="w-8 h-8 text-amber-500" />
                                </div>
                                <div className="space-y-1.5">
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('academy.stage_locked')}</h2>
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium max-w-[260px]">
                                        {t('academy.lock_desc')}
                                    </p>
                                </div>

                                <div className="w-full p-5 rounded-3xl bg-linear-to-br from-amber-500/10 to-transparent border border-amber-500/20 space-y-4">
                                    <div className="flex items-center gap-2.5">
                                        <Zap className="w-4 h-4 text-amber-500" />
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{t('academy.pro_benefits')}</span>
                                    </div>
                                    <ul className="space-y-1 text-left">
                                        {(t('academy.pro_items', { returnObjects: true }) as string[]).map((item, i) => (
                                            <li key={i} className="flex items-center gap-2 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                                                <div className="w-1 h-1 rounded-full bg-amber-500" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button className="w-full py-4 rounded-xl bg-amber-500 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 active:scale-95 transition-all">
                                    {t('academy.upgrade_btn')}
                                </button>
                            </div>
                        ) : (
                            /* Lesson Content View */
                            <div className="space-y-8 pb-12">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[8px] font-black text-blue-500 uppercase tracking-widest">
                                            {t('academy.mastery', { stage: stage.id })}
                                        </div>
                                        <div className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                            {stage.category}
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-[0.9] tracking-tight">
                                        {stage.title}
                                    </h2>
                                </div>

                                {/* Main Article Content */}
                                <div className="space-y-6 text-slate-600 dark:text-slate-400 text-[13px] leading-relaxed font-medium">
                                    <p className="text-base text-slate-900 dark:text-white font-bold leading-snug">
                                        <Trans i18nKey="academy.elite_training">
                                            Welcome to the elite training floor. To reach the result of <strong>$1 per minute</strong>, we must first master the art of <strong>leverage</strong>.
                                        </Trans>
                                    </p>

                                    <div className="p-5 rounded-[1.5rem] bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 space-y-2 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 blur-xl -mr-6 -mt-6" />
                                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 font-black text-[10px] uppercase tracking-widest relative z-10">
                                            <Lightbulb className="w-3.5 h-3.5" />
                                            {t('academy.profit_secret')}
                                        </div>
                                        <p className="text-xs italic leading-relaxed text-slate-700 dark:text-slate-300 relative z-10 font-bold">
                                            "{t('academy.profit_quote')}"
                                        </p>
                                    </div>

                                    <p>
                                        <Trans i18nKey="academy.growth_hacker">
                                            In the year 2026, manual marketing is dead. You need to become a <strong>Growth Hacker</strong>. This means using viral loops where every new member brings 3 more.
                                        </Trans>
                                    </p>

                                    {stage.id >= 5 && stage.id <= 10 && (
                                        <div className="p-5 rounded-[1.5rem] bg-linear-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 space-y-3">
                                            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black text-[10px] uppercase tracking-widest">
                                                <Wand2 className="w-3.5 h-3.5" />
                                                {t('academy.ai_expert')}
                                            </div>
                                            <p className="text-[11px] leading-relaxed">
                                                {t('academy.ai_desc')}
                                            </p>
                                            <button className="text-[8px] font-black text-purple-500 uppercase tracking-[0.2em] flex items-center gap-2 group">
                                                {t('academy.learn_how')} <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    )}

                                    <p className="opacity-80">
                                        {t('academy.build_empire')}
                                    </p>
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => onComplete(stage.id)}
                                    className="w-full py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/5"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    {t('academy.complete_stage', { stage: stage.id })}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Footer Decoration */}
                <div className="h-6 bg-linear-to-t from-white dark:from-[#0f172a] to-transparent pointer-events-none absolute bottom-0 left-0 right-0 z-10" />
            </motion.div>
        </div>
    );
};
