// #comment: No changes needed in PageSkeleton.tsx as Skeleton import is required
import { Skeleton } from '../Skeleton';

export const PageSkeleton = () => {
    return (
        <div className="flex flex-col min-h-screen px-4 pt-8 pb-32 space-y-8">
            {/* Page Title Skeleton */}
            <div className="flex flex-col items-center space-y-4 pt-4">
                <Skeleton className="h-10 w-2/3 rounded-xl mx-auto" />
                <Skeleton className="h-6 w-32 rounded-full mx-auto opacity-60" />
            </div>

            {/* Main Hero Card (EarnHeader / Cards / Dashboard Hero) */}
            <div className="w-full h-80 rounded-[3rem] bg-(--color-bg-surface) border border-(--color-border-glass) p-8 relative overflow-hidden shadow-sm">
                <div className="flex flex-col items-center justify-center h-full space-y-6">
                    <Skeleton className="w-32 h-32 rounded-full" />
                    <Skeleton className="h-4 w-48 rounded-full" />
                    <div className="grid grid-cols-2 gap-4 w-full pt-4">
                        <Skeleton className="h-20 rounded-2xl" />
                        <Skeleton className="h-20 rounded-2xl" />
                    </div>
                </div>
            </div>

            {/* Action Widget Skeleton (ReferralWidget / Primary CTA) */}
            <div className="w-full h-14 rounded-full bg-(--color-bg-surface) border border-(--color-border-glass) overflow-hidden">
                <Skeleton className="w-full h-full opacity-40" />
            </div>

            {/* List / Grid Content Skeleton */}
            <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center px-2">
                    <Skeleton className="h-6 w-32 rounded-lg" />
                    <Skeleton className="h-4 w-20 rounded-md opacity-60" />
                </div>
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 rounded-3xl bg-(--color-bg-surface) border border-(--color-border-glass) p-5 flex items-center gap-4 shadow-xs">
                        <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4 rounded-full" />
                            <Skeleton className="h-3 w-1/2 rounded-full opacity-60" />
                        </div>
                        <Skeleton className="h-6 w-6 rounded-full shrink-0 opacity-40" />
                    </div>
                ))}
            </div>
        </div>

    );
};
