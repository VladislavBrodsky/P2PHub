import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Section } from '../components/Section';
import { CommunityOrbit } from '../components/Marketing/CommunityOrbit';
import { Ticker } from '../components/Marketing/Ticker';
import { BentoFeature } from '../components/Marketing/BentoFeature';
import { Skeleton } from '../components/Skeleton';
import { Button } from '../components/ui/Button';
import { useHaptic } from '../hooks/useHaptic';
import { Star, Users, Zap, Globe, Shield, Wallet, ChevronRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '../context/UserContext';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://p2phub-production.up.railway.app') + '/api';

export default function Dashboard() {
    const { selection } = useHaptic();
    const { user, isLoading: isUserLoading } = useUser();
    const [copied, setCopied] = useState(false);

    const { data: earnings, isLoading: isEarningsLoading } = useQuery({
        queryKey: ['earnings'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/earnings/`);
            return res.data;
        }
    });

    // Fallback if no stats
    const stats = user || {
        balance: 0,
        level: 1,
        referral_code: 'P2P-DEV'
    };

    const referralLink = `https://t.me/pintopay_bot?start=${stats.referral_code}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        selection();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
    };

    return (
        <motion.div
            className="flex w-full flex-col gap-6 pb-32 px-0"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* 0. Personalization Section */}
            <motion.div variants={item} className="px-5 pt-4">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-[var(--color-brand-border)] bg-[var(--color-bg-surface)] shadow-inner">
                            <img
                                src={user?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'partner'}`}
                                alt="Avatar"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-brand-blue)] text-white shadow-sm ring-2 ring-[var(--color-bg-app)]">
                            <Sparkles className="h-3 w-3 fill-current" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">
                            Hi, {user?.first_name || 'Partner'}!
                        </h2>
                        <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">
                            Level {user?.level || 1} • {user?.level && user.level > 10 ? 'Elite' : 'Pioneer'} Partner
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* 1. Hero Section - Visual Impact */}
            <motion.div variants={item} className="px-3">
                <CommunityOrbit />
            </motion.div>

            {/* 2. Ticker */}
            <motion.div variants={item} className="-rotate-1 my-2 scale-105">
                <Ticker />
            </motion.div>

            {/* 3. Main Stats - Earning Focus */}
            <motion.div variants={item} className="px-3">
                <div className="relative overflow-hidden rounded-xl border border-[var(--color-brand-border)]/20 bg-[var(--color-bg-surface)] p-6 shadow-xl">
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--color-brand-blue)]/10 blur-3xl" />

                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[var(--color-text-secondary)] mb-1 text-sm font-bold uppercase tracking-widest">
                                Total Balance
                            </p>
                            {isUserLoading ? (
                                <Skeleton className="h-10 w-32" />
                            ) : (
                                <span className="text-[var(--color-text-primary)] text-4xl font-black tracking-tight drop-shadow-lg">
                                    ${(stats.balance || 0).toLocaleString()}
                                </span>
                            )}
                        </div>
                        <div className="bg-gradient-to-br from-[var(--color-brand-blue)]/20 to-[var(--color-brand-blue)]/5 border-[var(--color-brand-blue)]/20 flex h-10 w-10 items-center justify-center rounded-xl border shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                            <Star className="text-[var(--color-brand-blue)] fill-[var(--color-brand-blue)] h-5 w-5" />
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <Button
                            variant="primary"
                            className="flex-1 shadow-lg"
                            onClick={() => selection()}
                        >
                            Withdraw
                        </Button>
                        <Button variant="secondary" className="flex-1" onClick={() => selection()}>
                            Activity
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* 4. Secondary Stats Grid */}
            <motion.div variants={item} className="grid grid-cols-2 gap-3 px-3">
                <div className="rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-bg-surface)] p-4 transition-all hover:bg-[var(--color-bg-glass)]">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                        <Users className="h-5 w-5" />
                    </div>
                    <p className="text-[var(--color-text-primary)] text-2xl font-black">12</p>
                    <p className="text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider">Partners</p>
                </div>
                <div className="rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-bg-surface)] p-4 transition-all hover:bg-[var(--color-bg-glass)]">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                        <Zap className="h-5 w-5" />
                    </div>
                    <p className="text-[var(--color-text-primary)] text-2xl font-black">850</p>
                    <p className="text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider">Network XP</p>
                </div>
            </motion.div>

            {/* 5. Benefits Grid (Bento) */}
            <motion.div variants={item} className="px-3">
                <h3 className="mb-4 pl-1 text-lg font-black tracking-tight text-[var(--color-text-primary)]">
                    Why Partner?
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <BentoFeature
                        title="Global Access"
                        description="Earn from anywhere."
                        icon={Globe}
                        delay={0.1}
                        featured={true}
                    />
                    <BentoFeature
                        title="Instant"
                        description="Crypto payouts."
                        icon={Zap}
                        delay={0.2}
                    />
                    <BentoFeature
                        title="Secure"
                        description="Bank-grade security."
                        icon={Shield}
                        delay={0.3}
                    />
                </div>
            </motion.div>

            {/* 6. Referral Link */}
            <motion.div variants={item} className="px-3">
                <div className="space-y-3 rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-bg-surface)] p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-[var(--color-text-secondary)]" />
                        <span className="text-[var(--color-text-secondary)] text-xs font-black uppercase tracking-widest">Invitation Link</span>
                    </div>
                    <div
                        className="group flex cursor-pointer items-center justify-between rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-bg-glass)] p-3 transition-all hover:bg-[var(--color-bg-surface)] active:scale-[0.98]"
                        onClick={handleCopy}
                    >
                        <span className="max-w-[200px] truncate font-mono text-xs font-bold text-[var(--color-text-secondary)] transition-colors group-hover:text-[var(--color-text-primary)]">
                            {referralLink}
                        </span>
                        <div className="flex items-center gap-1.5 rounded-lg bg-[var(--color-bg-surface)] px-2 py-1 shadow-sm">
                            <span className="text-[var(--color-text-primary)] text-xs font-black uppercase">
                                {copied ? 'COPIED' : 'COPY'}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 7. Recent Activity */}
            <motion.div variants={item} className="px-3">
                <Section
                    title="Recent Earnings"
                    headerAction={
                        <button className="text-[var(--color-text-secondary)] flex items-center gap-0.5 text-[10px] font-black uppercase tracking-widest transition-colors hover:text-[var(--color-text-primary)]">
                            VIEW ALL <ChevronRight className="h-3 w-3" />
                        </button>
                    }
                >
                    <div className="flex flex-col gap-2.5">
                        {earnings?.map((e: any) => (
                            <div
                                key={e.id}
                                className="flex cursor-pointer items-center justify-between rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-bg-surface)] p-3 shadow-sm transition-all hover:bg-[var(--color-bg-glass)]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-lg font-bold text-blue-500">
                                        {e.description[0]}
                                    </div>
                                    <div>
                                        <p className="text-[var(--color-text-primary)] text-sm font-bold">
                                            {e.description}
                                        </p>
                                        <p className="text-[var(--color-text-secondary)] text-[10px] font-black uppercase tracking-widest">
                                            Success
                                        </p>
                                    </div>
                                </div>
                                <span className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-600">
                                    +${e.amount}
                                </span>
                            </div>
                        )) || (
                                <div className="text-center py-8 text-[var(--color-text-secondary)] font-bold italic">No recent earnings</div>
                            )}
                    </div>
                </Section>
            </motion.div>

        </motion.div>
    );
}

