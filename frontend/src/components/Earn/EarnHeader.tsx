import { motion } from 'framer-motion';
import { Trophy, Star, Zap } from 'lucide-react';
import { getRank, getXPProgress } from '../../utils/ranking';
import { useUser } from '../../context/UserContext';

export const EarnHeader = () => {
    const { user } = useUser();

    // Fallback or use real user data
    const level = user?.level || 1;
    const xp = user?.xp || 0;
    const rank = getRank(level);
    const progress = getXPProgress(level, xp);

    return (
        <section className="mb-8 relative overflow-hidden rounded-[2.5rem] glass-panel border-white/10 p-1 shadow-2xl">
            {/* Immersive Mesh Background */}
            <div className="absolute inset-0 bg-linear-to-br from-blue-600/10 via-purple-600/5 to-transparent pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full animate-pulse pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full animate-pulse delay-1000 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-6 bg-white/[0.02] backdrop-blur-3xl rounded-[2.3rem] p-6 border border-white/5">

                {/* Level Circle - Quantum Design */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                    {/* Outer Glow Ring */}
                    <div className="absolute inset-0 rounded-full border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.1)] active:scale-95 transition-transform duration-500" />

                    {/* Progress Ring Background */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 scale-95 opacity-50">
                        <circle
                            cx="72"
                            cy="72"
                            r="64"
                            fill="none"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="10"
                        />
                        {/* Progress Ring Value with Glow */}
                        <motion.circle
                            cx="72"
                            cy="72"
                            r="64"
                            fill="none"
                            stroke={rank.badgeColor}
                            strokeWidth="10"
                            strokeDasharray="402"
                            strokeDashoffset={402 - (402 * progress.percent) / 100}
                            strokeLinecap="round"
                            initial={{ strokeDashoffset: 402 }}
                            animate={{ strokeDashoffset: 402 - (402 * progress.percent) / 100 }}
                            transition={{ duration: 2, ease: "circOut" }}
                            className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                        />
                    </svg>

                    {/* Level Display Center */}
                    <div className="flex flex-col items-center justify-center bg-bg-app w-28 h-28 rounded-full border-4 border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent pointer-events-none" />
                        <span className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em] mb-1">Level</span>
                        <span className="text-5xl font-black text-text-primary leading-none tracking-tighter drop-shadow-sm">{level}</span>

                        {/* Subtle floating particles animation could go here */}
                    </div>

                    {/* Rank Badge - Metallic Shimmer */}
                    <div className={`absolute -bottom-4 px-4 py-1.5 rounded-2xl border border-white/10 shadow-float overflow-hidden group
                        ${level >= 50 ? 'bg-linear-to-r from-amber-400/90 to-yellow-600/90' : 'bg-linear-to-r from-slate-200/90 to-slate-400/90'}
                    `}>
                        {/* Shimmer Layer */}
                        <div className={`absolute inset-0 ${level >= 50 ? 'shimmer-gold' : 'shimmer-platinum'} opacity-50`} />

                        <div className="relative flex items-center gap-2">
                            <Trophy className={`w-4 h-4 ${level >= 50 ? 'text-yellow-100' : 'text-slate-800'}`} />
                            <span className={`text-[11px] font-black uppercase tracking-widest ${level >= 50 ? 'text-white' : 'text-slate-900'}`}>
                                {rank.name}
                            </span>
                        </div>
                    </div>
                </div>

                {/* XP Stats - Sleek Bar */}
                <div className="space-y-3 w-full max-w-[300px] pt-4">
                    <div className="flex justify-between items-end px-1">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">XP Progress</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-black text-text-primary">{progress.current}</span>
                            <span className="text-[10px] font-bold text-brand-muted">/ {progress.total}</span>
                        </div>
                    </div>
                    <div className="h-3 w-full bg-slate-900/5 dark:bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
                        <motion.div
                            className="h-full rounded-full bg-linear-to-r from-blue-600 via-indigo-500 to-purple-600 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress.percent}%` }}
                            transition={{ duration: 1.5, ease: "backOut" }}
                        />
                    </div>
                    <p className="text-[10px] text-brand-muted font-bold italic tracking-tight opacity-70">
                        {progress.total - progress.current} XP to next rank rewards
                    </p>
                </div>

                {/* Premium Stats Grid */}
                <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="group relative overflow-hidden bg-white/5 border border-white/5 rounded-2xl p-4 transition-all hover:bg-white/10 active:scale-95">
                        <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 transition-transform group-hover:scale-[2] group-hover:rotate-0">
                            <Star className="w-12 h-12" />
                        </div>
                        <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.5)]" />
                                <span className="text-[9px] font-black text-brand-muted uppercase tracking-[0.1em]">Partners</span>
                            </div>
                            <div className="text-2xl font-black text-text-primary mt-1">
                                {user?.referrals?.length || 0}
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-white/5 border border-white/5 rounded-2xl p-4 transition-all hover:bg-white/10 active:scale-95">
                        <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 -rotate-12 transition-transform group-hover:scale-[2] group-hover:rotate-0">
                            <Zap className="w-12 h-12" />
                        </div>
                        <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]" />
                                <span className="text-[9px] font-black text-brand-muted uppercase tracking-[0.1em]">Total XP</span>
                            </div>
                            <div className="text-2xl font-black text-text-primary mt-1">
                                {xp}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};
