import { motion } from 'framer-motion';
import { MILESTONES } from '../../data/earnData';
import { Lock } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';

export const MilestonePath = () => {
    const { t } = useTranslation();
    const { user } = useUser();
    const currentLevel = (user?.level || 0) + 1; // Correct level logic if needed, or stick to user.level if that's 1-based

    return (
        <section className="mb-8">
            <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 mb-4 px-4 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                {t('milestones.title')}
            </h3>

            <div className="flex gap-3 overflow-x-auto px-4 pb-8 no-scrollbar snap-x snap-mandatory">
                {MILESTONES.map((milestone, i) => {
                    const isUnlocked = currentLevel >= milestone.level;
                    const isNext = currentLevel < milestone.level && (i === 0 || currentLevel >= MILESTONES[i - 1].level);

                    return (
                        <motion.div
                            key={milestone.level}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={`
                                relative min-w-[100px] p-3 rounded-[1.5rem] border flex flex-col items-center justify-center gap-2 snap-start text-center transition-all duration-300
                                ${isUnlocked
                                    ? 'bg-white/10 border-white/20 shadow-lg backdrop-blur-xl'
                                    : 'bg-white/5 border-white/5 opacity-50 grayscale hover:grayscale-0 hover:opacity-80'}
                                ${isNext ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/30 scale-105 z-10' : ''}
                            `}
                        >
                            {/* Liquid Glass Icon Container */}
                            <div className={`
                                relative w-12 h-12 rounded-2xl flex items-center justify-center text-xl overflow-hidden mb-1
                                ${isUnlocked ? 'shadow-[inset_0_2px_8px_rgba(255,255,255,0.4),0_8px_16px_rgba(0,0,0,0.1)]' : 'shadow-inner bg-slate-100/5'}
                            `}>
                                {/* Glass Reflections */}
                                <div className="absolute inset-0 bg-linear-to-br from-white/40 to-transparent pointer-events-none" />
                                <div className="absolute top-0 left-0 right-0 h-1/2 bg-linear-to-b from-white/30 to-transparent pointer-events-none" />

                                {/* Icon */}
                                <div className={`relative z-10 ${isUnlocked ? milestone.color : 'text-slate-500'}`}>
                                    {isUnlocked ? (
                                        <milestone.icon className="w-6 h-6 drop-shadow-md" strokeWidth={2.5} />
                                    ) : (
                                        <Lock className="w-5 h-5 opacity-60" />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-0.5 w-full">
                                <div className="text-[8px] font-black uppercase text-slate-500 tracking-wider">
                                    LVL {milestone.level}
                                </div>
                                <h4 className={`text-[10px] font-bold leading-tight line-clamp-2 px-1 ${isUnlocked ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500'}`}>
                                    {t(`milestones.${milestone.level}`)} {/* Ensure translation keys exist or fallback to milestone.reward */}
                                </h4>
                            </div>

                            {/* Connector Line Logic (Visual) */}
                            {i < MILESTONES.length - 1 && (
                                <div className={`absolute top-1/2 -right-4 w-4 h-[2px] -z-10 ${isUnlocked ? 'bg-blue-500/30' : 'bg-slate-700/10'}`} />
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
};
