import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    X, Clock, Calendar, ChevronDown,
    ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';

// ── Inline USDT (Tether) logo ─────────────────────────────────────────────
const USDTLogo = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 339.43 295.27" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
        <path d="M62.15 1.45L1.64 119.12a4.41 4.41 0 00.87 5.2l166.26 169.63a4.44 4.44 0 006.3 0L341.34 124.32a4.41 4.41 0 00.87-5.2L281.28 1.45a4.43 4.43 0 00-3.96-1.45H66.11a4.43 4.43 0 00-3.96 1.45z" />
        <path fill="white" d="M191.19 144.8v-.06c-1.31.09-8.07.5-23.15.5-12.02 0-20.52-.37-23.48-.5v.06c-46.25-2.04-80.67-10.09-80.67-19.78s34.42-17.74 80.67-19.8v31.49c3 .22 11.72.73 23.68.73 14.38 0 21.59-.59 22.95-.73v-31.47c46.16 2.06 80.49 10.1 80.49 19.78s-34.3 17.74-80.49 19.78zm0-42.8V69.7h64.32V23.09H83.88V69.7h64.32v32.29c-52.33 2.39-91.65 12.75-91.65 25.19s39.32 22.79 91.65 25.18v90.06h42.99v-90.1c52.2-2.38 91.41-12.73 91.41-25.16 0-12.41-39.21-22.77-91.41-25.16z" />
    </svg>
);

// ── Inline TON (The Open Network) logo ────────────────────────────────────
const TONLogo = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
        <path d="M28 0C12.536 0 0 12.536 0 28s12.536 28 28 28 28-12.536 28-28S43.464 0 28 0z" />
        <path fill="white" d="M37.83 15.83H18.17a2.42 2.42 0 00-2.04 3.72L27.05 39.3a1.12 1.12 0 001.9 0L39.87 19.55a2.42 2.42 0 00-2.04-3.72zm-12.27 15.5l-5.61-9.72h7.43l-1.82 9.72zm1.9.24l1.89-10.1h1.3l1.89 10.1-1.94 3.17-3.14-3.17zm6.51-.24l-1.82-9.72h7.43l-5.61 9.72z" />
    </svg>
);
import { apiClient } from '../../api/client';
import { useHaptic } from '../../hooks/useHaptic';

interface FinanceStatsProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FinanceStatsModal = ({ isOpen, onClose }: FinanceStatsProps) => {
    const { t } = useTranslation();
    const { selection } = useHaptic();
    const [stats, setStats] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [selectedMonthIdx, setSelectedMonthIdx] = React.useState(0);
    const [dropdownOpen, setDropdownOpen] = React.useState(false);

    React.useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        const fetchStats = async () => {
            try {
                if (!stats) setLoading(true);
                const res = await apiClient.get('/api/partner/finance/stats');
                setStats(res.data);
            } catch (err) {
                console.error('Failed to fetch finance stats:', err);
            } finally {
                setLoading(false);
            }
        };
        if (isOpen) {
            fetchStats();
            interval = setInterval(fetchStats, 30000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-1001 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Bottom Sheet — safe padding on all sides */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 300 }}
                className="relative z-10 w-full max-w-lg mx-auto flex flex-col px-3"
                style={{
                    paddingBottom: 'calc(env(safe-area-inset-bottom, 12px) + 12px)',
                    maxHeight: '88vh',
                }}
            >
                <div className="bg-white/97 dark:bg-[#0f1624]/97 backdrop-blur-2xl rounded-[2.5rem] flex flex-col overflow-hidden shadow-[0_-8px_60px_-8px_rgba(0,0,0,0.4)] border border-white/20 dark:border-white/6">

                    {/* Drag handle */}
                    <div className="w-10 h-1.5 bg-slate-300/50 dark:bg-white/10 rounded-full mx-auto mt-3 mb-1 shrink-0" />

                    {/* ── Header ── */}
                    <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-200/60 dark:border-white/6 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 ring-1 ring-indigo-500/20">
                                <Activity className="w-4.5 h-4.5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
                                    {t('partner_dashboard.finance_stats.title', 'Finance Intelligence')}
                                </h4>
                                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.18em] opacity-80 leading-none mt-0.5">
                                    {t('partner_dashboard.finance_stats.live_data', 'Live Ledger Data')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => { selection(); onClose(); }}
                            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 active:scale-90 transition-all border border-slate-200 dark:border-white/5"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* ── Scrollable Body ── */}
                    <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-5">
                        {loading ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-28 w-full bg-slate-200 dark:bg-white/5 rounded-3xl" />
                                <div className="h-44 w-full bg-slate-200 dark:bg-white/5 rounded-3xl" />
                                <div className="h-44 w-full bg-slate-200 dark:bg-white/5 rounded-3xl" />
                            </div>
                        ) : stats ? (
                            <>
                                {/* ── Monthly overview cards ── */}
                                <div className="grid grid-cols-1 gap-3">
                                    {/* USDT */}
                                    <div className="relative p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/[0.07] border border-emerald-500/15 dark:border-emerald-500/20 overflow-hidden">
                                        <motion.div
                                            animate={{
                                                y: [0, -8, 0],
                                                rotate: [0, 5, 0],
                                                scale: [1, 1.05, 1]
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                            className="absolute top-3 right-3 pointer-events-none"
                                            style={{ color: '#10b981', opacity: 0.35, filter: 'drop-shadow(0 0 15px rgba(16,185,129,0.4))' }}
                                        >
                                            <USDTLogo className="w-16 h-16" />
                                        </motion.div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <motion.div
                                                animate={{ boxShadow: ['0 0 0px #10b98100', '0 0 8px #10b98155', '0 0 0px #10b98100'] }}
                                                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                                className="w-6 h-6 rounded-lg flex items-center justify-center ring-1"
                                                style={{ background: 'rgba(16,185,129,0.18)', color: '#10b981' }}
                                            >
                                                <USDTLogo className="w-3.5 h-3.5" />
                                            </motion.div>
                                            <span className="text-[9.5px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                                                {t('partner_dashboard.finance_stats.usdt_stats', 'USDT Analytics')}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter mb-1">
                                                    {t('partner_dashboard.finance_stats.monthly_income', 'Monthly Income')}
                                                </p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-lg font-black text-emerald-500 tabular-nums leading-none">
                                                        +${(stats.monthly_stats?.USDT?.income ?? 0).toFixed(2)}
                                                    </span>
                                                    <ArrowUpRight className="w-3 h-3 text-emerald-500 shrink-0" />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter mb-1">
                                                    {t('partner_dashboard.finance_stats.monthly_outcome', 'Monthly Spent')}
                                                </p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-lg font-black text-slate-500 dark:text-slate-400 tabular-nums leading-none">
                                                        -${(stats.monthly_stats?.USDT?.outcome ?? 0).toFixed(2)}
                                                    </span>
                                                    <ArrowDownRight className="w-3 h-3 text-slate-400 shrink-0" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* TON */}
                                    <div className="relative p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-500/[0.07] border border-blue-500/15 dark:border-blue-500/20 overflow-hidden">
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.15, 1],
                                                opacity: [0.25, 0.45, 0.25],
                                                rotate: [0, -3, 0]
                                            }}
                                            transition={{
                                                duration: 2.5,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                            className="absolute top-3 right-3 pointer-events-none"
                                            style={{ color: '#3b82f6', filter: 'drop-shadow(0 0 15px rgba(59,130,246,0.4))' }}
                                        >
                                            <TONLogo className="w-16 h-16" />
                                        </motion.div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <motion.div
                                                animate={{ boxShadow: ['0 0 0px #3b82f600', '0 0 8px #3b82f655', '0 0 0px #3b82f600'] }}
                                                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                                className="w-6 h-6 rounded-lg flex items-center justify-center ring-1"
                                                style={{ background: 'rgba(59,130,246,0.18)', color: '#3b82f6' }}
                                            >
                                                <TONLogo className="w-3.5 h-3.5" />
                                            </motion.div>
                                            <span className="text-[9.5px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400">
                                                {t('partner_dashboard.finance_stats.ton_stats', 'TON Analytics')}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter mb-1">
                                                    {t('partner_dashboard.finance_stats.monthly_income', 'Monthly Income')}
                                                </p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-lg font-black text-blue-500 tabular-nums leading-none">
                                                        +{(stats.monthly_stats?.TON?.income ?? 0).toFixed(2)} TON
                                                    </span>
                                                    <ArrowUpRight className="w-3 h-3 text-blue-500 shrink-0" />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter mb-1">
                                                    {t('partner_dashboard.finance_stats.monthly_outcome', 'Monthly Spent')}
                                                </p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-lg font-black text-slate-500 dark:text-slate-400 tabular-nums leading-none">
                                                        -{(stats.monthly_stats?.TON?.outcome ?? 0).toFixed(2)} TON
                                                    </span>
                                                    <ArrowDownRight className="w-3 h-3 text-slate-400 shrink-0" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── 72h Activity Feed ── */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-0.5">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                                                {t('partner_dashboard.finance_stats.history_72h', 'Alpha Activity (72h)')}
                                            </h4>
                                        </div>
                                        <div className="px-2 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20">
                                            <span className="text-[7.5px] font-black text-blue-500 uppercase">
                                                {stats.history_72h?.length ?? 0} {t('partner_dashboard.finance_stats.events', 'EVENTS')}
                                            </span>
                                        </div>
                                    </div>

                                    {stats.history_72h && stats.history_72h.length > 0 ? (
                                        <div className="space-y-2">
                                            {stats.history_72h.map((item: any, idx: number) => {
                                                const isIncome = item.type === 'INCOME';
                                                return (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, x: -8 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.04 }}
                                                        className="flex items-center justify-between p-3.5 bg-white dark:bg-white/3 border border-slate-200/70 dark:border-white/6 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/6 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isIncome
                                                                ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20'
                                                                : 'bg-slate-200 dark:bg-white/5 text-slate-400 ring-1 ring-slate-300 dark:ring-white/10'}`}>
                                                                {isIncome
                                                                    ? <ArrowUpRight className="w-3.5 h-3.5" />
                                                                    : <ArrowDownRight className="w-3.5 h-3.5" />
                                                                }
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight truncate">
                                                                        {item.description}
                                                                    </span>
                                                                    {item.status && item.status !== 'completed' && (
                                                                        <span className={`px-1 rounded text-[6px] font-black uppercase tracking-tighter shrink-0 ${item.status === 'pending' || item.status === 'manual_review'
                                                                            ? 'bg-amber-500/20 text-amber-500'
                                                                            : 'bg-red-500/20 text-red-500'}`}>
                                                                            {item.status === 'manual_review' ? 'REVIEW' : item.status}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                                                                    {new Date(item.created_at).toLocaleDateString([], {
                                                                        month: 'short', day: 'numeric',
                                                                        hour: '2-digit', minute: '2-digit'
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0 ml-3">
                                                            <div className={`text-sm font-black tabular-nums ${isIncome ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                {isIncome ? '+' : '-'}{(item.amount ?? 0).toFixed(2)}
                                                                <span className="text-[7.5px] ml-0.5 uppercase opacity-60">{item.currency}</span>
                                                            </div>
                                                            <div className="text-[7px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                                                                {isIncome
                                                                    ? t('partner_dashboard.finance_stats.income', 'INFLOW')
                                                                    : t('partner_dashboard.finance_stats.outcome', 'OUTFLOW')
                                                                }
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-10 flex flex-col items-center justify-center bg-white/40 dark:bg-white/2 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl text-center px-6">
                                            <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-3">
                                                <Clock className="w-4.5 h-4.5 text-slate-300 dark:text-white/20" />
                                            </div>
                                            <h5 className="text-[10px] font-black text-slate-900 dark:text-white uppercase mb-1">
                                                {t('partner_dashboard.finance_stats.no_activity', 'Quiet Perimeter')}
                                            </h5>
                                            <p className="text-[8.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">
                                                {t('partner_dashboard.finance_stats.no_activity_desc', 'No crypto events in the last 72 hours.')}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* ── Monthly History with Dropdown ── */}
                                <div className="space-y-3 pb-2">
                                    <div className="flex items-center justify-between px-0.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 ring-1 ring-indigo-500/20">
                                                <Calendar className="w-3 h-3" />
                                            </div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-800 dark:text-white/80">
                                                {t('partner_dashboard.finance_stats.monthly_summary', 'Performance History')}
                                            </h4>
                                        </div>
                                    </div>

                                    {/* Month Dropdown Selector */}
                                    {(stats.monthly_history ?? []).length > 0 && (
                                        <div className="relative">
                                            <button
                                                onClick={() => { selection(); setDropdownOpen(o => !o); }}
                                                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white dark:bg-white/4 border border-slate-200 dark:border-white/8 hover:bg-slate-50 dark:hover:bg-white/7 transition-all active:scale-[0.98]"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {stats.monthly_history[selectedMonthIdx]?.month}
                                                    </span>
                                                    {selectedMonthIdx === 0 && (
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                                                            <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                                                            <span className="text-[7px] font-black text-indigo-600 dark:text-indigo-400 uppercase">
                                                                {t('partner_dashboard.finance_stats.current', 'Current')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <motion.div
                                                    animate={{ rotate: dropdownOpen ? 180 : 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                                </motion.div>
                                            </button>

                                            {/* Dropdown Options */}
                                            {dropdownOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -8, scaleY: 0.9 }}
                                                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                                                    exit={{ opacity: 0, y: -8, scaleY: 0.9 }}
                                                    transition={{ duration: 0.15 }}
                                                    style={{ transformOrigin: 'top' }}
                                                    className="absolute top-full mt-1.5 left-0 right-0 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden"
                                                >
                                                    {(stats.monthly_history ?? []).map((m: any, idx: number) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => { selection(); setSelectedMonthIdx(idx); setDropdownOpen(false); }}
                                                            className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${idx === selectedMonthIdx
                                                                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                                                : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                                                                } ${idx > 0 ? 'border-t border-slate-100 dark:border-white/5' : ''}`}
                                                        >
                                                            <span className="text-[11px] font-black uppercase tracking-tight">{m.month}</span>
                                                            {idx === 0 && (
                                                                <span className="text-[7px] font-black text-indigo-500 uppercase tracking-wider">● {t('partner_dashboard.finance_stats.current', 'Current')}</span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </div>
                                    )}

                                    {/* Selected Month Detail Card */}
                                    {(stats.monthly_history ?? []).length > 0 && (() => {
                                        const m = stats.monthly_history[selectedMonthIdx];
                                        const isActive = selectedMonthIdx === 0;
                                        const netUSDT = m.USDT.income - m.USDT.outcome;
                                        const netTON = m.TON.income - m.TON.outcome;
                                        return (
                                            <motion.div
                                                key={selectedMonthIdx}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className={`relative p-4 rounded-2xl border overflow-hidden ${isActive
                                                    ? 'bg-indigo-50/60 dark:bg-indigo-500/[0.07] border-indigo-200/60 dark:border-indigo-500/25'
                                                    : 'bg-white/50 dark:bg-white/3 border-slate-200/60 dark:border-white/6'
                                                    }`}
                                            >
                                                {isActive && (
                                                    <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-400/10 blur-2xl -mr-8 -mt-8 pointer-events-none" />
                                                )}

                                                {/* Net Summary row */}
                                                <div className="flex items-center justify-between mb-4 relative z-10">
                                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Net Balance</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[11px] font-black tabular-nums ${netUSDT >= 0 ? 'text-emerald-500' : 'text-red-400'
                                                            }`}>
                                                            {netUSDT >= 0 ? '+' : ''}{netUSDT.toFixed(2)} USDT
                                                        </span>
                                                        <span className={`text-[11px] font-black tabular-nums ${netTON >= 0 ? 'text-blue-500' : 'text-red-400'
                                                            }`}>
                                                            {netTON >= 0 ? '+' : ''}{netTON.toFixed(2)} TON
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2.5 relative z-10">
                                                    {/* USDT */}
                                                    <div className="p-3 rounded-xl border bg-white/70 dark:bg-black/20 border-slate-100 dark:border-white/6 space-y-2">
                                                        <div className="flex items-center gap-1.5 opacity-70">
                                                            <USDTLogo className="w-3 h-3 text-emerald-500" />
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">USDT</span>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">{t('partner_dashboard.finance_stats.inflow_short', 'In')}</span>
                                                                <span className={`text-sm font-black tabular-nums leading-none ${m.USDT.income > 0 ? 'text-emerald-500' : 'text-slate-400 opacity-50'
                                                                    }`}>+${m.USDT.income.toFixed(2)}</span>
                                                            </div>
                                                            <div className="h-px bg-slate-200 dark:bg-white/5" />
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">{t('partner_dashboard.finance_stats.outflow_short', 'Out')}</span>
                                                                <span className={`text-sm font-black tabular-nums leading-none ${m.USDT.outcome > 0 ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 opacity-50'
                                                                    }`}>-${m.USDT.outcome.toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* TON */}
                                                    <div className="p-3 rounded-xl border bg-white/70 dark:bg-black/20 border-slate-100 dark:border-white/6 space-y-2">
                                                        <div className="flex items-center gap-1.5 opacity-70">
                                                            <TONLogo className="w-3 h-3 text-blue-500" />
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">TON</span>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">{t('partner_dashboard.finance_stats.inflow_short', 'In')}</span>
                                                                <span className={`text-sm font-black tabular-nums leading-none ${m.TON.income > 0 ? 'text-blue-500' : 'text-slate-400 opacity-50'
                                                                    }`}>+{m.TON.income.toFixed(2)}</span>
                                                            </div>
                                                            <div className="h-px bg-slate-200 dark:bg-white/5" />
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">{t('partner_dashboard.finance_stats.outflow_short', 'Out')}</span>
                                                                <span className={`text-sm font-black tabular-nums leading-none ${m.TON.outcome > 0 ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 opacity-50'
                                                                    }`}>-{m.TON.outcome.toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })()}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {t('partner_dashboard.finance_stats.failed_load', 'Failed to load stats.')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};
