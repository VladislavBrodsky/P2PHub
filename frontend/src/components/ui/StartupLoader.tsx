import React, { useEffect, useState } from 'react'; // Refined 12:25 PM
import { LOGO_DATA } from '../../data/avatars';
// #comment: Removed unused AnimatePresence and motion from framer-motion to simplify imports
// and ensure StartupLoader doesn't block on heavy animation libraries.

interface StartupLoaderProps {
    progress: number;
    statusText?: string;
}

export const StartupLoader: React.FC<StartupLoaderProps> = ({ progress, statusText = 'Initializing P2P Hub' }) => {
    // Use the relative path directly to ensure it loads from the same origin (fastest)
    const logoSrc = LOGO_DATA;
    const [displayProgress, setDisplayProgress] = useState(0);

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
            className="fixed inset-0 z-100 flex flex-col items-center justify-start bg-bg-app pt-[calc(var(--header-total-height)+144px)] transition-colors duration-500 overflow-hidden"
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

            <div className="relative flex flex-col items-center justify-start scale-90">
                {/* Main Animated Hub */}
                <div className="relative w-40 h-40 flex items-center justify-center">
                    {/* Rotating Conic Border - The "Apple" loading feel */}
                    <div
                        className="absolute inset-2 rounded-full border border-transparent blur-px animate-spin"
                        style={{
                            background: 'conic-gradient(from 0deg, transparent 0%, var(--color-brand-blue) 50%, transparent 100%) border-box',
                            mask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                            maskComposite: 'destination-out',
                            WebkitMaskComposite: 'destination-out',
                            animationDuration: '2.2s'
                        }}
                    />

                    {/* Central Logo Disk - "Vibing" scale effect */}
                    <div
                        className="relative w-24 h-24 flex items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-700 shadow-[0_0_50px_rgba(59,130,246,0.4)] animate-pulse"
                    >
                        <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-xl" />

                        {/* Logo - Pulsing with "vibe" */}
                        <img
                            src={logoSrc}
                            alt="Pintopay"
                            loading="eager"
                            className="relative w-12 h-12 object-contain z-10 drop-shadow-[0_4px_10px_rgba(0,0,0,0.15)] animate-bounce-slow"
                        />
                    </div>
                </div>

                {/* Progress Text - Compacted */}
                <div className="mt-6 flex flex-col items-center space-y-4">
                    <div className="relative group">
                        <div className="flex items-baseline space-x-1 relative">
                            <span className="text-4xl font-bold text-text-primary tracking-tighter tabular-nums drop-shadow-sm">
                                {displayProgress}
                            </span>
                            <span className="text-lg font-bold text-blue-500">%</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center space-y-4">
                        {/* Status Badge - Matching user screenshot exactly */}
                        <div className="relative bg-blue-500/10 backdrop-blur-sm border border-blue-500/10 rounded-lg px-5 py-1.5 overflow-hidden min-w-[140px] flex justify-center">
                            <div className="relative z-10">
                                <p className="text-text-primary font-bold tracking-[0.2em] uppercase text-label opacity-80">
                                    {statusText.toUpperCase() === 'INITIALIZING P2P HUB' ? 'USER VERIFIED' : statusText.toUpperCase()}
                                </p>
                            </div>
                            {/* Scanning Light Beam */}
                            <div
                                className="absolute inset-0 bg-linear-to-r from-transparent via-blue-400/10 to-transparent z-0 animate-scan"
                            />
                        </div>

                        {/* Status Indicator Bar */}
                        <div className="w-20 h-1 rounded-full bg-slate-500/10 overflow-hidden relative shadow-inner">
                            <div
                                className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500"
                                style={{ width: `${displayProgress}%` }}
                            />
                        </div>
                    </div>
                </div>

            </div>

            {/* Bottom Branding - Ultra Minimal */}
            <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center">
                <div
                    className="flex items-center space-x-4 opacity-40 animate-fade-in-up"
                    style={{ animationDelay: '0.5s' }}
                >
                    <div className="h-px w-10 bg-linear-to-r from-transparent to-text-secondary" />
                    <span className="text-label font-bold tracking-[0.5em] uppercase text-text-secondary whitespace-nowrap">
                        Advanced Ecosystem
                    </span>
                    <div className="h-px w-10 bg-linear-to-l from-transparent to-text-secondary" />
                </div>
            </div>
        </div>
    );
};

