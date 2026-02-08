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
                "group relative overflow-hidden rounded-3xl border border-(--color-brand-border) bg-(--color-bg-surface) p-6 backdrop-blur-xl transition-all hover:bg-(--color-bg-glass)",
                featured ? "col-span-2 bg-linear-to-br from-(--color-brand-light) to-transparent" : "col-span-1", className
            )}
        >
            {/* Background Glow Effect */}
            <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-(--color-brand-primary) opacity-5 blur-3xl transition-all group-hover:opacity-10" />

            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                {Icon && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-bg-app) text-(--color-brand-primary) backdrop-blur-md shadow-sm">
                        <Icon className="h-5 w-5" />
                    </div>
                )}

                <div>
                    <h3 className={cn("font-bold tracking-tight text-(--color-text-primary)", featured ? "text-xl" : "text-base")}>
                        {title}
                    </h3>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-(--color-text-secondary)">
                        {description}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};
