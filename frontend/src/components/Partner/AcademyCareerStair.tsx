import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AcademyStageNode } from './AcademyStageNode';
import { ACADEMY_STAGES, AcademyStage } from '../../data/academyData';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';
import { Trophy, ChevronDown } from 'lucide-react';
import { AcademyContentPortal } from './AcademyContentPortal';

export const AcademyCareerStair = () => {
    const { t } = useTranslation();
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
        <div className="relative pb-32 overflow-x-hidden">
            {/* Header / Stats Overlay (Floating) */}
            <div className="sticky top-0 z-30 pt-1.5 pb-0.5 px-0.5 mb-4">
                {/* #comment: Reduced sticky header margins and padding for a more compact top stats bar */}
                <div className="glass-panel-premium rounded-xl px-2.5 py-1.5 flex items-center justify-between border-blue-500/20 shadow-2xl">
                    {/* #comment: Reduced internal padding from px-3 py-2 to px-2.5 py-1.5 */}
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{t('academy.global_ranking')}</span>
                        {/* #comment: Reduced label text from 9px to 8px */}
                        <div className="flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5 text-amber-500" />
                            <h3 className="text-[13px] font-black text-slate-900 dark:text-white">{t('academy.stage', { stage: currentMaxStage })}</h3>
                            {/* #comment: Reduced trophy size (4 to 3.5) and stage text size (sm to 13px) */}
                        </div>
                    </div>
                    <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />
                    {/* #comment: Reduced divider height from 8 to 6 */}
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t('academy.progress_to_pro')}</span>
                        {/* #comment: Reduced label text from 9px to 8px */}
                        <div className="flex items-center gap-1.5">
                            <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-white/5 overflow-hidden relative border border-white/5">
                                {/* #comment: Reduced progress bar width from 24 to 20 and height from 2 to 1.5 */}
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
                className="relative flex flex-col items-center w-full max-w-[400px] mx-auto perspective-1000 px-4"
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
                        className="mt-8 flex flex-col items-center gap-2.5 group transition-all"
                    /* #comment: Reduced top margin from 16 to 8 and gap from 3 to 2.5 for the expand button section */
                    >
                        <div className="p-4 rounded-[1.5rem] bg-white/5 backdrop-blur-xl border-2 border-dashed border-blue-500/30 group-hover:border-blue-500/60 group-hover:bg-blue-500/10 transition-all shadow-xl">
                            {/* #comment: Reduced expand button padding (5 to 4) and container radius (2rem to 1.5rem) */}
                            <ChevronDown className="w-6 h-6 text-blue-500 group-hover:animate-bounce" />
                            {/* #comment: Reduced icon size from 8 to 6 */}
                        </div>
                        <span className="text-[10px] font-black text-blue-500/60 group-hover:text-blue-500 uppercase tracking-[0.2em] transition-colors">{t('academy.expand_higher')}</span>
                        {/* #comment: Reduced helper text size from 11px to 10px */}
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
