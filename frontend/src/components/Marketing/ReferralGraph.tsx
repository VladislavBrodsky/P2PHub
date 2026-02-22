import { m, AnimatePresence } from 'framer-motion';
import { User, Globe, Network, AlertCircle, Brain, Zap, TrendingUp, ChevronRight, Sparkles, Users } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useUser } from '../../context/UserContext';
import { USDTLogo } from '../ui/USDTLogo';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useHaptic } from '../../hooks/useHaptic';
import clsx from 'clsx';

export const ReferralGraph = () => {
    const { t } = useTranslation(['marketing', 'common']);
    const { user } = useUser();
    const { selection, impact } = useHaptic();

    const [showFunnel, setShowFunnel] = useState(false);
    const [funnelStep, setFunnelStep] = useState(0);
    const [count, setCount] = useState(0);
    const [isCalculating, setIsCalculating] = useState(true);

    const partnersCount = useMemo(() => {
        const seed = Math.floor(Date.now() / (3 * 60 * 60 * 1000));
        const pseudoRandom = Math.abs(Math.sin(seed * 12345));
        return Math.floor(pseudoRandom * (765 - 333 + 1)) + 333;
    }, []);

    // ── HIGH-VELOCITY CALCULATION LOGIC ──
    useEffect(() => {
        if (!isCalculating) return;

        const duration = 4000; // 4 seconds total
        const startTime = Date.now();
        const target = 43200;

        const update = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic for more 'anticipation' at the end
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(easeOutCubic * target));

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                impact('medium');
                setTimeout(() => {
                    setIsCalculating(false);
                    setShowFunnel(true);
                }, 800);
            }
        };

        requestAnimationFrame(update);
    }, [isCalculating, impact]);

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
            "relative w-full h-[520px] flex items-center justify-center overflow-hidden rounded-[3rem] border transition-all duration-700",
            "bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 shadow-2xl",
            "group"
        )}>
            {/* ── PREMIUM NEURAL BACKGROUND ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40 dark:opacity-60">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.08),transparent_70%)]" />
                <div className="circuit-decor" />

                {/* Visual Neural Connections */}
                <svg className="absolute inset-0 w-full h-full opacity-30">
                    <m.path
                        d="M100,250 Q250,100 400,250 T700,250"
                        stroke="currentColor"
                        strokeWidth="1"
                        fill="none"
                        className="text-indigo-500/30"
                        animate={{ strokeDashoffset: [0, 100] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        style={{ strokeDasharray: "5, 5" }}
                    />
                    <m.path
                        d="M-50,400 Q200,550 450,400 T950,400"
                        stroke="currentColor"
                        strokeWidth="1"
                        fill="none"
                        className="text-emerald-500/30"
                        animate={{ strokeDashoffset: [100, 0] }}
                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                        style={{ strokeDasharray: "5, 5" }}
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
                                className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-1 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl border border-white/10 dark:border-black/5"
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
                            className="mt-16 sm:mt-24 text-center z-30 w-full max-w-[300px]"
                        >
                            <div className="relative px-6 py-5 rounded-[2rem] bg-slate-950/90 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden">
                                <div className="absolute inset-0 bg-linear-to-tr from-indigo-500/10 to-emerald-500/10" />

                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2 block">
                                    {t('income.network.yield', { defaultValue: 'PROJECTED PROJECTED MONTHLY YIELD' })}
                                </span>

                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-4xl sm:text-5xl font-black tabular-nums tracking-tighter text-white">
                                        ${count.toLocaleString()}
                                    </span>
                                    <span className="text-lg font-black text-indigo-500">.00</span>
                                </div>

                                <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-px">
                                    <m.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(count / 43200) * 100}%` }}
                                        className="h-full bg-linear-to-r from-indigo-500 via-blue-400 to-emerald-400 rounded-full"
                                    />
                                </div>

                                <div className="mt-3 flex justify-between items-center text-[8px] font-black text-white/30 uppercase tracking-widest">
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
                                className="absolute text-[10px] sm:text-xs font-black text-emerald-500 pointer-events-none"
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
                        className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 bg-white/95 dark:bg-slate-950/95 backdrop-blur-3xl text-center"
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
                                        "w-20 h-20 rounded-3xl flex items-center justify-center border shadow-2xl mb-8 transition-all duration-500",
                                        funnelStages[funnelStep].color,
                                        funnelStages[funnelStep].borderColor
                                    )}>
                                        {funnelStages[funnelStep].icon}
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">
                                        {funnelStages[funnelStep].title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-10 px-4">
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
                                            className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
                                        >
                                            {t('common.next', { defaultValue: 'Next' })}
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setShowFunnel(false)}
                                            className="text-[9px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-white uppercase tracking-[0.3em] transition-colors"
                                        >
                                            {t('common.close', { defaultValue: 'Close' })}
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
                                    <div className="relative mb-10">
                                        <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-30 animate-pulse" />
                                        <div className="w-24 h-24 rounded-[2rem] bg-white dark:bg-slate-900 border-2 border-emerald-500/50 flex items-center justify-center relative z-10 shadow-2xl">
                                            <Sparkles className="w-12 h-12 text-emerald-500" />
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-10 text-center">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase leading-tight pb-1">
                                            {t('viral_funnel.cta', { defaultValue: 'Activate My Node' })}
                                        </h3>
                                        <div className="w-12 h-1.5 bg-emerald-500 mx-auto rounded-full" />
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                                            {t('viral_funnel.elite_users', { defaultValue: 'OFFER LIMITED TO FIRST 5,000 PARTNERS' })}
                                        </p>
                                    </div>

                                    <div className="w-full space-y-4">
                                        <button
                                            onClick={handleUpgrade}
                                            className="w-full h-16 vibing-emerald-animated rounded-2xl text-white font-black text-sm uppercase tracking-widest shadow-[0_20px_60px_-10px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
                                        >
                                            {t('viral_funnel.cta', { defaultValue: 'Activate My Node' })}
                                            <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                        </button>

                                        <button
                                            onClick={() => { setShowFunnel(false); setFunnelStep(0); setIsCalculating(false); }}
                                            className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-slate-900 dark:hover:text-white transition-colors"
                                        >
                                            {t('common.close', { defaultValue: 'Close' })}
                                        </button>
                                    </div>

                                    {/* Social Proof Footer */}
                                    <div className="mt-12 p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 w-full flex items-center gap-4">
                                        <div className="flex -space-x-3 shrink-0">
                                            {[1, 2, 3, 4].map(i => (
                                                <img
                                                    key={i}
                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + partnersCount}`}
                                                    className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200"
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


