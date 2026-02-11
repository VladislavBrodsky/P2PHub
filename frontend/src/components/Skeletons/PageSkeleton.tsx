import { Skeleton } from '../Skeleton';

export const PageSkeleton = () => {
    return (
        <div className="flex flex-col min-h-screen px-4 py-6 space-y-6">
            {/* Header Skeleton */}
            <div className="flex flex-col items-center space-y-2 mb-4">
                <Skeleton className="h-8 w-48 rounded-lg" />
                <Skeleton className="h-4 w-32 rounded" />
            </div>

            {/* Main Feature / Banner Skeleton */}
            <div className="w-full h-48 rounded-3xl bg-(--color-bg-surface) border border-(--color-brand-border) p-6 relative overflow-hidden">
                <Skeleton className="absolute inset-0 w-full h-full opacity-10" />
                <div className="flex flex-col justify-end h-full space-y-3 relative z-10">
                    <Skeleton className="h-6 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-1/2 rounded" />
                </div>
            </div>

            {/* Stats / Grid Skeleton */}
            <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
            </div>

            {/* List Skeleton */}
            <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-24 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                </div>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 rounded-2xl bg-(--color-bg-surface) border border-(--color-brand-border) p-4 flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-full rounded" />
                            <Skeleton className="h-3 w-2/3 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
