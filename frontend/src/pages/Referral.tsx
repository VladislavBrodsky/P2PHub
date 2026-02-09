import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic';
import { EarnHeader } from '../components/Earn/EarnHeader';
import { TaskCard } from '../components/Earn/TaskCard';
import { MilestonePath } from '../components/Earn/MilestonePath';
import { ReferralWidget } from '../components/Earn/ReferralWidget';

import { TaskGrid } from '../components/Earn/TaskGrid';
import { EARN_TASKS, Task, MILESTONES } from '../data/earnData';
import { useUser } from '../context/UserContext';
import { Confetti } from '../components/ui/Confetti';
import { CheckCircle2, Trophy, QrCode, X, Share2, Download, Copy, ExternalLink, Send } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { getSafeLaunchParams } from '../utils/tma';


export default function ReferralPage() {
    const { t } = useTranslation();
    const { notification, selection } = useHaptic();
    const { user, updateUser } = useUser();

    // Local State for Instant Feedback
    const [tasksList, setTasksList] = useState<Task[]>(EARN_TASKS);
    const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
    const [verifyingTasks, setVerifyingTasks] = useState<Record<string, number>>({});
    const [claimableTasks, setClaimableTasks] = useState<string[]>([]);
    const [levelUp, setLevelUp] = useState(false);
    const [confettiActive, setConfettiActive] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);



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
        const stored = localStorage.getItem('p2p_completed_tasks');
        if (stored) setCompletedTaskIds(JSON.parse(stored));

        const storedClaimable = localStorage.getItem('p2p_claimable_tasks');
        if (storedClaimable) setClaimableTasks(JSON.parse(storedClaimable));


    }, []);

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

    const handleClaim = (task: Task) => {
        if (completedTaskIds.includes(task.id)) return;
        selection();
        notification('success');
        const newCompleted = [...completedTaskIds, task.id];
        setCompletedTaskIds(newCompleted);
        localStorage.setItem('p2p_completed_tasks', JSON.stringify(newCompleted));
        const newClaimable = claimableTasks.filter(id => id !== task.id);
        setClaimableTasks(newClaimable);
        localStorage.setItem('p2p_claimable_tasks', JSON.stringify(newClaimable));
        updateUser?.({ xp: currentXP + task.reward });
        const nextLevelXP = currentLevel * 100;
        if ((currentXP + task.reward) >= nextLevelXP) {
            setLevelUp(true);
            setConfettiActive(true);
            setTimeout(() => {
                setLevelUp(false);
                setConfettiActive(false);
            }, 4000);
        }
    };

    const handleTaskClick = (task: Task) => {
        if (task.link) {
            selection();
            window.open(task.link, '_blank');
            if (!completedTaskIds.includes(task.id) && !verifyingTasks[task.id] && !claimableTasks.includes(task.id)) {
                setVerifyingTasks(prev => ({ ...prev, [task.id]: 15 }));
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
        if (window.Telegram?.WebApp) {
            // Open user picker and trigger inline query with the referral code
            window.Telegram.WebApp.switchInlineQuery(user?.referral_code || '', ['users', 'groups', 'channels']);
        } else {
            const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(VIRAL_TEXT)}`;
            window.open(url, '_blank');
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
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ y: 100, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 100, opacity: 0, scale: 0.9 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="w-full max-w-sm bg-slate-900/40 border border-white/10 rounded-[3rem] p-7 relative shadow-2xl overflow-hidden max-h-[90vh] flex flex-col glass-panel-premium"
                        >
                            {/* Animated Background Glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-64 bg-blue-600/10 blur-[100px] animate-pulse pointer-events-none" />

                            <button
                                onClick={() => setShowShareModal(false)}
                                className="absolute top-5 right-5 w-10 h-10 bg-white/5 backdrop-blur-md rounded-full text-white/50 hover:text-white flex items-center justify-center z-50 transition-colors border border-white/5"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="relative z-10 flex flex-col gap-8">
                                {/* Premium Invitation Card */}
                                <div className="relative group perspective-1000">
                                    <div className="absolute -inset-0.5 bg-linear-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                    <div className="relative bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                                        <div className="relative h-44">
                                            <img src="/viral-invite.jpg" alt={t('referral.modal.invite_image_alt')} className="w-full h-full object-cover opacity-80" />
                                            {/* Glossy Overlay */}
                                            <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />
                                            <div className="absolute inset-0 bg-linear-to-tr from-blue-500/10 to-transparent" />

                                            {/* Floating Badge */}
                                            <div className="absolute top-4 left-4">
                                                <div className="px-2 py-1 bg-blue-500/20 backdrop-blur-md border border-blue-500/30 rounded-lg">
                                                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{t('referral.modal.limited_tier')}</p>
                                                </div>
                                            </div>

                                            <button className="absolute top-4 right-14 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80">
                                                <Share2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="p-5 bg-linear-to-b from-slate-900/50 to-black/80 backdrop-blur-sm border-t border-white/5">
                                            <h4 className="text-base font-black text-white leading-tight mb-2 tracking-tight">
                                                {VIRAL_HOOK}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase">{VIRAL_SUBTITLE}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <h3 className="text-2xl font-black text-white tracking-tighter mb-1">{t('referral.modal.recruit_title')}</h3>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{t('referral.modal.limited_tier')}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <button
                                            onClick={handleShareTelegram}
                                            className="w-full h-14 rounded-2xl font-black text-white flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl liquid-blue-premium text-lg"
                                        >
                                            <Send className="w-5 h-5 -rotate-45 translate-x-1" />
                                            {t('referral.modal.share_telegram')}
                                        </button>

                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={handleNativeShare}
                                                className="h-14 bg-white/5 border border-white/10 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-white/10"
                                            >
                                                <ExternalLink className="w-4 h-4 text-blue-400" />
                                                {t('referral.modal.share_more')}
                                            </button>
                                            <button
                                                onClick={handleCopyLink}
                                                className="h-14 bg-white/5 border border-white/10 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-white/10"
                                            >
                                                <Copy className="w-4 h-4 text-blue-400" />
                                                {t('referral.modal.copy_link')}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Hint */}
                                <div className="pt-2">
                                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-center">
                                        <p className="text-[11px] text-slate-400 font-bold leading-relaxed px-2">
                                            <Trans i18nKey="referral.modal.boost_desc">
                                                Each referral boosts your XP and moves you closer to the <span className="text-white font-black underline decoration-blue-500 underline-offset-4">Physical Platinum Card</span>.
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
                            className="w-full max-w-sm bg-(--color-bg-surface) border border-white/10 rounded-[2.5rem] p-6 relative shadow-2xl"
                        >
                            <button
                                onClick={() => setShowQR(false)}
                                className="absolute top-4 right-4 p-2 bg-(--color-bg-app) rounded-full text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="text-center space-y-6">
                                <div className="space-y-2 pt-2">
                                    <h3 className="text-2xl font-black text-white leading-none tracking-tight">
                                        <Trans i18nKey="referral.qr.title">
                                            Claim Your <br />
                                            <span className="text-blue-500 uppercase italic">Financial Sovereignty</span>
                                        </Trans>
                                    </h3>
                                    <p className="text-sm font-medium text-slate-400">
                                        <Trans i18nKey="referral.qr.desc">
                                            Earn <span className="text-emerald-500 font-bold">$1/minute</span> for every active partner. <br />
                                            Build your empire now.
                                        </Trans>
                                    </p>
                                </div>

                                <div className="mx-auto w-64 h-64 bg-white p-4 rounded-3xl shadow-[0_0_40px_rgba(59,130,246,0.1)] border border-slate-100 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-linear-to-b from-blue-500/0 via-blue-500/10 to-blue-500/0 w-full h-8 blur-md animate-scan pointer-events-none" />
                                    <img
                                        src={`${import.meta.env.VITE_API_URL}/api/tools/qr?url=${encodeURIComponent(referralLink)}&scale=10`}
                                        alt="Your Referral QR Code"
                                        className="w-full h-full object-contain relative z-10"
                                    />
                                    <div className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
                                    <div className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
                                    <div className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
                                    <div className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 active:scale-95 transition-all"
                                        onClick={handleCopyLink}
                                    >
                                        <Copy className="w-4 h-4" /> {t('referral.qr.copy')}
                                    </button>
                                    <button
                                        className="flex-1 py-3 bg-blue-600 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = `${import.meta.env.VITE_API_URL}/api/tools/qr?url=${encodeURIComponent(referralLink)}&scale=20`;
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
            <AnimatePresence>
                {levelUp && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-(--color-bg-surface) border border-yellow-500/20 p-8 rounded-[2.5rem] text-center space-y-4 shadow-float"
                        >
                            <Trophy className="w-16 h-16 text-yellow-400 mx-auto animate-bounce" />
                            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-orange-500">
                                {t('referral.levelup.title')}
                            </h2>
                            <p className="text-slate-400 font-bold italic">{t('referral.levelup.reached', { level: currentLevel + 1 })}</p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <h1 className="text-3xl font-black mb-6 tracking-tighter text-gradient-primary text-center">{t('referral.title')}</h1>

            <EarnHeader />



            <ReferralWidget onInvite={() => setShowShareModal(true)} onShowQR={() => setShowQR(true)} />

            <MilestonePath />

            <TaskGrid
                tasks={localizedTasks}
                completedTaskIds={completedTaskIds}
                verifyingTasks={verifyingTasks}
                claimableTasks={claimableTasks}
                currentLevel={currentLevel}
                referrals={referrals}
                onTaskClick={handleTaskClick}
                onClaim={handleClaim}
            />

            <div className="h-24" />
        </div>
    );
}
