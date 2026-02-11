import React, { Suspense } from 'react';

interface LazyLoaderProps {
    children: React.ReactNode;
    height?: string;
}

export const LazyLoader = ({ children, height = '200px' }: LazyLoaderProps) => {
    return (
        <Suspense fallback={<div style={{ height }} className="w-full animate-pulse bg-slate-100/10 dark:bg-white/5 rounded-3xl" />}>
            {children}
        </Suspense>
    );
};
