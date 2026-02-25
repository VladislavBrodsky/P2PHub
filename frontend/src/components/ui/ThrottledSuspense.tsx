import React, { useState, useEffect, useRef } from 'react';

interface ThrottledSuspenseProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    threshold?: number;
    rootMargin?: string;
    className?: string; // Added to support layout styling
}

/**
 * ThrottledSuspense automatically pauses the rendering of its children
 * when they are not in the viewport, saving CPU cycles and battery.
 */
export const ThrottledSuspense: React.FC<ThrottledSuspenseProps> = ({
    children,
    fallback = null,
    threshold = 0.01,
    rootMargin = '600px',
    className = ''
}) => {
    const [isIntersecting, setIntersecting] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIntersecting(entry.isIntersecting);
            },
            { threshold, rootMargin }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                observer.unobserve(containerRef.current);
            }
        };
    }, [threshold, rootMargin]);

    return (
        <div ref={containerRef} className={`w-full ${className}`}>
            {isIntersecting ? children : fallback}
        </div>
    );
};
