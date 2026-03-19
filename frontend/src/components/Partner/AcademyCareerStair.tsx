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
    const { user, completeStage, unlockStage } = useUser();
    const { showNotification } = useNotificationStore();
    const [visibleStages, setVisibleStages] = useState(10);
    const [selectedStage, setSelectedStage] = useState<AcademyStage | null>(null);

    const completedStages = user?.completed_stages || [];
    const unlockedStages = user?.unlocked_stages || [];

    // Memoize completed stages as numbers for faster lookups in children
    const completedAsNumbers = useMemo(() => {
        return completedStages.map(Number);
    }, [completedStages]);

    const stages = useMemo(() => {
        return ACADEMY_STAGES.slice(0, visibleStages);
    }, [visibleStages]);

    const handleStageClick = (stage: AcademyStage) => {
        setSelectedStage(stage);
    };

    const handleUnlock = async (id: number) => {
        try {
            await unlockStage(id);
            showNotification({
                title: t('common:success'),
                message: t('academy.unlock_success', { defaultValue: 'Stage unlocked successfully!' }),
                type: 'success'
            });
        } catch (error) {
            console.error('Failed to unlock stage:', error);
            showNotification({
                title: t('common:error'),
                message: t('academy.unlock_error', { defaultValue: 'Failed to unlock stage. Check your XP.' }),
                type: 'warning'
            });
        }
    };

    const handleComplete = async (id: number) => {
        try {
            // Optimistic UI: we'll show a notification but the context handles the state
            await completeStage(id);
            showNotification({
                title: t('common:success'),
                message: t('academy.mission_synced'),
                type: 'success'
            });
        } catch (error: any) {
            console.error('Failed to complete stage:', error);
            const msg = error.response?.data?.msg || t('common:error');
            showNotification({
                title: t('common:error'),
                message: msg,
                type: 'warning'
            });
        }
    };

    const loadMore = () => {
        setVisibleStages(prev => Math.min(prev + 10, 100));
    };

    return (
        <div className="relative flex flex-col items-center w-full mx-auto">
            <div className="w-full flex flex-col items-center">
                {stages.map((stage, index) => {
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
                        <span className="text-label font-bold text-blue-500/60 group-hover:text-blue-500 tracking-[0.2em] transition-colors">{t('academy.expand_higher')}</span>
                    </motion.button>
                )}
            </div>

            <AnimatePresence>
                {selectedStage && (
                    <AcademyContentPortal
                        stage={selectedStage}
                        onClose={() => setSelectedStage(null)}
                        unlockedStages={unlockedStages}
                        onComplete={handleComplete}
                        onUnlock={handleUnlock}
                        isLocked={selectedStage.isPro && !user?.is_pro}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
