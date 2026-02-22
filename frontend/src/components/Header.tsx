import { m, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
// #comment: Removed unused ChevronDown and X icons from lucide-react to clean up the import list
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
    const { t } = useTranslation();
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
        <header className="fixed top-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg pt-[calc(env(safe-area-inset-top)+var(--spacing-telegram-header))] transition-all duration-300 pointer-events-none">
            <div className="flex flex-col gap-4 px-4 pointer-events-auto">
                {/* Navigation & Stats */}
                <div className="flex items-center justify-between gap-4">
                    <button
                        onClick={onOpenMenu}
                        className="group flex items-center gap-2 rounded-2xl border border-(--color-border-glass) bg-(--color-bg-glass) px-4 py-2 shadow-premium backdrop-blur-md transition-all active:scale-95 shrink-0"
                        aria-label="Open menu"
                    >
                        <Menu className="text-(--color-text-primary) h-5 w-5 transition-transform group-hover:scale-110" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-(--color-text-primary)">
                            {t('common.menu')}
                        </span>
                    </button>

                    <div className="flex-1" /> {/* Spacer */}

                    <m.button
                        animate={controls}
                        className="flex items-center gap-3 rounded-2xl border border-(--color-border-glass) bg-(--color-bg-glass) px-4 py-2 mr-1 shadow-premium backdrop-blur-2xl transition-all shrink-0"
                        aria-label="User stats"
                    >
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-(--color-text-secondary) dark:text-blue-400">{t('common.lvl')}</span>
                            <span className="text-sm font-black text-(--color-text-primary) leading-none">
                                {user?.level ?? 1}
                            </span>
                            {user?.is_pro && (
                                <Crown size={12} className="text-amber-500 fill-amber-500/20" />
                            )}
                        </div>
                        <div className="h-3 w-px bg-(--color-border-glass)" />
                        <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-black text-(--color-text-primary) leading-none">
                                {user?.xp ?? 0}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 dark:text-emerald-400">XP</span>
                        </div>
                    </m.button>
                </div>
            </div>
        </header>
    );
};
