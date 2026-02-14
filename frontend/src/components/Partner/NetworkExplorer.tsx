// #comment: Optimized NetworkExplorer with React Query for intelligent caching, prefetching, and smooth data flow
import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Users, X, UserPlus, AlertCircle, TrendingUp, Award, Zap, ChevronRight } from 'lucide-react';
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
    const { selection, impact } = useHaptic();
    const { user } = useUser();
    const queryClient = useQueryClient();

    // UI State
    const [level, setLevel] = useState(1);
    const [isGlobalMode, setIsGlobalMode] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // Refs
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setIsScrolled(e.currentTarget.scrollTop > 10);
    };

    // --- Data Fetching Logic (React Query) ---

    // 1. Fetch Tree Stats (Counts per level)
    const { data: treeStats = {} } = useQuery({
        queryKey: ['network', 'stats', isGlobalMode ? 'global' : 'partner'],
        queryFn: async () => {
            const url = isGlobalMode ? '/api/admin/tree' : '/api/partner/tree';
            const res = await apiClient.get(url);
            return res.data as Record<string, number>;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // 2. Fetch Members for Current Level
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
        error
    } = useQuery({
        queryKey: ['network', 'level', level, isGlobalMode ? 'global' : 'partner'],
        queryFn: () => fetchLevelData(level, isGlobalMode),
        staleTime: 1000 * 60 * 5, // 5 minutes
        placeholderData: (previousData) => undefined, // Ensure we show loading state on level switch if not cached
    });

    // 3. Intelligent Prefetching
    useEffect(() => {
        // Prefetch adjacent levels for instant navigation flow
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

    // Scroll to top on level change
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
    }, [level]);

    // Scroll active pill into view
    useEffect(() => {
        if (scrollContainerRef.current) {
            const activeButton = scrollContainerRef.current.children[level - 1] as HTMLElement;
            if (activeButton) {
                activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [level]);

    // Stats Calculation
    const statsTotal = Object.values(treeStats).reduce((acc, curr) => acc + (typeof curr === 'number' ? curr : 0), 0);
    const displayTotal = Math.max(statsTotal, initialTotalCount);

    return (
        <div className="bg-[#f8fafc] dark:bg-[#0b1120] rounded-[2rem] overflow-hidden flex flex-col h-full max-h-[85vh] shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative border border-white dark:border-white/5">
            {/* Soft Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-linear-to-b from-blue-500/10 to-transparent pointer-events-none" />

            {/* Compact Header */}
            <div className={cn(
                "relative z-40 transition-all duration-300 px-4 pt-4 pb-2",
                isScrolled ? "bg-white/90 dark:bg-[#0b1120]/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/5" : ""
            )}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                            <Users className="w-4 h-4 outline-hidden" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                                {t('network.explorer.title', 'Network Explorer')}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="flex items-center gap-1 text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                                    <Zap className="w-2 h-2" />
                                    {t('network.explorer.deep_dive', '9-Level Deep Dive')}
                                </span>
                                {user?.is_admin && (
                                    <button
                                        onClick={() => { impact('medium'); setIsGlobalMode(!isGlobalMode); setLevel(1); }}
                                        className={cn(
                                            "text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-full transition-all border",
                                            isGlobalMode
                                                ? "bg-amber-500 border-amber-400 text-white"
                                                : "bg-slate-100 dark:bg-white/5 border-slate-200 text-slate-500"
                                        )}
                                    >
                                        {isGlobalMode ? 'GLOBAL' : 'STD'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 active:scale-90 transition-all hover:bg-slate-200 dark:hover:bg-white/10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Ultra Compact Level Selector */}
                <div className="relative">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none px-0.5" ref={scrollContainerRef}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => {
                            const count = treeStats[`level_${l}`] || treeStats[l.toString()] || 0;
                            const isActive = level === l;
                            return (
                                <button
                                    key={l}
                                    onClick={() => {
                                        selection();
                                        setLevel(l);
                                    }}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center w-9 h-9 rounded-full transition-all duration-300 active:scale-90 shrink-0 group",
                                        isActive
                                            ? "text-white"
                                            : "text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 hover:border-blue-200"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeLevelCircle"
                                            className="absolute inset-0 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full shadow-md shadow-blue-500/30"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <span className={cn("text-xs font-black relative z-10 leading-none", isActive ? "text-white" : "group-hover:text-blue-500")}>L{l}</span>
                                    {count > 0 && !isActive && (
                                        <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-blue-500 rounded-full ring-1 ring-white dark:ring-[#0b1120]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Progress Line */}
                    <div className="h-0.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mb-1 relative">
                        <motion.div
                            className="absolute inset-y-0 left-0 bg-blue-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(level / 9) * 100}%` }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div
                ref={contentRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-3 pt-0 custom-scrollbar relative z-10 min-h-[300px]"
            >
                {/* Sub-Header */}
                <div className="sticky top-0 bg-linear-to-b from-[#f8fafc] dark:from-[#0b1120] to-transparent pt-2 pb-3 z-20">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                            <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">
                                {isLoading ? t('network.explorer.scanning', 'Scanning...') : `${members.length} Partners`}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-500/20">
                            <Award className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                            <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
                                XP Focus
                            </span>
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="popLayout">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-2"
                        >
                            {[1, 2, 3, 4, 5, 6].map(i => <MemberSkeleton key={i} />)}
                        </motion.div>
                    ) : isError ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-8 text-center"
                        >
                            <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
                                {error instanceof Error ? error.message : 'Failed to load data'}
                            </p>
                            <button
                                onClick={() => queryClient.invalidateQueries({ queryKey: ['network', 'level', level] })}
                                className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-black"
                            >
                                Retry
                            </button>
                        </motion.div>
                    ) : members.length > 0 ? (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-2 pb-16"
                        >
                            {members.map((member, index) => (
                                <motion.div
                                    key={member.telegram_id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.98, y: 5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                                    className="group flex items-center gap-2.5 p-2 bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300 relative overflow-hidden"
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/10 overflow-hidden ring-1 ring-white dark:ring-slate-800 shadow-sm transition-transform group-hover:scale-105">
                                            {(member.photo_file_id || member.photo_url) ? (
                                                <img
                                                    src={member.photo_file_id
                                                        ? `${getApiUrl()}/api/partner/photo/${member.photo_file_id}`
                                                        : member.photo_url
                                                    }
                                                    alt={member.first_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-sm bg-linear-to-br from-slate-100 to-slate-200 dark:from-white/5 dark:to-white/10">
                                                    {member.first_name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                                                {member.first_name} {member.last_name}
                                            </h4>
                                            {member.xp > 500 && <Award className="w-2.5 h-2.5 text-amber-400 shrink-0" />}
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 uppercase tracking-tighter mt-0.5">
                                            {new Date(member.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-xs font-black text-blue-500 dark:text-blue-400 tabular-nums">
                                            +{member.xp.toLocaleString()}
                                        </div>
                                        <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-0 block opacity-80">
                                            Active
                                        </span>
                                    </div>
                                    <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-8 text-center px-4"
                        >
                            <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4 relative group">
                                <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-lg" />
                                <UserPlus className="w-6 h-6 text-slate-300 dark:text-white/20 relative z-10" />
                            </div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">
                                {t('network.explorer.quiet_on_level', `Level ${level} Empty`, { level })}
                            </h4>
                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 max-w-[150px] mb-4 leading-relaxed">
                                {t('network.explorer.growth_desc', 'Invite friends to unlock rewards.')}
                            </p>
                            <button
                                onClick={() => { impact('heavy'); setIsShareOpen(true); }}
                                className="px-4 py-2 bg-linear-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-black text-[10px] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                Share Link
                            </button>
                        </motion.div>
                    )
                    }
                </AnimatePresence>
            </div>

            {/* Ultra Compact Footer */}
            {displayTotal > 0 && (
                <div className="relative z-50 p-3 bg-white dark:bg-[#0b1120] border-t border-slate-200 dark:border-white/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Total Strength</p>
                            <div className="flex items-center gap-2">
                                <h4 className="text-lg font-black text-slate-900 dark:text-white leading-none tabular-nums">
                                    {displayTotal.toLocaleString()}
                                </h4>
                                <div className="flex items-center gap-0.5 px-1 py-0.5 bg-emerald-500/10 rounded text-emerald-500 text-[8px] font-bold">
                                    <TrendingUp className="w-2 h-2" />
                                    <span>Partners</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => { impact('medium'); setIsShareOpen(true); }}
                            className="w-9 h-9 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-md active:scale-90 transition-all"
                        >
                            <UserPlus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Share Sheet Modal */}
            <ShareSheet
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                referralCode={user?.referral_code || ''}
            />
        </div>
    );
};
