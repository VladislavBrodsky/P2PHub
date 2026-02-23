import React from 'react';
import { m } from 'framer-motion';

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
        <div className={`space-y-4 flex flex-col ${align === 'center' ? 'items-center text-center' : 'items-start text-left'} ${className}`}>
            {badge && (
                <div className="flex items-center gap-2">
                    <m.div
                        className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-label font-black uppercase tracking-[0.3em] text-blue-500">
                        {badge}
                    </span>
                </div>
            )}

            <m.h2
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-display font-black tracking-tight text-text-primary leading-tight whitespace-pre-line"
            >
                {title}
            </m.h2>

            {description && (
                <m.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-body text-text-secondary font-medium max-w-[320px] leading-normal"
                >
                    {description}
                </m.p>
            )}
        </div>
    );
};
