import React from 'react';
import { motion } from 'framer-motion';
import {
    Activity, TrendingUp, Users, Zap, Layers, Clock, Calendar, TrendingDown
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';
import { DashboardStats } from '../types';

interface AdminKPIsProps {
    stats: DashboardStats | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 p-4 rounded-xl shadow-2xl relative overflow-hidden group ring-1 ring-white/10">
                <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
                <div className="relative z-10">
                    <p className="text-label font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <Users size={18} />
                        </div>
                        <div>
                            <div className="text-xl font-bold text-white leading-none">
                                {payload[0].value}
                            </div>
                            <div className="text-label font-bold text-blue-400 uppercase tracking-widest mt-1">New Partners</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export const AdminKPIs: React.FC<AdminKPIsProps> = React.memo(({ stats }) => {
    return (
        <motion.div
            key="kpis"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
                <Activity className="text-blue-500 shrink-0 mt-0.5" size={16} />
                <div>
                    <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest">Command Center KPIs</h3>
                    <p className="text-label text-slate-500 font-medium mt-1">Real-time overview of primary growth, retention, and engagement metrics. Use these indicators to assess platform health, user adoption speed, and viral intelligence (K-Factor).</p>
                </div>
            </div>

            {/* Overall Stats Main Card */}
            <div className="p-6 rounded-[2.5rem] bg-linear-to-br from-blue-600 to-indigo-700 text-white space-y-6 shadow-2xl shadow-blue-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Users size={120} />
                </div>
                <div className="flex items-center justify-between relative z-10">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                        <TrendingUp size={24} />
                    </div>
                    <div className="text-right">
                        <div className="text-label font-bold uppercase opacity-60">Total Partners</div>
                        <div className="text-3xl font-bold">{stats?.events.total_partners}</div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 relative z-10 pt-4 border-t border-white/10">
                    <div>
                        <div className="text-label font-bold uppercase opacity-60 flex items-center gap-1">
                            <Zap size={10} /> PRO
                        </div>
                        <div className="text-lg font-bold">{stats?.events.total_pro}</div>
                    </div>
                    <div>
                        <div className="text-label font-bold uppercase opacity-60 flex items-center gap-1">
                            <Users size={10} /> 24h
                        </div>
                        <div className="text-lg font-bold">{stats?.events.active_24h}</div>
                    </div>
                    <div>
                        <div className="text-label font-bold uppercase opacity-60 flex items-center gap-1">
                            Revenue
                        </div>
                        <div className="text-lg font-bold">${stats?.financials.total_revenue || 0}</div>
                    </div>
                </div>
            </div>

            {/* Core KPI Grid */}
            <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-1">
                    <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Engagement</div>
                    <div className="text-sm font-bold text-blue-500">{stats?.kpis.engagement_rate}%</div>
                </div>
                <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-1">
                    <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Conv. Rate</div>
                    <div className="text-sm font-bold text-emerald-500">{stats?.kpis.conversion_rate}%</div>
                </div>
                <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-1">
                    <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">ARPU</div>
                    <div className="text-sm font-bold text-violet-500">${stats?.kpis.arpu}</div>
                </div>
            </div>

            {/* Viral Intelligence Row */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Viral K-Factor</div>
                        <div className="p-1 bg-indigo-500/10 rounded-lg text-indigo-500">
                            <Zap size={10} />
                        </div>
                    </div>
                    <div className="text-lg font-bold text-indigo-500">{stats?.kpis.k_factor}</div>
                    <div className="text-label font-bold text-slate-500 uppercase">Avg Referrals per User</div>
                </div>
                <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Ref. Participation</div>
                        <div className="p-1 bg-pink-500/10 rounded-lg text-pink-500">
                            <Users size={10} />
                        </div>
                    </div>
                    <div className="text-lg font-bold text-pink-500">{stats?.kpis.ref_participation}%</div>
                    <div className="text-label font-bold text-slate-500 uppercase">Active referrers share</div>
                </div>
                <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Network Density</div>
                        <div className="p-1 bg-emerald-500/10 rounded-lg text-emerald-500">
                            <Layers size={10} />
                        </div>
                    </div>
                    <div className="text-lg font-bold text-emerald-500">
                        {typeof stats?.kpis.avg_depth === 'number' ? stats.kpis.avg_depth.toFixed(2) : '1.00'}
                        <span className="text-label opacity-40 ml-1 font-bold">Gen</span>
                    </div>
                    <div className="text-label font-bold text-slate-500 uppercase">Avg Generation Depth</div>
                </div>
            </div>

            {/* Retention Benchmarks Row */}
            <div className="grid grid-cols-4 gap-3">
                <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-1">
                    <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Ret (7d)</div>
                    <div className="text-sm font-bold text-amber-500">{stats?.kpis.retention_7d || 0}%</div>
                </div>
                <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-1">
                    <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Ret (30d)</div>
                    <div className={`text-sm font-bold ${stats?.kpis.retention_30d === 100 ? 'text-slate-500' : 'text-slate-300'}`}>{stats?.kpis.retention_30d || 0}%</div>
                </div>
                <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-1">
                    <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Ret (90d)</div>
                    <div className={`text-sm font-bold ${stats?.kpis.retention_90d === 100 ? 'text-slate-500' : 'text-slate-300'}`}>{stats?.kpis.retention_90d || 0}%</div>
                </div>
                <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-1">
                    <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Ret (180d)</div>
                    <div className={`text-sm font-bold ${stats?.kpis.retention_180d === 100 ? 'text-slate-500' : 'text-slate-300'}`}>{stats?.kpis.retention_180d || 0}%</div>
                </div>
            </div>

            {/* System Efficiency & Adoption */}
            {stats?.performance && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Manual Approval Time</div>
                            <div className="p-1 bg-amber-500/10 rounded-lg text-amber-500">
                                <Clock size={10} />
                            </div>
                        </div>
                        <div className="text-lg font-bold text-amber-500">{stats.performance.avg_manual_approval_min} min</div>
                        <div className="text-label font-bold text-slate-500 uppercase">Avg response efficiency</div>
                    </div>
                    <div className="p-4 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-label font-bold uppercase text-slate-500 dark:text-slate-400">Slot Adoption (FOMO)</div>
                            <div className="p-1 bg-blue-500/10 rounded-lg text-blue-500">
                                <Zap size={10} />
                            </div>
                        </div>
                        <div className="text-lg font-bold text-blue-500">
                            {stats.performance.pro_slots_display}
                            <span className="text-label text-slate-500 font-bold ml-1.5 opacity-60">/ {stats.performance.pro_slots_actual} REAL</span>
                        </div>
                        <div className="text-label font-bold text-slate-500 uppercase">Calculated Traction Base</div>
                    </div>
                </div>
            )}

            {/* Task Completion Breakdown */}
            <div className="p-6 rounded-2xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="text-label font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Task Performance Breakdown</h2>
                    <div className="p-2 bg-blue-500/10 rounded-xl">
                        <Zap size={14} className="text-blue-500 animate-pulse" />
                    </div>
                </div>
                <div className="space-y-4">
                    {Object.entries(stats?.tasks || {}).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 5).map(([taskId, count]) => (
                        <div key={taskId} className="group flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <div className="text-label font-bold text-slate-700 dark:text-slate-100 uppercase tracking-tight">
                                    {taskId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </div>
                                <div className="text-label font-bold text-blue-500 dark:text-blue-400">
                                    {count as number} <span className="text-label opacity-60 ml-0.5">COMPLETED</span>
                                </div>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((count as number) / (stats?.events.total_tasks || 1)) * 100}%` }}
                                    className="h-full bg-linear-to-r from-blue-500 to-indigo-600 rounded-full"
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Partners Leaderboard */}
            <div className="p-6 rounded-2xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="text-label font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Elite Earners Leaderboard</h2>
                    <div className="p-2 bg-blue-500/10 rounded-xl">
                        <TrendingUp size={14} className="text-blue-500" />
                    </div>
                </div>
                <div className="space-y-4">
                    {stats?.top_partners?.map((p, idx) => (
                        <div key={p.telegram_id} className="flex items-center justify-between group p-3 rounded-2xl hover:bg-white/5 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-label font-bold text-slate-500 dark:text-slate-400 border border-black/5 dark:border-white/5">
                                    #{idx + 1}
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 italic transition-colors group-hover:text-blue-500">
                                        {p.username ? `@${p.username}` : `Partner #${p.telegram_id.toString().slice(-4)}`}
                                    </div>
                                    <div className="text-label font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                                        MASTER HUB PARTNER
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1 justify-end">
                                    <span className="text-label opacity-60 font-bold">$</span>
                                    {p.earnings.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Performance Chart: User Growth */}
            <div className="p-6 rounded-[2.5rem] vibing-premium-panel border border-black/5 dark:border-white/5 space-y-6 relative group bg-white/50 dark:bg-slate-900/50">
                <div className="circuit-decor opacity-30" />
                <div className="flex items-center justify-between relative z-10">
                    <div className="space-y-1">
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">
                                <TrendingUp size={14} />
                            </div>
                            Network Growth Matrix
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="h-1 w-8 bg-blue-500 rounded-full" />
                            <p className="text-label font-bold text-blue-500/60 uppercase tracking-widest">14-Day Tactical Trajectory</p>
                        </div>
                    </div>
                    <div className="p-2.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 text-slate-500 shadow-sm">
                        <Calendar size={16} />
                    </div>
                </div>

                <div className="h-[220px] w-full mt-4 relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats?.daily_growth}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                    <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fill: '#64748b', fontWeight: 800 }}
                                dy={10}
                            />
                            <YAxis hide domain={['auto', 'auto']} />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#3b82f6"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorCount)"
                                activeDot={{
                                    r: 6,
                                    fill: '#3b82f6',
                                    stroke: '#fff',
                                    strokeWidth: 2,
                                    style: { filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.5))' }
                                }}
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Network Growth Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                {Object.entries(stats?.growth || {}).map(([period, data]) => (
                    <motion.div
                        key={period}
                        whileHover={{ y: -4 }}
                        className="group relative p-6 rounded-2xl premium-stat-card bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/10 space-y-4 overflow-hidden"
                    >
                        {data.percent_change >= 0 && (
                            <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/5 blur-3xl group-hover:bg-emerald-500/10 transition-all duration-500" />
                        )}
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${data.percent_change >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                    <Activity size={12} />
                                </div>
                                <span className="text-label font-bold uppercase text-slate-400 tracking-widest">{period}</span>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-label font-bold flex items-center gap-1 shadow-sm ${data.percent_change >= 0
                                ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20'
                                : 'bg-red-500/10 text-red-500 ring-1 ring-red-500/20'
                                }`}>
                                {data.percent_change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {Math.abs(data.percent_change)}%
                            </div>
                        </div>
                        <div className="space-y-1 relative z-10">
                            <div className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                                {data.count}
                            </div>
                            <div className="text-label font-bold text-slate-400 uppercase tracking-[0.2em]">Acquired Units</div>
                        </div>
                        <div className="flex items-center justify-between relative z-10 pt-4 border-t border-black/5 dark:border-white/5">
                            <div className="text-label text-slate-500 font-bold uppercase tracking-widest">Previous Era</div>
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{data.previous}</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
});

AdminKPIs.displayName = 'AdminKPIs';
