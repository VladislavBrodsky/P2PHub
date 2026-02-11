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
                <div className="relative w-56 h-56 flex items-center justify-center">
                    {/* #comment: Pulsing Outer Rings - Micro-animations that provide visual feedback 
                        of "active loading" beyond the static percentage. */}
                    <motion.div
                        className="absolute inset-0 rounded-full border border-(--color-brand-primary)/10"
                        animate={{
                            scale: [1, 1.15, 1],
                            opacity: [0.1, 0.3, 0.1],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.div
                        className="absolute inset-4 rounded-full border border-(--color-brand-primary)/5"
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.1, 0.2, 0.1],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.5
                        }}
                    />

                    {/* Progress Circle SVG */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 filter drop-shadow-[0_0_8px_rgba(var(--color-brand-primary-rgb),0.3)]">
                        <circle
                            cx="112"
                            cy="112"
                            r="104"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            className="text-(--color-text-primary)/5"
                        />
                        <motion.circle
                            cx="112"
                            cy="112"
                            r="104"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray="653"
                            initial={{ strokeDashoffset: 653 }}
                            animate={{ strokeDashoffset: 653 - (653 * displayProgress) / 100 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="text-(--color-brand-primary)"
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Central Logo Container - Elite Glassmorphism */}
                    <motion.div
                        className="relative w-36 h-36 rounded-[2.5rem] bg-(--color-bg-surface)/40 backdrop-blur-2xl border border-(--color-border-glass) flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden group"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Inner Glow */}
                        <div className="absolute inset-0 bg-linear-to-tr from-white/5 to-transparent pointer-events-none" />

                        <img
                            src="/logo.webp"
                            alt="P2P Hub"
                            className="w-20 h-20 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        />

                        {/* Liquid Shine Effect */}
                        <motion.div
                            className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                            animate={{
                                x: ['-200%', '200%'],
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                repeatDelay: 1.5
                            }}
                        />
                    </motion.div>
                </div>

                {/* Progress Text - High Contrast & Refined Typography */}
                <div className="mt-16 flex flex-col items-center space-y-3">
                    <div className="flex items-baseline space-x-1">
                        <span className="text-5xl font-black text-(--color-text-primary) tracking-tighter tabular-nums drop-shadow-sm">
                            {displayProgress}
                        </span>
                        <span className="text-xl font-bold text-(--color-brand-primary) opacity-80">%</span>
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

