import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AcademyStageNode } from './AcademyStageNode';
import { ACADEMY_STAGES, AcademyStage } from '../../data/academyData';
import { useUser } from '../../context/UserContext';
import { Trophy, ChevronDown } from 'lucide-react';
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
                            <div className="w-24 h-2 rounded-full bg-slate-200 dark:bg-white/5 overflow-hidden relative border border-white/5">
                                <motion.div
                                    className="absolute inset-0 branding-liquid-gradient"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(completedStages.length / 100) * 100}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent" />
                            </div>
                            <span className="text-[10px] font-black text-blue-500">{completedStages.length}%</span>
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

                {visibleStages < 100 && (
                    <motion.button
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={loadMore}
                        className="mt-16 flex flex-col items-center gap-3 group transition-all"
                    >
                        <div className="p-5 rounded-[2rem] bg-white/5 backdrop-blur-xl border-2 border-dashed border-blue-500/30 group-hover:border-blue-500/60 group-hover:bg-blue-500/10 transition-all shadow-xl">
                            <ChevronDown className="w-8 h-8 text-blue-500 group-hover:animate-bounce" />
                        </div>
                        <span className="text-[11px] font-black text-blue-500/60 group-hover:text-blue-500 uppercase tracking-[0.2em] transition-colors">Expand Higher Stages</span>
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
