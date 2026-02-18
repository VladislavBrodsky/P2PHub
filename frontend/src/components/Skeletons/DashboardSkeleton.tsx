export const DashboardSkeleton = () => {
    return (
        <div className="flex w-full flex-col px-4 pb-20 space-y-12">
            {/* 1. Orbit Skeleton */}
            <div className="relative -mx-4 h-[400px] mt-2 flex items-center justify-center">
                <div className="w-64 h-64 rounded-full border-2 border-dashed border-slate-200/20 dark:border-white/5 animate-pulse flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full border-2 border-dashed border-slate-200/30 dark:border-white/10" />
                </div>
            </div>

            {/* 2. Text Skeleton */}
            <div className="space-y-4 px-2 flex flex-col items-center">
                <div className="h-6 w-40 bg-slate-200/50 dark:bg-white/5 rounded-full animate-pulse" />
                <div className="h-10 w-64 bg-slate-200/50 dark:bg-white/5 rounded-xl animate-pulse" />
                <div className="h-10 w-48 bg-slate-200/50 dark:bg-white/10 rounded-xl animate-pulse" />
            </div>

            {/* 3. Stats Skeleton */}
            <div className="grid grid-cols-2 gap-4">
                <div className="h-24 rounded-3xl bg-slate-200/50 dark:bg-white/5 animate-pulse" />
                <div className="h-24 rounded-3xl bg-slate-200/50 dark:bg-white/5 animate-pulse" />
            </div>

            {/* 4. Bento Skeleton Snippet */}
            <div className="space-y-4">
                <div className="h-4 w-24 bg-slate-100/50 dark:bg-white/5 rounded-full" />
                <div className="grid grid-cols-2 gap-3">
                    <div className="h-32 col-span-2 rounded-2xl bg-slate-200/50 dark:bg-white/5 animate-shimmer relative overflow-hidden" />
                    <div className="h-32 rounded-2xl bg-slate-200/50 dark:bg-white/5 animate-pulse" />
                    <div className="h-32 rounded-2xl bg-slate-200/50 dark:bg-white/5 animate-pulse" />
                </div>
            </div>
        </div>
    );
};
