import { useMemo } from 'react';
import { Task } from '../../data/earnData';
import { TaskCard } from './TaskCard';
import { CheckCircle2 } from 'lucide-react';
import { ActiveTask } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';

interface TaskGridProps {
    tasks: Task[];
    completedTaskIds: string[];
    verifyingTasks: Record<string, number>;
    claimableTasks: string[];
    currentLevel: number;
    referrals: number;
    checkinStreak: number;
    completedStages?: (string | number)[]; // New prop for Academy tracking
    isPro?: boolean;
    activeTasks?: ActiveTask[];
    onTaskClick: (task: Task) => void;
    onClaim: (task: Task) => void;
}

export const TaskGrid = ({
    tasks,
    completedTaskIds,
    verifyingTasks,
    claimableTasks,
    currentLevel,
    referrals,
    checkinStreak,
    completedStages = [], // Default to empty array
    isPro,
    activeTasks,
    onTaskClick,
    onClaim
}: TaskGridProps) => {
    const { t } = useTranslation();

    // Filter out completed tasks and then sort
    const visibleTasks = tasks.filter(t => !completedTaskIds.includes(t.id));

    const sortedTasks = useMemo(() => {
        return [...visibleTasks].sort((a, b) => {
            const getTaskStatus = (task: Task) => {
                const isCompleted = completedTaskIds.includes(task.id);
                if (isCompleted) return -1; // Completed goes to bottom

                const isLocked = Number(currentLevel) < Number(task.minLevel);
                const isVerifying = !!verifyingTasks[task.id];
                const isClaimableTimed = claimableTasks.includes(task.id);
                const activeTask = activeTasks?.find(at => at.task_id === task.id);

                if (isLocked) return 0; // Locked - lowest priority
                if (isVerifying) return 3; // Verifying - high
                if (isClaimableTimed) return 4; // Claimable - highest

                if (task.type === 'referral' || task.type === 'action' || task.type === 'academy') {
                    const val = task.type === 'referral' ? referrals :
                        task.type === 'action' ? checkinStreak :
                            (completedStages?.length || 0);

                    if (val >= (task.requirement || 0)) return 4; // Claimable
                    if (activeTask || task.id === 'academy_basics') return 2; // Started
                }
                return 1; // Available
            };

            const statusA = getTaskStatus(a);
            const statusB = getTaskStatus(b);

            if (statusA !== statusB) return statusB - statusA;
            return a.minLevel - b.minLevel;
        });
    }, [visibleTasks, currentLevel, verifyingTasks, claimableTasks, activeTasks, referrals, checkinStreak, completedTaskIds, completedStages]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-base font-black flex items-center gap-2 text-slate-900 dark:text-white uppercase tracking-tight">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    {t('tasks.active_missions')}
                </h3>
                <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md uppercase tracking-widest">
                    {tasks.filter(t => !completedTaskIds.includes(t.id)).length} {t('tasks.available')}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sortedTasks.length > 0 ? (
                    sortedTasks.map((task) => {
                        const isLocked = Number(currentLevel) < Number(task.minLevel);
                        const isCompleted = completedTaskIds.includes(task.id);
                        const isVerifying = !!verifyingTasks[task.id];
                        const isClaimableTimed = claimableTasks.includes(task.id);
                        const activeTask = activeTasks?.find(at => at.task_id === task.id);

                        let status: 'LOCKED' | 'AVAILABLE' | 'VERIFYING' | 'CLAIMABLE' | 'COMPLETED' | 'STARTED' = 'AVAILABLE';
                        let effectiveProgress = 0;

                        if (isCompleted) status = 'COMPLETED';
                        else if (isLocked) status = 'LOCKED';
                        else if (isVerifying) status = 'VERIFYING';
                        else if (isClaimableTimed) status = 'CLAIMABLE';
                        else if (task.type === 'referral' || task.type === 'action' || task.type === 'academy') {
                            const val = task.type === 'referral' ? referrals :
                                task.type === 'action' ? checkinStreak :
                                    (completedStages?.length || 0);

                            effectiveProgress = val;
                            if (val >= (task.requirement || 0)) {
                                status = 'CLAIMABLE';
                            } else if (activeTask || task.id === 'academy_basics') {
                                status = 'STARTED';
                            } else {
                                status = 'AVAILABLE';
                            }
                        }

                        return (
                            <TaskCard
                                key={task.id}
                                task={task}
                                status={status}
                                progress={effectiveProgress} // Pass calculated progress
                                userReferrals={referrals} // Keep for legacy or debug?
                                checkinStreak={checkinStreak}
                                countdown={verifyingTasks[task.id]}
                                isPro={!!isPro} // Pass pro status
                                onClick={() => onTaskClick(task)}
                                onClaim={() => onClaim(task)}
                            />
                        );
                    })
                ) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center gap-3 glass-panel rounded-3xl border border-slate-200 dark:border-white/10 opacity-80 backdrop-blur-xl">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div className="text-center">
                            <p className="text-text-primary font-bold">{t('tasks.all_clear_title')}</p>
                            <p className="text-xs text-text-secondary">{t('tasks.all_clear_desc')}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
