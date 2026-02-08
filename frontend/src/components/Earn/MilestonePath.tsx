import { motion } from 'framer-motion';
import { MILESTONES } from '../../data/earnData';
import { Lock, Unlock } from 'lucide-react';
import { useUser } from '../../context/UserContext';

export const MilestonePath = () => {
    const { user } = useUser();
    const currentLevel = user?.level || 1;

    return (
        <section className="mb-8">
            <h3 className="text-lg font-black text-[var(--color-text-primary)] mb-4 px-4 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                Road to Glory
            </h3>

            <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar snap-x snap-mandatory">
                {MILESTONES.map((milestone, i) => {
                    const isUnlocked = currentLevel >= milestone.level;
                    const isNext = currentLevel < milestone.level && (i === 0 || currentLevel >= MILESTONES[i - 1].level);

                    return (
                        <motion.div
                            key={milestone.level}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className={`
                                relative min-w-[140px] p-4 rounded-[2rem] border flex flex-col items-center justify-center gap-3 snap-start text-center
                                ${isUnlocked
                                    ? 'glass-panel bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                                    : 'glass-panel opacity-60 grayscale'}
                                ${isNext && 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)] animate-pulse ring-1 ring-yellow-500/30'}
                            `}
                        >
                            <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center text-xl font-black
                                ${isUnlocked ? 'bg-white text-black shadow-lg border border-slate-100' : 'bg-brand-muted/10 text-brand-muted'}
                            `}>
                                {isUnlocked ? <milestone.icon className={`w-6 h-6 ${milestone.color}`} /> : <Lock className="w-5 h-5" />}
                            </div>

                            <div className="space-y-0.5">
                                <span className="text-[9px] font-black uppercase text-brand-muted tracking-wider">Level {milestone.level}</span>
                                <h4 className={`text-xs font-bold leading-tight ${isUnlocked ? 'text-[var(--color-text-primary)]' : 'text-brand-muted'}`}>
                                    {milestone.reward}
                                </h4>
                            </div>

                            {/* Connector Line Logic (visual only for now) */}
                            {i < MILESTONES.length - 1 && (
                                <div className="absolute top-1/2 -right-6 w-8 h-[2px] bg-white/5 -z-10" />
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
};
