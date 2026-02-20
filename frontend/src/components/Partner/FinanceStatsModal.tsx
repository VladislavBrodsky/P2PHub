import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    X, TrendingUp, TrendingDown, Clock, Calendar,
    ArrowUpRight, ArrowDownRight, Activity, DollarSign
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useHaptic } from '../../hooks/useHaptic';

interface FinanceStatsProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FinanceStatsModal = ({ isOpen, onClose }: FinanceStatsProps) => {
    const { t } = useTranslation();
    const { selection, impact } = useHaptic();
    const [stats, setStats] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        let interval: NodeJS.Timeout;

        const fetchStats = async () => {
            try {
                if (!stats) setLoading(true);
                const res = await apiClient.get('/api/partner/finance/stats');
                setStats(res.data);
            } catch (error) {
                console.error('Failed to fetch finance stats:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchStats();
            // Poll every 30 seconds for "always actual data"
            interval = setInterval(fetchStats, 30000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isOpen, stats]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1001] flex items-stretch justify-center pb-safe-bottom">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                className="w-full max-w-lg mx-auto relative z-10 flex flex-col mt-auto pb-[env(safe-area-inset-bottom)]"
            >
                <div className="bg-slate-50 dark:bg-slate-900 rounded-t-[2.5rem] flex flex-col max-h-[90vh] shadow-2xl overflow-hidden border-t border-white/10">
                    {/* Header */}
                    <div className="px-6 pt-8 pb-4 flex items-center justify-between border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 ring-1 ring-emerald-500/20">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {t('partner_dashboard.finance_stats.title', 'Finance Operations')}
                                </h4>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60 leading-none mt-0.5">
                                    {t('partner_dashboard.finance_stats.live_data', 'Live Ledger Data')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-slate-300 dark:hover:bg-white/10 transition-all active:scale-90"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        {loading ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-32 w-full bg-slate-200 dark:bg-white/5 rounded-3xl" />
                                <div className="h-48 w-full bg-slate-200 dark:bg-white/5 rounded-3xl" />
                                <div className="h-48 w-full bg-slate-200 dark:bg-white/5 rounded-3xl" />
                            </div>
                        ) : stats ? (
                            <>
                                {/* Monthly Overview Grid */}
                                <div className="grid grid-cols-1 gap-4">
                                    {/* USDT Card */}
                                    <div className="p-5 rounded-[2rem] bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <div className="text-4xl font-black italic">USDT</div>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                <DollarSign className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                                                {t('partner_dashboard.finance_stats.usdt_stats', 'USDT Analytics')}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">
                                                    {t('partner_dashboard.finance_stats.monthly_income', 'Monthly Income')}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xl font-black text-emerald-500">
                                                        +${(stats.monthly_stats?.USDT?.income ?? 0).toFixed(2)}
                                                    </span>
                                                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 opacity-50" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">
                                                    {t('partner_dashboard.finance_stats.monthly_outcome', 'Monthly Spent')}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xl font-black text-slate-400">
                                                        -${(stats.monthly_stats?.USDT?.outcome ?? 0).toFixed(2)}
                                                    </span>
                                                    <ArrowDownRight className="w-3.5 h-3.5 text-slate-400 opacity-50" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* TON Card */}
                                    <div className="p-5 rounded-[2rem] bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <div className="text-4xl font-black italic">TON</div>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                <Activity className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                                                {t('partner_dashboard.finance_stats.ton_stats', 'TON Analytics')}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">
                                                    {t('partner_dashboard.finance_stats.monthly_income', 'Monthly Income')}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xl font-black text-blue-500">
                                                        +{(stats.monthly_stats?.TON?.income ?? 0).toFixed(2)} TON
                                                    </span>
                                                    <ArrowUpRight className="w-3.5 h-3.5 text-blue-500 opacity-50" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">
                                                    {t('partner_dashboard.finance_stats.monthly_outcome', 'Monthly Spent')}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xl font-black text-slate-400">
                                                        -{(stats.monthly_stats?.TON?.outcome ?? 0).toFixed(2)} TON
                                                    </span>
                                                    <ArrowDownRight className="w-3.5 h-3.5 text-slate-400 opacity-50" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 72h History Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-blue-500" />
                                            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                                                {t('partner_dashboard.finance_stats.history_72h', 'Alpha Activity (72h)')}
                                            </h4>
                                        </div>
                                        <div className="px-2 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20">
                                            <span className="text-[8px] font-black text-blue-500 uppercase">{stats.history_72h?.length || 0} EVENTS</span>
                                        </div>
                                    </div>

                                    {stats.history_72h && stats.history_72h.length > 0 ? (
                                        <div className="space-y-2">
                                            {stats.history_72h.map((item: any, idx: number) => {
                                                const isIncome = item.type === 'INCOME';
                                                return (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="flex items-center justify-between p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isIncome ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20' : 'bg-slate-200 dark:bg-white/5 text-slate-400 ring-1 ring-slate-300 dark:ring-white/10'
                                                                }`}>
                                                                {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[11.5px] font-bold text-slate-900 dark:text-white leading-tight">
                                                                        {item.description}
                                                                    </span>
                                                                    {item.status && item.status !== 'completed' && (
                                                                        <span className={`px-1 rounded-[4px] text-[6px] font-black uppercase tracking-tighter ${item.status === 'pending' || item.status === 'manual_review'
                                                                            ? 'bg-amber-500/20 text-amber-500'
                                                                            : 'bg-red-500/20 text-red-500'
                                                                            }`}>
                                                                            {item.status === 'manual_review' ? 'REVIEW' : item.status}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                                                                    {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className={`text-sm font-black tabular-nums ${isIncome ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                                {isIncome ? '+' : '-'}{(item.amount ?? 0).toFixed(2)}
                                                                <span className="text-[8px] ml-1 uppercase opacity-60 font-black">{item.currency}</span>
                                                            </div>
                                                            <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                                                                {isIncome ? t('partner_dashboard.finance_stats.income', 'INFLOW') : t('partner_dashboard.finance_stats.outcome', 'OUTFLOW')}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-12 flex flex-col items-center justify-center bg-white/40 dark:bg-white/2 border border-dashed border-slate-200 dark:border-white/5 rounded-[2rem] text-center px-6">
                                            <div className="w-12 h-12 bg-slate-100 dark:bg-white/4 rounded-full flex items-center justify-center mb-4">
                                                <Clock className="w-5 h-5 text-slate-300 dark:text-white/20" />
                                            </div>
                                            <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase mb-1">{t('partner_dashboard.finance_stats.no_activity', 'Quiet Perimeter')}</h5>
                                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">
                                                {t('partner_dashboard.finance_stats.no_activity_desc', 'No crypto events recorded in the last 72 hours.')}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Monthly Summary Section */}
                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center gap-2 px-1">
                                        <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 ring-1 ring-indigo-500/20">
                                            <Calendar className="w-3.5 h-3.5" />
                                        </div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white/80">
                                            {t('partner_dashboard.finance_stats.monthly_summary', 'Performance History')}
                                        </h4>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {(stats.monthly_history ?? []).map((m: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className={`p-4 rounded-3xl border transition-all ${idx === 0
                                                    ? 'bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-200/50 dark:border-indigo-500/20 shadow-sm'
                                                    : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 opacity-80'}`}
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {m.month}
                                                    </span>
                                                    {idx === 0 && (
                                                        <span className="px-1.5 py-0.5 rounded-full bg-indigo-500 text-[6px] font-black text-white uppercase tracking-tighter">
                                                            Current
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-1.5 opacity-40">
                                                            <DollarSign className="w-2.5 h-2.5" />
                                                            <span className="text-[8px] font-black uppercase tracking-widest pt-0.5">USDT</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">In</span>
                                                                <span className={`text-[11px] font-black tabular-nums ${m.USDT.income > 0 ? 'text-emerald-500' : 'text-slate-400 opacity-50'}`}>
                                                                    +${m.USDT.income.toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Out</span>
                                                                <span className={`text-[11px] font-black tabular-nums ${m.USDT.outcome > 0 ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 opacity-50'}`}>
                                                                    -${m.USDT.outcome.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-1.5 opacity-40">
                                                            <Activity className="w-2.5 h-2.5" />
                                                            <span className="text-[8px] font-black uppercase tracking-widest pt-0.5">TON</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">In</span>
                                                                <span className={`text-[11px] font-black tabular-nums ${m.TON.income > 0 ? 'text-blue-500' : 'text-slate-400 opacity-50'}`}>
                                                                    +{m.TON.income.toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Out</span>
                                                                <span className={`text-[11px] font-black tabular-nums ${m.TON.outcome > 0 ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 opacity-50'}`}>
                                                                    -{m.TON.outcome.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-sm text-slate-500">Failed to load stats.</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};
