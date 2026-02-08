import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, DollarSign, ArrowRight, Calculator, Clock, AlertCircle, Lock } from 'lucide-react';
import { useState } from 'react';
import { ReferralGraph } from './ReferralGraph';

type CalculatorMode = 'profit' | 'inaction';

const JOB_LEVELS = [
    { label: 'Student / Unemployed', rate: 0 },
    { label: 'Entry Level', rate: 15 },
    { label: 'Professional', rate: 30 },
    { label: 'Manager', rate: 60 },
    { label: 'Executive', rate: 120 }
];

interface IncomePotentialProps {
    onNavigateToPartner?: () => void;
}

export const IncomePotential = ({ onNavigateToPartner }: IncomePotentialProps) => {
    const [mode, setMode] = useState<CalculatorMode>('profit');
    const [activePartners, setActivePartners] = useState(50);
    const [selectedLevel, setSelectedLevel] = useState(JOB_LEVELS[2]); // Default to Professional
    const [hoursWorked, setHoursWorked] = useState(8);
    const [isStrategyUnlocked, setIsStrategyUnlocked] = useState(false);

    const handleUnlock = () => {
        setIsStrategyUnlocked(true);
    };

    // Profit Math
    const estimatedMonthly = (activePartners * 45).toLocaleString();

    // Inaction Math
    const p2pDailyPotential = 1440;
    const currentDailyIncome = selectedLevel.rate * hoursWorked;
    const currentValPerMin = currentDailyIncome / 1440;
    const dailyLoss = p2pDailyPotential - currentDailyIncome;
    const displayLoss = dailyLoss > 0 ? dailyLoss : 0;

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

                {/* Dual Mode Calculator */}
                <div className="p-6 rounded-[2.5rem] bg-(--color-bg-app)/50 border border-(--color-border-glass) space-y-6 relative z-10 backdrop-blur-md transition-all duration-500">
                    {!isStrategyUnlocked ? (
                        <>
                            {/* Mode Toggle */}
                            <div className="flex p-1 bg-(--color-bg-surface) rounded-xl border border-(--color-border-glass)">
                                <button
                                    onClick={() => setMode('profit')}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${mode === 'profit' ? 'bg-blue-500 text-white shadow-lg' : 'text-(--color-text-secondary) hover:bg-white/5'}`}
                                >
                                    Profit Potential
                                </button>
                                <button
                                    onClick={() => setMode('inaction')}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${mode === 'inaction' ? 'bg-rose-500 text-white shadow-lg' : 'text-(--color-text-secondary) hover:bg-white/5'}`}
                                >
                                    Cost of Inaction
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                {mode === 'profit' ? (
                                    <motion.div
                                        key="profit"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calculator className="w-4 h-4 text-blue-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Revenue Projector</span>
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
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-xs font-semibold text-(--color-text-secondary)">Est. Monthly Income</span>
                                                <span className="text-2xl font-black text-emerald-500">${estimatedMonthly}</span>
                                            </div>

                                            {/* UNLOCK STRATEGY BUTTON */}
                                            <button
                                                onClick={handleUnlock}
                                                className="w-full group relative flex items-center justify-center gap-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white h-14 rounded-2xl font-black text-xs tracking-widest shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                                <Lock className="w-4 h-4 group-hover:unlock transition-all" />
                                                UNLOCK $1 STRATEGY
                                                <div className="absolute inset-0 rounded-2xl ring-2 ring-white/20 group-hover:ring-white/40 transition-all" />
                                                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="inaction"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-4 h-4 text-rose-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Daily Opportunity Cost</span>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-(--color-text-secondary)">Current Status</label>
                                                <div className="relative">
                                                    <select
                                                        value={selectedLevel.label}
                                                        onChange={(e) => setSelectedLevel(JOB_LEVELS.find(l => l.label === e.target.value) || JOB_LEVELS[2])}
                                                        className="w-full appearance-none bg-(--color-bg-surface) border border-(--color-border-glass) text-(--color-text-primary) text-xs font-bold rounded-xl px-4 py-3 focus:outline-hidden focus:ring-2 focus:ring-rose-500/50"
                                                    >
                                                        {JOB_LEVELS.map((level) => (
                                                            <option key={level.label} value={level.label}>
                                                                {level.label} (${level.rate}/hr)
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                        <ArrowRight className="w-3 h-3 rotate-90 opacity-50" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-xs font-bold text-(--color-text-secondary)">Hours You Work / Day</span>
                                                    <span className="text-[10px] font-black text-rose-500">{hoursWorked} Hours</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="16"
                                                    value={hoursWorked}
                                                    onChange={(e) => setHoursWorked(parseInt(e.target.value))}
                                                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-6 text-center space-y-4">
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-(--color-text-secondary) opacity-60">
                                                    Your Value Per Minute
                                                </div>
                                                <div className={`text-4xl font-black transition-colors duration-300 ${currentValPerMin >= 1
                                                    ? 'text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                                    : 'text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                                                    }`}>
                                                    ${currentValPerMin.toFixed(4)}
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-2xl bg-[#1A103C] border border-white/5 shadow-inner">
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-0.5">
                                                    Potential Daily Loss
                                                </div>
                                                <div className="text-2xl font-black text-white">
                                                    ${displayLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Viral Network Effect</span>
                                </div>
                                <button
                                    onClick={() => setIsStrategyUnlocked(false)}
                                    className="text-[10px] font-bold text-slate-400 hover:text-white"
                                >
                                    CLOSE
                                </button>
                            </div>

                            <ReferralGraph />

                            <div className="text-center space-y-2">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    When you build a network, your income disconnects from time.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 relative z-10">
                    <div className="p-5 rounded-[2rem] bg-white/50 dark:bg-(--color-bg-app)/50 border border-(--color-border-glass) space-y-3 group transition-all hover:bg-(--color-brand-blue)/5 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <Users className="w-5 h-5 text-slate-500 dark:text-(--color-text-secondary) group-hover:text-blue-400 transition-colors" />
                            <div className="flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">+17% YoY</span>
                            </div>
                        </div>

                        <div>
                            <div className="text-3xl font-black tabular-nums tracking-tighter text-slate-900 dark:text-white">1.2B</div>
                            <div className="text-[9px] font-black text-slate-500 dark:text-(--color-text-secondary) uppercase tracking-widest opacity-80 mb-1">Global Target</div>
                            <div className="text-[9px] font-medium text-slate-400 leading-tight">
                                Growing x2 faster than the internet
                            </div>
                        </div>

                        {/* Info Icon / Tooltip Trigger */}
                        <div className="absolute bottom-3 right-3 text-slate-300 dark:text-slate-700">
                            <AlertCircle className="w-3 h-3 opacity-50" />
                        </div>
                    </div>

                    <div className="p-5 rounded-[2rem] bg-white/50 dark:bg-(--color-bg-app)/50 border border-(--color-border-glass) space-y-2 group transition-all hover:bg-(--color-brand-blue)/5">
                        <DollarSign className="w-5 h-5 text-emerald-500 mb-1 group-hover:animate-bounce" />
                        <div className="text-3xl font-black tabular-nums tracking-tighter text-slate-900 dark:text-white transition-transform group-hover:scale-110">24/7</div>
                        <div className="text-[9px] font-black text-slate-500 dark:text-(--color-text-secondary) uppercase tracking-widest opacity-80">Revenue Flow</div>
                    </div>
                </div>

                <div className="relative z-10 mx-2 p-4 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-(--color-border-glass) backdrop-blur-sm mt-2">
                    <div className="flex gap-3">
                        <div className="shrink-0 mt-0.5">
                            <div className="w-1 h-full min-h-[40px] rounded-full bg-linear-to-b from-rose-500 to-purple-600" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                The Cost of Waiting
                            </h4>
                            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                                While you trade hours for a fixed wage, the Digital Economy generates value 24/7.
                                <span className="text-rose-500 font-bold ml-1">Every minute you wait is a minute you're paying a "tax" on inaction.</span>
                                <br />
                                Stop calculating the loss. Start capturing the value.
                            </p>
                        </div>
                    </div>
                </div>

                {!isStrategyUnlocked ? (
                    <div className="pt-4 relative z-10">
                        <button
                            onClick={onNavigateToPartner}
                            className="group relative w-full flex items-center justify-center gap-2 bg-white text-black h-12 px-6 rounded-2xl font-black text-xs hover:bg-blue-50 transition-all active:scale-[0.98] shadow-[0_10px_20px_-5px_rgba(255,255,255,0.3)]"
                        >
                            JOIN THE MOVEMENT
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                        </button>
                        <p className="text-center mt-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] opacity-60">
                            Limited Beta Slots Available
                        </p>
                    </div>
                ) : (
                    /* Post-Unlock Content: "Lead the Market" Button */
                    <div className="pt-4 relative z-10">
                        <motion.button
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="group relative w-full flex items-center justify-center gap-2 bg-linear-to-r from-emerald-500 to-teal-600 text-white h-14 px-8 rounded-2xl font-black text-sm hover:from-emerald-400 hover:to-teal-500 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/30"
                        >
                            LEAD THE MARKET
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                        </motion.button>
                        <p className="text-center mt-6 text-[10px] font-bold text-emerald-500/60 uppercase tracking-[0.2em]">
                            Strategy Unlocked • Access Granted
                        </p>
                    </div>
                )}
            </motion.div>
        </section>
    );
};
