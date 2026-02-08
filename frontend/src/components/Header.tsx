import { motion, useAnimation } from 'framer-motion';
import * as React from 'react';
import { useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { getRank } from '../utils/ranking';

interface HeaderProps {
    onOpenMenu: () => void;
}

export const Header = ({ onOpenMenu }: HeaderProps) => {
    const { user } = useUser();
    const currentRank = getRank(user?.level || 1);
    const controls = useAnimation();

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;

        const triggerAnimation = () => {
            // Random delay between 5s and 15s to grab attention periodically
            const delay = 5000 + Math.random() * 10000;

            timeoutId = setTimeout(async () => {
                await controls.start({
                    scale: [1, 1.05, 0.95, 1.02, 1],
                    borderColor: [
                        "var(--color-border-glass)",
                        "rgba(59, 130, 246, 0.5)",
                        "var(--color-border-glass)"
                    ],
                    boxShadow: [
                        "0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 5px 15px -5px rgba(0, 0, 0, 0.02)", // shadow-premium
                        "0 0 20px 2px rgba(59, 130, 246, 0.4), 0 10px 30px -5px rgba(0, 0, 0, 0.04)", // Blue Glow
                        "0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 5px 15px -5px rgba(0, 0, 0, 0.02)"
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

                <motion.button
                    animate={controls}
                    whileHover={{ scale: 1.05, borderColor: "rgba(59, 130, 246, 0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => console.log("Navigate to Levels/Rewards")}
                    className="group relative pointer-events-auto z-50 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 dark:bg-[#0f172a] px-3 py-1.5 shadow-premium backdrop-blur-2xl transition-all hover:bg-slate-50/10 dark:hover:bg-slate-800 cursor-pointer overflow-hidden"
                >
                    {/* Ambient Glow */}
                    <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative z-10 flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-blue-400 group-hover:text-blue-500 transition-colors">Lvl</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white dark:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                                {user?.level || 5}
                            </span>
                        </div>

                        {/* Divider */}
                        <div className="h-3 w-px bg-slate-200 dark:bg-white/10" />

                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-white">
                                {user?.xp || 150}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500 dark:text-emerald-400">XP</span>
                        </div>
                    </div>
                </motion.button>
            </div>
        </header >
    );
};
