import { Task } from '../../data/earnData';
import { TaskCard } from './TaskCard';
import { CheckCircle2 } from 'lucide-react';

interface TaskGridProps {
    tasks: Task[];
    completedTaskIds: string[];
    verifyingTasks: Record<string, number>;
    claimableTasks: string[];
    currentLevel: number;
    referrals: number;
    checkinStreak: number;
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
    onTaskClick,
    onClaim
}: TaskGridProps) => {

    // Filter out completed tasks and then sort
    const visibleTasks = tasks.filter(t => !completedTaskIds.includes(t.id));

    const sortedTasks = [...visibleTasks].sort((a, b) => {
        // Since we filtered completed, sorting is simpler (e.g., by level or availability)
        return a.minLevel - b.minLevel;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active Missions
                </h3>
                <span className="text-xs font-semibold text-brand-muted glass-panel px-3 py-1 rounded-lg">
                    {tasks.filter(t => !completedTaskIds.includes(t.id)).length} Available
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sortedTasks.length > 0 ? (
                    sortedTasks.map((task) => {
                        const isLocked = Number(currentLevel) < Number(task.minLevel);
                        const isCompleted = completedTaskIds.includes(task.id);
                        const isVerifying = !!verifyingTasks[task.id];
                        const isClaimableTimed = claimableTasks.includes(task.id);

                        let status: 'LOCKED' | 'AVAILABLE' | 'VERIFYING' | 'CLAIMABLE' | 'COMPLETED' = 'AVAILABLE';

                        if (isCompleted) status = 'COMPLETED';
                        else if (isLocked) status = 'LOCKED';
                        else if (isVerifying) status = 'VERIFYING';
                        else if (isClaimableTimed) status = 'CLAIMABLE';
                        else if (task.type === 'referral') {
                            if (referrals >= (task.requirement || 0)) status = 'CLAIMABLE';
                            else status = 'AVAILABLE';
                        }
                        else if (task.type === 'action') {
                            if (checkinStreak >= (task.requirement || 0)) status = 'CLAIMABLE';
                            else status = 'AVAILABLE';
                        }

                        return (
                            <TaskCard
                                key={task.id}
                                task={task}
                                status={status}
                                userReferrals={referrals}
                                checkinStreak={checkinStreak}
                                countdown={verifyingTasks[task.id]}
                                onClick={() => onTaskClick(task)}
                                onClaim={() => onClaim(task)}
                            />
                        );
                    })
                ) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center gap-3 glass-panel rounded-3xl border border-(--color-border-glass) opacity-80 backdrop-blur-xl">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div className="text-center">
                            <p className="text-text-primary font-bold">All Missions Clear!</p>
                            <p className="text-xs text-text-secondary">New missions arriving soon.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
