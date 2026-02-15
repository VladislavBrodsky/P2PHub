import { useState } from 'react';
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
    onClaim?: () => void | Promise<void>;
}

export const TaskCard = ({ task, status, progress, userReferrals, checkinStreak = 0, countdown, isPro, onClick, onClaim }: TaskCardProps) => {
    const { t } = useTranslation();
    const [isClaiming, setIsClaiming] = useState(false);

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
        LOCKED: 'opacity-40 grayscale-[0.8] cursor-not-allowed border-white/10 bg-slate-900/40',
        AVAILABLE: 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-white/10 hover:border-blue-500/50 hover:shadow-premium-xl dark:hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] cursor-pointer text-text-primary group/card backdrop-blur-3xl shadow-sm',
        VERIFYING: 'bg-blue-500/5 border-blue-500/30 dark:bg-blue-500/10 cursor-wait backdrop-blur-2xl',
        CLAIMABLE: 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.15)] animate-premium-pulse cursor-pointer group/card backdrop-blur-3xl',
        COMPLETED: 'bg-white/40 dark:bg-slate-900/40 border-slate-100 dark:border-emerald-500/10 cursor-default opacity-80',
        STARTED: 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/40 cursor-default group/card backdrop-blur-2xl'
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

    const currentProgress = progress !== undefined ? progress : (
        task.type === 'referral' ? userReferrals : (
            task.type === 'action' ? checkinStreak : 0
        )
    );

    return (
        <motion.div
            layout
            className={`relative rounded-[2rem] p-5 border transition-all duration-500 overflow-hidden ${variants[status]}`}
            onClick={handleCardClick}
            whileHover={isAvailable || isClaimable || isStarted ? { y: -4, scale: 1.01 } : {}}
            whileTap={isAvailable || isClaimable || isStarted ? { scale: 0.985 } : {}}
        >
            {/* Subtle Gradient Glow Background */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 blur-[80px] rounded-full transition-opacity duration-1000 ${isClaimable ? 'bg-emerald-500/20' : isStarted ? 'bg-blue-500/20' : 'bg-amber-500/10'
                }`} />

            {/* Locked Overlay */}
            {isLocked && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs rounded-[2rem]">
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center gap-3 shadow-2xl">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Lock className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('common.unlock_at')}</span>
                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('tasks.level_short')} {task.minLevel}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-start gap-4 relative z-10">
                {/* Icon Container - More Subtle Circle */}
                <div className="shrink-0 relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-700 ${isClaimable
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                        : isCompleted
                            ? 'bg-emerald-500/10 text-emerald-500/40 border-emerald-500/10'
                            : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-500 dark:text-slate-400 group-hover/card:border-blue-500/40 group-hover/card:scale-105'
                        }`}>
                        {status === 'VERIFYING' ? (
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                        ) : (
                            <task.icon className="w-5 h-5" />
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex justify-between items-start mb-1.5">
                        <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                            <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight truncate">
                                {task.title}
                            </h4>
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 line-clamp-1 opacity-70 group-hover/card:opacity-100 transition-opacity uppercase tracking-tight">
                                {task.description}
                            </p>
                        </div>

                        {!isCompleted && (
                            <div className="shrink-0 flex items-center gap-2">
                                <div className={`px-2.5 py-1 rounded-xl border font-black text-[10px] transition-all duration-500 ${isClaimable
                                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_4px_12px_rgba(16,185,129,0.4)]'
                                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-sm'
                                    }`}>
                                    +{reward} XP
                                </div>
                                {isPro && (
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 ring-4 ring-emerald-500/10" />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Progress Segment - Cleaner & More Space */}
                    {(task.type === 'referral' || task.type === 'action') && (
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest px-0.5">
                                <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                                    <div className={`w-1.5 h-1.5 rounded-full ${task.type === 'referral' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                                    {t('tasks.progress')}
                                </span>
                                <span className="text-slate-900 dark:text-white tracking-tighter bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md">
                                    <span className="text-blue-500 dark:text-blue-400">{Math.min(currentProgress, task.requirement || 0)}</span>
                                    <span className="mx-1 opacity-20">/</span>
                                    <span className="opacity-60">{task.requirement}</span>
                                </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-white/5 shadow-inner">
                                <motion.div
                                    className="h-full rounded-full relative"
                                    style={{
                                        background: task.type === 'referral'
                                            ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                                            : 'linear-gradient(90deg, #10b981, #34d399)',
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${Math.min((currentProgress / (task.requirement || 1)) * 100, 100)}%`
                                    }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 100 }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Area - Structured Separator */}
            {!isCompleted && !isLocked && (
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isClaimable ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('tasks.status || Status')}</span>
                    </div>

                    {isClaimable ? (
                        <button
                            disabled={isClaiming}
                            className={`bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-95 ${isClaiming ? 'opacity-80 cursor-wait' : ''}`}
                            onClick={async (e) => {
                                e.stopPropagation();
                                setIsClaiming(true);
                                try {
                                    Haptic.notification('success');
                                    await onClaim?.();
                                } finally {
                                    setIsClaiming(false);
                                }
                            }}
                        >
                            {isClaiming ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4" />
                            )}
                            {isClaiming ? t('common.loading') : t('tasks.claim')}
                        </button>
                    ) : status === 'VERIFYING' ? (
                        <div className="bg-blue-500/10 border border-blue-500/20 px-5 py-2.5 rounded-xl flex items-center gap-4">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest animate-pulse">{t('tasks.verifying')}</span>
                            <span className="font-mono text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md">
                                {countdown}s
                            </span>
                        </div>
                    ) : (
                        <button
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group/btn ${isStarted
                                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl'
                                }`}
                        >
                            {status === 'STARTED' ? (
                                <>
                                    <span className="animate-pulse">{t('tasks.in_progress')}</span>
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </>
                            ) : (
                                <>
                                    {t('tasks.start')}
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}

            {isCompleted && (
                <div className="mt-5 flex items-center justify-center">
                    <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 px-6 py-2 rounded-2xl flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-in zoom-in duration-500" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Protocol Accomplished</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
};
