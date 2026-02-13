import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllAchievements, getAllMilestones, Achievement } from '../../data/earnData';
// #comment: Removed unused Target and Gem icons from lucide-react to clean up the import list
import { Lock, ChevronDown, ChevronUp, Trophy, Sparkles, Zap, Star, Shield, X, Info, Share2, UserPlus, Milestone, ArrowRight, Flame } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useTranslation, Trans } from 'react-i18next';
import { useHaptic } from '../../hooks/useHaptic';

const Level100AchievementModal = lazy(() => import('./Level100AchievementModal').then(m => ({ default: m.Level100AchievementModal })));

const CHAPTER_TIERS = [
    { title: 'milestones.tier_1', range: [1, 5], icon: <Zap className="w-3 h-3" /> },
    { title: 'milestones.tier_2', range: [6, 10], icon: <Star className="w-3 h-3" /> },
    { title: 'milestones.tier_3', range: [11, 20], icon: <Shield className="w-3 h-3" /> },
    { title: 'milestones.tier_4', range: [21, 50], icon: <Trophy className="w-3 h-3" /> },
    { title: 'milestones.tier_5', range: [51, 100], icon: <Milestone className="w-3 h-3" /> },
];

export const MilestonePath = () => {
    const { t } = useTranslation();
    const { user } = useUser();
    const { selection } = useHaptic();
    const currentLevel = user?.level || 1;

    const [visibleChapters, setVisibleChapters] = useState(1);
    const [selectedItem, setSelectedItem] = useState<Achievement | null>(null);
    const [isLevel100ModalOpen, setIsLevel100ModalOpen] = useState(false);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (selectedItem) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [selectedItem]);

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
        <div className="space-y-2">
            <div className="flex items-center gap-2 px-1 opacity-70">
                <div className={`w-1 h-3 rounded-full ${color}`} />
                <span className="text-[7.5px] font-black uppercase tracking-[0.2em] text-slate-500 whitespace-nowrap dark:text-slate-400">{typeLabel}</span>
                <div className="h-px w-full bg-slate-200 dark:bg-white/5" />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
                {items.map((item) => {
                    const isUnlocked = currentLevel >= item.level;
                    const isLocked = !isUnlocked;
                    return (
                        <motion.div
                            key={`${item.id || item.level}-${item.level}`}
                            onClick={() => handleItemClick(item)}
                            whileTap={{ scale: 0.95 }}
                            className={`
                                relative flex flex-col items-center p-3 rounded-[18px] border transition-all duration-300 cursor-pointer overflow-hidden
                                ${isUnlocked
                                    ? 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-none'
                                    : 'bg-slate-100/50 dark:bg-white/[0.02] border-slate-200/50 dark:border-white/5'}
                            `}
                        >
                            {/* Unlock Glow Effect */}
                            {isUnlocked && <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent pointer-events-none" />}

                            <div className={`
                                relative w-9 h-9 rounded-[14px] flex items-center justify-center mb-2 shadow-inner
                                ${isUnlocked
                                    ? 'bg-slate-50 dark:bg-white/10 border border-slate-100 dark:border-white/5'
                                    : 'bg-slate-200/50 dark:bg-white/5 border-transparent'}
                            `}>
                                <div className={`relative z-10 transition-transform duration-300 ${isUnlocked ? `${item.color} scale-110` : 'text-slate-300 dark:text-slate-600 scale-90'}`}>
                                    {isUnlocked ? (
                                        <item.icon className="w-4 h-4" />
                                    ) : (
                                        <Lock className="w-3.5 h-3.5" />
                                    )}
                                </div>
                            </div>

                            <div className="text-center space-y-0.5 relative z-10 w-full">
                                <div className={`text-[8px] font-black uppercase tracking-wider ${isUnlocked ? 'text-blue-500' : 'text-slate-400 dark:text-slate-600'}`}>
                                    {isLocked ? `${t('common.lvl')} ${item.level}` : `${t('common.lvl')} ${item.level}`}
                                </div>
                                <h5 className={`text-[9px] font-bold leading-tight line-clamp-1 w-full px-0.5 ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>
                                    {isLocked ? '???' : t(item.reward, { level: item.level })}
                                </h5>
                            </div>

                            {/* Status Indicator Dot */}
                            {isUnlocked && (
                                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
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
            className="mb-8 space-y-8 px-2 pb-20 min-h-[300px] relative z-10"
        >
            {groupedChapters.slice(0, visibleChapters).map((chapter, idx) => (
                <div key={chapter.title} className="relative space-y-5">
                    {/* Chapter Header */}
                    <div className="flex items-center gap-3 mb-4 px-1">
                        <div className={`p-2.5 rounded-[1.25rem] border ${chapter.isPartiallyComplete || chapter.isUnlocked ? 'bg-brand-blue/10 border-brand-blue/20 text-brand-blue shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'}`}>
                            {chapter.icon}
                        </div>
                        <div className="flex flex-col">
                            <h4 className={`text-[12px] font-black uppercase tracking-widest ${chapter.isPartiallyComplete || chapter.isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-600'}`}>
                                {t('milestones.part_label', { part: idx + 1 })}: {t(chapter.title)}
                            </h4>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5">
                                {t('milestones.progression_phase')}
                            </span>
                        </div>
                        {chapter.isUnlocked ? (
                            <div className="ml-auto w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
                        ) : (
                            <div className="ml-auto p-1.5 rounded-lg bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/5">
                                <Lock className="w-3 h-3 text-slate-400" />
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
                            className="relative mt-10 mb-12 overflow-hidden rounded-[2.5rem] bg-linear-to-br from-blue-600 via-indigo-600 to-purple-700 p-[1px] shadow-2xl shadow-blue-500/20 group mx-1"
                        >
                            <div className="relative flex flex-col items-center p-7 sm:p-8 text-center bg-white/5 backdrop-blur-3xl rounded-[2.45rem]">
                                {/* Vibing Background Elements */}
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        opacity: [0.3, 0.5, 0.3]
                                    }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="absolute top-0 left-0 w-32 h-32 bg-blue-400/20 blur-[40px] rounded-full pointer-events-none group-hover:bg-blue-400/30 transition-colors"
                                />
                                <motion.div
                                    animate={{
                                        scale: [1.2, 1, 1.2],
                                        opacity: [0.3, 0.5, 0.3]
                                    }}
                                    transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                                    className="absolute bottom-0 right-0 w-32 h-32 bg-purple-400/20 blur-[40px] rounded-full pointer-events-none group-hover:bg-purple-400/30 transition-colors"
                                />

                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-5">
                                        <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                                        <span className="text-[9px] font-black text-white uppercase tracking-[0.25em]">{t('level100.ultimate_horizon')}</span>
                                    </div>

                                    <h3 className="text-2xl sm:text-3xl font-black text-white leading-[0.9] tracking-tight uppercase">
                                        {t('level100.achievements_title')}
                                    </h3>

                                    <p className="text-[11px] font-bold text-blue-100/70 leading-relaxed mt-4 max-w-[240px]">
                                        <Trans i18nKey="level100.achievements_desc">
                                            Unlock your <span className="text-white font-black underline decoration-blue-400/50 underline-offset-2">Fanocracy Passport</span>. Claim the Physical Platinum Card & 0% Fees for life.
                                        </Trans>
                                    </p>

                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            selection();
                                            setIsLevel100ModalOpen(true);
                                        }}
                                        className="mt-8 flex items-center gap-3 px-10 py-5 rounded-[1.5rem] bg-white text-blue-600 font-black text-xs shadow-[0_20px_40px_rgba(0,0,0,0.2)] transition-all hover:bg-blue-50 active:shadow-none"
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
                                        <span className="text-[9px] font-black text-blue-200/50 uppercase tracking-widest">
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
                                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">
                                    {t('achievements_path.reveal_part', { index: visibleChapters + 1 })}
                                </span>
                                <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">
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
                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
                                    {t('achievements_path.show_less')}
                                </span>
                            </div>
                        </button>
                    )}
                </div>
            )}

            {/* Achievement Detail Modal - Mobile-First Popup (Rendered via Portal) */}
            {typeof document !== 'undefined' && ReactDOM.createPortal(
                <AnimatePresence>
                    {selectedItem && (
                        <div className="fixed inset-0 z-999 flex items-end sm:items-center justify-center overflow-hidden">
                            {/* Enhanced Backdrop with stronger blur */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => setSelectedItem(null)}
                                className="absolute inset-0 bg-black/70 backdrop-blur-xl"
                            />

                            {/* Modal Content - Bottom Sheet on Mobile, Centered on Desktop */}
                            <motion.div
                                initial={{ y: '100%', opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: '100%', opacity: 0 }}
                                transition={{
                                    type: 'spring',
                                    damping: 30,
                                    stiffness: 300
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-full max-w-lg sm:max-w-md bg-white dark:bg-[#0f172a] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.4)] sm:shadow-[0_20px_60px_rgba(0,0,0,0.4)] border-t border-slate-200 dark:border-white/10 sm:border overflow-hidden max-h-[85vh] flex flex-col"
                            >
                                {/* Mobile Pull Indicator */}
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-300 dark:bg-white/20 rounded-full sm:hidden z-20" />

                                {/* Fixed Header Bar */}
                                <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-end px-6 py-5 pointer-events-none">
                                    <button
                                        onClick={() => setSelectedItem(null)}
                                        className="pointer-events-auto p-2 bg-white/20 dark:bg-black/20 backdrop-blur-xl hover:bg-white/30 dark:hover:bg-black/30 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-lg border border-white/20"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Content Area (Scrollable) */}
                                <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar scroll-smooth p-6 pb-10 sm:p-8 pt-8 sm:pt-10">
                                    <div className="space-y-6 pt-4">
                                        {/* Header Title Section */}
                                        <div className="flex items-start gap-4">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                {selectedItem?.icon && (
                                                    <div className={`p-4 rounded-[1.5rem] ${selectedItem.color || 'text-slate-600'} bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 shrink-0 shadow-sm`}>
                                                        <selectedItem.icon className="w-8 h-8" />
                                                    </div>
                                                )}
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{t('achievements_path.mission', { level: selectedItem?.level || 0 })}</span>
                                                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight wrap-break-word">
                                                        {currentLevel >= (selectedItem?.level || 0) ? t(selectedItem?.reward || '', { level: selectedItem?.level }) : '???'}
                                                    </h3>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Instruction Section */}
                                        <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3 text-left relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl -mr-8 -mt-8" />
                                            <div className="flex items-center gap-2 relative z-10">
                                                <Info className="w-4 h-4 text-blue-500 shrink-0" />
                                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('achievements_path.how_to_unlock')}</span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed relative z-10">
                                                {selectedItem?.instruction || t('achievements_path.unlock_locked', { level: selectedItem?.level || 0 })}
                                            </p>
                                        </div>

                                        {/* Action Helper - Only show if locked */}
                                        {selectedItem && currentLevel < selectedItem.level && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 px-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
                                                    <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{t('achievements_path.pro_tip')}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => {
                                                            const link = `https://t.me/pintopay_probot?start=${user?.referral_code || ''}`;
                                                            if (navigator.share) {
                                                                navigator.share({ title: 'P2PHub', url: link });
                                                            } else {
                                                                navigator.clipboard.writeText(link);
                                                            }
                                                        }}
                                                        className="h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-blue-500/20"
                                                    >
                                                        <Share2 className="w-5 h-5 shrink-0" />
                                                        <span className="truncate">{t('achievements_path.share_link')}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.Telegram?.WebApp) {
                                                                window.Telegram.WebApp.switchInlineQuery(user?.referral_code || '');
                                                            }
                                                        }}
                                                        className="h-16 rounded-2xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                                                    >
                                                        <UserPlus className="w-5 h-5 shrink-0" />
                                                        <span className="truncate">{t('achievements_path.invite')}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Status Badge */}
                                        <div className="flex justify-center pt-4">
                                            {selectedItem && currentLevel >= selectedItem.level ? (
                                                <div className="px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-inner">
                                                    <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                    <span className="whitespace-nowrap">{t('achievements_path.unlocked_badge')}</span>
                                                </div>
                                            ) : (
                                                <div className="px-6 py-3 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <Lock className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="whitespace-nowrap">{t('achievements_path.locked_badge')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Bottom Decoration */}
                                <div className="h-6 bg-linear-to-t from-white dark:from-[#0f172a] to-transparent pointer-events-none absolute bottom-0 left-0 right-0 z-10" />
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
