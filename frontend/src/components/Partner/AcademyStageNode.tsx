import React from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, Play, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AcademyStage } from '../../data/academyData';
import { useTranslation } from 'react-i18next';

interface AcademyStageNodeProps {
    stage: AcademyStage;
    status: 'locked' | 'available' | 'completed' | 'current';
    onClick: (stage: AcademyStage) => void;
    index: number;
}

export const AcademyStageNode: React.FC<AcademyStageNodeProps> = ({ stage, status, onClick, index }) => {
    const { t } = useTranslation();
    const isLocked = status === 'locked';
    const isCompleted = status === 'completed';
    const isCurrent = status === 'current';

    // Alternating card position logic
    const isLeft = index % 2 === 0;

    const getStageContent = (id: number) => {
        if (id <= 10 || (id >= 21 && id <= 24)) {
            return {
                titleKey: `academy_content.stage_${id}_title`,
                descKey: `academy_content.stage_${id}_desc`,
                params: {}
            };
        }
        if (id >= 11 && id <= 20) {
            return {
                titleKey: `academy_content.stage_foundation_title`,
                descKey: `academy_content.stage_foundation_desc`,
                params: { phase: id }
            };
        }
        // Default / Elite (25+)
        return {
            titleKey: `academy_content.stage_elite_title`,
            descKey: `academy_content.stage_elite_desc`,
            params: { stage: id }
        };
    };

    const { titleKey, descKey, params } = getStageContent(stage.id);
    const title = t(titleKey, { ...params, defaultValue: stage.title });
    const description = t(descKey, { ...params, defaultValue: stage.description });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            whileHover={{ scale: 1.02, zIndex: 50 }}
            whileTap={{ scale: 0.98 }}
            style={{}}
            onClick={() => !isLocked && onClick(stage)}
            className={cn(
                "relative group cursor-pointer w-full flex justify-center py-5",
                isLocked && "cursor-not-allowed opacity-60"
            )}
        >
            {/* Connecting Line (Spine of the roadmap) */}
            {index > 0 && (
                <div className={cn(
                    "absolute -top-5 left-1/2 -translate-x-1/2 w-0.5 h-10 -z-10 bg-slate-200 dark:bg-white/10"
                )}>
                    {(isCompleted || isCurrent) && (
                        <motion.div
                            initial={{ y: "-100%" }}
                            animate={{ y: "100%" }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-full h-1/2 bg-linear-to-b from-transparent via-blue-500 to-transparent shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                        />
                    )}
                </div>
            )}

            {/* Central Node (Always centered for perfect proportions) */}
            <div className={cn(
                "relative z-20 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 overflow-hidden",
                isCurrent ? "branding-liquid-gradient border-blue-400 shadow-[0_0_30px_rgba(37,99,235,0.4)]" :
                    isCompleted ? "bg-emerald-500/10 border-emerald-500/30" :
                        isLocked ? "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10" :
                            "bg-white dark:bg-white/10 border-slate-200 dark:border-white/20 shadow-md"
            )} style={{}}>
                {/* Visual indicator for current stage */}
                {isCurrent && (
                    <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 bg-blue-400 blur-2xl rounded-full -z-10"
                    />
                )}

                {/* Icon */}
                <div className={cn(
                    "relative z-10 transition-transform duration-500 group-hover:scale-110",
                    isCurrent ? "text-white" :
                        isCompleted ? "text-emerald-500" :
                            isLocked ? "text-slate-400/50" : "text-blue-500"
                )}>
                    {isLocked ? <Lock className="w-6 h-6" /> : <stage.icon className="w-7 h-7" />}
                </div>

                {/* Status Badges */}
                <div className="absolute -top-1 -right-1 z-30">
                    {isCompleted && (
                        <div className="bg-emerald-500 p-1 rounded-full shadow-lg border border-white/20">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                    )}
                    {stage.isPro && isLocked && (
                        <div className="bg-amber-500 px-1.5 py-0.5 rounded-lg shadow-lg flex items-center gap-1 border border-white/20">
                            <Zap className="w-2.5 h-2.5 text-white fill-white" />
                            <span className="text-[7px] font-black text-white uppercase">PRO</span>
                        </div>
                    )}
                </div>

                {/* Stage Number Floating */}
                <div className={cn(
                    "absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-[0.2em] border z-30",
                    isCurrent ? "bg-blue-600 border-blue-400 text-white shadow-lg" :
                        "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-500"
                )}>
                    {stage.id}
                </div>
            </div>

            {/* Stage Card Content (Alternating to side) */}
            <div className={cn(
                "absolute top-1/2 -translate-y-1/2 w-[130px] min-[375px]:w-[145px] sm:w-[160px] flex flex-col p-3.5 rounded-2xl glass-panel-premium border-white/5 transition-all duration-500 group-hover:border-blue-500/30 group-hover:bg-white/10 dark:group-hover:bg-white/5",
                isLeft ? "left-[calc(50%+42px)] text-left" : "right-[calc(50%+42px)] text-right items-end",
                isLocked ? "opacity-30 grayscale blur-[0.5px]" : "opacity-100 shadow-xl"
            )} style={{}}>
                <h4 className={cn(
                    "text-[10px] font-black uppercase tracking-tight leading-tight",
                    isLocked ? "text-slate-500" : "text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors"
                )}>{title}</h4>

                <p className={cn(
                    "text-[8px] font-medium leading-[1.3] mt-1.5 opacity-80 line-clamp-2",
                    isLocked ? "text-slate-600" : "text-slate-600 dark:text-slate-300"
                )}>{description}</p>

                {stage.duration && !isLocked && (
                    <div className={cn(
                        "flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/10 w-fit",
                        !isLeft && "ml-auto"
                    )}>
                        <Play className="w-2 h-2 text-blue-500 fill-blue-500" />
                        <span className="text-[7.5px] font-black text-blue-500 uppercase">{stage.duration}</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
