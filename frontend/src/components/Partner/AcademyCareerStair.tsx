import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { AcademyStageNode } from './AcademyStageNode';
import { AcademyContentPortal } from './AcademyContentPortal';
import { ACADEMY_STAGES, AcademyStage } from '../../data/academyData';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { useNotificationStore } from '../../store/useNotificationStore';

export const AcademyCareerStair = () => {
    const { t } = useTranslation('academy');
    const { user, completeStage, refreshUser, updateUser } = useUser();
    const { showNotification } = useNotificationStore();
    const [visibleStages, setVisibleStages] = useState(10);
    const [selectedStage, setSelectedStage] = useState<AcademyStage | null>(null);

    const stages = useMemo(() => {
        return ACADEMY_STAGES.slice(0, visibleStages);
    }, [visibleStages]);

    const handleStageClick = (stage: AcademyStage) => {
        setSelectedStage(stage);
    };

    const handleComplete = async (id: number) => {
        try {
            await completeStage(id);
            setSelectedStage(null);
            showNotification({
                title: t('academy.stage_completed'),
                message: t('academy.stage_completed_desc', { stage: id }),
                type: 'success'
            });
            // Optimistic unlock: add the completed stage id immediately so
            // the next card becomes available without waiting for a server round-trip.
            updateUser({
                completed_stages: [
                    ...(user?.completed_stages ?? []),
                    id
                ]
            });
            // Also refresh from server so XP/level are up to date
            await refreshUser(true);
        } catch (error) {
            console.error('Failed to complete stage:', error);
        }
    };

    const loadMore = () => {
        setVisibleStages(prev => Math.min(prev + 10, 100));
    };

    return (
        <div className="relative flex flex-col items-center w-full mx-auto">
            <div className="w-full flex flex-col items-center">
                {stages.map((stage, index) => {
                    // Normalize to number for comparison — backend may return ints,
                    // localStorage cache may restore them as strings.
                    const completedAsNumbers = (user?.completed_stages ?? []).map(Number);
                    const isCompleted = completedAsNumbers.includes(stage.id);
                    const isAvailable = stage.id === 1 || completedAsNumbers.includes(stage.id - 1);
                    const isCurrent = isAvailable && !isCompleted;

                    let status: 'locked' | 'available' | 'completed' | 'current' = 'locked';
                    if (isCompleted) status = 'completed';
                    else if (isCurrent) status = 'current';
                    else if (isAvailable) status = 'available';

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
                    >
                        <div className="p-4 rounded-xl bg-white/5 backdrop-blur-xl border-2 border-dashed border-blue-500/30 group-hover:border-blue-500/60 group-hover:bg-blue-500/10 transition-all shadow-xl">
                            <ChevronDown className="w-6 h-6 text-blue-500 group-hover:animate-bounce" />
                        </div>
                        <span className="text-label font-black text-blue-500/60 group-hover:text-blue-500 uppercase tracking-[0.2em] transition-colors">{t('academy.expand_higher')}</span>
                    </motion.button>
                )}
            </div>

            <AnimatePresence>
                {selectedStage && (
                    <AcademyContentPortal
                        stage={selectedStage}
                        onClose={() => setSelectedStage(null)}
                        onComplete={handleComplete}
                        isLocked={selectedStage.isPro && !user?.is_pro}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
