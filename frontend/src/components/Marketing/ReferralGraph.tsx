import { motion, AnimatePresence } from 'framer-motion';
import { User, Users, Globe, Zap } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useUser } from '../../context/UserContext';
import clsx from 'clsx';

export const ReferralGraph = () => {
    const { user } = useUser();
    const [count, setCount] = useState(0);

    // Fast counter animation
    useEffect(() => {
        const interval = setInterval(() => {
            setCount(prev => {
                if (prev >= 43200) {
                    clearInterval(interval);
                    return 43200;
                }
                return prev + 432; // Fast count up
            });
        }, 20);
        return () => clearInterval(interval);
    }, []);

    // Orbit Configuration
    const orbits = [
        { radius: 100, duration: 20, nodes: 6, opacity: 0.8, color: 'border-blue-500/30' },
        { radius: 180, duration: 35, nodes: 12, opacity: 0.5, color: 'border-indigo-500/20' },
        { radius: 260, duration: 50, nodes: 18, opacity: 0.3, color: 'border-purple-500/10' },
    ];

    // Income Pops Configuration (Fractal Dividends)
    const pops = useMemo(() => [
        { id: 1, amount: "$33.00", style: "top-20 left-20", delay: 0.5, scale: 1.1, type: 'major' },
        { id: 2, amount: "$0.30", style: "bottom-32 right-24", delay: 0.8, scale: 0.8, type: 'micro' },
        { id: 3, amount: "$12.50", style: "top-32 right-12", delay: 1.2, scale: 1.0, type: 'standard' },
        { id: 4, amount: "$0.75", style: "bottom-20 left-32", delay: 1.5, scale: 0.85, type: 'micro' },
        { id: 5, amount: "$5.00", style: "top-10 left-1/2", delay: 1.8, scale: 0.9, type: 'standard' },
        { id: 6, amount: "$99.00", style: "bottom-12 right-1/2", delay: 2.2, scale: 1.2, type: 'major' },
    ], []);

    return (
        <div className="relative w-full h-[450px] flex items-center justify-center overflow-hidden bg-[#0A0F1C] rounded-[3.5rem] border border-white/5 shadow-2xl perspectiv-1000">
            {/* 1. Global Background (Wireframe Globe) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
                >
                    <Globe className="w-[600px] h-[600px] text-blue-500" strokeWidth={0.5} />
                </motion.div>
            </div>

            {/* 2. Concentric Orbits */}
            <div className="absolute inset-0 flex items-center justify-center preserve-3d">
                {orbits.map((orbit, i) => (
                    <motion.div
                        key={i}
                        className={clsx("absolute rounded-full border border-dashed", orbit.color)}
                        style={{ width: orbit.radius * 2, height: orbit.radius * 2 }}
                        animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                        transition={{ duration: orbit.duration, repeat: Infinity, ease: "linear" }}
                    >
                        {/* Orbiting Satellite Nodes */}
                        {[...Array(orbit.nodes)].map((_, j) => (
                            <div
                                key={j}
                                className="absolute top-1/2 left-1/2 w-2 h-2 -ml-1 -mt-1 bg-white rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                                style={{
                                    transform: `rotate(${(360 / orbit.nodes) * j}deg) translate(${orbit.radius}px) rotate(-${(360 / orbit.nodes) * j}deg)`
                                }}
                            >
                                <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75" />
                            </div>
                        ))}
                    </motion.div>
                ))}
            </div>

            {/* 3. Center Hub (You) */}
            <div className="relative z-20 flex flex-col items-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5, duration: 1 }}
                    className="relative w-24 h-24 rounded-full p-[3px] bg-linear-to-tr from-blue-500 via-indigo-500 to-purple-600 shadow-[0_0_60px_rgba(59,130,246,0.5)]"
                >
                    <div className="w-full h-full rounded-full overflow-hidden bg-black border-[3px] border-black relative">
                        {user?.photo_url ? (
                            <img src={user.photo_url} alt="You" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                <User className="w-8 h-8 text-white" />
                            </div>
                        )}
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/20 to-transparent animate-shimmer" />
                    </div>

                    {/* Pulsing Rings */}
                    <div className="absolute -inset-4 border border-blue-500/30 rounded-full animate-ping opacity-20" />
                    <div className="absolute -inset-8 border border-indigo-500/20 rounded-full animate-ping opacity-10 animation-delay-500" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 flex flex-col items-center gap-1"
                >
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md">
                        <Globe className="w-3 h-3 text-blue-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Global Scale</span>
                    </div>
                </motion.div>
            </div>

            {/* 4. Fractal Income Pops (Drifting Dividends) */}
            <AnimatePresence>
                {pops.map((pop, i) => (
                    <motion.div
                        key={pop.id}
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{
                            opacity: [0, 1, 1, 0],
                            scale: pop.scale,
                            y: -40
                        }}
                        transition={{
                            duration: 3,
                            delay: pop.delay,
                            repeat: Infinity,
                            repeatDelay: Math.random() * 2 + 1
                        }}
                        className={clsx(
                            "absolute z-30 flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md border shadow-lg border-white/10",
                            pop.style,
                            pop.type === 'major' ? "bg-emerald-500/20 text-emerald-400" :
                                pop.type === 'micro' ? "bg-blue-500/10 text-blue-300 scale-90" :
                                    "bg-white/10 text-white"
                        )}
                    >
                        <Zap className={clsx("w-3 h-3 fill-current",
                            pop.type === 'major' ? "text-emerald-400" : "text-yellow-400"
                        )} />
                        <span className="font-black tracking-wide text-xs">{pop.amount}</span>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* 5. The Big Number (Overlay) */}
            <div className="absolute bottom-8 z-40 w-full flex justify-center">
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="relative group cursor-pointer"
                >
                    <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-emerald-600 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
                    <div className="relative px-8 py-4 bg-[#0A0F1C]/90 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col items-center gap-1 shadow-2xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em]">Est. Monthly Income</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl md:text-5xl font-black text-white tracking-tight">
                                ${count.toLocaleString()}
                            </span>
                            <span className="text-sm font-bold text-emerald-500 animate-pulse">.00</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
