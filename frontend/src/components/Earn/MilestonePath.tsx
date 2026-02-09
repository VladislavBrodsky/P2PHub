import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllAchievements, getAllMilestones } from '../../data/earnData';
import { Lock, ChevronDown, ChevronUp, Trophy, Target } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';

export const MilestonePath = () => {
    const { t } = useTranslation();
    const { user } = useUser();
    const currentLevel = (user?.level || 0) + 1;

    const [showAllAch, setShowAllAch] = useState(false);
    const [showAllMil, setShowAllMil] = useState(false);

    const achievements = getAllAchievements();
    const milestones = getAllMilestones();

    const renderGrid = (items: any[], showAll: boolean, setShowAll: (val: boolean) => void, title: string, icon: any) => {
        const visibleItems = showAll ? items : items.slice(0, 3);

        return (
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4 px-4">
                    <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="p-1 rounded-md bg-white/5 border border-white/10">
                            {icon}
                        </span>
                        {title}
                    </h3>
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="text-[10px] font-black text-blue-500 uppercase tracking-wider flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20 active:scale-95 transition-all"
                    >
                        {showAll ? <><ChevronUp className="w-3 h-3" /> {t('common.show_less')}</> : <><ChevronDown className="w-3 h-3" /> {t('common.show_more')}</>}
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-2 px-4">
                    <AnimatePresence mode="popLayout">
                        {visibleItems.map((item, i) => {
                            const isUnlocked = currentLevel >= item.level;
                            const isNext = !isUnlocked && (i === 0 || currentLevel >= items[i - 1].level);

                            return (
                                <motion.div
                                    key={item.id || item.level}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`
                                        relative p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all duration-300
                                        ${isUnlocked
                                            ? 'bg-white/10 dark:bg-white/5 border-white/20 shadow-lg backdrop-blur-md'
                                            : 'bg-slate-100/5 dark:bg-white/2 border-white/5 opacity-50 grayscale'}
                                        ${isNext ? 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20 z-10' : ''}
                                    `}
                                >
                                    <div className={`
                                        relative w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden
                                        ${isUnlocked ? 'bg-white/5 border border-white/10 shadow-inner' : 'bg-slate-800/20'}
                                    `}>
                                        <div className={`relative z-10 ${isUnlocked ? item.color : 'text-slate-600'}`}>
                                            {isUnlocked ? (
                                                <item.icon className="w-4 h-4" strokeWidth={2.5} />
                                            ) : (
                                                <Lock className="w-3 h-3 opacity-40" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-0.5">
                                        <div className="text-[7px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-tighter opacity-80 leading-none">
                                            LVL {item.level}
                                        </div>
                                        <h4 className={`text-[9px] font-black leading-tight line-clamp-1 tracking-tight ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                            {t(item.reward, { level: item.level })}
                                        </h4>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        );
    };

    return (
        <section className="mt-4 mb-4">
            {renderGrid(achievements, showAllAch, setShowAllAch, t('referral.rewards.achievements'), <Trophy className="w-3 h-3 text-amber-400" />)}
            {renderGrid(milestones, showAllMil, setShowAllMil, t('referral.rewards.milestones'), <Target className="w-3 h-3 text-blue-400" />)}
        </section>
    );
};
