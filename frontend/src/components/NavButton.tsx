import { m, AnimatePresence } from 'framer-motion';
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
            className={`relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 transition-colors duration-200 active:scale-90 ${active
                ? 'text-brand-blue'
                : 'text-text-secondary hover:text-text-primary'
                }`}
            aria-label={label}
        >


            {/* Icon with lift animation */}
            <m.div
                animate={active ? { y: -1, scale: 1.15 } : { y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="relative z-10"
            >
                {icon}

            </m.div>

            {/* Label */}
            <m.span
                animate={active ? { opacity: 1, y: 0 } : { opacity: 0.6, y: 0 }}
                transition={{ duration: 0.2 }}
                className="text-label font-bold tracking-tight leading-tight relative z-10"
            >
                {label}
            </m.span>
        </button>
    );
};
