import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllAchievements, getAllMilestones } from '../../data/earnData';
import { Lock, ChevronDown, Trophy, Sparkles, Zap, Star, Shield, Target } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';

const CHAPTER_TIERS = [
    { title: 'The Genesis', range: [1, 5], icon: <Zap className="w-3 h-3" /> },
    { title: 'Momentum', range: [6, 10], icon: <Star className="w-3 h-3" /> },
    { title: 'Growth Hub', range: [11, 15], icon: <Shield className="w-3 h-3" /> },
    { title: 'Elite Network', range: [16, 20], icon: <Trophy className="w-3 h-3" /> },
    { title: 'Market Leader', range: [21, 25], icon: <Zap className="w-3 h-3" /> },
    { title: 'Directorship', range: [26, 30], icon: <Star className="w-3 h-3" /> },
    { title: 'Executive Tier', range: [31, 33], icon: <Shield className="w-3 h-3" /> },
    { title: 'Presidential', range: [34, 35], icon: <Trophy className="w-3 h-3" /> },
    { title: 'Global Legend', range: [36, 40], icon: <Zap className="w-3 h-3" /> },
    { title: 'World Sovereign', range: [41, 45], icon: <Star className="w-3 h-3" /> },
    { title: 'Immortal Era', range: [46, 50], icon: <Shield className="w-3 h-3" /> },
    { title: 'The Empire', range: [51, 60], icon: <Trophy className="w-3 h-3" /> },
    { title: 'Grandmaster', range: [61, 70], icon: <Zap className="w-3 h-3" /> },
    { title: 'God Tier', range: [71, 80], icon: <Star className="w-3 h-3" /> },
    { title: 'Universal', range: [81, 90], icon: <Shield className="w-3 h-3" /> },
    { title: 'The singularity', range: [91, 100], icon: <Trophy className="w-3 h-3" /> },
];

export const MilestonePath = () => {
    const { t } = useTranslation();
    const { user } = useUser();
    const currentLevel = user?.level || 1;

    const [visibleChapters, setVisibleChapters] = useState(2);

    const achievements = useMemo(() => getAllAchievements(), []);
    const milestones = useMemo(() => getAllMilestones(), []);

    const groupedChapters = useMemo(() => {
        return CHAPTER_TIERS.map(tier => {
            const achs = achievements.filter(a => a.level >= tier.range[0] && a.level <= tier.range[1]);
            const mils = milestones.filter(m => m.level >= tier.range[0] && m.level <= tier.range[1]);
            const isUnlocked = currentLevel >= tier.range[0];
            return { ...tier, achs, mils, isUnlocked };
        });
    }, [achievements, milestones, currentLevel]);

    const handleShowMore = () => {
        setVisibleChapters(prev => Math.min(prev + 2, CHAPTER_TIERS.length));
    };

    const renderGrid = (items: any[], typeLabel: string, color: string) => (
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-1 opacity-70">
                <div className={`w-1 h-3 rounded-full ${color}`} />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 whitespace-nowrap">{typeLabel}</span>
                <div className="h-px w-full bg-white/5" />
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
                            className={`
                                relative flex flex-col items-center p-3 rounded-[1.5rem] border transition-all duration-300
                                ${isUnlocked
                                    ? 'bg-white/5 border-white/10 shadow-premium backdrop-blur-xl'
                                    : 'bg-slate-900/10 border-white/5 opacity-40'}
                            `}
                        >
                            <div className={`
                                relative w-10 h-10 rounded-2xl flex items-center justify-center mb-2.5
                                ${isUnlocked ? 'bg-white/5 border border-white/10' : 'bg-black/20'}
                            `}>
                                <div className={`relative z-10 ${isUnlocked ? item.color : 'text-slate-700'}`}>
                                    {isUnlocked ? (
                                        <item.icon className="w-4 h-4" />
                                    ) : (
                                        <Lock className="w-3.5 h-3.5 opacity-30" />
                                    )}
                                </div>
                            </div>
                            <div className="text-center space-y-0.5">
                                <div className={`text-[7px] font-black uppercase tracking-tighter ${isUnlocked ? 'text-blue-400' : 'text-slate-600'}`}>
                                    {isLocked ? `Lvl ${item.level}` : `LVL ${item.level}`}
                                </div>
                                <h5 className={`text-[9px] font-black leading-tight line-clamp-1 h-3 ${isUnlocked ? 'text-white' : 'text-slate-700'}`}>
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
                        <div className={`p-2.5 rounded-[1.25rem] border ${chapter.isUnlocked ? 'bg-brand-blue/10 border-brand-blue/20 text-brand-blue shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-white/5 border-white/10 text-slate-700'}`}>
                            {chapter.icon}
                        </div>
                        <div className="flex flex-col">
                            <h4 className={`text-[12px] font-black uppercase tracking-widest ${chapter.isUnlocked ? 'text-white' : 'text-slate-600'}`}>
                                PART {idx + 1}: {chapter.title}
                            </h4>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5">
                                Progression Phase
                            </span>
                        </div>
                        {chapter.isUnlocked ? (
                            <div className="ml-auto w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
                        ) : (
                            <div className="ml-auto p-1.5 rounded-lg bg-black/20">
                                <Lock className="w-3 h-3 text-slate-700" />
                            </div>
                        )}
                    </div>

                    {chapter.achs.length > 0 && renderGrid(chapter.achs, 'Exclusive Achievements', 'bg-amber-400')}
                    {chapter.mils.length > 0 && renderGrid(chapter.mils, 'Global Milestones', 'bg-brand-blue')}

                    {/* Progress Connecting Line between Chapters */}
                    {idx < visibleChapters - 1 && (
                        <div className="absolute left-6 -bottom-10 w-px h-8 bg-linear-to-b from-white/10 to-transparent" />
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
                            <div className="relative p-5 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all backdrop-blur-xl">
                                <ChevronDown className="w-6 h-6 text-brand-blue" />
                            </div>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-1">
                                Reveal Part {visibleChapters + 1}
                            </span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                                Unlock next Level Horizons
                            </span>
                        </div>
                    </button>
                </div>
            )}
        </section>
    );
};
