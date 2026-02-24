import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, Clock, AlertTriangle, ShieldCheck, RefreshCw,
    User, ExternalLink, TrendingUp, TrendingDown, Users,
    Zap, PieChart, Wallet, Calendar, Search, X, Trash, Plus,
    Activity, Database, Layers, Bell, Eye, Send, ShieldAlert, Timer, CreditCard, Cpu,
    Megaphone, UserPlus, Filter, PlayCircle, StopCircle, Trash2,
    BookOpen, GitBranch, CheckSquare, AlertOctagon, Radio
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { apiClient } from '../api/client';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';

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
            <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 p-4 rounded-xl shadow-2xl relative overflow-hidden group ring-1 ring-white/10">
                <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
                <div className="relative z-10">
                    <p className="text-label font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <Users size={18} />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-white leading-none">
                                {payload[0].value}
                            </div>
                            <div className="text-label font-bold text-blue-400 uppercase tracking-widest mt-1">New Partners</div>
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
    const { t } = useTranslation('common');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [approvingIds, setApprovingIds] = useState<Set<number>>(new Set());
    const [health, setHealth] = useState<{ status: string; latency_ms: number; orphaned_count: number; timestamp: string } | null>(null);
    const [viewMode, setViewMode] = useState<'kpis' | 'payments' | 'financials' | 'search' | 'network' | 'maintenance' | 'palantir' | 'nexus' | 'ledger'>('kpis');
    const [notifStats, setNotifStats] = useState<{ sent: number; pending: number; failed: number; total: number } | null>(null);
    const [palantirFeed, setPalantirFeed] = useState<any[]>([]);
    const [notificationsHealth, setNotificationsHealth] = useState<any>(null);
    const [isPalantirPolling, setIsPalantirPolling] = useState(false);
    const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
    const [partnerDetails, setPartnerDetails] = useState<any | null>(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    const [broadcasts, setBroadcasts] = useState<any[]>([]);
    const [activeBroadcasts, setActiveBroadcasts] = useState<any[]>([]);
    const [broadcastForm, setBroadcastForm] = useState({ text: '', audience: 'all' });
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [networkStats, setNetworkStats] = useState<Record<string, number> | null>(null);
    const [networkMembers, setNetworkMembers] = useState<any[]>([]);
    const [selectedNetworkDepth, setSelectedNetworkDepth] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Maintenance Audits
    const [economyAudit, setEconomyAudit] = useState<{ status: string; discrepancies_found: number; total_checked: number } | null>(null);
    const [treeAudit, setTreeAudit] = useState<{ status: string; anomaly_count: number; total_checked: number } | null>(null);
    const [isEconomyAuditing, setIsEconomyAuditing] = useState(false);
    const [isTreeAuditing, setIsTreeAuditing] = useState(false);

    // Event Ledger
    const [ledgerEvents, setLedgerEvents] = useState<any[]>([]);
    const [ledgerFilter, setLedgerFilter] = useState<string>('ALL');
    const [ledgerPartnerId, setLedgerPartnerId] = useState<string>('');
    const [ledgerChatId, setLedgerChatId] = useState<string>('');
    const [ledgerNotifHistory, setLedgerNotifHistory] = useState<any | null>(null);
    const [isLedgerLoading, setIsLedgerLoading] = useState(false);
    const [isReconciling, setIsReconciling] = useState(false);
    const [reconcileResult, setReconcileResult] = useState<any | null>(null);

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

    const fetchPalantirFeed = async (showLoading = false) => {
        if (showLoading) setIsRefreshing(true);
        try {
            const res = await apiClient.get('/api/admin/palantir-feed');
            setPalantirFeed(res.data);
        } catch (err) {
            console.error('Failed to fetch palantir feed:', err);
        } finally {
            if (showLoading) setIsRefreshing(false);
        }
    };

    const fetchNotificationsHealth = async () => {
        try {
            const res = await apiClient.get('/api/notifications-health');
            setNotificationsHealth(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications health:', err);
        }
    };

    const fetchBroadcasts = async () => {
        try {
            const [history, active] = await Promise.all([
                apiClient.get('/api/admin/broadcasts/history'),
                apiClient.get('/api/admin/broadcasts/active')
            ]);
            setBroadcasts(history.data);
            setActiveBroadcasts(active.data);
        } catch (err) {
            console.error('Failed to fetch broadcasts:', err);
        }
    };

    const handleCreateBroadcast = async () => {
        if (!broadcastForm.text.trim()) return;
        setIsBroadcasting(true);
        try {
            await apiClient.post('/api/admin/broadcasts', {
                message_text: broadcastForm.text,
                audience_type: broadcastForm.audience
            });
            setBroadcastForm({ text: '', audience: 'all' });
            fetchBroadcasts();
        } catch (err) {
            console.error('Failed to create broadcast:', err);
        } finally {
            setIsBroadcasting(false);
        }
    };

    const handleCancelBroadcast = async (id: number) => {
        try {
            await apiClient.post(`/api/admin/broadcasts/${id}/cancel`);
            fetchBroadcasts();
        } catch (err) {
            console.error('Failed to cancel broadcast:', err);
        }
    };

    /**
     * Executes the Economy Integrity Audit.
     * Triggers a backend check that compares actual XP & USDT balances against 
     * a calculated sum of expected earnings/transactions over the lifetime of the partner.
     * Flags anomalies instantly for manual system intervention.
     */
    const handleEconomyAudit = async () => {
        setIsEconomyAuditing(true);
        try {
            const res = await apiClient.post('/api/admin/maintenance/audit-economy');
            setEconomyAudit(res.data);
            alert(`Economy Audit Complete: ${res.data.discrepancies_found} discrepancies found.`);
        } catch (err: any) {
            alert('Failed to run economy audit: ' + (err.response?.data?.detail || 'Unknown error'));
        } finally {
            setIsEconomyAuditing(false);
        }
    };

    /**
     * Executes the Network Tree Integrity Audit.
     * Runs a topological scan on the materialized path structures to ensure 'depth' 
     * exactly matches the structural level inferred by 'path'. Extremely fast.
     */
    const handleTreeAudit = async () => {
        setIsTreeAuditing(true);
        try {
            const res = await apiClient.post('/api/admin/maintenance/audit-tree');
            setTreeAudit(res.data);
            alert(`Tree Audit Complete: ${res.data.anomaly_count} anomalies found.`);
        } catch (err: any) {
            alert('Failed to run tree audit: ' + (err.response?.data?.detail || 'Unknown error'));
        } finally {
            setIsTreeAuditing(false);
        }
    };

    const fetchLedgerEvents = useCallback(async () => {
        setIsLedgerLoading(true);
        try {
            const params = new URLSearchParams({ limit: '100' });
            if (ledgerFilter !== 'ALL') params.set('action_type', ledgerFilter);
            if (ledgerPartnerId.trim()) params.set('partner_id', ledgerPartnerId.trim());
            const res = await apiClient.get(`/api/admin/ledger/events?${params}`);
            setLedgerEvents(res.data);
        } catch (err) {
            console.error('Ledger fetch failed:', err);
        } finally {
            setIsLedgerLoading(false);
        }
    }, [ledgerFilter, ledgerPartnerId]);

    const fetchNotifHistoryForUser = async () => {
        if (!ledgerChatId.trim()) return;
        setIsLedgerLoading(true);
        try {
            const res = await apiClient.get(`/api/admin/ledger/notifications/${ledgerChatId.trim()}`);
            setLedgerNotifHistory(res.data);
        } catch (err) {
            console.error('Notif history fetch failed:', err);
        } finally {
            setIsLedgerLoading(false);
        }
    };

    const handleLiveReconcile = async () => {
        setIsReconciling(true);
        setReconcileResult(null);
        try {
            const res = await apiClient.post('/api/admin/ledger/reconcile');
            setReconcileResult(res.data);
        } catch (err: any) {
            alert('Reconcile failed: ' + (err.response?.data?.detail || 'Unknown error'));
        } finally {
            setIsReconciling(false);
        }
    };

    useEffect(() => {
        if (viewMode === 'network') fetchNetworkStats();
        if (viewMode === 'ledger') fetchLedgerEvents();
    }, [viewMode]);

    useEffect(() => {
        if (viewMode === 'ledger') fetchLedgerEvents();
    }, [ledgerFilter, ledgerPartnerId]);

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
        let interval: any;
        if (viewMode === 'maintenance') {
            fetchNotifStats();
        } else if (viewMode === 'palantir') {
            fetchPalantirFeed(true);
            fetchNotificationsHealth();
            // Enable polling for Palantir
            setIsPalantirPolling(true);
            interval = setInterval(() => {
                fetchPalantirFeed();
                fetchNotificationsHealth();
            }, 8000); // 8-second God-Mode heart-beat
        } else if (viewMode === 'nexus') {
            fetchBroadcasts();
            interval = setInterval(fetchBroadcasts, 3000); // Fast 3s polling for progress bars
            setIsPalantirPolling(false);
        } else {
            setIsPalantirPolling(false);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
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
        <div className="p-4 pb-[calc(var(--spacing-safe-bottom,20px)+80px)] space-y-6">
            {/* Header */}
            <div className="flex flex-col items-center justify-center w-full py-3 space-y-4 text-center">
                <div className="flex items-center justify-center w-full">
                    <div className="w-14 h-14 rounded-3xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/5">
                        <ShieldCheck className="text-blue-500" size={28} />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                        {t('admin_portal.command_center')}
                    </h1>

                    <div className="flex flex-col items-center justify-center gap-4 pt-1">
                        <div className="flex items-center gap-2">
                            <p className="text-slate-500 text-label font-bold uppercase tracking-[0.2em] whitespace-nowrap">{t('admin_portal.performance_control')}</p>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                                <span className={`w-2 h-2 rounded-full ${stats?.events.audit?.is_healthy ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'} animate-pulse`} />
                                <span className="text-label font-bold uppercase text-slate-500 dark:text-slate-300">
                                    {stats?.events.audit?.is_healthy ? t('admin_portal.system_optimal') : t('admin_portal.attention_required')}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => { setIsRefreshing(true); fetchData(true, true); }}
                            className={`w-14 h-14 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/20 active:scale-90 transition-all shadow-xl shadow-black/5 dark:shadow-black/20 flex items-center justify-center ${isRefreshing ? 'animate-spin' : ''}`}
                            title={t('admin_portal.refresh_data')}
                        >
                            <RefreshCw size={24} className="text-blue-500 dark:text-blue-400" />
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                    <AlertTriangle className="text-red-500 shrink-0" size={20} />
                    <p className="text-red-500 text-sm font-semibold">{error}</p>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl overflow-x-auto scrollbar-none">
                {(['kpis', 'financials', 'payments', 'network', 'search', 'maintenance', 'palantir', 'nexus', 'ledger'] as const).map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`px-3 py-1.5 text-label font-bold uppercase tracking-widest rounded-xl transition-all whitespace-nowrap flex items-center gap-1 ${viewMode === mode
                            ? 'bg-white dark:bg-white/10 shadow-sm text-blue-500'
                            : 'text-slate-500 hover:bg-white/5'
                            }`}
                    >
                        {mode === 'kpis' ? <Activity size={12} /> : null}
                        {mode === 'financials' ? <Wallet size={12} /> : null}
                        {mode === 'network' ? <Layers size={12} /> : null}
                        {mode === 'palantir' ? <Eye size={12} className={viewMode === 'palantir' ? 'text-indigo-500' : ''} /> : null}
                        {mode === 'nexus' ? <Megaphone size={12} className={viewMode === 'nexus' ? 'text-orange-500' : ''} /> : null}
                        {mode === 'ledger' ? <BookOpen size={12} className={viewMode === 'ledger' ? 'text-emerald-500' : ''} /> : null}
                        {mode}
                        {mode === 'payments' && transactions.length > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-label">
                                {transactions.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {viewMode === 'palantir' && (
                    <motion.div
                        key="palantir"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Palantir Header & Health Integration (God-Mode Overlay) */}
                        <div className="space-y-4">
                            <div className="p-5 rounded-3xl glass-panel-premium border border-indigo-500/20 shadow-2xl shadow-indigo-500/10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                                    <Eye size={120} />
                                </div>
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center relative">
                                            <Eye className="text-indigo-500" size={20} />
                                            {isPalantirPolling && (
                                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                                                God-Mode Palantir
                                                <span className="text-label px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-bold animate-pulse">LIVE</span>
                                            </h3>
                                            <p className="text-label text-slate-500 font-bold uppercase tracking-tight">Active Matrix Feed · Real-time Observability</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => fetchPalantirFeed(true)}
                                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-90 transition-all border border-white/5"
                                    >
                                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-indigo-500' : 'text-slate-500'} />
                                    </button>
                                </div>

                                {/* Health Micro-Panel (Integrated Deliverability Monitoring) */}
                                {notificationsHealth && (
                                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-indigo-500/10 relative z-10">
                                        <div className="space-y-1">
                                            <div className="text-label font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                <Send size={8} /> Sent
                                            </div>
                                            <div className="text-lg font-bold text-emerald-500 font-mono tracking-tighter">
                                                {notificationsHealth.counts?.sent || 0}
                                            </div>
                                        </div>
                                        <div className="space-y-1 border-x border-indigo-500/10 px-3">
                                            <div className="text-label font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                <ShieldAlert size={8} /> Failed
                                            </div>
                                            <div className="text-lg font-bold text-rose-500 font-mono tracking-tighter">
                                                {notificationsHealth.counts?.failed || 0}
                                            </div>
                                        </div>
                                        <div className="space-y-1 pl-3">
                                            <div className="text-label font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                <Database size={8} /> Queued
                                            </div>
                                            <div className={`text-lg font-bold font-mono tracking-tighter ${notificationsHealth.redis_queue_depth > 0 ? 'text-indigo-400' : 'text-slate-400'}`}>
                                                {notificationsHealth.redis_queue_depth || 0}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Audit Feed List */}
                        <div className="space-y-2 relative">
                            {/* Vertical Line Connector (Matrix Feel) */}
                            <div className="absolute left-safe-bottom top-6 bottom-6 w-px bg-linear-to-b from-indigo-500/20 via-indigo-500/40 to-indigo-500/20 hidden sm:block"></div>

                            {palantirFeed.length === 0 ? (
                                <div className="p-16 text-center space-y-4 glass-panel-premium rounded-[3rem] border border-black/5 dark:border-white/5">
                                    <div className="w-16 h-16 rounded-full bg-slate-500/5 flex items-center justify-center mx-auto border border-white/5">
                                        <Activity size={32} className="text-slate-500 opacity-20" />
                                    </div>
                                    <div className="text-slate-500 font-bold uppercase text-label tracking-[0.2em]">Matrix Offline — No Events Captured</div>
                                </div>
                            ) : (
                                palantirFeed.map(log => (
                                    <div
                                        key={log.id}
                                        className="p-4 rounded-[1.75rem] glass-panel-premium border border-black/5 dark:border-white/5 flex items-start gap-4 group hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 relative z-10"
                                    >
                                        {/* Action Icon Component */}
                                        <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center border border-black/5 dark:border-white/5 shadow-inner relative overflow-hidden
                                            ${log.action_type === 'UPGRADE' ? 'bg-amber-500/10 text-amber-500' :
                                                log.action_type === 'PAYMENT' ? 'bg-blue-500/10 text-blue-500' :
                                                    log.action_type === 'COMMISSION' ? 'bg-emerald-500/10 text-emerald-500' :
                                                        log.action_type === 'PENALTY' ? 'bg-rose-500/10 text-rose-500' :
                                                            'bg-slate-500/10 text-slate-500'}`}
                                        >
                                            <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent opacity-50"></div>
                                            {log.action_type === 'UPGRADE' ? <Zap size={20} /> :
                                                log.action_type === 'PAYMENT' ? <CreditCard size={20} /> :
                                                    log.action_type === 'COMMISSION' ? <Wallet size={20} /> :
                                                        log.action_type === 'PENALTY' ? <ShieldAlert size={20} /> :
                                                            log.action_type === 'SYSTEM' ? <Cpu size={20} /> :
                                                                <Eye size={20} />}
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <span className={`text-label font-bold uppercase px-2 py-0.5 rounded-lg
                                                        ${log.action_type === 'UPGRADE' ? 'bg-amber-500/10 text-amber-500' :
                                                            log.action_type === 'PAYMENT' ? 'bg-blue-500/10 text-blue-500' :
                                                                log.action_type === 'COMMISSION' ? 'bg-emerald-500/10 text-emerald-500' :
                                                                    log.action_type === 'PENALTY' ? 'bg-rose-500/10 text-rose-500' :
                                                                        'bg-slate-500/10 text-slate-500'}`}
                                                    >
                                                        {log.action_type}
                                                    </span>
                                                    <span className="text-label font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                                                        {log.username ? `@${log.username}` : log.telegram_id !== 'system' ? log.telegram_id : <span className="text-slate-400 font-medium">CORE</span>}
                                                        {log.partner_is_pro && (
                                                            <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                                                <Zap size={8} className="text-white fill-white" />
                                                            </div>
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="text-label font-mono text-slate-400 font-bold whitespace-nowrap bg-black/5 dark:bg-white/5 p-1 rounded-md border border-white/5">
                                                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-tight">
                                                    {log.description || log.action}
                                                </p>
                                                {log.partner_id && (
                                                    <button
                                                        onClick={() => setSelectedPartnerId(log.partner_id)}
                                                        className="shrink-0 p-1.5 rounded-lg bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-500 transition-colors"
                                                        title="View Profile"
                                                    >
                                                        <Search size={12} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Technical Details Reveal */}
                                            {log.details && Object.keys(log.details).length > 0 && (
                                                <div className="mt-3 bg-black/20 rounded-xl border border-white/5 p-3 overflow-hidden">
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                        {Object.entries(log.details).slice(0, 4).map(([key, val]) => (
                                                            <div key={key} className="flex flex-col gap-0.5">
                                                                <span className="text-label font-bold uppercase text-slate-500 tracking-widest">{key.replace(/_/g, ' ')}</span>
                                                                <span className="text-label font-mono text-indigo-400 font-bold truncate">
                                                                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}

                {viewMode === 'nexus' && (
                    <motion.div
                        key="nexus"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-6"
                    >
                        {/* Nexus Proactive Broadcast Hub */}
                        <div className="p-6 rounded-[2.5rem] glass-panel-premium border border-orange-500/20 shadow-2xl shadow-orange-500/5 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                                        <Megaphone className="text-orange-500" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">Broadcast Nexus</h3>
                                        <p className="text-label text-slate-500 font-bold uppercase">Multi-Target Communication Hub</p>
                                    </div>
                                </div>
                                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-label font-bold text-emerald-500 uppercase tracking-widest animate-pulse">
                                    System Ready
                                </div>
                            </div>

                            {/* Audience Switcher */}
                            <div className="space-y-3">
                                <label className="text-label font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <UserPlus size={12} /> Target Audience
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'all', label: 'All Partners', icon: Users },
                                        { id: 'pro_only', label: 'PRO Members', icon: Zap },
                                        { id: 'free_only', label: 'Free Tier', icon: User },
                                        { id: 'level_1', label: 'Level 1 Only', icon: Layers },
                                        { id: 'inactive_7d', label: 'Inactive (7d+)', icon: Clock }
                                    ].map(aud => (
                                        <button
                                            key={aud.id}
                                            onClick={() => setBroadcastForm(prev => ({ ...prev, audience: aud.id }))}
                                            className={`px-3 py-2 rounded-xl border text-label font-bold uppercase tracking-tight transition-all flex items-center gap-1.5
                                                ${broadcastForm.audience === aud.id
                                                    ? 'bg-orange-500 border-orange-600 text-white shadow-lg'
                                                    : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}
                                        >
                                            <aud.icon size={12} />
                                            {aud.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Stylized Message Editor */}
                            <div className="space-y-3">
                                <label className="text-label font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Filter size={12} /> Payload Message
                                </label>
                                <div className="relative group">
                                    <textarea
                                        value={broadcastForm.text}
                                        onChange={(e) => setBroadcastForm(prev => ({ ...prev, text: e.target.value }))}
                                        placeholder="Message to your fleet..."
                                        className="w-full h-32 p-4 bg-black/20 border border-white/5 rounded-3xl text-sm font-medium text-slate-100 placeholder:text-slate-600 focus:border-orange-500/50 outline-none transition-all resize-none shadow-inner"
                                    />
                                    <div className="absolute bottom-4 right-4 text-label font-mono text-slate-600 font-bold uppercase pr-2 border-r border-white/10">
                                        {broadcastForm.text.length} chars
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-label text-slate-500 font-bold uppercase italic opacity-60 px-2">
                                    <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                    HTML tags supported (b, i, u, a). Use with caution.
                                </div>
                            </div>

                            <button
                                onClick={handleCreateBroadcast}
                                disabled={isBroadcasting || !broadcastForm.text.trim()}
                                className={`w-full py-4 rounded-3xl bg-linear-to-r from-orange-500 to-rose-600 text-white text-xs font-bold uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale`}
                            >
                                {isBroadcasting ? <RefreshCw className="animate-spin" size={16} /> : <PlayCircle size={16} />}
                                Launch Broadcast Campaign
                            </button>
                        </div>

                        {/* Active Operations Center */}
                        {activeBroadcasts.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-label font-bold text-slate-400 uppercase tracking-widest px-2">Active Operations</h4>
                                <div className="space-y-2">
                                    {activeBroadcasts.map(b => {
                                        const progress = b.total_targets > 0 ? (b.sent_count / b.total_targets) * 100 : 0;
                                        return (
                                            <div key={b.id} className="p-4 rounded-[1.75rem] glass-panel-premium border border-white/5 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center relative">
                                                            <Megaphone className="text-orange-500 animate-pulse" size={14} />
                                                        </div>
                                                        <div>
                                                            <div className="text-label font-bold text-slate-100 uppercase tracking-widest">
                                                                Operation #{b.id}
                                                            </div>
                                                            <div className="text-label text-slate-500 font-bold uppercase">
                                                                Audience: {b.audience_type}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCancelBroadcast(b.id)}
                                                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all active:scale-90"
                                                    >
                                                        <StopCircle size={14} />
                                                    </button>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-label font-bold uppercase tracking-tight">
                                                        <span className="text-orange-500">{progress.toFixed(1)}% Completed</span>
                                                        <span className="text-slate-400 font-mono tracking-tighter">{b.sent_count} / {b.total_targets}</span>
                                                    </div>
                                                    <div className="h-2 rounded-full bg-black/40 overflow-hidden p-0.5 border border-white/5">
                                                        <motion.div
                                                            className="h-full bg-linear-to-r from-orange-500 via-orange-400 to-yellow-400 rounded-full"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Mission History */}
                        <div className="space-y-3">
                            <h4 className="text-label font-bold text-slate-400 uppercase tracking-widest px-2">Campaign History</h4>
                            <div className="rounded-[2.5rem] glass-panel-premium border border-white/5 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-white/5 bg-white/5">
                                                <th className="px-6 py-4 text-label font-bold text-slate-500 uppercase tracking-widest">Date</th>
                                                <th className="px-6 py-4 text-label font-bold text-slate-500 uppercase tracking-widest">Message Snapshot</th>
                                                <th className="px-6 py-4 text-label font-bold text-slate-500 uppercase tracking-widest text-center">Outcome</th>
                                                <th className="px-6 py-4 text-label font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {broadcasts.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-label font-bold text-slate-500 uppercase tracking-[0.2em] italic">Nexus History Empty</td>
                                                </tr>
                                            ) : (
                                                broadcasts.map(b => (
                                                    <tr key={b.id} className="group hover:bg-white/5 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="text-label font-bold text-slate-300 uppercase whitespace-nowrap">
                                                                {new Date(b.created_at).toLocaleDateString()}
                                                            </div>
                                                            <div className="text-label font-bold text-slate-500 uppercase font-mono">
                                                                {new Date(b.created_at).toLocaleTimeString()}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 max-w-[200px]">
                                                            <div className="text-label font-medium text-slate-400 truncate group-hover:text-slate-200 transition-colors">
                                                                {b.message_text}
                                                            </div>
                                                            <div className="text-label font-bold text-indigo-500 uppercase tracking-tight mt-1">
                                                                Targets: {b.audience_type}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="text-label font-bold text-slate-200 font-mono tracking-tighter">
                                                                {b.sent_count} <span className="text-label opacity-40">OK</span>
                                                            </div>
                                                            {b.failed_count > 0 && (
                                                                <div className="text-label font-bold text-rose-500 font-mono tracking-tighter">
                                                                    {b.failed_count} <span className="text-label opacity-60 uppercase">Err</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-2 py-0.5 rounded-lg text-label font-bold uppercase tracking-widest
                                                                ${b.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                                                                    b.status === 'cancelled' ? 'bg-rose-500/10 text-rose-500' :
                                                                        'bg-blue-500/10 text-blue-500'}`}>
                                                                {b.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {viewMode === 'kpis' && (
                    <motion.div
                        key="kpis"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                            <Activity className="text-blue-500 shrink-0 mt-0.5" size={16} />
                            <div>
                                <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest">Command Center KPIs</h3>
                                <p className="text-label text-slate-500 font-medium mt-1">Real-time overview of primary growth, retention, and engagement metrics. Use these indicators to assess platform health, user adoption speed, and viral intelligence (K-Factor).</p>
                            </div>
                        </div>

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
                                    <div className="text-label font-bold uppercase opacity-60">Total Partners</div>
                                    <div className="text-3xl font-bold">{stats?.events.total_partners}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 relative z-10 pt-4 border-t border-white/10">
                                <div>
                                    <div className="text-label font-bold uppercase opacity-60 flex items-center gap-1">
                                        <Zap size={10} /> PRO
                                    </div>
                                    <div className="text-lg font-bold">{stats?.events.total_pro}</div>
                                </div>
                                <div>
                                    <div className="text-label font-bold uppercase opacity-60 flex items-center gap-1">
                                        <Users size={10} /> 24h
                                    </div>
                                    <div className="text-lg font-bold">{stats?.events.active_24h}</div>
                                </div>
                                <div>
                                    <div className="text-label font-bold uppercase opacity-60 flex items-center gap-1">
                                        Revenue
                                    </div>
                                    <div className="text-lg font-bold">${stats?.financials.total_revenue || 0}</div>
                                </div>
                            </div>
                        </div>

                        {/* Core KPI Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-1">
                                <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Engagement</div>
                                <div className="text-sm font-bold text-blue-500">{stats?.kpis.engagement_rate}%</div>
                            </div>
                            <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-1">
                                <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Conv. Rate</div>
                                <div className="text-sm font-bold text-emerald-500">{stats?.kpis.conversion_rate}%</div>
                            </div>
                            <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-1">
                                <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">ARPU</div>
                                <div className="text-sm font-bold text-violet-500">${stats?.kpis.arpu}</div>
                            </div>
                        </div>

                        {/* Viral Intelligence Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Viral K-Factor</div>
                                    <div className="p-1 bg-indigo-500/10 rounded-lg text-indigo-500">
                                        <Zap size={10} />
                                    </div>
                                </div>
                                <div className="text-lg font-bold text-indigo-500">{stats?.kpis.k_factor}</div>
                                <div className="text-label font-bold text-slate-500 uppercase">Avg Referrals per User</div>
                            </div>
                            <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Ref. Participation</div>
                                    <div className="p-1 bg-pink-500/10 rounded-lg text-pink-500">
                                        <Users size={10} />
                                    </div>
                                </div>
                                <div className="text-lg font-bold text-pink-500">{stats?.kpis.ref_participation}%</div>
                                <div className="text-label font-bold text-slate-500 uppercase">Active referrers share</div>
                            </div>
                            <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Network Density</div>
                                    <div className="p-1 bg-emerald-500/10 rounded-lg text-emerald-500">
                                        <Layers size={10} />
                                    </div>
                                </div>
                                <div className="text-lg font-bold text-emerald-500">
                                    {typeof stats?.kpis.avg_depth === 'number' ? stats.kpis.avg_depth.toFixed(2) : '1.00'}
                                    <span className="text-label opacity-40 ml-1 font-bold">Gen</span>
                                </div>
                                <div className="text-label font-bold text-slate-500 uppercase">Avg Generation Depth</div>
                            </div>
                        </div>

                        {/* Retention Benchmarks Row */}
                        <div className="grid grid-cols-4 gap-3">
                            <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-1">
                                <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Ret (7d)</div>
                                <div className="text-sm font-bold text-amber-500">{stats?.kpis.retention_7d || 0}%</div>
                            </div>
                            <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-1">
                                <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Ret (30d)</div>
                                <div className={`text-sm font-bold ${stats?.kpis.retention_30d === 100 ? 'text-slate-500' : 'text-slate-300'}`}>{stats?.kpis.retention_30d || 0}%</div>
                            </div>
                            <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-1">
                                <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Ret (90d)</div>
                                <div className={`text-sm font-bold ${stats?.kpis.retention_90d === 100 ? 'text-slate-500' : 'text-slate-300'}`}>{stats?.kpis.retention_90d || 0}%</div>
                            </div>
                            <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-1">
                                <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Ret (180d)</div>
                                <div className={`text-sm font-bold ${stats?.kpis.retention_180d === 100 ? 'text-slate-500' : 'text-slate-300'}`}>{stats?.kpis.retention_180d || 0}%</div>
                            </div>
                        </div>

                        {/* System Efficiency & Adoption */}
                        {stats?.performance && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Manual Approval Time</div>
                                        <div className="p-1 bg-amber-500/10 rounded-lg text-amber-500">
                                            <Clock size={10} />
                                        </div>
                                    </div>
                                    <div className="text-lg font-bold text-amber-500">{stats.performance.avg_manual_approval_min} min</div>
                                    <div className="text-label font-bold text-slate-500 uppercase">Avg response efficiency</div>
                                </div>
                                <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Slot Adoption (FOMO)</div>
                                        <div className="p-1 bg-blue-500/10 rounded-lg text-blue-500">
                                            <Zap size={10} />
                                        </div>
                                    </div>
                                    <div className="text-lg font-bold text-blue-500">
                                        {stats.performance.pro_slots_display}
                                        <span className="text-label text-slate-500 font-bold ml-1.5 opacity-60">/ {stats.performance.pro_slots_actual} REAL</span>
                                    </div>
                                    <div className="text-label font-bold text-slate-500 uppercase">Calculated Traction Base</div>
                                </div>
                            </div>
                        )}

                        {/* Task Completion Breakdown */}
                        <div className="p-6 rounded-2xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="text-label font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Task Performance Breakdown</h2>
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                    <Zap size={14} className="text-blue-500 animate-pulse" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                {Object.entries(stats?.tasks || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([taskId, count]) => (
                                    <div key={taskId} className="group flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-label font-bold text-slate-700 dark:text-slate-100 uppercase tracking-tight">
                                                {taskId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                            </div>
                                            <div className="text-label font-bold text-blue-500 dark:text-blue-400">
                                                {count} <span className="text-label opacity-60 ml-0.5">COMPLETED</span>
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
                        <div className="p-6 rounded-2xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="text-label font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Elite Earners Leaderboard</h2>
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                    <TrendingUp size={14} className="text-blue-500" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                {stats?.top_partners?.map((p, idx) => (
                                    <div key={p.telegram_id} className="flex items-center justify-between group p-3 rounded-2xl hover:bg-white/5 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-label font-bold text-slate-500 dark:text-slate-400 border border-black/5 dark:border-white/5">
                                                #{idx + 1}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 italic transition-colors group-hover:text-blue-500">
                                                    {p.username ? `@${p.username}` : `Partner #${p.telegram_id.toString().slice(-4)}`}
                                                </div>
                                                <div className="text-label font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                                                    MASTER HUB PARTNER
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1 justify-end">
                                                <span className="text-label opacity-60 font-bold">$</span>
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
                                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">
                                            <TrendingUp size={14} />
                                        </div>
                                        Network Growth Matrix
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1 w-8 bg-blue-500 rounded-full" />
                                        <p className="text-label font-bold text-blue-500/60 uppercase tracking-widest">14-Day Tactical Trajectory</p>
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
                                    className="group relative p-6 rounded-2xl premium-stat-card bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/10 space-y-4 overflow-hidden"
                                >
                                    {data.percent_change >= 0 && (
                                        <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/5 blur-3xl group-hover:bg-emerald-500/10 transition-all duration-500" />
                                    )}
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${data.percent_change >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                <Activity size={12} />
                                            </div>
                                            <span className="text-label font-bold uppercase text-slate-400 tracking-widest">{period}</span>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-label font-bold flex items-center gap-1 shadow-sm ${data.percent_change >= 0
                                            ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20'
                                            : 'bg-red-500/10 text-red-500 ring-1 ring-red-500/20'
                                            }`}>
                                            {data.percent_change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                            {Math.abs(data.percent_change)}%
                                        </div>
                                    </div>
                                    <div className="space-y-1 relative z-10">
                                        <div className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                                            {data.count}
                                        </div>
                                        <div className="text-label font-bold text-slate-400 uppercase tracking-[0.2em]">Acquired Units</div>
                                    </div>
                                    <div className="flex items-center justify-between relative z-10 pt-4 border-t border-black/5 dark:border-white/5">
                                        <div className="text-label text-slate-500 font-bold uppercase tracking-widest">Previous Era</div>
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{data.previous}</div>
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
                        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3">
                            <Wallet className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                            <div>
                                <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Financial Intelligence</h3>
                                <p className="text-label text-slate-500 font-medium mt-1">Deep dive into gross revenue, net profit margin, and exact distribution logic across the 20-level commission array. Monitor fiat (USDT) vs crypto (TON) asset inflow.</p>
                            </div>
                        </div>

                        {/* Total Clear Income */}
                        <div className="p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none text-slate-900 dark:text-white">
                                <Wallet size={120} />
                            </div>
                            <div className="space-y-1 relative z-10">
                                <span className="text-blue-600 dark:text-blue-400 text-label font-bold uppercase tracking-widest">Profit Income to Company (Net)</span>
                                <div className="flex items-end justify-between">
                                    <div className="text-4xl font-bold text-slate-900 dark:text-white flex items-baseline gap-1">
                                        <span className="text-2xl text-blue-500 font-bold">$</span>
                                        {stats?.financials.net_profit}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-label font-bold text-slate-500 uppercase">Gross Margin</div>
                                        <div className="text-xl font-bold text-emerald-500">{stats?.financials.gross_margin}%</div>
                                    </div>
                                </div>
                                <p className="text-slate-500 dark:text-slate-500 text-label font-bold">Total revenue retained by the company</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 relative z-10 pt-4 border-t border-slate-200 dark:border-white/5">
                                <div>
                                    <div className="text-slate-500 text-label font-bold uppercase">Paid to Referral Network (Actual)</div>
                                    <div className="text-lg font-bold text-slate-900 dark:text-white">${stats?.financials.total_commissions}</div>
                                    <div className="text-label text-blue-600 dark:text-blue-400 font-bold">{stats?.financials.actual_payout_ratio}% of Revenue</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 text-label font-bold uppercase">Referral Network Target Split (56/44)</div>
                                    <div className="text-lg font-bold text-slate-400 dark:text-slate-400">{stats?.financials.theoretical_payout_ratio}%</div>
                                    <div className="text-label text-slate-400 dark:text-slate-600 font-bold italic">Max possible distribution</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 relative z-10 pt-4 border-t border-slate-200 dark:border-white/5">
                                <div>
                                    <div className="text-slate-500 text-label font-bold uppercase">Gross Revenue (Total)</div>
                                    <div className="text-lg font-bold text-slate-900 dark:text-white">${stats?.financials.total_revenue}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500 text-label font-bold uppercase">Revenue USDT / TON</div>
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
                                                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                    @{sale.username || sale.telegram_id}
                                                </div>
                                                <div className="text-label font-bold text-slate-500 uppercase flex items-center gap-1">
                                                    {new Date(sale.created_at).toLocaleDateString()} · {sale.currency}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <div className="text-sm font-bold text-emerald-500">+${sale.amount}</div>
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
                                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">20-Level Comission Split</h2>
                                <PieChart size={14} className="text-slate-500" />
                            </div>
                            <div className="space-y-2">
                                {stats?.financials.commissions_breakdown.map((line) => (
                                    <div key={line.level} className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xs font-bold text-slate-500">
                                                L{line.level}
                                            </div>
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Level {line.level} Partners</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-100">${line.amount}</span>
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
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                            <ShieldCheck className="text-amber-500 shrink-0 mt-0.5" size={16} />
                            <div className="flex-1 space-y-2">
                                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest">Manual TX Verification Hub</h3>
                                <p className="text-label text-slate-500 font-medium leading-relaxed">Cross-reference decentralized network transactions (TON/TRON). Approval automatically distributes the 20-level commissions to upper referrers. Rejection dispatches a Telegram notice to the user. Ensure the Amount and Destination Wallet match before confirming.</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Pending Review ({transactions.length})</h2>
                            <div className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-label font-bold uppercase">Action Required</div>
                        </div>

                        <AnimatePresence mode="popLayout">
                            {transactions.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-12 text-center space-y-3 glass-panel-premium rounded-2xl"
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
                                        className="p-5 rounded-2xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-4 relative overflow-hidden"
                                    >
                                        <div className="flex items-start justify-between relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                                    <Clock className="text-amber-500" size={24} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                                        {tx.amount} {tx.currency}
                                                        <span className="text-label bg-white/5 px-2 py-0.5 rounded-full text-slate-500 font-bold">
                                                            {tx.network}
                                                        </span>
                                                    </div>
                                                    <div className="text-label font-bold text-slate-500 flex items-center gap-1">
                                                        <User size={10} />
                                                        Partner ID: {tx.partner_id}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-label font-bold text-slate-500 dark:text-slate-400 uppercase">
                                                    {tx.created_at ? new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-2xl bg-black/20 font-mono text-label break-all flex items-start justify-between gap-3 border border-black/5 dark:border-white/5">
                                            <span className="text-slate-500 shrink-0 uppercase font-bold">TX Hash:</span>
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
                                                className="py-3.5 rounded-[1.25rem] bg-white/5 text-slate-500 font-bold text-xs uppercase tracking-widest active:scale-95 transition-all"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleApprove(tx.id)}
                                                disabled={approvingIds.has(tx.id)}
                                                className="py-3.5 rounded-[1.25rem] bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
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
                        <div className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/10 flex items-start gap-3">
                            <Layers className="text-violet-500 shrink-0 mt-0.5" size={16} />
                            <div>
                                <h3 className="text-xs font-bold text-violet-500 uppercase tracking-widest">Network Matrix Topography</h3>
                                <p className="text-label text-slate-500 font-medium mt-1">Visualize and inspect the exact dimensional shape of the 20-generation lineage matrix. Drill into any generation depth to audit individual partner structures.</p>
                            </div>
                        </div>

                        {/* Tree Distribution Grid */}
                        <div className="space-y-3">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-1 flex items-center gap-2">
                                <Layers size={14} /> Network Generation Tree
                            </h2>
                            <div className="grid grid-cols-3 gap-2">
                                {Array.from({ length: 20 }).map((_, i) => {
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
                                            <div className={`text-label font-bold uppercase ${isSelected ? 'opacity-80' : 'text-slate-400'}`}>Gen {depth}</div>
                                            <div className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>{count}</div>
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
                                    <span className="text-label text-slate-500 font-bold uppercase">Showing Top 100</span>
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
                                                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition-colors">
                                                            {p.username ? `@${p.username}` : `${p.first_name || 'Partner'}`}
                                                        </div>
                                                        <div className="text-label font-bold text-slate-500 uppercase">
                                                            ID: {p.telegram_id} {!(p.is_pro && (p.subscription_plan || "").includes('PLUS')) && `· ${p.level} Lvl`}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-bold text-blue-500">{p.xp} XP</div>
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
                                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">System Maintenance</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-xs">Critical tools for database consistency and performance optimization.</p>
                            </div>

                            {/* System Health Cards */}
                            <div className="grid grid-cols-2 gap-3 relative z-10">
                                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm space-y-2">
                                    <div className="text-label font-bold text-slate-500 uppercase">DB Latency</div>
                                    <div className={`text-lg font-bold ${health && health.latency_ms > 200 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                        {health ? `${health.latency_ms}ms` : '--'}
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm space-y-2">
                                    <div className="space-y-1">
                                        <div className="text-label font-bold text-slate-500 uppercase">Orphaned Partners</div>
                                        <div className={`text-xl font-bold ${stats?.events.audit?.orphaned_count === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {stats?.events.audit?.orphaned_count ?? 0}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5 relative z-10">
                                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2 text-amber-500 font-bold text-label uppercase tracking-widest">
                                        <AlertTriangle size={14} />
                                        Data Consistency Fix
                                    </div>
                                    <p className="text-label text-slate-500 font-medium">
                                        Recalculates all referral counts, 20-level lineage paths, and caches depth for every partner.
                                        Optimized batch execution.
                                    </p>
                                    <button
                                        onClick={handleRecalculate}
                                        disabled={isRefreshing}
                                        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-label font-bold uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20"
                                    >
                                        {isRefreshing ? 'Processing...' : 'Recalculate Network Stats'}
                                    </button>
                                </div>

                                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2 text-blue-500 font-bold text-label uppercase tracking-widest">
                                        <RefreshCw size={14} />
                                        System Cache Flush
                                    </div>
                                    <p className="text-label text-slate-500 font-medium">
                                        Flushes Redis cache for TON prices, leaderboards and dashboard KPIs.
                                        Use this after manual DB changes.
                                    </p>
                                    <button
                                        onClick={handleClearCache}
                                        disabled={isRefreshing}
                                        className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-label font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        {isRefreshing ? 'Clearing...' : 'Flush System Cache'}
                                    </button>
                                </div>

                                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-blue-500 font-bold text-label uppercase tracking-widest">
                                            <ShieldCheck size={14} />
                                            Economy Integrity Audit
                                        </div>
                                        <div className="text-label font-bold text-slate-500">
                                            {economyAudit ? (economyAudit.status === 'healthy' ? <span className="text-emerald-500">HEALTHY</span> : <span className="text-red-500">ANOMALIES</span>) : 'NOT RUN'}
                                        </div>
                                    </div>
                                    {economyAudit && (
                                        <div className="grid grid-cols-2 gap-2 pb-2">
                                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
                                                <div className="text-label text-slate-500 font-bold uppercase">Checked</div>
                                                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{economyAudit.total_checked}</div>
                                            </div>
                                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
                                                <div className="text-label text-slate-500 font-bold uppercase">Discrepancies</div>
                                                <div className={`text-xs font-bold ${economyAudit.discrepancies_found === 0 ? 'text-emerald-500' : 'text-red-500'}`}>{economyAudit.discrepancies_found}</div>
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-label text-slate-500 font-medium">
                                        Verifies economic integrity by checking if current XP and USDT Balance match the sum of their transactions/earnings.
                                    </p>
                                    <button
                                        onClick={handleEconomyAudit}
                                        disabled={isEconomyAuditing}
                                        className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-label font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        {isEconomyAuditing ? 'Auditing Economy...' : 'Run Economy Audit'}
                                    </button>
                                </div>

                                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-violet-500 font-bold text-label uppercase tracking-widest">
                                            <Layers size={14} />
                                            Network Tree Integrity Audit
                                        </div>
                                        <div className="text-label font-bold text-slate-500">
                                            {treeAudit ? (treeAudit.status === 'healthy' ? <span className="text-emerald-500">HEALTHY</span> : <span className="text-red-500">ANOMALIES</span>) : 'NOT RUN'}
                                        </div>
                                    </div>
                                    {treeAudit && (
                                        <div className="grid grid-cols-2 gap-2 pb-2">
                                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
                                                <div className="text-label text-slate-500 font-bold uppercase">Checked</div>
                                                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{treeAudit.total_checked}</div>
                                            </div>
                                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
                                                <div className="text-label text-slate-500 font-bold uppercase">Anomalies</div>
                                                <div className={`text-xs font-bold ${treeAudit.anomaly_count === 0 ? 'text-emerald-500' : 'text-red-500'}`}>{treeAudit.anomaly_count}</div>
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-label text-slate-500 font-medium">
                                        Validates the integrity of the materialized path and depth for the entire 20-level network matrix.
                                    </p>
                                    <button
                                        onClick={handleTreeAudit}
                                        disabled={isTreeAuditing}
                                        className="w-full py-3 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white text-label font-bold uppercase tracking-widest transition-all shadow-lg shadow-violet-500/20"
                                    >
                                        {isTreeAuditing ? 'Auditing Network...' : 'Run Tree Integrity Audit'}
                                    </button>
                                </div>

                                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-emerald-500 font-bold text-label uppercase tracking-widest">
                                            <Bell size={14} />
                                            Notification System
                                        </div>
                                        <div className="text-label font-bold text-slate-500">
                                            {notifStats ? ((notifStats.pending > 10 || notifStats.failed > 50) ? <span className="text-amber-500">CONGESTED</span> : <span className="text-emerald-500">HEALTHY</span>) : 'Checking...'}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
                                            <div className="text-label text-slate-500 font-bold uppercase">Sent</div>
                                            <div className="text-xs font-bold text-emerald-500">{notifStats?.sent ?? 0}</div>
                                        </div>
                                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
                                            <div className="text-label text-slate-500 font-bold uppercase">Pending</div>
                                            <div className="text-xs font-bold text-amber-500">{notifStats?.pending ?? 0}</div>
                                        </div>
                                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
                                            <div className="text-label text-slate-500 font-bold uppercase">Failed</div>
                                            <div className="text-xs font-bold text-red-500">{notifStats?.failed ?? 0}</div>
                                        </div>
                                    </div>
                                    <p className="text-label text-slate-500 font-medium">
                                        Monitor Global Notification System health. If "Pending" is high, trigger a manual retry cycle.
                                    </p>
                                    <button
                                        onClick={handleRetryNotifications}
                                        disabled={isRefreshing || (notifStats?.pending ?? 0) === 0}
                                        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-label font-bold uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
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
                        <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3 mb-6">
                            <Search className="text-indigo-500 shrink-0 mt-0.5" size={16} />
                            <div>
                                <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Global Partner Database</h3>
                                <p className="text-label text-slate-500 font-medium mt-1">Look up and analyze the dossier of any partner traversing the system. Used for manual support requests or direct metric mutation (adjusting XP/PRO status).</p>
                            </div>
                        </div>

                        <div className="p-5 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-4">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Search Engine Target</h2>
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
                                                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition-colors">@{p.username || p.telegram_id}</div>
                                                <div className="text-label text-slate-500 font-bold uppercase">ID: {p.telegram_id}</div>
                                            </div>
                                            <div className={`px-2 py-0.5 rounded-lg text-label font-bold uppercase ${p.is_pro ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-500/20 text-slate-500'}`}>
                                                {p.is_pro ? 'PRO MEMBER' : 'FREE USER'}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                                            {!(p.is_pro && (p.subscription_plan || "").includes('PLUS')) && (
                                                <div className="text-center">
                                                    <div className="text-label text-slate-500 font-bold uppercase">Level</div>
                                                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{p.level}</div>
                                                </div>
                                            )}
                                            <div className="text-center">
                                                <div className="text-label text-slate-500 font-bold uppercase">Network</div>
                                                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{p.referral_count}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-label text-slate-500 font-bold uppercase">XP</div>
                                                <div className="text-xs font-bold text-blue-500">{p.xp}</div>
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
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 italic">
                                                    @{partnerDetails.username || 'Partner'}
                                                </h3>
                                                <p className="text-label font-bold text-slate-500 uppercase tracking-widest">
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
                                        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-1">
                                            <div className="text-label font-bold text-slate-500 uppercase">Account Rank</div>
                                            <div className="text-xl font-bold text-blue-500">
                                                {(partnerDetails.is_pro && (partnerDetails.subscription_plan || "").includes('PLUS')) ? 'PRO+' : `Level ${partnerDetails.level}`}
                                            </div>
                                            <div className="text-label font-bold text-slate-400 uppercase">{partnerDetails.xp} Total XP</div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-1">
                                            <div className="text-label font-bold text-slate-500 uppercase">PRO Status</div>
                                            <div className={`text-xl font-bold ${partnerDetails.is_pro ? 'text-amber-500' : 'text-slate-400'}`}>
                                                {partnerDetails.is_pro ? 'ACTIVE' : 'INACTIVE'}
                                            </div>
                                            <div className="text-label font-bold text-slate-400 uppercase">{partnerDetails.pro_tokens} Tokens</div>
                                        </div>
                                    </div>

                                    {/* Admin Actions */}
                                    <div className="space-y-3">
                                        <h4 className="text-label font-bold uppercase text-slate-500 tracking-widest px-1">Administrative Actions</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => updatePartner({ is_pro: !partnerDetails.is_pro })}
                                                className={`py-4 rounded-2xl font-bold text-label uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${partnerDetails.is_pro
                                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                    : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                                    }`}
                                            >
                                                {partnerDetails.is_pro ? <Trash size={14} /> : <Zap size={14} />}
                                                {partnerDetails.is_pro ? t('admin_portal.actions.revoke_pro') : t('admin_portal.actions.grant_pro')}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const xp = prompt(t('admin_portal.actions.enter_xp_prompt'), '500');
                                                    if (xp) updatePartner({ xp: parseFloat(xp) });
                                                }}
                                                className="py-4 rounded-2xl bg-blue-500 text-white font-bold text-label uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                            >
                                                <Plus size={14} /> {t('admin_portal.actions.adjust_xp')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Stats List */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                                            <div className="flex items-center gap-3">
                                                <Users size={18} className="text-slate-400" />
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t('admin_portal.stats.direct_referrals')}</span>
                                            </div>
                                            <span className="text-sm font-bold">{partnerDetails.referral_count}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle size={18} className="text-slate-400" />
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t('admin_portal.stats.tasks_completed')}</span>
                                            </div>
                                            <span className="text-sm font-bold">{partnerDetails.tasks?.length || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                                            <div className="flex items-center gap-3">
                                                <Wallet size={18} className="text-slate-400" />
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t('admin_portal.stats.current_balance')}</span>
                                            </div>
                                            <span className="text-sm font-bold text-emerald-500">${partnerDetails.balance}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ─── EVENT LEDGER TAB ─────────────────────────────────── */}
            <AnimatePresence mode="wait">
                {viewMode === 'ledger' && (() => {
                    const EVENT_TYPES = ['ALL', 'COMMISSION', 'XP_AWARD', 'NOTIFICATION', 'REFERRAL', 'PAYMENT', 'RECONCILIATION', 'SYSTEM', 'MISC'];
                    const typeConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
                        COMMISSION: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: <Wallet size={11} /> },
                        XP_AWARD: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: <Zap size={11} /> },
                        NOTIFICATION: { color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', icon: <Bell size={11} /> },
                        REFERRAL: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: <GitBranch size={11} /> },
                        PAYMENT: { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', icon: <CreditCard size={11} /> },
                        RECONCILIATION: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: <AlertOctagon size={11} /> },
                        SYSTEM: { color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', icon: <Cpu size={11} /> },
                        MISC: { color: 'text-slate-500', bg: 'bg-slate-800/30 border-slate-700/20', icon: <Database size={11} /> },
                    };
                    const getType = (t: string) => typeConfig[t] || typeConfig['MISC'];
                    const fmt = (dt: string) => dt ? new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

                    return (
                        <motion.div key="ledger" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                            {/* Header */}
                            <div className="p-4 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 shadow-2xl shadow-emerald-500/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><BookOpen size={80} /></div>
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                            <BookOpen className="text-emerald-400" size={18} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white tracking-tight">{t('admin_portal.event_ledger')}</div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('admin_portal.immutable_audit')} · {t('admin_portal.events_loaded', { count: ledgerEvents.length })}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={fetchLedgerEvents}
                                        className={`w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all ${isLedgerLoading ? 'animate-spin' : ''}`}
                                    >
                                        <RefreshCw size={14} className="text-emerald-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Filters Row */}
                            <div className="space-y-2">
                                <div className="flex gap-2 p-1 bg-white/5 rounded-2xl overflow-x-auto scrollbar-none">
                                    {EVENT_TYPES.map(t_val => (
                                        <button
                                            key={t_val}
                                            onClick={() => { setLedgerFilter(t_val); setLedgerNotifHistory(null); }}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all whitespace-nowrap flex items-center gap-1.5 border ${ledgerFilter === t_val
                                                ? (t_val === 'ALL' ? 'bg-white/10 border-white/20 text-white shadow-lg' : `${getType(t_val).bg} ${getType(t_val).color} shadow-lg`)
                                                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                                        >
                                            {t_val !== 'ALL' && <span className="opacity-80 group-hover:opacity-100">{getType(t_val).icon}</span>}
                                            {t(`admin_portal.event_types.${t_val.toLowerCase()}`)}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative flex-1 group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors">
                                            <Search size={12} />
                                        </div>
                                        <input
                                            type="text"
                                            value={ledgerPartnerId}
                                            onChange={e => setLedgerPartnerId(e.target.value)}
                                            placeholder={t('admin_portal.filter_partner_placeholder')}
                                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40 focus:bg-white/10 transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={fetchLedgerEvents}
                                        className="h-9 w-12 flex items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all"
                                    >
                                        <Filter size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Event Feed */}
                            <div className="rounded-3xl bg-slate-900/60 border border-white/5 overflow-hidden">
                                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                                    <span className="text-label font-bold text-slate-500 uppercase tracking-widest">{t('admin_portal.latest_events')}</span>
                                    {isLedgerLoading && <span className="text-label text-emerald-400 animate-pulse">{t('admin_portal.loading')}</span>}
                                </div>
                                <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                                    {ledgerEvents.length === 0 && !isLedgerLoading && (
                                        <div className="p-8 text-center text-slate-600 text-xs font-bold uppercase tracking-[0.2em]">{t('admin_portal.no_events')}</div>
                                    )}
                                    {ledgerEvents.map(ev => {
                                        const cfg = getType(ev.action_type || 'MISC');
                                        return (
                                            <div key={ev.id} className="px-3 py-2 hover:bg-white/5 transition-colors group">
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-0.5 px-1.5 py-0.5 rounded-lg border text-[9px] font-bold uppercase tracking-[0.1em] flex items-center gap-1 shrink-0 ${cfg.bg} ${cfg.color}`}>
                                                        {cfg.icon}
                                                        <span className="truncate max-w-[60px] sm:max-w-none">
                                                            {t(`admin_portal.event_types.${(ev.action_type || 'MISC').toLowerCase()}`)}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="text-label font-bold text-white/90 truncate">{ev.description || ev.action}</div>
                                                            <span className="text-[9px] font-bold text-slate-600 shrink-0 uppercase tracking-tighter">{fmt(ev.created_at)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-0.5">
                                                            {ev.partner_id && <span className="text-[10px] font-bold text-slate-500/80">ID#{ev.partner_id}</span>}
                                                            {ev.entity_id && (
                                                                <span className="text-[10px] font-medium text-slate-600 flex items-center gap-1">
                                                                    <GitBranch size={8} /> {ev.entity_id}
                                                                </span>
                                                            )}
                                                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Search size={10} className="text-emerald-500/50" />
                                                            </div>
                                                        </div>
                                                        {ev.details && Object.keys(ev.details).length > 0 && (
                                                            <div className="mt-1.5 hidden group-hover:flex flex-wrap gap-1">
                                                                {Object.entries(ev.details).filter(([_, v]) => v != null && v !== '').slice(0, 4).map(([k, v]) => (
                                                                    <span key={k} className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-medium text-slate-400">
                                                                        <span className="text-slate-600 lowercase">{k}:</span> {String(v).slice(0, 20)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Notification History Lookup */}
                            <div className="p-5 rounded-3xl bg-slate-900/60 border border-violet-500/20 space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Bell size={14} className="text-violet-400" />
                                    <span className="text-label font-bold text-white uppercase tracking-widest">{t('admin_portal.notif_history_title')}</span>
                                </div>
                                <p className="text-label text-slate-500">{t('admin_portal.notif_history_desc')}</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={ledgerChatId}
                                        onChange={e => setLedgerChatId(e.target.value)}
                                        placeholder={t('admin_portal.tg_chat_id_placeholder')}
                                        className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/40"
                                    />
                                    <button onClick={fetchNotifHistoryForUser} disabled={isLedgerLoading}
                                        className="px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold flex items-center gap-1.5 hover:bg-violet-500/20 transition-all">
                                        <Search size={13} /> {t('admin_portal.look_up')}
                                    </button>
                                </div>
                                {ledgerNotifHistory && (
                                    <div className="space-y-2 mt-1">
                                        <div className="text-label text-slate-500 font-medium">{ledgerNotifHistory.total} notifications found for {ledgerNotifHistory.chat_id}</div>
                                        <div className="rounded-2xl overflow-hidden border border-white/5 divide-y divide-white/5 max-h-64 overflow-y-auto">
                                            {ledgerNotifHistory.events?.map((ev: any) => (
                                                <div key={ev.id} className="px-3 py-2 flex items-start justify-between gap-2 hover:bg-white/3">
                                                    <div>
                                                        <div className="text-label font-semibold text-white/80">{ev.event_type || ev.action}</div>
                                                        <div className="text-label text-slate-600">{ev.salt} · {ev.priority}</div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                                        <span className={`px-1.5 py-0.5 rounded-md text-label font-bold uppercase ${ev.action?.includes('enqueued') ? 'bg-emerald-500/10 text-emerald-400' : ev.action?.includes('failed') ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-slate-400'}`}>
                                                            {ev.action?.replace('notification_', '') || '—'}
                                                        </span>
                                                        <span className="text-label text-slate-700">{fmt(ev.created_at)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Live Reconciliation */}
                            <div className="p-5 rounded-3xl bg-slate-900/60 border border-red-500/20 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertOctagon size={14} className="text-red-400" />
                                        <span className="text-label font-bold text-white uppercase tracking-widest">Live Reconciliation Check</span>
                                    </div>
                                    <button onClick={handleLiveReconcile} disabled={isReconciling}
                                        className={`px-4 py-2 rounded-xl text-label font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all ${isReconciling ? 'bg-red-500/5 text-red-400 animate-pulse' : 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'}`}>
                                        {isReconciling ? <><Radio size={12} className="animate-spin" /> Running…</> : <><CheckSquare size={12} /> Run Check</>}
                                    </button>
                                </div>
                                <p className="text-label text-slate-500">Cross-checks every partner's XP & USDT balance against sum of all transaction records. Flags mismatches.</p>
                                {reconcileResult && (
                                    <div className="space-y-2 mt-1">
                                        <div className={`flex items-center gap-2 text-xs font-bold ${reconcileResult.status === 'healthy' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {reconcileResult.status === 'healthy' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                                            {reconcileResult.status === 'healthy' ? `✅ All ${reconcileResult.total_checked} partners healthy — No discrepancies` : `⚠️ ${reconcileResult.discrepancies_found} discrepancies found across ${reconcileResult.total_checked} partners`}
                                        </div>
                                        {reconcileResult.flags?.length > 0 && (
                                            <div className="rounded-2xl overflow-hidden border border-red-500/10 divide-y divide-white/5 max-h-64 overflow-y-auto">
                                                {reconcileResult.flags.map((f: any, i: number) => (
                                                    <div key={i} className="px-3 py-2 flex items-center justify-between gap-2 hover:bg-white/3">
                                                        <div>
                                                            <span className="text-label font-bold text-red-400 uppercase">{f.type}</span>
                                                            <span className="text-label text-slate-500 ml-2">P#{f.partner_id} · {f.telegram_id}</span>
                                                        </div>
                                                        <span className={`text-label font-bold ${f.diff > 0 ? 'text-amber-400' : 'text-red-400'}`}>{f.diff > 0 ? '+' : ''}{f.diff}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>

        </div>
    );
};
