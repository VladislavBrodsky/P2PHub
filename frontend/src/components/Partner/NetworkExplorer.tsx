// #comment: Revamped NetworkExplorer with a premium design, improved responsiveness, and high-quality visual feedback
import { useState, useEffect, useRef, useCallback } from 'react';
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
}

const MemberSkeleton = () => (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-white/5 rounded-2xl animate-pulse border border-slate-100 dark:border-white/5">
        <div className="w-11 h-11 rounded-[1rem] bg-slate-200 dark:bg-white/10 shrink-0" />
        <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 bg-slate-200 dark:bg-white/10 rounded-lg" />
            <div className="h-2.5 w-1/4 bg-slate-100 dark:bg-white/5 rounded-lg" />
        </div>
        <div className="w-14 h-7 bg-slate-200 dark:bg-white/10 rounded-lg" />
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
        setIsScrolled(e.currentTarget.scrollTop > 10);
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
        <div className="bg-[#f8fafc] dark:bg-[#0b1120] rounded-[2.5rem] overflow-hidden flex flex-col h-full max-h-[90vh] shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative border border-white dark:border-white/5">
            {/* Soft Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-48 bg-linear-to-b from-blue-500/10 to-transparent pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-400/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className={cn(
                "relative z-40 transition-all duration-300 p-5 pb-3",
                isScrolled ? "bg-white/80 dark:bg-[#0b1120]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5" : ""
            )}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                            <Users className="w-5 h-5 outline-hidden" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                                {t('network.explorer.title', 'Network Explorer')}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-1 text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">
                                    <Zap className="w-2.5 h-2.5" />
                                    {t('network.explorer.deep_dive', '9-Level Deep Dive')}
                                </span>
                                {user?.is_admin && (
                                    <button
                                        onClick={() => { impact('medium'); setIsGlobalMode(!isGlobalMode); setLevelCache({}); setLevel(1); }}
                                        className={cn(
                                            "text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full transition-all border",
                                            isGlobalMode
                                                ? "bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/20"
                                                : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"
                                        )}
                                    >
                                        {isGlobalMode ? 'ADM: GLOBAL' : 'STD'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 active:scale-90 transition-all hover:bg-slate-200 dark:hover:bg-white/10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Compact Level Selector */}
                <div className="relative">
                    <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none px-1" ref={scrollContainerRef}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => {
                            const count = treeStats[`level_${l}`] || treeStats[l.toString()] || 0;
                            const isActive = level === l;
                            return (
                                <button
                                    key={l}
                                    onClick={() => { selection(); setLevel(l); }}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-500 active:scale-90 shrink-0 group",
                                        isActive
                                            ? "text-white"
                                            : "text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeLevelCircle"
                                            className="absolute inset-0 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg shadow-blue-500/40"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <span className={cn("text-sm font-black relative z-10", isActive ? "text-white" : "group-hover:text-blue-500")}>L{l}</span>
                                    {count > 0 && !isActive && (
                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white dark:ring-[#0b1120]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Subtle Progress Bar */}
                    <div className="h-1 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden mb-1 relative mx-1">
                        <motion.div
                            className="absolute inset-y-0 left-0 bg-linear-to-r from-blue-400 to-indigo-600 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(level / 9) * 100}%` }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 pt-0 custom-scrollbar relative z-10"
            >
                {/* Section Info Header */}
                <div className="sticky top-0 bg-linear-to-b from-[#f8fafc] dark:from-[#0b1120] to-transparent pt-2 pb-4 z-20">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">
                                {isLoading ? t('network.explorer.scanning', 'Scanning Network...') : t('network.explorer.active_partners', `${members.length} Active in L${level}`, { count: members.length, level })}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-500/20">
                            <Award className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
                                {t('network.explorer.xp_focus', 'XP Focus')}
                            </span>
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                        >
                            {[1, 2, 3, 4, 5, 6].map(i => <MemberSkeleton key={i} />)}
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-10 text-center"
                        >
                            <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
                            <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">{t('common.error', 'Connection issue')}</h4>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-6">{error}</p>
                            <button
                                onClick={() => setLevel(level)}
                                className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black"
                            >
                                {t('common.retry', 'Retry fetch')}
                            </button>
                        </motion.div>
                    ) : members.length > 0 ? (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-2.5 pb-20"
                        >
                            {members.map((member, index) => (
                                <motion.div
                                    key={member.telegram_id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.98, y: 5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                                    className="group flex items-center gap-3 p-3 bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300 relative overflow-hidden"
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/10 overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-sm transition-transform group-hover:scale-105">
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
                                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-lg bg-linear-to-br from-slate-100 to-slate-200 dark:from-white/5 dark:to-white/10">
                                                    {member.first_name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-xs">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                                                {member.first_name} {member.last_name}
                                            </h4>
                                            {member.xp > 500 && <Award className="w-3 h-3 text-amber-400 shrink-0" />}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 uppercase tracking-tighter mt-0.5">
                                            Joined {new Date(member.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-sm font-black text-blue-500 dark:text-blue-400 tabular-nums">
                                            +{member.xp.toLocaleString()} <span className="text-[8px] font-bold opacity-60">XP</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5 block opacity-80">
                                            Active
                                        </span>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-12 text-center px-6"
                        >
                            <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 relative group">
                                <div className="absolute inset-0 bg-blue-500/10 rounded-[2rem] blur-xl" />
                                <UserPlus className="w-8 h-8 text-slate-300 dark:text-white/20 relative z-10" />
                            </div>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                                {t('network.explorer.quiet_on_level', `Level ${level} Empty`, { level })}
                            </h4>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-[200px] mb-8 leading-relaxed">
                                {t('network.explorer.growth_desc', 'Start inviting to see your network grow on this level.')}
                            </p>
                            <button
                                onClick={() => { impact('heavy'); setIsShareOpen(true); }}
                                className="px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-black text-xs shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                {t('network.explorer.share_link', 'Get Growth Link')}
                            </button>
                        </motion.div>
                    )
                    }
                </AnimatePresence>
            </div>

            {/* Premium Stats Footer */}
            <div className="relative z-50 p-5 bg-white dark:bg-[#0b1120] border-t border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Network Strength</p>
                        <div className="flex items-center gap-2">
                            <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-none tabular-nums">
                                {totalActivePartners.toLocaleString()}
                            </h4>
                            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/10 rounded text-emerald-500">
                                <TrendingUp className="w-2.5 h-2.5" />
                                <span className="text-[9px] font-bold">Partners</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => { impact('medium'); setIsShareOpen(true); }}
                        className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-lg active:scale-90 transition-all"
                    >
                        <UserPlus className="w-5 h-5" />
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

