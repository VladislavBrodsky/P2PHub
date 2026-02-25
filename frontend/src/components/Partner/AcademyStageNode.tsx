import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, Play, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AcademyStage } from '../../data/academyData';
import { useTranslation } from 'react-i18next';
import { renderInline } from '../../utils/renderMarkdown';
import { usePerformance } from '../../hooks/usePerformance';

interface AcademyStageNodeProps {
    stage: AcademyStage;
    status: 'locked' | 'available' | 'completed' | 'current';
    onClick: (stage: AcademyStage) => void;
    index: number;
}

export const AcademyStageNode = memo(({ stage, status, onClick, index }: AcademyStageNodeProps) => {
    const { t } = useTranslation(['academy', 'common']);
    const isLocked = status === 'locked';
    const isCompleted = status === 'completed';
    const isCurrent = status === 'current';

    // Alternating card position logic: Stage 1 (index 0), 3, 5 -> Right; Stage 2 (index 1), 4, 6 -> Left
    const isRightSide = index % 2 === 0;

    const getStageContent = (id: number) => ({
        titleKey: `academy_content.stage_${id}_title`,
        descKey: `academy_content.stage_${id}_desc`
    });

    const { titleKey, descKey } = getStageContent(stage.id);
    const title = t(titleKey, { defaultValue: stage.title });
    const description = t(descKey, { defaultValue: stage.description });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            whileHover={{ scale: 1.02, zIndex: 50 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => !isLocked && onClick(stage)}
            className={cn(
                "relative group cursor-pointer w-full h-[85px]",
                isLocked && "cursor-not-allowed opacity-60"
            )}
        >
            {/* Connecting Line (Spine of the roadmap) */}
            {index > 0 && (
                <div className={cn(
                    "absolute -top-5 left-1/2 -translate-x-1/2 w-0.5 h-10 -z-10 bg-slate-200 dark:bg-white/10 overflow-hidden"
                )}>
                    {(isCompleted || isCurrent) && (
                        <div className="absolute inset-x-0 w-full h-1/2 bg-linear-to-b from-transparent via-blue-500 to-transparent shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-academy-flow" />
                    )}
                </div>
            )}

            {/* Central Node (Forced absolute center for precision) */}
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isLocked) onClick(stage);
                }}
                className={cn(
                    "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-500 border-2 cursor-pointer",
                    isCurrent ? "branding-liquid-gradient border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)]" :
                        isCompleted ? "bg-emerald-500/10 border-emerald-500/30" :
                            isLocked ? "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 cursor-not-allowed" :
                                "bg-white dark:bg-white/10 border-slate-200 dark:border-white/20 shadow-md"
                )}>
                {/* Visual indicator for current stage */}
                {isCurrent && (
                    <div className="absolute inset-0 bg-blue-400 blur-2xl rounded-full -z-10 animate-academy-pulse" />
                )}

                {/* Icon */}
                <div className={cn(
                    "relative z-10 transition-transform duration-500 group-hover:scale-110",
                    isCurrent ? "text-white" :
                        isCompleted ? "text-emerald-500" :
                            isLocked ? "text-slate-400/50" : "text-blue-500"
                )}>
                    {isLocked ? <Lock className="w-4 h-4" /> : <stage.icon className="w-5 h-5" />}
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
                            <span className="text-label font-bold text-white uppercase">PRO</span>
                        </div>
                    )}
                </div>

                {/* Stage Number Floating */}
                <div className={cn(
                    "absolute -bottom-1 -left-1/2 translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-[0.15em] border z-30",
                    isCurrent ? "bg-blue-600 border-blue-400 text-white shadow-lg" :
                        "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-500"
                )}>
                    {stage.id}
                </div>
            </div>

            <div
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isLocked) onClick(stage);
                }}
                className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-[110px] min-[390px]:w-[130px] sm:w-[155px] flex flex-col p-2.5 rounded-xl glass-panel-premium border-white/5 transition-all duration-500 group-hover:border-blue-500/30 group-hover:bg-white/10 dark:group-hover:bg-white/5 z-30 pointer-events-auto cursor-pointer shadow-xl",
                    isRightSide
                        ? "left-1/2 translate-x-[25px] text-left items-start"
                        : "left-1/2 -translate-x-[calc(100%+25px)] text-right items-end",
                    isLocked ? "opacity-30 grayscale blur-[0.5px] cursor-not-allowed" : "opacity-100"
                )} style={{ transform: "translateZ(20px)" }}>
                <h4 className={cn(
                    "text-[10px] font-bold uppercase tracking-tight leading-tight",
                    isLocked ? "text-slate-500" : "text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors",
                    "drop-shadow-sm"
                )}>{renderInline(title)}</h4>

                <p className={cn(
                    "text-[9px] font-medium leading-snug mt-1.5 opacity-80 line-clamp-2",
                    isLocked ? "text-slate-600" : "text-slate-600 dark:text-slate-300",
                    "drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)]"
                )}>{renderInline(description)}</p>

                {stage.duration && !isLocked && (
                    <div className={cn(
                        "flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/10 w-fit",
                        isRightSide ? "mr-auto" : "ml-auto"
                    )}>
                        <Play className="w-2 h-2 text-blue-500 fill-blue-500" />
                        <span className="text-label font-bold text-blue-500 uppercase">{stage.duration?.replace('min', t('academy.unit_min', 'min'))}</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
});
