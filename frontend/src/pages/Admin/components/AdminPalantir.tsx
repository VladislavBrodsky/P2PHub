import React from 'react';
import { motion } from 'framer-motion';
import {
    Eye, RefreshCw, Send, ShieldAlert, Database, Activity,
    Zap, CreditCard, Wallet, Cpu, Search
} from 'lucide-react';

interface AdminPalantirProps {
    palantirFeed: any[];
    palantirPage: number;
    isPalantirPolling: boolean;
    isRefreshing: boolean;
    notificationsHealth: any;
    setPalantirPage: (updater: (p: number) => number) => void;
    fetchPalantirFeed: (showLoading?: boolean) => void;
    setSelectedPartnerId: (id: number | null) => void;
}

export const AdminPalantir: React.FC<AdminPalantirProps> = React.memo(({
    palantirFeed,
    palantirPage,
    isPalantirPolling,
    isRefreshing,
    notificationsHealth,
    setPalantirPage,
    fetchPalantirFeed,
    setSelectedPartnerId
}) => {
    return (
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
                <div className="absolute left-[3.15rem] top-6 bottom-6 w-px bg-linear-to-b from-indigo-500/20 via-indigo-500/40 to-indigo-500/20 hidden sm:block"></div>

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
                <div className="flex items-center justify-between pt-4 pb-2">
                    <button
                        onClick={() => setPalantirPage(p => Math.max(0, p - 1))}
                        disabled={palantirPage === 0}
                        className="px-4 py-2 rounded-xl bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-xs font-bold uppercase transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-xs font-bold text-slate-600">Page {palantirPage + 1}</span>
                    <button
                        onClick={() => setPalantirPage(p => p + 1)}
                        disabled={palantirFeed.length < 100}
                        className="px-4 py-2 rounded-xl bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-xs font-bold uppercase transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
        </motion.div>
    );
});

AdminPalantir.displayName = 'AdminPalantir';
