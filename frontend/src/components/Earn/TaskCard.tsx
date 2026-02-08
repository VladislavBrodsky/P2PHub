import { motion } from 'framer-motion';
import { Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Task } from '../../data/earnData';
import { useTranslation } from 'react-i18next';

interface TaskCardProps {
    task: Task;
    status: 'LOCKED' | 'AVAILABLE' | 'CLAIMABLE' | 'COMPLETED';
    userReferrals: number;
    onClick?: () => void;
    onClaim?: () => void;
}

export const TaskCard = ({ task, status, userReferrals, onClick, onClaim }: TaskCardProps) => {
    const { t } = useTranslation();

    // Status Logic
    const isLocked = status === 'LOCKED';
    const isCompleted = status === 'COMPLETED';
    const isClaimable = status === 'CLAIMABLE';
    const isAvailable = status === 'AVAILABLE';

    // Visual Variations
    const variants = {
        LOCKED: 'opacity-50 grayscale cursor-not-allowed border-white/10 bg-black/20',
        AVAILABLE: 'glass-panel hover:border-blue-500/50 hover:bg-white/5 cursor-pointer text-(--color-text-primary)',
        CLAIMABLE: 'glass-panel border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-pulse',
        COMPLETED: 'glass-panel border-green-500/20 bg-green-500/5 cursor-default'
    };

    return (
        <motion.div
            layout
            className={`relative rounded-2xl p-4 border transition-all duration-300 ${variants[status]}`}
            onClick={isAvailable ? onClick : isClaimable ? onClaim : undefined}
            whileHover={isAvailable ? { scale: 1.02 } : {}}
            whileTap={isAvailable ? { scale: 0.98 } : {}}
        >
            {/* Locked Overlay */}
            {isLocked && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-(--color-bg-app)/60 backdrop-blur-[1px] rounded-2xl">
                    <div className="bg-(--color-bg-surface) px-4 py-2 rounded-full border border-(--color-border-glass) flex items-center gap-2 shadow-sm">
                        <Lock className="w-4 h-4 text-brand-muted" />
                        <span className="text-[10px] font-bold text-(--color-text-secondary) uppercase tracking-wider">{t('tasks.level_short')} {task.minLevel}</span>
                    </div>
                </div>
            )}

            <div className="flex items-start justify-between gap-4">
                {/* Icon */}
                <div className={`p-3 rounded-xl border ${isClaimable ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-brand-muted/10 border-brand-muted/5 text-brand-muted'}`}>
                    <task.icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-(--color-text-primary) line-clamp-1">{task.title}</h4>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isClaimable ? 'bg-white text-emerald-600' : 'bg-yellow-500/10 text-yellow-500'}`}>
                            +{task.reward} XP
                        </span>
                    </div>
                    <p className="text-xs text-brand-muted line-clamp-2 leading-relaxed">
                        {task.description}
                    </p>

                    {/* Progress Bar for Referrals */}
                    {task.type === 'referral' && (
                        <div className="pt-2 space-y-1">
                            <div className="flex justify-between text-[10px] font-bold uppercase text-brand-muted/80">
                                <span>{t('tasks.progress')}</span>
                                <span className="font-mono">{Math.min(userReferrals, task.requirement || 0)} / {task.requirement}</span>
                            </div>
                            <div className="h-1.5 w-full bg-brand-muted/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-blue-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((userReferrals / (task.requirement || 1)) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Footer */}
            {!isCompleted && !isLocked && (
                <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
                    {isClaimable ? (
                        <button
                            className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-wider hover:text-emerald-300 transition-colors"
                            onClick={(e) => { e.stopPropagation(); onClaim?.(); }}
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {t('tasks.claim')}
                        </button>
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
