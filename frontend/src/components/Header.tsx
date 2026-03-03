import { m } from 'framer-motion';
import { Menu, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';
import { usePerformance } from '../hooks/usePerformance';
import { cn } from '../lib/utils';

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
    const { lowPowerMode } = usePerformance();

    return (
        <header
            className="fixed top-0 left-0 right-0 z-120 w-full flex justify-center transition-all duration-300 pointer-events-none"
            style={{
                paddingTop: 'var(--dynamic-header-padding, 106px)',
                paddingLeft: 'var(--spacing-safe-left, 0px)',
                paddingRight: 'var(--spacing-safe-right, 0px)'
            }}
        >
            <div className="w-full max-w-lg flex flex-col gap-4 px-4 pointer-events-auto relative z-10">
                {/* Navigation & Stats - Contained within a centered glass bar */}
                <div className="w-full flex items-center justify-between gap-2 sm:gap-3 mx-auto relative">
                    <button
                        onClick={onOpenMenu}
                        className="group flex items-center gap-1.5 sm:gap-2 rounded-full border border-border-glass bg-white dark:bg-bg-glass/90 px-3 sm:px-4 py-1.5 shadow-premium backdrop-blur-md transition-all active:scale-95 shrink-0 hover:border-blue-500/30"
                        aria-label="Open menu"
                    >
                        <Menu className="text-text-primary h-[18px] w-[18px] sm:h-[20px] sm:w-[20px] transition-transform group-hover:scale-110" />
                        <span className="text-[10px] sm:text-[13px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-text-primary">
                            {t('menu')}
                        </span>
                    </button>

                    <div className="flex-1" /> {/* Spacer */}

                    <button
                        className={cn(
                            "flex items-center gap-2 sm:gap-2.5 rounded-2xl border border-border-glass bg-bg-glass px-2.5 sm:px-3 py-1.5 shadow-premium backdrop-blur-2xl transition-all shrink-0 mr-1 sm:mr-0",
                            "animate-header-pulse"
                        )}
                        aria-label="User stats"
                    >
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] sm:text-label font-bold uppercase tracking-wider text-text-secondary dark:text-blue-400">{t('lvl')}</span>
                            <span className="text-[14px] sm:text-caption font-bold text-text-primary leading-none">
                                {user?.level ?? 1}
                            </span>
                            {user?.is_pro && (
                                <Crown size={5} className="sm:size-6 text-amber-500 fill-amber-500/20" />
                            )}
                        </div>
                        <div className="h-4 w-px bg-border-glass" />
                        <div className="flex items-center gap-1.5">
                            <span className="text-[14px] sm:text-caption font-bold text-text-primary leading-none">
                                {Math.floor(user?.xp ?? 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] sm:text-label font-bold uppercase tracking-wider text-success dark:text-emerald-400">{t('xp')}</span>
                        </div>
                    </button>
                </div>
            </div>
        </header >
    );
};
