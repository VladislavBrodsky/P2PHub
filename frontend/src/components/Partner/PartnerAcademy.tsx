import { AcademyCareerStair } from './AcademyCareerStair';
import { Sparkles, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export const PartnerAcademy = () => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pt-[env(safe-area-inset-top,2rem)]">
            {/* Academy Elite Header */}
            <div className="relative group overflow-hidden rounded-[3rem] p-1 shadow-2xl perspective-1000">
                <div className="absolute inset-0 branding-liquid-gradient opacity-95 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 vibing-blue-animated opacity-10" />

                <div className="relative z-10 glass-panel-premium rounded-[2.2rem] border-white/20 p-6 overflow-hidden">
                    {/* Background Visuals */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 blur-[80px] rounded-full animate-pulse" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/20 blur-[60px] rounded-full" />

                    <div className="relative z-20 flex flex-col items-center text-center space-y-5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/10 backdrop-blur-md border border-slate-900/10 text-[9px] font-black uppercase tracking-[0.2em] text-blue-700">
                            <Sparkles className="w-3.5 h-3.5" />
                            Elite Growth Academy
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-3xl font-black leading-none tracking-tight text-slate-900 uppercase italic">
                                Career <span className="text-blue-600 drop-shadow-[0_2px_10px_rgba(37,99,235,0.2)]">Staircase</span>
                            </h2>
                            <p className="text-slate-700 text-[11px] font-bold leading-relaxed max-w-[320px] mx-auto opacity-90 uppercase tracking-wide">
                                Master the 100-Stage roadmap to <br />
                                <span className="text-blue-700 font-black">$1 Per Minute</span> with AI Automation.
                            </p>
                        </div>

                        <div className="flex items-center gap-6 pt-2">
                            <div className="flex flex-col items-center">
                                <span className="text-[14px] font-black text-slate-900">100</span>
                                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Levels</span>
                            </div>
                            <div className="w-px h-6 bg-slate-900/10" />
                            <div className="flex flex-col items-center">
                                <span className="text-[14px] font-black text-blue-600">20+</span>
                                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Free</span>
                            </div>
                            <div className="w-px h-6 bg-slate-900/10" />
                            <div className="flex flex-col items-center">
                                <span className="text-[14px] font-black text-orange-600">PRO</span>
                                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Elite</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* The 100-Stage Path Container */}
            <div className="relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-linear-to-b from-blue-500/20 via-slate-200 dark:via-white/5 to-transparent -z-10" />
                <AcademyCareerStair />
            </div>

            {/* Sticky Bottom Footer (Educational Callout) */}
            <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 w-full max-w-[280px] px-2">
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass-panel-premium rounded-2xl p-2.5 border-blue-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-between gap-3 bg-white/10 backdrop-blur-3xl ring-1 ring-white/20"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl branding-liquid-gradient flex items-center justify-center shadow-md ring-1 ring-white/20">
                            <TrendingUp className="w-4 h-4 text-slate-900" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none">Rank</span>
                            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase leading-none mt-0.5">Growth Hacker</span>
                        </div>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />
                    <div className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse shadow-sm">
                        <Award className="w-3.5 h-3.5" />
                        Active
                    </div>
                </motion.div>
            </div>

            {/* Bottom Spacing to ensure path isn't cut off by navbar */}
            <div className="h-32 pointer-events-none" />
        </div>
    );
};
