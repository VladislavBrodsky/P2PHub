import { AcademyCareerStair } from './AcademyCareerStair';
import { Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export const PartnerAcademy = () => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pt-4">
            {/* Academy Elite Header */}
            <div className="relative group overflow-hidden rounded-[3rem] p-1 shadow-2xl perspective-1000">
                <div className="absolute inset-0 branding-liquid-gradient opacity-95 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 vibing-blue-animated opacity-10" />

                <div className="relative z-10 glass-panel-premium rounded-[2.2rem] border-white/20 p-5 overflow-hidden">
                    {/* #comment: Reduced header padding from p-6 to p-5 for a more compact look */}
                    {/* Background Visuals */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-[80px] rounded-full animate-pulse" />
                    {/* #comment: Reduced background orb size from w-40 to w-32 */}
                    <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-indigo-500/20 blur-[60px] rounded-full" />
                    {/* #comment: Reduced background orb size from w-32 to w-28 */}

                    <div className="relative z-20 flex flex-col items-center text-center space-y-5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/10 backdrop-blur-md border border-slate-900/10 text-[9px] font-black uppercase tracking-[0.2em] text-blue-700">
                            <Sparkles className="w-3.5 h-3.5" />
                            Elite Growth Academy
                        </div>

                        <div className="space-y-1.5">
                            {/* #comment: Reduced vertical spacing from space-y-2 to space-y-1.5 */}
                            <h2 className="text-2xl font-black leading-none tracking-tight text-slate-900 uppercase italic">
                                {/* #comment: Reduced title size from text-3xl to text-2xl */}
                                Career <span className="text-blue-600 drop-shadow-[0_2px_10px_rgba(37,99,235,0.2)]">Staircase</span>
                            </h2>
                            <p className="text-slate-700 text-[10px] font-bold leading-relaxed max-w-[300px] mx-auto opacity-90 uppercase tracking-wide">
                                {/* #comment: Reduced description size from text-[11px] to text-[10px] and max-width from 320px to 300px */}
                                Master the 100-Stage roadmap to <br />
                                <span className="text-blue-700 font-black">$1 Per Minute</span> with AI Automation.
                            </p>
                        </div>

                        <div className="flex items-center gap-5 pt-1.5">
                            {/* #comment: Reduced gap from gap-6 to gap-5 and top padding from pt-2 to pt-1.5 */}
                            <div className="flex flex-col items-center">
                                <span className="text-[12px] font-black text-slate-900">100</span>
                                {/* #comment: Reduced number size from 14px to 12px */}
                                <span className="text-[6.5px] font-black text-slate-600 uppercase tracking-widest">Levels</span>
                                {/* #comment: Reduced label size from 7px to 6.5px */}
                            </div>
                            <div className="w-px h-5 bg-slate-900/10" />
                            {/* #comment: Reduced divider height from h-6 to h-5 */}
                            <div className="flex flex-col items-center">
                                <span className="text-[12px] font-black text-blue-600">20+</span>
                                <span className="text-[6.5px] font-black text-slate-600 uppercase tracking-widest">Free</span>
                            </div>
                            <div className="w-px h-5 bg-slate-900/10" />
                            <div className="flex flex-col items-center">
                                <span className="text-[12px] font-black text-orange-600">PRO</span>
                                <span className="text-[6.5px] font-black text-slate-600 uppercase tracking-widest">Elite</span>
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
            <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-40 w-full max-w-[260px] px-2">
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass-panel-premium rounded-[1.5rem] p-2 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between gap-3 bg-[#0f172a]/40 backdrop-blur-3xl ring-1 ring-white/10"
                >
                    <div className="flex items-center gap-2 pl-2">
                        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ring-1 ring-white/30 text-white">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[7px] font-black text-blue-400 uppercase tracking-[0.2em] leading-none">Global Rank</span>
                            <span className="text-[11px] font-black text-white uppercase leading-none mt-1 group-hover:text-blue-400 transition-colors">Growth Hacker</span>
                        </div>
                    </div>

                    <div className="px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-[inset_0_1px_10px_rgba(249,115,22,0.1)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                        Active
                    </div>
                </motion.div>
            </div>

            {/* Bottom Spacing to ensure path isn't cut off by navbar */}
            <div className="h-32 pointer-events-none" />
        </div>
    );
};
