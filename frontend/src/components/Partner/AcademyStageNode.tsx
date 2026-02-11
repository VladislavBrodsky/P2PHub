import React from 'react';
import { motion } from 'framer-motion';
// #comment: Removed unused icons (Star, Sparkles, Bot, Trophy) to clean up imports and improve maintainability
import { Lock, CheckCircle2, Play, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AcademyStage } from '../../data/academyData';

interface AcademyStageNodeProps {
    stage: AcademyStage;
    status: 'locked' | 'available' | 'completed' | 'current';
    onClick: (stage: AcademyStage) => void;
    index: number;
}

export const AcademyStageNode: React.FC<AcademyStageNodeProps> = ({ stage, status, onClick, index }) => {
    const isLocked = status === 'locked';
    const isCompleted = status === 'completed';
    const isCurrent = status === 'current';
    // #comment: Removed unused 'categoryStyles' variable as it was not being utilized in the component rendering

    // Zig-zag offset logic
    const isLeft = index % 2 === 0;
    const xOffset = isLeft ? -40 : 40;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, x: xOffset }}
            whileInView={{ opacity: 1, y: 0, x: xOffset }}
            viewport={{ once: true, margin: "-100px" }}
            whileHover={{ scale: 1.1, zIndex: 50, rotateY: isLeft ? 10 : -10 }}
            whileTap={{ scale: 0.95 }}
            style={{ transformStyle: "preserve-3d" }}
            onClick={() => !isLocked && onClick(stage)}
            className={cn(
                "relative group cursor-pointer w-full flex justify-center py-4",
                isLocked && "cursor-not-allowed opacity-60"
            )}
        >
            {/* Connecting Line (drawn from previous node) */}
            {index > 0 && (
                <div className={cn(
                    "absolute -top-4 left-1/2 -translate-x-1/2 w-0.5 h-8 -z-10 bg-slate-200 dark:bg-white/10 overflow-hidden"
                )}>
                    {(isCompleted || isCurrent) && (
                        <motion.div
                            initial={{ y: "-100%" }}
                            animate={{ y: "100%" }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="w-full h-1/2 bg-linear-to-b from-transparent via-blue-500 to-transparent"
                        />
                    )}
                </div>
            )}

            {/* Node Background with Glow for Active/Current */}
            <div className={cn(
                "relative w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 border-2 overflow-hidden",
                isCurrent ? "branding-liquid-gradient border-blue-400 shadow-[0_0_40px_rgba(37,99,235,0.5)]" :
                    isCompleted ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_5px_15px_rgba(16,185,129,0.1)]" :
                        isLocked ? "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10" :
                            "bg-white dark:bg-white/10 border-slate-200 dark:border-white/20 shadow-xl"
            )} style={{ transform: "translateZ(30px)" }}>
                {/* Visual indicator for current stage */}
                {isCurrent && (
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-blue-400 blur-xl rounded-full -z-10"
                    />
                )}

                {/* Icon Rendering */}
                <div className={cn(
                    "relative z-10 transition-transform duration-300 group-hover:scale-110",
                    isCurrent ? "text-slate-900" :
                        isCompleted ? "text-emerald-500" :
                            isLocked ? "text-slate-400/50" : "text-blue-500"
                )}>
                    {isLocked ? <Lock className="w-8 h-8" /> : <stage.icon className="w-9 h-9" />}
                </div>

                {/* Status Badges */}
                <div className="absolute -top-2 -right-2 z-20">
                    {isCompleted && (
                        <div className="bg-emerald-500 p-1 rounded-full shadow-lg">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                    )}
                    {stage.isPro && isLocked && (
                        <div className="bg-amber-500 px-1.5 py-0.5 rounded-lg shadow-lg flex items-center gap-1">
                            <Zap className="w-3 h-3 text-white fill-white" />
                            <span className="text-[8px] font-black text-white uppercase tracking-tighter">PRO</span>
                        </div>
                    )}
                </div>

                {/* Stage Number Floating */}
                <div className={cn(
                    "absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                    isCurrent ? "bg-blue-600 border-blue-400 text-white" :
                        "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"
                )}>
                    Stage {stage.id}
                </div>
            </div>

            {/* Label Content (Floating to the side) */}
            <div className={cn(
                "absolute top-1/2 -translate-y-1/2 w-52 flex flex-col p-4 rounded-2xl glass-panel-premium border-white/10 transition-all duration-500 group-hover:border-blue-500/30",
                isLeft ? "left-[calc(50%+60px)] items-start text-left" : "right-[calc(50%+60px)] items-end text-right",
                isLocked ? "opacity-40 grayscale" : "opacity-100"
            )} style={{ transform: "translateZ(20px)" }}>
                <h4 className={cn(
                    "text-[12px] font-black uppercase tracking-tight leading-none",
                    isLocked ? "text-slate-400" : "text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors"
                )}>{stage.title}</h4>
                <p className={cn(
                    "text-[9px] font-medium leading-tight mt-1.5 opacity-80 line-clamp-2",
                    isLocked ? "text-slate-500" : "text-slate-600 dark:text-slate-300"
                )}>{stage.description}</p>

                {stage.duration && !isLocked && (
                    <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/10 w-fit">
                        <Play className="w-2.5 h-2.5 text-blue-500" />
                        <span className="text-[8px] font-black text-blue-500 uppercase">{stage.duration}</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
