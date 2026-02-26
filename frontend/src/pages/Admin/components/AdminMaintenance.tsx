import React from 'react';
import { motion } from 'framer-motion';
import {
    Database, AlertTriangle, RefreshCw, ShieldCheck, Bell, Layers
} from 'lucide-react';
import { DashboardStats } from '../types';

interface AdminMaintenanceProps {
    health: any;
    stats: DashboardStats | null;
    isRefreshing: boolean;
    isEconomyAuditing: boolean;
    isTreeAuditing: boolean;
    economyAudit: any;
    treeAudit: any;
    notifStats: any;
    handleRecalculate: () => void;
    handleClearCache: () => void;
    handleEconomyAudit: () => void;
    handleTreeAudit: () => void;
    handleRetryNotifications: () => void;
}

export const AdminMaintenance: React.FC<AdminMaintenanceProps> = React.memo(({
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
}) => {
    return (
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
                            {health ? `${health.latency_ms} ms` : '--'}
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
    );
});

AdminMaintenance.displayName = 'AdminMaintenance';
