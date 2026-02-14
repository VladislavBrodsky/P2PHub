import * as React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface BentoFeatureProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    className?: string;
    delay?: number;
    featured?: boolean;
}

export const BentoFeature = ({
    title,
    description,
    icon: Icon,
    className,
    delay = 0,
    featured = false,
}: BentoFeatureProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className={cn(
                "group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 p-6 backdrop-blur-xl transition-all hover:bg-white/80 dark:hover:bg-slate-900/80",
                featured ? "col-span-2 bg-linear-to-br from-blue-500/10 to-transparent" : "col-span-1", className
            )}
        >
            {/* Background Glow Effect */}
            <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500 opacity-5 blur-3xl transition-all group-hover:opacity-10" />

            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                {Icon && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-blue-500 backdrop-blur-md shadow-sm">
                        <Icon className="h-5 w-5" />
                    </div>
                )}

                <div>
                    <h3 className={cn("font-bold tracking-tight text-slate-900 dark:text-white", featured ? "text-xl" : "text-base")}>
                        {title}
                    </h3>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                        {description}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};
