import { useState, useEffect, useMemo, lazy } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic';
import { EarnHeader } from '../components/Earn/EarnHeader';
// import { TaskCard } from '../components/Earn/TaskCard'; // Unused
import { ReferralWidget } from '../components/Earn/ReferralWidget';
import { LazyLoader } from '../components/ui/LazyLoader';

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

export default function ReferralPage() {
    const { t } = useTranslation(['social', 'common', 'marketing']);
    const { notification, selection } = useHaptic();
    const { user, updateUser, refreshUser, isLoading } = useUser();
    const { showNotification } = useNotificationStore();
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
    const referralLink = `https://t.me/pintopay_probot?start=${referralCode}`;

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

    // Timer Logic for Verification
    useEffect(() => {
        const timer = setInterval(() => {
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
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleClaim = async (task: Task) => {
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
            const newCompleted = [...completedTaskIds, task.id];
            setCompletedTaskIds(newCompleted);
            localStorage.setItem('p2p_completed_tasks', JSON.stringify(newCompleted));

            const newClaimable = claimableTasks.filter(id => id !== task.id);
            setClaimableTasks(newClaimable);
            localStorage.setItem('p2p_claimable_tasks', JSON.stringify(newClaimable));

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
            const errorMsg = e.response?.data?.detail || "Task requirement not met.";
            showNotification({
                title: t('common.error', 'Security Check'),
                message: errorMsg,
                type: 'warning'
            });
        }
    };

    // #comment: Helper to handle task start API call
    const handleTaskStart = async (task: Task) => {
        try {
            await apiClient.post(`/api/partner/tasks/${task.id}/start`);
            // #comment: Force refresh user to get updated active_tasks state immediately
            await refreshUser(true);
            window.dispatchEvent(new Event('focus'));
        } catch (e) {
            console.error("Failed to start task", e);
        }
    };

    const handleTaskClick = async (task: Task) => {
        if (task.link) {
            selection();

            // Handle internal navigation via rigid tab system
            if (task.link === '/blog') {
                window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'blog' }));
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
                window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'partner' }));
            } else if (task.link.startsWith('/faq')) {
                // Navigate to FAQ tab and pre-fill search
                window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'faq' }));
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
    };

    const handleCopyLink = () => {
        selection();
        notification('success');
        navigator.clipboard.writeText(referralLink);
    };

    const handleShareTelegram = () => {
        selection();
        const botUsername = 'pintopay_probot';
        const shareLink = `https://t.me/${botUsername}?start=${referralCode}`;
        const shareText = `${VIRAL_HOOK}\n${VIRAL_SUBTITLE}`;
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(shareText)}`;

        if (window.Telegram?.WebApp) {
            // #comment: Use direct share link to let user choose a contact immediately
            window.Telegram.WebApp.openTelegramLink(shareUrl);
        } else {
            // Fallback for external browser
            window.open(shareUrl, '_blank');
        }
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
        if (navigator.share) {
            try {
                // #comment: Explicitly append link to text body for apps like WhatsApp that treat text as the primary message
                const shareBody = `${VIRAL_TEXT}\n\n${referralLink}`;
                await navigator.share({
                    title: 'Pintopay Partner Hub',
                    text: shareBody,
                    url: referralLink,
                });
                setShowShareModal(false);
            } catch (err) {
                console.log('Share failed:', err);
            }
        } else {
            handleCopyLink();
        }
    };

    if (isLoading) {
        return <PageSkeleton />;
    }

    return (
        <div className="flex flex-col min-h-[90vh] px-4 pt-4 pb-20 relative">
            {confettiActive && <Confetti />}

            <AnimatePresence>
                {showShareModal && (
                    <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center sm:p-4 px-0 py-0">
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowShareModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                        />
                        <m.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="w-full sm:max-w-sm bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl relative shadow-2xl overflow-hidden flex flex-col max-h-[90vh] pb-[calc(var(--spacing-safe-bottom,20px)+16px)]"
                        >
                            {/* Header / Close */}
                            <div className="absolute top-4 right-4 z-50">
                                <button
                                    onClick={() => setShowShareModal(false)}
                                    className="w-8 h-8 bg-black/10 dark:bg-white/10 backdrop-blur-md rounded-full text-slate-900 dark:text-white flex items-center justify-center hover:scale-105 transition-transform"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pointer-events-auto overscroll-none" style={{ overscrollBehavior: 'none' }}>
                                {/* Visual Header */}
                                <div className="relative h-40 sm:h-44 shrink-0">
                                    <div className="absolute inset-0 bg-linear-to-b from-transparent to-white dark:to-slate-900 z-10" />
                                    <img
                                        src="https://images.unsplash.com/photo-1639762681485-074b7f4fc8bc?q=80&w=2832&auto=format&fit=crop"
                                        alt={t('referral.modal.invite_image_alt')}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute bottom-3 left-5 z-20 right-5">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-[8px] font-black text-blue-400 uppercase tracking-widest">
                                                {t('referral.modal.limited_tier')}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none shadow-black drop-shadow-sm">
                                            {t('referral.modal.recruit_title')}
                                        </h3>
                                    </div>
                                </div>

                                <div className="px-6 pb-6 space-y-5">
                                    {/* Viral Hook Card */}
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative z-10">
                                            <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-2">
                                                {VIRAL_HOOK}
                                            </h4>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                                                {VIRAL_TEXT}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Quick Actions Grid */}
                                    <div className="grid grid-cols-1 gap-2.5">
                                        <button
                                            onClick={handleShareTelegram}
                                            className="w-full h-11 rounded-xl flex items-center justify-center gap-3 bg-linear-to-r from-[#2AABEE] to-[#229ED9] text-white font-black text-base shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all relative overflow-hidden group"
                                        >
                                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <Send className="w-4 h-4 -rotate-45 mb-0.5" />
                                            <span className="text-sm">{t('referral.modal.share_telegram')}</span>
                                        </button>

                                        <div className="grid grid-cols-2 gap-2">
                                            {window.Telegram?.WebApp && (
                                                <button
                                                    onClick={handleShareViralCard}
                                                    className="h-10 rounded-xl flex items-center justify-center gap-2 bg-indigo-50 dark:bg-slate-800/80 backdrop-blur-md text-indigo-600 dark:text-indigo-400 font-black text-[12px] border border-indigo-100 dark:border-white/10 active:scale-[0.98] transition-all shadow-sm"
                                                >
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                    <span>{t('referral.modal.viral_btn')}</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={handleNativeShare}
                                                className={`h-10 rounded-xl flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-md text-slate-700 dark:text-slate-300 font-black text-[12px] border border-slate-200/50 dark:border-white/10 active:scale-[0.98] transition-all shadow-sm ${!window.Telegram?.WebApp ? 'col-span-2' : ''}`}
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <span>{t('referral.modal.share_more')}</span>
                                            </button>
                                        </div>

                                        <button
                                            onClick={handleCopyLink}
                                            className="h-8 rounded-lg flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold text-[10px] active:scale-95 transition-all"
                                        >
                                            <Copy className="w-3 h-3" />
                                            <span>{t('referral.modal.copy_link')}</span>
                                        </button>
                                    </div>

                                    {/* Footer Info */}
                                    <div className="text-center pb-2">
                                        <p className="text-[10px] text-slate-400 font-medium">
                                            <Trans i18nKey="referral.modal.boost_desc">
                                                Each referral boosts your Viral Network and moves you closer to the <span className="text-slate-900 dark:text-white font-bold">$1 per minute strategy</span>.
                                            </Trans>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>

            {/* QR Code Modal */}
            <AnimatePresence>
                {showQR && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                        <m.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 relative shadow-2xl"
                        >
                            <button
                                onClick={() => setShowQR(false)}
                                className="absolute top-4 right-4 p-2 bg-slate-50 dark:bg-slate-950 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="text-center space-y-6">
                                <div className="space-y-2 pt-2">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                                        <Trans i18nKey="referral.qr.title">
                                            Claim Your <br />
                                            <span className="text-blue-600 uppercase italic">Financial Sovereignty</span>
                                        </Trans>
                                    </h3>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        <Trans i18nKey="referral.qr.desc">
                                            Earn <span className="text-emerald-500 font-bold">$1/minute</span> for every active partner. <br />
                                            Build your empire now.
                                        </Trans>
                                    </p>
                                </div>

                                <div className="mx-auto w-64 h-64 bg-white p-4 rounded-3xl shadow-[0_0_40px_rgba(59,130,246,0.1)] border border-slate-100 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-linear-to-b from-blue-500/0 via-blue-500/10 to-blue-500/0 w-full h-8 blur-md animate-scan pointer-events-none" />
                                    <img
                                        src={`${getApiUrl()}/api/tools/qr?url=${encodeURIComponent(referralLink)}&scale=10`}
                                        alt="Your Referral QR Code"
                                        className="w-full h-full object-contain relative z-10"
                                    />
                                    <div className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-blue-600 rounded-tl-xl" />
                                    <div className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-blue-600 rounded-tr-xl" />
                                    <div className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-blue-600 rounded-bl-xl" />
                                    <div className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-blue-600 rounded-br-xl" />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        className="flex-1 py-3 bg-slate-900/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-sm text-slate-900 dark:text-white flex items-center justify-center gap-2 active:scale-95 transition-all"
                                        onClick={handleCopyLink}
                                    >
                                        <Copy className="w-4 h-4" /> {t('referral.qr.copy')}
                                    </button>
                                    <button
                                        className="flex-1 py-3 bg-blue-600 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = `${getApiUrl()}/api/tools/qr?url=${encodeURIComponent(referralLink)}&scale=20`;
                                            link.download = 'Pintopay_Invite.png';
                                            link.click();
                                        }}
                                    >
                                        <Download className="w-4 h-4" /> {t('referral.qr.save')}
                                    </button>
                                </div>
                            </div>
                        </m.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Level Up Overlay */}
            {/* Level Up Overlay */}
            <AnimatePresence>
                {levelUp && (
                    <LazyLoader height="0px">
                        <LevelUpModal
                            isOpen={levelUp}
                            level={reachedLevel}
                            onClose={() => {
                                setLevelUp(false);
                                setConfettiActive(false);
                            }}
                        />
                    </LazyLoader>
                )}
            </AnimatePresence>

            <h1 className="text-xl font-black mb-1 tracking-tighter text-gradient-primary text-center">{t('referral.title')}</h1>

            <div className="flex justify-center mb-4">
                <button
                    onClick={() => setShowBriefModal(true)}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-blue-500 hover:bg-slate-900/10 dark:hover:bg-white/10 transition-all active:scale-95"
                >
                    <FileText className="w-3 h-3" />
                    {t('referral.brief.btn')}
                </button>
            </div>

            <BriefTermsModal isOpen={showBriefModal} onClose={() => setShowBriefModal(false)} />

            {/* Content Stack - Optimized for stability and z-index safety */}
            <div className="flex flex-col gap-3 relative w-full">
                <div className="relative min-h-[160px]">
                    <EarnHeader />
                </div>

                <div className="relative z-10 mt-0">
                    <ReferralWidget onInvite={() => setShowShareModal(true)} onShowQR={() => setShowQR(true)} />
                </div>

                <div className="relative">
                    <MilestonePath />
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

            <div className="mt-8 mb-4">
                <UpgradeButton
                    onClick={() => {
                        selection();
                        window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'subscription' }));
                    }}
                    className="shadow-xl shadow-amber-500/10"
                />
            </div>

            <div className="h-12" />
        </div>
    );
}
