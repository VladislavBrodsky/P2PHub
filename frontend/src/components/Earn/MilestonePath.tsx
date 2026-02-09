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

            <div className="grid grid-cols-3 gap-3 px-4 pb-8">
                {MILESTONES.map((milestone, i) => {
                    const isUnlocked = currentLevel >= milestone.level;
                    const isNext = currentLevel < milestone.level && (i === 0 || currentLevel >= MILESTONES[i - 1].level);

                    return (
                        <motion.div
                            key={milestone.level}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className={`
                                relative p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all duration-300
                                ${isUnlocked
                                    ? 'bg-white/10 dark:bg-white/5 border-white/20 shadow-lg backdrop-blur-xl'
                                    : 'bg-slate-100/5 dark:bg-white/2 border-slate-200/10 dark:border-white/5 opacity-50 grayscale'}
                                ${isNext ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20 scale-[1.02] z-10' : ''}
                            `}
                        >
                            {/* Liquid Glass Icon Container */}
                            <div className={`
                                relative w-11 h-11 rounded-xl flex items-center justify-center text-lg overflow-hidden
                                ${isUnlocked ? 'shadow-[inset_0_2px_8px_rgba(255,255,255,0.4),0_6px_12px_rgba(0,0,0,0.1)]' : 'shadow-inner bg-slate-800/20'}
                            `}>
                                {/* Glass Reflections */}
                                <div className="absolute inset-0 bg-linear-to-br from-white/30 to-transparent pointer-events-none" />

                                {/* Icon */}
                                <div className={`relative z-10 ${isUnlocked ? milestone.color : 'text-slate-600'}`}>
                                    {isUnlocked ? (
                                        <milestone.icon className="w-5 h-5 drop-shadow-sm" strokeWidth={2.5} />
                                    ) : (
                                        <Lock className="w-4 h-4 opacity-40" />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-0.5 w-full">
                                <div className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-tighter opacity-80">
                                    LVL {milestone.level}
                                </div>
                                <h4 className={`text-[10px] font-black leading-[1.1] line-clamp-2 px-0.5 tracking-tight ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                    {t(`milestones.${milestone.level}`)}
                                </h4>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
};
