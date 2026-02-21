import { motion, AnimatePresence } from 'framer-motion';
import { User, Globe, Network, AlertCircle, Brain, Zap, TrendingUp, ChevronRight, Sparkles } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useUser } from '../../context/UserContext';
import { USDTLogo } from '../ui/USDTLogo';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useHaptic } from '../../hooks/useHaptic';
import clsx from 'clsx';

export const ReferralGraph = () => {
    const { t } = useTranslation();
    const { user } = useUser();
    const { selection, impact } = useHaptic();
    const [count, setCount] = useState(0);
    const [visibleNodes, setVisibleNodes] = useState(0);

    const { showNotification } = useNotificationStore();
    const [hasNotified, setHasNotified] = useState(false);

    const [showFunnel, setShowFunnel] = useState(false);
    const [funnelStep, setFunnelStep] = useState(0);

    // Optimized counter animation for income - reduced frequency
    useEffect(() => {
        const interval = setInterval(() => {
            setCount(prev => {
                if (prev >= 43200) {
                    clearInterval(interval);
                    if (!hasNotified) {
                        setShowFunnel(true);
                        setHasNotified(true);
                    }
                    return 43200;
                }
                // Slower increment for more anticipation
                return prev + 216;
            });
        }, 120); // Slightly slower interval too
        return () => clearInterval(interval);
    }, [hasNotified, t]);

    // "Fractal Growth" - Slowly add nodes to the network
    useEffect(() => {
        const timer = setInterval(() => {
            setVisibleNodes(prev => (prev < 30 ? prev + 1 : prev));
        }, 1500); // New node every 1.5s
        return () => clearInterval(timer);
    }, []);

    // Viral Network Atomic Orbital Configuration
    const atomicOrbits = useMemo(() => [
        { id: 'alpha', radius: 110, duration: 12, color: 'border-emerald-500/50', rx: 70, rz: 0, nodes: 4 },
        { id: 'beta', radius: 150, duration: 18, color: 'border-teal-400/40', rx: 70, rz: 120, nodes: 6 },
        { id: 'gamma', radius: 190, duration: 24, color: 'border-green-400/30', rx: 70, rz: 240, nodes: 8 },
    ], []);

    // Income Pops Configuration (Fractal Dividends with USDT) - Slowed down and more spaced out
    const pops = useMemo(() => [
        { id: 1, amount: "33.00", style: "top-[15%] left-[20%]", delay: 0, scale: 1.1 },
        { id: 2, amount: "0.30", style: "bottom-[25%] right-[15%]", delay: 2, scale: 0.8 },
        { id: 3, amount: "12.50", style: "top-[25%] right-[10%]", delay: 4.5, scale: 1.0 },
        { id: 4, amount: "0.75", style: "bottom-[15%] left-[25%]", delay: 7, scale: 0.85 },
        { id: 5, amount: "100.00", style: "top-[5%] right-[40%]", delay: 10, scale: 1.2 },
    ], []);

    const nextStep = () => {
        selection();
        setFunnelStep(prev => prev + 1);
    };

    const handleUpgrade = () => {
        impact('heavy');
        window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'subscription' }));
    };

    const funnelStages = [
        {
            icon: <AlertCircle className="w-12 h-12 text-amber-500" />,
            title: t('viral_funnel.step1_title'),
            desc: t('viral_funnel.step1_desc'),
            color: 'from-amber-500/20 to-orange-500/20',
            borderColor: 'border-amber-500/30'
        },
        {
            icon: <Brain className="w-12 h-12 text-blue-500" />,
            title: t('viral_funnel.step2_title'),
            desc: t('viral_funnel.step2_desc'),
            color: 'from-blue-500/20 to-indigo-500/20',
            borderColor: 'border-blue-500/30'
        },
        {
            icon: <Zap className="w-12 h-12 text-yellow-500" />,
            title: t('viral_funnel.step3_title'),
            desc: t('viral_funnel.step3_desc'),
            color: 'from-yellow-500/20 to-orange-500/20',
            borderColor: 'border-yellow-500/30'
        },
        {
            icon: <TrendingUp className="w-12 h-12 text-emerald-500" />,
            title: t('viral_funnel.step4_title'),
            desc: t('viral_funnel.step4_desc'),
            color: 'from-emerald-500/20 to-teal-500/20',
            borderColor: 'border-emerald-500/30'
        }
    ];

    return (
        <div className={clsx(
            "relative w-full h-[480px] flex items-center justify-center overflow-hidden rounded-[2.5rem] border transition-all duration-700",
            !showFunnel && "perspective-1000",
            "bg-linear-to-b from-emerald-50/50 to-teal-50/30 border-emerald-500/20",
            "dark:bg-(--color-bg-app) dark:border-emerald-500/20",
            "shadow-[0_20px_50px_-15px_rgba(16,185,129,0.3)] dark:shadow-[inset_0_0_80px_rgba(16,185,129,0.05),0_0_40px_-10px_rgba(16,185,129,0.2)]",
            "group overflow-x-hidden"
        )}>
            <AnimatePresence mode="wait">
                {!showFunnel ? (
                    <motion.div
                        key="graph"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        {/* 1. Viral Network Sub-Grid Backdrop */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-size-[30px_30px] mask-[radial-gradient(ellipse_at_center,white,transparent_80%)] pointer-events-none" />

                        {/* Core Radar Sweep Effect */}
                        <motion.div
                            className="absolute text-emerald-500/10 pointer-events-none z-0"
                            style={{ width: '200%', height: '200%', top: '50%', left: '50%', background: 'conic-gradient(from 0deg, transparent 70%, rgba(16,185,129,0.2) 100%)', borderRadius: '50%' }}
                            animate={{ rotate: 360, x: '-50%', y: '-50%' }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        />

                        {/* Ambient Starfield Glow */}
                        <div className={clsx(
                            "absolute inset-0 transition-opacity duration-700 pointer-events-none",
                            "bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15)_0%,transparent_70%)]",
                            "opacity-100"
                        )} />

                        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none overflow-hidden">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
                            >
                                <Globe className="w-[150%] h-[150%] text-emerald-500 dark:text-emerald-500/40 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" strokeWidth={0.2} />
                            </motion.div>
                        </div>

                        {/* 2. 3D Atomic Orbitals */}
                        <div className="absolute inset-0 flex items-center justify-center preserve-3d -translate-y-6">
                            {atomicOrbits.map((orbit) => (
                                <motion.div
                                    key={orbit.id}
                                    className={clsx(
                                        "absolute rounded-full border border-dashed transition-colors duration-700",
                                        orbit.color,
                                        "opacity-40 dark:opacity-20"
                                    )}
                                    style={{
                                        width: orbit.radius * 1.8,
                                        height: orbit.radius * 1.8,
                                        rotateX: orbit.rx,
                                        rotateZ: orbit.rz
                                    }}
                                    animate={{ rotateY: 360 }}
                                    transition={{ duration: orbit.duration, repeat: Infinity, ease: "linear" }}
                                >
                                    {/* Nodes on this orbital path */}
                                    {[...Array(orbit.nodes)].map((_, j) => {
                                        const nodeIndex = atomicOrbits.findIndex(o => o.id === orbit.id) * 6 + j;
                                        if (nodeIndex >= visibleNodes) return null;

                                        return (
                                            <motion.div
                                                key={j}
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="absolute top-1/2 left-1/2 w-3 h-3 -ml-1.5 -mt-1.5 rounded-full flex items-center justify-center bg-white shadow-[0_0_15px_rgba(16,185,129,0.8)]"
                                                style={{
                                                    transform: `rotate(${(360 / orbit.nodes) * j}deg) translate(${orbit.radius * 0.9}px) rotate(-${(360 / orbit.nodes) * j}deg)`
                                                }}
                                            >
                                                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-60 mix-blend-screen" />
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            ))}
                        </div>

                        {/* Core Team (Atom Nucleus Support) */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -translate-y-6">
                            {[...Array(3)].map((_, i) => (
                                <motion.div
                                    key={`team-${i}`}
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10 + i * 5, repeat: Infinity, ease: "linear" }}
                                    className="absolute"
                                    style={{ width: 70, height: 70 }}
                                >
                                    <div
                                        className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                                        style={{ transform: `rotate(${i * 120}deg) translate(35px)` }}
                                    />
                                </motion.div>
                            ))}
                        </div>

                        {/* 3. Center Nucleus (User) - Compacted */}
                        <div className="relative z-20 flex flex-col items-center -translate-y-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", bounce: 0.5, duration: 1 }}
                                className="relative w-24 h-24 rounded-full p-[3px] bg-linear-to-tr from-emerald-600 via-teal-400 to-green-600 shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                            >
                                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white dark:border-[#020617] bg-slate-900 relative">
                                    {user && user.photo_url ? (
                                        <img src={user.photo_url} alt="You" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-8 h-8 text-white opacity-50" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/10 to-transparent animate-shimmer" />
                                </div>
                            </motion.div>

                            {/* Viral Label - High Contrast */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className={clsx(
                                    "mt-3 px-3 py-1 rounded-full border backdrop-blur-xl flex items-center gap-2",
                                    "bg-emerald-500/10 border-emerald-500/30",
                                    "dark:bg-emerald-500/5 dark:border-emerald-500/20"
                                )}
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                                    {t('income.network.core')}
                                </span>
                            </motion.div>
                        </div>

                        {/* 4. USDT Income Pops - Fixed Contrast */}
                        <AnimatePresence>
                            {pops.map((pop) => (
                                <motion.div
                                    key={pop.id}
                                    initial={{ opacity: 0, scale: 0, y: 0 }}
                                    animate={{
                                        opacity: [0, 1, 1, 0],
                                        scale: [0, pop.scale * 0.9, pop.scale * 0.9, 0],
                                        y: [-10, -40, -60, -80],
                                        x: [0, Math.random() * 30 - 15, Math.random() * 60 - 30, 0]
                                    }}
                                    transition={{
                                        duration: 6,
                                        delay: pop.delay,
                                        repeat: Infinity,
                                        repeatDelay: 5
                                    }}
                                    className={clsx(
                                        "absolute z-30 flex items-center gap-2 px-2.5 py-1.5 rounded-xl backdrop-blur-2xl border transition-colors duration-500 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.4)]",
                                        "bg-white/90 border-emerald-500/30",
                                        "dark:bg-black/60 dark:border-emerald-500/20",
                                        pop.style
                                    )}
                                >
                                    <USDTLogo className="w-4 h-4 shadow-inner" />
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-bold leading-none text-emerald-600/80 dark:text-emerald-400/60">
                                            {t('income.network.received')}
                                        </span>
                                        <span className="font-black text-xs tracking-tighter text-slate-900 dark:text-white">
                                            ${pop.amount}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* 5. Passive Income Counter - Minimalist & Fixed Contrast */}
                        <div className="absolute bottom-4 z-40 w-full flex justify-center px-4">
                            <motion.div
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="relative w-full max-w-[280px]"
                            >
                                <div className="absolute inset-0 bg-linear-to-r from-emerald-600/30 to-teal-500/20 blur-2xl opacity-60 dark:opacity-40 animate-pulse" />
                                <div className={clsx(
                                    "relative px-5 py-4 backdrop-blur-2xl border rounded-2xl flex flex-col items-center gap-1 transition-colors duration-500",
                                    "bg-white/80 border-emerald-500/20 shadow-[0_10px_20px_-5px_rgba(16,185,129,0.15)]",
                                    "dark:bg-[#020a06]/80 dark:border-emerald-500/30 dark:shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)]"
                                )}>
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-emerald-400/80">
                                        {t('income.network.yield')}
                                    </span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                            ${count.toLocaleString()}
                                        </span>
                                        <span className="text-sm font-black text-emerald-500">.00</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full mt-3 overflow-hidden bg-slate-200 dark:bg-emerald-950/50 shadow-inner block relative">
                                        <motion.div
                                            className="h-full bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-500 absolute top-0 left-0"
                                            initial={{ width: "0%" }}
                                            animate={{ width: `${(count / 43200) * 100}%` }}
                                            transition={{ type: "spring", stiffness: 50, damping: 20 }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="funnel"
                        initial={{ opacity: 0, y: 20, scale: 1.1 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 bg-white/90 dark:bg-[#020617]/90 rounded-[2.5rem] backdrop-blur-2xl text-center shadow-[inset_0_0_50px_rgba(0,0,0,0.05)] dark:shadow-none"
                    >
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
                        </div>

                        <AnimatePresence mode="wait">
                            {funnelStep < funnelStages.length ? (
                                <motion.div
                                    key={funnelStep}
                                    initial={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
                                    className="w-full max-w-sm flex flex-col items-center gap-6"
                                >
                                    <div className={clsx(
                                        "w-24 h-24 rounded-[3rem] flex items-center justify-center bg-linear-to-br border shadow-xl animate-float transition-all",
                                        funnelStages[funnelStep].color,
                                        funnelStages[funnelStep].borderColor,
                                        "dark:bg-opacity-20"
                                    )}>
                                        {funnelStages[funnelStep].icon}
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md">
                                            {funnelStages[funnelStep].title}
                                        </h3>
                                        <div className="w-12 h-1 bg-emerald-500 mx-auto rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                        <p className="text-[13px] font-bold text-slate-600 dark:text-white/70 uppercase tracking-widest leading-relaxed px-4">
                                            {funnelStages[funnelStep].desc}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 w-full mt-4">
                                        <div className="flex justify-center gap-1.5 mb-2">
                                            {funnelStages.map((_, i) => (
                                                <div key={i} className={clsx("h-1 rounded-full transition-all duration-300", i === funnelStep ? "w-8 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" : "w-2 bg-slate-300 dark:bg-white/20")} />
                                            ))}
                                        </div>
                                        <button
                                            onClick={nextStep}
                                            className="w-full h-14 vibing-blue-animated rounded-full flex items-center justify-center gap-3 text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-transform"
                                        >
                                            <span>{t('blog.navigation.next')}</span>
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setShowFunnel(false)}
                                            className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.3em] hover:text-slate-600 dark:hover:text-white transition-colors mt-2"
                                        >
                                            {t('income.network.close')}
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="cta-final"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="w-full max-w-sm flex flex-col items-center gap-8"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-40 animate-pulse" />
                                        <div className="w-24 h-24 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-emerald-500/50 flex items-center justify-center relative z-10 shadow-xl">
                                            <Sparkles className="w-12 h-12 text-emerald-500 dark:text-emerald-400" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-linear-to-r from-emerald-600 via-slate-900 to-emerald-600 dark:from-emerald-400 dark:via-white dark:to-emerald-400 animate-text-shimmer">
                                            {t('viral_funnel.cta')}
                                        </h3>
                                        <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em]">
                                            92% OF ELITE USERS ACTIVATE NOW
                                        </p>
                                    </div>

                                    <div className="w-full space-y-4">
                                        <button
                                            onClick={handleUpgrade}
                                            className="w-full h-16 vibing-emerald-animated rounded-[2rem] text-white font-black text-sm uppercase tracking-[0.2em] shadow-[0_0_50px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-all group"
                                        >
                                            <div className="flex items-center justify-center gap-3">
                                                <span>{t('viral_funnel.cta')}</span>
                                                <Zap className="w-5 h-5 group-hover:scale-125 transition-transform" />
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => { setShowFunnel(false); setFunnelStep(0); }}
                                            className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.3em] hover:text-slate-600 dark:hover:text-white transition-colors"
                                        >
                                            {t('income.network.close')}
                                        </button>
                                    </div>

                                    {/* Small Social Proof Footer */}
                                    <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md">
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="flex -space-x-2">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="w-6 h-6 rounded-full border border-white dark:border-black bg-slate-200 dark:bg-slate-800" />
                                                ))}
                                            </div>
                                            <p className="text-[8px] font-bold text-slate-500 dark:text-white/50 uppercase leading-tight">
                                                12,402+ PARTNERS DEPLOYED<br />AUTONOMOUS NODES TODAY
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


