import React from 'react';
import { motion } from 'framer-motion';
import {
    Activity, TrendingUp, Users, Zap, Layers, Clock, Calendar, TrendingDown, PieChart, Shield, Award, Globe
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation(['admin', 'common']);

    const kpiData = [
        {
            label: t('admin:kpis.total_partners'),
            value: stats?.events.total_partners ?? 0,
            icon: Users,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            label: t('admin:kpis.total_pro'),
            value: stats?.events.total_pro ?? 0,
            icon: Zap,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10'
        },
        {
            label: t('admin:kpis.total_revenue'),
            value: `$${(stats?.financials.total_revenue ?? 0).toLocaleString()}`,
            icon: TrendingUp,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            label: t('admin:kpis.conversion_rate'),
            value: `${stats ? stats.kpis.conversion_rate : 0}%`,
            icon: PieChart,
            color: 'text-violet-500',
            bg: 'bg-violet-500/10'
        },
        {
            label: t('admin:kpis.growth_24h'),
            value: stats?.partners?.growth_24h ? `+${stats.partners.growth_24h}` : '+0',
            icon: Activity,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10'
        },
        {
            label: t('admin:kpis.active_now'),
            value: stats?.events.active_24h ?? 0,
            icon: Globe,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10'
        },
        {
            label: t('admin:kpis.retention'),
            value: `${stats?.kpis.retention_7d || 0}%`,
            icon: Shield,
            color: 'text-cyan-500',
            bg: 'bg-cyan-500/10'
        },
        {
            label: t('admin:kpis.avg_xp'),
            value: stats?.partners?.avg_xp ? Math.round(stats.partners.avg_xp) : 0,
            icon: Award,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10'
        }
    ];

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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {kpiData.map((kpi, i) => (
                    <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-4 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-xl ${kpi.bg}`}>
                                <kpi.icon size={18} className={kpi.color} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">
                                {kpi.label}
                            </span>
                        </div>
                        <div className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">
                            {kpi.value}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <TrendingUp size={14} /> {t('admin:kpis.charts.revenue')}
                    </h4>
                    <div className="h-48 flex items-end justify-between gap-1 px-2">
                        {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ delay: 0.5 + (i * 0.1), duration: 1 }}
                                className="w-full bg-linear-to-t from-blue-600 to-blue-400 rounded-t-lg relative group"
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-bold p-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    +{(h * 150).toLocaleString()}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="p-6 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <Activity size={14} /> {t('admin:kpis.charts.growth')}
                    </h4>
                    <div className="h-48 flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full border-12 border-slate-100 dark:border-white/5 relative flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-12 border-emerald-500 border-t-transparent -rotate-45" />
                            <div className="text-center">
                                <div className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">+12%</div>
                                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{t('admin:kpis.growth_24h')}</div>
                            </div>
                        </div>
                    </div>
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
        </motion.div>
    );
});

AdminKPIs.displayName = 'AdminKPIs';
