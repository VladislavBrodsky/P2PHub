import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import { MoreHorizontal, ChevronDown, X, Crown } from 'lucide-react';
import { useUser } from '../context/UserContext';

interface HeaderProps {
    onOpenMenu: () => void;
}

export const Header = ({ onOpenMenu }: HeaderProps) => {
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
        <header className="fixed left-1/2 z-50 w-full max-w-lg -translate-x-1/2 pt-[calc(env(safe-area-inset-top)+var(--spacing-telegram-header))] transition-all duration-300 top-0 pointer-events-none">
            <div className="flex flex-col gap-4 px-4 pointer-events-auto">
                {/* Navigation & Stats */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={onOpenMenu}
                        className="group flex items-center gap-2 rounded-2xl border border-slate-200/50 bg-white/80 dark:bg-slate-900/50 px-4 py-2 shadow-premium backdrop-blur-md transition-all active:scale-95"
                    >
                        <MoreHorizontal className="text-slate-900 h-5 w-5 dark:text-white transition-transform group-hover:scale-110" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">
                            Menu
                        </span>
                    </button>

                    <motion.button
                        animate={controls}
                        className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/90 dark:bg-[#0f172a] px-4 py-2 shadow-premium backdrop-blur-2xl transition-all"
                    >
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-blue-400">Lvl</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white leading-none">
                                {user?.level ?? 2}
                            </span>
                            {user?.is_pro && (
                                <Crown size={12} className="text-amber-500 fill-amber-500/20" />
                            )}
                        </div>
                        <div className="h-3 w-px bg-slate-200 dark:bg-white/10" />
                        <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-black text-slate-900 dark:text-white leading-none">
                                {user?.xp ?? 200}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 dark:text-emerald-400">XP</span>
                        </div>
                    </motion.button>
                </div>
            </div>
        </header>
    );
};
