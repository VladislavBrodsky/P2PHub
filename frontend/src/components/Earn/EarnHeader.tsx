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
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/20 blur-[100px] rounded-full animate-pulse delay-1000 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-6 bg-white/2 backdrop-blur-3xl rounded-[2.3rem] p-6 border border-white/5">

                {/* Level Circle - Simplified Design */}
                <div className="relative flex flex-col items-center justify-center pt-4 pb-8">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        {/* Progress Ring Background */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90 scale-95">
                            <defs>
                                <linearGradient id="crystalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#94A3B8" />
                                    <stop offset="50%" stopColor="#F1F5F9" /> {/* Crystal/White highlight */}
                                    <stop offset="100%" stopColor="#94A3B8" />
                                    <animate attributeName="x1" values="-100%;100%" dur="2s" repeatCount="indefinite" />
                                    <animate attributeName="x2" values="0%;200%" dur="2s" repeatCount="indefinite" />
                                </linearGradient>
                                <filter id="crystalGlow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                                    <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                                    <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                                </filter>
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
                            {/* Progress Ring Value (Crystal Effect) */}
                            <motion.circle
                                cx="64"
                                cy="64"
                                r="56"
                                fill="none"
                                stroke="url(#crystalGradient)"
                                strokeWidth="8"
                                strokeDasharray="351"
                                strokeDashoffset={351 - (351 * progress.percent) / 100}
                                strokeLinecap="round"
                                filter="drop-shadow(0px 0px 4px rgba(148, 163, 184, 0.5))"
                                initial={{ strokeDashoffset: 351 }}
                                animate={{ strokeDashoffset: 351 - (351 * progress.percent) / 100 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        </svg>

                        {/* Level Display Center - Clean (No Background) */}
                        <div className="relative z-10 flex flex-col items-center justify-center w-24 h-24">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.25em] mb-0.5 drop-shadow-sm">{t('earn_header.level')}</span>
                                <span className="text-5xl font-black bg-linear-to-b from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent leading-none tracking-tighter drop-shadow-sm filter">{level}</span>
                            </div>
                        </div>
                    </div>

                    {/* Rank Badge - Compact & Separated (Refactored for Clean Borders) */}
                    <div className={`relative mt-4 px-6 py-2.5 rounded-full border border-white/40 shadow-2xl group backdrop-blur-2xl z-20 transition-all hover:scale-105 overflow-hidden
                        ${level >= 50
                            ? 'bg-amber-400 text-yellow-950'
                            : 'bg-slate-300 text-slate-900'}
                    `}>
                        {/* High-End Gradient Overlay to fix edge glitches */}
                        <div className={`absolute inset-0 
                            ${level >= 50
                                ? 'bg-linear-to-r from-amber-500 via-amber-200 to-amber-500'
                                : 'bg-linear-to-r from-slate-400 via-slate-100 to-slate-400'}
                        `} />

                        {/* Shimmer Container - Inner Clipping Only */}
                        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                            <div className={`absolute inset-0 ${level >= 50 ? 'shimmer-gold' : 'shimmer-platinum'} opacity-40`} />
                            {/* High-End Crystal Glint */}
                            <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-white/80 to-transparent" />
                        </div>

                        <div className="relative flex items-center justify-center gap-2 z-10">
                            <Trophy className={`w-3.5 h-3.5 ${level >= 50 ? 'text-yellow-900' : 'text-slate-800'} drop-shadow-sm`} />
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-shadow-sm">
                                {t(`ranks.${rank.name}`)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* XP Stats - Premium Liquid Bar */}
                <div className="space-y-3 w-full max-w-[300px] pt-4">
                    <div className="flex justify-between items-end px-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">{t('earn_header.xp_progress')}</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-black text-text-primary italic tracking-tighter">{progress.current}</span>
                            <span className="text-[10px] font-bold text-brand-muted opacity-50">/ {progress.total} XP</span>
                        </div>
                    </div>
                    <div className="h-4 w-full bg-slate-200/30 dark:bg-white/5 rounded-full overflow-hidden border border-white/10 p-[2px] relative shadow-inner backdrop-blur-sm">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress.percent}%` }}
                            transition={{ duration: 1.5, ease: "backOut" }}
                            className="h-full rounded-full relative overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            style={{
                                background: level >= 50
                                    ? 'linear-gradient(90deg, #F59E0B, #FEF3C7, #F59E0B)'
                                    : 'linear-gradient(90deg, #3B82F6, #60A5FA, #2563EB)', // Electric Blue High Contrast
                                backgroundSize: '200% 100%'
                            }}
                        >
                            {/* Pro Liquid Animation Effect */}
                            <motion.div
                                animate={{
                                    backgroundPosition: ['100% 0%', '0% 0%']
                                }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-0 opacity-90"
                                style={{
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                                    backgroundSize: '200% 100%'
                                }}
                            />

                            {/* Crystal Reflection Overlay */}
                            <div className="absolute inset-x-0 top-0 h-[45%] bg-linear-to-b from-white/40 to-transparent" />

                            {/* Fast Shimmer Pulse */}
                            <motion.div
                                animate={{ x: ['-200%', '200%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent w-1/2"
                            />
                        </motion.div>
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
                                <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">{t('earn_header.partners')}</span>
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
                                <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">{t('earn_header.total_xp')}</span>
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
