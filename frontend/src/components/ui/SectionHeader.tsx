import React from 'react';
import { motion } from 'framer-motion';

interface SectionHeaderProps {
    badge?: string;
    title: string | React.ReactNode;
    description?: string | React.ReactNode;
    className?: string;
    align?: 'center' | 'left';
}

/**
 * Standardized Section Header to ensure proper H2/H3 semantic hierarchy
 * and consistent premium styling across the dashboard.
 */
export const SectionHeader = ({
    badge,
    title,
    description,
    className = '',
    align = 'center'
}: SectionHeaderProps) => {
    return (
        <div className={`space-y-3 flex flex-col ${align === 'center' ? 'items-center text-center' : 'items-start text-left'} ${className}`}>
            {badge && (
                <div className="flex items-center gap-2">
                    <motion.div
                        className="w-2 h-2 rounded-full bg-blue-500"
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">
                        {badge}
                    </span>
                </div>
            )}

            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1] whitespace-pre-line"
            >
                {title}
            </motion.h2>

            {description && (
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-[280px]"
                >
                    {description}
                </motion.p>
            )}
        </div>
    );
};
