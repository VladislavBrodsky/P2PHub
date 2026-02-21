import { motion } from 'framer-motion';
import { Trophy, Zap, Users, TrendingUp } from 'lucide-react';
import { getRank, getXPProgress } from '../../utils/ranking';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';

export const EarnHeader = () => {
    const { t } = useTranslation();
    const { user } = useUser();

    const level = user?.level || 1;
    const xp = user?.xp || 0;
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
        <section className="relative overflow-hidden rounded-[2rem] p-px shadow-2xl z-30">
            {/* Outer border gradient ring */}
            <div
                className="absolute inset-0 rounded-[2rem] opacity-70"
                style={{
                    background: `linear-gradient(135deg, ${badgeColor}60 0%, transparent 50%, ${badgeColor}40 100%)`,
                }}
            />

            {/* Card body */}
            <div className="relative rounded-[1.95rem] bg-(--color-bg-glass) backdrop-blur-3xl overflow-hidden border border-(--color-border-glass)">

                {/* ── Ambient glows ── */}
                <div
                    className="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${badgeColor}40, transparent 70%)` }}
                />
                <div
                    className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full blur-[60px] opacity-10 pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${badgeColor}30, transparent 70%)` }}
                />

                {/* Subtle grid texture */}
                <div
                    className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(var(--color-text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-text-primary) 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                />

                <div className="relative z-10 flex items-center gap-4 p-4">

                    {/* ────────── LEFT: Radial Ring + Rank Badge ────────── */}
                    <div className="flex flex-col items-center shrink-0 gap-2">
                        {/* Ring */}
                        <div className="relative w-[96px] h-[96px]">
                            <svg
                                className="absolute inset-0 w-full h-full -rotate-90"
                                viewBox="0 0 100 100"
                            >
                                <defs>
                                    <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor={badgeColor} />
                                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
                                    </linearGradient>
                                    <filter id="ring-glow">
                                        <feGaussianBlur stdDeviation="2" result="blur" />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>

                                {/* Track */}
                                <circle
                                    cx="50" cy="50" r={RADIUS}
                                    fill="none"
                                    stroke="rgba(255,255,255,0.07)"
                                    strokeWidth="7"
                                />
                                {/* Filled arc */}
                                <motion.circle
                                    cx="50" cy="50" r={RADIUS}
                                    fill="none"
                                    stroke="url(#ring-grad)"
                                    strokeWidth="7"
                                    strokeLinecap="round"
                                    strokeDasharray={CIRCUMFERENCE}
                                    strokeDashoffset={CIRCUMFERENCE}
                                    animate={{ strokeDashoffset }}
                                    transition={{ duration: 1.6, ease: 'circOut' }}
                                    filter="url(#ring-glow)"
                                    style={{ filter: `drop-shadow(0 0 6px ${badgeColor}90)` }}
                                />
                            </svg>

                            {/* Centre content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-[7px] font-black uppercase tracking-[0.18em] text-white/40 leading-none">
                                    {t('earn_header.level')}
                                </span>
                                <motion.span
                                    key={level}
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                    className="text-[2.1rem] font-black text-white leading-none tracking-tight"
                                >
                                    {level}
                                </motion.span>
                            </div>
                        </div>

                        {/* Rank badge pill */}
                        <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="relative px-3 py-[4px] rounded-full overflow-hidden shadow-lg"
                            style={{
                                background: `linear-gradient(135deg, ${badgeColor}dd, ${badgeColor}99)`,
                                boxShadow: `0 0 14px ${badgeColor}60`,
                            }}
                        >
                            {/* Shine overlay */}
                            <div className="absolute inset-0 bg-linear-to-r from-white/20 via-white/5 to-transparent pointer-events-none" />
                            <div className="relative flex items-center gap-1">
                                <Trophy className="w-2.5 h-2.5 text-white/90" />
                                <span className="text-[7.5px] font-black uppercase tracking-[0.14em] text-white/95">
                                    {t(`ranks.${rank.name}`)}
                                </span>
                            </div>
                        </motion.div>
                    </div>

                    {/* ────────── RIGHT: XP bar + stats ────────── */}
                    <div className="flex-1 flex flex-col gap-2.5 min-w-0">

                        {/* XP Progress header row */}
                        <div className="flex items-baseline justify-between px-0.5">
                            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40 leading-none">
                                {t('earn_header.xp_progress')}
                            </span>
                            <motion.span
                                key={progress.current}
                                initial={{ opacity: 0, x: 6 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-xs font-black text-white/90 tabular-nums"
                            >
                                {progress.current.toLocaleString()} <span className="text-white/30">/</span> {progress.total.toLocaleString()} <span className="text-white/40 font-bold">XP</span>
                            </motion.span>
                        </div>

                        {/* Progress bar */}
                        <div className="relative h-3 w-full rounded-full overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.07)' }}>
                            {/* Glow under bar */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress.percent}%` }}
                                transition={{ duration: 1.5, ease: 'circOut' }}
                                className="absolute inset-y-0 left-0 rounded-full blur-[6px] opacity-50"
                                style={{ background: `linear-gradient(90deg, ${badgeColor}, white)` }}
                            />
                            {/* Actual bar */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress.percent}%` }}
                                transition={{ duration: 1.5, ease: 'circOut' }}
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background: `linear-gradient(90deg, ${badgeColor}, ${badgeColor}cc, white)`,
                                    boxShadow: `0 0 8px ${badgeColor}80`,
                                }}
                            >
                                {/* Liquid shimmer */}
                                <div className="absolute inset-0 rounded-full overflow-hidden">
                                    <motion.div
                                        animate={{ x: ['-100%', '200%'] }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                                        className="absolute inset-y-0 w-1/3 bg-linear-to-r from-transparent via-white/50 to-transparent"
                                    />
                                </div>
                            </motion.div>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Partners */}
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="relative overflow-hidden rounded-2xl p-4 border"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    borderColor: 'rgba(255,255,255,0.08)',
                                }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                                        style={{ background: 'rgba(251,191,36,0.15)' }}>
                                        <Users className="w-3.5 h-3.5 text-amber-400" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">
                                        {t('earn_header.partners')}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-black text-white leading-none tabular-nums">
                                        {partners.toLocaleString()}
                                    </span>
                                    <TrendingUp className="w-4 h-4 text-amber-400/60 mb-0.5" />
                                </div>
                                {/* Corner glow */}
                                <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full blur-xl opacity-20"
                                    style={{ background: '#fbbf24' }} />
                            </motion.div>

                            {/* Total XP */}
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="relative overflow-hidden rounded-2xl p-4 border"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    borderColor: 'rgba(255,255,255,0.08)',
                                }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                                        style={{ background: `${badgeColor}22` }}>
                                        <Zap className="w-3.5 h-3.5" style={{ color: badgeColor }} />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">
                                        {t('earn_header.total_xp')}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-black leading-none tabular-nums"
                                        style={{ color: 'white' }}>
                                        {xp.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-black uppercase mb-0.5"
                                        style={{ color: `${badgeColor}cc` }}>xp</span>
                                </div>
                                {/* Corner glow */}
                                <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full blur-xl opacity-20"
                                    style={{ background: badgeColor }} />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
