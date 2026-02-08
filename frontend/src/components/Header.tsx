import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { getRank } from '../utils/ranking';

interface HeaderProps {
    onOpenMenu: () => void;
}

export const Header = ({ onOpenMenu }: HeaderProps) => {
    const { user } = useUser();
    const currentRank = getRank(user?.level || 1);

    return (
        <header
            className="fixed left-1/2 z-50 w-full max-w-lg -translate-x-1/2 pt-[calc(env(safe-area-inset-top)+var(--spacing-telegram-header)+8px)] transition-all duration-300 top-0 pointer-events-none"
        >
            <div className="flex h-14 items-center justify-between px-4 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] pointer-events-auto">
                <button
                    onClick={onOpenMenu}
                    className="group -ml-1 rounded-2xl transition-all hover:bg-slate-100/50 active:scale-95"
                >
                    <div className="flex items-center gap-2 rounded-2xl border border-(--color-border-glass) bg-(--color-bg-surface)/80 dark:bg-slate-900/50 px-3 py-1.5 shadow-premium backdrop-blur-md transition-colors">
                        <MoreHorizontal className="text-(--color-text-primary) h-5 w-5 transition-transform group-hover:scale-110" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-(--color-text-primary) pr-0.5">
                            Menu
                        </span>
                    </div>
                </button>

                <div className="flex items-center gap-3 rounded-xl border border-(--color-border-glass) bg-(--color-bg-surface)/80 dark:bg-slate-900/50 px-3 py-1.5 shadow-premium backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-black uppercase tracking-tight text-(--color-text-secondary)">Lvl</span>
                            <span className="text-[11px] font-black" style={{ color: currentRank.badgeColor }}>
                                {user?.level || 1}
                            </span>
                        </div>
                        <div className="w-px h-3 bg-white/10" />
                        <div className="flex items-center gap-1">
                            <span className="text-[11px] font-black text-(--color-text-primary)">
                                {user?.xp || 0}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-tight text-(--color-text-secondary)">XP</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
