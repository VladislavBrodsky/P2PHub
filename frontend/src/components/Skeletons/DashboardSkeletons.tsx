import { motion } from 'framer-motion';

/**
 * Premium skeleton for Dashboard Stat Cards to prevent Layout Shift (CLS)
 */
export const StatCardSkeleton = () => {
    return (
        <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="flex flex-col items-center justify-center p-4 rounded-[2rem] bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/5 space-y-2 h-24"
                >
                    <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    <div className="w-12 h-4 rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    <div className="w-16 h-2 rounded-sm bg-slate-200 dark:bg-slate-800 animate-pulse" />
                </div>
            ))}
        </div>
    );
};

/**
 * Premium skeleton for Blog Carousel items
 */
export const BlogCardSkeleton = () => {
    return (
        <div className="flex gap-4 overflow-hidden px-4">
            {[1, 2].map((i) => (
                <div
                    key={i}
                    className="min-w-[280px] h-[240px] rounded-[2.5rem] bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/5 p-6 space-y-4"
                >
                    <div className="flex justify-between items-center">
                        <div className="w-16 h-4 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                        <div className="w-12 h-3 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    </div>
                    <div className="w-full h-6 rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    <div className="w-3/4 h-6 rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    <div className="pt-4 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                        <div className="w-20 h-3 rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
};
