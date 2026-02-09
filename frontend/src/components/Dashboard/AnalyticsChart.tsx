import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

interface AnalyticsChartProps {
    data?: { date: string; value: number }[];
}

// Mock data if none provided
const mockData = [
    { date: 'Mon', value: 120 },
    { date: 'Tue', value: 180 },
    { date: 'Wed', value: 150 },
    { date: 'Thu', value: 240 },
    { date: 'Fri', value: 300 },
    { date: 'Sat', value: 280 },
    { date: 'Sun', value: 350 },
];

export const AnalyticsChart = ({ data = mockData }: AnalyticsChartProps) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="glass-panel-premium rounded-2xl p-5 mb-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-base font-bold text-(--color-text-primary)">
                        {t('dashboard.analytics.title', 'Earnings History')}
                    </h3>
                    <p className="text-xs font-medium text-(--color-text-secondary)">
                        {t('dashboard.analytics.subtitle', 'Last 7 Days')}
                    </p>
                </div>
                <div className="bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <span className="text-xs font-bold text-emerald-500">+12.5%</span>
                </div>
            </div>

            <div className="h-[200px] w-full -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 600 }}
                            dy={10}
                        />
                        <YAxis
                            hide
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                borderColor: isDark ? '#334155' : '#e2e8f0',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}
                            itemStyle={{ color: isDark ? '#fff' : '#0f172a' }}
                            formatter={(value: number | undefined) => [`$${value ?? 0}`, 'Earned']}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
