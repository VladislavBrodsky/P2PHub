import { motion } from 'framer-motion';
import { memo } from 'react';
import { Trophy, Zap, Users, TrendingUp } from 'lucide-react';
import { getRank, getXPProgress } from '../../utils/ranking';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';

export const EarnHeader = memo(() => {
    const { t } = useTranslation(['social', 'common']);
    const { user } = useUser();

    const level = Number(user?.level) || 1;
    let xp = Number(user?.xp);
    if (isNaN(xp)) xp = 0;
    const rank = getRank(level);
    const progress = getXPProgress(level, xp);
    const partners = user?.total_network_size || 0;

    // SVG circle geometry
    const RADIUS = 44;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    const strokeDashoffset = CIRCUMFERENCE - (CIRCUMFERENCE * progress.percent) / 100;

    // Determine gradient stops from rank badge colour
    const badgeColor = rank.badgeColor;

    return (
        <section className="relative z-30">
            {/* Outer border gradient ring */}
            <div
                className="absolute inset-0 rounded-2xl opacity-70"
                style={{
                    background: `linear-gradient(135deg, ${badgeColor}60 0%, transparent 50%, ${badgeColor}40 100%)`,
                }}
            />

            {/* Card body */}
            <div className="relative rounded-2xl bg-bg-glass backdrop-blur-3xl overflow-hidden border border-border-glass h-full shadow-xl">

                {/* #comment: Ambient glows removed for Unified Background Continuity */}
                {/* Subtle grid texture */}
                <div
                    className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08] pointer-events-none cyber-grid"
                />

                <div className="relative z-10 flex flex-col p-5 gap-6">

                    {/* ── TOP SECTION: Main Identity ── */}
                    <div className="flex items-center gap-6">
                        {/* LEFT: Radial Ring */}
                        <div className="relative w-[80px] h-[80px] shrink-0">
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="currentColor" className="text-slate-200 dark:text-white/5" strokeWidth="6" />
                                <motion.circle
                                    cx="50" cy="50" r={RADIUS} fill="none" stroke={badgeColor} strokeWidth="6" strokeLinecap="round"
                                    strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE}
                                    animate={{ strokeDashoffset }} transition={{ duration: 1.5, ease: 'circOut' }}
                                    style={{ filter: `drop-shadow(0 0 8px ${badgeColor}60)` }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20 leading-none mb-0.5">{t('lvl')}</span>
                                <span className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{level}</span>
                            </div>
                        </div>

                        {/* RIGHT: Progress & Rank */}
                        <div className="flex-1 flex flex-col gap-3 min-w-0">
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">{t('referral.xp_progress')}</span>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                                        {Math.floor(progress.current).toLocaleString()}
                                        <span className="text-slate-300 dark:text-white/20 mx-1">/</span>
                                        {Math.floor(progress.total).toLocaleString()}
                                    </span>
                                </div>
                                <div className="h-2.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-white/5 shadow-inner">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress.percent}%` }}
                                        transition={{ duration: 1.5, ease: 'circOut' }}
                                        className="h-full rounded-full relative"
                                        style={{ background: `linear-gradient(90deg, ${badgeColor}, ${badgeColor}dd)`, boxShadow: `0 0 12px ${badgeColor}40` }}
                                    >
                                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent w-full animate-shimmer-slide" />
                                    </motion.div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="px-3 py-1 rounded-lg flex items-center gap-2 shadow-sm border border-white/20" style={{ background: `linear-gradient(135deg, ${badgeColor}dd, ${badgeColor}99)` }}>
                                    <Trophy size={12} className="text-white shrink-0" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{rank.name}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── DIVIDER ── */}
                    <div className="h-px w-full bg-linear-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />

                    {/* ── BOTTOM SECTION: Key Metrics Grid ── */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-slate-400 dark:text-white/30 uppercase">
                                <Users size={14} className="text-indigo-500" />
                                <span className="text-[10px] font-black tracking-widest">{t('referral.partners')}</span>
                            </div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none tabular-nums">
                                {partners.toLocaleString()}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 border-l border-slate-100 dark:border-white/5 pl-4">
                            <div className="flex items-center gap-2 text-slate-400 dark:text-white/30 uppercase">
                                <Zap size={14} className="text-amber-500" />
                                <span className="text-[10px] font-black tracking-widest">{t('referral.total_xp')}</span>
                            </div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none tabular-nums">
                                {Math.floor(xp).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
});
