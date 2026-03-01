import React from 'react';
import { motion } from 'framer-motion';
import {
    Zap, Send, RefreshCw, Clock, Users, Cpu
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BroadcastTarget } from '../types';

interface AdminNexusProps {
    broadcastHistory: any[];
    isBroadcasting: boolean;
    onLaunchBroadcast: (target: BroadcastTarget, message: string) => void;
}

export const AdminNexus: React.FC<AdminNexusProps> = React.memo(({
    broadcastHistory,
    isBroadcasting,
    onLaunchBroadcast
}) => {
    const { t } = useTranslation(['admin', 'common']);
    const [payload, setPayload] = React.useState('');
    const [target, setTarget] = React.useState<BroadcastTarget>('all');

    return (
        <motion.div
            key="nexus"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
        >
            <div className="p-10 rounded-[3rem] bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 border border-white/10 relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <Zap size={150} className="text-white" />
                </div>

                <div className="relative z-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
                                {t('admin:nexus.title')}
                                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{t('admin:nexus.status_ready')}</span>
                                </div>
                            </h3>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">{t('admin:nexus.subtitle')}</p>
                        </div>
                        <div className="p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                            <Send className="text-indigo-400" size={24} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                <Users size={14} /> {t('admin:nexus.target_audience')}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['all', 'pro_only', 'free_only', 'level_1', 'inactive_7d'] as BroadcastTarget[]).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setTarget(type)}
                                        className={`px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border ${target === type ? 'bg-white text-slate-900 border-white shadow-xl' : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'}`}
                                    >
                                        {t(`admin:nexus.audiences.${type}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                <Cpu size={14} /> {t('admin:nexus.payload_message')}
                            </label>
                            <div className="relative">
                                <textarea
                                    value={payload}
                                    onChange={(e) => setPayload(e.target.value)}
                                    placeholder={t('admin:nexus.placeholder')}
                                    className="w-full h-32 bg-white/5 border border-white/10 rounded-3xl p-4 text-white text-sm placeholder:text-white/10 focus:outline-hidden focus:border-indigo-500/50 transition-all resize-none"
                                />
                                <div className="absolute bottom-4 right-4 flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{t('admin:nexus.char_count', { count: payload.length })}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{t('admin:nexus.html_warning')}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            if (!payload.trim()) return;
                            onLaunchBroadcast(target, payload);
                            setPayload('');
                        }}
                        disabled={isBroadcasting || !payload.trim()}
                        className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all active:scale-[0.98] disabled:opacity-50 shadow-2xl shadow-indigo-500/20"
                    >
                        {isBroadcasting ? (
                            <>
                                <RefreshCw className="animate-spin" size={20} />
                                {t('admin:nexus.launching')}
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                {t('admin:nexus.launch_button')}
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="p-8 rounded-[3rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-6">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                        {t('admin:nexus.history')}
                        <span className="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-lg text-[10px] text-slate-500 font-bold">{broadcastHistory.length}</span>
                    </h4>
                    <Clock size={18} className="text-slate-400" />
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/5">
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('admin:nexus.table.date')}</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('admin:nexus.table.snapshot')}</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('admin:nexus.table.outcome')}</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">{t('admin:nexus.table.status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                            {broadcastHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-10 text-center text-xs font-bold text-slate-400 uppercase tracking-widest opacity-30 italic">
                                        {t('admin:nexus.history_empty')}
                                    </td>
                                </tr>
                            ) : (
                                broadcastHistory.map((campaign) => (
                                    <tr key={campaign.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="text-[10px] font-bold text-slate-900 dark:text-white">{new Date(campaign.created_at).toLocaleDateString()}</div>
                                            <div className="text-[8px] font-medium text-slate-400">{new Date(campaign.created_at).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-[10px] font-bold text-slate-500 line-clamp-1 max-w-[200px]">{campaign.message}</div>
                                            <div className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-1">
                                                {t('admin:nexus.audience_label', { type: campaign.target_type })}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="text-[10px] font-bold text-slate-900 dark:text-white">{campaign.processed_count}</div>
                                                <div className="text-[10px] font-bold text-slate-400">/ {campaign.total_targets}</div>
                                            </div>
                                            <div className="w-24 h-1 bg-slate-100 dark:bg-white/10 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 transition-all duration-1000"
                                                    style={{ width: `${(campaign.processed_count / campaign.total_targets) * 100}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${campaign.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : campaign.status === 'PROCESSING' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20 animate-pulse' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                                                {campaign.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
});

AdminNexus.displayName = 'AdminNexus';
