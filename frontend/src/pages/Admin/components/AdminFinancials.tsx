import React from 'react';
import { motion } from 'framer-motion';
import {
    Wallet, PieChart, Zap, ExternalLink
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { DashboardStats } from '../types';

interface AdminFinancialsProps {
    stats: DashboardStats | null;
}

export const AdminFinancials: React.FC<AdminFinancialsProps> = React.memo(({ stats }) => {
    const { t } = useTranslation('common');

    return (
        <motion.div
            key="financials"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3">
                <Wallet className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                <div>
                    <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest">{t('admin_portal.financials.title')}</h3>
                    <p className="text-label text-slate-500 font-medium mt-1">{t('admin_portal.financials.desc')}</p>
                </div>
            </div>

            {/* Total Clear Income */}
            <div className="p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none text-slate-900 dark:text-white">
                    <Wallet size={120} />
                </div>
                <div className="space-y-1 relative z-10">
                    <span className="text-blue-600 dark:text-blue-400 text-label font-bold uppercase tracking-widest">{t('admin_portal.financials.profit_net')}</span>
                    <div className="flex items-end justify-between">
                        <div className="text-4xl font-bold text-slate-900 dark:text-white flex items-baseline gap-1">
                            <span className="text-2xl text-blue-500 font-bold">$</span>
                            {stats?.financials.net_profit}
                        </div>
                        <div className="text-right">
                            <div className="text-label font-bold text-slate-500 uppercase">{t('admin_portal.financials.gross_margin')}</div>
                            <div className="text-xl font-bold text-emerald-500">{stats?.financials.gross_margin}%</div>
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-500 text-label font-bold">{t('admin_portal.financials.revenue_retained')}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10 pt-4 border-t border-slate-200 dark:border-white/5">
                    <div>
                        <div className="text-slate-500 text-label font-bold uppercase">{t('admin_portal.financials.paid_referral')}</div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">${stats?.financials.total_commissions}</div>
                        <div className="text-label text-blue-600 dark:text-blue-400 font-bold">{stats?.financials.actual_payout_ratio}{t('admin_portal.financials.revenue_of')}</div>
                    </div>
                    <div>
                        <div className="text-slate-500 text-label font-bold uppercase">{t('admin_portal.financials.target_split')}</div>
                        <div className="text-lg font-bold text-slate-400 dark:text-slate-400">{stats?.financials.theoretical_payout_ratio}%</div>
                        <div className="text-label text-slate-400 dark:text-slate-600 font-bold italic">{t('admin_portal.financials.max_distribution')}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10 pt-4 border-t border-slate-200 dark:border-white/5">
                    <div>
                        <div className="text-slate-500 text-label font-bold uppercase">{t('admin_portal.financials.gross_revenue')}</div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">${stats?.financials.total_revenue}</div>
                    </div>
                    <div>
                        <div className="text-slate-500 text-label font-bold uppercase">{t('admin_portal.financials.revenue_usdt_ton')}</div>
                        <div className="text-xs font-bold text-slate-700 dark:text-white">
                            USDT: ${stats?.financials.total_revenue_usdt}
                        </div>
                        <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            TON: {stats?.financials.total_revenue_ton} (${stats?.financials.current_ton_value})
                        </div>
                    </div>
                </div>
            </div>

            {/* Revenue Performance Chart */}
            <div className="p-5 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('admin_portal.financials.performance')}</h2>
                    <PieChart size={14} className="text-slate-500" />
                </div>
                <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.daily_revenue}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fill: '#64748b' }}
                            />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#0f172a',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    fontSize: '10px'
                                }}
                                itemStyle={{ color: '#10b981' }}
                            />
                            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                {stats?.daily_revenue.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.amount > 0 ? '#10b981' : '#334155'} fillOpacity={0.8} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Successful Sales */}
            <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 px-1">{t('admin_portal.financials.recent_sales')}</h2>
                <div className="space-y-2">
                    {stats?.recent_sales.map((sale) => (
                        <div key={sale.id} className="p-3 rounded-2xl glass-panel-premium border border-black/5 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                        @{sale.username || sale.telegram_id}
                                    </div>
                                    <div className="text-label font-bold text-slate-500 uppercase flex items-center gap-1">
                                        {new Date(sale.created_at).toLocaleDateString()} · {sale.currency}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                                <div className="text-sm font-bold text-emerald-500">+${sale.amount}</div>
                                {sale.tx_hash && (
                                    <a
                                        href={`https://tonviewer.com/transaction/${sale.tx_hash}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1 px-1.5 bg-white/5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-400 transition-colors"
                                    >
                                        <ExternalLink size={10} />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Commissions Breakdown */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('admin_portal.financials.commission_split')}</h2>
                    <PieChart size={14} className="text-slate-500" />
                </div>
                <div className="space-y-2">
                    {stats?.financials.commissions_breakdown.map((line) => (
                        <div key={line.level} className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xs font-bold text-slate-500">
                                    L{line.level}
                                </div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t('admin_portal.financials.level_partners', { level: line.level })}</span>
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-100">${line.amount}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
});

AdminFinancials.displayName = 'AdminFinancials';
