import * as React from 'react';

interface SectionProps {
    title?: string;
    children: React.ReactNode;
    headerAction?: React.ReactNode;
    className?: string;
}

export const Section = ({ title, children, headerAction, className = '' }: SectionProps) => {
    return (
        <section className={`flex flex-col gap-4 ${className}`}>
            {(title || headerAction) && (
                <div className="flex items-center justify-between px-1">
                    {title && (
                        <h3 className="text-lg font-black tracking-tight text-(--color-text-primary)">
                            {title}
                        </h3>
                    )}
                    {headerAction}
                </div>
            )}
            {children}
        </section>
    );
};
