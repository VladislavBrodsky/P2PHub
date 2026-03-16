import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, RefreshCw, AlertTriangle, Activity, Wallet,
    Layers, Eye, Megaphone, BookOpen, Search
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
    const { t: tAdmin } = useTranslation(['admin', 'common']);
    const tabs = useMemo(() => [
        { id: 'kpis', label: tAdmin('admin:tabs.kpis'), icon: Activity },
        { id: 'financials', label: tAdmin('admin:tabs.financials'), icon: Wallet },
        { id: 'payments', label: tAdmin('admin:tabs.payments'), icon: Wallet, badge: transactions.length },
        { id: 'network', label: tAdmin('admin:tabs.network'), icon: Layers },
        { id: 'search', label: tAdmin('admin:tabs.search'), icon: Search },
        { id: 'palantir', label: tAdmin('admin:tabs.palantir'), icon: Eye, color: 'text-indigo-500' },
        { id: 'nexus', label: tAdmin('admin:tabs.nexus'), icon: Megaphone, color: 'text-orange-500' },
        { id: 'ledger', label: tAdmin('admin:tabs.ledger'), icon: BookOpen, color: 'text-emerald-500' },
        { id: 'maintenance', label: tAdmin('admin:tabs.maintenance'), icon: ShieldCheck },
    ], [transactions.length, tAdmin]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-slate-500 font-medium whitespace-pre-line text-center">
                    {tAdmin('admin:loading')}
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 pb-[calc(var(--spacing-safe-bottom,20px)+80px)] space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden w-full rounded-3xl bg-white/40 dark:bg-[#1A1D24]/60 backdrop-blur-2xl border border-white/50 dark:border-white/10 p-5 md:p-6 shadow-xl shadow-black/5 flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Background Glows */}
                {/* Removed background glows */}

                {/* Left Side: Icon & Title */}
                <div className="flex flex-col md:flex-row items-center gap-4 z-10 w-full md:w-auto">
                    <div className="w-16 h-16 rounded-3xl bg-linear-to-br from-blue-500/20 to-blue-600/5 flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-500/10 shrink-0">
                        <ShieldCheck className="text-blue-500 drop-shadow-md" size={32} />
                    </div>
                    <div className="text-center md:text-left space-y-1">
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            {t('admin_portal.command_center')}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide">
                            {t('admin_portal.performance_control')}
                        </p>
                    </div>
                </div>

                {/* Right Side: Status & Actions */}
                <div className="flex items-center gap-4 z-10 w-full md:w-auto justify-center md:justify-end">
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-black/5 dark:bg-black/20 rounded-2xl border border-black/5 dark:border-white/5 backdrop-blur-md">
                        <span className="relative flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${stats?.events.audit?.is_healthy ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${stats?.events.audit?.is_healthy ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        </span>
                        <span className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            {stats?.events.audit?.is_healthy ? t('admin_portal.system_optimal') : t('admin_portal.attention_required')}
                        </span>
                    </div>

                    <button
                        onClick={() => fetchData(true, true)}
                        className="w-12 h-12 rounded-2xl bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 transition-all flex items-center justify-center shadow-md active:scale-95 group shrink-0"
                        title={t('admin_portal.refresh_data')}
                    >
                        <RefreshCw size={20} className={`text-slate-600 dark:text-slate-300 group-hover:text-blue-500 transition-colors ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
                    </button>
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
