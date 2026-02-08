import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, ArrowRight } from 'lucide-react';

export const IncomePotential = () => {
    return (
        <section className="px-4 py-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.01 }}
                className="relative overflow-hidden rounded-[3.5rem] bg-[var(--color-bg-surface)] dark:bg-neutral-950 text-[var(--color-text-primary)] dark:text-white p-10 space-y-10 border border-[var(--color-border-glass)] shadow-premium dark:shadow-[0_20px_50px_-12px_rgba(59,130,246,0.2)]"
            >
                {/* Background Glow */}
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-600/30 blur-[120px] pointer-events-none animate-pulse" />
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-600/20 blur-[120px] pointer-events-none" />

                <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-3 text-blue-400">
                        <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/30">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.3em] inline-block">The Partner Advantage</span>
                    </div>
                    <h3 className="text-4xl font-black tracking-tight leading-none max-w-[280px]">
                        Earn $1 <br />
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-emerald-400 to-blue-400 text-animate-shimmer">Per Minute</span>
                    </h3>
                    <p className="text-sm text-neutral-400 font-medium leading-relaxed max-w-[320px]">
                        Traditional finance is a walled garden. As a <span className="text-white font-bold">Pintopay Partner</span>, you are the bridge. Every global transaction becomes your dividends.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="p-6 rounded-[2.5rem] bg-[var(--color-bg-app)]/50 border border-[var(--color-border-glass)] space-y-2 group transition-all hover:bg-[var(--color-brand-blue)]/10">
                        <Users className="w-5 h-5 text-[var(--color-text-secondary)] mb-1 group-hover:text-blue-400 transition-colors" />
                        <div className="text-3xl font-black tabular-nums tracking-tighter text-[var(--color-text-primary)] dark:text-white">1.2B</div>
                        <div className="text-[9px] font-black text-[var(--color-text-secondary)] uppercase tracking-widest opacity-60">Global Target</div>
                    </div>
                    <div className="p-6 rounded-[2.5rem] bg-[var(--color-bg-app)]/50 border border-[var(--color-border-glass)] space-y-2 group transition-all hover:bg-[var(--color-brand-blue)]/10">
                        <DollarSign className="w-5 h-5 text-emerald-500 mb-1 group-hover:animate-bounce" />
                        <div className="text-3xl font-black tabular-nums tracking-tighter text-[var(--color-text-primary)] dark:text-white transition-transform group-hover:scale-110">24/7</div>
                        <div className="text-[9px] font-black text-[var(--color-text-secondary)] uppercase tracking-widest opacity-60">Revenue Flow</div>
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

