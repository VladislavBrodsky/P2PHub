import { motion, AnimatePresence } from 'framer-motion';
import { User, Globe } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useUser } from '../../context/UserContext';
import { USDTLogo } from '../ui/USDTLogo';
import clsx from 'clsx';

export const ReferralGraph = () => {
    const { user } = useUser();
    const [count, setCount] = useState(0);
    const [visibleNodes, setVisibleNodes] = useState(0);

    // Fast counter animation for income
    useEffect(() => {
        const interval = setInterval(() => {
            setCount(prev => {
                if (prev >= 43200) {
                    clearInterval(interval);
                    return 43200;
                }
                return prev + 432;
            });
        }, 20);
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
            "relative w-full h-[450px] flex items-center justify-center overflow-hidden rounded-[3.5rem] border transition-all duration-500 shadow-2xl perspective-1000",
            "bg-linear-to-b from-blue-50/80 to-indigo-50/50 border-blue-500/10", // Light mode (Base)
            "dark:bg-[#020617] dark:border-white/5" // Dark mode
        )}>
            {/* 1. Starfield / Global Context */}
            <div className={clsx(
                "absolute inset-0 transition-opacity duration-700 pointer-events-none",
                "bg-[radial-gradient(circle_at_center,var(--color-blue-500)_0%,transparent_70%)]",
                "opacity-20 dark:opacity-10" // Adjusted for light/dark
            )} />

            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
                >
                    <Globe className={clsx("w-[800px] h-[800px]", "text-blue-500 dark:text-blue-500/50")} strokeWidth={0.2} />
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
                            "dark:opacity-100 opacity-60"
                        )}
                        style={{
                            width: orbit.radius * 2,
                            height: orbit.radius * 2,
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
                                    className={clsx(
                                        "absolute top-1/2 left-1/2 w-4 h-4 -ml-2 -mt-2 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] flex items-center justify-center",
                                        "bg-white dark:bg-white",
                                        "shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                    )}
                                    style={{
                                        transform: `rotate(${(360 / orbit.nodes) * j}deg) translate(${orbit.radius}px) rotate(-${(360 / orbit.nodes) * j}deg)`
                                    }}
                                >
                                    {/* Sub-Orbital "Fractal" dots */}
                                    <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-40" />
                                    <div className="absolute -inset-2 border border-blue-500/20 rounded-full animate-spin-slow" />

                                    {/* Micro-orbital fractal dots */}
                                    {[...Array(2)].map((_, k) => (
                                        <motion.div
                                            key={k}
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 3 + k, repeat: Infinity, ease: "linear" }}
                                            className="absolute w-full h-full"
                                        >
                                            <div
                                                className="w-1 h-1 bg-white/40 dark:bg-white/40 rounded-full bg-blue-500/40"
                                                style={{ transform: `rotate(${k * 180}deg) translate(8px)` }}
                                            />
                                        </motion.div>
                                    ))}
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
                        style={{ width: 80, height: 80 }}
                    >
                        <div
                            className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                            style={{ transform: `rotate(${i * 120}deg) translate(40px)` }}
                        />
                    </motion.div>
                ))}
            </div>

            {/* 3. Center Nucleus (User) */}
            <div className="relative z-20 flex flex-col items-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5, duration: 1 }}
                    className="relative w-28 h-28 rounded-full p-[4px] bg-linear-to-tr from-blue-600 via-emerald-500 to-indigo-600 shadow-[0_0_80px_rgba(59,130,246,0.3)]"
                >
                    <div className={clsx(
                        "w-full h-full rounded-full overflow-hidden border-4 relative",
                        "bg-black border-[#020617] dark:bg-black dark:border-[#020617]",
                        "border-white"
                    )}>
                        {user && user.photo_url ? (
                            <img src={user.photo_url} alt="You" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                <User className="w-10 h-10 text-white opacity-50" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/10 to-transparent animate-shimmer" />
                    </div>

                    {/* Nucleus Glow */}
                    <div className="absolute -inset-10 bg-blue-500/10 blur-3xl animate-pulse rounded-full" />
                </motion.div>

                {/* Viral Label */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className={clsx(
                        "mt-6 px-4 py-1.5 rounded-full border backdrop-blur-xl flex items-center gap-2",
                        "bg-emerald-500/10 border-emerald-500/20",
                        "bg-emerald-500/5 border-emerald-500/10"
                    )}
                >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className={clsx(
                        "text-[10px] font-black uppercase tracking-[0.2em]",
                        "text-emerald-400 dark:text-emerald-400",
                        "text-emerald-600"
                    )}>Viral Network Core</span>
                </motion.div>
            </div>

            {/* 4. USDT Income Pops (The "Earnings" Layer) */}
            <AnimatePresence>
                {pops.map((pop) => (
                    <motion.div
                        key={pop.id}
                        initial={{ opacity: 0, scale: 0, y: 0 }}
                        animate={{
                            opacity: [0, 1, 1, 0],
                            scale: [0, pop.scale, pop.scale, 0],
                            y: [-20, -60, -80, -100],
                            x: [0, Math.random() * 40 - 20, Math.random() * 80 - 40, 0]
                        }}
                        transition={{
                            duration: 4,
                            delay: pop.delay,
                            repeat: Infinity,
                            repeatDelay: 2
                        }}
                        className={clsx(
                            "absolute z-30 flex items-center gap-2 px-3 py-2 rounded-2xl backdrop-blur-2xl border shadow-2xl transition-colors duration-500",
                            "border-white/10 bg-black/40 dark:border-white/10 dark:bg-black/40",
                            "border-blue-500/20 bg-white/60",
                            pop.style
                        )}
                    >
                        <USDTLogo className="w-5 h-5 shadow-inner" />
                        <div className="flex flex-col">
                            <span className={clsx(
                                "text-[10px] font-bold leading-none",
                                "text-emerald-400/60 dark:text-emerald-400/60",
                                "text-emerald-600/60"
                            )}>RECEIVED</span>
                            <span className={clsx(
                                "font-black text-sm tracking-tighter",
                                "text-white dark:text-white",
                                "text-slate-900"
                            )}>${pop.amount}</span>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* 5. Passive Income Counter (Glass Panel) */}
            <div className="absolute bottom-6 z-40 w-full flex justify-center px-4">
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="relative w-full max-w-[320px]"
                >
                    <div className="absolute inset-0 bg-linear-to-r from-blue-600/20 to-emerald-600/20 blur-2xl opacity-50" />
                    <div className={clsx(
                        "relative px-6 py-4 backdrop-blur-2xl border rounded-3xl flex flex-col items-center gap-0.5 shadow-premium transition-colors duration-500",
                        "bg-slate-900/40 border-white/10 dark:bg-slate-900/40 dark:border-white/10",
                        "bg-white/60 border-blue-500/10"
                    )}>
                        <span className={clsx(
                            "text-[9px] font-black uppercase tracking-[0.3em]",
                            "text-slate-400 dark:text-slate-400",
                            "text-slate-500"
                        )}>Estimated Network Yield</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className={clsx(
                                "text-4xl font-black tracking-tighter",
                                "text-white dark:text-white",
                                "text-slate-900"
                            )}>
                                ${count.toLocaleString()}
                            </span>
                            <span className="text-lg font-black text-emerald-500 italic">.00</span>
                        </div>
                        <div className={clsx(
                            "w-full h-1 rounded-full mt-2 overflow-hidden",
                            "bg-white/5 dark:bg-white/5",
                            "bg-slate-200"
                        )}>
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

