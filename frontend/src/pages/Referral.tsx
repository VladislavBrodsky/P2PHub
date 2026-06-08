import { useState, useEffect, useMemo, lazy, useCallback, memo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic';
import { EarnHeader } from '../components/Earn/EarnHeader';
// import { TaskCard } from '../components/Earn/TaskCard'; // Unused
import { ReferralWidget } from '../components/Earn/ReferralWidget';
import { LazyLoader } from '../components/ui/LazyLoader';
import { useSystemClock } from '../hooks/usePerformance';

import { MilestonePath } from '../components/Earn/MilestonePath';
import { TaskGrid } from '../components/Earn/TaskGrid';
const LevelUpModal = lazy(() => import('../components/Earn/LevelUpModal').then(m => ({ default: m.LevelUpModal })));

import { EARN_TASKS, Task } from '../data/earnData';
import { useUser } from '../context/UserContext';
import { useNotificationStore } from '../store/useNotificationStore';
import { Confetti } from '../components/ui/Confetti';
import { X, Download, Copy, ExternalLink, Send, FileText, Sparkles } from 'lucide-react';
import { BriefTermsModal } from '../components/Earn/BriefTermsModal';
import { UpgradeButton } from '../components/ui/UpgradeButton';
import { useTranslation, Trans } from 'react-i18next';
// import { getSafeLaunchParams } from '../utils/tma'; // Unused
import { apiClient } from '../api/client';
import { getApiUrl } from '../utils/api';
import { PageSkeleton } from '../components/Skeletons/PageSkeleton';
import { useUI } from '../context/UIContext';
import { useTMALock } from '../hooks/useTMALock';
import { ROUTES } from '../utils/routes';
import { useNavigation } from '../hooks/useNavigation';
import { SectionHeader } from '../components/ui/SectionHeader';
import { shareToTelegram, shareUniversal } from '../utils/shareUtils';
import { ShareModal } from './Referral/components/ShareModal';
import { QRCodeModal } from './Referral/components/QRCodeModal';
// #comment: Root-relative path /images/ used for public assets.

export default function ReferralPage() {
    const { t } = useTranslation(['social', 'common', 'marketing']);
    const { notification, selection } = useHaptic();
    const { user, updateUser, refreshUser, isLoading } = useUser();
    const { showNotification } = useNotificationStore();
    const { navigateTo } = useNavigation();
    const { setFooterVisible } = useUI();

    // Local State for Instant Feedback
    // const [tasksList, setTasksList] = useState<Task[]>(EARN_TASKS); // Unused
    const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
    const [completedStages, setCompletedStages] = useState<(string | number)[]>([]);
    const [verifyingTasks, setVerifyingTasks] = useState<Record<string, number>>({});
    const [claimableTasks, setClaimableTasks] = useState<string[]>([]);
    const [levelUp, setLevelUp] = useState(false);
    const [reachedLevel, setReachedLevel] = useState(1);
    const [confettiActive, setConfettiActive] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showBriefModal, setShowBriefModal] = useState(false);

    // Prevent body scroll and TMA swipes when any modal is open
    useTMALock(showShareModal || showQR || showBriefModal || levelUp);

    useEffect(() => {
        setFooterVisible(!(showShareModal || showBriefModal));
        return () => setFooterVisible(true);
    }, [showShareModal, showBriefModal, setFooterVisible]);




    // Derived User State (with defaults)
    const currentLevel = user?.level || 1;
    const referrals = user?.total_network_size || 0;
    const referralCode = user?.referral_code || 'ref_dev';
    const referralLink = `https://t.me/partnercenterbot?start=${referralCode}`;

    // Translate tasks dynamically
    const localizedTasks = useMemo(() => {
        return EARN_TASKS.map(task => ({
            ...task,
            title: t(`tasks.${task.id}.title`),
            description: t(`tasks.${task.id}.desc`)
        }));
    }, [t]);

    const VIRAL_HOOK = t('referral.viral.hook');
    const VIRAL_SUBTITLE = t('referral.viral.subtitle');
    const VIRAL_TEXT = t('referral.viral.text');

    // Load states and fetch tree data on mount
    useEffect(() => {
        // Sync with server if user data is available
        if (user?.completed_tasks) {
            setCompletedTaskIds(user.completed_tasks);
            localStorage.setItem('p2p_completed_tasks', JSON.stringify(user.completed_tasks));
        } else {
            const stored = localStorage.getItem('p2p_completed_tasks');
            if (stored) setCompletedTaskIds(JSON.parse(stored));
        }

        if (user?.completed_stages) {
            // #comment: completed_stages is already an array from the API/Context, no need to parse.
            setCompletedStages(user.completed_stages);
        }

        const storedClaimable = localStorage.getItem('p2p_claimable_tasks');
        if (storedClaimable) setClaimableTasks(JSON.parse(storedClaimable) as string[]);
    }, [user?.completed_tasks, user?.completed_stages]);

    const tick = useSystemClock();

    // Timer Logic for Verification - Consolidated to Global Heartbeat
    useEffect(() => {
        if (Object.keys(verifyingTasks).length === 0) return;

        setVerifyingTasks(prev => {
            const next = { ...prev };
            let changed = false;

            Object.keys(next).forEach(taskId => {
                if (next[taskId] > 1) {
                    next[taskId] -= 1;
                    changed = true;
                } else {
                    delete next[taskId];
                    setClaimableTasks(p => {
                        if (!p.includes(taskId)) {
                            const updated = [...p, taskId];
                            localStorage.setItem('p2p_claimable_tasks', JSON.stringify(updated));
                            return updated;
                        }
                        return p;
                    });
                    changed = true;
                }
            });

            return changed ? next : prev;
        });
    }, [tick]);

    const handleClaim = useCallback(async (task: Task) => {
        if (completedTaskIds.includes(task.id)) return;
        selection();
        notification('success');

        try {
            // Persist to backend - authoritative response
            const response = await apiClient.post(`/api/partner/tasks/${task.id}/claim`, {
                xp_reward: task.reward
            });

            const updatedData = response.data;

            // Update local state for task visibility immediately
            setCompletedTaskIds(prev => {
                const updated = [...prev, task.id];
                localStorage.setItem('p2p_completed_tasks', JSON.stringify(updated));
                return updated;
            });

            setClaimableTasks(prev => {
                const updated = prev.filter(id => id !== task.id);
                localStorage.setItem('p2p_claimable_tasks', JSON.stringify(updated));
                return updated;
            });

            // Feedback effects
            setConfettiActive(true);
            setTimeout(() => setConfettiActive(false), 3000);

            // Level up calculation based on PREVIOUS state to trigger modal
            const nextLevel = updatedData.level;
            if (nextLevel > currentLevel) {
                setReachedLevel(nextLevel);
                setLevelUp(true);
                setConfettiActive(true);
                setTimeout(() => {
                    setLevelUp(false);
                    setConfettiActive(false);
                }, 4000);
            }

            // Trust backend for the full user state sync
            updateUser?.(updatedData);

        } catch (e: any) {
            console.error("Failed to claim task reward", e);
            const errorMsg = e.response?.data?.detail || t('tasks.error_not_met');
            showNotification({
                title: t('common:error'),
                message: errorMsg,
                type: 'warning'
            });
        }
    }, [completedTaskIds, selection, notification, currentLevel, updateUser, t, showNotification]);

    // #comment: Helper to handle task start API call
    const handleTaskStart = useCallback(async (task: Task) => {
        try {
            await apiClient.post(`/api/partner/tasks/${task.id}/start`);
            // #comment: Force refresh user to get updated active_tasks state immediately
            await refreshUser(true);
            window.dispatchEvent(new Event('focus'));
        } catch (e) {
            console.error("Failed to start task", e);
        }
    }, [refreshUser]);

    const handleTaskClick = useCallback(async (task: Task) => {
        if (task.link) {
            selection();

            // Handle internal navigation via rigid tab system
            if (task.link === '/blog') {
                navigateTo(ROUTES.BLOG);
            } else if (task.link === '/dashboard/academy') {
                // For academy, we ensure the task is started if it's not already
                if (task.type === 'academy') {
                    const isActive = user?.active_tasks?.some(at => at.task_id === task.id);
                    if (!isActive && !completedTaskIds.includes(task.id)) {
                        handleTaskStart(task);
                    }
                    // #comment: Direct sub-tab navigation
                    window.dispatchEvent(new Event('nav-academy'));
                }
                navigateTo(ROUTES.PARTNER);
            } else if (task.link.startsWith('/faq')) {
                // Navigate to FAQ tab and pre-fill search
                navigateTo(ROUTES.FAQ);
                // Also pass the search query for FAQ to pick up
                const searchParam = new URL(task.link, 'http://x').searchParams.get('q');
                if (searchParam) {
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('faq-search', { detail: searchParam }));
                    }, 300); // Small delay to let the tab render
                }
                // Start the task in background so user can claim after reading
                if (!completedTaskIds.includes(task.id)) {
                    handleTaskStart(task);
                }
            } else {
                window.open(task.link, '_blank');
            }

            if (!completedTaskIds.includes(task.id) && !verifyingTasks[task.id] && !claimableTasks.includes(task.id) && task.type !== 'academy') {
                if (task.link.startsWith('/faq')) {
                    // Short timer so user has time to read the guide
                    setVerifyingTasks(prev => ({ ...prev, [task.id]: 8 }));
                } else {
                    setVerifyingTasks(prev => ({ ...prev, [task.id]: 15 }));
                }
            }
        } else if (task.type === 'referral' || task.type === 'action' || task.type === 'academy') {
            selection();

            // #comment: Check if task is started (or already active)
            const isActive = user?.active_tasks?.some(at => at.task_id === task.id);
            if (!isActive && !completedTaskIds.includes(task.id)) {
                await handleTaskStart(task);
            }

            if (task.type === 'referral') {
                setShowShareModal(true);
            }
        }
    }, [selection, navigateTo, user?.active_tasks, completedTaskIds, handleTaskStart, verifyingTasks, claimableTasks]);

    const handleCopyLink = () => {
        selection();
        notification('success');
        navigator.clipboard.writeText(referralLink);
        showNotification({
            title: t('common:copied'),
            message: t('social:referral.link_copied'),
            type: 'success'
        });
    };

    const toggleShareModal = useCallback((val: boolean) => setShowShareModal(val), []);
    const toggleQRModal = useCallback((val: boolean) => setShowQR(val), []);

    const handleLevelUpClose = useCallback(() => {
        setLevelUp(false);
        setConfettiActive(false);
    }, []);

    const handleShowBrief = useCallback(() => setShowBriefModal(true), []);
    const handleCloseBrief = useCallback(() => setShowBriefModal(false), []);

    const handleShareTelegram = () => {
        selection();
        const botUsername = 'partnercenterbot';
        const shareLink = `https://t.me/${botUsername}?start=${referralCode}`;
        const shareText = t('referral.viral.share_template', { link: shareLink });

        shareToTelegram(shareText, shareLink);
        setShowShareModal(false);
    };

    const handleShareViralCard = async () => {
        selection();
        if (window.Telegram?.WebApp) {
            // #comment: Directly open inline mode to show marketing card options
            window.Telegram.WebApp.switchInlineQuery(referralCode, ['users', 'groups', 'channels']);
        }
        setShowShareModal(false);
    };

    const handleNativeShare = async () => {
        selection();
        const shareBody = `${VIRAL_TEXT}\n\n${referralLink}`;
        const result = await shareUniversal({
            title: 'Partner Center Hub',
            text: shareBody,
            url: referralLink,
        });
        if (result === 'shared') {
            setShowShareModal(false);
        } else if (result === 'copied') {
            setShowShareModal(false);
        }
    };

    if (isLoading) {
        return <PageSkeleton />;
    }

    return (
        <div className="flex flex-col min-h-[90vh] px-4 pt-4 pb-8 relative lg:max-w-4xl xl:max-w-5xl lg:mx-auto w-full">
            {confettiActive && <Confetti />}

            <AnimatePresence>
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                t={t}
                viralHook={VIRAL_HOOK}
                viralSubtitle={VIRAL_SUBTITLE}
                handleShareTelegram={handleShareTelegram}
                handleShareViralCard={handleShareViralCard}
                handleNativeShare={handleNativeShare}
                handleCopyLink={handleCopyLink}
            />
            </AnimatePresence>

            {/* QR Code Modal */}
            <QRCodeModal
                isOpen={showQR}
                onClose={() => setShowQR(false)}
                t={t}
                referralLink={referralLink}
                handleCopyLink={handleCopyLink}
            />

            {/* Level Up Overlay */}
            {/* Level Up Overlay */}
            <AnimatePresence>
                {levelUp && (
                    <LazyLoader height="0px">
                        <LevelUpModal
                            isOpen={levelUp}
                            level={reachedLevel}
                            onClose={handleLevelUpClose}
                        />
                    </LazyLoader>
                )}
            </AnimatePresence>

            <BriefTermsModal isOpen={showBriefModal} onClose={handleCloseBrief} />

            {/* Content Stack - Optimized for stability and z-index safety */}
            <div className="flex flex-col gap-3 lg:gap-6 relative w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-stretch">
                    <div className="relative min-h-[160px] h-full flex flex-col justify-between">
                        <EarnHeader />
                    </div>

                    <div className="relative z-10 flex flex-col justify-center gap-4">
                        <ReferralWidget onInvite={() => toggleShareModal(true)} onShowQR={() => toggleQRModal(true)} />
                        
                        {/* Terms & Guide Button inside the right column on desktop to balance layout */}
                        <div className="flex justify-center">
                            <button
                                onClick={handleShowBrief}
                                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-bg-surface border border-card-border text-label font-bold text-brand-blue hover:brightness-110 transition-all active:scale-95 shadow-sm"
                            >
                                <FileText className="w-3 h-3" />
                                {t('brief.btn')}
                            </button>
                        </div>
                    </div>
                </div>

                <TaskGrid
                    tasks={localizedTasks}
                    completedTaskIds={completedTaskIds}
                    completedStages={completedStages}
                    verifyingTasks={verifyingTasks}
                    claimableTasks={claimableTasks}
                    currentLevel={currentLevel}
                    referrals={referrals}
                    checkinStreak={user?.checkin_streak || 0}
                    isPro={user?.is_pro}
                    isProPlus={user?.subscription_plan?.includes('PLUS')}
                    // #comment: Pass active tasks to grid for status determination
                    activeTasks={user?.active_tasks}
                    onTaskClick={handleTaskClick}
                    onClaim={handleClaim}
                />

                <div className="relative">
                    <MilestonePath />
                </div>
            </div>
            <div className="mt-8 mb-4">
                <UpgradeButton
                    onClick={() => {
                        selection();
                        navigateTo(ROUTES.SUBSCRIPTION);
                    }}
                    className="shadow-xl shadow-amber-500/10"
                />
            </div>

        </div>
    );
}
