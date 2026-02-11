import React, { useEffect, useState } from 'react';
// #comment: Removed unused AnimatePresence from framer-motion to simplify imports
import { motion } from 'framer-motion';

interface StartupLoaderProps {
    progress: number;
    statusText?: string;
}

export const StartupLoader: React.FC<StartupLoaderProps> = ({ progress, statusText = 'Initializing P2P Hub' }) => {
    const [displayProgress, setDisplayProgress] = useState(0);

    // Smooth progress interpolation
    useEffect(() => {
        const timer = setTimeout(() => {
            if (displayProgress < progress) {
                setDisplayProgress(prev => Math.min(prev + 1, progress));
            }
        }, 10);
        return () => clearTimeout(timer);
    }, [progress, displayProgress]);

    return (
        // #comment: Fixed visibility glitch where loader was hardcoded to dark styles only. 
        // Now uses semantic CSS variables (--color-bg-deep, --color-text-primary) to sync perfectly 
        // with both Light and Dark themes. Added transition-colors for a premium fading effect.
        <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-(--color-bg-deep) transition-colors duration-500 overflow-hidden">
            {/* #comment: Premium Background Mesh - Adds depth and a "premium" feel using brand-primary 
                blurs that adapt based on the active theme. */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-linear-to-br from-(--color-brand-primary)/20 to-transparent blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-linear-to-tl from-(--color-brand-primary)/10 to-transparent blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="relative flex flex-col items-center justify-center">
                {/* Main Animated Hub */}
                <div className="relative w-44 h-44 flex items-center justify-center">

                    {/* Central Logo Container - Blue Shadow Glow */}
                    <motion.div
                        className="relative w-28 h-28 flex items-center justify-center overflow-visible"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Recursive Blue Glow Layers */}
                        <motion.div
                            className="absolute inset-0 rounded-full bg-(--color-brand-primary)/20 blur-[30px]"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <div className="absolute inset-4 rounded-full bg-(--color-brand-primary)/30 blur-[20px]" />

                        <img
                            src="/logo.webp"
                            alt="P2P Hub"
                            className="relative w-16 h-16 object-contain z-10 drop-shadow-[0_0_25px_rgba(var(--color-brand-primary-rgb),0.5)]"
                        />
                    </motion.div>
                </div>

                {/* Progress Text - Compact & Refined */}
                <div className="mt-8 flex flex-col items-center space-y-2">
                    <div className="flex items-baseline space-x-1">
                        <span className="text-3xl font-black text-(--color-text-primary) tracking-tighter tabular-nums">
                            {displayProgress}
                        </span>
                        <span className="text-sm font-bold text-(--color-brand-primary) opacity-80">%</span>
                    </div>

                    <div className="flex flex-col items-center space-y-1">
                        <motion.p
                            className="text-(--color-text-primary) font-bold tracking-[0.2em] uppercase text-[10px] opacity-90"
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            {statusText}
                        </motion.p>

                        {/* Status Indicator Bar */}
                        <div className="w-12 h-0.5 rounded-full bg-(--color-text-primary)/10 overflow-hidden mt-2">
                            <motion.div
                                className="h-full bg-(--color-brand-primary)"
                                initial={{ width: 0 }}
                                animate={{ width: `${displayProgress}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Branding - Ultra Minimal */}
            <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center">
                <div className="flex items-center space-x-3 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                    <div className="h-[1px] w-8 bg-linear-to-r from-transparent to-(--color-text-primary)" />
                    <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-(--color-text-primary)">
                        Advanced Ecosystem
                    </span>
                    <div className="h-[1px] w-8 bg-linear-to-l from-transparent to-(--color-text-primary)" />
                </div>
            </div>
        </div>
    );
};

