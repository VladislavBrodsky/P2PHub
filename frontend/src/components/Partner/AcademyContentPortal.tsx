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
    const { setHeaderVisible, setFooterVisible, setNotificationsVisible } = useUI();

    // Prevent body scroll and hide global UI elements when portal is open
    React.useEffect(() => {
        setHeaderVisible(false);
        setFooterVisible(false);
        setNotificationsVisible(false);

        const main = document.querySelector('main');
        const originalOverflow = main ? main.style.overflow : '';
        if (main) main.style.overflow = 'hidden';

        return () => {
            setHeaderVisible(true);
            setFooterVisible(true);
            setNotificationsVisible(true);
            if (main) main.style.overflow = originalOverflow;
        };
    }, [setHeaderVisible, setFooterVisible, setNotificationsVisible]);

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
            />
            /* #comment: Increased backdrop opacity and blur for absolute focus on content */

            {/* Modal Content */}
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="relative w-full h-full sm:h-auto sm:max-w-lg bg-white dark:bg-[#030712] sm:rounded-[2rem] shadow-2xl border-t sm:border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col"
            >
                /* #comment: Enabled full-screen mode on mobile to respect safe areas and provide more room */

                {/* Fixed Header Bar - Premium Glassmorphism with Safe Area support */}
                <div className="sticky top-0 left-0 right-0 z-50 flex items-center justify-between px-6 pb-4 pt-[calc(var(--spacing-safe-top)+1rem)] bg-white/80 dark:bg-black/40 backdrop-blur-3xl border-b border-slate-200 dark:border-white/5">
                    {/* #comment: Added pt-[var(--spacing-safe-top)] to avoid conflict with Telegram UI Close/More buttons */}

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="pointer-events-auto p-2 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 text-slate-900 dark:text-white hover:scale-105 active:scale-90 transition-all shadow-md flex items-center gap-2 group"
                    >
                        <X className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest pr-1 hidden sm:block">{t('common.close')}</span>
                    </button>

                    {/* Stage Badge - Centered specifically for better hierarchy */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.2em] leading-none mb-1">Academy</span>
                        <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">Stage {stage.id}</h3>
                    </div>

                    {/* Stats Badge */}
                    <div className="pointer-events-auto flex items-center gap-1.5 p-1 pr-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
                        <div className="px-2 py-1 rounded-lg bg-blue-500 border border-blue-400 shadow-lg flex items-center justify-center">
                            <span className="text-xs font-black text-white leading-none">{user?.level || 1}</span>
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
                    <div className="h-40 branding-liquid-gradient relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-linear-to-t from-white dark:from-[#030712] to-transparent" />
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            className="relative z-10 w-24 h-24 rounded-3xl bg-white/40 dark:bg-white/10 backdrop-blur-2xl border border-white/40 flex items-center justify-center shadow-2xl"
                        >
                            <stage.icon className="w-12 h-12 text-blue-600 dark:text-white" />
                        </motion.div>
                    </div>

                    <div className="p-6 pt-0 space-y-8">
                        {isLocked ? (
                            /* PRO Lock View */
                            <div className="flex flex-col items-center text-center space-y-8 py-12">
                                <div className="w-20 h-20 rounded-[2rem] bg-amber-500/10 border-2 border-dashed border-amber-500/30 flex items-center justify-center">
                                    <Lock className="w-10 h-10 text-amber-500" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('academy.stage_locked')}</h2>
                                    <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium max-w-[280px] leading-relaxed">
                                        {t('academy.lock_desc')}
                                    </p>
                                </div>

                                <div className="w-full p-6 rounded-[2rem] bg-linear-to-br from-amber-500/10 to-transparent border border-amber-500/20 space-y-5">
                                    <div className="flex items-center gap-3">
                                        <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                                        <span className="text-[11px] font-black text-amber-500 uppercase tracking-widest">{t('academy.pro_benefits')}</span>
                                    </div>
                                    <ul className="space-y-2 text-left">
                                        {(t('academy.pro_items', { returnObjects: true }) as string[]).map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button className="w-full py-5 rounded-2xl bg-amber-500 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-amber-500/30 active:scale-95 transition-all">
                                    {t('academy.upgrade_btn')}
                                </button>
                            </div>
                        ) : (
                            /* Lesson Content View */
                            <div className="space-y-10 pb-20">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-500 uppercase tracking-widest">
                                            {t('academy.mastery', { stage: stage.id })}
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                            {stage.category}
                                        </div>
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-[0.95] tracking-tight">
                                        {stage.title}
                                    </h2>
                                </div>

                                {/* Main Article Content */}
                                <div className="space-y-7 text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed font-medium">
                                    <p className="text-lg text-slate-900 dark:text-white font-bold leading-snug">
                                        <Trans i18nKey="academy.elite_training">
                                            Welcome to the elite training floor. To reach the result of <span className="text-blue-600"><strong>$1 per minute</strong></span>, we must first master the art of <strong>leverage</strong>.
                                        </Trans>
                                    </p>

                                    <div className="p-6 rounded-[2rem] bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 space-y-3 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl -mr-8 -mt-8" />
                                        <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-500 font-black text-[11px] uppercase tracking-widest relative z-10">
                                            <Lightbulb className="w-4 h-4" />
                                            {t('academy.profit_secret')}
                                        </div>
                                        <p className="text-[14px] italic leading-relaxed text-slate-700 dark:text-slate-200 relative z-10 font-bold">
                                            "{t('academy.profit_quote')}"
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <p>
                                            <Trans i18nKey="academy.growth_hacker">
                                                In the year 2026, manual marketing is dead. You need to become a <span className="text-blue-600 dark:text-blue-400"><strong>Growth Hacker</strong></span>. This means using viral loops where every new member brings 3 more.
                                            </Trans>
                                        </p>
                                        /* #comment: Fixed GROWTH HACKER text color glitch by highlighting it with brand blue */
                                    </div>

                                    {stage.id >= 5 && stage.id <= 10 && (
                                        <div className="p-6 rounded-[2rem] bg-linear-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 space-y-4">
                                            <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400 font-black text-[11px] uppercase tracking-widest">
                                                <Wand2 className="w-4 h-4" />
                                                {t('academy.ai_expert')}
                                            </div>
                                            <p className="text-[13px] leading-relaxed">
                                                {t('academy.ai_desc')}
                                            </p>
                                            <button className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] flex items-center gap-2 group">
                                                {t('academy.learn_how')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    )}

                                    <p className="opacity-90">
                                        {t('academy.build_empire')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Action Bar - Floating & Padded for TMA Safe Area */}
                <div className="absolute bottom-0 left-0 right-0 p-6 pb-[calc(var(--spacing-safe-bottom)+1.5rem)] bg-linear-to-t from-white via-white/95 to-transparent dark:from-[#030712] dark:via-[#030712]/95 z-20">
                    {/* #comment: Added significant bottom padding calc(safe+1.5rem) to clear Telegram's native buttons and avoid CTA overlap */}
                    {!isLocked && (
                        <button
                            onClick={() => onComplete(stage.id)}
                            className="w-full py-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-95 transition-all flex items-center justify-center gap-4 border border-white/5 active:brightness-90"
                        >
                            <CheckCircle2 className="w-5 h-5" />
                            {t('academy.complete_stage', { stage: stage.id })}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
