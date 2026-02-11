import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AcademyStageNode } from './AcademyStageNode';
import { ACADEMY_STAGES, AcademyStage } from '../../data/academyData';
import { useUser } from '../../context/UserContext';
import { Trophy, Star, Sparkles, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { AcademyContentPortal } from './AcademyContentPortal';

export const AcademyCareerStair = () => {
    const { user } = useUser();
    const [selectedStage, setSelectedStage] = useState<AcademyStage | null>(null);
    const [visibleStages, setVisibleStages] = useState(10); // Start with first 10
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Mock completion state for now (this should come from backend/localStorage)
    const [completedStages, setCompletedStages] = useState<number[]>([1]);
    const currentMaxStage = Math.max(...completedStages, 0) + 1;

    const stages = useMemo(() => ACADEMY_STAGES, []);

    const handleStageClick = (stage: AcademyStage) => {
        setSelectedStage(stage);
    };

    const handleStageComplete = (stageId: number) => {
        if (!completedStages.includes(stageId)) {
            setCompletedStages(prev => [...prev, stageId]);
        }
        setSelectedStage(null);
    };

    const loadMore = () => {
        setVisibleStages(prev => Math.min(prev + 10, 100));
    };

    return (
        <div className="relative pb-32">
            {/* Header / Stats Overlay (Floating) */}
            <div className="sticky top-0 z-30 pt-4 pb-2 px-1 mb-8">
                <div className="glass-panel-premium rounded-2xl p-4 flex items-center justify-between border-blue-500/20 shadow-2xl">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Global Ranking</span>
                        <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            <h3 className="text-sm font-black text-slate-900 dark:text-white">STAGE {currentMaxStage}</h3>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Progress to PRO</span>
                        <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 rounded-full bg-slate-200 dark:bg-white/5 overflow-hidden">
                                <motion.div
                                    className="h-full bg-linear-to-r from-blue-500 to-indigo-600"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(completedStages.length / 100) * 100}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-black text-blue-500">{completedStages.length}/100</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Path Container */}
            <div
                ref={scrollContainerRef}
                className="relative flex flex-col items-center max-w-sm mx-auto perspective-1000"
            >
                {stages.slice(0, visibleStages).map((stage, index) => {
                    let status: 'locked' | 'available' | 'completed' | 'current' = 'locked';

                    const isUnlockedByLevel = currentMaxStage >= stage.id;
                    const isProLocked = stage.isPro && !user?.is_pro;

                    if (completedStages.includes(stage.id)) {
                        status = 'completed';
                    } else if (stage.id === currentMaxStage) {
                        status = isProLocked ? 'locked' : 'current';
                    } else if (stage.id < currentMaxStage) {
                        status = 'completed';
                    } else {
                        status = 'locked';
                    }

                    return (
                        <AcademyStageNode
                            key={stage.id}
                            stage={stage}
                            status={status}
                            index={index}
                            onClick={handleStageClick}
                        />
                    );
                })}

                {/* Load More Trigger */}
                {visibleStages < 100 && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={loadMore}
                        className="mt-12 flex flex-col items-center gap-2 group transition-all"
                    >
                        <div className="p-4 rounded-full bg-white dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 group-hover:border-blue-500/50 group-hover:bg-blue-500/5">
                            <ChevronDown className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Reveal Higher Stages</span>
                    </motion.button>
                )}
            </div>

            {/* Content Portal (Modal) */}
            <AnimatePresence>
                {selectedStage && (
                    <AcademyContentPortal
                        stage={selectedStage}
                        onClose={() => setSelectedStage(null)}
                        onComplete={handleStageComplete}
                        isLocked={selectedStage.isPro && !user?.is_pro}
                    />
                )}
            </AnimatePresence>

            {/* Background Atmosphere */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-purple-500/5 blur-[100px] rounded-full" />
            </div>
        </div>
    );
};
