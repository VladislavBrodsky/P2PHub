import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
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
                {/* Left: Avatar */}
                <div className="relative shrink-0">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: 2 }}
                        className={`${variant === 'compact' ? 'h-14 w-14 rounded-xl' : 'h-16 w-16 rounded-2xl'} overflow-hidden border-2 border-(--color-border-glass) bg-slate-900 shadow-premium transition-all duration-300 relative`}
                    >
                        {isUserLoading ? (
                            <div className="h-full w-full bg-slate-900 animate-pulse" />
                        ) : (
                            <img
                                src={user?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'partner'}`}
                                alt="Avatar"
                                className="h-full w-full object-cover"
                            />
                        )}
                    </motion.div>

                    {/* Level Badge Integrated into Avatar */}
                    <div className={`absolute -bottom-1 -right-1 flex ${variant === 'compact' ? 'h-5 w-5' : 'h-6 w-6'} items-center justify-center rounded-lg bg-blue-500 text-white shadow-premium ring-2 ring-(--color-bg-deep)`}>
                        <span className={`${variant === 'compact' ? 'text-[7px]' : 'text-[8px]'} font-black`}>{user?.level || 1}</span>
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
                        <motion.div
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-(--color-border-glass) shadow-premium backdrop-blur-xl relative overflow-hidden"
                            style={{
                                backgroundColor: `${currentRank.badgeColor}15`,
                                color: currentRank.badgeColor
                            }}
                        >
                            <div className="absolute inset-0 opacity-20 bg-linear-to-r from-transparent via-white to-transparent -translate-x-full animate-shimmer" />
                            <Sparkles className={`${variant === 'compact' ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} style={{ color: currentRank.badgeColor }} />
                            <span className={`${variant === 'compact' ? 'text-[7px]' : 'text-[8px]'} font-black uppercase tracking-widest leading-none`}>
                                {currentRank.name}
                            </span>
                        </motion.div>
                    </div>

                    {/* XP Progress Bar - Horizontal Fit */}
                    <div className="w-full space-y-1">
                        <div className="flex justify-between items-center px-0.5">
                            <span className="text-[8px] font-black text-(--color-text-secondary) tracking-widest uppercase">XP BALANCE</span>
                            <span className="text-[9px] font-black text-(--color-text-primary)">
                                {xpProgress.current} <span className="text-(--color-text-secondary) font-medium">/</span> {xpProgress.total}
                            </span>
                        </div>
                        <div className="h-2 w-full bg-slate-900/50 rounded-full overflow-hidden p-0.5 border border-white/5 backdrop-blur-sm shadow-inner relative">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${xpProgress.percent}%` }}
                                transition={{ duration: 1.5, ease: 'circOut' }}
                                className="h-full rounded-full shadow-sm relative overflow-hidden"
                                style={{ backgroundColor: currentRank.badgeColor }}
                            >
                                <motion.div
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent"
                                />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
