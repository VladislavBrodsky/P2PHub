import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Users, Zap } from 'lucide-react';

interface AdminNetworkProps {
    networkStats: Record<string, number> | null;
    selectedNetworkDepth: number | null;
    networkMembers: any[];
    fetchNetworkMembers: (depth: number) => void;
    fetchPartnerDetails: (id: number) => void;
}

export const AdminNetwork: React.FC<AdminNetworkProps> = React.memo(({
    networkStats,
    selectedNetworkDepth,
    networkMembers,
    fetchNetworkMembers,
    fetchPartnerDetails
}) => {
    return (
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
                            Generation {selectedNetworkDepth} Partners ({networkMembers.length})
                        </h2>
                    </div>
                    <div className="space-y-2">
                        {networkMembers.map((member) => (
                            <div
                                key={member.id}
                                onClick={() => fetchPartnerDetails(member.id)}
                                className="p-4 rounded-2xl glass-panel-premium border border-black/5 dark:border-white/5 flex items-center justify-between transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 border border-black/5 dark:border-white/5">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                            {member.username ? `@${member.username}` : `Partner #${member.id}`}
                                            {member.is_pro && (
                                                <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                                    <Zap size={8} className="text-white fill-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-label font-bold text-slate-500 uppercase tracking-tighter">
                                            ID: {member.telegram_id} · DEPTH {member.depth}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">${member.usdt_balance || 0}</div>
                                    <div className="text-label font-bold text-slate-400 uppercase">EARNINGS</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
});

AdminNetwork.displayName = 'AdminNetwork';
