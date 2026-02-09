import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllAchievements, getAllMilestones } from '../../data/earnData';
import { Lock, ChevronDown, ChevronUp, Trophy, Target, Sparkles } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';

const TIER_LEVELS = [1, 5, 10, 15, 20, 25, 30, 33, 35, 40, 45, 50, 60, 70, 80, 90, 100];

export const MilestonePath = () => {
    const { t } = useTranslation();
    const { user } = useUser();
    const currentLevel = user?.level || 1;

    const [showAllAch, setShowAllAch] = useState(false);
    const [showAllMil, setShowAllMil] = useState(false);

    const achievements = getAllAchievements();
    const milestones = getAllMilestones();

    const renderGrid = (items: any[], showAll: boolean, setShowAll: (val: boolean) => void, title: string, icon: any) => {
        // Find current tier index
        const currentTierIndex = TIER_LEVELS.findIndex(lvl => lvl > currentLevel) - 1;
        const activeTierLimit = currentTierIndex === -1 ? TIER_LEVELS[TIER_LEVELS.length - 1] : TIER_LEVELS[currentTierIndex + 1];

        // Items logic: show all unlocked + next Tier
        // If showAll is true, show everything.
        const visibleItems = useMemo(() => {
            if (showAll) return items;
            // Filter items that are <= activeTierLimit
            return items.filter(item => item.level <= activeTierLimit).slice(0, 6);
        }, [items, showAll, activeTierLimit]);

        return (
            <div className="mb-10">
                <div className="flex items-center justify-between mb-5 px-5">
                    <div className="flex flex-col">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                            {icon}
                            {title}
                        </h3>
                        <p className="text-[9px] font-bold text-slate-500/60 uppercase tracking-widest mt-0.5">
                            {showAll ? t('referral.rewards.all_unlocked') : t('referral.rewards.next_milestones')}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="h-8 px-3 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 active:scale-95 transition-all group hover:bg-white/10"
                    >
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                            {showAll ? t('common.show_less') : t('common.show_more')}
                        </span>
                        {showAll ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />}
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-3 px-4">
                    <AnimatePresence mode="popLayout">
                        {visibleItems.map((item) => {
                            const isUnlocked = currentLevel >= item.level;
                            const isLocked = currentLevel < item.level;

                            return (
                                <motion.div
                                    key={`${item.id}-${item.level}`}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`
                                        relative group flex flex-col items-center p-3 rounded-[1.5rem] border transition-all duration-500
                                        ${isUnlocked
                                            ? 'bg-white/5 border-white/10 shadow-premium backdrop-blur-xl'
                                            : 'bg-slate-900/20 border-white/5 opacity-60'}
                                    `}
                                >
                                    {/* Glass Highlight */}
                                    <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    {/* Icon Container */}
                                    <div className={`
                                        relative w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 duration-500
                                        ${isUnlocked ? 'bg-linear-to-br from-white/10 to-white/5 shadow-inner border border-white/10' : 'bg-black/20'}
                                    `}>
                                        <div className={`relative z-10 ${isUnlocked ? item.color : 'text-slate-600'}`}>
                                            {isUnlocked ? (
                                                <item.icon className="w-5 h-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
                                            ) : (
                                                <Lock className="w-4 h-4 opacity-30" />
                                            )}
                                        </div>

                                        {/* Particle Effect for unlocked */}
                                        {isUnlocked && (
                                            <div className="absolute inset-0 bg-blue-500/5 blur-xl group-hover:bg-blue-500/20 transition-colors" />
                                        )}
                                    </div>

                                    {/* Label Stack */}
                                    <div className="text-center space-y-1 w-full">
                                        <div className={`text-[8px] font-black uppercase tracking-widest ${isUnlocked ? 'text-blue-400' : 'text-slate-500'}`}>
                                            {isLocked ? `${t('common.unlock')} Lvl ${item.level}` : `LVL ${item.level}`}
                                        </div>
                                        <h4 className={`text-[10px] font-black leading-tight line-clamp-2 px-1 ${isUnlocked ? 'text-white' : 'text-slate-600'}`}>
                                            {isLocked ? '???' : t(item.reward, { level: item.level })}
                                        </h4>
                                    </div>

                                    {/* Status Indicator */}
                                    {isUnlocked && (
                                        <div className="absolute -top-1 -right-1">
                                            <div className="bg-emerald-500 p-1 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                                                <Sparkles className="w-2 h-2 text-white" />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        );
    };

    return (
        <section className="mt-2 mb-8">
            {renderGrid(achievements, showAllAch, setShowAllAch, t('referral.rewards.achievements'), <Trophy className="w-3.5 h-3.5 text-amber-400 drop-shadow-sm" />)}
            {renderGrid(milestones, showAllMil, setShowAllMil, t('referral.rewards.milestones'), <Target className="w-3.5 h-3.5 text-blue-400 drop-shadow-sm" />)}
        </section>
    );
};
