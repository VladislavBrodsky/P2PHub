import { m, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import { Menu, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';

// #comment: Header.tsx - Fixed top navigation bar.
// Uses left-1/2 -translate-x-1/2 for precise centering of the fixed container.
// The pointer-events-none on the header and pointer-events-auto on the inner div
// allow clicking through the spacer areas to interact with background orbits.

interface HeaderProps {
    onOpenMenu: () => void;
}

export const Header = ({ onOpenMenu }: HeaderProps) => {
    const { t } = useTranslation('common');
    const { user } = useUser();
    const controls = useAnimation();

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        const triggerAnimation = () => {
            const delay = 5000 + Math.random() * 10000;
            timeoutId = setTimeout(async () => {
                await controls.start({
                    scale: [1, 1.05, 0.95, 1.02, 1],
                    borderColor: ["var(--color-border-glass)", "rgba(59, 130, 246, 0.5)", "var(--color-border-glass)"],
                    boxShadow: [
                        "var(--shadow-premium)",
                        "0 0 20px 2px rgba(59, 130, 246, 0.4), var(--shadow-premium)",
                        "var(--shadow-premium)"
                    ],
                    transition: { duration: 0.8, ease: "easeInOut" }
                });
                triggerAnimation();
            }, delay);
        };
        triggerAnimation();
        return () => clearTimeout(timeoutId);
    }, [controls]);

    return (
        <header
            className="fixed top-0 left-0 right-0 z-120 w-full flex justify-center transition-all duration-300 pointer-events-none"
            style={{ paddingTop: 'calc(var(--spacing-safe-top, 24px) + 44px)' }}
        >
            <div className="w-full max-w-lg flex flex-col gap-4 px-4 pointer-events-auto relative z-10">
                {/* Navigation & Stats - Contained within a centered glass bar */}
                <div className="w-full flex items-center justify-between gap-3 mx-auto relative">
                    <button
                        onClick={onOpenMenu}
                        className="group flex items-center gap-1.5 rounded-full border border-border-glass bg-white dark:bg-bg-glass/90 px-3 py-1 shadow-premium backdrop-blur-md transition-all active:scale-95 shrink-0 hover:border-blue-500/30"
                        aria-label="Open menu"
                    >
                        <Menu className="text-text-primary h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                        <span className="text-label font-bold uppercase tracking-[0.2em] text-text-primary">
                            {t('menu')}
                        </span>
                    </button>

                    <div className="flex-1" /> {/* Spacer */}

                    <m.button
                        animate={controls}
                        className="flex items-center gap-2 rounded-2xl border border-border-glass bg-bg-glass px-2.5 py-1 shadow-premium backdrop-blur-2xl transition-all shrink-0"
                        aria-label="User stats"
                    >
                        <div className="flex items-center gap-1">
                            <span className="text-label font-bold uppercase tracking-wider text-text-secondary dark:text-blue-400">{t('lvl')}</span>
                            <span className="text-caption font-bold text-text-primary leading-none">
                                {user?.level ?? 1}
                            </span>
                            {user?.is_pro && (
                                <Crown size={12} className="text-amber-500 fill-amber-500/20" />
                            )}
                        </div>
                        <div className="h-3 w-px bg-border-glass" />
                        <div className="flex items-center gap-1">
                            <span className="text-caption font-bold text-text-primary leading-none">
                                {Math.floor(user?.xp ?? 0).toLocaleString()}
                            </span>
                            <span className="text-label font-bold uppercase tracking-wider text-success dark:text-emerald-400">XP</span>
                        </div>
                    </m.button>
                </div>
            </div>
        </header>
    );
};
