import { Task } from '../../data/earnData';
import { TaskCard } from './TaskCard';

interface TaskGridProps {
    tasks: Task[];
    completedTaskIds: string[];
    currentLevel: number;
    referrals: number;
    onTaskClick: (task: Task) => void;
    onClaim: (task: Task) => void;
}

export const TaskGrid = ({
    tasks,
    completedTaskIds,
    currentLevel,
    referrals,
    onTaskClick,
    onClaim
}: TaskGridProps) => {

    // Sort tasks: Available/Claimable first, then locked, then completed
    const sortedTasks = [...tasks].sort((a, b) => {
        const isCompletedA = completedTaskIds.includes(a.id);
        const isCompletedB = completedTaskIds.includes(b.id);
        if (isCompletedA && !isCompletedB) return 1;
        if (!isCompletedA && isCompletedB) return -1;
        return 0;
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
                {sortedTasks.map((task) => {
                    const isLocked = currentLevel < task.minLevel;
                    const isCompleted = completedTaskIds.includes(task.id);

                    let status: 'LOCKED' | 'AVAILABLE' | 'CLAIMABLE' | 'COMPLETED' = 'AVAILABLE';

                    if (isCompleted) status = 'COMPLETED';
                    else if (isLocked) status = 'LOCKED';
                    else if (task.type === 'referral') {
                        if (referrals >= (task.requirement || 0)) status = 'CLAIMABLE';
                        else status = 'AVAILABLE';
                    }

                    return (
                        <TaskCard
                            key={task.id}
                            task={task}
                            status={status}
                            userReferrals={referrals}
                            onClick={() => onTaskClick(task)}
                            onClaim={() => onClaim(task)}
                        />
                    );
                })}
            </div>
        </div>
    );
};
