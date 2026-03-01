import React from 'react';
import { motion } from 'framer-motion';
import {
    RefreshCw, Zap, ShieldAlert, Layers, Send
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AdminMaintenanceProps {
    health: any | null;
    auditResults: any | null;
    treeAuditResults: any | null;
    isProcessing: boolean;
    isAuditing: boolean;
    isTreeAuditing: boolean;
    onRecalculateStats: () => void;
    onFlushCache: () => void;
    onRunAudit: () => void;
    onRunTreeAudit: () => void;
    onRetryNotifications: () => void;
}

export const AdminMaintenance: React.FC<AdminMaintenanceProps> = React.memo(({
    health,
    auditResults,
    treeAuditResults,
    isProcessing,
    isAuditing,
    isTreeAuditing,
    onRecalculateStats,
    onFlushCache,
    onRunAudit,
    onRunTreeAudit,
    onRetryNotifications
}) => {
    const { t } = useTranslation(['admin', 'common']);

    const maintenanceSections = [
        {
            title: t('admin:maintenance.consistency.title'),
            desc: t('admin:maintenance.consistency.desc'),
            action: onRecalculateStats,
            label: t('admin:maintenance.consistency.button'),
            loadingLabel: t('admin:maintenance.consistency.processing'),
            icon: RefreshCw,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            title: t('admin:maintenance.cache.title'),
            desc: t('admin:maintenance.cache.desc'),
            action: onFlushCache,
            label: t('admin:maintenance.cache.button'),
            loadingLabel: t('admin:maintenance.cache.clearing'),
            icon: Zap,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10'
        },
        {
            title: t('admin:maintenance.economy.title'),
            desc: t('admin:maintenance.economy.desc'),
            action: onRunAudit,
            label: t('admin:maintenance.economy.button'),
            loadingLabel: t('admin:maintenance.economy.auditing'),
            icon: ShieldAlert,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            audit: auditResults,
            auditLabels: {
                healthy: t('admin:maintenance.economy.healthy'),
                anomalies: t('admin:maintenance.economy.anomalies'),
                notRun: t('admin:maintenance.economy.not_run'),
                checked: t('admin:maintenance.economy.checked'),
                discrepancies: t('admin:maintenance.economy.discrepancies')
            }
        },
        {
            title: t('admin:maintenance.tree.title'),
            desc: t('admin:maintenance.tree.desc'),
            action: onRunTreeAudit,
            label: t('admin:maintenance.tree.button'),
            loadingLabel: t('admin:maintenance.tree.auditing'),
            icon: Layers,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10',
            audit: treeAuditResults,
            auditLabels: {
                healthy: t('admin:maintenance.tree.healthy'),
                anomalies: t('admin:maintenance.tree.anomalies'),
                notRun: t('admin:maintenance.tree.not_run'),
                checked: t('admin:maintenance.tree.checked'),
                anomaliesLabel: t('admin:maintenance.tree.anomalies_label')
            }
        },
        {
            title: t('admin:maintenance.notifications.title'),
            desc: t('admin:maintenance.notifications.desc'),
            action: onRetryNotifications,
            label: t('admin:maintenance.notifications.button'),
            loadingLabel: t('admin:maintenance.notifications.retrying'),
            icon: Send,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            stats: health?.counts,
            labels: {
                sent: t('admin:maintenance.notifications.sent'),
                pending: t('admin:maintenance.notifications.pending'),
                failed: t('admin:maintenance.notifications.failed'),
                congested: t('admin:maintenance.notifications.congested'),
                healthy: t('admin:maintenance.notifications.healthy')
            }
        }
    ];

    return (
        <motion.div
            key="maintenance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <div className="p-4 rounded-2xl bg-slate-500/5 border border-slate-500/10 flex items-start gap-3">
                <ShieldAlert className="text-slate-500 shrink-0 mt-0.5" size={16} />
                <div>
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('admin:maintenance.title')}</h3>
                    <p className="text-label text-slate-500 font-medium mt-1">{t('admin:maintenance.desc')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {maintenanceSections.map((section, idx) => (
                    <motion.div
                        key={section.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-4 hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-sm"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${section.bg}`}>
                                    <section.icon size={20} className={section.color} />
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{section.title}</h4>
                            </div>
                            {section.stats && (
                                <div className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${health?.database_latency_ms && health.database_latency_ms > 100 ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                    {health?.database_latency_ms && health.database_latency_ms > 100 ? section.labels?.congested : section.labels?.healthy}
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                            {section.desc}
                        </p>

                        {/* Audit Visualization */}
                        {section.audit && (
                            <div className="p-3 bg-slate-50 dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Status</div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest ${section.audit.healthy ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {section.audit.healthy ? section.auditLabels?.healthy : section.auditLabels?.anomalies}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-right">
                                    <div className="space-y-1">
                                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{section.auditLabels?.checked}</div>
                                        <div className="text-[10px] font-black text-slate-900 dark:text-white">{section.audit.partners_checked || section.audit.total_checked}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{section.auditLabels?.discrepancies || section.auditLabels?.anomaliesLabel}</div>
                                        <div className={`text-[10px] font-black ${(section.audit.anomalies_found > 0 || section.audit.discrepancies_found > 0) ? 'text-rose-500' : 'text-slate-500'}`}>
                                            {section.audit.anomalies_found ?? section.audit.discrepancies_found}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notification Stats */}
                        {section.stats && (
                            <div className="grid grid-cols-3 gap-2">
                                <div className="p-2 bg-slate-50 dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5 text-center">
                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{section.labels?.sent}</div>
                                    <div className="text-xs font-black text-emerald-500">{section.stats.sent}</div>
                                </div>
                                <div className="p-2 bg-slate-50 dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5 text-center">
                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{section.labels?.pending}</div>
                                    <div className="text-xs font-black text-amber-500">{section.stats.pending}</div>
                                </div>
                                <div className="p-2 bg-slate-50 dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5 text-center">
                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{section.labels?.failed}</div>
                                    <div className="text-xs font-black text-rose-500">{section.stats.failed}</div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={section.action}
                            disabled={isProcessing || isAuditing || isTreeAuditing}
                            className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                        >
                            {(isProcessing || isAuditing || isTreeAuditing) ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    {section.loadingLabel}
                                </>
                            ) : section.label}
                        </button>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
});

AdminMaintenance.displayName = 'AdminMaintenance';
