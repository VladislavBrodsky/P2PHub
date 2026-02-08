import { motion } from 'framer-motion';
import { Trophy, Star, Zap, Users } from 'lucide-react';
import { getRank, getXPProgress } from '../../utils/ranking';
import { useUser } from '../../context/UserContext';
import { useTranslation, Trans } from 'react-i18next';

export const EarnHeader = () => {
    const { t } = useTranslation();
    const { user } = useUser();

    // Fallback or use real user data
    const level = user?.level || 1;
    const xp = user?.xp || 0;
    const rank = getRank(level);
    const progress = getXPProgress(level, xp);

    return (
        <section className="mb-8 relative overflow-hidden rounded-[2.5rem] glass-panel border border-white/10 p-1 shadow-2xl">
            {/* Immersive Mesh Background */}
            <div className="absolute inset-0 bg-linear-to-br from-blue-600/10 via-purple-600/5 to-transparent pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full animate-pulse pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full animate-pulse delay-1000 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-6 bg-white/[0.02] backdrop-blur-3xl rounded-[2.3rem] p-6 border border-white/5">

                {/* Level Circle - Quantum Design */}
                <div className="relative flex flex-col items-center justify-center pt-4 pb-8">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        {/* Outer Glow Ring */}
                        <div className="absolute inset-0 rounded-full border border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.15)] active:scale-95 transition-transform duration-500" />

                        {/* Progress Ring Background */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90 scale-95">
                            <defs>
                                <linearGradient id="liquid-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="50%" stopColor="#8b5cf6" />
                                    <stop offset="100%" stopColor="#06b6d4" />
                                </linearGradient>
                            </defs>
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                fill="none"
                                stroke="rgba(255,255,255,0.05)"
                                strokeWidth="8"
                                strokeLinecap="round"
                            />
                            {/* Progress Ring Value with Liquid Gradient */}
                            <motion.circle
                                cx="64"
                                cy="64"
                                r="56"
                                fill="none"
                                stroke="url(#liquid-gradient)"
                                strokeWidth="8"
                                strokeDasharray="351"
                                strokeDashoffset={351 - (351 * progress.percent) / 100}
                                strokeLinecap="round"
                                initial={{ strokeDashoffset: 351 }}
                                animate={{ strokeDashoffset: 351 - (351 * progress.percent) / 100 }}
                                transition={{ duration: 2, ease: "circOut" }}
                                className="drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                            />
                        </svg>

                        {/* Level Display Center - Liquid Crystal Effect */}
                        <div className="flex flex-col items-center justify-center w-24 h-24 rounded-full relative overflow-hidden group shadow-[0_0_30px_rgba(59,130,246,0.15)] bg-slate-100/50 dark:bg-black/40 backdrop-blur-xl border border-white/10 z-10">
                            {/* Liquid Gradient Background */}
                            <div className="absolute inset-0 bg-linear-to-br from-blue-400/10 via-purple-400/10 to-transparent animate-liquid-slow pointer-events-none" />

                            {/* Crystal Reflection Overlay */}
                            <div className="absolute inset-0 bg-linear-to-tr from-white/20 via-transparent to-transparent opacity-50 pointer-events-none rounded-full" />

                            <div className="relative z-10 flex flex-col items-center">
                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.25em] mb-0.5 drop-shadow-sm">{t('earn_header.level')}</span>
                                <span className="text-5xl font-black bg-linear-to-b from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent leading-none tracking-tighter drop-shadow-sm filter">{level}</span>
                            </div>
                        </div>
                    </div>

                    {/* Rank Badge - Compact & Separated */}
                    <div className={`relative mt-3 px-4 py-1.5 rounded-full border border-white/20 shadow-lg shadow-slate-200/50 dark:shadow-black/50 overflow-hidden group backdrop-blur-md z-20 transition-transform hover:scale-105
                        ${level >= 50 ? 'bg-linear-to-r from-amber-300/90 via-yellow-400/90 to-amber-500/90' : 'bg-linear-to-r from-slate-200/90 via-slate-300/90 to-slate-400/90'}
                    `}>
                        {/* Shimmer Layer */}
                        <div className={`absolute inset-0 ${level >= 50 ? 'shimmer-gold' : 'shimmer-platinum'} opacity-60`} />

                        {/* Crystal Glint */}
                        <div className="absolute top-0 left-0 w-full h-px bg-white/50" />

                        <div className="relative flex items-center gap-2">
                            <Trophy className={`w-3 h-3 ${level >= 50 ? 'text-yellow-900' : 'text-slate-700'} drop-shadow-sm`} />
                            <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${level >= 50 ? 'text-yellow-950' : 'text-slate-800'} text-shadow-sm`}>
                                {t(`ranks.${rank.name}`)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* XP Stats - Sleek Bar */}
                <div className="space-y-3 w-full max-w-[300px] pt-4">
                    <div className="flex justify-between items-end px-1">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{t('earn_header.xp_progress')}</span>
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
                        {t('earn_header.xp_to_next', { xp: progress.total - progress.current })}
                    </p>
                </div>

                {/* Premium Stats Grid */}
                <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="group relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-4 transition-all hover:bg-white/10 active:scale-95">
                        <div className="absolute -top-2 -right-2 p-2 opacity-20 scale-150 rotate-12 transition-transform group-hover:scale-[1.8] group-hover:rotate-6">
                            <Users className="w-12 h-12 text-yellow-400/50 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]" />
                        </div>
                        <div className="flex flex-col items-start gap-1 relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.5)]" />
                                <span className="text-[9px] font-black text-brand-muted uppercase tracking-[0.1em]">{t('earn_header.partners')}</span>
                            </div>
                            <div className="text-2xl font-black text-text-primary mt-1">
                                {user?.referrals?.length || 0}
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-4 transition-all hover:bg-white/10 active:scale-95">
                        <div className="absolute -top-2 -right-2 p-2 opacity-20 scale-150 -rotate-12 transition-transform group-hover:scale-[1.8] group-hover:rotate-0">
                            <Zap className="w-12 h-12 text-emerald-400/50 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]" />
                        </div>
                        <div className="flex flex-col items-start gap-1 relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]" />
                                <span className="text-[9px] font-black text-brand-muted uppercase tracking-[0.1em]">{t('earn_header.total_xp')}</span>
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
