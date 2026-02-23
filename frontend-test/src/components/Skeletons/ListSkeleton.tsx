import { motion } from 'framer-motion';

export const ListSkeleton = ({ count = 5 }: { count?: number }) => {
    return (
        <div className="w-full space-y-3">
            {[...Array(count)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                    className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 dark:bg-slate-900/40 p-3 relative overflow-hidden"
                >
                    {/* Shimmer sweep */}
                    <motion.div
                        className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -skew-x-12"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
                    />
                    {/* Avatar circle */}
                    <div className="h-11 w-11 rounded-full shrink-0 bg-slate-200/40 dark:bg-white/5 animate-pulse" />
                    {/* Text lines */}
                    <div className="flex-1 space-y-2">
                        <div
                            className="h-3.5 rounded-full bg-slate-200/50 dark:bg-white/8 animate-pulse"
                            style={{ width: `${60 + (i % 3) * 12}%` }}
                        />
                        <div
                            className="h-2.5 rounded-full bg-slate-200/30 dark:bg-white/5 animate-pulse"
                            style={{ width: `${35 + (i % 4) * 8}%` }}
                        />
                    </div>
                    {/* Score pill */}
                    <div className="h-8 w-14 rounded-xl bg-slate-200/30 dark:bg-white/5 animate-pulse shrink-0" />
                </motion.div>
            ))}
        </div>
    );
};
