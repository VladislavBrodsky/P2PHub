import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, X, Star, Flame, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LazyImage } from '../ui/LazyImage';
import { USDTLogo } from '../ui/USDTLogo';
import { Confetti } from '../ui/Confetti';
import { useUI } from '../../context/UIContext';
import { useTMALock } from '../../hooks/useTMALock';
import { apiClient } from '../../api/client';
import { getApiUrl } from '../../utils/api';

interface Winner {
    id: number;
    rank: number;
    username: string;
    first_name: string;
    photo_url?: string;
    photo_file_id?: string;
    total_earned_usdt: number;
    xp: number;
}

const STORAGE_KEY = 'p2phub_winners_popup_seen_month';

const getRankPrizes = (t: any): Record<number, { label: string; sublabel: string; color: string; glow: string; isUsdt?: boolean }> => ({
    1: { label: t('league.prizes.macbook'), sublabel: t('league.prizes.macbook_sub'), color: 'from-amber-400 to-yellow-500', glow: 'rgba(251,191,36,0.6)' },
    2: { label: t('league.prizes.dji'), sublabel: t('league.prizes.dji_sub'), color: 'from-slate-300 to-slate-400', glow: 'rgba(148,163,184,0.5)' },
    3: { label: t('league.prizes.iphone'), sublabel: t('league.prizes.iphone_sub'), color: 'from-orange-400 to-amber-500', glow: 'rgba(251,146,60,0.5)' },
    4: { label: t('league.prizes.usdt_amount'), sublabel: t('league.prizes.cash'), color: 'from-emerald-400 to-teal-500', glow: 'rgba(52,211,153,0.4)', isUsdt: true },
    5: { label: t('league.prizes.usdt_amount'), sublabel: t('league.prizes.cash'), color: 'from-emerald-400 to-teal-500', glow: 'rgba(52,211,153,0.4)', isUsdt: true },
    6: { label: t('league.prizes.usdt_amount'), sublabel: t('league.prizes.cash'), color: 'from-emerald-400 to-teal-500', glow: 'rgba(52,211,153,0.4)', isUsdt: true },
    7: { label: t('league.prizes.usdt_amount'), sublabel: t('league.prizes.cash'), color: 'from-emerald-400 to-teal-500', glow: 'rgba(52,211,153,0.4)', isUsdt: true },
    8: { label: t('league.prizes.usdt_amount'), sublabel: t('league.prizes.cash'), color: 'from-emerald-400 to-teal-500', glow: 'rgba(52,211,153,0.4)', isUsdt: true },
    9: { label: t('league.prizes.usdt_amount'), sublabel: t('league.prizes.cash'), color: 'from-emerald-400 to-teal-500', glow: 'rgba(52,211,153,0.4)', isUsdt: true },
    10: { label: t('league.prizes.usdt_amount'), sublabel: t('league.prizes.cash'), color: 'from-emerald-400 to-teal-500', glow: 'rgba(52,211,153,0.4)', isUsdt: true },
});

const RankIcon: React.FC<{ rank: number }> = ({ rank }) => {
    if (rank === 1) return <Crown size={14} className="text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" />;
    if (rank === 2) return <Trophy size={14} className="text-slate-300" />;
    if (rank === 3) return <Star size={14} className="text-orange-400" />;
    return <Flame size={12} className="text-purple-400" />;
};

const shouldShowPopup = (): boolean => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return true;
        const data = JSON.parse(stored);
        const now = new Date();
        // Show once per month on the 1st (or if never seen)
        const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
        return data.monthKey !== currentMonthKey;
    } catch {
        return true;
    }
};

const markPopupSeen = () => {
    try {
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ monthKey: currentMonthKey }));
    } catch {
        // ignore
    }
};

interface MonthlyWinnersPopupProps {
    /** Force show (for admin/debug) */
    forceShow?: boolean;
}

const AVATAR_GRADIENTS = [
    'from-blue-500 to-indigo-500',
    'from-emerald-400 to-teal-500',
    'from-violet-500 to-fuchsia-500',
    'from-rose-400 to-red-500',
    'from-amber-400 to-orange-500',
];

export const MonthlyWinnersPopup: React.FC<MonthlyWinnersPopupProps> = ({ forceShow = false }) => {
    const { t } = useTranslation(['social', 'common']);
    const [visible, setVisible] = useState(false);
    const [winners, setWinners] = useState<Winner[]>([]);
    const [loading, setLoading] = useState(true);
    const { setFooterVisible } = useUI();
    const rankPrizes = getRankPrizes(t);

    const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useTMALock(visible);

    useEffect(() => {
        if (visible) {
            setFooterVisible(false);
        } else {
            setFooterVisible(true);
        }
        return () => setFooterVisible(true);
    }, [visible, setFooterVisible]);

    useEffect(() => {
        const show = forceShow || shouldShowPopup();
        if (!show) return;

        // Fetch top 10 from last month's leaderboard
        apiClient.get('/api/leaderboard/global?timeframe=monthly&limit=10')
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : [];
                const mapped: Winner[] = data.slice(0, 10).map((u: any, i: number) => ({
                    id: u.id,
                    rank: i + 1,
                    username: u.username,
                    first_name: u.first_name,
                    photo_url: u.photo_url,
                    photo_file_id: u.photo_file_id,
                    total_earned_usdt: u.total_earned_usdt,
                    xp: u.xp,
                }));
                setWinners(mapped);
            })
            .catch(() => setWinners([]))
            .finally(() => {
                setLoading(false);
                // Short delay for drama
                setTimeout(() => setVisible(true), 300);
            });
    }, [forceShow]);

    const handleClose = useCallback(() => {
        setVisible(false);
        markPopupSeen();
    }, []);

    // Get previous month name
    const prevMonthName = (() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
    })();

    if (!visible && !loading) return null;
    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {visible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-9998 bg-black/40 dark:bg-slate-950/45 backdrop-blur-md"
                        onClick={handleClose}
                    />

                    <Confetti />

                    {/* Sheet */}
                    <motion.div
                        key="sheet"
                        initial={isDesktop ? { scale: 0.95, opacity: 0 } : { opacity: 0, y: 60, scale: 0.97 }}
                        animate={isDesktop ? { scale: 1, opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                        exit={isDesktop ? { scale: 0.95, opacity: 0 } : { opacity: 0, y: 40, scale: 0.97 }}
                        transition={isDesktop ? { duration: 0.2, ease: "easeOut" } : { type: 'spring', stiffness: 380, damping: 32, delay: 0.05 }}
                        className={[
                            isDesktop
                                ? 'fixed inset-0 m-auto z-9999 max-h-[85vh] max-w-lg overflow-hidden'
                                : 'fixed inset-x-3 bottom-4 z-9999 max-h-[85vh] overflow-hidden',
                            'rounded-[32px] border',
                            /* Light */
                            'bg-white/95 backdrop-blur-xl border-slate-200/80 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)]',
                            /* Dark */
                            'dark:bg-slate-950/80 dark:backdrop-blur-2xl dark:border-white/10 dark:shadow-[0_0_120px_-20px_rgba(99,102,241,0.15)]',
                        ].join(' ')}
                    >
                        {/* Animated gradient header strip */}
                        <div
                            className="h-1 w-full rounded-t-3xl"
                            style={{
                                background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #f59e0b, #6366f1)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer-slide-x 3s linear infinite',
                            }}
                        />

                        {/* Scrollable content */}
                        <div className="overflow-y-auto max-h-[calc(85vh-4px)] pb-6">
                            {/* Header */}
                            <div className="relative px-5 pt-4 pb-3">
                                {/* Icon + Title */}
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <motion.div
                                        animate={{ rotate: [0, -8, 8, -5, 5, 0] }}
                                        transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.5 }}
                                        className="relative"
                                    >
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-amber-400 to-yellow-500 shadow-[0_8px_24px_rgba(251,191,36,0.45)]">
                                            <Crown size={24} className="text-white drop-shadow" />
                                        </div>
                                        <motion.div
                                            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                            className="absolute inset-0 rounded-2xl bg-amber-400 opacity-0"
                                        />
                                        {/* Sparkle dots */}
                                        {[0, 72, 144, 216, 288].map((deg, i) => (
                                            <motion.div
                                                key={i}
                                                className="absolute h-1.5 w-1.5 rounded-full bg-amber-400"
                                                style={{
                                                    top: '50%',
                                                    left: '50%',
                                                    transformOrigin: '0 0',
                                                }}
                                                animate={{
                                                    x: [0, Math.cos((deg * Math.PI) / 180) * 32],
                                                    y: [0, Math.sin((deg * Math.PI) / 180) * 32],
                                                    opacity: [0, 1, 0],
                                                    scale: [0.5, 1, 0],
                                                }}
                                                transition={{
                                                    duration: 1.6,
                                                    delay: 0.5 + i * 0.08,
                                                    ease: 'easeOut',
                                                }}
                                            />
                                        ))}
                                    </motion.div>

                                    <div>
                                        <div className="flex items-center justify-center gap-1.5 mb-1">
                                            <Sparkles size={12} className="text-amber-500" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400/90">
                                                {t('league.monthly_winners', 'Monthly Winners')}
                                            </span>
                                            <Sparkles size={12} className="text-amber-500" />
                                        </div>
                                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight capitalize leading-none mb-1">
                                            {prevMonthName}
                                        </h1>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                            {t('league.winners_subtitle', 'Top 10 partners receive monthly rewards')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Winners List */}
                            <div className="px-4 space-y-2">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="h-14 rounded-2xl animate-shimmer bg-linear-to-r from-slate-100 via-slate-200 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800"
                                        />
                                    ))
                                ) : winners.length === 0 ? (
                                    <div className="py-8 text-center text-caption text-slate-400">
                                        {t('league.no_winners_yet', 'Data will appear at the end of the current month')}
                                    </div>
                                ) : (
                                    winners.map((winner, i) => {
                                        const prize = rankPrizes[winner.rank] || rankPrizes[10];
                                        const isTop3 = winner.rank <= 3;
                                        return (
                                            <motion.div
                                                key={winner.id}
                                                initial={{ opacity: 0, x: -16 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{
                                                    delay: 0.1 + i * 0.06,
                                                    type: 'spring',
                                                    stiffness: 400,
                                                    damping: 30,
                                                }}
                                                className={[
                                                    'relative flex items-center gap-3 rounded-2xl p-2.5 overflow-hidden',
                                                    'border transition-all active:scale-[0.98] group',
                                                    isTop3
                                                        ? 'border-amber-500/30 bg-amber-500/3 dark:bg-amber-500/5 dark:border-amber-500/20 backdrop-blur-md'
                                                        : 'border-slate-200/50 bg-slate-50/50 dark:border-white/4 dark:bg-white/2 backdrop-blur-md',
                                                ].join(' ')}
                                                style={isTop3 ? {
                                                    boxShadow: `inset 0 0 20px -10px ${prize.glow}, 0 4px 20px -8px ${prize.glow}`,
                                                } : undefined}
                                            >
                                                {/* Rank */}
                                                <div className={[
                                                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-[10px] font-bold shadow-sm bg-linear-to-br z-10',
                                                    prize.color,
                                                ].join(' ')}
                                                    style={{ boxShadow: `0 4px 12px -2px ${prize.glow}, inset 0 -2px 4px rgba(0,0,0,0.2)` }}
                                                >
                                                    {isTop3 ? <RankIcon rank={winner.rank} /> : <span>#{winner.rank}</span>}
                                                </div>

                                                {/* Avatar */}
                                                <div className={[
                                                    'h-8 w-8 shrink-0 overflow-hidden rounded-full border-2',
                                                    isTop3 ? 'border-amber-400/50' : 'border-slate-200 dark:border-white/10',
                                                ].join(' ')}>
                                                    {(winner.photo_file_id || winner.photo_url) ? (
                                                        <LazyImage
                                                            src={winner.photo_file_id
                                                                ? `${getApiUrl()}/api/partner/photo/${winner.photo_file_id}`
                                                                : winner.photo_url!
                                                            }
                                                            alt={winner.first_name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className={`h-full w-full flex items-center justify-center bg-linear-to-br ${AVATAR_GRADIENTS[winner.id % 5]} text-white font-bold`}>
                                                            {(winner.first_name || winner.username || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Name + XP */}
                                                <div className="flex-1 min-w-0 z-10">
                                                    <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight truncate group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                                                        {winner.first_name || winner.username}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
                                                        {Math.floor(winner.xp).toLocaleString()} XP
                                                    </p>
                                                </div>

                                                {/* Prize */}
                                                <div className={[
                                                    'shrink-0 flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[10px] font-bold',
                                                    'bg-linear-to-r text-white shadow-sm',
                                                    prize.color,
                                                ].join(' ')}
                                                    style={{ boxShadow: `0 2px 10px -3px ${prize.glow}` }}
                                                >
                                                    {prize.isUsdt && <USDTLogo className="w-3 h-3" />}
                                                    {prize.label}
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer CTA */}
                            {!loading && winners.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="mx-4 mt-4"
                                >
                                    <div className={[
                                        'rounded-2xl p-3.5 text-center',
                                        'bg-linear-to-br from-indigo-50 to-purple-50/60 border border-indigo-100/80',
                                        'dark:from-indigo-500/10 dark:to-purple-500/10 dark:border-indigo-500/20',
                                    ].join(' ')}>
                                        <p className="text-caption font-bold text-slate-900 dark:text-white">
                                            🏆 {t('league.compete_next', 'Compete for a top spot next month!')}
                                        </p>
                                        <p className="text-label text-slate-500 dark:text-slate-400 mt-0.5">
                                            {t('league.prizes_reset', 'The rating is updated on the 1st of each month')}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Close - Absolute perfectly positioned */}
                        <button
                            onClick={handleClose}
                            className={[
                                'absolute right-4 top-4 z-100 flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-90',
                                'bg-white/80 text-slate-700 hover:bg-white border border-slate-200/50 backdrop-blur-md',
                                'dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/20 dark:border-white/10 dark:shadow-[0_0_15px_rgba(255,255,255,0.05)]',
                            ].join(' ')}
                            style={{ boxShadow: '0 4px 16px -4px rgba(0,0,0,0.1)' }}
                        >
                            <X size={15} />
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
