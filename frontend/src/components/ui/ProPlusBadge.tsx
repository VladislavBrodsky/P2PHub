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
                text-white shadow-[0_0_20px_rgba(59,130,246,0.6)]
                overflow-hidden select-none border border-white/40
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
                    duration: 3, // Faster liquid flow
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute inset-0 bg-linear-to-r from-blue-700 via-cyan-400 to-indigo-600 bg-size-[200%_auto] z-0"
            />

            {/* Moving Highlights / Liquid Effect */}
            <motion.div
                animate={{
                    x: ["-100%", "200%"],
                    opacity: [0, 0.6, 0]
                }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute inset-0 bg-linear-to-r from-transparent via-white/60 to-transparent -skew-x-20 z-10"
            />

            {/* Content */}
            <span className="relative z-20 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] font-black italic">
                PRO+
            </span>

            {/* Extra Glow / Pulse */}
            <motion.div
                animate={{
                    boxShadow: [
                        "0 0 10px rgba(59,130,246,0.4)",
                        "0 0 20px rgba(34,211,238,0.7)",
                        "0 0 10px rgba(59,130,246,0.4)"
                    ]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-inherit z-30 pointer-events-none"
            />
        </motion.div>
    );
};
