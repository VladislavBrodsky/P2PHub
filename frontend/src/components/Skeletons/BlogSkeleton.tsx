import { Skeleton } from '../Skeleton';

export const BlogSkeleton = () => {
    return (
        <div className="flex flex-col min-h-screen pb-32 relative overflow-hidden">
            {/* Shimmer Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-shimmer" />
            </div>

            {/* Header Skeleton */}
            <div className="px-4 pt-2 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/5" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32 rounded-lg bg-slate-200 dark:bg-white/10" />
                        <Skeleton className="h-3 w-20 rounded-full opacity-40 bg-slate-200 dark:bg-white/5" />
                    </div>
                </div>
            </div>

            {/* Search & Dropdown Filter Skeletons */}
            <div className="px-4 py-4 space-y-4">
                <Skeleton className="w-full h-14 rounded-2xl bg-slate-200 dark:bg-white/5" />
                <Skeleton className="w-full h-12 rounded-2xl bg-slate-200 dark:bg-white/5" />
            </div>

            {/* Featured Post Skeleton */}
            <div className="px-4 pb-6">
                <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 flex flex-col shadow-sm backdrop-blur-md">
                    <Skeleton className="aspect-video w-full bg-slate-200 dark:bg-white/5" />
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-20 rounded-full bg-blue-500/20" />
                            <Skeleton className="h-3 w-16 rounded-full opacity-40 bg-slate-200 dark:bg-white/5" />
                        </div>
                        <Skeleton className="h-8 w-full rounded-xl bg-slate-200 dark:bg-white/10" />
                        <Skeleton className="h-4 w-[90%] rounded-lg bg-slate-200 dark:bg-white/5" />
                        <div className="pt-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10" />
                                <Skeleton className="h-4 w-24 rounded-lg bg-slate-200 dark:bg-white/5" />
                            </div>
                            <Skeleton className="w-12 h-12 rounded-full bg-slate-200 dark:bg-white/5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* List Skeleton */}
            <div className="px-4 space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-5 rounded-[2rem] bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 flex gap-4 items-center shadow-sm backdrop-blur-sm">
                        <Skeleton className="shrink-0 w-20 h-20 rounded-2xl bg-slate-200 dark:bg-white/10" />
                        <div className="flex-1 space-y-3">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-4 w-16 rounded-full bg-blue-500/10" />
                                <Skeleton className="h-3 w-12 rounded-full opacity-40 bg-slate-200 dark:bg-white/5" />
                            </div>
                            <Skeleton className="h-5 w-full rounded-lg bg-slate-200 dark:bg-white/10" />
                            <Skeleton className="h-3 w-3/4 rounded-lg opacity-40 bg-slate-200 dark:bg-white/5" />
                        </div>
                        <Skeleton className="shrink-0 w-10 h-10 rounded-full opacity-20 bg-slate-200 dark:bg-white/5" />
                    </div>
                ))}
            </div>
        </div>
    );
};
