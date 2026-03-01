import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';
import { useSystemClock } from '../hooks/usePerformance';

// Modular Components
import { AdminDashboard } from './Admin/AdminDashboard';
import { DashboardStats, Transaction } from './Admin/types';

export const AdminPage = () => {
    useUser();
    const { t } = useTranslation('common');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [approvingIds, setApprovingIds] = useState<Set<number>>(new Set());

    // Batch Processing & Pagination
    const [selectedPayments, setSelectedPayments] = useState<Set<number>>(new Set());
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [palantirPage, setPalantirPage] = useState(0);
    const [searchPage, setSearchPage] = useState(0);
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
    const [economyAudit, setEconomyAudit] = useState<any>(null);
    const [treeAudit, setTreeAudit] = useState<any>(null);
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

    const fetchPalantirFeed = async (showLoading = false, page = palantirPage) => {
        if (showLoading) setIsRefreshing(true);
        try {
            const res = await apiClient.get(`/api/admin/palantir-feed?skip=${page * 100}&limit=100`);
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

    const handleRecalculate = async () => {
        if (!confirm('This will recalculate all referral counts and lineage. Continue?')) return;
        setIsRefreshing(true);
        try {
            await apiClient.post('/api/admin/recalculate-stats');
            alert('Recalculation complete!');
            await fetchData(true, true);
        } catch (err: any) {
            alert('Failed: ' + (err.response?.data?.detail || 'Unknown error'));
        } finally {
            setIsRefreshing(false);
        }
    };

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
        if (!confirm('Are you sure you want to reject this transaction?')) return;
        try {
            await apiClient.post(`/api/admin/reject-payment/${txId}`);
            await fetchData(true);
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Rejection failed');
        }
    };

    const handleBatchApprove = async () => {
        if (selectedPayments.size === 0) return;
        setIsBatchProcessing(true);
        try {
            await apiClient.post(`/api/admin/approve-payments/batch`, { transaction_ids: Array.from(selectedPayments) });
            setSelectedPayments(new Set());
            await fetchData(true);
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Batch approval failed');
        } finally {
            setIsBatchProcessing(false);
        }
    };

    const handleBatchReject = async () => {
        if (selectedPayments.size === 0) return;
        if (!confirm(`Reject ${selectedPayments.size} transactions?`)) return;
        setIsBatchProcessing(true);
        try {
            await apiClient.post(`/api/admin/reject-payments/batch`, { transaction_ids: Array.from(selectedPayments) });
            setSelectedPayments(new Set());
            await fetchData(true);
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Batch rejection failed');
        } finally {
            setIsBatchProcessing(false);
        }
    };

    const handleSearch = async (e?: React.FormEvent, page = 0) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await apiClient.get(`/api/admin/search-partners?query=${encodeURIComponent(searchQuery)}&skip=${page * 20}&limit=20`);
            setSearchResults(res.data);
            setSearchPage(page);
        } catch (err: any) {
            console.error('[Admin] Search failed:', err);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        fetchData(false, true); // Force refresh on initial mount
    }, []);

    const tick = useSystemClock();

    useEffect(() => {
        if (viewMode === 'maintenance' && tick % 60 === 0) fetchNotifStats();
        if (viewMode === 'palantir' && tick % 8 === 0) {
            fetchPalantirFeed();
            fetchNotificationsHealth();
        }
        if (viewMode === 'nexus' && tick % 3 === 0) fetchBroadcasts();
        if (['kpis', 'financials', 'payments'].includes(viewMode) && tick % 60 === 0) fetchData(true, false);
    }, [tick, viewMode]);

    useEffect(() => {
        if (viewMode === 'maintenance') fetchNotifStats();
        if (viewMode === 'palantir') {
            fetchPalantirFeed(true);
            fetchNotificationsHealth();
            setIsPalantirPolling(true);
        } else if (viewMode === 'nexus') {
            fetchBroadcasts();
            setIsPalantirPolling(false);
        } else if (viewMode === 'ledger') {
            fetchLedgerEvents();
            setIsPalantirPolling(false);
        } else if (viewMode === 'network') {
            fetchNetworkStats();
            setIsPalantirPolling(false);
        } else if (['kpis', 'financials', 'payments'].includes(viewMode)) {
            fetchData(true, true); // Force refresh when switching to these tabs
            setIsPalantirPolling(false);
        } else {
            setIsPalantirPolling(false);
        }
    }, [viewMode, fetchLedgerEvents]);

    return (
        <AdminDashboard
            stats={stats}
            transactions={transactions}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            error={error}
            viewMode={viewMode}
            setViewMode={setViewMode}
            fetchData={fetchData}
            handleRecalculate={handleRecalculate}
            handleClearCache={handleClearCache}
            t={t}
            kpiProps={{ stats }}
            financialProps={{ stats }}
            paymentProps={{
                transactions,
                selectedPayments,
                isBatchProcessing,
                approvingIds,
                togglePaymentSelection: (id: number) => setSelectedPayments(prev => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                }),
                toggleAllPayments: () => {
                    if (selectedPayments.size === transactions.length) setSelectedPayments(new Set());
                    else setSelectedPayments(new Set(transactions.map(t => t.id)));
                },
                handleApprove,
                handleReject,
                handleBatchApprove,
                handleBatchReject
            }}
            networkProps={{
                networkStats,
                networkMembers,
                selectedNetworkDepth,
                fetchNetworkMembers,
                fetchPartnerDetails
            }}
            searchProps={{
                searchId: searchQuery,
                setSearchId: setSearchQuery,
                handleSearch,
                isSearching,
                searchResults,
                fetchPartnerDetails
            }}
            maintenanceProps={{
                health,
                stats,
                isRefreshing,
                isEconomyAuditing,
                isTreeAuditing,
                economyAudit,
                treeAudit,
                notifStats,
                handleRecalculate,
                handleClearCache,
                handleEconomyAudit,
                handleTreeAudit,
                handleRetryNotifications
            }}
            palantirProps={{
                palantirFeed,
                palantirPage,
                isPalantirPolling,
                isRefreshing,
                notificationsHealth,
                setPalantirPage,
                fetchPalantirFeed,
                setSelectedPartnerId
            }}
            nexusProps={{
                broadcastForm,
                setBroadcastForm,
                isBroadcasting,
                handleCreateBroadcast,
                handleCancelBroadcast,
                activeBroadcasts,
                broadcasts
            }}
            ledgerProps={{
                ledgerEvents,
                isLedgerLoading,
                ledgerFilter,
                setLedgerFilter,
                ledgerPartnerId,
                setLedgerPartnerId,
                ledgerChatId,
                setLedgerChatId,
                ledgerNotifHistory,
                setLedgerNotifHistory,
                fetchLedgerEvents,
                fetchNotifHistoryForUser,
                handleLiveReconcile,
                isReconciling,
                reconcileResult,
                t
            }}
            partnerDetailProps={{
                selectedPartnerId,
                setSelectedPartnerId,
                partnerDetails,
                isDetailsLoading,
                updatePartner,
                t
            }}
        />
    );
};
