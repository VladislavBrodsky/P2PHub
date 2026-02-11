import * as React from 'react';
import { motion } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic';

interface NavButtonProps {
    active: boolean;
    onClick: () => void;
    onMouseEnter?: () => void;
    icon: React.ReactNode;
    label: string;
}

export const NavButton = ({ active, onClick, onMouseEnter, icon, label }: NavButtonProps) => {
    const { selection } = useHaptic();

    const handleClick = () => {
        selection();
        onClick();
    };

    return (
        <button
            onClick={handleClick}
            onMouseEnter={onMouseEnter}
            onPointerEnter={onMouseEnter}
            className={`relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 transition-all duration-300 active:scale-90 ${active
                ? 'text-(--nav-active)'
                : 'text-(--nav-inactive) hover:text-(--color-text-primary)'
                }`}
        >
            <div
                className={`transition-all duration-300 ${active ? '-translate-y-1 scale-110' : 'scale-100'}`}
            >
                {icon}
            </div>
            <span
                className={`text-[10px] font-bold tracking-tight leading-tight transition-all duration-300 ${active ? 'opacity-100' : 'opacity-80'}`}
            >
                {label}
            </span>
            {active && (
                <motion.div
                    layoutId="nav-dot"
                    className="bg-(--color-brand-blue) absolute bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            )}
        </button>
    );
};
