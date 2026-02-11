import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, Clock, AlertTriangle, ShieldCheck, RefreshCw,
    User, ExternalLink, TrendingUp, TrendingDown, Users,
    Zap, DollarSign, PieChart, ArrowRight, Wallet
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useUser } from '../context/UserContext';

interface GrowthStat {
    count: number;
    previous: number;
    percent_change: number;
}

interface CommissionLine {
    level: number;
    amount: number;
}

interface DashboardStats {
    growth: {
        "24h": GrowthStat;
        "7d": GrowthStat;
        "30d": GrowthStat;
        "90d": GrowthStat;
    };
    events: {
        total_partners: number;
        total_pro: number;
        total_tasks: number;
    };
    financials: {
        total_revenue: number;
        total_commissions: number;
        net_profit: number;
        commissions_breakdown: CommissionLine[];
    };
}

interface Transaction {
    id: number;
    partner_id: number;
    amount: number;
    currency: string;
    network: string;
    tx_hash: string;
    status: string;
    created_at: string;
}

export const AdminPage = () => {
    const { user } = useUser();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [approvingIds, setApprovingIds] = useState<Set<number>>(new Set());
    const [viewMode, setViewMode] = useState<'kpis' | 'payments' | 'financials'>('kpis');

    const fetchData = async (silent = false) => {
        if (!silent) setIsLoading(true);
        setError(null);
        try {
            const [statsRes, pendingRes] = await Promise.all([
                apiClient.get('/api/admin/stats'),
                apiClient.get('/api/admin/pending-payments')
            ]);
            setStats(statsRes.data);
            setTransactions(pendingRes.data);
        } catch (err: any) {
            console.error('[Admin] Fetch failed:', err);
            setError(err.response?.data?.detail || 'Failed to load admin data');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (txId: number) => {
        if (approvingIds.has(txId)) return;

        setApprovingIds(prev => new Set(prev).add(txId));
        try {
            await apiClient.post(`/api/admin/approve-payment/${txId}`);
            await fetchData(true);
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Approval failed');
        } finally {
            setApprovingIds(prev => {
                const next = new Set(prev);
                next.delete(txId);
                return next;
            });
        }
    };

    const handleReject = async (txId: number) => {
        if (!confirm('Are you sure you want to reject this transaction? The user will be notified.')) return;

        try {
            await apiClient.post(`/api/admin/reject-payment/${txId}`);
            await fetchData(true);
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Rejection failed');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-slate-500 font-medium">Loading Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="p-4 safe-pb space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.location.href = '#/'}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 active:scale-95 transition-all"
                    >
                        <RefreshCw size={18} className="rotate-270 text-slate-500" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black flex items-center gap-2">
                            <ShieldCheck className="text-blue-500" size={20} />
                            Master Hub
                        </h1>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Performance control</p>
                    </div>
                </div>
                <button
                    onClick={() => { setIsRefreshing(true); fetchData(true); }}
                    className={`p-2 rounded-xl bg-slate-100 dark:bg-white/5 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                >
                    <RefreshCw size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                    <AlertTriangle className="text-red-500 shrink-0" size={20} />
                    <p className="text-red-500 text-sm font-semibold">{error}</p>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl">
                {(['kpis', 'financials', 'payments'] as const).map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === mode
                                ? 'bg-white dark:bg-white/10 shadow-sm text-blue-500'
                                : 'text-slate-500'
                            }`}
                    >
                        {mode}
                        {mode === 'payments' && transactions.length > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-[8px]">
                                {transactions.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {viewMode === 'kpis' && (
                    <motion.div
                        key="kpis"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Network Growth Grid */}
                        <div className="space-y-3">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Partner Network Growth</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(stats?.growth || {}).map(([period, data]) => (
                                    <div key={period} className="p-4 rounded-3xl glass-panel-premium border border-white/5 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase text-slate-500">{period}</span>
                                            <div className={`flex items-center gap-0.5 text-[10px] font-bold ${data.percent_change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {data.percent_change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                {Math.abs(data.percent_change)}%
                                            </div>
                                        </div>
                                        <div className="text-2xl font-black">{data.count}</div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase">Prev: {data.previous}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Overall Stats */}
                        <div className="p-5 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white space-y-4 shadow-2xl shadow-blue-500/20">
                            <div className="flex items-center justify-between">
                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                    <Users size={24} />
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black uppercase opacity-60">Total Population</div>
                                    <div className="text-3xl font-black">{stats?.events.total_partners}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
                                <div>
                                    <div className="text-[9px] font-black uppercase opacity-60 flex items-center gap-1">
                                        <Zap size={10} /> PRO Members
                                    </div>
                                    <div className="text-lg font-black">{stats?.events.total_pro}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black uppercase opacity-60 flex items-center gap-1">
                                        <CheckCircle size={10} /> Key Events
                                    </div>
                                    <div className="text-lg font-black">{stats?.events.total_tasks}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {viewMode === 'financials' && (
                    <motion.div
                        key="financials"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Total Clear Income */}
                        <div className="p-6 rounded-[2.5rem] bg-slate-900 border border-white/10 space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                <Wallet size={120} />
                            </div>
                            <div className="space-y-1 relative z-10">
                                <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Final Total Amount</span>
                                <div className="text-4xl font-black text-white flex items-baseline gap-1">
                                    <span className="text-2xl text-blue-500 font-black">$</span>
                                    {stats?.financials.net_profit}
                                </div>
                                <p className="text-slate-500 text-[10px] font-bold">Total Clear Income after referral payouts</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 relative z-10 pt-4 border-t border-white/5">
                                <div>
                                    <div className="text-slate-500 text-[9px] font-black uppercase">Gross Revenue</div>
                                    <div className="text-lg font-black text-white">${stats?.financials.total_revenue}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 text-[9px] font-black uppercase">Total Comission</div>
                                    <div className="text-lg font-black text-red-400">-${stats?.financials.total_commissions}</div>
                                </div>
                            </div>
                        </div>

                        {/* Commissions Breakdown */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">9-Level Comission Split</h2>
                                <PieChart size={14} className="text-slate-500" />
                            </div>
                            <div className="space-y-2">
                                {stats?.financials.commissions_breakdown.map((line) => (
                                    <div key={line.level} className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xs font-black text-slate-500">
                                                L{line.level}
                                            </div>
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Level {line.level} Partners</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-700 dark:text-slate-200">${line.amount}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {viewMode === 'payments' && (
                    <motion.div
                        key="payments"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Pending Review</h2>
                            <div className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase">Manual Tasks</div>
                        </div>

                        <AnimatePresence mode="popLayout">
                            {transactions.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-12 text-center space-y-3 glass-panel-premium rounded-[2rem]"
                                >
                                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle className="text-blue-500" size={32} />
                                    </div>
                                    <div className="text-slate-500 font-bold">Queue Empty</div>
                                    <p className="text-slate-400 text-xs">All payments are up to date</p>
                                </motion.div>
                            ) : (
                                transactions.map((tx) => (
                                    <motion.div
                                        key={tx.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        className="p-5 rounded-[2rem] glass-panel-premium border border-white/5 space-y-4 relative overflow-hidden"
                                    >
                                        <div className="flex items-start justify-between relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                                    <Clock className="text-amber-500" size={24} />
                                                </div>
                                                <div>
                                                    <div className="font-black text-lg flex items-center gap-2">
                                                        {tx.amount} {tx.currency}
                                                        <span className="text-[10px] bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full text-slate-500 font-bold">
                                                            {tx.network}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                                        <User size={10} />
                                                        Partner ID: {tx.partner_id}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-slate-400 uppercase">
                                                    {tx.created_at ? new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-black/20 font-mono text-[10px] break-all flex items-start justify-between gap-3 border border-slate-100 dark:border-white/5">
                                            <span className="text-slate-400 shrink-0 uppercase font-black">TX Hash:</span>
                                            <span className={`select-all flex-1 ${!tx.tx_hash ? "text-red-400 italic" : "text-slate-600 dark:text-slate-300"}`}>
                                                {tx.tx_hash || "Manual Verification Required"}
                                            </span>
                                            {tx.tx_hash && (
                                                <a
                                                    href={tx.network === 'TON' ? `https://tonviewer.com/transaction/${tx.tx_hash}` : `https://tronscan.org/#/transaction/${tx.tx_hash}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-1 px-2 bg-blue-500/10 rounded-lg text-blue-500 hover:bg-blue-500 transition-all hover:text-white"
                                                >
                                                    <ExternalLink size={12} />
                                                </a>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <button
                                                onClick={() => handleReject(tx.id)}
                                                className="py-3.5 rounded-[1.25rem] bg-slate-100 dark:bg-white/5 text-slate-500 font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleApprove(tx.id)}
                                                disabled={approvingIds.has(tx.id)}
                                                className="py-3.5 rounded-[1.25rem] bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                                            >
                                                {approvingIds.has(tx.id) ? (
                                                    <RefreshCw className="animate-spin" size={16} />
                                                ) : (
                                                    "Approve"
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
