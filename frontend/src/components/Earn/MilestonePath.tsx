import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllAchievements, getAllMilestones, Achievement } from '../../data/earnData';
// #comment: Removed unused Target and Gem icons from lucide-react to clean up the import list
import { Lock, ChevronDown, ChevronUp, Trophy, Sparkles, Zap, Star, Shield, X, Info, Share2, UserPlus, Milestone, ArrowRight, Flame } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useTranslation, Trans } from 'react-i18next';
import { useHaptic } from '../../hooks/useHaptic';
import { useTMALock } from '../../hooks/useTMALock';
import { shareUniversal } from '../../utils/shareUtils';

const Level100AchievementModal = lazy(() => import('./Level100AchievementModal').then(m => ({ default: m.Level100AchievementModal })));

const CHAPTER_TIERS = [
    { title: 'milestones.tier_1', range: [1, 5], icon: <Zap className="w-3 h-3" /> },
    { title: 'milestones.tier_2', range: [6, 10], icon: <Star className="w-3 h-3" /> },
    { title: 'milestones.tier_3', range: [11, 20], icon: <Shield className="w-3 h-3" /> },
    { title: 'milestones.tier_4', range: [21, 50], icon: <Trophy className="w-3 h-3" /> },
    { title: 'milestones.tier_5', range: [51, 100], icon: <Milestone className="w-3 h-3" /> },
];

export const MilestonePath = () => {
    const { t } = useTranslation(['social', 'common']);
    const { user } = useUser();
    const { selection } = useHaptic();
    const currentLevel = user?.level || 1;

    const [visibleChapters, setVisibleChapters] = useState(1);
    const [selectedItem, setSelectedItem] = useState<Achievement | null>(null);
    const [isLevel100ModalOpen, setIsLevel100ModalOpen] = useState(false);

    // Prevent body scroll and TMA swipes when modal is open
    useTMALock(!!selectedItem);

    // Handle Escape key to close modal
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedItem) {
                setSelectedItem(null);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [selectedItem]);

    const achievements = useMemo(() => getAllAchievements(), []);
    const milestones = useMemo(() => getAllMilestones(), []);

    const handleItemClick = (item: Achievement) => {
        selection();
        setSelectedItem(item);
    };

    const groupedChapters = useMemo(() => {
        return CHAPTER_TIERS.map(tier => {
            const achs = achievements.filter(a => a.level >= tier.range[0] && a.level <= tier.range[1]);
            const mils = milestones.filter(m => m.level >= tier.range[0] && m.level <= tier.range[1]);
            const isUnlocked = currentLevel >= tier.range[0];
            const isPartiallyComplete = achs.some(a => currentLevel >= a.level);
            return { ...tier, achs, mils, isUnlocked, isPartiallyComplete };
        });
    }, [achievements, milestones, currentLevel]);

    const handleShowMore = () => {
        selection();
        setVisibleChapters(prev => Math.min(prev + 1, CHAPTER_TIERS.length));
    };

    const renderGrid = (items: any[], typeLabel: string, color: string) => (
        <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
                <div className={`w-1.5 h-4 rounded-full ${color} shadow-[0_0_10px_rgba(0,0,0,0.1)]`} />
                <span className="text-label font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 whitespace-nowrap">{typeLabel}</span>
                <div className="h-px w-full bg-linear-to-r from-slate-200 dark:from-white/10 to-transparent" />
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {items.map((item) => {
                    const isUnlocked = currentLevel >= item.level;
                    const isLocked = !isUnlocked;

                    // Vibrant colors for the icons when unlocked
                    const iconColorClass = isUnlocked ? (item.color || 'text-indigo-500') : 'text-slate-300 dark:text-slate-700';
                    const iconBgClass = isUnlocked
                        ? (item.id === 'early_1' ? 'bg-orange-500/10 border-orange-500/20' :
                            item.id === 'ghost_share' ? 'bg-red-500/10 border-red-500/20' :
                                item.id === 'early_3' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                    item.id === 'viral_blitz' ? 'bg-yellow-500/10 border-yellow-500/20' :
                                        item.id === 'early_5' ? 'bg-blue-500/10 border-blue-500/20' :
                                            'bg-indigo-500/10 border-indigo-500/20')
                        : 'bg-slate-100 dark:bg-white/[0.03] border-transparent';

                    return (
                        <motion.div
                            key={`${item.id || item.level}-${item.level}`}
                            onClick={() => handleItemClick(item)}
                            whileHover={isUnlocked ? { y: -6, scale: 1.03 } : {}}
                            whileTap={{ scale: 0.96 }}
                            className={`
                                relative flex flex-col items-center p-2.5 sm:p-4 rounded-[20px] sm:rounded-[26px] border transition-all duration-500 cursor-pointer overflow-hidden group
                                ${isUnlocked
                                    ? 'bg-white dark:bg-slate-900/90 border-slate-100 dark:border-white/10 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.4)]'
                                    : 'bg-slate-50/50 dark:bg-white/2 border-slate-100 dark:border-white/5 opacity-60'}
                            `}
                        >
                            {/* Premium Background Mesh for Unlocked */}
                            {isUnlocked && (
                                <>
                                    <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-indigo-500/10 blur-3xl rounded-full pointer-events-none animate-pulse-subtle" />
                                </>
                            )}

                            {/* Status Indicator Dot with Glow */}
                            {isUnlocked && (
                                <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-20">
                                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                                    <div className="absolute inset-0 bg-emerald-400 blur-[2px] animate-pulse rounded-full" />
                                </div>
                            )}

                            <div className={`
                                relative w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] sm:rounded-[18px] flex items-center justify-center mb-2 sm:mb-3 border shadow-xs transition-all duration-700
                                ${iconBgClass}
                                ${isUnlocked ? 'group-hover:shadow-[0_8px_20px_-4px_rgba(99,102,241,0.2)]' : ''}
                            `}>
                                <div
                                    className={`relative z-10 transition-all duration-500 ${isUnlocked ? `${iconColorClass} scale-105 sm:scale-110 drop-shadow-md` : 'scale-90 text-slate-400 dark:text-slate-600'} ${isUnlocked ? 'animate-float-subtle' : ''}`}
                                >
                                    {isUnlocked ? (
                                        <item.icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
                                    ) : (
                                        <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                                    )}
                                </div>

                                {isUnlocked && (
                                    <div className="absolute inset-0 rounded-[14px] sm:rounded-[18px] bg-linear-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                )}
                            </div>

                            <div className="text-center space-y-0.5 sm:space-y-1 relative z-10 w-full">
                                <span className={`text-label sm:text-label font-bold uppercase tracking-[0.25em] block transition-colors duration-300 ${isUnlocked ? 'text-indigo-500/80 group-hover:text-indigo-600' : 'text-slate-400 dark:text-slate-700'}`}>
                                    {t('lvl')} {item.level}
                                </span>
                                <h5 className={`text-label sm:text-caption font-bold leading-tight line-clamp-3 w-full px-0.5 transition-colors duration-300 ${isUnlocked ? 'text-slate-900 dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-indigo-500 group-hover:to-purple-500' : 'text-slate-400 dark:text-slate-700'}`}>
                                    {isLocked ? (
                                        <span className="opacity-40 italic tracking-widest text-label sm:text-label">{t('common:locked')}</span>
                                    ) : (
                                        t(item.reward, { level: item.level })
                                    )}
                                </h5>
                            </div>

                            {/* Hover Shine Effect */}
                            {isUnlocked && (
                                <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );

    const canRevealNext = visibleChapters < CHAPTER_TIERS.length && (groupedChapters[visibleChapters - 1]?.isUnlocked);
    const canShowLess = visibleChapters > 1;

    return (
        <motion.section
            className="mb-4 space-y-8 px-2 pb-20 min-h-[300px] relative z-10"
        >
            {groupedChapters.slice(0, visibleChapters).map((chapter, idx) => (
                <div key={chapter.title} className="relative space-y-6">
                    {/* Chapter Header - Re-engineered for Premium feel */}
                    <div className="flex items-center gap-4 mb-4 px-1 group/header">
                        <div className={`
                            relative p-3 rounded-2xl border transition-all duration-500
                            ${chapter.isPartiallyComplete || chapter.isUnlocked
                                ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_10px_20px_-5px_rgba(79,70,229,0.4)] rotate-0 group-hover/header:rotate-6'
                                : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'}
                        `}>
                            {chapter.icon}
                            {(chapter.isPartiallyComplete || chapter.isUnlocked) && (
                                <div className="absolute -inset-1 bg-indigo-500/20 blur-md rounded-full -z-10 animate-pulse-subtle" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <h4 className={`text-caption font-bold uppercase tracking-tight ${chapter.isPartiallyComplete || chapter.isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-600'}`}>
                                {t('milestones.part_label', { part: idx + 1 })}: {t(chapter.title)}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-label font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">
                                    {t('milestones.progression_phase')}
                                </span>
                                {(chapter.isPartiallyComplete || chapter.isUnlocked) && (
                                    <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                                )}
                            </div>
                        </div>

                        {!chapter.isUnlocked && (
                            <div className="ml-auto p-2 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 shadow-xs">
                                <Lock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
                            </div>
                        )}
                    </div>

                    {chapter.achs.length > 0 && renderGrid(chapter.achs, t('achievements_path.exclusive_achievements'), 'bg-amber-400')}
                    {chapter.mils.length > 0 && renderGrid(chapter.mils, t('achievements_path.global_milestones'), 'bg-brand-blue')}

                    {/* Progress Connecting Line between Chapters */}
                    {idx < visibleChapters - 1 && (
                        <div className="absolute left-6 -bottom-6 w-px h-5 bg-linear-to-b from-slate-200 dark:from-white/10 to-transparent" />
                    )}

                    {/* Level 100 Viral Block - Inserted after Level 10 (Part 2: Momentum) */}
                    {idx === 1 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative mt-10 mb-12 overflow-hidden rounded-[2.5rem] bg-linear-to-br from-blue-600 via-indigo-600 to-purple-700 p-px shadow-2xl shadow-blue-500/20 group mx-1"
                        >
                            <div className="relative flex flex-col items-center p-7 sm:p-8 text-center bg-white/5 backdrop-blur-3xl rounded-[2.45rem] overflow-hidden">
                                <div className="circuit-decor opacity-20" />
                                <div className="scanning-glow absolute inset-0 opacity-10 pointer-events-none" />
                                {/* Vibing Background Elements */}
                                <div className="absolute top-0 left-0 w-32 h-32 bg-blue-400/20 blur-2xl rounded-full pointer-events-none group-hover:bg-blue-400/30 transition-colors animate-pulse-subtle" />
                                <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-400/20 blur-2xl rounded-full pointer-events-none group-hover:bg-purple-400/30 transition-colors animate-pulse-subtle" style={{ animationDelay: '1s' }} />

                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-5">
                                        <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                                        <span className="text-label font-bold text-white uppercase tracking-[0.25em]">{t('level100.ultimate_horizon')}</span>
                                    </div>

                                    <h3 className="text-2xl sm:text-3xl font-bold text-white leading-[0.9] tracking-tight uppercase">
                                        {t('level100.achievements_title')}
                                    </h3>

                                    <p className="text-label font-bold text-blue-100/70 leading-relaxed mt-4 max-w-[240px]">
                                        <Trans i18nKey="level100.achievements_desc">
                                            Unlock your <span className="text-white font-bold underline decoration-blue-400/50 underline-offset-2">Fanocracy Passport</span>. Claim the Physical Platinum Card & 0% Fees for life.
                                        </Trans>
                                    </p>

                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            selection();
                                            setIsLevel100ModalOpen(true);
                                        }}
                                        className="mt-8 flex items-center gap-3 px-10 py-5 rounded-xl bg-white text-blue-600 font-bold text-xs shadow-[0_20px_40px_rgba(0,0,0,0.2)] transition-all hover:bg-blue-50 active:shadow-none"
                                    >
                                        {t('level100.discover_btn')}
                                        <ArrowRight className="w-4 h-4 animate-bounce-x" />
                                    </motion.button>

                                    <div className="mt-6 flex items-center gap-2.5">
                                        <div className="flex -space-x-1.5">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-6 h-6 rounded-full border-2 border-indigo-600 bg-indigo-500/80 backdrop-blur-sm flex items-center justify-center">
                                                    <Star className="w-2.5 h-2.5 text-white" />
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-label font-bold text-blue-200/50 uppercase tracking-widest">
                                            {t('achievements_path.elite_recognition')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            ))}

            {(canRevealNext || canShowLess) && (
                <div className="flex flex-col items-center gap-6 pt-2">
                    {canRevealNext && (
                        <button
                            onClick={handleShowMore}
                            className="group flex flex-col items-center gap-1.5 active:scale-95 transition-all"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-brand-blue/20 blur-lg animate-pulse rounded-full" />
                                <div className="relative p-3 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 group-hover:bg-slate-50 dark:group-hover:bg-white/10 transition-all backdrop-blur-xl shadow-lg">
                                    <ChevronDown className="w-4 h-4 text-brand-blue" />
                                </div>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <span className="text-label font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em]">
                                    {t('achievements_path.reveal_part', { index: visibleChapters + 1 })}
                                </span>
                                <span className="text-label font-bold text-slate-500 uppercase tracking-widest">
                                    {t('achievements_path.unlock_horizons')}
                                </span>
                            </div>
                        </button>
                    )}

                    {canShowLess && (
                        <button
                            onClick={() => {
                                selection();
                                setVisibleChapters(1);
                            }}
                            className="group flex flex-col items-center gap-1.5 active:scale-95 transition-all"
                        >
                            <div className="relative">
                                <div className={`relative p-3 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 group-hover:bg-slate-50 dark:group-hover:bg-white/10 transition-all backdrop-blur-xl shadow-lg ${!canRevealNext ? '' : 'w-8 h-8 p-0 flex items-center justify-center'}`}>
                                    <ChevronUp className={`text-slate-400 ${!canRevealNext ? 'w-4 h-4' : 'w-3 h-3'}`} />
                                </div>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <span className="text-label font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
                                    {t('achievements_path.show_less')}
                                </span>
                            </div>
                        </button>
                    )}
                </div>
            )}

            {/* Achievement Detail Modal - Mobile-First Popup (Rendered via Portal) */}
            {typeof document !== 'undefined' && ReactDOM.createPortal(
                <AnimatePresence mode="wait">
                    {selectedItem && (
                        <div className="fixed inset-0 z-999 flex items-end sm:items-center justify-center overflow-hidden p-0 sm:p-4">
                            {/* Premium Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                onClick={() => setSelectedItem(null)}
                                className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl"
                            />

                            {/* Modal Content - Extreme Detail */}
                            <motion.div
                                initial={{ y: '100%', scale: 0.95 }}
                                animate={{ y: 0, scale: 1 }}
                                exit={{ y: '100%', scale: 0.95 }}
                                transition={{
                                    type: 'spring',
                                    damping: 25,
                                    stiffness: 250,
                                    mass: 0.8
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-full max-w-lg sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[3rem] sm:rounded-[2.5rem] shadow-[0_-20px_80px_rgba(0,0,0,0.5)] border-t border-slate-100 dark:border-white/10 sm:border overflow-hidden max-h-[90vh] flex flex-col group/modal overscroll-none"
                                style={{ overscrollBehavior: 'none' }}
                            >
                                {/* Animated Decorative Background */}
                                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                                    <div className={`absolute -top-24 -right-24 w-64 h-64 blur-3xl rounded-full ${selectedItem.color?.includes('orange') ? 'bg-orange-500/20' : selectedItem.color?.includes('red') ? 'bg-red-500/20' : 'bg-indigo-500/20'}`} />
                                    <div className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-transparent via-indigo-500/2 to-transparent" />
                                </div>

                                {/* Pull Handle */}
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full sm:hidden z-20" />

                                <div className="flex-1 overflow-y-auto overscroll-none no-scrollbar p-6 pb-12 sm:p-8 pt-10 sm:pt-12" style={{ overscrollBehavior: 'none' }}>
                                    <div className="relative z-10 flex flex-col items-center">
                                        {/* Dynamic Icon Hero with Vibing Effects */}
                                        <div className="relative mb-10">
                                            {/* Outer Glow Ring */}
                                            <div className={`absolute -inset-8 rounded-full blur-3xl ${selectedItem.color?.includes('orange') ? 'bg-orange-500' : selectedItem.color?.includes('red') ? 'bg-red-500' : 'bg-indigo-500'} animate-pulse-subtle`} />


                                            <div
                                                className={`relative p-9 rounded-[2.8rem] ${selectedItem.color || 'text-indigo-500'} bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-2xl backdrop-blur-md animate-float-subtle`}
                                            >
                                                <selectedItem.icon className="w-14 h-14 drop-shadow-lg" strokeWidth={2} />

                                                {/* Orbital Lights */}
                                                <div className="absolute -inset-2 pointer-events-none animate-rotate-slow">
                                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-center space-y-3 mb-10">
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="inline-flex items-center px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-label font-bold text-indigo-500 uppercase tracking-[0.2em]"
                                            >
                                                <Zap className="w-3 h-3 mr-2 animate-pulse" />
                                                {t('achievements_path.mission', { level: selectedItem.level })}
                                            </motion.div>
                                            <h3 className="text-3xl sm:text-4xl font-bold tracking-tighter uppercase leading-[0.95] text-transparent bg-clip-text bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
                                                {currentLevel >= selectedItem.level ? t(selectedItem.reward, { level: selectedItem.level }) : '???'}
                                            </h3>
                                        </div>

                                        {/* Tactical Instructions - Premium Glassmorph Card */}
                                        <div className="w-full relative group/inst mb-10">
                                            <div className="absolute -inset-2 bg-linear-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-[2.5rem] blur-xl opacity-0 group-hover/inst:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                            <div className="relative p-7 rounded-[2.2rem] bg-white/40 dark:bg-white/3 border border-white/20 dark:border-white/10 backdrop-blur-2xl shadow-xl overflow-hidden">
                                                {/* Card Mesh Background */}
                                                <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

                                                <div className="flex items-center gap-2.5 mb-5 relative z-10">
                                                    <div className="p-1.5 rounded-lg bg-indigo-500/10">
                                                        <Info className="w-4 h-4 text-indigo-500" />
                                                    </div>
                                                    <span className="text-label font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{t('achievements_path.how_to_unlock')}</span>
                                                </div>
                                                <p className="text-button font-bold text-slate-800 dark:text-slate-200 leading-relaxed italic relative z-10">
                                                    "{selectedItem.instruction ? t(selectedItem.instruction) : t('achievements_path.unlock_locked', { level: selectedItem.level })}"
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions Section */}
                                        {currentLevel < selectedItem.level ? (
                                            <div className="w-full space-y-6">
                                                <div className="flex items-center gap-3 px-1">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(79,70,229,0.8)] animate-pulse" />
                                                    <span className="text-label font-bold text-indigo-500 uppercase tracking-[0.2em]">{t('achievements_path.pro_tip')}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <button
                                                        onClick={() => {
                                                            const link = `https://t.me/pintopay_probot?start=${user?.referral_code || ''}`;
                                                            shareUniversal({
                                                                title: 'P2PHub',
                                                                url: link
                                                            });
                                                        }}
                                                        className="h-18 rounded-[1.8rem] bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex flex-col items-center justify-center gap-1 shadow-lg shadow-indigo-600/30 transition-all group/btn overflow-hidden relative"
                                                    >
                                                        {/* Shimmer Effect */}
                                                        <div className="absolute inset-x-0 top-0 h-1/2 bg-white/10 -skew-y-12 -translate-y-full group-hover/btn:translate-y-[200%] transition-transform duration-700" />
                                                        <Share2 size={24} className="group-hover:scale-110 transition-transform" />
                                                        <span className="text-label font-bold uppercase tracking-[0.2em]">{t('achievements_path.share_link')}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.Telegram?.WebApp) {
                                                                window.Telegram.WebApp.switchInlineQuery(user?.referral_code || '');
                                                            }
                                                        }}
                                                        className="h-18 rounded-[1.8rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 active:scale-95 text-slate-900 dark:text-white flex flex-col items-center justify-center gap-1 shadow-sm transition-all group/btn"
                                                    >
                                                        <UserPlus size={24} className="group-hover:scale-110 transition-transform" />
                                                        <span className="text-label font-bold uppercase tracking-[0.2em]">{t('achievements_path.invite')}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <motion.div
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                className="w-full flex justify-center pt-4"
                                            >
                                                <div className="px-10 py-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold text-caption uppercase tracking-[0.3em] flex items-center gap-3 shadow-[0_0_40px_rgba(16,185,129,0.15)] relative overflow-hidden group/success">
                                                    {/* Success Shimmer */}
                                                    <motion.div
                                                        animate={{ x: ['-100%', '200%'] }}
                                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                                        className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
                                                    />
                                                    <Sparkles className="w-5 h-5 animate-bounce" />
                                                    {t('achievements_path.unlocked_badge')}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                {/* Close Button */}
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="absolute top-5 right-5 p-2.5 rounded-full bg-slate-900/5 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 text-slate-500 dark:text-white/60 hover:text-slate-950 dark:hover:text-white transition-all hover:rotate-90 active:scale-90"
                                >
                                    <X size={20} />
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Level 100 Premium Modal - Portaled for top-level focus */}
            {typeof document !== 'undefined' && ReactDOM.createPortal(
                <AnimatePresence>
                    {isLevel100ModalOpen && (
                        <Suspense fallback={null}>
                            <Level100AchievementModal
                                isOpen={isLevel100ModalOpen}
                                onClose={() => setIsLevel100ModalOpen(false)}
                            />
                        </Suspense>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </motion.section>
    );
};
