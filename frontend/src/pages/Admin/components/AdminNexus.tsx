import React from 'react';
import { motion } from 'framer-motion';
import {
    Megaphone, UserPlus, Users, Zap, User, Layers, Clock,
    Filter, RefreshCw, PlayCircle, StopCircle
} from 'lucide-react';

interface AdminNexusProps {
    broadcastForm: { audience: string; text: string };
    setBroadcastForm: (updater: (prev: any) => any) => void;
    isBroadcasting: boolean;
    handleCreateBroadcast: () => void;
    handleCancelBroadcast: (id: number) => void;
    activeBroadcasts: any[];
    broadcasts: any[];
}

export const AdminNexus: React.FC<AdminNexusProps> = React.memo(({
    broadcastForm,
    setBroadcastForm,
    isBroadcasting,
    handleCreateBroadcast,
    handleCancelBroadcast,
    activeBroadcasts,
    broadcasts
}) => {
    return (
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
    );
});

AdminNexus.displayName = 'AdminNexus';
