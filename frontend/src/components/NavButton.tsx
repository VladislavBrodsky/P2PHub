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
                ? 'text-blue-500'
                : 'text-nav-inactive hover:text-nav-active'
                }`}
            aria-label={label}
        >
            {/* Active background pill */}
            <AnimatePresence>
                {active && (
                    <m.div
                        layoutId="nav-active-pill"
                        className="absolute inset-x-1 top-1.5 bottom-1.5 rounded-2xl bg-blue-500/10 border border-blue-500/20"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                )}
            </AnimatePresence>

            {/* Icon with lift animation */}
            <m.div
                animate={active ? { y: -1, scale: 1.15 } : { y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="relative z-10"
            >
                {icon}
                {/* Glow behind icon when active */}
                {active && (
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 blur-md bg-blue-500/40 -z-10 rounded-full scale-150"
                    />
                )}
            </m.div>

            {/* Label */}
            <m.span
                animate={active ? { opacity: 1, y: 0 } : { opacity: 0.6, y: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[9px] font-black tracking-tight leading-tight relative z-10"
            >
                {label}
            </m.span>
        </button>
    );
};
