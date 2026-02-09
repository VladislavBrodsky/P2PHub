import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Users, Shield, Calendar, Search, X, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { getSafeLaunchParams } from '../../utils/tma';
import { ListSkeleton } from '../Skeletons/ListSkeleton';

interface NetworkMember {
    telegram_id: string;
    username: string;
    first_name: string;
    last_name: string;
    xp: number;
    photo_url: string;
    joined_at: string;
}

interface NetworkExplorerProps {
    onClose?: () => void;
}

export const NetworkExplorer = ({ onClose }: NetworkExplorerProps) => {
    const { t } = useTranslation();
    const [level, setLevel] = useState(1);
    const [members, setMembers] = useState<NetworkMember[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchLevel = async () => {
            setIsLoading(true);
            setError('');
            try {
                const params = getSafeLaunchParams();
                const initDataRaw = params.initDataRaw || '';

                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/partner/network/${level}`,
                    { headers: { 'X-Telegram-Init-Data': initDataRaw } }
                );

                if (Array.isArray(res.data)) {
                    setMembers(res.data);
                } else {
                    setMembers([]);
                }
            } catch (err) {
                console.error('Failed to fetch network level:', err);
                setError('Failed to load network data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchLevel();
    }, [level]);

    // Scroll active level into view
    useEffect(() => {
        if (scrollContainerRef.current) {
            const activeButton = scrollContainerRef.current.children[level - 1] as HTMLElement;
            if (activeButton) {
                activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [level]);

    return (
        <div className="bg-(--color-bg-surface) border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden flex flex-col h-full max-h-[85vh] shadow-xl">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none mb-1">Network Explorer</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">9-Level Deep Dive</p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Level Select - Horizontal Scroll */}
                <div
                    ref={scrollContainerRef}
                    className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-2 px-2"
                >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => (
                        <button
                            key={l}
                            onClick={() => setLevel(l)}
                            className={`flex flex-col items-center justify-center min-w-18 py-2 px-1 rounded-xl transition-all border ${level === l
                                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                                : 'bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/10'
                                }`}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Level</span>
                            <span className="text-lg font-black leading-none">{l}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-50/50 dark:bg-transparent">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <ListSkeleton count={4} />
                        </motion.div>
                    ) : members.length > 0 ? (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                        >
                            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2 px-1">
                                <span>Partner</span>
                                <span>Performance</span>
                            </div>
                            {members.map((member, index) => (
                                <motion.div
                                    key={member.telegram_id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-center gap-3 p-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
                                >
                                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden shrink-0 ring-2 ring-white dark:ring-white/5">
                                        {member.photo_url ? (
                                            <img src={member.photo_url} alt={member.first_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">
                                                {member.first_name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                {member.first_name} {member.last_name}
                                            </h4>
                                            {member.username && <span className="text-[10px] text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-md">@{member.username}</span>}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(member.joined_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                                            {member.xp.toLocaleString()} XP
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">Lifetime</span>
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
                            className="text-center py-12 flex flex-col items-center justify-center h-full"
                        >
                            <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-4 rotate-3">
                                <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Quiet on Level {level}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[200px] mx-auto">
                                No partners found in this tier yet. Keep growing your network!
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
