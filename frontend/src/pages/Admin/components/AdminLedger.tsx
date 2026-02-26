import React from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen, RefreshCw, Search, Filter, Wallet, Zap, Bell,
    GitBranch, CreditCard, AlertOctagon, Cpu, Database,
    AlertTriangle, CheckCircle, Radio, CheckSquare
} from 'lucide-react';

interface AdminLedgerProps {
    ledgerEvents: any[];
    isLedgerLoading: boolean;
    ledgerFilter: string;
    setLedgerFilter: (filter: string) => void;
    ledgerPartnerId: string;
    setLedgerPartnerId: (id: string) => void;
    ledgerChatId: string;
    setLedgerChatId: (id: string) => void;
    ledgerNotifHistory: any;
    setLedgerNotifHistory: (history: any) => void;
    fetchLedgerEvents: () => void;
    fetchNotifHistoryForUser: () => void;
    handleLiveReconcile: () => void;
    isReconciling: boolean;
    reconcileResult: any;
    t: any;
}

export const AdminLedger: React.FC<AdminLedgerProps> = React.memo(({
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
}) => {
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

    const getType = (t_val: string) => typeConfig[t_val] || typeConfig['MISC'];
    const fmt = (dt: string) => dt ? new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

    return (
        <motion.div
            key="ledger"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
        >
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
});

AdminLedger.displayName = 'AdminLedger';
