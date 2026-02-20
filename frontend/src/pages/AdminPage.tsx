import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, Clock, AlertTriangle, ShieldCheck, RefreshCw,
    User, ExternalLink, TrendingUp, TrendingDown, Users,
    Zap, PieChart, Wallet, Calendar, Search, X, Trash, Plus,
    Activity, Database, Layers, Bell
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
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
    daily_growth: { date: string; count: number }[];
    daily_revenue: { date: string; amount: number }[];
    recent_sales: RecentSale[];
    events: {
        total_partners: number;
        total_pro: number;
        total_tasks: number;
        active_24h: number;
        pending_payments_24h: number;
        audit: {
            transactions: Record<string, number>;
            orphaned_count: number;
            is_healthy: boolean;
        };
    };
    kpis: {
        conversion_rate: number;
        arpu: number;
        retention_estimate: number;
        retention_7d: number;
        retention_30d: number;
        retention_90d: number;
        retention_180d: number;
        k_factor: number;
        ref_participation: number;
        engagement_rate: number;
        avg_depth: number;
    };
    financials: {
        total_revenue: number;
        total_revenue_ton: number;
        current_ton_value: number;
        total_revenue_usdt: number;
        total_commissions: number;
        net_profit: number;
        gross_margin: number;
        actual_payout_ratio: number;
        theoretical_payout_ratio: number;
        commissions_breakdown: CommissionLine[];
    };
    performance?: {
        avg_manual_approval_min: number;
        pro_slots_actual: number;
        pro_slots_display: number;
    };
    tasks: Record<string, number>;
    top_partners: { username: string; telegram_id: string; earnings: number }[];
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

interface RecentSale {
    id: number;
    amount: number;
    currency: string;
    tx_hash: string;
    created_at: string;
    username: string | null;
    telegram_id: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 p-4 rounded-[1.5rem] shadow-2xl relative overflow-hidden group ring-1 ring-white/10">
                <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <Users size={18} />
                        </div>
                        <div>
                            <div className="text-xl font-black text-white leading-none">
                                {payload[0].value}
                            </div>
                            <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-1">New Partners</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export const AdminPage = () => {
    // #comment: Removed unused user variable from useUser as it is not needed in the AdminPage component
    useUser();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [approvingIds, setApprovingIds] = useState<Set<number>>(new Set());
    const [health, setHealth] = useState<{ status: string; latency_ms: number; orphaned_count: number; timestamp: string } | null>(null);
    const [viewMode, setViewMode] = useState<'kpis' | 'payments' | 'financials' | 'search' | 'network' | 'maintenance'>('kpis');
    const [notifStats, setNotifStats] = useState<{ sent: number; pending: number; failed: number; total: number } | null>(null);
    const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
    const [partnerDetails, setPartnerDetails] = useState<any | null>(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    const [networkStats, setNetworkStats] = useState<Record<string, number> | null>(null);
    const [networkMembers, setNetworkMembers] = useState<any[]>([]);
    const [selectedNetworkDepth, setSelectedNetworkDepth] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const fetchData = async (silent = false, forceRefresh = false) => {
        if (!silent) setIsLoading(true);
        setError(null);
        try {
            const statsUrl = forceRefresh ? '/api/admin/stats?force_refresh=true' : '/api/admin/stats';
            const [statsRes, pendingRes, healthRes] = await Promise.all([
                apiClient.get(statsUrl),
                apiClient.get('/api/admin/pending-payments'),
                apiClient.get('/api/admin/health')
            ]);
            setStats(statsRes.data);
            setTransactions(pendingRes.data);
            setHealth(healthRes.data);
        } catch (err: any) {
            console.error('[Admin] Fetch failed:', err);
            setError(err.response?.data?.detail || 'Failed to load admin data');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const fetchNetworkStats = async () => {
        try {
            const res = await apiClient.get('/api/admin/tree');
            setNetworkStats(res.data);
        } catch (err) {
            console.error('Failed to fetch network tree:', err);
        }
    };

    const fetchNetworkMembers = async (depth: number) => {
        setSelectedNetworkDepth(depth);
        setNetworkMembers([]);
        try {
            const res = await apiClient.get(`/api/admin/network/${depth}`);
            setNetworkMembers(res.data);
        } catch (err) {
            console.error('Failed to fetch network members:', err);
        }
    };

    const fetchPartnerDetails = async (id: number) => {
        setSelectedPartnerId(id);
        setIsDetailsLoading(true);
        try {
            const res = await apiClient.get(`/api/admin/partners/${id}`);
            setPartnerDetails(res.data);
        } catch (err) {
            alert('Failed to load partner details');
            setSelectedPartnerId(null);
        } finally {
            setIsDetailsLoading(false);
        }
    };

    const updatePartner = async (updates: any) => {
        if (!selectedPartnerId) return;
        try {
            await apiClient.post(`/api/admin/partners/${selectedPartnerId}/update`, updates);
            await fetchPartnerDetails(selectedPartnerId);
            alert('Partner updated successfully');
        } catch (err: any) {
            alert('Failed to update: ' + (err.response?.data?.detail || 'Unknown error'));
        }
    };

    const handleClearCache = async () => {
        if (!confirm('This will clear system caches and force data refresh. Proceed?')) return;
        setIsRefreshing(true);
        try {
            await apiClient.post('/api/admin/maintenance/clear-cache');
            alert('Caches cleared successfully!');
            await fetchData(true, true);
        } catch (err) {
            alert('Failed to clear cache');
        } finally {
            setIsRefreshing(false);
        }
    };

    const fetchNotifStats = async () => {
        try {
            const res = await apiClient.get('/api/admin/maintenance/notification-stats');
            setNotifStats(res.data);
        } catch (err) {
            console.error('Failed to fetch notification stats:', err);
        }
    };

    const handleRetryNotifications = async () => {
        setIsRefreshing(true);
        try {
            await apiClient.post('/api/admin/maintenance/retry-notifications');
            alert('Notification retry process triggered!');
            await fetchNotifStats();
        } catch (err) {
            alert('Failed to trigger retries');
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (viewMode === 'network') fetchNetworkStats();
    }, [viewMode]);

    const handleRecalculate = async () => {
        if (!confirm('This will recalculate all referral counts and lineage. Continue?')) return;
        setIsRefreshing(true);
        try {
            await apiClient.post('/api/admin/recalculate-stats');
            alert('Recalculation complete!');
            await fetchData(true, true); // Force refresh dashboard after structural recalculation
        } catch (err: any) {
            alert('Failed: ' + (err.response?.data?.detail || 'Unknown error'));
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (viewMode === 'maintenance') {
            fetchNotifStats();
        }
    }, [viewMode]);

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

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const res = await apiClient.get(`/api/admin/search-partners?query=${encodeURIComponent(searchQuery)}`);
            setSearchResults(res.data);
        } catch (err: any) {
            console.error('[Admin] Search failed:', err);
        } finally {
            setIsSearching(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-slate-500 font-medium whitespace-pre-line text-center">
                    {'Loading System...\nConnecting to Database'}
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 safe-pb space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 active:scale-95 transition-all"
                    >
                        <RefreshCw size={18} className="text-slate-500" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black flex items-center gap-2">
                            <ShieldCheck className="text-blue-500" size={20} />
                            Master Hub
                        </h1>
                        <div className="flex items-center gap-2">
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Performance control</p>
                            <span className={`w-1.5 h-1.5 rounded-full ${stats?.events.audit?.is_healthy ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className="text-[8px] font-black uppercase text-slate-400">
                                {stats?.events.audit?.is_healthy ? 'System Optimal' : 'Action Required'}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => { setIsRefreshing(true); fetchData(true, true); }}
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
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl overflow-x-auto scrollbar-none">
                {(['kpis', 'financials', 'payments', 'network', 'search', 'maintenance'] as const).map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${viewMode === mode
                            ? 'bg-white dark:bg-white/10 shadow-sm text-blue-500'
                            : 'text-slate-500'
                            }`}
                    >
                        {mode === 'kpis' ? <Activity size={12} className="inline mr-1" /> : null}
                        {mode === 'financials' ? <Wallet size={12} className="inline mr-1" /> : null}
                        {mode === 'network' ? <Layers size={12} className="inline mr-1" /> : null}
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
                        {/* Overall Stats Main Card */}
                        <div className="p-6 rounded-[2.5rem] bg-linear-to-br from-blue-600 to-indigo-700 text-white space-y-6 shadow-2xl shadow-blue-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                <Users size={120} />
                            </div>
                            <div className="flex items-center justify-between relative z-10">
                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                    <TrendingUp size={24} />
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black uppercase opacity-60">Total Partners</div>
                                    <div className="text-3xl font-black">{stats?.events.total_partners}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 relative z-10 pt-4 border-t border-white/10">
                                <div>
                                    <div className="text-[9px] font-black uppercase opacity-60 flex items-center gap-1">
                                        <Zap size={10} /> PRO
                                    </div>
                                    <div className="text-lg font-black">{stats?.events.total_pro}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black uppercase opacity-60 flex items-center gap-1">
                                        <Users size={10} /> 24h
                                    </div>
                                    <div className="text-lg font-black">{stats?.events.active_24h}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black uppercase opacity-60 flex items-center gap-1">
                                        Revenue
                                    </div>
                                    <div className="text-lg font-black">${stats?.financials.total_revenue || 0}</div>
                                </div>
                            </div>
                        </div>

                        {/* Core KPI Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-1">
                                <div className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400">Engagement</div>
                                <div className="text-sm font-black text-blue-500">{stats?.kpis.engagement_rate}%</div>
                            </div>
                            <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-1">
                                <div className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400">Conv. Rate</div>
                                <div className="text-sm font-black text-emerald-500">{stats?.kpis.conversion_rate}%</div>
                            </div>
                            <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-1">
                                <div className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400">ARPU</div>
                                <div className="text-sm font-black text-violet-500">${stats?.kpis.arpu}</div>
                            </div>
                        </div>

                        {/* Viral Intelligence Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400">Viral K-Factor</div>
                                    <div className="p-1 bg-indigo-500/10 rounded-lg text-indigo-500">
                                        <Zap size={10} />
                                    </div>
                                </div>
                                <div className="text-lg font-black text-indigo-500">{stats?.kpis.k_factor}</div>
                                <div className="text-[8px] font-bold text-slate-500 uppercase">Avg Referrals per User</div>
                            </div>
                            <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400">Ref. Participation</div>
                                    <div className="p-1 bg-pink-500/10 rounded-lg text-pink-500">
                                        <Users size={10} />
                                    </div>
                                </div>
                                <div className="text-lg font-black text-pink-500">{stats?.kpis.ref_participation}%</div>
                                <div className="text-[8px] font-bold text-slate-500 uppercase">Active referrers share</div>
                            </div>
                            <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400">Network Density</div>
                                    <div className="p-1 bg-emerald-500/10 rounded-lg text-emerald-500">
                                        <Layers size={10} />
                                    </div>
                                </div>
                                <div className="text-lg font-black text-emerald-500">{stats?.kpis.avg_depth} <span className="text-[10px] opacity-60">Gen</span></div>
                                <div className="text-[8px] font-bold text-slate-500 uppercase">Avg Generation Depth</div>
                            </div>
                        </div>

                        {/* Retention Benchmarks Row */}
                        <div className="grid grid-cols-4 gap-3">
                            <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-1">
                                <div className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400">Ret (7d)</div>
                                <div className="text-sm font-black text-amber-500">{stats?.kpis.retention_7d}%</div>
                            </div>
                            <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-1">
                                <div className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400">Ret (30d)</div>
                                <div className="text-sm font-black text-slate-400">{stats?.kpis.retention_30d}%</div>
                            </div>
                            <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-1">
                                <div className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400">Ret (90d)</div>
                                <div className="text-sm font-black text-slate-400">{stats?.kpis.retention_90d}%</div>
                            </div>
                            <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-1">
                                <div className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400">Ret (180d)</div>
                                <div className="text-sm font-black text-slate-400">{stats?.kpis.retention_180d}%</div>
                            </div>
                        </div>

                        {/* System Efficiency & Adoption */}
                        {stats?.performance && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400">Manual Approval Time</div>
                                        <div className="p-1 bg-amber-500/10 rounded-lg text-amber-500">
                                            <Clock size={10} />
                                        </div>
                                    </div>
                                    <div className="text-lg font-black text-amber-500">{stats.performance.avg_manual_approval_min} min</div>
                                    <div className="text-[8px] font-bold text-slate-500 uppercase">Avg response efficiency</div>
                                </div>
                                <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400">Slot Adoption (FOMO)</div>
                                        <div className="p-1 bg-blue-500/10 rounded-lg text-blue-500">
                                            <Zap size={10} />
                                        </div>
                                    </div>
                                    <div className="text-lg font-black text-blue-500">
                                        {stats.performance.pro_slots_display}
                                        <span className="text-[10px] text-slate-500 font-bold ml-1.5 opacity-60">/ {stats.performance.pro_slots_actual} REAL</span>
                                    </div>
                                    <div className="text-[8px] font-bold text-slate-500 uppercase">Calculated Traction Base</div>
                                </div>
                            </div>
                        )}

                        {/* Task Completion Breakdown */}
                        <div className="p-6 rounded-[2rem] glass-panel-premium border border-black/5 dark:border-white/5 space-y-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Task Performance Breakdown</h2>
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                    <Zap size={14} className="text-blue-500 animate-pulse" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                {Object.entries(stats?.tasks || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([taskId, count]) => (
                                    <div key={taskId} className="group flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-[11px] font-black text-slate-700 dark:text-slate-100 uppercase tracking-tight">
                                                {taskId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                            </div>
                                            <div className="text-[11px] font-black text-blue-500 dark:text-blue-400">
                                                {count} <span className="text-[9px] opacity-60 ml-0.5">COMPLETED</span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(count / (stats?.events.total_tasks || 1)) * 100}%` }}
                                                className="h-full bg-linear-to-r from-blue-500 to-indigo-600 rounded-full"
                                                transition={{ duration: 1, ease: "easeOut" }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Partners Leaderboard */}
                        <div className="p-6 rounded-[2rem] glass-panel-premium border border-black/5 dark:border-white/5 space-y-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Elite Earners Leaderboard</h2>
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                    <TrendingUp size={14} className="text-blue-500" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                {stats?.top_partners?.map((p, idx) => (
                                    <div key={p.telegram_id} className="flex items-center justify-between group p-3 rounded-2xl hover:bg-white/5 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[11px] font-black text-slate-500 dark:text-slate-400 border border-black/5 dark:border-white/5">
                                                #{idx + 1}
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-slate-800 dark:text-slate-100 italic transition-colors group-hover:text-blue-500">
                                                    {p.username ? `@${p.username}` : `Partner #${p.telegram_id.toString().slice(-4)}`}
                                                </div>
                                                <div className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                                                    MASTER HUB PARTNER
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-black text-emerald-500 dark:text-emerald-400 flex items-center gap-1 justify-end">
                                                <span className="text-[10px] opacity-60 font-bold">$</span>
                                                {p.earnings.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Performance Chart: User Growth */}
                        <div className="p-6 rounded-[2.5rem] vibing-premium-panel border border-black/5 dark:border-white/5 space-y-6 relative group bg-white/50 dark:bg-slate-900/50">
                            <div className="circuit-decor opacity-30" />
                            <div className="flex items-center justify-between relative z-10">
                                <div className="space-y-1">
                                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">
                                            <TrendingUp size={14} />
                                        </div>
                                        Network Growth Matrix
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1 w-8 bg-blue-500 rounded-full" />
                                        <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest">14-Day Tactical Trajectory</p>
                                    </div>
                                </div>
                                <div className="p-2.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 text-slate-500 shadow-sm">
                                    <Calendar size={16} />
                                </div>
                            </div>

                            <div className="h-[220px] w-full mt-4 relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats?.daily_growth}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                                <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fill: '#64748b', fontWeight: 800 }}
                                            dy={10}
                                        />
                                        <YAxis hide domain={['auto', 'auto']} />
                                        <Tooltip
                                            content={<CustomTooltip />}
                                            cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#3b82f6"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorCount)"
                                            activeDot={{
                                                r: 6,
                                                fill: '#3b82f6',
                                                stroke: '#fff',
                                                strokeWidth: 2,
                                                style: { filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.5))' }
                                            }}
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Network Growth Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(stats?.growth || {}).map(([period, data]) => (
                                <motion.div
                                    key={period}
                                    whileHover={{ y: -4 }}
                                    className="group relative p-6 rounded-[2rem] premium-stat-card bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/10 space-y-4 overflow-hidden"
                                >
                                    {data.percent_change >= 0 && (
                                        <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/5 blur-3xl group-hover:bg-emerald-500/10 transition-all duration-500" />
                                    )}
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${data.percent_change >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                <Activity size={12} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{period}</span>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-[9px] font-black flex items-center gap-1 shadow-sm ${data.percent_change >= 0
                                            ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20'
                                            : 'bg-red-500/10 text-red-500 ring-1 ring-red-500/20'
                                            }`}>
                                            {data.percent_change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                            {Math.abs(data.percent_change)}%
                                        </div>
                                    </div>
                                    <div className="space-y-1 relative z-10">
                                        <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                                            {data.count}
                                        </div>
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Acquired Units</div>
                                    </div>
                                    <div className="flex items-center justify-between relative z-10 pt-4 border-t border-black/5 dark:border-white/5">
                                        <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Previous Era</div>
                                        <div className="text-xs font-black text-slate-700 dark:text-slate-300">{data.previous}</div>
                                    </div>
                                </motion.div>
                            ))}
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
                        <div className="p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none text-slate-900 dark:text-white">
                                <Wallet size={120} />
                            </div>
                            <div className="space-y-1 relative z-10">
                                <span className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">Profit Income to Company (Net)</span>
                                <div className="flex items-end justify-between">
                                    <div className="text-4xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
                                        <span className="text-2xl text-blue-500 font-black">$</span>
                                        {stats?.financials.net_profit}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[8px] font-black text-slate-500 uppercase">Gross Margin</div>
                                        <div className="text-xl font-black text-emerald-500">{stats?.financials.gross_margin}%</div>
                                    </div>
                                </div>
                                <p className="text-slate-500 dark:text-slate-500 text-[10px] font-bold">Total revenue retained by the company</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 relative z-10 pt-4 border-t border-slate-200 dark:border-white/5">
                                <div>
                                    <div className="text-slate-500 text-[9px] font-black uppercase">Paid to Referral Network (Actual)</div>
                                    <div className="text-lg font-black text-slate-900 dark:text-white">${stats?.financials.total_commissions}</div>
                                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">{stats?.financials.actual_payout_ratio}% of Revenue</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 text-[9px] font-black uppercase">Referral Network Target Split (56/44)</div>
                                    <div className="text-lg font-black text-slate-400 dark:text-slate-400">{stats?.financials.theoretical_payout_ratio}%</div>
                                    <div className="text-[10px] text-slate-400 dark:text-slate-600 font-bold italic">Max possible distribution</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 relative z-10 pt-4 border-t border-slate-200 dark:border-white/5">
                                <div>
                                    <div className="text-slate-500 text-[9px] font-black uppercase">Gross Revenue (Total)</div>
                                    <div className="text-lg font-black text-slate-900 dark:text-white">${stats?.financials.total_revenue}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 text-[9px] font-black uppercase">Revenue USDT / TON</div>
                                    <div className="text-xs font-bold text-slate-700 dark:text-white">
                                        USDT: ${stats?.financials.total_revenue_usdt}
                                    </div>
                                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                        TON: {stats?.financials.total_revenue_ton} (${stats?.financials.current_ton_value})
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Revenue Performance Chart */}
                        <div className="p-5 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Revenue Performance</h2>
                                <PieChart size={14} className="text-slate-500" />
                            </div>
                            <div className="h-[180px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats?.daily_revenue}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fill: '#64748b' }}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '12px',
                                                fontSize: '10px'
                                            }}
                                            itemStyle={{ color: '#10b981' }}
                                        />
                                        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                            {stats?.daily_revenue.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.amount > 0 ? '#10b981' : '#334155'} fillOpacity={0.8} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Successful Sales */}
                        <div className="space-y-3">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-1">Recent Successful Sales</h2>
                            <div className="space-y-2">
                                {stats?.recent_sales.map((sale) => (
                                    <div key={sale.id} className="p-3 rounded-2xl glass-panel-premium border border-black/5 dark:border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                <Zap size={20} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                                                    @{sale.username || sale.telegram_id}
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                                    {new Date(sale.created_at).toLocaleDateString()} · {sale.currency}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <div className="text-sm font-black text-emerald-500">+${sale.amount}</div>
                                            {sale.tx_hash && (
                                                <a
                                                    href={`https://tonviewer.com/transaction/${sale.tx_hash}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-1 px-1.5 bg-white/5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-400 transition-colors"
                                                >
                                                    <ExternalLink size={10} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Commissions Breakdown */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">9-Level Comission Split</h2>
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
                                        <span className="text-sm font-black text-slate-700 dark:text-slate-100">${line.amount}</span>
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
                        {/* Manual Review Guidelines */}
                        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-2">
                            <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-widest">
                                <ShieldCheck size={14} />
                                Manual Review Guidelines
                            </div>
                            <ul className="text-[10px] text-slate-500 space-y-1 font-medium list-disc list-inside">
                                <li>Verify the <span className="text-slate-700 dark:text-slate-300 font-bold">TX Hash</span> on the blockchain explorer.</li>
                                <li>Ensure the <span className="text-slate-700 dark:text-slate-300 font-bold">Amount</span> matches the PRO subscription price.</li>
                                <li>Check if the <span className="text-slate-700 dark:text-slate-300 font-bold">Destination Address</span> belongs to the P2PHub system.</li>
                                <li>Approve only after absolute confirmation; rejection notifies the user.</li>
                            </ul>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Pending Review ({transactions.length})</h2>
                            <div className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase">Action Required</div>
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
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">All payments are up to date</p>
                                </motion.div>
                            ) : (
                                transactions.map((tx) => (
                                    <motion.div
                                        key={tx.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        className="p-5 rounded-[2rem] glass-panel-premium border border-black/5 dark:border-white/5 space-y-4 relative overflow-hidden"
                                    >
                                        <div className="flex items-start justify-between relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                                    <Clock className="text-amber-500" size={24} />
                                                </div>
                                                <div>
                                                    <div className="font-black text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                                        {tx.amount} {tx.currency}
                                                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-slate-500 font-bold">
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
                                                <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">
                                                    {tx.created_at ? new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-2xl bg-black/20 font-mono text-[10px] break-all flex items-start justify-between gap-3 border border-black/5 dark:border-white/5">
                                            <span className="text-slate-500 shrink-0 uppercase font-black">TX Hash:</span>
                                            <span className={`select-all flex-1 ${!tx.tx_hash ? "text-red-400 italic" : "text-slate-500 dark:text-slate-400"}`}>
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
                                                className="py-3.5 rounded-[1.25rem] bg-white/5 text-slate-500 font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
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
                                                    <>
                                                        <CheckCircle size={16} />
                                                        Approve
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
                {viewMode === 'network' && (
                    <motion.div
                        key="network"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Tree Distribution Grid */}
                        <div className="space-y-3">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-1 flex items-center gap-2">
                                <Layers size={14} /> Network Generation Tree
                            </h2>
                            <div className="grid grid-cols-3 gap-2">
                                {Array.from({ length: 9 }).map((_, i) => {
                                    const depth = i + 1;
                                    const count = networkStats?.[depth.toString()] || 0;
                                    const isSelected = selectedNetworkDepth === depth;
                                    return (
                                        <button
                                            key={depth}
                                            onClick={() => fetchNetworkMembers(depth)}
                                            className={`p-4 rounded-3xl border transition-all text-left space-y-1 ${isSelected
                                                ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                                                : 'glass-panel-premium border-black/5 dark:border-white/5 text-slate-500 hover:border-blue-500/30'
                                                }`}
                                        >
                                            <div className={`text-[10px] font-black uppercase ${isSelected ? 'opacity-80' : 'text-slate-400'}`}>Gen {depth}</div>
                                            <div className={`text-xl font-black ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>{count}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Network Members List */}
                        {selectedNetworkDepth && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                        Gen {selectedNetworkDepth} Partners
                                    </h2>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Showing Top 100</span>
                                </div>
                                <div className="space-y-2">
                                    {networkMembers.length === 0 ? (
                                        <div className="p-8 text-center glass-panel-premium rounded-3xl text-slate-500 text-xs font-bold animate-pulse">
                                            Loading partners...
                                        </div>
                                    ) : (
                                        networkMembers.map(p => (
                                            <button
                                                key={p.telegram_id}
                                                onClick={() => fetchPartnerDetails(p.id || p.telegram_id)}
                                                className="w-full p-4 rounded-2xl glass-panel-premium border border-black/5 dark:border-white/5 flex items-center justify-between text-left group hover:border-blue-500/30 transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden border border-black/5 dark:border-white/5">
                                                            {p.photo_url ? (
                                                                <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User size={20} className="text-slate-400" />
                                                            )}
                                                        </div>
                                                        {p.is_pro && (
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                                                <Zap size={8} className="text-white fill-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition-colors">
                                                            {p.username ? `@${p.username}` : `${p.first_name || 'Partner'}`}
                                                        </div>
                                                        <div className="text-[9px] font-bold text-slate-500 uppercase">
                                                            ID: {p.telegram_id} · {p.level} Lvl
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-black text-blue-500">{p.xp} XP</div>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {viewMode === 'maintenance' && (
                    <motion.div
                        key="maintenance"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="p-6 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-6 relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none text-slate-400 dark:text-white">
                                <Database size={120} />
                            </div>
                            <div className="space-y-2 relative z-10">
                                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">System Maintenance</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-xs">Critical tools for database consistency and performance optimization.</p>
                            </div>

                            {/* System Health Cards */}
                            <div className="grid grid-cols-2 gap-3 relative z-10">
                                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm space-y-2">
                                    <div className="text-[9px] font-black text-slate-500 uppercase">DB Latency</div>
                                    <div className={`text-lg font-black ${health && health.latency_ms > 200 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                        {health ? `${health.latency_ms}ms` : '--'}
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm space-y-2">
                                    <div className="space-y-1">
                                        <div className="text-[8px] font-black text-slate-500 uppercase">Orphaned Partners</div>
                                        <div className={`text-xl font-black ${stats?.events.audit?.orphaned_count === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {stats?.events.audit?.orphaned_count ?? 0}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-black/5 dark:border-white/5 relative z-10">
                                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2 text-amber-500 font-bold text-[10px] uppercase tracking-widest">
                                        <AlertTriangle size={14} />
                                        Data Consistency Fix
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium">
                                        Recalculates all referral counts, 9-level lineage paths, and caches depth for every partner.
                                        Optimized batch execution.
                                    </p>
                                    <button
                                        onClick={handleRecalculate}
                                        disabled={isRefreshing}
                                        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20"
                                    >
                                        {isRefreshing ? 'Processing...' : 'Recalculate Network Stats'}
                                    </button>
                                </div>

                                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2 text-blue-500 font-bold text-[10px] uppercase tracking-widest">
                                        <RefreshCw size={14} />
                                        System Cache Flush
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium">
                                        Flushes Redis cache for TON prices, leaderboards and dashboard KPIs.
                                        Use this after manual DB changes.
                                    </p>
                                    <button
                                        onClick={handleClearCache}
                                        disabled={isRefreshing}
                                        className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        {isRefreshing ? 'Clearing...' : 'Flush System Cache'}
                                    </button>
                                </div>

                                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
                                            <Bell size={14} />
                                            Notification System
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-500">
                                            {notifStats ? `${notifStats.pending} PENDING` : 'Checking...'}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
                                            <div className="text-[7px] text-slate-500 font-black uppercase">Sent</div>
                                            <div className="text-xs font-black text-emerald-500">{notifStats?.sent ?? 0}</div>
                                        </div>
                                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
                                            <div className="text-[7px] text-slate-500 font-black uppercase">Pending</div>
                                            <div className="text-xs font-black text-amber-500">{notifStats?.pending ?? 0}</div>
                                        </div>
                                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
                                            <div className="text-[7px] text-slate-500 font-black uppercase">Failed</div>
                                            <div className="text-xs font-black text-red-500">{notifStats?.failed ?? 0}</div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium">
                                        Monitor Global Notification System health. If "Pending" is high, trigger a manual retry cycle.
                                    </p>
                                    <button
                                        onClick={handleRetryNotifications}
                                        disabled={isRefreshing || (notifStats?.pending ?? 0) === 0}
                                        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                                    >
                                        {isRefreshing ? 'Retrying...' : 'Trigger Notif Retries'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {viewMode === 'search' && (
                    <motion.div
                        key="search"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="p-5 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-4">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Partner Search</h2>
                            <form onSubmit={handleSearch} className="relative">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Username or Telegram ID..."
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-hidden focus:border-blue-500 transition-all"
                                />
                            </form>
                        </div>

                        <div className="space-y-2">
                            {isSearching ? (
                                <div className="p-12 text-center text-slate-500 text-xs font-bold animate-pulse">Searching users...</div>
                            ) : searchResults.length > 0 ? (
                                searchResults.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => fetchPartnerDetails(p.id)}
                                        className="w-full text-left p-4 rounded-2xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-2 hover:border-blue-500/30 transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition-colors">@{p.username || p.telegram_id}</div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase">ID: {p.telegram_id}</div>
                                            </div>
                                            <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${p.is_pro ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-500/20 text-slate-500'}`}>
                                                {p.is_pro ? 'PRO MEMBER' : 'FREE USER'}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                                            <div className="text-center">
                                                <div className="text-[8px] text-slate-500 font-black uppercase">Level</div>
                                                <div className="text-xs font-black text-slate-900 dark:text-slate-100">{p.level}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[8px] text-slate-500 font-black uppercase">Network</div>
                                                <div className="text-xs font-black text-slate-900 dark:text-slate-100">{p.referral_count}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[8px] text-slate-500 font-black uppercase">XP</div>
                                                <div className="text-xs font-black text-blue-500">{p.xp}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : searchQuery && !isSearching ? (
                                <div className="p-12 text-center text-slate-500 text-xs font-bold">No results found</div>
                            ) : (
                                <div className="p-12 text-center text-slate-500 text-xs font-bold">Search for any partner by username or ID</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Partner Detail Modal Overlay */}
            <AnimatePresence>
                {selectedPartnerId && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedPartnerId(null)}
                            className="absolute inset-0 cursor-default"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            className="w-full max-w-lg bg-slate-100 dark:bg-slate-900 rounded-t-[3rem] p-6 pb-12 space-y-6 relative z-10 max-h-[90vh] overflow-y-auto"
                        >
                            {!partnerDetails || isDetailsLoading ? (
                                <div className="p-20 flex flex-col items-center gap-4">
                                    <RefreshCw className="animate-spin text-blue-500" />
                                    <p className="text-xs font-bold text-slate-500 uppercase">Fetching Dossier...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center text-slate-400">
                                                <User size={32} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 italic">
                                                    @{partnerDetails.username || 'Partner'}
                                                </h3>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                    ID: {partnerDetails.telegram_id}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedPartnerId(null)}
                                            className="p-3 rounded-2xl bg-slate-200 dark:bg-white/10 text-slate-500"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 rounded-[2rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-1">
                                            <div className="text-[10px] font-black text-slate-500 uppercase">Account Rank</div>
                                            <div className="text-xl font-black text-blue-500">Level {partnerDetails.level}</div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase">{partnerDetails.xp} Total XP</div>
                                        </div>
                                        <div className="p-4 rounded-[2rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-1">
                                            <div className="text-[10px] font-black text-slate-500 uppercase">PRO Status</div>
                                            <div className={`text-xl font-black ${partnerDetails.is_pro ? 'text-amber-500' : 'text-slate-400'}`}>
                                                {partnerDetails.is_pro ? 'ACTIVE' : 'INACTIVE'}
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase">{partnerDetails.pro_tokens} Tokens</div>
                                        </div>
                                    </div>

                                    {/* Admin Actions */}
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Administrative Actions</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => updatePartner({ is_pro: !partnerDetails.is_pro })}
                                                className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${partnerDetails.is_pro
                                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                    : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                                    }`}
                                            >
                                                {partnerDetails.is_pro ? <Trash size={14} /> : <Zap size={14} />}
                                                {partnerDetails.is_pro ? 'Revoke PRO' : 'Grant PRO'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const xp = prompt('Enter XP amount to add (can be negative):', '500');
                                                    if (xp) updatePartner({ xp: parseFloat(xp) });
                                                }}
                                                className="py-4 rounded-2xl bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                            >
                                                <Plus size={14} /> Adjust XP
                                            </button>
                                        </div>
                                    </div>

                                    {/* Stats List */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                                            <div className="flex items-center gap-3">
                                                <Users size={18} className="text-slate-400" />
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Direct Referrals</span>
                                            </div>
                                            <span className="text-sm font-black">{partnerDetails.referral_count}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle size={18} className="text-slate-400" />
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Tasks Completed</span>
                                            </div>
                                            <span className="text-sm font-black">{partnerDetails.tasks?.length || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                                            <div className="flex items-center gap-3">
                                                <Wallet size={18} className="text-slate-400" />
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Current Balance</span>
                                            </div>
                                            <span className="text-sm font-black text-emerald-500">${partnerDetails.balance}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};
