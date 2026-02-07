import { motion } from 'framer-motion';
import { CommunityOrbit } from '../components/Marketing/CommunityOrbit';
import { Ticker } from '../components/Marketing/Ticker';
import { useHaptic } from '../hooks/useHaptic';
import { Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { getRank, getXPProgress } from '../utils/ranking';

export default function Dashboard() {
    const { selection } = useHaptic();
    const { user, isLoading: isUserLoading } = useUser();

    const stats = user || {
        balance: 0,
        level: 1,
        xp: 0
    };

    const currentRank = getRank(stats.level || 1);
    const xpProgress = getXPProgress(stats.level || 1, stats.xp || 0);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
    };

    return (
        <motion.div
            className="flex w-full flex-col gap-8 pb-32 px-0 min-h-[100dvh]"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* 0. Personalization Section - Centered & Premium & Compact */}
            <motion.div variants={item} className="px-6 pt-2 relative">
                {/* Premium Background Glow */}
                <div className="absolute top-1/2 left-10 -translate-y-1/2 w-32 h-32 bg-[var(--color-brand-blue)]/10 blur-[60px] rounded-full -z-10" />

                <div className="flex items-center gap-5 p-4 rounded-[2rem] bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
                    {/* Left: Avatar */}
                    <div className="relative shrink-0">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 2 }}
                            className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-soft transition-all duration-300"
                        >
                            {isUserLoading ? (
                                <div className="h-full w-full bg-slate-100 animate-pulse" />
                            ) : (
                                <img
                                    src={user?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'partner'}`}
                                    alt="Avatar"
                                    className="h-full w-full object-cover"
                                />
                            )}
                        </motion.div>

                        {/* Level Badge Integrated into Avatar */}
                        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--color-brand-blue)] text-white shadow-premium ring-2 ring-white">
                            <span className="text-[8px] font-black">{user?.level || 1}</span>
                        </div>
                    </div>

                    {/* Right: Stats Vertical Stack */}
                    <div className="flex flex-col items-start gap-1 flex-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-black tracking-tight text-[var(--color-text-primary)] truncate">
                                Hi, {user?.first_name || 'Partner'}!
                            </h2>
                            {/* Compact Rank Badge */}
                            <motion.div
                                className="flex items-center gap-1 px-2 py-0.5 rounded-lg border shadow-sm backdrop-blur-xl"
                                style={{
                                    backgroundColor: `${currentRank.badgeColor}08`,
                                    borderColor: `${currentRank.badgeColor}20`,
                                    color: currentRank.badgeColor
                                }}
                            >
                                <Sparkles className="h-3 w-3" style={{ color: currentRank.badgeColor }} />
                                <span className="text-[8px] font-black uppercase tracking-widest leading-none">
                                    {currentRank.name}
                                </span>
                            </motion.div>
                        </div>

                        {/* XP Progress Bar - Horizontal Fit */}
                        <div className="w-full space-y-1">
                            <div className="flex justify-between items-center px-0.5">
                                <span className="text-[8px] font-black text-slate-400/70 tracking-widest uppercase">XP BALANCE</span>
                                <span className="text-[9px] font-black text-[var(--color-text-primary)]">
                                    {xpProgress.current} <span className="text-slate-300 font-medium">/</span> {xpProgress.total}
                                </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100/50 rounded-full overflow-hidden p-0.5 border border-slate-200/40 backdrop-blur-sm shadow-inner relative">
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
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                    />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 1. Hero Section - Seamless Integration */}
            <motion.div variants={item} className="px-4 space-y-4">
                <div className="relative overflow-visible">
                    <CommunityOrbit />
                </div>

                <div className="text-center space-y-8 px-2">
                    <div className="space-y-2">
                        <motion.div
                            className="inline-block mb-2 rounded-full border border-blue-500/30 bg-blue-500/5 backdrop-blur-sm px-4 py-1.5"
                            animate={{
                                boxShadow: ["0 0 0px rgba(59, 130, 246, 0)", "0 0 15px rgba(59, 130, 246, 0.4)", "0 0 0px rgba(59, 130, 246, 0)"],
                                borderColor: ["rgba(59, 130, 246, 0.3)", "rgba(59, 130, 246, 0.8)", "rgba(59, 130, 246, 0.3)"]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-brand-blue)]">
                                Our Mission
                            </p>
                        </motion.div>
                        <h1 className="text-4xl font-extrabold tracking-tighter text-[var(--color-text-primary)] leading-[1.1]">
                            Together,<br />
                            Let's Build a Brand<br />
                            <span className="text-[var(--color-brand-blue)]">That Truly Connects</span>
                        </h1>
                    </div>

                    {/* Ticker moved here with padding */}
                    <motion.div variants={item} className="-rotate-1 py-8 scale-[1.05]">
                        <Ticker />
                    </motion.div>

                    <div className="space-y-6">
                        <div className="space-y-1 px-4">
                            <h2 className="text-xl font-black text-[var(--color-text-secondary)] tracking-tight leading-tight max-w-[320px] mx-auto">
                                Join the Global Financial Shift and <br />
                                <motion.span
                                    className="inline-block uppercase tracking-[0.15em] mt-2 font-black text-2xl"
                                    style={{
                                        background: 'linear-gradient(to right, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundSize: '200% auto'
                                    }}
                                    animate={{
                                        backgroundPosition: ['0% center', '200% center']
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "linear"
                                    }}
                                >
                                    Digital Gold Rush
                                </motion.span>
                            </h2>
                        </div>

                        <p className="text-[var(--color-text-secondary)] mx-auto max-w-[340px] text-xs font-medium leading-relaxed opacity-80 px-4">
                            The global market is shifting. Traditional finance is slow, closed, and filled with friction. <strong className="text-[var(--color-text-primary)] font-bold">Pintopay</strong> is the bridge to a borderless era. We're not just building an app; we're launching a movement.
                        </p>
                    </div>
                </div>
            </motion.div>


        </motion.div>
    );
}

