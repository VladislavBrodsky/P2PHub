import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, ArrowRight, Calculator } from 'lucide-react';
import { useState } from 'react';

export const IncomePotential = () => {
    const [activePartners, setActivePartners] = useState(50);
    const estimatedMonthly = (activePartners * 45).toLocaleString(); // $45 avg per partner assumption

    return (
        <section className="px-4 py-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.01 }}
                className="relative overflow-hidden rounded-[3.5rem] bg-(--color-bg-surface) dark:bg-neutral-950 text-(--color-text-primary) dark:text-white p-6 md:p-10 space-y-10 border border-(--color-border-glass) shadow-premium dark:shadow-[0_20px_50px_-12px_rgba(59,130,246,0.2)]"
            >
                {/* Background Glow */}
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-600/30 blur-[120px] pointer-events-none animate-pulse" />
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-600/20 blur-[120px] pointer-events-none" />

                <div className="space-y-6 relative z-10">
                    <motion.div
                        className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/5 backdrop-blur-sm px-4 py-2"
                        animate={{
                            boxShadow: ["0 0 0px rgba(59, 130, 246, 0)", "0 0 15px rgba(59, 130, 246, 0.4)", "0 0 0px rgba(59, 130, 246, 0)"],
                            borderColor: ["rgba(59, 130, 246, 0.3)", "rgba(59, 130, 246, 0.8)", "rgba(59, 130, 246, 0.3)"]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">
                            The Partner Advantage
                        </span>
                    </motion.div>

                    <h3 className="text-4xl font-black tracking-tight leading-none max-w-[280px]">
                        Earn $1 <br />
                        <span className="text-blue-500 dark:text-transparent dark:bg-clip-text dark:bg-linear-to-r dark:from-blue-400 dark:via-emerald-400 dark:to-blue-400 dark:text-animate-shimmer">Per Minute</span>
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed max-w-[320px]">
                        Traditional finance is a walled garden. As a <span className="text-black dark:text-white font-bold">Pintopay Partner</span>, you are the bridge. Every global transaction becomes your dividends.
                    </p>
                </div>

                {/* Profit Calculator */}
                <div className="p-6 rounded-[2.5rem] bg-(--color-bg-app)/50 border border-(--color-border-glass) space-y-6 relative z-10 backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-2">
                        <Calculator className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Profit Calculator</span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-(--color-text-secondary)">Active Partners</span>
                            <span className="text-xl font-black text-blue-500">{activePartners}</span>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="500"
                            value={activePartners}
                            onChange={(e) => setActivePartners(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    <div className="pt-4 border-t border-(--color-border-glass)">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-(--color-text-secondary)">Est. Monthly Income</span>
                            <span className="text-2xl font-black text-emerald-500">${estimatedMonthly}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="p-6 rounded-[2.5rem] bg-white/50 dark:bg-(--color-bg-app)/50 border border-(--color-border-glass) space-y-2 group transition-all hover:bg-[var(--color-brand-blue)]/10">
                        <Users className="w-5 h-5 text-slate-500 dark:text-(--color-text-secondary) mb-1 group-hover:text-blue-400 transition-colors" />
                        <div className="text-3xl font-black tabular-nums tracking-tighter text-slate-900 dark:text-white">1.2B</div>
                        <div className="text-[9px] font-black text-slate-500 dark:text-(--color-text-secondary) uppercase tracking-widest opacity-80">Global Target</div>
                    </div>
                    <div className="p-6 rounded-[2.5rem] bg-white/50 dark:bg-(--color-bg-app)/50 border border-(--color-border-glass) space-y-2 group transition-all hover:bg-[var(--color-brand-blue)]/10">
                        <DollarSign className="w-5 h-5 text-emerald-500 mb-1 group-hover:animate-bounce" />
                        <div className="text-3xl font-black tabular-nums tracking-tighter text-slate-900 dark:text-white transition-transform group-hover:scale-110">24/7</div>
                        <div className="text-[9px] font-black text-slate-500 dark:text-(--color-text-secondary) uppercase tracking-widest opacity-80">Revenue Flow</div>
                    </div>
                </div>

                <div className="pt-4 relative z-10">
                    <button className="group relative w-full flex items-center justify-center gap-2 bg-white text-black h-14 px-8 rounded-2xl font-black text-sm hover:bg-blue-50 transition-all active:scale-[0.98] shadow-[0_10px_20px_-5px_rgba(255,255,255,0.3)]">
                        JOIN THE MOVEMENT
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                    </button>
                    <p className="text-center mt-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] opacity-60">
                        Limited Beta Slots Available
                    </p>
                </div>
            </motion.div>
        </section>
    );
};

