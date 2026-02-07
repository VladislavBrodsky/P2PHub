import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Star, Copy, Share2, DollarSign, Zap, Wallet } from 'lucide-react';
import { useHaptic } from '../hooks/useHaptic';
import { Button } from '../components/ui/Button';
import { Section } from '../components/Section';
import { Skeleton } from '../components/Skeleton';
import { ListSkeleton } from '../components/Skeletons/ListSkeleton';
import { useUser } from '../context/UserContext';

export default function ReferralPage() {
    const [isLoading, setIsLoading] = useState(true);
    const { notification, selection } = useHaptic();
    const { user, isLoading: isUserLoading } = useUser();

    // Fallback if no stats
    const stats = user || {
        balance: 0,
        level: 1,
        referral_code: 'P2P-DEV'
    };

    const referralLink = `https://t.me/pintopay_bot?start=${user?.referral_code || 'ref_dev'}`;

    useEffect(() => {
        // Simulate loading
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const copyLink = () => {
        navigator.clipboard.writeText(referralLink);
        notification('success');
    };

    const handleInvite = () => {
        selection();
        // Open Telegram share
        const text = encodeURIComponent("Join me on Pintopay and get a virtual card!");
        window.open(`https://t.me/share/url?url=${referralLink}&text=${text}`, '_blank');
    };

    if (isLoading) return <div className="p-4"><ListSkeleton /></div>;

    return (
        <div className="flex flex-col min-h-[85vh] px-4 pt-4 pb-32">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-6">Referral Program</h1>

            {/* 1. Main Stats - Earning Focus */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
            >
                <div className="relative overflow-hidden rounded-3xl border border-[var(--color-brand-border)] bg-[var(--color-bg-surface)] p-8 shadow-premium transition-all duration-300 hover:shadow-float">
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--color-brand-blue)]/5 blur-[80px]" />
                    <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[var(--color-success)]/5 blur-[80px]" />

                    <div className="relative flex items-start justify-between">
                        <div>
                            <p className="text-[10px] mb-2 font-black uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
                                Total Balance
                            </p>
                            {isUserLoading ? (
                                <Skeleton className="h-10 w-32" />
                            ) : (
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[var(--color-text-primary)] text-5xl font-black tracking-tighter">
                                        ${(stats.balance || 0).toLocaleString()}
                                    </span>
                                    <span className="text-sm font-black text-brand-blue tracking-wider">USD</span>
                                </div>
                            )}
                        </div>
                        <div className="bg-white border-[var(--color-brand-border)] flex h-14 w-14 items-center justify-center rounded-2xl border shadow-premium transition-all hover:rotate-12 hover:scale-110">
                            <Star className="text-[var(--color-brand-blue)] fill-[var(--color-brand-blue)] h-7 w-7" />
                        </div>
                    </div>

                    <div className="relative mt-12 flex gap-4">
                        <Button
                            variant="primary"
                            className="h-14 flex-1 rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-[0_15px_30px_-10px_rgba(0,0,0,0.2)] bg-action-black text-white hover:scale-[1.02] active:scale-[0.98] transition-all"
                            onClick={() => selection()}
                        >
                            Withdraw
                        </Button>
                        <Button
                            variant="secondary"
                            className="h-14 flex-1 rounded-2xl font-black text-[13px] uppercase tracking-widest border border-[var(--color-brand-border)] bg-white text-[var(--color-text-primary)] hover:bg-slate-50 active:scale-[0.98] transition-all"
                            onClick={() => selection()}
                        >
                            History
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* 2. Secondary Stats Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-2 gap-4 mb-8"
            >
                <div className="group rounded-3xl border border-[var(--color-brand-border)] bg-[var(--color-bg-surface)] p-5 shadow-premium transition-all hover:shadow-float hover:-translate-y-1">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                        <Users className="h-5 w-5" />
                    </div>
                    <p className="text-[var(--color-text-primary)] text-3xl font-black tracking-tight">12</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Partners</p>
                </div>
                <div className="group rounded-3xl border border-[var(--color-brand-border)] bg-[var(--color-bg-surface)] p-5 shadow-premium transition-all hover:shadow-float hover:-translate-y-1">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 transition-colors group-hover:bg-orange-600 group-hover:text-white">
                        <Zap className="h-5 w-5" />
                    </div>
                    <p className="text-[var(--color-text-primary)] text-3xl font-black tracking-tight">850</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Network XP</p>
                </div>
            </motion.div>

            {/* 2. Your Link */}
            <Section title="Your Invite Link" className="mb-8">
                <div className="rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-bg-surface)] p-4 shadow-sm flex items-center justify-between">
                    <div className="overflow-hidden">
                        <p className="text-xs text-[var(--color-text-secondary)] mb-1 font-bold uppercase tracking-wider">Share this link</p>
                        <p className="text-sm font-mono text-[var(--color-text-primary)] truncate max-w-[200px]">{referralLink}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={copyLink}
                            className="p-2 rounded-lg bg-[var(--color-bg-glass)] text-[var(--color-text-primary)] hover:bg-[var(--color-brand-border)] transition-colors"
                        >
                            <Copy className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleInvite}
                            className="p-2 rounded-lg bg-[var(--color-brand-primary)] text-white shadow-lg shadow-[var(--color-brand-primary)]/20 transition-transform active:scale-95"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </Section>

            {/* 3. Recent Referrals List */}
            <Section title="Recent Referrals">
                <div className="space-y-3">
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-bg-surface)] p-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                                <div>
                                    <p className="text-sm font-bold text-[var(--color-text-primary)]">User_{Math.floor(Math.random() * 10000)}</p>
                                    <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">Joined today</p>
                                </div>
                            </div>
                            <span className="text-xs font-black text-emerald-500">+100 XP</span>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Sticky Action */}
            <div className="fixed bottom-24 left-0 right-0 px-4 z-50">
                <Button
                    variant="primary"
                    className="w-full h-14 text-base shadow-xl"
                    onClick={handleInvite}
                    leftIcon={<DollarSign className="w-5 h-5" />}
                >
                    Invite Friends & Earn
                </Button>
            </div>
        </div>
    );
}
