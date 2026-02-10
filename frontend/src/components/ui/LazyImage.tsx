import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string;
    placeholderClassName?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
    src,
    alt,
    className = "",
    placeholderClassName = "",
    ...props
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' } // Load images 200px before they enter viewport
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
            <AnimatePresence mode="wait">
                {!isLoaded && (
                    <motion.div
                        key="placeholder"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse ${placeholderClassName}`}
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
                    </motion.div>
                )}
            </AnimatePresence>

            {isInView && (
                <img
                    src={src}
                    alt={alt}
                    onLoad={() => setIsLoaded(true)}
                    className={`${className} transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    {...props}
                />
            )}
        </div>
    );
};
