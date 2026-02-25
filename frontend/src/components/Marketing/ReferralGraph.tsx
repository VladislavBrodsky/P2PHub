import { m, AnimatePresence } from 'framer-motion';
import { User, Globe, Network, AlertCircle, Brain, Zap, TrendingUp, ChevronRight, Sparkles, Users, DollarSign } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser } from '../../context/UserContext';
import { USDTLogo } from '../ui/USDTLogo';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useHaptic } from '../../hooks/useHaptic';
import clsx from 'clsx';
import { usePerformance } from '../../hooks/usePerformance';

const MemberAvatar = ({ delay, pro }: { delay: number; pro?: boolean }) => (
    <m.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay, type: "spring", stiffness: 260, damping: 20 }}
        className="group relative"
    >
        <div className={clsx(
            "w-12 h-12 rounded-2xl border-2 backdrop-blur-md flex items-center justify-center shadow-lg transition-all duration-500",
            pro
                ? "bg-indigo-500/10 border-indigo-500/50 group-hover:bg-indigo-500 group-hover:border-indigo-500"
                : "bg-emerald-500/10 border-emerald-500/50 group-hover:bg-emerald-500 group-hover:border-emerald-500"
        )}>
            {pro ? (
                <Zap className="w-5 h-5 text-indigo-500 group-hover:text-white transition-colors" />
            ) : (
                <Users className="w-5 h-5 text-emerald-500 group-hover:text-white transition-colors" />
            )}
        </div>
        <div className={clsx(
            "absolute inset-0 rounded-2xl animate-pulse opacity-0 group-hover:opacity-100",
            pro ? "shadow-[0_0_20px_rgba(99,102,241,0.6)]" : "shadow-[0_0_20px_rgba(16,185,129,0.6)]"
        )} />
    </m.div>
);

const NeuralBackground = React.memo(() => {
    const { lowPowerMode } = usePerformance();
    // Stabilize random data to prevent jumping and expensive SVG recalculations on re-render
    const particles = useMemo(() => lowPowerMode ? [] : [...Array(8)].map((_, i) => ({
        id: i,
        x: Math.random() * 400,
        y: Math.random() * 200,
        yDest: -100 - Math.random() * 100,
        xDest: (Math.random() - 0.5) * 50 + (i % 2 === 0 ? 20 : -20),
        duration: 3 + Math.random() * 4,
        delay: Math.random() * 5,
        size: i % 2 === 0 ? '1' : '1.5',
        color: i % 3 === 0 ? 'bg-blue-400' : i % 3 === 1 ? 'bg-indigo-400' : 'bg-cyan-400'
    })), [lowPowerMode]);

    return (
        <>
            {/* ── PREMIUM NEURAL BACKGROUND ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60 dark:opacity-80">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.15),transparent_70%)]" />
                <div className="circuit-decor opacity-40 dark:opacity-60" />

                {!lowPowerMode && (
                    <svg className="absolute inset-0 w-full h-full opacity-50">
                        <m.path
                            d="M100,250 Q250,100 400,250 T700,250"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                            className="text-indigo-500/40"
                            animate={{ strokeDashoffset: [0, 100] }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            style={{ strokeDasharray: "8, 8" }}
                        />
                        <m.path
                            d="M-50,400 Q200,550 450,400 T950,400"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                            className="text-emerald-500/40"
                            animate={{ strokeDashoffset: [100, 0] }}
                            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                            style={{ strokeDasharray: "8, 8" }}
                        />
                    </svg>
                )}
            </div>

            <div className="absolute inset-0 z-0">
                {/* Atmospheric Plasma Glows */}
                <m.div
                    className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <m.div
                    className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.15, 0.1] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                    style={{
                        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 4px)',
                        backgroundSize: '100% 4px'
                    }}
                />

                {/* Energy Particles */}
                {particles.map((p) => (
                    <m.div
                        key={p.id}
                        className={`absolute w-${p.size} h-${p.size} ${p.color} rounded-full blur-[1px]`}
                        initial={{
                            x: p.x,
                            y: p.y,
                            opacity: 0
                        }}
                        animate={{
                            y: [null, p.yDest],
                            x: [null, p.xDest],
                            opacity: [0, 0.7, 0],
                            scale: [1, 1.5, 0.5]
                        }}
                        transition={{
                            duration: p.duration,
                            repeat: Infinity,
                            ease: "easeOut",
                            delay: p.delay
                        }}
                    />
                ))}

                {/* Dot Grid Background */}
                <div className="absolute inset-0 opacity-15"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)',
                        backgroundSize: '16px 16px'
                    }}
                />

                {/* Neural & Energy SVG Layer */}
                <div className="absolute inset-0 flex items-center justify-center -top-10 sm:top-[-5%]">
                    <svg className="w-full h-[400px] max-w-lg" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
                        {/* Neural Connectivity Lines */}
                        <m.path
                            d="M 120 100 L 200 100"
                            stroke="url(#neural-gradient)"
                            strokeWidth="0.5"
                            strokeDasharray="4 4"
                            fill="none"
                            animate={{ strokeDashoffset: [0, -20] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="opacity-20"
                        />
                        <m.path
                            d="M 280 100 L 200 100"
                            stroke="url(#neural-gradient)"
                            strokeWidth="0.5"
                            strokeDasharray="4 4"
                            fill="none"
                            animate={{ strokeDashoffset: [0, 20] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="opacity-20"
                        />

                        {/* Dynamic Glow Curves */}
                        <m.path
                            d="M -50 150 Q 100 50 250 150 T 450 100"
                            fill="none"
                            stroke="url(#blue-gradient)"
                            strokeWidth="2"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="opacity-30"
                        />
                        <m.path
                            d="M -50 100 Q 150 180 300 80 T 450 150"
                            fill="none"
                            stroke="url(#purple-gradient)"
                            strokeWidth="1.5"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1 }}
                            className="opacity-30"
                        />

                        {/* Shooting Energy Path Particles */}
                        <m.circle r="2" fill="#60A5FA" filter="blur(2px)">
                            <animateMotion
                                path="M -50 150 Q 100 50 250 150 T 450 100"
                                dur="3s"
                                repeatCount="indefinite"
                            />
                        </m.circle>
                        <m.circle r="1.5" fill="#A855F7" filter="blur(2px)">
                            <animateMotion
                                path="M -50 100 Q 150 180 300 80 T 450 150"
                                dur="4s"
                                repeatCount="indefinite"
                                begin="1s"
                            />
                        </m.circle>

                        {/* Multi-Ring Energy Orbits - Staggered & Pulsing */}
                        <m.circle
                            cx="200"
                            cy="100"
                            r="68"
                            stroke="white"
                            strokeWidth="0.5"
                            fill="none"
                            strokeDasharray="4 60"
                            animate={{
                                rotate: 360,
                                scale: [1, 1.02, 1]
                            }}
                            transition={{
                                rotate: { duration: 6, repeat: Infinity, ease: "linear" },
                                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                            }}
                            className="opacity-40"
                            style={{ transformOrigin: "200px 100px" }}
                        />
                        <m.circle
                            cx="200"
                            cy="100"
                            r="74"
                            stroke="#3b82f6"
                            strokeWidth="1"
                            fill="none"
                            strokeDasharray="10 200"
                            animate={{
                                rotate: -360,
                                opacity: [0.3, 0.7, 0.3]
                            }}
                            transition={{
                                rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                                opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                            }}
                            className="opacity-60"
                            style={{ transformOrigin: "200px 100px" }}
                        />

                        <defs>
                            <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
                                <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                            </linearGradient>
                            <linearGradient id="purple-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
                                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                            </linearGradient>
                            <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
                                <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
            </div>
        </>
    );
});

const YieldCounter = React.memo(({ targetAmount, onComplete }: { targetAmount: number; onComplete: () => void }) => {
    const { t } = useTranslation(['marketing']);
    const { impact } = useHaptic();

    useEffect(() => {
        if (targetAmount >= 43200) {
            impact('medium');
        }
    }, [targetAmount, impact]);

    const isDoneCalculating = targetAmount >= 43200;
    const displayCount = Math.floor(targetAmount);

    return (
        <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-xs px-4"
        >
            <div className="relative rounded-2xl bg-slate-950/95 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden px-4 py-3">
                <div className="absolute inset-0 bg-linear-to-tr from-indigo-500/10 to-emerald-500/5 pointer-events-none" />

                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-400 text-center mb-1.5">
                    {t('income.network.yield', { defaultValue: 'ESTIMATED NETWORK YIELD' })}
                </p>

                <div className="flex items-baseline justify-center gap-0.5">
                    <span className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight text-white leading-none">
                        ${displayCount.toLocaleString()}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-indigo-400 leading-none">
                        .00
                    </span>
                </div>

                <div className="mt-2.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <m.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((targetAmount / 43200) * 100, 100)}%` }}
                        transition={{ duration: 0.1 }}
                        className="h-full bg-linear-to-r from-indigo-500 via-blue-400 to-emerald-400 rounded-full"
                    />
                </div>

                <div className="mt-1.5 flex justify-between items-center">
                    <span className="text-[8px] sm:text-[9px] font-bold text-white/30 uppercase tracking-widest">{t('income.math.per_min', { defaultValue: '$1/MIN' })}</span>
                    <span className="text-[8px] sm:text-[9px] font-bold text-white/30 uppercase tracking-widest">{t('marketing.max_dividends', { defaultValue: 'MAX DIVIDENDS' })}</span>
                </div>

                {isDoneCalculating && (
                    <m.button
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={onComplete}
                        className="mt-3 w-full h-9 rounded-xl vibing-emerald-animated text-white font-black text-[10px] uppercase tracking-[0.25em] flex items-center justify-center gap-1.5 shadow-[0_8px_24px_-6px_rgba(16,185,129,0.5)] active:scale-95 transition-transform"
                    >
                        Reveal Strategy <ChevronRight className="w-3.5 h-3.5" />
                    </m.button>
                )}
            </div>
        </m.div>
    );
});

export const ReferralGraph = React.memo(({ targetAmount = 43200 }: { targetAmount?: number }) => {
    const { t } = useTranslation(['marketing', 'common']);
    const { user } = useUser();
    const { selection, impact } = useHaptic();

    const [showFunnel, setShowFunnel] = useState(false);
    const [funnelStep, setFunnelStep] = useState(0);
    const [animatedCount, setAnimatedCount] = useState(0);

    useEffect(() => {
        const duration = 3000;
        const startTime = Date.now();
        let rafId: number;

        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const ease = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            setAnimatedCount(targetAmount * ease);

            if (progress < 1) {
                rafId = requestAnimationFrame(animate);
            } else {
                setAnimatedCount(targetAmount);
            }
        };
        rafId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafId);
    }, [targetAmount]);

    const partnersCount = useMemo(() => {
        const seed = Math.floor(Date.now() / (3 * 60 * 60 * 1000));
        const pseudoRandom = Math.abs(Math.sin(seed * 12345));
        return Math.floor(pseudoRandom * (765 - 333 + 1)) + 333;
    }, []);

    const handleUpgrade = useCallback(() => {
        impact('heavy');
        if (user?.is_pro) {
            window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'pro' }));
        } else {
            window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'subscription' }));
        }
        setShowFunnel(false);
    }, [impact, user?.is_pro]);

    const nextStep = useCallback(() => {
        selection();
        setFunnelStep(prev => prev + 1);
    }, [selection]);

    const onYieldComplete = useCallback(() => {
        setShowFunnel(true);
    }, []);

    const funnelStages = useMemo(() => [
        {
            icon: <AlertCircle className="w-12 h-12 text-amber-500" />,
            title: t('viral_funnel.step1_title', { defaultValue: 'Immediate Opportunity' }),
            desc: t('viral_funnel.step1_desc', { defaultValue: 'You are currently standing outside the largest wealth transfer in digital history.' }),
            color: 'from-amber-500/20 to-orange-500/20',
            borderColor: 'border-amber-500/30'
        },
        {
            icon: <Brain className="w-12 h-12 text-blue-500" />,
            title: t('viral_funnel.step2_title', { defaultValue: 'The $1/min Strategy' }),
            desc: t('viral_funnel.step2_desc', { defaultValue: 'Stop trading hours for dollars. Start capturing global volume dividends.' }),
            color: 'from-blue-500/20 to-indigo-500/20',
            borderColor: 'border-blue-500/30'
        },
        {
            icon: <Zap className="w-12 h-12 text-yellow-500" />,
            title: t('viral_funnel.step3_title', { defaultValue: 'Activation Status' }),
            desc: t('viral_funnel.step3_desc', { defaultValue: 'Your node is ready for deployment. Finalize setup to begin yielding USDT.' }),
            color: 'from-yellow-500/20 to-orange-500/20',
            borderColor: 'border-yellow-500/30'
        }
    ], [t]);

    return (
        <div className={clsx(
            "relative w-full h-[460px] md:h-[520px] flex items-center justify-center overflow-hidden rounded-3xl md:rounded-2xl border transition-all duration-700",
            "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 shadow-2xl",
            "group"
        )}>
            <NeuralBackground />

            <AnimatePresence mode="wait">
                {!showFunnel ? (
                    <m.div
                        key="graph"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                        className="absolute inset-0 flex flex-col items-center justify-center p-6"
                    >

                        {/* ── VIRAL CORE HUB (USER) ── */}
                        <div className="absolute inset-x-0 top-[35%] -translate-y-1/2 flex justify-center pointer-events-none z-10">
                            <div className="relative pointer-events-auto">
                                {/* Pulsing Outer Glow */}
                                <m.div
                                    className="absolute -inset-4 rounded-full bg-blue-500/20 blur-2xl"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                />

                                {/* Avatar Frame with Rhythmic Pulse */}
                                <m.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[2.5rem] p-1 bg-linear-to-br from-blue-500 via-indigo-500 to-cyan-400 shadow-[0_0_50px_rgba(59,130,246,0.5)] animate-rhythmic-pulse"
                                >
                                    <div className="w-full h-full rounded-[2.3rem] overflow-hidden bg-slate-900 border border-white/30 backdrop-blur-md">
                                        {user?.photo_url ? (
                                            <img
                                                src={user.photo_url}
                                                alt="You"
                                                className="w-full h-full object-cover grayscale-20 hover:grayscale-0 transition-all duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User className="w-10 h-10 text-white/50" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/10 to-transparent animate-shimmer rounded-[2.5rem] pointer-events-none" />
                                </m.div>

                                {/* Floating Nodes */}
                                <m.div
                                    className="absolute -left-12 top-2 sm:top-4 px-3 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-md border border-emerald-400 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] z-20 group/node overflow-hidden"
                                    initial={{ scale: 0, opacity: 0, x: -20 }}
                                    animate={{
                                        scale: 1,
                                        opacity: 1,
                                        y: [0, -10, 0],
                                        x: [0, 6, 0]
                                    }}
                                    transition={{
                                        scale: { duration: 0.5, delay: 0.2 },
                                        opacity: { duration: 0.5, delay: 0.2 },
                                        y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                                        x: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                                    }}
                                >
                                    {/* Orb Glow */}
                                    <div className="absolute inset-0 bg-radial from-white/20 to-transparent pointer-events-none" />
                                    <div className="p-1 rounded-full bg-white/20 relative z-10">
                                        <Users className="w-3 h-3 text-white" />
                                    </div>
                                    <span className="text-[10px] font-black text-white tracking-wider relative z-10">
                                        +${Math.floor(animatedCount).toLocaleString()}
                                    </span>
                                </m.div>

                                {/* TON Profit Node */}
                                <m.div
                                    className="absolute -left-16 sm:-left-20 bottom-8 px-2.5 py-1 rounded-full bg-blue-500/90 backdrop-blur-md border border-blue-400 flex items-center gap-1.5 shadow-[0_0_20px_rgba(59,130,246,0.4)] z-20 overflow-hidden"
                                    initial={{ scale: 0, opacity: 0, x: -30 }}
                                    animate={{
                                        scale: 1,
                                        opacity: 1,
                                        y: [0, 15, 0],
                                        x: [0, -10, 0]
                                    }}
                                    transition={{
                                        scale: { duration: 0.5, delay: 0.6 },
                                        opacity: { duration: 0.5, delay: 0.6 },
                                        y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 },
                                        x: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }
                                    }}
                                >
                                    <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center relative z-10">
                                        <Sparkles className="w-2.5 h-2.5 text-white" />
                                    </div>
                                    <span className="text-[9px] font-black text-white tracking-tighter relative z-10">
                                        +{Math.floor(animatedCount / 3.4).toLocaleString()} TON
                                    </span>
                                </m.div>

                                {/* USDT Profit Node */}
                                <m.div
                                    className="absolute -right-16 sm:-right-20 top-0 px-2.5 py-1 rounded-full bg-teal-500/90 backdrop-blur-md border border-teal-400 flex items-center gap-1.5 shadow-[0_0_20px_rgba(20,184,166,0.4)] z-20 overflow-hidden"
                                    initial={{ scale: 0, opacity: 0, x: 30 }}
                                    animate={{
                                        scale: 1,
                                        opacity: 1,
                                        y: [0, -20, 0],
                                        x: [0, 10, 0]
                                    }}
                                    transition={{
                                        scale: { duration: 0.5, delay: 0.8 },
                                        opacity: { duration: 0.5, delay: 0.8 },
                                        y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 },
                                        x: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }
                                    }}
                                >
                                    <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center relative z-10">
                                        <DollarSign className="w-2.5 h-2.5 text-emerald-100" />
                                    </div>
                                    <span className="text-[9px] font-black text-white tracking-tighter relative z-10">
                                        +${Math.floor(animatedCount).toLocaleString()} USDT
                                    </span>
                                </m.div>

                                <m.div
                                    className="absolute -right-8 sm:-right-10 bottom-4 sm:bottom-6 w-10 h-10 rounded-full bg-indigo-500/90 backdrop-blur-md border border-indigo-400 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] z-20 group/node overflow-hidden"
                                    initial={{ scale: 0, opacity: 0, x: 20 }}
                                    animate={{
                                        scale: 1,
                                        opacity: 1,
                                        y: [0, 12, 0],
                                        x: [0, -8, 0]
                                    }}
                                    transition={{
                                        scale: { duration: 0.5, delay: 0.4 },
                                        opacity: { duration: 0.5, delay: 0.4 },
                                        y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
                                        x: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
                                    }}
                                >
                                    {/* Orb Glow */}
                                    <div className="absolute inset-0 bg-radial from-white/20 to-transparent pointer-events-none" />
                                    <Zap className="w-4 h-4 text-white fill-white relative z-10" />
                                </m.div>

                                <m.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 bg-white border-2 border-blue-500/20 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.4)] flex items-center justify-center overflow-hidden group/badge animate-vibe-shift z-30"
                                >
                                    {/* High-Energy Fusion Pulse Border */}
                                    <div className="absolute inset-0 bg-linear-to-r from-blue-500/20 via-indigo-500/20 to-cyan-500/20 opacity-0 group-hover/badge:opacity-100 transition-opacity duration-500" />
                                    {/* Shimmer Overlay */}
                                    <m.div
                                        className="absolute inset-0 bg-linear-to-r from-transparent via-blue-500/10 to-transparent"
                                        animate={{ x: ['-200%', '200%'] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    />

                                    <span className="text-[10px] sm:text-xs font-black text-slate-900 uppercase tracking-[0.2em] sm:tracking-[0.4em] relative z-10 drop-shadow-sm">
                                        Viral Network Core
                                    </span>
                                </m.div>
                            </div>
                        </div>

                        {/* ── CALCULATION COUNTER ── */}
                        <YieldCounter targetAmount={animatedCount} onComplete={onYieldComplete} />
                    </m.div>
                ) : (
                    <m.div
                        key="funnel"
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl text-center"
                    >
                        <AnimatePresence mode="wait">
                            {funnelStep < 3 ? (
                                <m.div
                                    key={funnelStep}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="w-full max-w-sm flex flex-col items-center"
                                >
                                    <div className={clsx(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center border shadow-2xl mb-4 transition-all duration-500",
                                        funnelStages[funnelStep].color,
                                        funnelStages[funnelStep].borderColor
                                    )}>
                                        {funnelStages[funnelStep].icon}
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-tight">
                                        {funnelStages[funnelStep].title}
                                    </h3>
                                    <p className="text-label text-slate-500 dark:text-slate-400 leading-relaxed mb-5 px-4">
                                        {funnelStages[funnelStep].desc}
                                    </p>

                                    <div className="flex flex-col gap-4 w-full">
                                        <div className="flex justify-center gap-1.5 mb-2">
                                            {[0, 1, 2].map((i) => (
                                                <div key={i} className={clsx("h-1.5 rounded-full transition-all duration-500", i === funnelStep ? "w-10 bg-indigo-500" : "w-3 bg-slate-200 dark:bg-white/10")} />
                                            ))}
                                        </div>
                                        <button
                                            onClick={nextStep}
                                            className="w-full h-11 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
                                        >
                                            {t('common:next', { defaultValue: 'Next' })}
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setShowFunnel(false)}
                                            className="text-label font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white uppercase tracking-[0.3em] transition-colors"
                                        >
                                            {t('common:close', { defaultValue: 'Close' })}
                                        </button>
                                    </div>
                                </m.div>
                            ) : (
                                <m.div
                                    key="cta"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-full max-w-sm flex flex-col items-center"
                                >
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-30 animate-pulse" />
                                        <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/50 flex items-center justify-center relative z-10 shadow-2xl">
                                            <Sparkles className="w-10 h-10 text-emerald-500" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 mb-5 text-center">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase leading-tight pb-0.5">
                                            {t('viral_funnel.cta', { defaultValue: 'Activate My Node' })}
                                        </h3>
                                        <div className="w-8 h-1 bg-emerald-500 mx-auto rounded-full" />
                                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.2em] mt-1.5">
                                            {t('viral_funnel.elite_users', { defaultValue: 'OFFER LIMITED TO FIRST 5,000 PARTNERS' })}
                                        </p>
                                    </div>

                                    <div className="w-full space-y-4">
                                        <button
                                            onClick={handleUpgrade}
                                            className="w-full h-12 vibing-emerald-animated rounded-2xl text-white font-bold text-xs uppercase tracking-widest shadow-[0_15px_40px_-10px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
                                        >
                                            {t('viral_funnel.cta', { defaultValue: 'Activate My Node' })}
                                            <Zap className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                        </button>

                                        <button
                                            onClick={() => { setShowFunnel(false); setFunnelStep(0); }}
                                            className="text-label font-bold text-slate-400 uppercase tracking-[0.3em] hover:text-slate-900 dark:hover:text-white transition-colors"
                                        >
                                            {t('common:close', { defaultValue: 'Close' })}
                                        </button>
                                    </div>

                                    {/* Social Proof Footer */}
                                    <div className="mt-5 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 w-full flex items-center gap-3">
                                        <div className="flex -space-x-2 shrink-0">
                                            {[1, 2, 3, 4].map(i => (
                                                <img
                                                    key={i}
                                                    src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${i + partnersCount + 42}`}
                                                    className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200"
                                                    alt="user"
                                                />
                                            ))}
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight text-left">
                                            {t('viral_funnel.deployed_partners', { count: partnersCount, defaultValue: `${partnersCount} nodes activated today` })}
                                        </p>
                                    </div>
                                </m.div>
                            )}
                        </AnimatePresence>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
});




