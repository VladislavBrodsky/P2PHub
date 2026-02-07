import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Section } from '../components/Section';
import { CommunityOrbit } from '../components/Marketing/CommunityOrbit';
import { Ticker } from '../components/Marketing/Ticker';
import { Skeleton } from '../components/Skeleton';
import { Button } from '../components/ui/Button';
import { useHaptic } from '../hooks/useHaptic';
import { Wallet, ChevronRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { getRank, getXPProgress } from '../utils/ranking';

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
        xp: 0,
        referral_code: 'P2P-DEV'
    };

    const currentRank = getRank(stats.level || 1);
    const xpProgress = getXPProgress(stats.level || 1, stats.xp || 0);

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
            {/* 0. Personalization Section - Centered & Premium */}
            <motion.div variants={item} className="px-4 pt-4">
                <div className="flex flex-col items-center text-center gap-5">
                    {/* Centered Avatar with Level Badge */}
                    <div className="relative group">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 2 }}
                            className="h-24 w-24 overflow-hidden rounded-[2rem] border-2 border-[var(--color-brand-border)] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-300"
                        >
                            {isUserLoading ? (
                                <div className="h-full w-full bg-slate-100 animate-pulse" />
                            ) : (
                                <img
                                    src={user?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'partner'}`}
                                    alt="Avatar"
                                    className="h-full w-full object-cover"
                                />
                            )}
                        </motion.div>

                        {/* Level Badge Integrated into Avatar */}
                        <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-brand-blue)] text-white shadow-premium ring-4 ring-[var(--color-bg-app)]">
                            <span className="text-[10px] font-black">{user?.level || 1}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <h2 className="text-3xl font-black tracking-tight text-[var(--color-text-primary)]">
                            Hi, {user?.first_name || 'Partner'}!
                        </h2>

                        {/* Ranking & XP Section */}
                        <div className="flex flex-col items-center gap-3 w-full max-w-[280px]">
                            {/* Rank Badge */}
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="flex items-center gap-2 px-5 py-2 rounded-2xl border-2 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] backdrop-blur-xl transition-all duration-500"
                                style={{
                                    backgroundColor: `${currentRank.badgeColor}10`,
                                    borderColor: `${currentRank.badgeColor}30`,
                                    color: currentRank.badgeColor
                                }}
                            >
                                <Sparkles className="h-4 w-4" style={{ color: currentRank.badgeColor }} />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                                    {currentRank.name}
                                </span>
                            </motion.div>

                            {/* XP Progress Bar */}
                            <div className="w-full space-y-1.5 mt-2">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black text-slate-400/80 tracking-widest uppercase">XP BALANCE</span>
                                    <span className="text-[11px] font-black text-[var(--color-text-primary)]">
                                        {xpProgress.current} <span className="text-slate-300 font-medium">/</span> {xpProgress.total}
                                    </span>
                                </div>
                                <div className="h-3.5 w-full bg-slate-100/50 rounded-full overflow-hidden p-1 border border-slate-200/40 backdrop-blur-sm shadow-inner">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${xpProgress.percent}%` }}
                                        transition={{ duration: 1.5, ease: 'circOut' }}
                                        className="h-full rounded-full shadow-[0_2px_10px_-2px_rgba(0,0,0,0.1)] relative overflow-hidden"
                                        style={{ backgroundColor: currentRank.badgeColor }}
                                    >
                                        <motion.div
                                            animate={{ x: ['-100%', '200%'] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                        />
                                    </motion.div>
                                </div>
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
                        <h1 className="text-4xl font-extrabold tracking-tighter text-[var(--color-text-primary)] leading-[1.1]">
                            Together,<br />
                            Let's Build a Brand<br />
                            <span className="text-[var(--color-brand-blue)]">That Truly Connects</span>
                        </h1>
                    </div>

                    {/* Ticker moved here with padding */}
                    <motion.div variants={item} className="-rotate-1 py-8 scale-[1.05]">
                        <Ticker />
                    </motion.div>

                    <div className="space-y-6">
                        <div className="space-y-1 px-4">
                            <h2 className="text-xl font-black text-[var(--color-text-secondary)] tracking-tight leading-tight max-w-[320px] mx-auto">
                                Join the Global Financial Shift and <span className="text-[var(--color-text-primary)] uppercase tracking-wider block mt-1">Digital Gold Rush</span>
                            </h2>
                        </div>

                        <p className="text-[var(--color-text-secondary)] mx-auto max-w-[340px] text-xs font-medium leading-relaxed opacity-80 px-4">
                            The global market is shifting. Traditional finance is slow, closed, and filled with friction. <strong className="text-[var(--color-text-primary)] font-bold">Pintopay</strong> is the bridge to a borderless era. We're not just building an app; we're launching a movement.
                        </p>
                    </div>
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

