import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Section } from '../components/Section';
import { CommunityOrbit } from '../components/Marketing/CommunityOrbit';
import { Ticker } from '../components/Marketing/Ticker';
import { Skeleton } from '../components/Skeleton';
import { Button } from '../components/ui/Button';
import { useHaptic } from '../hooks/useHaptic';
import { Star, Users, Zap, Wallet, ChevronRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '../context/UserContext';

const PROD_URL = 'https://p2phub-backend-production.up.railway.app';
const API_BASE = (import.meta.env.VITE_API_URL || PROD_URL) + '/api';

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
            className="flex w-full flex-col gap-8 pb-32 px-0 min-h-[100dvh]"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* 0. Personalization Section */}
            <motion.div variants={item} className="px-4">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="h-16 w-16 overflow-hidden rounded-2xl border border-[var(--color-brand-border)] bg-white shadow-premium transition-all duration-300 group-hover:scale-105 group-hover:rotate-2">
                            {isUserLoading ? (
                                <div className="h-full w-full bg-slate-100 animate-pulse" />
                            ) : (
                                <img
                                    src={user?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'partner'}`}
                                    alt="Avatar"
                                    className="h-full w-full object-cover"
                                />
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-brand-blue)] text-white shadow-premium ring-2 ring-[var(--color-bg-app)]">
                            <Sparkles className="h-3 w-3 fill-current" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-2xl font-black tracking-tighter text-[var(--color-text-primary)] leading-none">
                            Hi, {user?.first_name ? (user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name) : 'Partner'}!
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1 border border-slate-100">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    LVL {user?.level || 1}
                                </span>
                                <div className="h-2 w-px bg-slate-300" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-brand-blue)]">
                                    {user?.level && user.level > 10 ? 'Elite' : 'Pioneer'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 1. Hero Section - Seamless Integration */}
            <motion.div variants={item} className="px-4 space-y-4">
                <div className="relative overflow-visible">
                    <CommunityOrbit />
                </div>

                <div className="text-center space-y-8 px-2">
                    <div className="space-y-2">
                        <motion.div
                            className="inline-block mb-2 rounded-full border border-blue-500/30 bg-blue-500/5 backdrop-blur-sm px-4 py-1.5"
                            animate={{
                                boxShadow: ["0 0 0px rgba(59, 130, 246, 0)", "0 0 15px rgba(59, 130, 246, 0.4)", "0 0 0px rgba(59, 130, 246, 0)"],
                                borderColor: ["rgba(59, 130, 246, 0.3)", "rgba(59, 130, 246, 0.8)", "rgba(59, 130, 246, 0.3)"]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-brand-blue)]">
                                Our Mission
                            </p>
                        </motion.div>
                        <h1 className="text-5xl font-extrabold tracking-tighter text-[var(--color-text-primary)] leading-[0.95]">
                            Together,<br />
                            Let's Build a Brand<br />
                            <span className="text-[var(--color-brand-blue)]">That Truly Connects</span>
                        </h1>
                    </div>

                    <div className="space-y-1 px-4">
                        <h2 className="text-xl font-black text-[var(--color-text-secondary)] tracking-tight leading-tight max-w-[320px] mx-auto">
                            Join the Global Financial Shift and <span className="text-[var(--color-text-primary)] uppercase tracking-wider block mt-1">Digital Gold Rush</span>
                        </h2>
                    </div>

                    <p className="text-[var(--color-text-secondary)] mx-auto max-w-[340px] text-xs font-medium leading-relaxed opacity-80">
                        The global market is shifting. Traditional finance is slow, closed, and filled with friction. <strong className="text-[var(--color-text-primary)] font-bold">Pintopay</strong> is the bridge to a borderless era. We're not just building an app; we're launching a movement.
                    </p>
                </div>
            </motion.div>

            {/* 2. Ticker */}
            <motion.div variants={item} className="-rotate-1 my-1 scale-[1.02]">
                <Ticker />
            </motion.div>

            {/* 3. Main Stats - Earning Focus */}
            <motion.div variants={item} className="px-4">
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
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[var(--color-text-primary)] text-5xl font-black tracking-tighter">
                                        ${(stats.balance || 0).toLocaleString()}
                                    </span>
                                    <span className="text-sm font-bold text-[var(--color-text-secondary)]">USD</span>
                                </div>
                            )}
                        </div>
                        <div className="bg-white border-[var(--color-brand-border)] flex h-12 w-12 items-center justify-center rounded-2xl border shadow-premium transition-transform hover:rotate-12">
                            <Star className="text-[var(--color-brand-blue)] fill-[var(--color-brand-blue)] h-6 w-6" />
                        </div>
                    </div>

                    <div className="relative mt-10 flex gap-4">
                        <Button
                            variant="primary"
                            className="h-12 flex-1 rounded-2xl font-bold shadow-premium bg-[var(--color-text-primary)] text-white hover:scale-[1.02] active:scale-[0.98] transition-all"
                            onClick={() => selection()}
                        >
                            Withdraw
                        </Button>
                        <Button
                            variant="secondary"
                            className="h-12 flex-1 rounded-2xl font-bold border-[var(--color-brand-border)] bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-app)] active:scale-[0.98] transition-all"
                            onClick={() => selection()}
                        >
                            Activity
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* 4. Secondary Stats Grid */}
            <motion.div variants={item} className="grid grid-cols-2 gap-4 px-4">
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

            {/* 6. Referral Link */}
            <motion.div variants={item} className="px-4">
                <div className="space-y-4 rounded-3xl border border-[var(--color-brand-border)] bg-[var(--color-bg-surface)] p-6 shadow-premium">
                    <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-[var(--color-text-secondary)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Invitation Link</span>
                    </div>
                    <div
                        className="group flex cursor-pointer items-center justify-between rounded-2xl border border-[var(--color-brand-border)] bg-[var(--color-bg-app)] p-4 transition-all hover:bg-white hover:shadow-soft active:scale-[0.98]"
                        onClick={handleCopy}
                    >
                        <span className="max-w-[200px] truncate font-mono text-xs font-bold text-[var(--color-text-secondary)] transition-colors group-hover:text-[var(--color-text-primary)]">
                            {referralLink}
                        </span>
                        <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 shadow-sm border border-[var(--color-brand-border)]">
                            <span className="text-[var(--color-text-primary)] text-[10px] font-black uppercase tracking-wider">
                                {copied ? 'COPIED' : 'COPY'}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* 7. Recent Activity */}
            <motion.div variants={item} className="px-4">
                <Section
                    title="Recent Earnings"
                    headerAction={
                        <button className="text-[var(--color-text-secondary)] flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-colors hover:text-[var(--color-text-primary)]">
                            VIEW ALL <ChevronRight className="h-3 w-3" />
                        </button>
                    }
                >
                    <div className="flex flex-col gap-3 mt-4">
                        {earnings?.map((e: any) => (
                            <div
                                key={e.id}
                                className="group flex cursor-pointer items-center justify-between rounded-2xl border border-[var(--color-brand-border)] bg-[var(--color-bg-surface)] p-4 shadow-premium transition-all hover:shadow-float hover:-translate-y-0.5"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg font-bold text-slate-600 transition-colors group-hover:bg-[var(--color-brand-blue)]/10 group-hover:text-[var(--color-brand-blue)]">
                                        {e.description[0]}
                                    </div>
                                    <div>
                                        <p className="text-[var(--color-text-primary)] text-sm font-bold">
                                            {e.description}
                                        </p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-success)] mt-0.5">
                                            Success
                                        </p>
                                    </div>
                                </div>
                                <span className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-600 shadow-sm">
                                    +${e.amount}
                                </span>
                            </div>
                        )) || (
                                <div className="text-center py-10 rounded-2xl border border-dashed border-[var(--color-brand-border)] text-sm text-[var(--color-text-secondary)] font-bold italic">
                                    No recent earnings yet
                                </div>
                            )}
                    </div>
                </Section>
            </motion.div>

        </motion.div>
    );
}

