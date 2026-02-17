import React, { useEffect, useState } from 'react';
import { LOGO_DATA } from '../../data/avatars';
// #comment: Removed unused AnimatePresence from framer-motion to simplify imports
import { motion } from 'framer-motion';

interface StartupLoaderProps {
    progress: number;
    statusText?: string;
}

export const StartupLoader: React.FC<StartupLoaderProps> = ({ progress, statusText = 'Initializing P2P Hub' }) => {
    const [displayProgress, setDisplayProgress] = useState(0);
    const logoSrc = LOGO_DATA.startsWith('http') ? LOGO_DATA : `${(window as any).VITE_API_URL || 'https://p2phub-production.up.railway.app'}${LOGO_DATA}`;

    // #comment: Accelerated progress interpolation. 
    // Increased step size and frequency to ensure the loader feels snappy 
    // and doesn't trap the user in artificial wait cycles.
    useEffect(() => {
        const timer = setTimeout(() => {
            if (displayProgress < progress) {
                const diff = progress - displayProgress;
                // dynamic step: larger jumps for larger gaps
                const step = diff > 20 ? 5 : (diff > 5 ? 2 : 1);
                setDisplayProgress(prev => Math.min(prev + step, progress));
            }
        }, 8); // Slightly faster interval (8ms vs 10ms)
        return () => clearTimeout(timer);
    }, [progress, displayProgress]);

    return (
        // #comment: Fixed visibility glitch where loader was hardcoded to dark styles only. 
        // Now uses semantic CSS variables (--color-bg-deep, --color-text-primary) to sync perfectly 
        // with both Light and Dark themes. Added transition-colors for a premium fading effect.
        <div
            className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-(--color-bg-app) transition-colors duration-500 overflow-hidden"
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-valuenow={displayProgress}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            {/* #comment: Premium Background Mesh - Adds depth and a "premium" feel using brand-primary 
                blurs that adapt based on the active theme. */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-linear-to-br from-blue-500/20 to-transparent blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-linear-to-tl from-blue-500/10 to-transparent blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="relative flex flex-col items-center justify-start pt-[calc(var(--header-total-height)+16px)]">
                {/* Main Animated Hub - Sync with Dashboard Orbit Container */}
                <div className="relative w-screen h-[400px] flex items-center justify-center">

                    {/* Central Logo Container - Sync size with CommunityOrbit (w-24 h-24) */}
                    <motion.div
                        className="relative w-24 h-24 flex items-center justify-center overflow-visible rounded-full bg-linear-to-br from-blue-500 to-blue-700 shadow-[0_0_50px_rgba(59,130,246,0.5)]"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Recursive Blue Glow Layers */}
                        <motion.div
                            className="absolute inset-0 rounded-full bg-blue-500/20 blur-[30px]"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <div className="absolute inset-4 rounded-full bg-blue-500/30 blur-[20px]" />

                        <motion.img
                            src={logoSrc}
                            alt="P2P Hub"
                            animate={{
                                scale: [1, 1.08, 1],
                                filter: [
                                    "brightness(0) invert(1) blur(0px)",
                                    "brightness(0) invert(1) blur(0.5px)",
                                    "brightness(0) invert(1) blur(0px)"
                                ]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="relative w-14 h-14 object-contain z-10 drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (!target.src.includes('raw.githubusercontent.com')) {
                                    target.src = 'https://raw.githubusercontent.com/VladislavBrodsky/P2PHub/main/frontend/public/logo.svg';
                                }
                            }}
                        />

                    </motion.div>
                </div>

                {/* Progress Text - Adjusted for new logo position */}
                <div className="flex flex-col items-center space-y-2 -mt-12">
                    <div className="flex items-baseline space-x-1">
                        <span className="text-3xl font-black text-(--color-text-primary) tracking-tighter tabular-nums">
                            {displayProgress}
                        </span>
                        <span className="text-sm font-bold text-blue-500 opacity-80">%</span>
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
                        <div className="w-12 h-0.5 rounded-full bg-slate-500/20 overflow-hidden mt-2">
                            <motion.div
                                className="h-full bg-blue-500"
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
                    <div className="h-px w-8 bg-linear-to-r from-transparent to-(--color-text-secondary)" />
                    <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-(--color-text-secondary)">
                        Advanced Ecosystem
                    </span>
                    <div className="h-px w-8 bg-linear-to-l from-transparent to-(--color-text-secondary)" />
                </div>
            </div>
        </div>
    );
};

