import { m, AnimatePresence } from 'framer-motion';
import { User, Globe, Network, AlertCircle, Brain, Zap, TrendingUp, ChevronRight, Sparkles, Users } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useUser } from '../../context/UserContext';
import { USDTLogo } from '../ui/USDTLogo';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useHaptic } from '../../hooks/useHaptic';
import clsx from 'clsx';

export const ReferralGraph = ({ targetAmount = 43200 }: { targetAmount?: number }) => {
    const { t } = useTranslation(['marketing', 'common']);
    const { user } = useUser();
    const { selection, impact } = useHaptic();

    const [showFunnel, setShowFunnel] = useState(false);
    const [funnelStep, setFunnelStep] = useState(0);
    const [count, setCount] = useState(0);
    const [baseCount, setBaseCount] = useState(0);
    const [isCalculating, setIsCalculating] = useState(true);

    const partnersCount = useMemo(() => {
        const seed = Math.floor(Date.now() / (3 * 60 * 60 * 1000));
        const pseudoRandom = Math.abs(Math.sin(seed * 12345));
        return Math.floor(pseudoRandom * (765 - 333 + 1)) + 333;
    }, []);

    // ── HIGH-VELOCITY CALCULATION & CONTINUOUS TICKER ──
    useEffect(() => {
        if (isCalculating) {
            const duration = 4000;
            const startTime = Date.now();
            const startVal = count;

            const animate = () => {
                const now = Date.now();
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeOutCubic = 1 - Math.pow(1 - progress, 3);

                const current = Math.floor(startVal + (targetAmount - startVal) * easeOutCubic);
                setCount(current);
                setBaseCount(current);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    impact('medium');
                    setTimeout(() => {
                        setIsCalculating(false);
                        setShowFunnel(true);
                    }, 800);
                }
            };
            requestAnimationFrame(animate);
        } else {
            // Smoothly transition to new target if it changes after initial calculation
            let current = count;
            const step = () => {
                if (Math.abs(targetAmount - current) < 1) {
                    setCount(targetAmount);
                    setBaseCount(targetAmount);
                    return;
                }
                current += (targetAmount - current) * 0.1;
                setCount(Math.floor(current));
                setBaseCount(Math.floor(current));
                requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }
    }, [isCalculating, targetAmount, impact]);

    // Live Ticker Effect: Increment by small random amounts for "rising digits" feel
    useEffect(() => {
        if (isCalculating) return;

        const tick = () => {
            const extra = Number((Math.random() * 0.05).toFixed(2));
            setCount(prev => prev + extra);

            // Random interval between 1-3 seconds
            const nextTick = 1000 + Math.random() * 2000;
            setTimeout(tick, nextTick);
        };

        const timeoutId = setTimeout(tick, 2000);
        return () => clearTimeout(timeoutId);
    }, [isCalculating]);

    const handleUpgrade = () => {
        impact('heavy');
        if (user?.is_pro) {
            window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'pro' }));
        } else {
            window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'subscription' }));
        }
        setShowFunnel(false);
    };

    const nextStep = () => {
        selection();
        setFunnelStep(prev => prev + 1);
    };

    const funnelStages = [
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
    ];

    return (
        <div className={clsx(
            "relative w-full h-[460px] md:h-[520px] flex items-center justify-center overflow-hidden rounded-3xl md:rounded-[2rem] border transition-all duration-700",
            "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 shadow-2xl",
            "group"
        )}>
            {/* ── PREMIUM NEURAL BACKGROUND ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60 dark:opacity-80">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.15),transparent_70%)]" />
                <div className="circuit-decor opacity-40 dark:opacity-60" />

                {/* Visual Neural Connections */}
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
            </div>

            <AnimatePresence mode="wait">
                {!showFunnel ? (
                    <m.div
                        key="graph"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                        className="absolute inset-0 flex flex-col items-center justify-center p-6"
                    >
                        {/* ── CENTER HUB (USER) ── */}
                        <div className="relative z-20 mb-12">
                            <m.div
                                animate={{
                                    boxShadow: [
                                        "0 0 20px rgba(99,102,241,0.2)",
                                        "0 0 60px rgba(99,102,241,0.4)",
                                        "0 0 20px rgba(99,102,241,0.2)"
                                    ]
                                }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[2.5rem] p-[3px] bg-linear-to-tr from-indigo-600 via-blue-400 to-indigo-600"
                            >
                                <div className="w-full h-full rounded-[2.3rem] overflow-hidden border-2 border-white dark:border-slate-900 bg-slate-900 relative">
                                    {user?.photo_url ? (
                                        <img src={user.photo_url} alt="You" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-10 h-10 text-white/50" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/10 to-transparent animate-shimmer" />
                                </div>
                            </m.div>

                            <m.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-1 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-label font-bold uppercase tracking-[0.2em] shadow-xl border border-white/10 dark:border-black/5"
                            >
                                {t('income.network.core', { defaultValue: 'CORE HUB ACTIVATED' })}
                            </m.div>
                        </div>

                        {/* ── DISTRIBUTED NODES ── */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-[20%] left-[15%]"><MemberAvatar delay={0.1} /></div>
                            <div className="absolute top-[15%] right-[20%]"><MemberAvatar delay={0.3} pro /></div>
                            <div className="absolute bottom-[25%] left-[20%]"><MemberAvatar delay={0.5} pro /></div>
                            <div className="absolute bottom-[20%] right-[15%]"><MemberAvatar delay={0.7} /></div>
                        </div>

                        {/* ── CALCULATION COUNTER ── */}
                        <m.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-20 md:mt-24 text-center z-30 w-full max-w-[300px]"
                        >
                            <div className="relative px-5 py-4 md:px-6 md:py-5 rounded-2xl bg-slate-950/90 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden">
                                <div className="absolute inset-0 bg-linear-to-tr from-indigo-500/10 to-emerald-500/10" />

                                <span className="text-label font-bold uppercase tracking-[0.3em] text-indigo-400 mb-2 block">
                                    {t('income.network.yield', { defaultValue: 'PROJECTED MONTHLY YIELD' })}
                                </span>

                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-4xl sm:text-5xl font-bold tabular-nums tracking-tighter text-white">
                                        ${Math.floor(count).toLocaleString()}
                                    </span>
                                    <span className="text-lg font-bold text-indigo-500">
                                        .{Math.floor((count % 1) * 100).toString().padStart(2, '0')}
                                    </span>
                                </div>

                                <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-px">
                                    <m.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(count / 43200) * 100}%` }}
                                        className="h-full bg-linear-to-r from-indigo-500 via-blue-400 to-emerald-400 rounded-full"
                                    />
                                </div>

                                <div className="mt-3 flex justify-between items-center text-label font-bold text-white/30 uppercase tracking-widest">
                                    <span>{t('income.math.per_min', { defaultValue: '$1/MIN' })}</span>
                                    <span>{t('marketing.max_dividends', { defaultValue: 'MAX DIVIDENDS' })}</span>
                                </div>
                            </div>
                        </m.div>

                        {/* ── AMBIENT FLOATING DIVIDENDS ── */}
                        {[...Array(5)].map((_, i) => (
                            <m.div
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: [0, 0.4, 0],
                                    y: [0, -50],
                                    x: [0, (i % 2 === 0 ? 30 : -30)]
                                }}
                                transition={{
                                    duration: 8,
                                    delay: i * 2,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                                className="absolute text-label sm:text-xs font-bold text-emerald-500 pointer-events-none"
                                style={{
                                    top: `${20 + i * 15}%`,
                                    left: `${15 + (i * 17) % 70}%`
                                }}
                            >
                                +$8.64
                            </m.div>
                        ))}
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
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-5 px-4">
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
                                            onClick={() => { setShowFunnel(false); setFunnelStep(0); setIsCalculating(false); }}
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
};

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


