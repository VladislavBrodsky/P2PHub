import React, { useState, useMemo, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Calendar, Filter, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { useHaptic } from '../../hooks/useHaptic';

import { apiClient } from '../../api/client';

type Timeframe = '24H' | '7D' | '1M' | '3M' | '6M' | '1Y';

interface ChartDataPoint {
    date: string;
    total: number;
    levels: number[]; // Breakdown by level 1-9
}

// Mock Data Generator that ends at a specific total
const generateMockData = (timeframe: Timeframe, endTotal: number): ChartDataPoint[] => {
    const points = timeframe === '24H' ? 24 : timeframe === '7D' ? 7 : timeframe === '1M' ? 30 : 12;
    const data: ChartDataPoint[] = [];

    // Reverse generation: Start from endTotal and go backwards
    let currentTotal = endTotal;

    for (let i = 0; i < points; i++) {
        // Distribute across 9 levels
        const levels = Array(9).fill(0).map((_, idx) => {
            const weight = Math.max(0.1, 1 - (idx * 0.1));
            return Math.floor(currentTotal * (weight / 5));
        });

        const date = new Date();
        // Adjust date based on index (0 is most recent in this reverse loop logic, but we push to array differently)
        // Let's generate dates forward, but values backward? No, let's generate points normally but scale them.

        // Better approach: Generate a specialized curve 0 -> 1, then multiply by endTotal
    }

    // Simpler: Generate normalized growth curve 0.5 -> 1.0 (or 0 -> 1 if new)
    // Then map to [startTotal, endTotal]

    // For now, let's just make a nice curve ending at endTotal
    // If endTotal is 0, just return flat 0
    if (endTotal === 0) {
        for (let i = 0; i < points; i++) {
            const date = new Date();
            if (timeframe === '24H') date.setHours(date.getHours() - (points - 1 - i));
            else if (timeframe === '7D') date.setDate(date.getDate() - (points - 1 - i));
            else date.setMonth(date.getMonth() - (points - 1 - i));

            data.push({
                date: timeframe === '24H' ? `${date.getHours()}:00` : timeframe === '7D' || timeframe === '1M' ? `${date.getDate()}/${date.getMonth() + 1}` : `${date.toLocaleString('default', { month: 'short' })}`,
                total: 0,
                levels: Array(9).fill(0)
            });
        }
        return data;
    }

    const startTotal = Math.max(0, Math.floor(endTotal * 0.7)); // 30% growth simulation

    for (let i = 0; i < points; i++) {
        const progress = i / (points - 1); // 0 to 1
        // Ease out quad
        const eased = progress * (2 - progress);
        const total = Math.floor(startTotal + (endTotal - startTotal) * eased);

        const date = new Date();
        if (timeframe === '24H') date.setHours(date.getHours() - (points - 1 - i));
        else if (timeframe === '7D') date.setDate(date.getDate() - (points - 1 - i));
        else date.setMonth(date.getMonth() - (points - 1 - i));

        data.push({
            date: timeframe === '24H'
                ? `${date.getHours()}:00`
                : timeframe === '7D' || timeframe === '1M'
                    ? `${date.getDate()}/${date.getMonth() + 1}`
                    : `${date.toLocaleString('default', { month: 'short' })}`,
            total: total,
            levels: Array(9).fill(0).map((_, idx) => Math.floor(total / 9)) // Simplified breakdown
        });
    }

    return data;
};

interface ReferralGrowthChartProps {
    onReportClick?: () => void;
    onMetricsUpdate?: (metrics: { growth_pct: number; current_count: number }) => void;
    timeframe: Timeframe;
    setTimeframe: (tf: Timeframe) => void;
}

export const ReferralGrowthChart = ({ onReportClick, onMetricsUpdate, timeframe, setTimeframe }: ReferralGrowthChartProps) => {
    const { t } = useTranslation();
    const { selection } = useHaptic();
    const gradientId = useId();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [metrics, setMetrics] = useState({ growth_pct: 0, current_count: 0 });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Chart Data
                const chartRes = await apiClient.get(`/api/partner/growth/chart?timeframe=${timeframe}`);
                if (Array.isArray(chartRes.data)) {
                    setChartData(chartRes.data);
                }

                // 2. Fetch Metrics
                const metricsRes = await apiClient.get(`/api/partner/growth/metrics?timeframe=${timeframe}`);
                if (metricsRes.data) {
                    setMetrics(metricsRes.data);
                    onMetricsUpdate?.(metricsRes.data);
                }
            } catch (e) {
                console.error("Failed to fetch growth data", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [timeframe, onMetricsUpdate]);

    const maxValue = useMemo(() => Math.max(...chartData.map(d => d.total), 1), [chartData]);

    // Calculate path for the area chart
    const getPath = (points: ChartDataPoint[]) => {
        if (points.length === 0) return '';
        const width = 100;
        const height = 100;
        const stepX = width / (points.length - 1);

        let path = `M 0,${height} `; // Start bottom-left

        points.forEach((point, index) => {
            const x = index * stepX;
            const y = height - (point.total / maxValue) * height * 0.8; // Leave 20% top padding
            path += `L ${x},${y} `;
        });

        path += `L ${width},${height} Z`; // Close path
        return path;
    };

    // Calculate line path (stroke)
    const getLinePath = (points: ChartDataPoint[]) => {
        if (points.length === 0) return '';
        const width = 100;
        const height = 100;
        const stepX = width / (points.length - 1);

        let path = '';

        points.forEach((point, index) => {
            const x = index * stepX;
            const y = height - (point.total / maxValue) * height * 0.8;
            if (index === 0) path += `M ${x},${y} `;
            else path += `L ${x},${y} `;
        });

        return path;
    };

    return (
        <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-3xl p-4 shadow-sm backdrop-blur-md relative overflow-hidden group">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Header - Compact */}
            <div className="flex items-center justify-between mb-2 relative z-20">
                <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 whitespace-nowrap">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        Network Growth
                    </h3>
                    <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400">Total Active Partners: <span className="text-blue-500">{metrics.current_count}</span></p>
                </div>

                {/* Timeframe Selector - Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => { selection(); setIsDropdownOpen(!isDropdownOpen); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 text-[10px] font-black text-slate-900 dark:text-white transition-all active:scale-95"
                    >
                        {timeframe}
                        <ChevronDown className={cn("w-3 h-3 transition-transform", isDropdownOpen ? "rotate-180" : "")} />
                    </button>

                    <AnimatePresence>
                        {isDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-2 w-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 shadow-xl z-20 overflow-hidden flex flex-col p-1"
                                >
                                    {(['24H', '7D', '1M', '3M', '6M', '1Y'] as Timeframe[]).map((tf) => (
                                        <button
                                            key={tf}
                                            onClick={() => {
                                                selection();
                                                setTimeframe(tf);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={cn(
                                                "w-full px-2 py-1.5 text-[10px] font-bold rounded-lg transition-colors text-left flex items-center justify-between",
                                                timeframe === tf
                                                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                                            )}
                                        >
                                            {tf}
                                            {timeframe === tf && <motion.div layoutId="active-tf" className="w-1 h-1 rounded-full bg-blue-500" />}
                                        </button>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Main Chart Area - Reduced Height */}
            <div className="h-32 w-full relative px-2">
                {/* Y-Axis Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-10">
                    {[1, 0.75, 0.5, 0.25, 0].map((tick) => (
                        <div key={tick} className="w-full h-px bg-slate-500" />
                    ))}
                </div>

                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Area Fill */}
                    <motion.path
                        d={getPath(chartData)}
                        fill={`url(#${gradientId})`}
                        initial={{ opacity: 0, d: `M 0,100 L 100,100 Z` }}
                        animate={{ opacity: 1, d: getPath(chartData) }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />

                    {/* Stroke Line */}
                    <motion.path
                        d={getLinePath(chartData)}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1, d: getLinePath(chartData) }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                </svg>

                {/* HTML Overlay for Interactive Points - Fixes aspect ratio distortion */}
                <div className="absolute inset-0">
                    {chartData.map((point: ChartDataPoint, index: number) => {
                        const width = 100;
                        const height = 100;
                        const stepX = width / (chartData.length - 1);
                        const x = index * stepX; // percentage 0-100
                        const y = (1 - (point.total / maxValue) * 0.8) * 100; // percentage 0-100 (inverted for CSS top)

                        // If maxValue is 0 or NaN, default y to bottom
                        const safeY = isNaN(y) ? 100 : y;

                        return (
                            <div
                                key={index}
                                className="absolute top-0 bottom-0 flex flex-col items-center justify-end z-10 group/point"
                                style={{
                                    left: `${x}%`,
                                    width: `${100 / chartData.length}%`,
                                    transform: 'translateX(-50%)'
                                }}
                                onMouseEnter={() => { selection(); setHoveredIndex(index); }}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                {/* Hit Area (Full Height) */}
                                <div className="absolute inset-0 bg-transparent cursor-crosshair" />

                                {/* Dotted Line (Visual only on hover) */}
                                <div
                                    className={cn(
                                        "w-px bg-blue-500/50 border-r border-dashed border-blue-500 absolute bottom-0 transition-opacity duration-200 pointer-events-none",
                                        hoveredIndex === index ? "opacity-100 h-full" : "opacity-0 h-0"
                                    )}
                                    style={{
                                        height: `${100 - safeY}%`
                                    }}
                                />

                                {/* The Dot */}
                                <div
                                    className={cn(
                                        "absolute w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm transition-all duration-200 pointer-events-none",
                                        hoveredIndex === index ? "scale-125 opacity-100 ring-4 ring-blue-500/20" : "scale-0 opacity-0"
                                    )}
                                    style={{
                                        top: `${safeY}%`,
                                        transform: 'translateY(-50%)'
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Tooltip Overhead */}
                <AnimatePresence>
                    {hoveredIndex !== null && chartData[hoveredIndex] && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs rounded-xl py-2 px-3 shadow-xl border border-white/10 z-20 flex flex-col items-center pointer-events-none min-w-[100px]"
                        >
                            <span className="font-bold mb-1 text-slate-300">{chartData[hoveredIndex].date}</span>
                            <div className="flex items-center gap-2">
                                <Users className="w-3 h-3 text-blue-400" />
                                <span className="font-black text-lg">{chartData[hoveredIndex].total.toLocaleString()}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between mt-1 px-1">
                {chartData.filter((_, i) => i % (timeframe === '24H' ? 4 : timeframe === '7D' ? 1 : 3) === 0).map((point, i) => (
                    <span key={i} className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{point.date}</span>
                ))}
            </div>

            {/* Summary Footer - Compact */}
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-emerald-500/10 p-1.5 rounded-lg text-emerald-500">
                        <TrendingUp className="w-3 h-3" />
                    </div>
                    <div>
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold leading-tight">Growth Rate</div>
                        <div className="text-xs font-black text-emerald-500">
                            {metrics.growth_pct >= 0 ? '+' : ''}{metrics.growth_pct}%
                        </div>
                    </div>
                </div>
                <button
                    onClick={onReportClick}
                    className="text-[8px] font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-wider flex items-center gap-1"
                >
                    Report <ChevronDown className="w-3 h-3 -rotate-90" />
                </button>
            </div>
        </div>
    );
};
