import { useState, useEffect, useMemo, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic';
import { EarnHeader } from '../components/Earn/EarnHeader';
// import { TaskCard } from '../components/Earn/TaskCard'; // Unused
import { ReferralWidget } from '../components/Earn/ReferralWidget';
import { LazyLoader } from '../components/ui/LazyLoader';

const MilestonePath = lazy(() => import('../components/Earn/MilestonePath').then(m => ({ default: m.MilestonePath })));
const TaskGrid = lazy(() => import('../components/Earn/TaskGrid').then(m => ({ default: m.TaskGrid })));
const LevelUpModal = lazy(() => import('../components/Earn/LevelUpModal').then(m => ({ default: m.LevelUpModal })));

import { EARN_TASKS, Task } from '../data/earnData';
import { useUser } from '../context/UserContext';
import { Confetti } from '../components/ui/Confetti';
import { X, Share2, Download, Copy, ExternalLink, Send, FileText, Sparkles } from 'lucide-react';
import { BriefTermsModal } from '../components/Earn/BriefTermsModal';
import { UpgradeButton } from '../components/ui/UpgradeButton';
import { useTranslation, Trans } from 'react-i18next';
// import { getSafeLaunchParams } from '../utils/tma'; // Unused
import { apiClient } from '../api/client';
import { getLevel } from '../utils/ranking';
import { getApiUrl } from '../utils/api';
import { PageSkeleton } from '../components/Skeletons/PageSkeleton';


export default function ReferralPage() {
    const { t } = useTranslation();
    const { notification, selection } = useHaptic();
    const { user, updateUser, isLoading } = useUser();


    // Local State for Instant Feedback
    // const [tasksList, setTasksList] = useState<Task[]>(EARN_TASKS); // Unused
    const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
    const [verifyingTasks, setVerifyingTasks] = useState<Record<string, number>>({});
    const [claimableTasks, setClaimableTasks] = useState<string[]>([]);
    const [levelUp, setLevelUp] = useState(false);
    const [reachedLevel, setReachedLevel] = useState(1);
    const [confettiActive, setConfettiActive] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showBriefModal, setShowBriefModal] = useState(false);



    // Derived User State (with defaults)
    const currentLevel = user?.level || 1;
    const currentXP = user?.xp || 0;
    const referrals = user?.referrals?.length || 0;
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
            try {
                const serverCompleted = JSON.parse(user.completed_tasks);
                setCompletedTaskIds(serverCompleted);
                localStorage.setItem('p2p_completed_tasks', user.completed_tasks);
            } catch (e) {
                console.error("Failed to parse server completed tasks", e);
            }
        } else {
            const stored = localStorage.getItem('p2p_completed_tasks');
            if (stored) setCompletedTaskIds(JSON.parse(stored));
        }

        const storedClaimable = localStorage.getItem('p2p_claimable_tasks');
        if (storedClaimable) setClaimableTasks(JSON.parse(storedClaimable));
    }, [user?.completed_tasks]);

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
            // Persist to backend
            await apiClient.post(`/api/partner/tasks/${task.id}/claim`, null, {
                params: { xp_reward: task.reward }
            });

            const newCompleted = [...completedTaskIds, task.id];
            setCompletedTaskIds(newCompleted);
            localStorage.setItem('p2p_completed_tasks', JSON.stringify(newCompleted));

            const newClaimable = claimableTasks.filter(id => id !== task.id);
            setClaimableTasks(newClaimable);
            localStorage.setItem('p2p_claimable_tasks', JSON.stringify(newClaimable));

            const newXP = currentXP + task.reward;
            const newLevel = getLevel(newXP);

            // Update local user state immediately for UI feedback
            updateUser?.({
                xp: newXP,
                level: newLevel,
                completed_tasks: JSON.stringify(newCompleted)
            });

            if (newLevel > currentLevel) {
                setReachedLevel(newLevel);
                setLevelUp(true);
                setConfettiActive(true);
                setTimeout(() => {
                    setLevelUp(false);
                    setConfettiActive(false);
                }, 4000);
            }
        } catch (e) {
            console.error("Failed to claim task reward", e);
        }
    };

    // #comment: Helper to handle task start API call
    const handleTaskStart = async (task: Task) => {
        try {
            await apiClient.post(`/api/partner/tasks/${task.id}/start`);
            // #comment: Refresh user to get updated active_tasks state immediately
            await updateUser({});
            window.dispatchEvent(new Event('focus'));
        } catch (e) {
            console.error("Failed to start task", e);
        }
    };

    const handleTaskClick = async (task: Task) => {
        if (task.link) {
            selection();
            window.open(task.link, '_blank');
            if (!completedTaskIds.includes(task.id) && !verifyingTasks[task.id] && !claimableTasks.includes(task.id)) {
                setVerifyingTasks(prev => ({ ...prev, [task.id]: 15 }));
            }
        } else if (task.type === 'referral' || task.type === 'action') {
            selection();

            // #comment: Check if task is started. If not, start it.
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
        const shareText = "🚀 STOP BLEEDING MONEY! Join Pintopay and unlock $1/minute strategy! 💎";
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(shareText)}`;

        // Use direct share link for "immediate" sending
        // This opens a chat picker, user picks chat, and message is sent with one more tap
        // Avoiding Inline Query here as primary because it requires clicking the result list item
        window.open(shareUrl, '_blank');
        setShowShareModal(false);
    };

    const handleShareViralCard = async () => {
        selection();
        try {
            if (window.Telegram?.WebApp) {
                // 1. Fetch prepared message ID from backend
                const response = await apiClient.post('/api/partner/prepared-share');
                const { id } = response.data;

                // 2. Trigger native prepared message sharing (requires Telegram 7.8+)
                // If the client is old, this method might not exist, so we check
                const webApp = window.Telegram.WebApp as any;
                if (webApp.sharePreparedInlineMessage) {
                    webApp.sharePreparedInlineMessage(id);
                } else {
                    // Fallback to existing search method
                    webApp.switchInlineQuery(referralCode, ['users', 'groups', 'channels']);
                }
            }
        } catch (error) {
            console.error("Failed to prepare sharing message:", error);
            // Fallback to existing search method on any error
            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.switchInlineQuery(referralCode, ['users', 'groups', 'channels']);
            }
        }
        setShowShareModal(false);
    };

    const handleNativeShare = async () => {
        selection();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Pintopay Partner Hub',
                    text: VIRAL_TEXT,
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
        <div className="flex flex-col min-h-[90vh] px-4 pt-4 pb-32 relative">
            {confettiActive && <Confetti />}

            <AnimatePresence>
                {showShareModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowShareModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ y: 100, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 100, opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="w-full max-w-sm bg-(--color-bg-surface)/80 border border-(--color-border-glass) rounded-[2.5rem] p-6 relative shadow-2xl overflow-hidden max-h-[90vh] flex flex-col backdrop-blur-3xl"
                        >
                            {/* Animated Background Glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-64 bg-blue-600/20 blur-[100px] animate-pulse pointer-events-none" />

                            <button
                                onClick={() => setShowShareModal(false)}
                                className="absolute top-4 right-4 w-9 h-9 bg-(--color-text-primary)/5 backdrop-blur-md rounded-full text-(--color-text-secondary) hover:text-(--color-text-primary) flex items-center justify-center z-50 transition-colors border border-(--color-border-glass)"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="relative z-10 flex flex-col gap-5 overflow-y-auto no-scrollbar py-2">
                                {/* Premium Invitation Card */}
                                <div className="relative group perspective-1000 shrink-0">
                                    <div className="absolute -inset-0.5 bg-linear-to-r from-blue-500/50 to-indigo-500/50 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000" />
                                    <div className="relative bg-(--color-bg-surface) rounded-2xl overflow-hidden border border-(--color-border-glass) shadow-2xl">
                                        <div className="relative h-40">
                                            <img src={`${getApiUrl()}/images/2026-02-05_03.35.03.webp`} alt={t('referral.modal.invite_image_alt')} className="w-full h-full object-cover opacity-90" />
                                            {/* Glossy Overlay */}
                                            <div className="absolute inset-0 bg-linear-to-t from-(--color-bg-surface) via-transparent to-transparent" />
                                            <div className="absolute inset-0 bg-linear-to-tr from-blue-500/20 to-transparent" />

                                            {/* Floating Badge */}
                                            <div className="absolute top-3 left-3">
                                                <div className="px-2 py-0.5 bg-blue-500/25 backdrop-blur-md border border-blue-400/30 rounded-lg">
                                                    <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{t('referral.modal.limited_tier')}</p>
                                                </div>
                                            </div>

                                            <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90">
                                                <Share2 className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                        <div className="p-4 bg-linear-to-b from-(--color-bg-surface) to-(--color-bg-app) backdrop-blur-sm border-t border-(--color-border-glass)">
                                            <h4 className="text-sm font-black text-(--color-text-primary) leading-tight mb-1.5 tracking-tight">
                                                {VIRAL_HOOK}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                                                <p className="text-[10px] font-bold text-(--color-text-secondary) tracking-wide uppercase">{VIRAL_SUBTITLE}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-4 shrink-0">
                                    <div className="text-center space-y-0.5">
                                        <h3 className="text-xl font-black text-(--color-text-primary) tracking-tighter">{t('referral.modal.recruit_title')}</h3>
                                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] opacity-80">{t('referral.modal.limited_tier')}</p>
                                    </div>

                                    <div className="space-y-2.5">
                                        <button
                                            onClick={handleShareTelegram}
                                            className="w-full h-12 rounded-xl font-black text-white flex items-center justify-center gap-2.5 active:scale-[0.97] transition-all shadow-xl liquid-blue-premium text-base border border-white/20"
                                        >
                                            <Send className="w-4.5 h-4.5 -rotate-45 translate-x-0.5" />
                                            {t('referral.modal.share_telegram')}
                                        </button>

                                        {window.Telegram?.WebApp && (
                                            <button
                                                onClick={handleShareViralCard}
                                                className="w-full h-11 rounded-xl font-bold text-(--color-text-primary) flex items-center justify-center gap-2 active:scale-[0.97] transition-all bg-(--color-text-primary)/5 border border-(--color-border-glass) text-sm backdrop-blur-sm hover:bg-(--color-text-primary)/10"
                                            >
                                                <Sparkles className="w-4 h-4 text-blue-500" />
                                                {t('referral.modal.viral_btn')}
                                            </button>
                                        )}

                                        <div className="grid grid-cols-2 gap-2.5">
                                            <button
                                                onClick={handleNativeShare}
                                                className="h-11 bg-(--color-text-primary)/5 border border-(--color-border-glass) rounded-xl font-extrabold text-(--color-text-primary) text-xs flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-(--color-text-primary)/10 backdrop-blur-sm"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                                                {t('referral.modal.share_more')}
                                            </button>
                                            <button
                                                onClick={handleCopyLink}
                                                className="h-11 bg-(--color-text-primary)/5 border border-(--color-border-glass) rounded-xl font-extrabold text-(--color-text-primary) text-xs flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-(--color-text-primary)/10 backdrop-blur-sm"
                                            >
                                                <Copy className="w-3.5 h-3.5 text-blue-500" />
                                                {t('referral.modal.copy_link')}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Hint */}
                                <div className="pt-1 shrink-0">
                                    <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-center">
                                        <p className="text-[10px] text-(--color-text-secondary) font-bold leading-relaxed px-1">
                                            <Trans i18nKey="referral.modal.boost_desc">
                                                Each referral boosts your XP and moves you closer to the <span className="text-(--color-text-primary) font-black underline decoration-blue-500/50 underline-offset-4">Physical Platinum Card</span>.
                                            </Trans>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* QR Code Modal */}
            <AnimatePresence>
                {showQR && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-sm bg-(--color-bg-surface) border border-(--color-border-glass) rounded-[2.5rem] p-6 relative shadow-2xl"
                        >
                            <button
                                onClick={() => setShowQR(false)}
                                className="absolute top-4 right-4 p-2 bg-(--color-bg-app) rounded-full text-(--color-text-secondary) hover:text-(--color-text-primary)"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="text-center space-y-6">
                                <div className="space-y-2 pt-2">
                                    <h3 className="text-2xl font-black text-(--color-text-primary) leading-none tracking-tight">
                                        <Trans i18nKey="referral.qr.title">
                                            Claim Your <br />
                                            <span className="text-blue-600 uppercase italic">Financial Sovereignty</span>
                                        </Trans>
                                    </h3>
                                    <p className="text-sm font-medium text-(--color-text-secondary)">
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
                                        className="flex-1 py-3 bg-(--color-text-primary)/5 border border-(--color-border-glass) rounded-xl font-bold text-sm text-(--color-text-primary) flex items-center justify-center gap-2 active:scale-95 transition-all"
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
                        </motion.div>
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

            <h1 className="text-3xl font-black mb-2 tracking-tighter text-gradient-primary text-center">{t('referral.title')}</h1>

            <div className="flex justify-center mb-6">
                <button
                    onClick={() => setShowBriefModal(true)}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-(--color-text-primary)/5 border border-(--color-border-glass) text-xs font-bold text-blue-500 hover:bg-(--color-text-primary)/10 transition-all active:scale-95"
                >
                    <FileText className="w-3 h-3" />
                    {t('referral.brief.btn')}
                </button>
            </div>

            <BriefTermsModal isOpen={showBriefModal} onClose={() => setShowBriefModal(false)} />

            {/* Content Stack - Optimized for stability and z-index safety */}
            <div className="flex flex-col gap-4 relative w-full">
                <div className="relative min-h-[380px]">
                    <EarnHeader />
                </div>

                <div className="relative z-10 mt-2">
                    <ReferralWidget onInvite={() => setShowShareModal(true)} onShowQR={() => setShowQR(true)} />
                </div>

                <div className="relative">
                    <LazyLoader height="300px">
                        <MilestonePath />
                    </LazyLoader>
                </div>
            </div>

            <LazyLoader height="500px">
                <TaskGrid
                    tasks={localizedTasks}
                    completedTaskIds={completedTaskIds}
                    verifyingTasks={verifyingTasks}
                    claimableTasks={claimableTasks}
                    currentLevel={currentLevel}
                    referrals={referrals}
                    checkinStreak={user?.checkin_streak || 0}
                    // #comment: Pass active tasks to grid for status determination
                    activeTasks={user?.active_tasks}
                    onTaskClick={handleTaskClick}
                    onClaim={handleClaim}
                />
            </LazyLoader>

            <div className="mt-8 mb-4">
                <UpgradeButton
                    onClick={() => {
                        selection();
                        window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'subscription' }));
                    }}
                    className="shadow-xl shadow-amber-500/10"
                />
            </div>

            <div className="h-24" />
        </div>
    );
}
