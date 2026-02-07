import * as React from 'react';
import { Menu } from 'lucide-react';
import { useUser } from '../context/UserContext';

interface HeaderProps {
    onOpenMenu: () => void;
}

export const Header = ({ onOpenMenu }: HeaderProps) => {
    const { user } = useUser();

    return (
        <header
            className="fixed left-1/2 z-50 w-full max-w-lg -translate-x-1/2 border-b border-[var(--color-brand-border)] bg-[var(--color-bg-glass)] pt-[calc(env(safe-area-inset-top)+var(--spacing-telegram-header))] backdrop-blur-2xl transition-all duration-300 top-0"
        >
            <div className="flex h-14 items-center justify-between px-4 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))]">
                <button
                    onClick={onOpenMenu}
                    className="group -ml-2 rounded-xl p-2 transition-all hover:bg-[var(--color-bg-glass)] active:scale-95"
                >
                    <div className="rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-bg)] p-1.5 shadow-sm">
                        <Menu className="text-[var(--color-text-primary)] h-5 w-5 transition-transform group-hover:scale-110" />
                    </div>
                </button>

                <div className="flex items-center gap-2 rounded-full border border-[var(--color-brand-border)] bg-[var(--color-brand-bg)] px-2 py-1 pl-2.5 shadow-sm">
                    <div className="flex flex-col items-end">
                        <span className="text-[var(--color-text-primary)] whitespace-nowrap text-xs font-bold leading-tight tracking-tight">
                            {user?.first_name || 'Partner'}
                        </span>
                        <div className="text-emerald-500 flex items-center gap-1">
                            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                                Verified
                            </span>
                            <svg
                                width="10"
                                height="10"
                                className="h-2.5 w-2.5"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div
                        className="h-8 w-8 overflow-hidden rounded-full border-2 border-[var(--color-brand-bg)] shadow-sm ring-1 ring-[var(--color-brand-border)]"
                        style={{ width: '32px', height: '32px', minWidth: '32px' }}
                    >
                        <img
                            src={user?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'partner'}`}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};
