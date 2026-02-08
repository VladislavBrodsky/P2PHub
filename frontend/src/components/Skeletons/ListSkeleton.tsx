import { Skeleton } from '../Skeleton';

export const ListSkeleton = () => {
    return (
        <div className="w-full space-y-4">
            {[...Array(5)].map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-4 rounded-3xl border border-(--color-brand-border) bg-(--color-bg-surface) p-4"
                >
                    <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4 rounded" />
                        <Skeleton className="h-3 w-1/2 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
};
