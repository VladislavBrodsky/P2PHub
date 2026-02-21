import React from 'react';
import { motion } from 'framer-motion';

interface ProPlusBadgeProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const ProPlusBadge: React.FC<ProPlusBadgeProps> = ({ className = '', size = 'md' }) => {
    const sizeClasses = {
        sm: 'px-1.5 py-0.5 text-[7px] gap-0.5 rounded-md',
        md: 'px-2 py-0.5 text-[8px] gap-1 rounded-lg',
        lg: 'px-3 py-1 text-[10px] gap-1.5 rounded-xl'
    };

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`
                relative flex items-center justify-center font-black uppercase tracking-tighter
                text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]
                overflow-hidden select-none
                ${sizeClasses[size]}
                ${className}
            `}
        >
            {/* Liquid Acid Gradient Background */}
            <motion.div
                animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute inset-0 bg-linear-to-r from-blue-600 via-cyan-400 to-blue-600 bg-size-[200%_auto] z-0"
            />

            {/* Moving Highlights / Liquid Effect */}
            <motion.div
                animate={{
                    x: ["-100%", "100%"],
                    opacity: [0, 0.5, 0]
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent skew-x-12 z-10"
            />

            {/* Content */}
            <span className="relative z-20 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                PRO+
            </span>

            {/* Extra Glow / Pulse */}
            <motion.div
                animate={{
                    opacity: [0.4, 0.7, 0.4],
                    scale: [1, 1.05, 1]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute inset-0 ring-1 ring-white/50 rounded-inherit z-30 pointer-events-none"
            />
        </motion.div>
    );
};
