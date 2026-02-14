import { motion } from 'framer-motion';
import { Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Task } from '../../data/earnData';
import { useTranslation } from 'react-i18next';
import { Haptic } from '../../utils/tma';

interface TaskCardProps {
    task: Task;
    // #comment: Added progress prop to support relative tracking for started missions
    progress?: number;
    // #comment: Added STARTED status to handle the new mission flow
    status: 'LOCKED' | 'AVAILABLE' | 'VERIFYING' | 'CLAIMABLE' | 'COMPLETED' | 'STARTED';
    userReferrals: number;
    checkinStreak?: number;
    countdown?: number;
    isPro?: boolean; // #comment: Added isPro to show multiplied rewards
    onClick?: () => void;
    onClaim?: () => void;
}

export const TaskCard = ({ task, status, progress, userReferrals, checkinStreak = 0, countdown, isPro, onClick, onClaim }: TaskCardProps) => {
    const { t } = useTranslation();

    // Status Logic
    const isLocked = status === 'LOCKED';
    const isCompleted = status === 'COMPLETED';
    const isClaimable = status === 'CLAIMABLE';
    const isAvailable = status === 'AVAILABLE';
    // #comment: Added isStarted check for UI rendering
    const isStarted = status === 'STARTED';

    const reward = isPro ? task.reward * 5 : task.reward;

    // Visual Variations
    const variants = {
        LOCKED: 'opacity-40 grayscale-[0.8] cursor-not-allowed border-(--color-border-glass) bg-slate-900/40',
        AVAILABLE: 'glass-panel hover:border-blue-500/50 hover:bg-blue-500/5 cursor-pointer text-text-primary group/card',
        VERIFYING: 'glass-panel border-blue-500/30 bg-blue-500/10 cursor-wait',
        CLAIMABLE: 'glass-panel border-emerald-500/60 bg-emerald-500/15 shadow-[0_0_25px_rgba(16,185,129,0.25)] animate-pulse cursor-pointer group/card',
        COMPLETED: 'glass-panel border-emerald-500/20 bg-emerald-500/5 cursor-default opacity-80',
        // #comment: Added specific style for STARTED state (active but not yet claimable)
        STARTED: 'glass-panel border-blue-500/40 bg-blue-500/10 cursor-default group/card'
    };

    const handleCardClick = () => {
        if (isAvailable || isStarted) {
            Haptic.selection();
            onClick?.();
        } else if (isClaimable) {
            Haptic.notification('success');
            onClaim?.();
        }
    };

    // #comment: Calculate current progress to show. If progress prop is provided (from activeTask), use it.
    // Otherwise fallback to absolute values for backward compatibility or valid absolute checks.
    const currentProgress = progress !== undefined ? progress : (
        task.type === 'referral' ? userReferrals : (
            task.type === 'action' ? checkinStreak : 0
        )
    );

    return (
        <motion.div
            layout
            className={`relative rounded-3xl p-5 border transition-all duration-500 overflow-hidden ${variants[status]}`}
            onClick={handleCardClick}
            whileHover={isAvailable || isClaimable || isStarted ? { y: -2, scale: 1.01 } : {}}
            whileTap={isAvailable || isClaimable || isStarted ? { scale: 0.98 } : {}}
        >
            {/* Glossy Reflection Overlay */}
            <div className="absolute inset-0 bg-linear-to-tr from-white/5 via-transparent to-transparent pointer-events-none" />

            {/* Locked Overlay */}
            {isLocked && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/20 backdrop-blur-[2px] rounded-3xl">
                    <div className="bg-slate-900/80 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10 flex items-center gap-2.5 shadow-2xl scale-110">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                            <Lock className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">{t('tasks.level_short')} {task.minLevel}</span>
                    </div>
                </div>
            )}

            <div className="flex items-start justify-between gap-4 relative z-10">
                {/* Icon Container */}
                <div className={`shrink-0 p-3.5 rounded-2xl border transition-all duration-500 ${isClaimable
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : isCompleted
                        ? 'bg-emerald-500/10 text-emerald-500/60 border-emerald-500/20'
                        : 'bg-blue-500/10 border-blue-500/20 text-blue-400 group-hover/card:bg-blue-500/20 group-hover/card:border-blue-500/40 group-hover/card:text-blue-300'
                    }`}>
                    {status === 'VERIFYING' ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                    ) : (
                        <task.icon className="w-5 h-5" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                        <h4 className="text-sm font-black text-text-primary tracking-tight truncate pr-2">{task.title}</h4>
                        {/* XP Badge */}
                        {!isCompleted && (
                            <div className={`shrink-0 flex flex-col items-end gap-0.5`}>
                                <div className={`text-[11px] font-black px-3 py-1 rounded-lg border transition-all ${isClaimable
                                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg'
                                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20 group-hover/card:bg-blue-500/20 group-hover/card:border-blue-500/30'
                                    }`}>
                                    +{reward} XP
                                </div>
                                {isPro && (
                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter animate-pulse">
                                        {t('tasks.pro_multiplier')}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <p className="text-[11px] font-medium text-text-secondary line-clamp-2 leading-relaxed opacity-80 group-hover/card:opacity-100 transition-opacity">
                        {task.description}
                    </p>

                    {/* Progress UI */}
                    {(task.type === 'referral' || task.type === 'action') && (
                        <div className="pt-3 space-y-2">
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-text-secondary/60">
                                <span className="flex items-center gap-1.5">
                                    <div className={`w-1 h-1 rounded-full ${task.type === 'referral' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                                    {t('tasks.progress')}
                                </span>
                                <span className="font-mono text-text-primary">
                                    {Math.min(currentProgress, task.requirement || 0)} <span className="opacity-30">/</span> {task.requirement}
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden p-px border border-white/5">
                                <motion.div
                                    className="h-full rounded-full relative"
                                    style={{
                                        backgroundColor: task.type === 'referral' ? '#3b82f6' : '#10b981',
                                        boxShadow: task.type === 'referral'
                                            ? '0 0 12px rgba(59, 130, 246, 0.4)'
                                            : '0 0 12px rgba(16, 185, 129, 0.4)'
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${Math.min((currentProgress / (task.requirement || 1)) * 100, 100)}%`
                                    }}
                                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                                >
                                    {/* High-end Reflection Layer */}
                                    <div className="absolute inset-0 bg-linear-to-b from-white/30 to-transparent" />
                                    <motion.div
                                        animate={{ x: ['-200%', '300%'] }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                                        className="absolute inset-0 w-1/2 bg-linear-to-r from-transparent via-white/40 to-transparent skew-x-12"
                                    />
                                </motion.div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Footer */}
            {!isCompleted && !isLocked && (
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex -space-x-1">
                        {/* Status Micro-indicator */}
                        <div className={`w-1.5 h-1.5 rounded-full ${isClaimable ? 'bg-emerald-500 animate-pulse' : 'bg-blue-400 opacity-30 group-hover/card:opacity-60'
                            }`} />
                    </div>

                    {isClaimable ? (
                        <button
                            className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:text-emerald-300 transition-all hover:gap-3"
                            onClick={(e) => {
                                e.stopPropagation();
                                Haptic.notification('success');
                                onClaim?.();
                            }}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t('tasks.claim')}
                        </button>
                    ) : status === 'VERIFYING' ? (
                        <div className="flex items-center gap-2.5 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                            <span className="animate-pulse">{t('tasks.verifying')}</span>
                            <span className="font-mono bg-blue-500/20 px-2 py-0.5 rounded-lg text-[9px] border border-blue-500/30">
                                {countdown}s
                            </span>
                        </div>
                    ) : status === 'STARTED' ? (
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-400 uppercase tracking-widest group-hover/card:gap-2.5 transition-all">
                            <span className="animate-pulse">{t('tasks.in_progress')}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-400 uppercase tracking-widest group-hover/card:gap-2.5 transition-all">
                            {t('tasks.start')}
                            <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                    )}
                </div>
            )}

            {isCompleted && (
                <div className="mt-4 pt-3 flex items-center justify-center opacity-50">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">
                        <CheckCircle2 className="w-3 h-3" />
                        Done
                    </div>
                </div>
            )}
        </motion.div>
    );
};
