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
            className={`relative rounded-3xl p-4 border transition-all duration-500 overflow-hidden ${variants[status]}`}
            onClick={handleCardClick}
            whileHover={isAvailable || isClaimable || isStarted ? { y: -2, scale: 1.005 } : {}}
            whileTap={isAvailable || isClaimable || isStarted ? { scale: 0.985 } : {}}
        >
            {/* Immersive Vibe Glow */}
            <div className={`absolute -top-16 -right-16 w-32 h-32 blur-[60px] rounded-full transition-opacity duration-1000 ${isClaimable ? 'bg-emerald-500/30' : isStarted ? 'bg-blue-500/30' : 'bg-yellow-400/20'
                }`} />

            {/* Locked Overlay */}
            {isLocked && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs rounded-3xl">
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 flex items-center gap-2 shadow-2xl">
                        <Lock className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('tasks.level_short')} {task.minLevel}</span>
                    </div>
                </div>
            )}

            <div className="flex items-start gap-3 relative z-10">
                {/* Icon Container - Vibing Circular Shadow */}
                <div className="shrink-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-700 ${isClaimable
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                        : isCompleted
                            ? 'bg-emerald-500/10 text-emerald-500/30 border-emerald-500/10'
                            : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-500 dark:text-slate-400 group-hover/card:border-blue-500/40'
                        }`}>
                        {status === 'VERIFYING' ? (
                            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                        ) : (
                            <task.icon className="w-4 h-4" />
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col min-w-0 pr-1">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight truncate">
                                {task.title}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 line-clamp-1 opacity-60 uppercase tracking-tight">
                                {task.description}
                            </p>
                        </div>

                        {!isCompleted && (
                            <div className="shrink-0 flex items-center gap-2 ml-4">
                                <div className={`px-2.5 py-1 rounded-full border font-black text-[9px] transition-all duration-500 ${isClaimable
                                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                    : 'bg-yellow-400 text-yellow-950 border-yellow-300 shadow-[0_2px_8px_rgba(251,191,36,0.3)]'
                                    }`}>
                                    +{reward} XP
                                </div>
                                {isPro && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-500/20" />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Compact Progress */}
                    {(task.type === 'referral' || task.type === 'action') && (
                        <div className="mt-2.5 space-y-1.5">
                            <div className="flex justify-between items-baseline text-[8px] font-black uppercase tracking-widest px-0.5">
                                <span className="text-slate-400">
                                    {t('tasks.progress')}
                                </span>
                                <span className="text-slate-900 dark:text-white tracking-tighter opacity-80">
                                    {Math.min(currentProgress, task.requirement || 0)} <span className="opacity-30">/</span> {task.requirement}
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden p-px border border-slate-200 dark:border-white/5">
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

            {/* Action Area - Ultra Compact */}
            {!isCompleted && !isLocked && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isClaimable ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('tasks.status', 'Status')}</span>
                    </div>

                    {isClaimable ? (
                        <button
                            disabled={isClaiming}
                            className={`bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 ${isClaiming ? 'opacity-80 cursor-wait' : ''}`}
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
                            {isClaiming ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            {isClaiming ? (t('common.loading') || "Loading...") : t('tasks.claim')}
                        </button>
                    ) : status === 'VERIFYING' ? (
                        <div className="bg-blue-500/5 border border-blue-500/20 px-4 py-2 rounded-lg flex items-center gap-3">
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest animate-pulse">{t('tasks.verifying')}</span>
                            <span className="font-mono text-[9px] font-black text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-md">{countdown}s</span>
                        </div>
                    ) : (
                        <button
                            className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 group/btn ${isStarted
                                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-none'
                                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                                }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCardClick();
                            }}
                        >
                            {status === 'STARTED' ? (
                                <>
                                    <span className="animate-pulse">{t('tasks.in_progress', 'In Progress')}</span>
                                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                </>
                            ) : (
                                <>
                                    {t('tasks.start')}
                                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}

            {isCompleted && (
                <div className="mt-4 flex items-center justify-center">
                    <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 px-5 py-1.5 rounded-xl flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Protocol Clear</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
};
