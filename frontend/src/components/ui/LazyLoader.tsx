import React, { Suspense, useEffect, useRef, useState } from 'react';

interface LazyLoaderProps {
    children: React.ReactNode;
    height?: string;
    threshold?: number;
}

export const LazyLoader = ({ children, height = '200px', threshold = 0.1 }: LazyLoaderProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isVisible) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px', threshold } // Preload 200px before viewport
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [isVisible, threshold]);

    return (
        <div ref={containerRef} style={{ minHeight: !isVisible ? height : undefined }} className="w-full">
            {isVisible ? (
                <Suspense fallback={<div style={{ height }} className="w-full animate-pulse bg-slate-100/10 dark:bg-white/5 rounded-3xl" />}>
                    {children}
                </Suspense>
            ) : (
                <div style={{ height }} className="w-full animate-pulse bg-slate-100/10 dark:bg-white/5 rounded-3xl" />
            )}
        </div>
    );
};
