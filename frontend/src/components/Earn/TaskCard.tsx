import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Task } from '../../data/earnData';
import { useTranslation } from 'react-i18next';
import { Haptic } from '../../utils/tma';
import { renderInline } from '../../utils/renderMarkdown';

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
    isProPlus?: boolean; // #comment: Distinguish PRO vs PRO+ for multipliers
    onClick?: () => void;
    onClaim?: () => void | Promise<void>;
}

export const TaskCard = memo(({ task, status, progress, userReferrals, checkinStreak = 0, countdown, isPro, isProPlus, onClick, onClaim }: TaskCardProps) => {
    const { t } = useTranslation(['social', 'common']);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);

    // Status Logic
    const isLocked = status === 'LOCKED';
    const isCompleted = status === 'COMPLETED';
    const isClaimable = status === 'CLAIMABLE';
    // #comment: Added isStarted check for UI rendering
    const isStarted = status === 'STARTED';

    const multiplier = isProPlus ? 3 : (isPro ? 1.5 : 1);
    const reward = task.reward * multiplier;

    const variants = {
        LOCKED: 'opacity-40 grayscale-[0.8] cursor-not-allowed border-border-glass bg-bg-glass',
        AVAILABLE: 'bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-white/10 hover:border-blue-500/50 cursor-pointer text-brand-text group/card backdrop-blur-3xl shadow-sm',
        VERIFYING: 'bg-blue-500/5 border-blue-500/30 dark:bg-blue-500/10 cursor-wait backdrop-blur-2xl',
        CLAIMABLE: 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.15)] animate-premium-pulse cursor-pointer group/card backdrop-blur-3xl',
        COMPLETED: 'bg-white/40 dark:bg-slate-900/40 border-slate-100 dark:border-emerald-500/10 cursor-default opacity-80',
        STARTED: 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/40 cursor-default group/card backdrop-blur-2xl'
    };

    const handleCardClick = (e?: React.MouseEvent) => {
        if (isLocked) return;

        // If clicking the card body (not a button), toggle expansion
        if (!e) {
            // Programmatic click
            onClick?.();
            return;
        }

        // For available/started/claimable, we might want to expand first to show details
        // Or if it's a direct link task, maybe just go?
        // User requested "dropdown section with full information", implying toggle.
        setIsExpanded(!isExpanded);
    };

    const currentProgress = progress !== undefined ? progress : (
        task.type === 'referral' ? userReferrals : (
            task.type === 'action' ? checkinStreak : 0
        )
    );

    return (
        <motion.div
            initial={false}
            whileHover={{ y: -2, scale: 1.01 }}
            className={`relative rounded-2xl border transition-all duration-500 overflow-hidden ${variants[status]} ${isExpanded ? 'ring-2 ring-blue-500/20 shadow-xl' : ''}`}
            onClick={handleCardClick}
        >
            {/* Premium Mesh Background - Visible on Hover */}
            <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none">
                <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 via-transparent to-purple-500/10" />
                <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-400/15 blur-[60px] rounded-full animate-pulse" />
            </div>

            {/* Header - Always Visible, Compact */}
            <div className="p-4 flex items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Icon Container with Glow */}
                    <div className="shrink-0 relative">
                        {isClaimable && (
                            <div className="absolute inset-0 bg-emerald-500 blur-md opacity-40 animate-pulse rounded-xl" />
                        )}
                        <div className={`relative w-10 h-10 rounded-[14px] flex items-center justify-center border transition-all duration-700 ${isClaimable
                            ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_4px_12px_rgba(16,185,129,0.3)]'
                            : isCompleted
                                ? 'bg-emerald-500/5 text-emerald-500/30 border-emerald-500/10'
                                : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-500 dark:text-slate-400 group-hover/card:border-blue-500/40 group-hover/card:scale-105'
                            }`}>
                            {status === 'VERIFYING' ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : isCompleted ? (
                                <CheckCircle2 className="w-5 h-5" />
                            ) : (
                                <task.icon className="w-5 h-5 group-hover/card:rotate-6 transition-transform" />
                            )}
                        </div>
                    </div>

                    {/* Title & Reward */}
                    <div className="flex flex-col min-w-0">
                        <h4 className="text-caption font-bold text-slate-900 dark:text-white tracking-tight truncate leading-tight">
                            {t(`tasks.${task.id}.title`, task.title)}
                        </h4>
                        {!isCompleted && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className={`px-1.5 py-0.5 rounded-md text-label tracking-wide uppercase ${isClaimable
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold'
                                    : 'xp-acid-badge'}`}>
                                    +{reward} XP
                                </div>
                                {(isPro || isProPlus) && (
                                    <div className="flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className={`text-label font-bold uppercase tracking-tighter ${isProPlus ? 'text-indigo-400' : 'text-emerald-500/80'}`}>x{multiplier} {t('tasks.boost')}</span>
                                    </div>
                                )}
                            </div>
                        )}
                        {isCompleted && (
                            <span className="text-label font-bold text-emerald-500 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                {t('tasks.done')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Expansion Toggle / Status Icon */}
                <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3, type: 'spring', damping: 20 }}
                    >
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-400 group-hover/card:text-blue-500 transition-colors">
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </motion.div>
                </div>
            </div>

            {/* Dropdown Content */}
            <motion.div
                initial={false}
                animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
            >
                <div className="px-4 pb-4 pt-0 space-y-4 border-t border-slate-100 dark:border-white/5 mt-0 relative z-10">
                    {/* Description */}
                    <div className="pt-3">
                        <p className="text-label font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                            {renderInline(t(`tasks.${task.id}.desc`, task.description))}
                        </p>
                    </div>

                    {/* Progress Bar for Referral/Action Tasks */}
                    {(task.type === 'referral' || task.type === 'action') && !isCompleted && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-baseline text-label font-bold uppercase tracking-widest px-0.5">
                                <span className="text-slate-400">{t('tasks.progress')}</span>
                                <span className="text-slate-900 dark:text-white tracking-tighter opacity-80">
                                    {Math.min(currentProgress, task.requirement || 0)} / {task.requirement}
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden p-px border border-slate-200 dark:border-white/5">
                                <motion.div
                                    className="h-full rounded-full progress-bar-liquid bg-linear-to-r from-emerald-400 to-emerald-500"
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${Math.min((currentProgress / (task.requirement || 1)) * 100, 100)}%`
                                    }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 100 }}
                                />
                            </div>
                        </div>
                    )}

                    {/* CTA Buttons */}
                    {!isCompleted && !isLocked && (
                        <div className="pt-1">
                            {isClaimable ? (
                                <button
                                    disabled={isClaiming}
                                    className={`w-full bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-3 rounded-xl text-label font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 ${isClaiming ? 'opacity-80 cursor-wait' : ''}`}
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
                                    {isClaiming ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    <span>{isClaiming ? t('common:loading') : t('tasks.claim')}</span>
                                </button>
                            ) : status === 'VERIFYING' ? (
                                <div className="w-full flex items-center justify-center gap-2 bg-blue-500/10 border border-blue-500/20 py-3 rounded-xl backdrop-blur-md shadow-sm">
                                    <span className="text-label font-bold text-blue-500 uppercase tracking-tighter animate-pulse">{t('tasks.verifying')}</span>
                                    <span className="font-mono text-label font-bold text-blue-600 dark:text-blue-400 min-w-[2ch]">{countdown}s</span>
                                </div>
                            ) : (
                                <button
                                    className={`w-full px-5 py-3 rounded-xl text-label font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn ${isStarted
                                        ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-none'
                                        : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                                        }`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClick?.();
                                    }}
                                >
                                    {status === 'STARTED' ? (
                                        <>
                                            <span className="animate-pulse">{t('tasks.in_progress')}</span>
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
                </div>
            </motion.div>
        </motion.div>
    );
});
