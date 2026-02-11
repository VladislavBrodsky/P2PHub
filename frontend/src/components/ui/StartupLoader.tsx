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
        // #comment: Updated z-index to standard Tailwind 4.0 class for better compatibility
        <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-(--color-bg-deep) overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-(--color-brand-primary)/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-(--color-brand-secondary)/10 blur-[120px]" />
            </div>

            <div className="relative flex flex-col items-center justify-center">
                {/* Main Animated Hub */}
                <div className="relative w-48 h-48 flex items-center justify-center">
                    {/* Pulsing Outer Ring */}
                    <motion.div
                        className="absolute inset-0 rounded-full border border-(--color-brand-primary)/20"
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />

                    {/* Progress Circle */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                            cx="96"
                            cy="96"
                            r="88"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="text-(--color-bg-surface)/30"
                        />
                        <motion.circle
                            cx="96"
                            cy="96"
                            r="88"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeDasharray="553"
                            initial={{ strokeDashoffset: 553 }}
                            animate={{ strokeDashoffset: 553 - (553 * displayProgress) / 100 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="text-(--color-brand-primary)"
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Central Logo Container */}
                    <motion.div
                        className="relative w-32 h-32 rounded-3xl bg-(--color-bg-surface)/40 backdrop-blur-xl border border-(--color-border-glass) flex items-center justify-center shadow-2xl overflow-hidden"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <img
                            src="/logo.webp"
                            alt="P2P Hub"
                            className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(var(--color-brand-primary-rgb),0.5)]"
                        />

                        {/* #comment: Updated gradient class to the modern bg-linear-to-tr syntax */}
                        <motion.div
                            className="absolute inset-0 bg-linear-to-tr from-transparent via-white/10 to-transparent"
                            animate={{
                                x: ['-200%', '200%'],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear",
                                repeatDelay: 1
                            }}
                        />
                    </motion.div>
                </div>

                {/* Progress Text */}
                <div className="mt-12 flex flex-col items-center space-y-2">
                    <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-black text-white tracking-tighter">
                            {displayProgress}
                        </span>
                        <span className="text-xl font-bold text-(--color-brand-primary)">%</span>
                    </div>

                    <motion.p
                        className="text-(--color-text-secondary) font-medium tracking-widest uppercase text-xs"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        {statusText}
                    </motion.p>
                </div>
            </div>

            {/* Bottom Brand */}
            <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center">
                <div className="flex items-center space-x-2 opacity-30">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white">
                        Powered by Advanced AI
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
            </div>
        </div>
    );
};
