import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Zap, CheckCircle2, ArrowRight, Lock, Lightbulb, Wand2, Share2, Target, ArrowLeft } from 'lucide-react';
import { AcademyStage } from '../../data/academyData';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { useUI } from '../../context/UIContext';
import { useTMALock } from '../../hooks/useTMALock';
import { renderMarkdown, renderInline } from '../../utils/renderMarkdown';

interface AcademyContentPortalProps {
    stage: AcademyStage;
    onClose: () => void;
    onComplete: (id: number) => void;
    isLocked: boolean;
}

export const AcademyContentPortal: React.FC<AcademyContentPortalProps> = ({ stage, onClose, onComplete, isLocked }) => {
    const { t } = useTranslation(['academy', 'common']);
    const { user } = useUser();
    const { setHeaderVisible, setFooterVisible, setNotificationsVisible } = useUI();
    const [missionAccomplished, setMissionAccomplished] = React.useState(false);

    useTMALock(true);
    const [scrolledProgress, setScrolledProgress] = React.useState(0);
    const contentRef = React.useRef<HTMLDivElement>(null);

    const getStageContent = (id: number) => {
        return {
            titleKey: `academy_content.stage_${id}_title`,
            params: {}
        };
    };

    const { titleKey, params } = getStageContent(stage.id);
    const title = t(titleKey, { ...params, defaultValue: stage.title });
    const category = t(`academy_categories.${stage.category}`, stage.category);

    // Prevent body scroll and hide global UI elements when portal is open
    React.useEffect(() => {
        setHeaderVisible(false);
        setFooterVisible(false);
        setNotificationsVisible(false);

        const main = document.querySelector('main');
        const originalOverflow = main ? main.style.overflow : '';
        if (main) {
            main.style.overflow = 'hidden';
            main.style.height = '100dvh'; // Lock height to prevent TMA rubber-banding
        }

        return () => {
            setHeaderVisible(true);
            setFooterVisible(true);
            setNotificationsVisible(true);
            if (main) {
                main.style.overflow = originalOverflow;
                main.style.height = '';
            }
        };
    }, [setHeaderVisible, setFooterVisible, setNotificationsVisible]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const element = e.currentTarget;
        const scrollPercent = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
        setScrolledProgress(scrollPercent);
    };

    const handleShareSecret = () => {
        const secret = t(`academy_content.stage_${stage.id}_lesson_secret`);
        const text = `🔥 P2P Secret from Academy Stage ${stage.id}:\n\n"${secret}"\n\nJoin the elite floor with me: https://t.me/pintopay_bot?start=r_${user?.id}`;

        if (navigator.share) {
            navigator.share({
                title: 'P2P Viral Secret',
                text: text,
            }).catch(() => { });
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(text);
            alert(t('common:copied_to_clipboard'));
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-0 sm:p-4">
            {/* Backdrop - Blocks background interaction */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/90 backdrop-blur-3xl touch-none"
            />

            {/* Modal Content - Allowed to receive touch events */}
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 32, stiffness: 350 }}
                className="relative w-full sm:max-w-lg bg-white dark:bg-[#030712] sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 dark:border-white/10 flex flex-col"
                style={{
                    height: '100dvh',
                    maxHeight: '100dvh',
                    overscrollBehavior: 'none',
                }}
            >
                {/* Fixed Header Bar - Premium Glassmorphism with Safe Area support */}
                <div className="sticky top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 pb-4 pt-[calc(var(--spacing-safe-top,32px)+3rem)] bg-white/80 dark:bg-black/40 backdrop-blur-3xl border-b border-slate-200 dark:border-white/5 shrink-0">

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="pointer-events-auto p-2 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 text-slate-900 dark:text-white hover:scale-105 active:scale-90 transition-all shadow-md flex items-center gap-2 group z-50"
                    >
                        <X className="w-4 h-4" />
                        <span className="text-label font-bold uppercase tracking-widest pr-1 hidden sm:block">{t('common:close')}</span>
                    </button>

                    {/* Stage Badge - Centered specifically for better hierarchy */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                        <span className="text-label font-bold text-blue-500 uppercase tracking-[0.2em] leading-none mb-1">{t('academy.academy_label')}</span>
                        <h3 className="text-label font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('academy.stage_title', { stage: stage.id })}</h3>
                    </div>

                    {/* Stats Badge */}
                    <div className="pointer-events-auto flex items-center gap-1.5 p-1 pr-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm z-50">
                        <div className="px-2 py-1 rounded-lg bg-blue-500 border border-blue-400 shadow-lg flex items-center justify-center">
                            <span className="text-xs font-bold text-white leading-none">{user?.level || 1}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-label font-bold text-slate-900 dark:text-white leading-none">{Math.floor(user?.xp || 0)}</span>
                            <span className="text-label font-bold text-green-500 uppercase tracking-widest">{t('common:xp')}</span>
                        </div>
                    </div>

                    {/* Scroll Progress Bar - Subtle at the bottom of header */}
                    <div className="absolute bottom-0 left-0 h-[2px] bg-blue-500/20 w-full overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${scrolledProgress}%` }}
                            transition={{ duration: 0.1 }}
                        />
                    </div>
                </div>

                {/* Content Area (Scrollable) — uses flex-1 to fill remaining space */}
                <div
                    ref={contentRef}
                    onScroll={handleScroll}
                    className="flex-1 min-h-0 custom-scrollbar"
                    style={{
                        overflowY: 'scroll',
                        overflowX: 'hidden',
                        WebkitOverflowScrolling: 'touch',
                        overscrollBehavior: 'contain',
                        // Extra bottom padding: safe-area + fixed bottom bar (~90px) + breathing room
                        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 120px)',
                    }}
                >

                    <div className="p-5 pt-8 space-y-7">
                        {isLocked ? (
                            /* PRO Lock View */
                            <div className="flex flex-col items-center text-center space-y-8 py-12">
                                <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border-2 border-dashed border-amber-500/30 flex items-center justify-center">
                                    <Lock className="w-10 h-10 text-amber-500" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                                        {stage.id === 20 ? t('academy.locked.stage_20_lock_title') : t('academy.stage_locked')}
                                    </h2>
                                    <p className="text-caption text-slate-500 dark:text-slate-400 font-medium max-w-[280px] leading-relaxed">
                                        {stage.id === 20 ? t('academy.locked.stage_20_lock_desc') : t('academy.lock_desc')}
                                    </p>
                                </div>

                                <div className="w-full p-6 rounded-2xl bg-linear-to-br from-amber-500/10 to-transparent border border-amber-500/20 space-y-5">
                                    <div className="flex items-center gap-3">
                                        <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                                        <span className="text-label font-bold text-amber-500 uppercase tracking-widest">{t('academy.pro_benefits')}</span>
                                    </div>
                                    <ul className="space-y-2 text-left">
                                        {Array.isArray(t('academy.pro_items', { returnObjects: true })) && (t('academy.pro_items', { returnObjects: true }) as string[]).map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-label font-bold text-slate-700 dark:text-slate-300">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button
                                    onClick={() => {
                                        onClose();
                                        window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'subscription' }));
                                    }}
                                    className="w-full py-5 rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 text-white font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <span>{t('academy.upgrade_now')}</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        ) : (

                            /* Lesson Content View */
                            <div className="space-y-10">
                                {/* Hero Image */}
                                <div className="relative h-40 rounded-xl overflow-hidden -mx-1 shrink-0">
                                    <div className="absolute inset-0 bg-linear-to-br from-blue-900 via-slate-900 to-purple-900" />
                                    <img
                                        src="/images/academy_hero.webp"
                                        alt=""
                                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-white dark:to-[#030712]" />
                                    <div className="absolute bottom-3 left-4 right-4 z-10">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="px-2 py-0.5 rounded-md bg-blue-500/30 backdrop-blur-md border border-blue-500/30 text-label font-bold text-blue-200 uppercase tracking-widest">
                                                {t('academy.academy_label')} · {t('academy.stage_title', { stage: stage.id })}
                                            </span>
                                        </div>
                                        <h2 className="text-xl font-bold text-white leading-tight tracking-tight drop-shadow-lg">
                                            {title}
                                        </h2>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-label font-bold text-blue-500 uppercase tracking-widest">
                                            {t('academy.mastery', { stage: stage.id })}
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-label font-bold text-slate-500 uppercase tracking-widest">
                                            {category}
                                        </div>
                                    </div>
                                </div>

                                {/* Main Article Content */}
                                <div className="space-y-7 text-slate-600 dark:text-slate-400 text-body leading-relaxed font-medium">
                                    <div className="text-body text-slate-900 dark:text-white font-bold leading-snug">
                                        {renderInline(t(`academy_content.stage_${stage.id}_lesson_intro`, { defaultValue: t('academy.elite_training') }))}
                                    </div>

                                    <div className="p-5 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 space-y-3 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl -mr-8 -mt-8" />
                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-500 font-bold text-label uppercase tracking-widest">
                                                <Lightbulb className="w-4 h-4" />
                                                {t(`academy_content.stage_${stage.id}_lesson_secret_title`, { defaultValue: t('academy.profit_secret') })}
                                            </div>
                                            <button
                                                onClick={handleShareSecret}
                                                className="p-1.5 rounded-lg bg-white dark:bg-white/5 border border-blue-200 dark:border-white/10 text-blue-500 hover:scale-110 active:scale-95 transition-all shadow-sm"
                                            >
                                                <Share2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <p className="text-caption italic leading-relaxed text-slate-700 dark:text-slate-200 relative z-10 font-bold">
                                            &ldquo;{renderInline(t(`academy_content.stage_${stage.id}_lesson_secret`, { defaultValue: t('academy.profit_quote') }))}&rdquo;
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Main body with full markdown support */}
                                        <div className="text-body leading-relaxed text-slate-600 dark:text-slate-400">
                                            {renderMarkdown(t(`academy_content.stage_${stage.id}_lesson_body`, { defaultValue: t('academy.growth_hacker') }))}
                                        </div>

                                        {/* AI Expert Section */}
                                        {(stage.category === 'ai' || (stage.id >= 5 && stage.id <= 10) || t(`academy_content.stage_${stage.id}_lesson_ai_expert`, { defaultValue: '' })) && (
                                            <div className="p-5 rounded-xl bg-linear-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 space-y-3">
                                                <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400 font-bold text-label uppercase tracking-widest">
                                                    <Wand2 className="w-4 h-4" />
                                                    {t('academy.ai_expert')}
                                                </div>
                                                <div className="text-caption leading-relaxed font-medium">
                                                    {renderMarkdown(t(`academy_content.stage_${stage.id}_lesson_ai_expert`, { defaultValue: t('academy.ai_desc') }))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Viral Rule / Marketing Trick Section */}
                                        {t(`academy_content.stage_${stage.id}_lesson_viral_rule`, { defaultValue: '' }) && (
                                            <div className="p-5 rounded-xl bg-linear-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20 space-y-3">
                                                <div className="flex items-center gap-2.5 text-pink-600 dark:text-pink-400 font-bold text-label uppercase tracking-widest">
                                                    <Zap className="w-4 h-4" />
                                                    {t('academy.viral_psychology')}
                                                </div>
                                                <p className="text-caption leading-relaxed font-bold italic text-slate-800 dark:text-slate-200">
                                                    &ldquo;{renderInline(t(`academy_content.stage_${stage.id}_lesson_viral_rule`))}&rdquo;
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="opacity-90 pt-4 border-t border-slate-100 dark:border-white/5 text-caption">
                                        {renderMarkdown(t(`academy_content.stage_${stage.id}_lesson_outro`, { defaultValue: t('academy.build_empire') }))}
                                    </div>

                                    {/* Action Mission - High Impact Commitment */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        className="p-6 rounded-2xl bg-slate-900 dark:bg-white/5 border border-slate-800 dark:border-white/10 space-y-5 relative overflow-hidden group/mission"
                                    >
                                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/mission:translate-x-full transition-transform duration-1000 pointer-events-none" />
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                                <Target className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-caption font-bold text-white uppercase tracking-wider">{t('academy.your_mission')}</h4>
                                        </div>

                                        <div
                                            onClick={() => setMissionAccomplished(!missionAccomplished)}
                                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 ${missionAccomplished
                                                ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                                                : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                                }`}
                                        >
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${missionAccomplished ? 'bg-blue-500 border-blue-500 rotate-0 scale-110 shadow-lg shadow-blue-500/20' : 'border-white/20 rotate-45 group-hover:rotate-0 group-hover:border-white/40'
                                                }`}>
                                                {missionAccomplished ? <CheckCircle2 className="w-4 h-4 text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                                            </div>
                                            <span className="text-caption font-bold leading-tight">
                                                {renderInline(t(`academy_content.stage_${stage.id}_lesson_mission`, { defaultValue: t('academy.apply_knowledge') }))}
                                            </span>
                                        </div>

                                        <p className="text-label text-slate-500 font-bold uppercase tracking-widest text-center pt-2">
                                            {missionAccomplished ? t('academy.mission_ready') : t('academy.mission_pending')}
                                        </p>
                                    </motion.div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 px-4 pt-4 bg-linear-to-t from-white via-white/98 to-transparent dark:from-[#030712] dark:via-[#030712]/98 z-20 flex gap-3"
                    style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)' }}
                >
                    <button
                        onClick={onClose}
                        className="w-14 h-auto rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 flex items-center justify-center active:scale-90 transition-all hover:bg-slate-200 dark:hover:bg-white/10"
                        aria-label={t('common:close')}
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>

                    {!isLocked ? (
                        <button
                            onClick={() => missionAccomplished && onComplete(stage.id)}
                            disabled={!missionAccomplished}
                            className={`flex-1 py-5 rounded-2xl font-bold text-sm uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-4 border touch-manipulation relative overflow-hidden ${missionAccomplished
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-95 brightness-110'
                                : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10 opacity-50 grayscale cursor-not-allowed shadow-none'
                                }`}
                        >
                            {missionAccomplished && (
                                <motion.div
                                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent"
                                    animate={{ x: ['100%', '-100%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                />
                            )}
                            <CheckCircle2 className={`w-5 h-5 transition-transform ${missionAccomplished ? 'scale-110' : 'scale-100'}`} />
                            {t('academy.complete_stage', { stage: stage.id })}
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                onClose();
                                window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'subscription' }));
                            }}
                            className="flex-1 py-5 rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 text-white font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                        >
                            <span>{t('academy.upgrade_now')}</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>
            </motion.div>
        </div>,
        document.body
    );

};
