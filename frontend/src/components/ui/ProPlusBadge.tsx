import React from 'react';
import { motion } from 'framer-motion';

interface ProPlusBadgeProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const ProPlusBadge: React.FC<ProPlusBadgeProps> = ({ className = '', size = 'md' }) => {
    const sizeClasses = {
        sm: 'px-2 py-0.5 text-[8px] gap-0.5 rounded-lg border-[1px]',
        md: 'px-3 py-1 text-[10px] gap-1 rounded-xl border-[1.5px]',
        lg: 'px-4 py-1.5 text-[12px] gap-1.5 rounded-2xl border-[2px]'
    };

    return (
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`
                relative flex items-center justify-center font-black uppercase tracking-tighter
                shadow-[0_4px_20px_rgba(168,85,247,0.4),0_0_15px_rgba(234,179,8,0.2)]
                overflow-hidden select-none border-amber-400/50
                ${sizeClasses[size]}
                ${className}
            `}
        >
            {/* Deep Premium Gradient Background */}
            <motion.div
                animate={{
                    backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute inset-0 bg-linear-to-br from-[#1e1b4b] via-[#4c1d95] to-[#7e22ce] bg-size-[200%_200%] z-0"
            />

            {/* Ultra-Premium Glass Overlay */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] z-5" />

            {/* Shimmering Light Sweep */}
            <motion.div
                animate={{
                    x: ["-200%", "300%"],
                    opacity: [0, 1, 0]
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "linear"
                }}
                className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent -skew-x-30 z-10"
            />

            {/* Metallic Text Effect */}
            <span className="relative z-20 font-black italic tracking-widest bg-linear-to-b from-white via-slate-200 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                PRO+
            </span>

            {/* Golden Pulsing Glow Border */}
            <motion.div
                animate={{
                    opacity: [0.3, 0.7, 0.3],
                    boxShadow: [
                        "inset 0 0 5px rgba(251,191,36,0.3)",
                        "inset 0 0 12px rgba(251,191,36,0.6)",
                        "inset 0 0 5px rgba(251,191,36,0.3)"
                    ]
                }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-inherit z-15 pointer-events-none"
            />

            {/* Sparkle Effect */}
            <motion.div
                animate={{
                    opacity: [0, 1, 0],
                    scale: [0.5, 1.2, 0.5],
                    rotate: [0, 180, 360],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                }}
                className="absolute top-1 right-2 w-1 h-1 bg-white rounded-full blur-[1px] z-25"
            />
        </motion.div>
    );
};
