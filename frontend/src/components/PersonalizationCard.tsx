import { motion } from 'framer-motion';
import { Sparkles, Crown } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { getRank, getXPProgress } from '../utils/ranking';

interface PersonalizationCardProps {
    className?: string;
    variant?: 'default' | 'compact';
}

export function PersonalizationCard({ className, variant = 'default' }: PersonalizationCardProps) {
    const { user, isLoading: isUserLoading } = useUser();

    const stats = user || {
        balance: 0,
        level: 1,
        xp: 0
    };

    const currentRank = getRank(stats.level || 1);
    const xpProgress = getXPProgress(stats.level || 1, stats.xp || 0);

    return (
        <div className={`relative ${className}`}>
            {/* Premium Background Glow */}
            <div className="absolute top-1/2 left-10 -translate-y-1/2 w-32 h-32 bg-brand-blue/10 blur-[60px] rounded-full -z-10" />

            <div className={`flex items-center gap-5 p-4 rounded-[2rem] bg-(--color-bg-surface)/40 backdrop-blur-md border border-(--color-border-glass) shadow-premium ${variant === 'compact' ? 'p-3 gap-4' : ''}`}>
                {/* Left: Avatar & Rank Badge Column */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="relative">
                        {/* Vibing Gold Crown for PRO Users - Moved outside overflow-hidden container to fix glitch */}
                        {user?.is_pro && (
                            <motion.div
                                initial={{ rotate: -15, y: 0 }}
                                animate={{
                                    rotate: [-15, 15, -15],
                                    y: [-2, 2, -2],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="absolute -top-3 -left-3 z-30 drop-shadow-[0_4px_12px_rgba(245,158,11,0.6)]"
                            >
                                <Crown
                                    size={variant === 'compact' ? 24 : 28}
                                    className="text-amber-400 fill-amber-400/20"
                                    strokeWidth={3}
                                />
                            </motion.div>
                        )}

                        <motion.div
                            whileHover={variant === 'compact' ? {} : { scale: 1.05, rotate: 2 }}
                            className={`${variant === 'compact' ? 'h-14 w-14 rounded-xl' : 'h-16 w-16 rounded-2xl'} overflow-hidden border-2 border-(--color-border-glass) bg-slate-900 shadow-premium transition-all duration-300 relative will-change-transform z-10`}
                        >
                            {isUserLoading ? (
                                <div className="h-full w-full bg-slate-900 animate-pulse" />
                            ) : (
                                <img
                                    src={user?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'partner'}`}
                                    alt="Avatar"
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                    width={variant === 'compact' ? 56 : 64}
                                    height={variant === 'compact' ? 56 : 64}
                                />
                            )}
                        </motion.div>

                        {/* Level Badge Integrated into Avatar */}
                        <div className={`absolute -bottom-1 -right-1 flex ${variant === 'compact' ? 'h-5 w-5' : 'h-6 w-6'} items-center justify-center rounded-lg bg-blue-500 text-white shadow-premium ring-2 ring-(--color-bg-deep) z-20`}>
                            <span className={`${variant === 'compact' ? 'text-[7px]' : 'text-[8px]'} font-black`}>{user?.level || 1}</span>
                        </div>
                    </div>
                </div>

                {/* Right: Stats Vertical Stack */}
                <div className="flex flex-col items-start gap-1 flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                        {(() => {
                            const firstName = user?.first_name || 'Partner';
                            const lastName = user?.last_name || '';
                            const fullName = `${firstName} ${lastName}`.trim();
                            const displayName = fullName.length > 20 ? firstName : fullName;

                            return (
                                <h2 className={`${variant === 'compact' ? 'text-base' : 'text-lg'} font-black tracking-tight text-(--color-text-primary) truncate`}>
                                    Hi, {displayName}!
                                </h2>
                            );
                        })()}
                    </div>

                    {/* XP Progress Bar - Horizontal Fit */}
                    <div className="w-full space-y-1">
                        <div className="flex justify-between items-baseline px-0.5">
                            <motion.div
                                animate={{
                                    scale: [1, 1.05, 1],
                                    filter: ['drop-shadow(0 0 0px transparent)', 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.4))', 'drop-shadow(0 0 0px transparent)']
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="flex items-baseline gap-1"
                            >
                                <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 tracking-tight uppercase">Total:</span>
                                <span className="text-[9px] font-bold text-blue-500 dark:text-blue-300">{stats.xp} XP</span>
                            </motion.div>
                            <span className="text-[9px] font-black text-(--color-text-primary)">
                                {xpProgress.current}<span className="text-(--color-text-secondary) font-medium mx-0.5">/</span>{xpProgress.total} <span className="text-[7px] text-(--color-text-secondary) uppercase ml-0.5 whitespace-nowrap">NEXT LVL</span>
                            </span>
                        </div>
                        <div className="h-3 w-full bg-slate-900/10 dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-black/5 dark:border-white/5 shadow-inner relative">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${xpProgress.percent}%` }}
                                transition={{ duration: 1.5, ease: 'circOut' }}
                                className="h-full rounded-full relative overflow-hidden"
                                style={{
                                    backgroundColor: currentRank.badgeColor,
                                    boxShadow: `0 0 12px ${currentRank.badgeColor}60`
                                }}
                            >
                                <div className="absolute inset-0 bg-linear-to-b from-white/30 to-transparent" />
                                <motion.div
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/50 to-transparent"
                                />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
