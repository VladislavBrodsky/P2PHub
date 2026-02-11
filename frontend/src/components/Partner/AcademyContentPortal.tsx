import React from 'react';
import { motion } from 'framer-motion';
import { X, Zap, Rocket, Bot, CheckCircle2, ArrowRight, Lock } from 'lucide-react';
import { AcademyStage } from '../../data/academyData';

interface AcademyContentPortalProps {
    stage: AcademyStage;
    onClose: () => void;
    onComplete: (id: number) => void;
    isLocked: boolean;
}

export const AcademyContentPortal: React.FC<AcademyContentPortalProps> = ({ stage, onClose, onComplete, isLocked }) => {
    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />

            {/* Modal Content */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-30 p-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 hover:scale-110 transition-transform"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content Area */}
                <div className="overflow-y-auto p-8 pt-12 custom-scrollbar">
                    {isLocked ? (
                        /* PRO Lock View */
                        <div className="flex flex-col items-center text-center space-y-6 py-8">
                            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                <Lock className="w-10 h-10 text-amber-500" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Stage Locked</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-[280px]">
                                    Stages 21-100 contain our most elite marketing secrets. Upgrade to PRO to unlock the full Career Stair.
                                </p>
                            </div>

                            <div className="w-full p-6 rounded-3xl bg-linear-to-br from-amber-500/10 to-transparent border border-amber-500/20 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Zap className="w-5 h-5 text-amber-500" />
                                    <span className="text-xs font-black text-amber-500 uppercase tracking-widest">PRO Benefits</span>
                                </div>
                                <ul className="space-y-1.5 text-left">
                                    {['Reach $1/Minute Blueprint', 'AI Marketing Autopilot 24/7', 'High-Ticket Sales Closures', '50k+ TG Channel Mastery'].map((item, i) => (
                                        <li key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                            <div className="w-1 h-1 rounded-full bg-amber-500" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button className="w-full py-5 rounded-2xl bg-amber-500 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 active:scale-95 transition-all">
                                Upgrade to PRO Center
                            </button>
                        </div>
                    ) : (
                        /* Lesson Content View */
                        <div className="space-y-8">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-500 uppercase tracking-widest">
                                        Stage {stage.id} Mastery
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                        {stage.category}
                                    </div>
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                                    {stage.title}
                                </h2>
                            </div>

                            {/* Main Article Content (Static/Demo for now) */}
                            <div className="space-y-6 text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">
                                <p>
                                    Welcome to the elite training floor. To reach the result of <strong>$1 per minute</strong>, we must first master the art of <strong>leverage</strong>.
                                </p>

                                <div className="p-5 rounded-3xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 space-y-3">
                                    <div className="flex items-center gap-2 text-blue-500 font-black text-[11px] uppercase tracking-widest">
                                        <Rocket className="w-4 h-4" />
                                        Profitability Secret
                                    </div>
                                    <p className="text-[12px] italic">
                                        "Value is not in the work you do, but in the systems you scale. A partner with a 10,000 node network earns while they sleep, because their AI works 24/7."
                                    </p>
                                </div>

                                <p>
                                    In the year 2026, manual marketing is dead. You need to become a <strong>Growth Hacker</strong>. This means using viral loops where every new member brings 3 more.
                                </p>

                                {stage.id >= 5 && stage.id <= 10 && (
                                    <div className="p-5 rounded-3xl bg-linear-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 space-y-4">
                                        <div className="flex items-center gap-2 text-purple-500 font-black text-[11px] uppercase tracking-widest">
                                            <Bot className="w-4 h-4" />
                                            AI Marketing Expert (PRO Preview)
                                        </div>
                                        <p className="text-xs">
                                            Our exclusive PRO engine generates viral content on autopilot 24/7. It auto-posts to your target audience while you focus on scaling. This is how you spend less time and reach maximum results.
                                        </p>
                                        <button className="text-[9px] font-black text-purple-500 uppercase tracking-widest flex items-center gap-1 group">
                                            Learn how it works <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                )}

                                <p>
                                    Step-by-step, we will build your empire. By Stage 20, your foundation will be unbreakable. Beyond that, we enter the world of high-ticket sales and AI domination.
                                </p>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={() => onComplete(stage.id)}
                                className="w-full py-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                Complete Stage {stage.id}
                            </button>
                        </div>
                    )}
                </div>

                {/* Bottom Footer Decoration */}
                <div className="h-4 bg-linear-to-t from-slate-100 dark:from-white/5 to-transparent pointer-events-none" />
            </motion.div>
        </div>
    );
};
