import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Calendar, Filter, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { useHaptic } from '../../hooks/useHaptic';

type Timeframe = '24H' | '7D' | '1M' | '3M' | '6M' | '1Y';

interface ChartDataPoint {
    date: string;
    total: number;
    levels: number[]; // Breakdown by level 1-9
}

// Mock Data Generator
const generateMockData = (timeframe: Timeframe): ChartDataPoint[] => {
    const points = timeframe === '24H' ? 24 : timeframe === '7D' ? 7 : timeframe === '1M' ? 30 : 12;
    const data: ChartDataPoint[] = [];
    let baseTotal = 1240;

    for (let i = 0; i < points; i++) {
        // Simulate growth
        const growth = Math.floor(Math.random() * 50) + 10;
        baseTotal += growth;

        // Distribute across 9 levels (weighted towards lower levels initially)
        const levels = Array(9).fill(0).map((_, idx) => {
            const weight = Math.max(0.1, 1 - (idx * 0.1));
            return Math.floor(baseTotal * (weight / 5)); // Rough distribution
        });

        const date = new Date();
        if (timeframe === '24H') date.setHours(date.getHours() - (points - i));
        else if (timeframe === '7D') date.setDate(date.getDate() - (points - i));
        else date.setMonth(date.getMonth() - (points - i));

        data.push({
            date: timeframe === '24H'
                ? `${date.getHours()}:00`
                : timeframe === '7D' || timeframe === '1M'
                    ? `${date.getDate()}/${date.getMonth() + 1}`
                    : `${date.toLocaleString('default', { month: 'short' })}`,
            total: baseTotal,
            levels
        });
    }
    return data;
};

export const ReferralGrowthChart = () => {
    const { t } = useTranslation();
    const { selection } = useHaptic();
    const [timeframe, setTimeframe] = useState<Timeframe>('7D');
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const data = useMemo(() => generateMockData(timeframe), [timeframe]);
    const maxValue = Math.max(...data.map(d => d.total));

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
        <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm backdrop-blur-md relative overflow-hidden group">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Network Growth
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Total Active Partners Structure</p>
                </div>

                {/* Timeframe Selector */}
                <div className="flex p-1 bg-slate-100 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5">
                    {(['24H', '7D', '1M', '3M', '6M', '1Y'] as Timeframe[]).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => { selection(); setTimeframe(tf); }}
                            className={cn(
                                "px-2.5 py-1 text-[10px] font-black rounded-lg transition-all",
                                timeframe === tf
                                    ? "bg-white dark:bg-white/10 text-blue-600 dark:text-white shadow-sm"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            )}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Chart Area */}
            <div className="h-48 w-full relative">
                {/* Y-Axis Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-10">
                    {[1, 0.75, 0.5, 0.25, 0].map((tick) => (
                        <div key={tick} className="w-full h-px bg-slate-500" />
                    ))}
                </div>

                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Area Fill */}
                    <motion.path
                        d={getPath(data)}
                        fill="url(#chartGradient)"
                        initial={{ opacity: 0, d: `M 0,100 L 100,100 Z` }}
                        animate={{ opacity: 1, d: getPath(data) }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />

                    {/* Stroke Line */}
                    <motion.path
                        d={getLinePath(data)}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="0.8" // Equivalent to ~3px in viewbox relative
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1, d: getLinePath(data) }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />

                    {/* Interactive Circles */}
                    {data.map((point, index) => {
                        const width = 100;
                        const height = 100;
                        const stepX = width / (data.length - 1);
                        const x = index * stepX;
                        const y = height - (point.total / maxValue) * height * 0.8;

                        return (
                            <motion.g
                                key={index}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 + (index * 0.02) }}
                            >
                                {/* Invisible hit area for better UX */}
                                <rect
                                    x={x - (width / data.length) / 2}
                                    y={0}
                                    width={width / data.length}
                                    height={100}
                                    fill="transparent"
                                    onMouseEnter={() => { selection(); setHoveredIndex(index); }}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    className="cursor-crosshair"
                                />

                                {hoveredIndex === index && (
                                    <>
                                        <circle cx={x} cy={y} r="1.5" fill="#3b82f6" stroke="white" strokeWidth="0.5" />
                                        <line x1={x} y1={y} x2={x} y2={100} stroke="#3b82f6" strokeWidth="0.2" strokeDasharray="1 1" opacity="0.5" />
                                    </>
                                )}
                            </motion.g>
                        );
                    })}
                </svg>

                {/* Tooltip Overhead */}
                <AnimatePresence>
                    {hoveredIndex !== null && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs rounded-xl py-2 px-3 shadow-xl border border-white/10 z-20 flex flex-col items-center pointer-events-none min-w-[120px]"
                        >
                            <span className="font-bold mb-1 text-slate-300">{data[hoveredIndex].date}</span>
                            <div className="flex items-center gap-2">
                                <Users className="w-3 h-3 text-blue-400" />
                                <span className="font-black text-lg">{data[hoveredIndex].total.toLocaleString()}</span>
                            </div>
                            <div className="w-full h-px bg-white/10 my-1.5" />
                            <div className="grid grid-cols-3 gap-x-2 gap-y-1 w-full text-[8px] text-slate-400">
                                {data[hoveredIndex].levels.slice(0, 3).map((l, i) => (
                                    <div key={i} className="flex justify-between"><span>L{i + 1}</span> <span className="text-white">{l}</span></div>
                                ))}
                                <div className="col-span-3 text-center text-[7px] text-blue-400 mt-1">
                                    + {data[hoveredIndex].levels.slice(3).reduce((a, b) => a + b, 0)} more in deep levels
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between mt-2 px-1">
                {data.filter((_, i) => i % (timeframe === '24H' ? 4 : timeframe === '7D' ? 1 : 3) === 0).map((point, i) => (
                    <span key={i} className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{point.date}</span>
                ))}
            </div>

            {/* Summary Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-500">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Growth Rate</div>
                        <div className="text-sm font-black text-emerald-500">+12.5% <span className="text-[9px] font-normal text-slate-400 ml-1">vs prev {timeframe}</span></div>
                    </div>
                </div>
                <button className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-wider flex items-center gap-1">
                    Detailed Report <ChevronDown className="w-3 h-3 -rotate-90" />
                </button>
            </div>
        </div>
    );
};
