import { useState, useEffect } from 'react';
import { Users, Star, Copy, Share2, DollarSign } from 'lucide-react';
import { useHaptic } from '../hooks/useHaptic';
import { Button } from '../components/ui/Button';
import { Section } from '../components/Section';
import { ListSkeleton } from '../components/Skeletons/ListSkeleton';
import { useUser } from '../context/UserContext';

export default function ReferralPage() {
    const [isLoading, setIsLoading] = useState(true);
    const { notification, selection } = useHaptic();
    const { user } = useUser();

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

            {/* 1. Main Stats Cards */}
            <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-brand-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
                    <div className="bg-[var(--color-bg-glass)] flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-brand-border)]">
                        <Users className="text-[var(--color-text-secondary)] h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-[var(--color-text-primary)] block text-3xl font-black tracking-tighter">12</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">
                            Active Partners
                        </span>
                    </div>
                </div>
                <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-brand-border)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
                    <div className="bg-[var(--color-bg-glass)] flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-brand-border)]">
                        <Star className="text-[var(--color-text-secondary)] h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-[var(--color-text-primary)] block text-3xl font-black tracking-tighter">850</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">
                            XP Generated
                        </span>
                    </div>
                </div>
            </div>

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
