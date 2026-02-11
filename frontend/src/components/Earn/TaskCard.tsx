import { motion } from 'framer-motion';
import { Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Task } from '../../data/earnData';
import { useTranslation } from 'react-i18next';
import { Haptic } from '../../utils/tma';

interface TaskCardProps {
    task: Task;
    status: 'LOCKED' | 'AVAILABLE' | 'VERIFYING' | 'CLAIMABLE' | 'COMPLETED';
    userReferrals: number;
    checkinStreak?: number;
    countdown?: number;
    onClick?: () => void;
    onClaim?: () => void;
}

export const TaskCard = ({ task, status, userReferrals, checkinStreak = 0, countdown, onClick, onClaim }: TaskCardProps) => {
    const { t } = useTranslation();

    // Status Logic
    const isLocked = status === 'LOCKED';
    const isCompleted = status === 'COMPLETED';
    const isClaimable = status === 'CLAIMABLE';
    const isAvailable = status === 'AVAILABLE';

    // Visual Variations
    const variants = {
        LOCKED: 'opacity-50 grayscale cursor-not-allowed border-(--color-border-glass) bg-(--color-text-primary)/10',
        AVAILABLE: 'glass-panel hover:border-blue-500/50 hover:bg-(--color-text-primary)/5 cursor-pointer text-text-primary',
        VERIFYING: 'glass-panel border-blue-500/30 bg-blue-500/5 cursor-wait',
        CLAIMABLE: 'glass-panel border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-pulse',
        COMPLETED: 'glass-panel border-green-500/20 bg-green-500/5 cursor-default'
    };

    const handleCardClick = () => {
        if (isAvailable) {
            Haptic.selection();
            onClick?.();
        } else if (isClaimable) {
            Haptic.notification('success');
            onClaim?.();
        }
    };

    return (
        <motion.div
            layout
            className={`relative rounded-2xl p-4 border transition-all duration-300 ${variants[status]}`}
            onClick={handleCardClick}
            whileHover={isAvailable ? { scale: 1.02 } : {}}
            whileTap={isAvailable ? { scale: 0.98 } : {}}
        >
            {/* Locked Overlay */}
            {isLocked && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-(--color-bg-app)/60 backdrop-blur-[1px] rounded-2xl">
                    <div className="bg-(--color-bg-surface) px-4 py-2 rounded-full border border-(--color-border-glass) flex items-center gap-2 shadow-sm">
                        <Lock className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{t('tasks.level_short')} {task.minLevel}</span>
                    </div>
                </div>
            )}

            <div className="flex items-start justify-between gap-4">
                {/* Icon */}
                <div className={`p-3 rounded-xl border ${isClaimable ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-(--color-text-primary)/5 border-(--color-border-glass) text-(--color-text-secondary)'}`}>
                    {status === 'VERIFYING' ? (
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <task.icon className="w-5 h-5" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-text-primary line-clamp-1 pr-16">{task.title}</h4>
                    </div>
                    {/* Absolute XP Badge */}
                    {!isCompleted && (
                        <div className={`absolute top-3 right-3 z-10 text-[10px] font-black px-2.5 py-1 rounded-full ${isClaimable ? 'bg-white text-emerald-600 shadow-sm' : 'bg-yellow-500/10 text-yellow-500'}`}>
                            +{task.reward} XP
                        </div>
                    )}
                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {task.description}
                    </p>

                    {/* Progress Bar for Referrals/Check-ins */}
                    {(task.type === 'referral' || task.type === 'action') && (
                        <div className="pt-2 space-y-1">
                            <div className="flex justify-between text-[10px] font-bold uppercase text-text-secondary">
                                <span>{t('tasks.progress')}</span>
                                <span className="font-mono">
                                    {task.type === 'referral'
                                        ? Math.min(userReferrals, task.requirement || 0)
                                        : Math.min(checkinStreak, task.requirement || 0)
                                    } / {task.requirement}
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-brand-muted/10 rounded-full overflow-hidden p-px relative">
                                <motion.div
                                    className="h-full rounded-full relative overflow-hidden"
                                    style={{
                                        backgroundColor: task.type === 'referral' ? '#3b82f6' : '#10b981',
                                        boxShadow: task.type === 'referral'
                                            ? '0 0 8px rgba(59, 130, 246, 0.4)'
                                            : '0 0 8px rgba(16, 185, 129, 0.4)'
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${Math.min(((task.type === 'referral' ? userReferrals : checkinStreak) / (task.requirement || 1)) * 100, 100)}%`
                                    }}
                                >
                                    {/* Crystal Layers */}
                                    <div className="absolute inset-0 bg-linear-to-b from-white/30 to-transparent" />
                                    <motion.div
                                        animate={{ x: ['-100%', '200%'] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                        className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent"
                                    />
                                </motion.div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Footer */}
            {!isCompleted && !isLocked && (
                <div className="mt-4 pt-3 border-t border-(--color-border-glass) flex justify-end">
                    {isClaimable ? (
                        <button
                            className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-wider hover:text-emerald-300 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                Haptic.notification('success');
                                onClaim?.();
                            }}
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {t('tasks.claim')}
                        </button>
                    ) : status === 'VERIFYING' ? (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                            <span className="animate-pulse">Verifying...</span>
                            <span className="font-mono bg-blue-500/10 px-1.5 py-0.5 rounded text-[9px]">{countdown}s</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-400 uppercase tracking-wider group-hover:gap-2 transition-all">
                            {t('tasks.start')} <ArrowRight className="w-3 h-3" />
                        </div>
                    )}
                </div>
            )}

            {isCompleted && (
                <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500/50" />
                </div>
            )}
        </motion.div>
    );
};
