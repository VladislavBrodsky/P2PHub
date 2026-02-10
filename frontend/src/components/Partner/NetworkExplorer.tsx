import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Users, Shield, Calendar, Search, X, ChevronRight, UserPlus, AlertCircle } from 'lucide-react';
import { apiClient } from '../../api/client';
import { ListSkeleton } from '../Skeletons/ListSkeleton';
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

export const NetworkExplorer = ({ onClose }: NetworkExplorerProps) => {
    const { t } = useTranslation();
    const { selection } = useHaptic();
    const { user } = useUser();
    const [level, setLevel] = useState(1);
    const [members, setMembers] = useState<NetworkMember[]>([]);
    const [levelCache, setLevelCache] = useState<Record<number, NetworkMember[]>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isShareOpen, setIsShareOpen] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Fetch a single level and cache it
    const fetchLevel = async (targetLevel: number) => {
        // Skip if already cached
        if (levelCache[targetLevel]) {
            return levelCache[targetLevel];
        }

        try {
            const res = await apiClient.get(`/api/partner/network/${targetLevel}`);
            const data = Array.isArray(res.data) ? res.data : [];

            // Update cache
            setLevelCache(prev => ({ ...prev, [targetLevel]: data }));
            return data;
        } catch (err) {
            console.error(`Failed to fetch level ${targetLevel}:`, err);
            return null;
        }
    };

    // Prefetch levels 1-3 on mount for instant browsing
    useEffect(() => {
        const prefetchInitialLevels = async () => {
            setIsLoading(true);
            try {
                // Fetch levels 1, 2, 3 in parallel
                const [l1, l2, l3] = await Promise.all([
                    fetchLevel(1),
                    fetchLevel(2),
                    fetchLevel(3)
                ]);

                // Set initial display to level 1
                if (l1) {
                    setMembers(l1);
                }
            } catch (err) {
                console.error('Failed to prefetch levels:', err);
                setError('Failed to load network data');
            } finally {
                setIsLoading(false);
            }
        };

        prefetchInitialLevels();
    }, []);

    // When level changes, update display and prefetch adjacent levels
    useEffect(() => {
        const updateLevel = async () => {
            // If already cached, instant switch
            if (levelCache[level]) {
                setMembers(levelCache[level]);
                setError('');
            } else {
                // Not cached, fetch it
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

            // Prefetch adjacent levels in background (no await)
            const adjacentLevels = [];
            if (level > 1) adjacentLevels.push(level - 1);
            if (level < 9) adjacentLevels.push(level + 1);

            adjacentLevels.forEach(l => {
                if (!levelCache[l]) {
                    fetchLevel(l); // Fire and forget
                }
            });
        };

        updateLevel();
    }, [level]);

    // Auto-scroll logic for level selector
    useEffect(() => {
        if (scrollContainerRef.current) {
            const activeButton = scrollContainerRef.current.children[level - 1] as HTMLElement;
            if (activeButton) {
                activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [level]);

    return (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-[2rem] overflow-hidden flex flex-col h-full max-h-[85vh] shadow-2xl relative">
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-linear-to-b from-white/10 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="p-5 border-b border-black/5 dark:border-white/5 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none">Network Explorer</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">9-Level Deep Dive</p>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors active:scale-95"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Compact Level Selector */}
                <div className="relative mx-[-20px] px-[20px]"> {/* Negative margin hack to stretch full width but keep padding */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-linear-to-r from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />

                    <div
                        ref={scrollContainerRef}
                        className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none px-6" // Added px-6 to prevent first item clipping
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => (
                            <button
                                key={l}
                                onClick={() => { selection(); setLevel(l); }}
                                className={cn(
                                    "flex items-center justify-center min-w-[48px] h-9 rounded-full text-xs font-black transition-all active:scale-95 border shrink-0", // Added shrink-0
                                    level === l
                                        ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/30"
                                        : "bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/10"
                                )}
                            >
                                L{l}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 dark:bg-black/20 relative z-0">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-3"
                        >
                            <div className="h-16 w-full bg-slate-200 dark:bg-white/5 rounded-2xl animate-pulse" />
                            <div className="h-16 w-full bg-slate-200 dark:bg-white/5 rounded-2xl animate-pulse delay-75" />
                            <div className="h-16 w-full bg-slate-200 dark:bg-white/5 rounded-2xl animate-pulse delay-150" />
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center h-[40vh] text-center px-6"
                        >
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Could not load network</h4>
                            <p className="text-xs text-slate-500 max-w-[200px]">{error}</p>
                            <button
                                onClick={() => setLevel(level)} // Trigger re-fetch
                                className="mt-4 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold"
                            >
                                Try Again
                            </button>
                        </motion.div>
                    ) : members.length > 0 ? (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-2"
                        >
                            <div className="flex items-center justify-between px-2 mb-2">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{members.length} Active Partners</span>
                                <span className="text-[10px] font-black uppercase text-blue-500 tracking-wider">Total XP</span>
                            </div>

                            {members.map((member, index) => (
                                <motion.div
                                    key={member.telegram_id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group flex items-center gap-3 p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden shrink-0 ring-2 ring-white dark:ring-white/10 shadow-inner">
                                        {(member.photo_file_id || member.photo_url) ? (
                                            <img
                                                src={member.photo_file_id
                                                    ? `${apiClient.defaults.baseURL}/api/partner/photo/${member.photo_file_id}`
                                                    : member.photo_url
                                                }
                                                alt={member.first_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-sm">
                                                {member.first_name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                {member.first_name} {member.last_name}
                                            </h4>
                                            {member.xp > 1000 && ( // Simple mock logic for "TOP" badge
                                                <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 rounded-md font-black">TOP</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                                Joined {new Date(member.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <span className="text-sm font-black text-slate-900 dark:text-white block tabular-nums tracking-tight">
                                            +{member.xp} XP
                                        </span>
                                        <span className="text-[9px] font-bold text-emerald-500">Active</span>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col items-center justify-center h-[40vh] text-center px-6"
                        >
                            <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 relative group">
                                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-700 opacity-50" />
                                <UserPlus className="w-8 h-8 text-slate-300 dark:text-slate-600 relative z-10" />
                            </div>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">Quiet on Level {level}</h4>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-[240px] leading-relaxed">
                                No partners found in this tier yet. <br />
                                <button
                                    onClick={() => setIsShareOpen(true)}
                                    className="text-blue-500 hover:text-blue-400 font-bold hover:underline transition-all"
                                >
                                    Share your link
                                </button> to start growing!
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer with Gradient Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-white dark:from-slate-900 to-transparent pointer-events-none z-10" />

            {/* Share Sheet Modal */}
            <ShareSheet
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                referralCode={user?.referral_code || ''}
            />
        </div>
    );
};
