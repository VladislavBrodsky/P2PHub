import { motion, AnimatePresence } from 'framer-motion';
import { User, Globe } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useUser } from '../../context/UserContext';
import { USDTLogo } from '../ui/USDTLogo';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

export const ReferralGraph = () => {
    const { t } = useTranslation();
    const { user } = useUser();
    const [count, setCount] = useState(0);
    const [visibleNodes, setVisibleNodes] = useState(0);

    // Optimized counter animation for income - reduced frequency
    useEffect(() => {
        const interval = setInterval(() => {
            setCount(prev => {
                if (prev >= 43200) {
                    clearInterval(interval);
                    return 43200;
                }
                // Human eye can't track 20ms updates clearly. 100ms is much better for CPU.
                return prev + 432;
            });
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // "Fractal Growth" - Slowly add nodes to the network
    useEffect(() => {
        const timer = setInterval(() => {
            setVisibleNodes(prev => (prev < 30 ? prev + 1 : prev));
        }, 1500); // New node every 1.5s
        return () => clearInterval(timer);
    }, []);

    // Atomic Orbital Configuration
    const atomicOrbits = useMemo(() => [
        { id: 'alpha', radius: 110, duration: 12, color: 'border-blue-500/40', rx: 70, rz: 0, nodes: 4 },
        { id: 'beta', radius: 150, duration: 18, color: 'border-emerald-500/30', rx: 70, rz: 120, nodes: 6 },
        { id: 'gamma', radius: 190, duration: 24, color: 'border-indigo-500/20', rx: 70, rz: 240, nodes: 8 },
    ], []);

    // Income Pops Configuration (Fractal Dividends with USDT)
    const pops = useMemo(() => [
        { id: 1, amount: "33.00", style: "top-[15%] left-[20%]", delay: 0, scale: 1.1 },
        { id: 2, amount: "0.30", style: "bottom-[25%] right-[15%]", delay: 0.5, scale: 0.8 },
        { id: 3, amount: "12.50", style: "top-[25%] right-[10%]", delay: 1.2, scale: 1.0 },
        { id: 4, amount: "0.75", style: "bottom-[15%] left-[25%]", delay: 1.8, scale: 0.85 },
        { id: 5, amount: "100.00", style: "top-[5%] right-[40%]", delay: 2.5, scale: 1.2 },
    ], []);

    return (
        <div className={clsx(
            "relative w-full h-[400px] flex items-center justify-center overflow-hidden rounded-[2.5rem] border transition-all duration-500 shadow-xl perspective-1000",
            "bg-linear-to-b from-blue-50/50 to-indigo-50/30 border-blue-500/10",
            "dark:bg-[#020617] dark:border-white/5"
        )}>
            {/* 1. Starfield / Global Context */}
            <div className={clsx(
                "absolute inset-0 transition-opacity duration-700 pointer-events-none",
                "bg-[radial-gradient(circle_at_center,var(--color-blue-500)_0%,transparent_70%)]",
                "opacity-10 dark:opacity-5"
            )} />

            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
                >
                    <Globe className="w-[600px] h-[600px] text-blue-500 dark:text-blue-500/30" strokeWidth={0.2} />
                </motion.div>
            </div>

            {/* 2. 3D Atomic Orbitals */}
            <div className="absolute inset-0 flex items-center justify-center preserve-3d">
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
                                    className="absolute top-1/2 left-1/2 w-3 h-3 -ml-1.5 -mt-1.5 rounded-full flex items-center justify-center bg-white shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                    style={{
                                        transform: `rotate(${(360 / orbit.nodes) * j}deg) translate(${orbit.radius * 0.9}px) rotate(-${(360 / orbit.nodes) * j}deg)`
                                    }}
                                >
                                    <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-30" />
                                </motion.div>
                            );
                        })}
                    </motion.div>
                ))}
            </div>

            {/* Core Team (Atom Nucleus Support) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
            <div className="relative z-20 flex flex-col items-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5, duration: 1 }}
                    className="relative w-24 h-24 rounded-full p-[3px] bg-linear-to-tr from-blue-600 via-emerald-500 to-indigo-600 shadow-2xl"
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
                        "mt-4 px-3 py-1 rounded-full border backdrop-blur-xl flex items-center gap-2",
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
                            duration: 4,
                            delay: pop.delay,
                            repeat: Infinity,
                            repeatDelay: 2
                        }}
                        className={clsx(
                            "absolute z-30 flex items-center gap-2 px-2.5 py-1.5 rounded-xl backdrop-blur-2xl border shadow-xl transition-colors duration-500",
                            "bg-white/80 border-blue-500/20",
                            "dark:bg-black/40 dark:border-white/10",
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
                    <div className="absolute inset-0 bg-linear-to-r from-blue-600/20 to-emerald-600/20 blur-2xl opacity-40" />
                    <div className={clsx(
                        "relative px-4 py-3 backdrop-blur-2xl border rounded-2xl flex flex-col items-center gap-0.5 shadow-premium transition-colors duration-500",
                        "bg-white/70 border-blue-500/10",
                        "dark:bg-slate-900/50 dark:border-white/5"
                    )}>
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                            {t('income.network.yield')}
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
                                ${count.toLocaleString()}
                            </span>
                            <span className="text-sm font-black text-emerald-500 italic">.00</span>
                        </div>
                        <div className="w-full h-1 rounded-full mt-1.5 overflow-hidden bg-slate-200 dark:bg-white/5">
                            <motion.div
                                className="h-full bg-linear-to-r from-blue-500 to-emerald-500"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 5, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};


