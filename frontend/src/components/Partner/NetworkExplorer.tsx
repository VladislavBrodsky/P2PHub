// #comment: Revamped NetworkExplorer with a premium design, improved responsiveness, and high-quality visual feedback
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Users, X, UserPlus, AlertCircle, TrendingUp, Award, Zap } from 'lucide-react';
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
}

const MemberSkeleton = () => (
    <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-white/5 rounded-3xl animate-pulse border border-slate-100 dark:border-white/5">
        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-white/10 shrink-0" />
        <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 bg-slate-200 dark:bg-white/10 rounded-lg" />
            <div className="h-3 w-1/4 bg-slate-100 dark:bg-white/5 rounded-lg" />
        </div>
        <div className="w-16 h-8 bg-slate-200 dark:bg-white/10 rounded-xl" />
    </div>
);

export const NetworkExplorer = ({ onClose }: NetworkExplorerProps) => {
    const { t } = useTranslation();
    const { selection, impact } = useHaptic();
    const { user } = useUser();
    const [level, setLevel] = useState(1);
    const [members, setMembers] = useState<NetworkMember[]>([]);
    const [levelCache, setLevelCache] = useState<Record<number, NetworkMember[]>>({});
    const [treeStats, setTreeStats] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isGlobalMode, setIsGlobalMode] = useState(false);
    const [error, setError] = useState('');
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setIsScrolled(e.currentTarget.scrollTop > 20);
    };

    const fetchLevel = useCallback(async (targetLevel: number) => {
        if (levelCache[targetLevel] && !isGlobalMode) {
            return levelCache[targetLevel];
        }

        try {
            const url = isGlobalMode
                ? `/api/admin/network/${targetLevel}`
                : `/api/partner/network/${targetLevel}`;
            const res = await apiClient.get(url);
            const data = Array.isArray(res.data) ? res.data : [];

            if (!isGlobalMode) setLevelCache(prev => ({ ...prev, [targetLevel]: data }));
            return data;
        } catch (err) {
            console.error(`Failed to fetch level ${targetLevel}:`, err);
            return null;
        }
    }, [levelCache, isGlobalMode]);

    const fetchTreeStats = useCallback(async () => {
        try {
            const url = isGlobalMode ? '/api/admin/tree' : '/api/partner/tree';
            const res = await apiClient.get(url);
            setTreeStats(res.data || {});
        } catch (err) {
            console.error('Failed to fetch tree stats:', err);
        }
    }, [isGlobalMode]);

    useEffect(() => {
        const prefetchInitialLevels = async () => {
            setIsLoading(true);
            try {
                const [l1] = await Promise.all([
                    fetchLevel(1),
                    fetchLevel(2),
                    fetchLevel(3),
                    fetchTreeStats()
                ]);
                if (l1) setMembers(l1);
            } catch (err) {
                console.error('Failed to prefetch levels:', err);
                setError('Failed to load network data');
            } finally {
                setIsLoading(false);
            }
        };
        prefetchInitialLevels();
    }, [fetchLevel, fetchTreeStats]);

    useEffect(() => {
        const updateLevel = async () => {
            if (levelCache[level]) {
                setMembers(levelCache[level]);
                setError('');
            } else {
                setIsLoading(true);
                setError('');
                const data = await fetchLevel(level);
                if (data !== null) {
                    setMembers(data);
                } else {
                    setError('Failed to load network data');
                    setMembers([]);
                }
                setIsLoading(false);
            }

            const adjacentLevels = [];
            if (level > 1) adjacentLevels.push(level - 1);
            if (level < 9) adjacentLevels.push(level + 1);

            adjacentLevels.forEach(l => {
                if (!levelCache[l]) fetchLevel(l);
            });
        };
        updateLevel();
    }, [level, fetchLevel, levelCache, isGlobalMode]);

    useEffect(() => {
        if (scrollContainerRef.current) {
            const activeButton = scrollContainerRef.current.children[level - 1] as HTMLElement;
            if (activeButton) {
                activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [level]);

    const totalActivePartners = Object.values(treeStats).reduce((acc, curr) => acc + (typeof curr === 'number' ? curr : 0), 0);

    return (
        <div className="bg-[#f8fafc] dark:bg-[#0f172a] rounded-[2.5rem] overflow-hidden flex flex-col h-full max-h-[90vh] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative border border-white dark:border-white/5">
            {/* Soft Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-linear-to-b from-blue-500/5 to-transparent pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-400/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className={`relative z-20 transition-all duration-500 ease-in-out ${isScrolled ? 'p-4 pb-0' : 'p-7 pb-4'}`}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[1.25rem] bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/10">
                            <Users className="w-6 h-6 outline-hidden" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                                {t('network.explorer.title', 'Network Explorer')}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="flex items-center gap-1 text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">
                                    <Zap className="w-3 h-3" />
                                    {t('network.explorer.deep_dive', '9-Level Deep Dive')}
                                </span>
                            </div>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all active:scale-90 hover:rotate-90"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Advanced Level Selector */}
                <div className="relative">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-4 scrollbar-none px-1" ref={scrollContainerRef}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => {
                            const count = treeStats[`level_${l}`] || treeStats[l.toString()] || 0;
                            const isActive = level === l;
                            return (
                                <button
                                    key={l}
                                    onClick={() => { selection(); setLevel(l); }}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center min-w-[64px] h-14 rounded-2xl transition-all duration-300 active:scale-95 shrink-0",
                                        isActive
                                            ? "text-white"
                                            : "text-slate-500 dark:text-slate-400 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-blue-300 dark:hover:border-blue-500/30"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeLevelBackground"
                                            className="absolute inset-0 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/40"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <span className={cn("text-sm font-black relative z-10", isActive ? "text-white" : "text-slate-900 dark:text-white/80")}>L{l}</span>
                                    {count > 0 && (
                                        <span className={cn(
                                            "text-[10px] font-bold relative z-10 px-1.5 rounded-full mt-0.5",
                                            isActive ? "bg-white/20 text-white" : "text-blue-600 dark:text-blue-400"
                                        )}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Level Progress Track */}
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden mt-1 mb-2 relative">
                        <motion.div
                            className="absolute inset-y-0 left-0 bg-linear-to-r from-blue-400 to-blue-600 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${(level / 9) * 100}%` }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        />
                    </div>

                    {user?.is_admin && (
                        <div className="flex justify-center mb-2">
                            <button
                                onClick={() => { impact('medium'); setIsGlobalMode(!isGlobalMode); setLevelCache({}); setLevel(1); }}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border-2",
                                    isGlobalMode
                                        ? "bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/25"
                                        : "bg-slate-100 dark:bg-white/5 border-transparent text-slate-500 dark:text-slate-400"
                                )}
                            >
                                {isGlobalMode ? '⚡️ Admin: Global View' : 'Standard View'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar relative z-10"
            >
                <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                            {isLoading ? 'Scanning...' : `${members.length} Active in L${level}`}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-500/20">
                        <Award className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wide">XP Focus</span>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            {[1, 2, 3, 4, 5].map(i => <MemberSkeleton key={i} />)}
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-12 text-center"
                        >
                            <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-3xl flex items-center justify-center mb-6 ring-8 ring-red-500/5">
                                <AlertCircle className="w-10 h-10 text-red-500" />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">{t('common.error', 'Something went wrong')}</h4>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-[240px] mb-8 leading-relaxed">
                                {error}
                            </p>
                            <button
                                onClick={() => setLevel(level)}
                                className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-sm font-black shadow-xl active:scale-95 transition-all"
                            >
                                {t('common.retry', 'Try Again')}
                            </button>
                        </motion.div>
                    ) : members.length > 0 ? (
                        <motion.div
                            key="content"
                            initial={{ opacity: 1 }}
                            className="space-y-3 pb-20"
                        >
                            {members.map((member, index) => (
                                <motion.div
                                    key={member.telegram_id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04, type: "spring", stiffness: 260, damping: 20 }}
                                    className="group flex items-center gap-4 p-4 bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-none hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-200 dark:hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden"
                                >
                                    {/* Subtle Gradient Hover Effect */}
                                    <div className="absolute inset-0 bg-linear-to-r from-blue-500/0 via-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative shrink-0">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/10 overflow-hidden ring-4 ring-white dark:ring-slate-800 shadow-xl">
                                            {(member.photo_file_id || member.photo_url) ? (
                                                <img
                                                    src={member.photo_file_id
                                                        ? `${getApiUrl()}/api/partner/photo/${member.photo_file_id}`
                                                        : member.photo_url
                                                    }
                                                    alt={member.first_name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-xl bg-linear-to-br from-slate-100 to-slate-200 dark:from-white/5 dark:to-white/10">
                                                    {member.first_name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-md">
                                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-base font-black text-slate-900 dark:text-white truncate">
                                                {member.first_name} {member.last_name}
                                            </h4>
                                            {member.xp > 500 && (
                                                <div className="bg-amber-400 rounded-md p-0.5 shadow-xs">
                                                    <Award className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                Joined {new Date(member.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right relative z-10">
                                        <div className="text-base font-black text-blue-600 dark:text-blue-400 tabular-nums tracking-tighter">
                                            +{member.xp.toLocaleString()}
                                            <span className="text-[10px] ml-1 opacity-70">XP</span>
                                        </div>
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-0.5 block">
                                            Active
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-16 text-center px-6"
                        >
                            <div className="w-28 h-28 bg-white dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 relative group shadow-2xl shadow-blue-500/5">
                                <div className="absolute inset-0 bg-linear-to-br from-blue-500 to-indigo-600 rounded-[2.5rem] blur-2xl opacity-10 group-hover:opacity-20 transition-all duration-700" />
                                <div className="absolute inset-0 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[2.5rem] animate-[spin_20s_linear_infinite]" />
                                <UserPlus className="w-10 h-10 text-slate-300 dark:text-white/20 relative z-10" />
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Quiet on Level {level}</h4>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-[260px] leading-relaxed mb-10">
                                Growth is just one invite away. Expand your network to unlock this leaf.
                            </p>
                            <button
                                onClick={() => { impact('heavy'); setIsShareOpen(true); }}
                                className="group relative px-8 py-4 bg-linear-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-blue-500/25 active:scale-95 transition-all overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <UserPlus className="w-4 h-4" />
                                    {t('network.explorer.share_link', 'Share Growth Link')}
                                </span>
                                <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Premium Stats Footer */}
            <div className="relative z-30 p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">Total Network Strength</p>
                        <div className="flex items-end gap-2">
                            <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-none tabular-nums">
                                {totalActivePartners.toLocaleString()}
                            </h4>
                            <span className="text-xs font-bold text-emerald-500 pb-0.5 flex items-center gap-0.5">
                                <TrendingUp className="w-3 h-3" />
                                Partners
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => { impact('medium'); setIsShareOpen(true); }}
                        className="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-lg active:scale-90 transition-all"
                    >
                        <UserPlus className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Share Sheet Modal */}
            <ShareSheet
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                referralCode={user?.referral_code || ''}
            />
        </div>
    );
};

