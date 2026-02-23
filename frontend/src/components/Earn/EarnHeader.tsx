import { motion } from 'framer-motion';
import { Trophy, Zap, Users, TrendingUp } from 'lucide-react';
import { getRank, getXPProgress } from '../../utils/ranking';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';

export const EarnHeader = () => {
    const { t } = useTranslation(['social', 'common']);
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
        <section className="relative overflow-hidden rounded-2xl p-px shadow-xl z-30">
            {/* Outer border gradient ring */}
            <div
                className="absolute inset-0 rounded-2xl opacity-70"
                style={{
                    background: `linear-gradient(135deg, ${badgeColor}60 0%, transparent 50%, ${badgeColor}40 100%)`,
                }}
            />

            {/* Card body */}
            <div className="relative rounded-[0.95rem] bg-bg-glass backdrop-blur-3xl overflow-hidden border border-border-glass">

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
                    className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08] pointer-events-none cyber-grid"
                />

                <div className="relative z-10 flex items-center gap-4 p-4">

                    {/* ────────── LEFT: Radial Ring + Rank Badge ────────── */}
                    <div className="flex flex-col items-center shrink-0 gap-1.5">
                        {/* Ring - Responsive size */}
                        <div className="relative w-[72px] h-[72px] sm:w-[86px] sm:h-[86px]">
                            <svg
                                className="absolute inset-0 w-full h-full -rotate-90"
                                viewBox="0 0 100 100"
                            >
                                <defs>
                                    <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor={badgeColor} />
                                        <stop offset="100%" stopColor={badgeColor} stopOpacity="0.4" />
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
                                    stroke="var(--divider)"
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
                                <span className="text-label font-bold uppercase tracking-[0.18em] text-text-primary opacity-40 leading-none mb-0.5">
                                    {t('lvl')}
                                </span>
                                <motion.span
                                    key={level}
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                    className="text-xl sm:text-[1.5rem] font-bold text-text-primary leading-none tracking-tight"
                                >
                                    {level}
                                </motion.span>
                            </div>
                        </div>

                        {/* Rank badge pill - Kept high contrast with white text */}
                        <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="relative px-2.5 py-1 sm:px-3 sm:py-[4px] rounded-full overflow-hidden shadow-lg"
                            style={{
                                background: `linear-gradient(135deg, ${badgeColor}dd, ${badgeColor}99)`,
                                boxShadow: `0 0 14px ${badgeColor}60`,
                            }}
                        >
                            {/* Shine overlay */}
                            <div className="absolute inset-0 bg-linear-to-r from-white/20 via-white/5 to-transparent pointer-events-none" />
                            <div className="relative flex items-center gap-1">
                                <Trophy className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white/90" />
                                <span className="text-label sm:text-label font-bold uppercase tracking-[0.12em] sm:tracking-[0.14em] text-white/95 whitespace-nowrap">
                                    {t(`ranks.${rank.name}`)}
                                </span>
                            </div>
                        </motion.div>
                    </div>

                    {/* ────────── RIGHT: XP bar + stats ────────── */}
                    <div className="flex-1 flex flex-col gap-2 sm:gap-2.5 min-w-0">

                        {/* XP Progress header row */}
                        <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5 px-0.5 mb-0.5 sm:mb-0">
                            <span className="text-label font-bold uppercase tracking-[0.08em] sm:tracking-[0.14em] text-text-primary opacity-40 leading-none shrink-0">
                                {t('referral.xp_progress')}
                            </span>
                            <motion.span
                                key={progress.current}
                                initial={{ opacity: 0, x: 6 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-label sm:text-xs font-bold text-text-primary transition-colors tabular-nums whitespace-nowrap ml-auto"
                            >
                                {Math.floor(progress.current).toLocaleString()} <span className="opacity-30">/</span> {Math.floor(progress.total).toLocaleString()} <span className="opacity-40 font-bold">XP</span>
                            </motion.span>
                        </div>

                        {/* Progress bar */}
                        <div className="relative h-2.5 sm:h-3 w-full rounded-full overflow-hidden"
                            style={{ background: 'var(--divider)' }}>
                            {/* Glow under bar */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress.percent}%` }}
                                transition={{ duration: 1.5, ease: 'circOut' }}
                                className="absolute inset-y-0 left-0 rounded-full blur-[6px] opacity-50"
                                style={{ background: `linear-gradient(90deg, ${badgeColor}, ${badgeColor}60)` }}
                            />
                            {/* Actual bar */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress.percent}%` }}
                                transition={{ duration: 1.5, ease: 'circOut' }}
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background: `linear-gradient(90deg, ${badgeColor}, ${badgeColor}cc, ${badgeColor}bb)`,
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
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            {/* Partners */}
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="relative overflow-hidden rounded-xl sm:rounded-2xl p-2 sm:p-3 border bg-input-bg border-input-border flex flex-col justify-center min-h-[56px] sm:min-h-[72px]"
                            >
                                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center shrink-0"
                                        style={{ background: 'rgba(251,191,36,0.15)' }}>
                                        <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                                    </div>
                                    <span className="text-label font-bold uppercase tracking-[0.08em] sm:tracking-[0.12em] text-text-primary opacity-40 leading-tight min-w-0">
                                        {t('referral.partners')}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-1 min-w-0">
                                    <span className="text-sm sm:text-xl font-bold text-text-primary leading-none tabular-nums">
                                        {partners.toLocaleString()}
                                    </span>
                                    <TrendingUp className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-amber-500/60 mb-0.5 shrink-0" />
                                </div>
                                {/* Corner glow */}
                                <div className="absolute -bottom-3 -right-3 w-10 h-10 sm:w-12 sm:h-12 rounded-full blur-xl opacity-20"
                                    style={{ background: '#fbbf24' }} />
                            </motion.div>

                            {/* Total XP */}
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="relative overflow-hidden rounded-xl sm:rounded-2xl p-2 sm:p-3 border bg-input-bg border-input-border flex flex-col justify-center min-h-[56px] sm:min-h-[72px]"
                            >
                                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center shrink-0"
                                        style={{ background: `${badgeColor}22` }}>
                                        <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: badgeColor }} />
                                    </div>
                                    <span className="text-label font-bold uppercase tracking-[0.08em] sm:tracking-[0.12em] text-text-primary opacity-40 leading-tight min-w-0">
                                        {t('referral.total_xp')}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-0.5 sm:gap-1 min-w-0">
                                    <span className="text-sm sm:text-xl font-bold leading-none tabular-nums text-text-primary">
                                        {Math.floor(xp).toLocaleString()}
                                    </span>
                                    <span className="text-label sm:text-label font-bold uppercase mb-0.5 shrink-0"
                                        style={{ color: `${badgeColor}cc` }}>xp</span>
                                </div>
                                {/* Corner glow */}
                                <div className="absolute -bottom-3 -right-3 w-10 h-10 sm:w-12 sm:h-12 rounded-full blur-xl opacity-20"
                                    style={{ background: badgeColor }} />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
