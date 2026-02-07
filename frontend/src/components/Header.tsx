import * as React from 'react';
import { MoreHorizontal, Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';

interface HeaderProps {
    onOpenMenu: () => void;
}

export const Header = ({ onOpenMenu }: HeaderProps) => {
    const { user } = useUser();

    return (
        <header
            className="fixed left-1/2 z-50 w-full max-w-lg -translate-x-1/2 pt-[calc(env(safe-area-inset-top)+var(--spacing-telegram-header)+8px)] transition-all duration-300 top-0 pointer-events-none"
        >
            <div className="flex h-14 items-center justify-between px-4 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] pointer-events-auto">
                <button
                    onClick={onOpenMenu}
                    className="group -ml-1 rounded-2xl transition-all hover:bg-slate-100/50 active:scale-95"
                >
                    <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-brand-border)] bg-white px-3 py-1.5 shadow-sm">
                        <MoreHorizontal className="text-[var(--color-text-primary)] h-5 w-5 transition-transform group-hover:scale-110" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-primary)] pr-0.5">
                            Menu
                        </span>
                    </div>
                </button>

                <div className="flex items-center gap-2 rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-1.5 shadow-sm">
                    <div className="text-[var(--color-success)] flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {user?.level && user.level > 10 ? 'Elite' : 'Verified'}
                        </span>
                        <Sparkles className="h-3 w-3 fill-current" />
                    </div>
                </div>
            </div>
        </header>
    );
};
