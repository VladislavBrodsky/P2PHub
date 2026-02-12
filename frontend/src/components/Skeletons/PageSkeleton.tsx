// #comment: Enhanced PageSkeleton to align with the premium glassmorphism design system.
// Added a subtle shimmer overlay and refined border/background styles to create a higher perceived quality during loading states.
import { Skeleton } from '../Skeleton';
import { motion } from 'framer-motion';

export const PageSkeleton = () => {
    return (
        <div className="flex flex-col min-h-screen px-4 pt-8 pb-32 space-y-8 relative overflow-hidden">
            {/* Premium Shimmer Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-shimmer" />
            </div>

            {/* Page Title Skeleton */}
            <div className="flex flex-col items-center space-y-4 pt-4 relative z-0">
                <Skeleton className="h-10 w-2/3 rounded-xl mx-auto bg-white/5 backdrop-blur-sm" />
                <Skeleton className="h-6 w-32 rounded-full mx-auto opacity-40 bg-white/5" />
            </div>

            {/* Main Hero Card (Premium Glass Effect) */}
            <div className="w-full h-80 rounded-[3rem] bg-white/5 dark:bg-white/5 border border-white/10 p-8 relative overflow-hidden shadow-2xl backdrop-blur-xl group">
                <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-purple-500/5 opacity-50" />

                <div className="flex flex-col items-center justify-center h-full space-y-6 relative z-10">
                    <div className="relative">
                        <Skeleton className="w-32 h-32 rounded-full ring-4 ring-white/5 shadow-inner" />
                        {/* Pulse Glow for Hero Element */}
                        <motion.div
                            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full -z-10"
                        />
                    </div>
                    <Skeleton className="h-4 w-48 rounded-full bg-white/10" />
                    <div className="grid grid-cols-2 gap-4 w-full pt-4">
                        <Skeleton className="h-20 rounded-2xl bg-white/5 border border-white/5" />
                        <Skeleton className="h-20 rounded-2xl bg-white/5 border border-white/5" />
                    </div>
                </div>
            </div>

            {/* Action Widget Skeleton */}
            <div className="w-full h-14 rounded-full bg-white/5 border border-white/10 overflow-hidden relative shadow-lg">
                <Skeleton className="w-full h-full opacity-20" />
            </div>

            {/* List / Grid Content Skeleton */}
            <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center px-2">
                    <Skeleton className="h-6 w-32 rounded-lg bg-white/5" />
                    <Skeleton className="h-4 w-20 rounded-md opacity-40 bg-white/5" />
                </div>
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 rounded-3xl bg-white/5 border border-white/5 p-5 flex items-center gap-4 shadow-sm backdrop-blur-md relative overflow-hidden">
                        <Skeleton className="h-12 w-12 rounded-2xl shrink-0 bg-white/10" />
                        <div className="flex-1 space-y-3">
                            <Skeleton className="h-4 w-3/4 rounded-full bg-white/10" />
                            <Skeleton className="h-3 w-1/2 rounded-full opacity-40 bg-white/5" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-full shrink-0 opacity-20 bg-white/5" />
                    </div>
                ))}
            </div>
        </div>
    );
};
