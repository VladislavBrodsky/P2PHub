import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic';
import { EarnHeader } from '../components/Earn/EarnHeader';
import { TaskCard } from '../components/Earn/TaskCard';
import { MilestonePath } from '../components/Earn/MilestonePath';
import { ReferralWidget } from '../components/Earn/ReferralWidget';
import { TaskGrid } from '../components/Earn/TaskGrid';
import { EARN_TASKS, Task } from '../data/earnData';
import { useUser } from '../context/UserContext';
import { Confetti } from '../components/ui/Confetti';
import { CheckCircle2, Trophy, QrCode, X, Share2, Download, Copy, ExternalLink } from 'lucide-react';

export default function ReferralPage() {
    const { notification, selection } = useHaptic();
    const { user, updateUser } = useUser();

    // Local State for Instant Feedback
    const [tasks, setTasks] = useState<Task[]>(EARN_TASKS);
    const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
    const [levelUp, setLevelUp] = useState(false);
    const [confettiActive, setConfettiActive] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    // Derived User State (with defaults)
    const currentLevel = user?.level || 1;
    const currentXP = user?.xp || 0;
    const referrals = user?.referrals?.length || 0;
    const referralLink = `https://t.me/pintopay_probot?start=${user?.referral_code || 'ref_dev'}`;

    const VIRAL_HOOK = "🛑 STOP BLEEDING MONEY TO BANKS! 🛑";
    const VIRAL_SUBTITLE = "Start earning like a bank. $1 Every Minute. 🚀";
    const VIRAL_TEXT = `${VIRAL_HOOK}\n\nEverything you know about money is changing. While others lose, the 1% are profiting. 🦅\n\nJoin the Pintopay Partner Hub and start earning $1/minute in passive income.\n\n🔥 NO Bureaucracy\n🔥 NO Restrictions\n🔥 100% Financial Sovereignty\n\nBuild your empire now. 👇`;

    // Load completed tasks from storage on mount
    useEffect(() => {
        const stored = localStorage.getItem('p2p_completed_tasks');
        if (stored) {
            setCompletedTaskIds(JSON.parse(stored));
        }
    }, []);

    // Handle Task Claiming Logic
    const handleClaim = (task: Task) => {
        if (completedTaskIds.includes(task.id)) return;

        selection();
        notification('success');

        // 1. Mark as completed locally
        const newCompleted = [...completedTaskIds, task.id];
        setCompletedTaskIds(newCompleted);
        localStorage.setItem('p2p_completed_tasks', JSON.stringify(newCompleted));

        // 2. Award XP
        updateUser?.({ xp: currentXP + task.reward });

        // 3. Check Level Up
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

    // Handle External Link Clicks
    const handleTaskClick = (task: Task) => {
        if (task.link) {
            selection();
            window.open(task.link, '_blank');
        }
    };
    const handleCopyLink = () => {
        selection();
        notification('success');
        navigator.clipboard.writeText(referralLink);
    };

    const handleShareTelegram = () => {
        selection();
        const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(VIRAL_TEXT)}`;
        window.open(url, '_blank');
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

            {/* Share Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="w-full max-w-sm bg-(--color-bg-surface) border-border-glass rounded-[2.5rem] p-6 relative shadow-premium overflow-hidden"
                        >
                            {/* Decorative Background for Viral Feel */}
                            <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-blue-600/20 to-transparent pointer-events-none" />

                            <button
                                onClick={() => setShowShareModal(false)}
                                className="absolute top-4 right-4 p-2 bg-bg-app/50 backdrop-blur-sm rounded-full text-text-secondary hover:text-text-primary z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="relative z-10 space-y-6 pt-2">
                                {/* Viral Preview Card */}
                                <div className="glass-panel-premium overflow-hidden rounded-3xl border-[var(--color-border-glass)] shadow-lg">
                                    <img
                                        src="/viral-invite.jpg"
                                        alt="Passive Income Empire"
                                        className="w-full h-40 object-cover"
                                    />
                                    <div className="p-4 space-y-1">
                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">Limited Access Tier</p>
                                        <h4 className="text-sm font-black text-[var(--color-text-primary)] leading-snug">
                                            {VIRAL_HOOK}
                                        </h4>
                                        <p className="text-[10px] font-bold text-[var(--color-text-secondary)] italic opacity-60">
                                            {VIRAL_SUBTITLE}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-xl font-black text-center text-text-primary tracking-tight">Recruit Your Inner Circle</h3>

                                    <div className="grid grid-cols-1 gap-3">
                                        <button
                                            onClick={handleShareTelegram}
                                            className="w-full h-14 bg-[#0088cc] text-white rounded-2xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                                        >
                                            <Share2 className="w-5 h-5" />
                                            Share to Telegram
                                        </button>

                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={handleNativeShare}
                                                className="h-14 glass-panel rounded-2xl font-bold text-text-primary flex items-center justify-center gap-2 active:scale-95 transition-all"
                                            >
                                                <ExternalLink className="w-4 h-4 opacity-60" /> Share...
                                            </button>
                                            <button
                                                onClick={handleCopyLink}
                                                className="h-14 glass-panel rounded-2xl font-bold text-text-primary flex items-center justify-center gap-2 active:scale-95 transition-all"
                                            >
                                                <Copy className="w-4 h-4 opacity-60" /> Copy Link
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-[10px] text-center text-brand-muted font-bold px-4">
                                    Each referral boosts your XP and moves you closer to the **Physical Platinum Card**.
                                </p>
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
                            className="w-full max-w-sm bg-(--color-bg-surface) border-border-glass rounded-[2.5rem] p-6 relative shadow-premium"
                        >
                            <button
                                onClick={() => setShowQR(false)}
                                className="absolute top-4 right-4 p-2 bg-[var(--color-bg-app)] rounded-full text-text-secondary hover:text-text-primary"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="text-center space-y-6">
                                <div className="space-y-2 pt-2">
                                    <h3 className="text-2xl font-black text-[var(--color-text-primary)] leading-none tracking-tight">
                                        Claim Your <br />
                                        <span className="text-blue-500 uppercase italic">Financial Sovereignty</span>
                                    </h3>
                                    <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                                        Earn <span className="text-emerald-500 font-bold">$1/minute</span> for every active partner. <br />
                                        Build your empire now.
                                    </p>
                                </div>

                                <div className="mx-auto w-64 h-64 bg-white p-4 rounded-3xl shadow-[0_0_40px_rgba(59,130,246,0.1)] border border-slate-100">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(referralLink)}`}
                                        alt="Your Referral QR Code"
                                        className="w-full h-full object-contain"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        className="flex-1 py-3 glass-panel rounded-xl font-bold text-sm text-text-primary flex items-center justify-center gap-2 active:scale-95 transition-all"
                                        onClick={handleCopyLink}
                                    >
                                        <Copy className="w-4 h-4" /> Copy Link
                                    </button>
                                    <button
                                        className="flex-1 py-3 bg-blue-600 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                        onClick={() => {
                                            const a = document.createElement('a');
                                            a.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(referralLink)}`;
                                            a.download = 'Pintopay_Invite.png';
                                            a.click();
                                        }}
                                    >
                                        <Download className="w-4 h-4" /> Save QR
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
                            className="bg-[var(--color-bg-surface)] border border-yellow-500/20 p-8 rounded-[2.5rem] text-center space-y-4 shadow-float"
                        >
                            <Trophy className="w-16 h-16 text-yellow-400 mx-auto animate-bounce" />
                            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-orange-500">
                                LEVEL UP!
                            </h2>
                            <p className="text-text-secondary font-bold italic">You reached Level {currentLevel + 1}</p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <h1 className="text-3xl font-black mb-6 tracking-tighter text-gradient-primary">
                Earn & Level Up
            </h1>

            <EarnHeader />

            {/* Quick Actions */}
            <ReferralWidget
                onInvite={() => setShowShareModal(true)}
                onShowQR={() => setShowQR(true)}
            />

            <MilestonePath />

            {/* Task Grid */}
            <TaskGrid
                tasks={tasks}
                completedTaskIds={completedTaskIds}
                currentLevel={currentLevel}
                referrals={referrals}
                onTaskClick={handleTaskClick}
                onClaim={handleClaim}
            />

            {/* Safe Area Spacer */}
            <div className="h-24" />
        </div>
    );
}
