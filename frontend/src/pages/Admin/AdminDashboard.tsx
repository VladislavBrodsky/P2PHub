import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, RefreshCw, AlertTriangle, Activity, Wallet,
    Layers, Eye, Megaphone, BookOpen
} from 'lucide-react';
import { AdminKPIs } from './components/AdminKPIs';
import { AdminFinancials } from './components/AdminFinancials';
import { AdminPayments } from './components/AdminPayments';
import { AdminNetwork } from './components/AdminNetwork';
import { AdminUserSearch } from './components/AdminUserSearch';
import { AdminMaintenance } from './components/AdminMaintenance';
import { AdminPalantir } from './components/AdminPalantir';
import { AdminNexus } from './components/AdminNexus';
import { AdminLedger } from './components/AdminLedger';
import { AdminPartnerDetails } from './components/AdminPartnerDetails';
import { DashboardStats, Transaction } from './types';

interface AdminDashboardProps {
    // State
    stats: DashboardStats | null;
    transactions: Transaction[];
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
    viewMode: string;
    setViewMode: (mode: any) => void;

    // Actions
    fetchData: (silent?: boolean, forceRefresh?: boolean) => Promise<void>;
    handleRecalculate: () => void;
    handleClearCache: () => void;

    // Sub-component Props (Passing down)
    kpiProps: any;
    financialProps: any;
    paymentProps: any;
    networkProps: any;
    searchProps: any;
    maintenanceProps: any;
    palantirProps: any;
    nexusProps: any;
    ledgerProps: any;
    partnerDetailProps: any;

    t: any;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = React.memo(({
    stats,
    transactions,
    isLoading,
    isRefreshing,
    error,
    viewMode,
    setViewMode,
    fetchData,
    t,
    kpiProps,
    financialProps,
    paymentProps,
    networkProps,
    searchProps,
    maintenanceProps,
    palantirProps,
    nexusProps,
    ledgerProps,
    partnerDetailProps
}) => {
    const tabs = useMemo(() => [
        { id: 'kpis', label: 'KPIs', icon: Activity },
        { id: 'financials', label: 'Financials', icon: Wallet },
        { id: 'payments', label: 'Payments', icon: Wallet, badge: transactions.length },
        { id: 'network', label: 'Network', icon: Layers },
        { id: 'search', label: 'Search', icon: Layers }, // Icon fallback or specialized one
        { id: 'palantir', label: 'Palantir', icon: Eye, color: 'text-indigo-500' },
        { id: 'nexus', label: 'Nexus', icon: Megaphone, color: 'text-orange-500' },
        { id: 'ledger', label: 'Ledger', icon: BookOpen, color: 'text-emerald-500' },
        { id: 'maintenance', label: 'System', icon: ShieldCheck },
    ], [transactions.length]);

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
                            onClick={() => fetchData(true, true)}
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
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setViewMode(tab.id)}
                        className={`px-3 py-1.5 text-label font-bold uppercase tracking-widest rounded-xl transition-all whitespace-nowrap flex items-center gap-1 ${viewMode === tab.id
                            ? 'bg-white dark:bg-white/10 shadow-sm text-blue-500'
                            : 'text-slate-500 hover:bg-white/5'
                            }`}
                    >
                        <tab.icon size={12} className={viewMode === tab.id ? tab.color : ''} />
                        {tab.label}
                        {tab.badge !== undefined && tab.badge > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-label">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {viewMode === 'kpis' && <AdminKPIs {...kpiProps} />}
                {viewMode === 'financials' && <AdminFinancials {...financialProps} />}
                {viewMode === 'payments' && <AdminPayments {...paymentProps} />}
                {viewMode === 'network' && <AdminNetwork {...networkProps} />}
                {viewMode === 'search' && <AdminUserSearch {...searchProps} />}
                {viewMode === 'maintenance' && <AdminMaintenance {...maintenanceProps} />}
                {viewMode === 'palantir' && <AdminPalantir {...palantirProps} />}
                {viewMode === 'nexus' && <AdminNexus {...nexusProps} />}
                {viewMode === 'ledger' && <AdminLedger {...ledgerProps} />}
            </AnimatePresence>

            <AdminPartnerDetails {...partnerDetailProps} />
        </div>
    );
});

AdminDashboard.displayName = 'AdminDashboard';
