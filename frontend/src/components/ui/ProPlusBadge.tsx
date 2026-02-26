import React from 'react';
import { motion } from 'framer-motion';

interface ProBadgeProps {
    className?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    variant?: 'pro' | 'pro-plus';
}

export const ProBadge: React.FC<ProBadgeProps> = ({ className = '', size = 'md', variant = 'pro-plus' }) => {
    const isPlus = variant === 'pro-plus';

    const sizeClasses = {
        xs: 'px-1.5 py-0.5 text-[7px] gap-0 rounded-[4px] border-[0.5px]',
        sm: 'px-2 py-0.5 text-[8px] gap-0.5 rounded-lg border-[1px]',
        md: 'px-3 py-1 text-[10px] gap-1 rounded-xl border-[1.5px]',
        lg: 'px-4 py-1.5 text-caption gap-1.5 rounded-2xl border-[2px]'
    };

    const colors = isPlus ? {
        border: 'border-amber-400/50',
        glow: 'shadow-[0_4px_20px_rgba(168,85,247,0.4),0_0_15px_rgba(234,179,8,0.2)]',
        bg: 'from-[#1e1b4b] via-[#4c1d95] to-[#7e22ce]',
        text: 'from-white via-slate-200 to-amber-200',
        innerGlow: 'rgba(251,191,36,0.3)',
        innerGlowActive: 'rgba(251,191,36,0.6)'
    } : {
        border: 'border-amber-400/60',
        glow: 'shadow-[0_4px_15px_rgba(234,179,8,0.4),0_0_10px_rgba(251,191,36,0.2)]',
        bg: 'from-[#78350f] via-[#b45309] to-[#d97706]',
        text: 'from-white via-yellow-100 to-amber-300',
        innerGlow: 'rgba(252,211,77,0.3)',
        innerGlowActive: 'rgba(252,211,77,0.6)'
    };

    return (
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`
                relative flex items-center justify-center font-bold uppercase tracking-tighter
                overflow-hidden select-none
                ${colors.border}
                ${colors.glow}
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
                className={`absolute inset-0 bg-linear-to-br ${colors.bg} bg-size-[200%_200%] z-0`}
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
            <span className={`relative z-20 font-bold italic tracking-widest bg-linear-to-b ${colors.text} bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`}>
                {isPlus ? 'PRO+' : 'PRO'}
            </span>

            {/* Golden Pulsing Glow Border */}
            <motion.div
                animate={{
                    opacity: [0.3, 0.7, 0.3],
                    boxShadow: [
                        `inset 0 0 5px ${colors.innerGlow}`,
                        `inset 0 0 12px ${colors.innerGlowActive}`,
                        `inset 0 0 5px ${colors.innerGlow}`
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

// Maintain compatibility with existing code
export const ProPlusBadge: React.FC<ProBadgeProps> = (props) => (
    <ProBadge {...props} variant="pro-plus" />
);
