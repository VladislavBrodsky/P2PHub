import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllAchievements, getAllMilestones, Achievement } from '../../data/earnData';
import { Lock, ChevronDown, Trophy, Sparkles, Zap, Star, Shield, Target, X, Info, Share2, UserPlus, Milestone } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';
import { useHaptic } from '../../hooks/useHaptic';

const CHAPTER_TIERS = [
    { title: 'The Genesis', range: [1, 5], icon: <Zap className="w-3 h-3" /> },
    { title: 'Momentum', range: [6, 10], icon: <Star className="w-3 h-3" /> },
    { title: 'Growth Hub', range: [11, 20], icon: <Shield className="w-3 h-3" /> },
    { title: 'Executive Tier', range: [21, 50], icon: <Trophy className="w-3 h-3" /> },
    { title: 'Ultimate Mastery', range: [51, 100], icon: <Milestone className="w-3 h-3" /> },
];

export const MilestonePath = () => {
    const { t } = useTranslation();
    const { user } = useUser();
    const { selection } = useHaptic();
    const currentLevel = user?.level || 1;

    const [visibleChapters, setVisibleChapters] = useState(1);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const achievements = useMemo(() => getAllAchievements(), []);
    const milestones = useMemo(() => getAllMilestones(), []);

    const handleItemClick = (item: any) => {
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
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-1 opacity-70">
                <div className={`w-1 h-3 rounded-full ${color}`} />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 whitespace-nowrap dark:text-slate-400">{typeLabel}</span>
                <div className="h-px w-full bg-slate-200 dark:bg-white/5" />
            </div>
            <div className="grid grid-cols-3 gap-3">
                {items.map((item) => {
                    const isUnlocked = currentLevel >= item.level;
                    const isLocked = !isUnlocked;
                    return (
                        <motion.div
                            key={`${item.id || item.level}-${item.level}`}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => handleItemClick(item)}
                            className={`
                                relative flex flex-col items-center p-3 rounded-[1.5rem] border transition-all duration-300 active:scale-95 cursor-pointer
                                ${isUnlocked
                                    ? 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 shadow-premium backdrop-blur-xl'
                                    : 'bg-slate-100 dark:bg-slate-900/10 border-slate-200 dark:border-white/5 opacity-60'}
                            `}
                        >
                            <div className={`
                                relative w-10 h-10 rounded-2xl flex items-center justify-center mb-2.5
                                ${isUnlocked ? 'bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10' : 'bg-slate-200 dark:bg-black/20'}
                            `}>
                                <div className={`relative z-10 ${isUnlocked ? item.color : 'text-slate-400'}`}>
                                    {isUnlocked ? (
                                        <item.icon className="w-4 h-4" />
                                    ) : (
                                        <Lock className="w-3.5 h-3.5 opacity-40" />
                                    )}
                                </div>
                            </div>
                            <div className="text-center space-y-0.5">
                                <div className={`text-[7px] font-black uppercase tracking-tighter ${isUnlocked ? 'text-blue-500' : 'text-slate-500'}`}>
                                    {isLocked ? `Lvl ${item.level}` : `LVL ${item.level}`}
                                </div>
                                <h5 className={`text-[9px] font-black leading-tight line-clamp-1 h-3 ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                    {isLocked ? '???' : t(item.reward, { level: item.level })}
                                </h5>
                            </div>
                            {isUnlocked && (
                                <div className="absolute -top-1 -right-1">
                                    <div className="bg-emerald-500 p-0.5 rounded-full shadow-lg">
                                        <Sparkles className="w-1.5 h-1.5 text-white" />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <section className="mt-6 mb-12 space-y-12 px-4 pb-20">
            {groupedChapters.slice(0, visibleChapters).map((chapter, idx) => (
                <div key={chapter.title} className="relative space-y-6">
                    {/* Chapter Header */}
                    <div className="flex items-center gap-3 mb-4 px-1">
                        <div className={`p-2.5 rounded-[1.25rem] border ${chapter.isPartiallyComplete ? 'bg-brand-blue/10 border-brand-blue/20 text-brand-blue shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'}`}>
                            {chapter.icon}
                        </div>
                        <div className="flex flex-col">
                            <h4 className={`text-[12px] font-black uppercase tracking-widest ${chapter.isPartiallyComplete ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                PART {idx + 1}: {chapter.title}
                            </h4>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5">
                                Progression Phase
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

                    {chapter.achs.length > 0 && renderGrid(chapter.achs, 'Exclusive Achievements', 'bg-amber-400')}
                    {chapter.mils.length > 0 && renderGrid(chapter.mils, 'Global Milestones', 'bg-brand-blue')}

                    {/* Progress Connecting Line between Chapters */}
                    {idx < visibleChapters - 1 && (
                        <div className="absolute left-6 -bottom-10 w-px h-8 bg-linear-to-b from-slate-200 dark:from-white/10 to-transparent" />
                    )}
                </div>
            ))}

            {visibleChapters < CHAPTER_TIERS.length && (
                <div className="flex justify-center flex-col items-center gap-4 pt-10">
                    <button
                        onClick={handleShowMore}
                        className="group flex flex-col items-center gap-3 active:scale-95 transition-all"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-brand-blue/20 blur-xl animate-pulse rounded-full" />
                            <div className="relative p-5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 group-hover:bg-slate-50 dark:group-hover:bg-white/10 transition-all backdrop-blur-xl">
                                <ChevronDown className="w-6 h-6 text-brand-blue" />
                            </div>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-1">
                                Reveal Part {visibleChapters + 1}
                            </span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                                Unlock next Level Horizons
                            </span>
                        </div>
                    </button>
                </div>
            )}

            {/* Achievement Detail Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedItem(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            className="relative w-full max-w-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 space-y-6">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-2xl ${selectedItem.color} bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10`}>
                                            <selectedItem.icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">LEVEL {selectedItem.level} MISSION</span>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                                {currentLevel >= selectedItem.level ? t(selectedItem.reward, { level: selectedItem.level }) : '???'}
                                            </h3>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedItem(null)}
                                        className="p-2 bg-slate-100 dark:bg-white/5 rounded-full text-slate-400"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Instruction Section */}
                                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/2 border border-slate-100 dark:border-white/5 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Info className="w-4 h-4 text-brand-blue" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">HOW TO UNLOCK</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                                        {selectedItem.instruction || `Achieve Level ${selectedItem.level} to unlock this unique recognition and its associated rewards.`}
                                    </p>
                                </div>

                                {/* Action Helper */}
                                {currentLevel < selectedItem.level && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 px-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PRO TIP: VIRAL GROWTH</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button className="h-14 rounded-2xl bg-brand-blue text-white font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-500/20">
                                                <Share2 className="w-4 h-4" /> SHARE LINK
                                            </button>
                                            <button className="h-14 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all">
                                                <UserPlus className="w-4 h-4" /> INVITE FRIENDS
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Status Badge */}
                                <div className="flex justify-center">
                                    {currentLevel >= selectedItem.level ? (
                                        <div className="px-6 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Sparkles className="w-3 h-3 text-emerald-500" /> ACHIEVEMENT UNLOCKED
                                        </div>
                                    ) : (
                                        <div className="px-6 py-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Lock className="w-3 h-3" /> STILL LOCKED
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
};
