// #comment: Premium NetworkExplorer with search, sorting, and enhanced visual feedback
import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    Users, X, UserPlus, AlertCircle, TrendingUp, Award, Zap,
    ChevronRight, Search, SlidersHorizontal, Share2, RefreshCw
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { getApiUrl } from '../../utils/api';
import { cn } from '../../lib/utils';
import { useHaptic } from '../../hooks/useHaptic';
import { useUser } from '../../context/UserContext';
import { ShareSheet } from '../ShareSheet';

interface NetworkMember {
    telegram_id: string;
    username: string;
    first_name: string;
    last_name: string;
    xp: number;
    photo_url: string;
    photo_file_id?: string;
    created_at: string;
}

interface NetworkExplorerProps {
    onClose?: () => void;
    initialTotalCount?: number;
}

const MemberSkeleton = () => (
    <div className="flex items-center gap-2.5 p-2 bg-white dark:bg-white/5 rounded-xl animate-pulse border border-slate-100 dark:border-white/5">
        <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-white/10 shrink-0" />
        <div className="flex-1 space-y-1.5">
            <div className="h-3 w-1/3 bg-slate-200 dark:bg-white/10 rounded" />
            <div className="h-2 w-1/4 bg-slate-100 dark:bg-white/5 rounded" />
        </div>
        <div className="w-10 h-5 bg-slate-200 dark:bg-white/10 rounded" />
    </div>
);

export const NetworkExplorer = ({ onClose, initialTotalCount = 0 }: NetworkExplorerProps) => {
    const { t } = useTranslation();
    const { selection, impact, notification } = useHaptic();
    const { user } = useUser();
    const queryClient = useQueryClient();

    // UI State
    const [level, setLevel] = useState(1);
    const [isGlobalMode, setIsGlobalMode] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Refs
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setIsScrolled(e.currentTarget.scrollTop > 10);
    };

    // --- Data Fetching Logic (React Query) ---

    const { data: treeStats = {}, refetch: refetchStats } = useQuery({
        queryKey: ['network', 'stats', isGlobalMode ? 'global' : 'partner'],
        queryFn: async () => {
            const url = isGlobalMode ? '/api/admin/tree' : '/api/partner/tree';
            const res = await apiClient.get(url);
            return res.data as Record<string, number>;
        },
        staleTime: 1000 * 60 * 5,
    });

    const fetchLevelData = async (lvl: number, global: boolean) => {
        const url = global
            ? `/api/admin/network/${lvl}`
            : `/api/partner/network/${lvl}`;
        const res = await apiClient.get(url);
        return Array.isArray(res.data) ? res.data : ([] as NetworkMember[]);
    };

    const {
        data: members = [],
        isLoading,
        isError,
        error,
        isFetching,
        refetch: refetchMembers
    } = useQuery({
        queryKey: ['network', 'level', level, isGlobalMode ? 'global' : 'partner'],
        queryFn: () => fetchLevelData(level, isGlobalMode),
        staleTime: 1000 * 60 * 5,
    });

    // Prefetch logic
    useEffect(() => {
        const neighbors = [];
        if (level < 9) neighbors.push(level + 1);
        if (level > 1) neighbors.push(level - 1);

        neighbors.forEach(bgLevel => {
            queryClient.prefetchQuery({
                queryKey: ['network', 'level', bgLevel, isGlobalMode ? 'global' : 'partner'],
                queryFn: () => fetchLevelData(bgLevel, isGlobalMode),
                staleTime: 1000 * 60 * 5,
            });
        });
    }, [level, isGlobalMode, queryClient]);

    // Derived Data: Filtered Members
    const filteredMembers = useMemo(() => {
        if (!searchQuery.trim()) return members;
        const q = searchQuery.toLowerCase();
        return members.filter(m =>
            m.first_name.toLowerCase().includes(q) ||
            m.last_name?.toLowerCase().includes(q) ||
            m.username?.toLowerCase().includes(q)
        );
    }, [members, searchQuery]);

    // Derived Data: Level Insights
    const levelInsights = useMemo(() => {
        if (!members.length) return null;

        const topPerformer = [...members].sort((a, b) => b.xp - a.xp)[0];
        const avgXp = Math.round(members.reduce((acc, m) => acc + m.xp, 0) / members.length);

        return { topPerformer, avgXp };
    }, [members]);

    // UI Effects
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
    }, [level]);

    useEffect(() => {
        if (scrollContainerRef.current) {
            const activeButton = scrollContainerRef.current.children[level - 1] as HTMLElement;
            if (activeButton) {
                activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [level]);

    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    const handleRefresh = async () => {
        impact('medium');
        await Promise.all([refetchStats(), refetchMembers()]);
        notification('success');
    };

    const getLevelName = (l: number) => {
        switch (l) {
            case 1: return t('network.levels.direct', 'Direct Partners');
            case 2: return t('network.levels.indirect', 'Level 2 Squad');
            default: return t('network.levels.generic', 'Level {{l}} Network', { l });
        }
    };

    const statsTotal = Object.values(treeStats).reduce((acc, curr) => acc + (typeof curr === 'number' ? curr : 0), 0);
    const displayTotal = Math.max(statsTotal, initialTotalCount);

    return (
        <div className="bg-[#f8fafc] dark:bg-[#0b1120] rounded-[2.5rem] overflow-hidden flex flex-col h-full max-h-[85vh] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative border border-white/50 dark:border-white/5">
            {/* Soft Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-1/2 h-32 bg-blue-500/10 blur-[60px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl pointer-events-none" />

            {/* Premium Header */}
            <div className={cn(
                "relative z-40 transition-all duration-300 px-5 pt-5 pb-3",
                isScrolled ? "bg-white/80 dark:bg-[#0b1120]/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5" : ""
            )}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                                {t('network.explorer.title', 'Network')}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {isGlobalMode ? 'Global Architecture' : 'Your Ecosystem'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            className={cn(
                                "w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 transition-all active:rotate-180",
                                isFetching && "animate-spin text-blue-500"
                            )}
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        {user?.is_admin && (
                            <button
                                onClick={() => { impact('medium'); setIsGlobalMode(!isGlobalMode); setLevel(1); }}
                                className={cn(
                                    "px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all border",
                                    isGlobalMode
                                        ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                        : "bg-slate-100 dark:bg-white/5 border-transparent text-slate-400"
                                )}
                            >
                                {isGlobalMode ? 'Global' : 'Admin'}
                            </button>
                        )}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg bg-slate-900/5 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-slate-900/10 transition-all active:scale-90"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Level Selector with Badges */}
                <div className="relative mb-2">
                    <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none px-0.5" ref={scrollContainerRef}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => {
                            const count = treeStats[`level_${l}`] || treeStats[l.toString()] || 0;
                            const isActive = level === l;
                            return (
                                <button
                                    key={l}
                                    onClick={() => { selection(); setLevel(l); }}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center min-w-[38px] h-[38px] rounded-2xl transition-all duration-300 active:scale-90 shrink-0",
                                        isActive
                                            ? "text-white shadow-lg shadow-blue-500/25"
                                            : "text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 hover:border-blue-400/30"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeLevelBubble"
                                            className="absolute inset-0 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl"
                                            transition={{ type: "spring", stiffness: 400, damping: 32 }}
                                        />
                                    )}
                                    <span className={cn("text-xs font-black relative z-10", isActive ? "text-white" : "")}>
                                        {l}
                                    </span>
                                    {count > 0 && !isActive && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[#f8fafc] dark:border-[#0b1120]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Sub-Header / Search Toggle */}
                <div className="flex items-center justify-between gap-3 px-1">
                    <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            {!isSearchOpen ? (
                                <motion.div
                                    key="title"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex flex-col"
                                >
                                    <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider truncate">
                                        {getLevelName(level)}
                                    </h4>
                                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                                        {members.length} Partners active at this depth
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="search"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="relative"
                                >
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Find partner..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-8 bg-slate-100 dark:bg-white/5 rounded-lg pl-8 pr-3 text-xs font-bold text-slate-900 dark:text-white outline-hidden placeholder:text-slate-400"
                                    />
                                    <Search className="absolute left-2.5 top-2.5 w-3 h-3 text-slate-400" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button
                        onClick={() => { selection(); setIsSearchOpen(!isSearchOpen); setSearchQuery(''); }}
                        className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                            isSearchOpen ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-white/5 text-slate-500"
                        )}
                    >
                        {isSearchOpen ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {/* List Content */}
            <div
                ref={contentRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 pt-2 custom-scrollbar relative z-10 min-h-[350px]"
            >
                <AnimatePresence mode="popLayout">
                    {isLoading ? (
                        <motion.div key="loading" className="space-y-3">
                            {[1, 2, 3, 4, 5, 6].map(i => <MemberSkeleton key={i} />)}
                        </motion.div>
                    ) : isError ? (
                        <motion.div key="error" className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4">
                                <AlertCircle className="w-6 h-6 text-red-500" />
                            </div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-6 max-w-[200px]">
                                {error instanceof Error ? error.message : 'Ecosystem sync failed'}
                            </p>
                            <button
                                onClick={() => queryClient.invalidateQueries({ queryKey: ['network', 'level', level] })}
                                className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10"
                            >
                                Try Refresh
                            </button>
                        </motion.div>
                    ) : filteredMembers.length > 0 ? (
                        <motion.div key="content" className="space-y-2.5 pb-20">
                            {/* Level Insights Card */}
                            {!searchQuery && levelInsights && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-3 bg-linear-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl mb-4 relative overflow-hidden group"
                                >
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-2">
                                            <Award className="w-4 h-4 text-blue-500" />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Level Performer</span>
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                                            Avg. {levelInsights.avgXp} XP
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-500">
                                                ★
                                            </div>
                                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                {levelInsights.topPerformer.first_name} {levelInsights.topPerformer.last_name}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-black text-emerald-500">+{levelInsights.topPerformer.xp} XP</span>
                                    </div>
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-xl group-hover:bg-blue-500/10 transition-colors" />
                                </motion.div>
                            )}

                            {filteredMembers.map((member, index) => (
                                <motion.div
                                    key={member.telegram_id}
                                    layout
                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                                    className="group flex items-center gap-3 p-2.5 bg-white dark:bg-[#ffffff03] border border-slate-200/50 dark:border-white/5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/4 transition-all duration-300 relative"
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 overflow-hidden ring-1 ring-slate-200/50 dark:ring-white/5 shadow-sm transform group-active:scale-95 transition-transform">
                                            {(member.photo_file_id || member.photo_url) ? (
                                                <img
                                                    src={member.photo_file_id
                                                        ? `${getApiUrl()}/api/partner/photo/${member.photo_file_id}`
                                                        : member.photo_url
                                                    }
                                                    alt={member.first_name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${member.first_name}&background=6366f1&color=fff`;
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-extrabold text-sm bg-linear-to-br from-slate-50 to-slate-100 dark:from-white/5 dark:to-white/10">
                                                    {member.first_name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        {member.xp > 1000 && (
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
                                                <Award className="w-2 h-2 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                                                {member.first_name} {member.last_name}
                                            </h4>
                                            {member.xp > 5000 && <Zap className="w-3 h-3 text-blue-500" />}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                                                Joined {new Date(member.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right flex flex-col items-end">
                                        <div className="text-[11px] font-black text-blue-600 dark:text-blue-400 tabular-nums">
                                            {member.xp.toLocaleString()} XP
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                            <span className="text-[8px] font-bold text-emerald-500/80 uppercase">Active</span>
                                        </div>
                                    </div>
                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 rounded-r-full transition-opacity" />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div key="empty" className="flex flex-col items-center justify-center py-16 text-center px-6">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 relative">
                                <div className="absolute inset-0 bg-blue-500/5 rounded-[2rem] blur-xl" />
                                <UserPlus className="w-7 h-7 text-slate-300 dark:text-white/20 relative z-10" />
                            </div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white mb-2">
                                {searchQuery ? 'No partners match' : `Level ${level} is Quiet`}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 max-w-[180px] mb-8 leading-relaxed">
                                {searchQuery ? 'Try adjusting your search query.' : 'Growth starts with the first seed. Invite friends to start earning.'}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={() => { impact('heavy'); setIsShareOpen(true); }}
                                    className="px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-black text-[10px] shadow-xl shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest"
                                >
                                    Share Invitation
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Premium Footer with Stats Summary */}
            <div className="relative z-50 p-4 bg-white dark:bg-[#0b1120] border-t border-slate-200/50 dark:border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Global Strength</p>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <h4 className="text-xl font-black text-slate-900 dark:text-white leading-none tabular-nums">
                                {displayTotal.toLocaleString()}
                            </h4>
                            <div className="px-1.5 py-0.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                                <span className="text-emerald-500 text-[8px] font-black uppercase">Active Nodes</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { impact('medium'); setIsShareOpen(true); }}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 h-11 rounded-2xl flex items-center gap-2 font-black text-[11px] uppercase tracking-wider shadow-lg dark:shadow-white/5 active:scale-95 transition-all"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>Invite</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Share Sheet Backdrop */}
            <ShareSheet
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                referralCode={user?.referral_code || ''}
            />
        </div>
    );
};
