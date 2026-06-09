import { m, AnimatePresence } from 'framer-motion';
import ReactDOM from 'react-dom';
import { TrendingUp, Users, DollarSign, ArrowRight, Calculator, Clock, AlertCircle, Lock, Flame, ChevronRight, Zap } from 'lucide-react';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ReferralGraph } from './ReferralGraph';
import { useTranslation, Trans } from 'react-i18next';
import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { proService } from '../../services/proService';
import { getApiUrl } from '../../utils/api';

type CalculatorMode = 'profit' | 'inaction';

interface IncomePotentialProps {
    onNavigateToPartner?: () => void;
}

// #comment: Memoized sub-component to handle viral message rotation without re-rendering the whole calculator.
const ViralMessages = React.memo(({ messages, isEnabled }: { messages: string[], isEnabled: boolean }) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!isEnabled) return;
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % messages.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [isEnabled, messages.length]);

    return (
        <div className="text-center h-12 flex items-center justify-center">
            <AnimatePresence mode="wait">
                <m.p
                    key={index}
                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="text-caption text-slate-500 dark:text-slate-400 font-medium leading-tight max-w-[280px]"
                >
                    {messages[index]}
                </m.p>
            </AnimatePresence>
        </div>
    );
});

export const IncomePotential = ({ onNavigateToPartner }: IncomePotentialProps) => {
    const { t } = useTranslation(['marketing', 'common']);

    const JOB_LEVELS = useMemo(() => [
        { id: 'student', label: t('income.levels.student', { defaultValue: 'Student' }), rate: 0 },
        { id: 'entry', label: t('income.levels.entry', { defaultValue: 'Entry Level' }), rate: 15 },
        { id: 'pro', label: t('income.levels.pro', { defaultValue: 'Professional' }), rate: 30 },
        { id: 'manager', label: t('income.levels.manager', { defaultValue: 'Manager' }), rate: 60 },
        { id: 'exec', label: t('income.levels.exec', { defaultValue: 'Executive' }), rate: 120 }
    ], [t]);

    const [mode, setMode] = useState<CalculatorMode>('profit');
    const [activeModal, setActiveModal] = useState<'market' | 'revenue' | null>(null);
    const [activePartners, setActivePartners] = useState(50);
    const [selectedLevel, setSelectedLevel] = useState(JOB_LEVELS[2]); // Default to Professional
    const [hoursWorked, setHoursWorked] = useState(8);
    const [isStrategyUnlocked, setIsStrategyUnlocked] = useState(false);
    const [showMathSection, setShowMathSection] = useState(false);
    const [liveCount, setLiveCount] = useState(() => Math.floor(Math.random() * 40) + 18);
    const [slotsLeft] = useState(() => Math.floor(Math.random() * 7) + 3);
    const [mathVisible, setMathVisible] = useState(false);
    const mathRef = useRef<HTMLDivElement>(null);

    const { data: memberAvatars } = useQuery({
        queryKey: ['proMemberAvatars'],
        queryFn: () => proService.getMemberAvatars(3),
        staleTime: 30 * 60 * 1000, // 30 mins
        refetchInterval: 30 * 60 * 1000,
    });

    const displayAvatars: { url?: string, file_id?: string }[] = memberAvatars?.avatars || [
        { url: "https://randomuser.me/api/portraits/women/44.jpg" },
        { url: "https://randomuser.me/api/portraits/women/68.jpg" },
        { url: "https://randomuser.me/api/portraits/women/65.jpg" }
    ];

    const viralMessagesRaw = t('income.network.viral_messages', { returnObjects: true });
    const viralMessages = useMemo(() =>
        Array.isArray(viralMessagesRaw) ? viralMessagesRaw : [t('income.network.desc')],
        [viralMessagesRaw, t]
    );

    // Tick the live count every 8-14 seconds
    useEffect(() => {
        const bump = () => setLiveCount(prev => prev + Math.floor(Math.random() * 3) + 1);
        const id = setInterval(bump, 8000 + Math.random() * 6000);
        return () => clearInterval(id);
    }, []);

    // Intersection observer → trigger math row animation
    useEffect(() => {
        if (!showMathSection) return;
        const el = mathRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setMathVisible(true); },
            { threshold: 0.2 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [showMathSection]);

    // Profit Math
    const estimatedMonthlyRaw = useMemo(() => activePartners * 45, [activePartners]);
    const estimatedMonthly = useMemo(() => estimatedMonthlyRaw.toLocaleString(), [estimatedMonthlyRaw]);

    // Percentage of active partners slider: min=5, max=960
    const activePartnersPct = useMemo(() => {
        return ((activePartners - 5) / (960 - 5)) * 100;
    }, [activePartners]);

    // Trigger math section once plan is unlocked
    useEffect(() => {
        if (isStrategyUnlocked && !showMathSection) {
            setShowMathSection(true);
        }
    }, [isStrategyUnlocked, showMathSection]);

    const handleUnlock = () => {
        setIsStrategyUnlocked(true);
    };

    // Inaction Math
    const p2pDailyPotential = 1440;
    const currentDailyIncome = selectedLevel.rate * hoursWorked;
    const currentValPerMin = currentDailyIncome / 1440;
    const dailyLoss = p2pDailyPotential - currentDailyIncome;
    const displayLoss = dailyLoss > 0 ? dailyLoss : 0;

    // Percentage of inaction hours worked slider: min=1, max=16
    const inactionPct = useMemo(() => {
        return ((hoursWorked - 1) / (16 - 1)) * 100;
    }, [hoursWorked]);

    return (
        <section id="profit-calculator" className="px-0 py-2 min-h-[1100px] lg:min-h-0 scroll-mt-24">
            <m.div
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative overflow-hidden rounded-3xl text-slate-900 dark:text-white p-6 md:p-8 lg:p-10 flex flex-col gap-6 lg:gap-8 shadow-2xl border border-slate-200/50 dark:border-white/5 backdrop-blur-3xl lg:max-w-5xl xl:max-w-6xl w-full lg:mx-auto bg-white/40 dark:bg-slate-950/45 transition-all duration-300"
            >
                {/* Background Glow */}
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-600/20 blur-[120px] pointer-events-none animate-pulse" />
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-600/10 blur-[120px] pointer-events-none" />

                <div className="space-y-6 relative z-10 flex flex-col items-center text-center">
                    <m.div
                        className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/5 backdrop-blur-sm px-3 py-1.5 will-change-transform"
                        animate={{
                            boxShadow: ["0 0 0px rgba(59, 130, 246, 0)", "0 0 15px rgba(59, 130, 246, 0.4)", "0 0 0px rgba(59, 130, 246, 0)"],
                            borderColor: ["rgba(59, 130, 246, 0.3)", "rgba(59, 130, 246, 0.8)", "rgba(59, 130, 246, 0.3)"]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                        <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-label font-bold uppercase tracking-[0.2em] text-blue-500">
                            {t('income.badge')}
                        </span>
                    </m.div>

                    <h3 className="text-[clamp(1.75rem,6vw,2.5rem)] font-black tracking-tight leading-none uppercase text-balance">
                        {t('income.title')}
                        <span className="block mt-1 text-transparent bg-clip-text bg-linear-to-r from-emerald-500 via-teal-400 to-blue-500 dark:from-emerald-400 dark:via-cyan-300 dark:to-blue-400 bg-size-[200%_auto] animate-text-shimmer drop-shadow-[0_2px_15px_rgba(52,211,153,0.3)]">
                            {t('income.title_highlight')}
                        </span>
                    </h3>
                    <div className="relative">
                        <p className="text-[clamp(0.8rem,2vw,0.875rem)] text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-[360px] mx-auto">
                            <Trans t={t} i18nKey="income.desc">
                                Traditional finance is a <span className="text-blue-600 dark:text-blue-400 font-bold">walled garden</span>.
                                As a <span className="text-pintopay-blue dark:text-blue-400 font-bold">Partner</span>, you are the bridge.
                                Every global transaction becomes your dividends.
                            </Trans>
                        </p>
                    </div>
                </div>

                {/* Main Content Layout Grid */}
                <div className="relative z-10 w-full">
                    {!isStrategyUnlocked ? (
                        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 gap-6">
                            {/* Left Column: Mode Toggle, Inputs, and Direct Readouts */}
                            <div className="lg:col-span-7 flex flex-col gap-6">
                                {/* Mode Toggle */}
                                <div className="flex p-1 bg-slate-100/40 dark:bg-slate-950/40 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-white/5 gap-1.5 w-full shadow-inner relative overflow-hidden">
                                    <button
                                        onClick={() => setMode('profit')}
                                        className={`relative flex-1 py-2 px-3 rounded-xl text-[clamp(0.65rem,2vw,0.725rem)] uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer ${
                                            mode === 'profit'
                                                ? 'text-white font-black z-10'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold z-10'
                                        }`}
                                    >
                                        {mode === 'profit' && (
                                            <m.div
                                                layoutId="activeCalculatorTab"
                                                className="absolute inset-0 bg-linear-to-r from-emerald-500 to-teal-500 rounded-xl shadow-[0_4px_15px_rgba(16,185,129,0.25)] border border-emerald-400/20"
                                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                            />
                                        )}
                                        <span className="relative z-20">{t('income.modes.profit')}</span>
                                    </button>
                                    <button
                                        onClick={() => setMode('inaction')}
                                        className={`relative flex-1 py-2 px-3 rounded-xl text-[clamp(0.65rem,2vw,0.725rem)] uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer ${
                                            mode === 'inaction'
                                                ? 'text-white font-black z-10'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold z-10'
                                        }`}
                                    >
                                        {mode === 'inaction' && (
                                            <m.div
                                                layoutId="activeCalculatorTab"
                                                className="absolute inset-0 bg-linear-to-r from-rose-500 to-pink-500 rounded-xl shadow-[0_4px_15px_rgba(244,63,94,0.25)] border border-rose-400/20"
                                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                            />
                                        )}
                                        <span className="relative z-20">{t('income.modes.inaction')}</span>
                                    </button>
                                </div>

                                <AnimatePresence mode="wait">
                                    {mode === 'profit' ? (
                                        <m.div
                                            key="profit"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="flex flex-col gap-6"
                                        >
                                            {/* Profit Projector Header */}
                                            <div className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/10 rounded-full px-3 py-1.5 w-fit shadow-xs">
                                                <Calculator className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{t('income.profit.projector')}</span>
                                            </div>

                                            {/* Slider Inputs */}
                                            <div className="flex flex-col gap-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-caption font-black text-slate-500 dark:text-slate-400 tracking-wide">{t('income.profit.active_partners')}</span>
                                                    <span className="bg-blue-500/10 border border-blue-500/20 text-blue-500 px-3.5 py-0.5 rounded-full text-xs font-black tracking-wide font-mono shadow-[inset_0_1px_8px_rgba(59,130,246,0.1)]">
                                                        {activePartners}
                                                    </span>
                                                </div>
                                                <div className="relative h-6 flex items-center">
                                                    <input
                                                        type="range"
                                                        min="5"
                                                        max="960"
                                                        value={activePartners}
                                                        onChange={(e) => setActivePartners(parseInt(e.target.value))}
                                                        className="range-input-premium"
                                                        style={{ '--range-pct': `${activePartnersPct}%` } as React.CSSProperties}
                                                    />
                                                </div>
                                            </div>

                                            {/* Estimated Monthly Income Readout */}
                                            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-radial from-emerald-500/10 to-transparent dark:from-emerald-500/5 dark:to-transparent bg-slate-950/80 dark:bg-black/60 border border-emerald-500/30 shadow-[0_8px_32px_rgba(16,185,129,0.08),inset_0_2px_15px_rgba(16,185,129,0.05)]">
                                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500/80 dark:text-emerald-400/80 mb-2">{t('income.profit.monthly_income')}</span>
                                                <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-emerald-400 via-teal-300 to-emerald-400 dark:from-emerald-400 dark:via-cyan-300 dark:to-emerald-400 tracking-tight drop-shadow-[0_0_20px_rgba(52,211,153,0.55)] font-mono animate-pulse-subtle">${estimatedMonthly}</span>
                                            </div>
                                        </m.div>
                                    ) : (
                                        <m.div
                                            key="inaction"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="flex flex-col gap-6"
                                        >
                                            {/* Inaction Projector Header */}
                                            <div className="flex items-center gap-2 bg-rose-500/5 border border-rose-500/10 rounded-full px-3 py-1.5 w-fit shadow-xs">
                                                <Clock className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{t('income.inaction.projector')}</span>
                                            </div>

                                            {/* Dropdown and Slider Inputs */}
                                            <div className="space-y-5">
                                                <div className="space-y-2 flex flex-col">
                                                    <label className="text-caption font-black text-slate-500 dark:text-slate-400 tracking-wide mb-1">{t('income.inaction.status')}</label>
                                                    <div className="relative">
                                                        <select
                                                            value={selectedLevel.id}
                                                            onChange={(e) => setSelectedLevel(JOB_LEVELS.find(l => l.id === e.target.value) || JOB_LEVELS[2])}
                                                            className="w-full appearance-none bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/10 text-slate-900 dark:text-white text-caption font-bold rounded-xl px-4 py-3 focus:outline-hidden focus:ring-2 focus:ring-rose-500/50 cursor-pointer shadow-xs"
                                                        >
                                                            {JOB_LEVELS.map((level) => (
                                                                <option key={level.id} value={level.id} className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
                                                                    {level.label} (${level.rate}/hr)
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                            <ArrowRight className="w-3.5 h-3.5 rotate-90 opacity-50 text-slate-500 dark:text-white/40" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-caption font-black text-slate-500 dark:text-slate-400 tracking-wide">{t('income.inaction.hours')}</span>
                                                        <span className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-3 py-0.5 rounded-full text-xs font-black tracking-wide font-mono shadow-[inset_0_1px_8px_rgba(244,63,94,0.1)]">
                                                            {hoursWorked} Hours
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="16"
                                                        value={hoursWorked}
                                                        onChange={(e) => setHoursWorked(parseInt(e.target.value))}
                                                        className="range-input-premium range-rose"
                                                        style={{ '--range-pct': `${inactionPct}%` } as React.CSSProperties}
                                                    />
                                                </div>
                                            </div>

                                            {/* Inaction Readouts (Value/Min + Daily Loss) */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-950/80 dark:bg-black/60 border border-slate-800/40 dark:border-white/5 shadow-inner">
                                                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 mb-1.5 leading-none">
                                                        {t('income.inaction.value_per_min')}
                                                    </div>
                                                    <div className={`text-lg sm:text-xl font-black transition-colors duration-300 font-mono ${currentValPerMin >= 1
                                                        ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                                                        : 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                                                        }`}>
                                                        ${currentValPerMin.toFixed(4)}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-radial from-rose-500/10 to-transparent dark:from-rose-500/5 dark:to-transparent bg-slate-950/80 dark:bg-black/60 border border-rose-500/30 shadow-[0_8px_20px_rgba(244,63,94,0.08),inset_0_2px_15px_rgba(244,63,94,0.05)]">
                                                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-400/80 mb-1.5 leading-none">
                                                        {t('income.inaction.daily_loss')}
                                                    </div>
                                                    <div className="text-lg sm:text-xl font-black text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.55)] font-mono animate-pulse-subtle">
                                                        ${displayLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            </div>
                                        </m.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Right Column: Stats, Warnings, and Unified CTA */}
                            <div className="lg:col-span-5 flex flex-col gap-6 lg:border-l lg:border-slate-200/50 lg:dark:border-white/5 lg:pl-8 justify-between">
                                {/* Stats Block */}
                                <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                                    <div className="bg-white/40 dark:bg-slate-900/30 border border-slate-200/50 dark:border-white/5 backdrop-blur-xl p-4 rounded-[22px] flex flex-col gap-3 group transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/20 dark:hover:border-blue-500/30 hover:shadow-[0_12px_24px_rgba(59,130,246,0.12)] relative overflow-hidden">
                                        <div className="flex justify-between items-start">
                                            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/10">
                                                <Users className="w-4 h-4 text-white shrink-0" />
                                            </div>
                                            <button onClick={() => setActiveModal('market')} className="text-slate-400 dark:text-white/20 hover:text-blue-400 cursor-pointer">
                                                <AlertCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="space-y-0.5 min-w-0">
                                            <div className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 drop-shadow-[0_0_10px_rgba(59,130,246,0.15)]">{t('marketing:income.stats.global_target_val', '1.2B')}</div>
                                            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">{t('income.stats.global_target')}</div>
                                        </div>
                                    </div>

                                    <div className="bg-white/40 dark:bg-slate-900/30 border border-slate-200/50 dark:border-white/5 backdrop-blur-xl p-4 rounded-[22px] flex flex-col gap-3 group transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/20 dark:hover:border-emerald-500/30 hover:shadow-[0_12px_24px_rgba(16,185,129,0.12)] relative overflow-hidden">
                                        <div className="flex justify-between items-start">
                                            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/10">
                                                <DollarSign className="w-4 h-4 text-white shrink-0" />
                                            </div>
                                            <button onClick={() => setActiveModal('revenue')} className="text-slate-400 dark:text-white/20 hover:text-emerald-400 cursor-pointer">
                                                <AlertCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="space-y-0.5 min-w-0">
                                            <div className="text-xl sm:text-2xl font-black tabular-nums tracking-tight text-transparent bg-clip-text bg-linear-to-r from-emerald-500 to-teal-400 dark:from-emerald-400 dark:to-teal-300 drop-shadow-[0_0_10px_rgba(16,185,129,0.15)]">24/7</div>
                                            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">{t('income.stats.revenue')}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Warning / Cost of Waiting Box */}
                                <div className="relative z-10 w-full p-5 rounded-[22px] bg-linear-to-br from-rose-500/8 via-transparent to-indigo-500/8 dark:from-rose-950/15 dark:via-slate-900/30 dark:to-indigo-950/15 border border-rose-500/25 dark:border-white/10 backdrop-blur-2xl overflow-hidden group shadow-md">
                                    <div className="absolute inset-0 bg-linear-to-br from-rose-500/10 via-transparent to-indigo-500/10 opacity-30 pointer-events-none animate-liquid-fast" />
                                    
                                    <div className="flex gap-3 relative z-10">
                                        <div className="shrink-0 pt-0.5">
                                            <div className="w-1 h-10 rounded-full bg-linear-to-b from-rose-500 via-rose-600 to-indigo-600 shadow-[0_0_10px_rgba(244,63,94,0.4)] animate-vibing" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-900 dark:text-white flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                                {t('income.waiting.title')}
                                            </h4>
                                            <div className="text-[11px] leading-normal text-slate-600 dark:text-slate-200 font-medium">
                                                <Trans t={t} i18nKey="income.waiting.desc">
                                                    While you trade hours for a fixed wage, the Digital Economy generates value 24/7.
                                                    <span className="block my-1.5 bg-linear-to-r from-rose-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent font-black tracking-wide bg-size-[200%_auto] animate-text-shimmer drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                                                        Every minute you wait is a tax on your potential
                                                    </span>
                                                    <span className="block opacity-80 dark:text-slate-300">
                                                        Unlock the strategy to stop calculating losses and start capturing profits.
                                                    </span>
                                                </Trans>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Main CTA Block */}
                                <div className="w-full flex flex-col items-center gap-2">
                                    {mode === 'profit' ? (
                                        <button
                                            onClick={() => handleUnlock()}
                                            className="w-full group relative flex items-center justify-center gap-3 bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-500 bg-size-[200%_auto] text-white h-12 rounded-2xl font-black text-xs tracking-[0.2em] active:scale-[0.98] transition-all overflow-hidden shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] hover:bg-pos-right will-change-transform cursor-pointer border border-emerald-400/20"
                                        >
                                            <Lock className="w-4 h-4 text-white relative z-10 shrink-0" />
                                            <span className="text-white uppercase relative z-10 whitespace-nowrap">{t('income.profit.unlock_btn')}</span>
                                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer-slide pointer-events-none" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                localStorage.setItem('auto_purchase_pro', 'true');
                                                setTimeout(() => window.dispatchEvent(new Event('trigger-auto-purchase')), 100);
                                                onNavigateToPartner?.();
                                            }}
                                            className="group relative w-full flex items-center justify-center gap-2 bg-linear-to-r from-orange-500 via-amber-500 to-orange-500 bg-size-[200%_auto] text-white h-12 rounded-2xl font-black text-xs tracking-[0.2em] active:scale-[0.98] transition-all overflow-hidden shadow-lg shadow-orange-500/20 hover:scale-[1.01] hover:bg-pos-right cursor-pointer border border-orange-400/20"
                                        >
                                            <span className="relative z-10 flex items-center gap-2 uppercase tracking-[0.2em] text-white">
                                                {t('income.math.cta_urgency')}
                                            </span>
                                            <div className="absolute inset-0 bg-linear-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
                                            <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shimmer-slide" />
                                        </button>
                                    )}
                                    <p className="text-center text-[9px] font-bold text-neutral-500 uppercase tracking-[0.2em] opacity-60 mt-1">
                                        {t('income.cta.beta')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 gap-6 animate-fade-in">
                            {/* Left Column: Compact Referral Graph Node Map */}
                            <m.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="lg:col-span-7 relative w-full h-[480px] rounded-xl overflow-hidden border border-emerald-500/20 shadow-[0_30px_60px_-15px_rgba(16,185,129,0.15)] bg-slate-50 dark:bg-slate-950"
                            >
                                <ReferralGraph targetAmount={estimatedMonthlyRaw} isFullscreen={true} />

                                <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-20 pointer-events-none">
                                    <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg pointer-events-auto">
                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500">{t('income.network.title')}</span>
                                    </div>
                                    <button
                                        onClick={() => setIsStrategyUnlocked(false)}
                                        className="text-label font-bold text-white/70 hover:text-white transition-colors bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg uppercase tracking-widest pointer-events-auto cursor-pointer"
                                    >
                                        {t('income.network.close')}
                                    </button>
                                </div>

                                <div className="absolute top-16 inset-x-0 z-20 pointer-events-none">
                                    <ViralMessages messages={viralMessages} isEnabled={isStrategyUnlocked} />
                                </div>
                            </m.div>

                            {/* Right Column: $1/Min Premium Math Breakdown and Urgency CTAs */}
                            <div ref={mathRef} className="lg:col-span-5 flex flex-col gap-4 lg:border-l lg:border-slate-200 lg:dark:border-white/10 lg:pl-8 justify-between">
                                {/* Column Live Header */}
                                <div className="flex flex-col items-center lg:items-start">
                                    <div className="flex items-center gap-2 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full px-3 py-1 border border-emerald-500/10 mb-2 group hover:bg-emerald-500/15 transition-colors w-fit">
                                        <div className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                        </div>
                                        <span className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 tracking-[0.2em]">{t('marketing:blog.navigation.live')}</span>
                                    </div>

                                    <div className="text-center lg:text-left mb-1">
                                        <div className="flex flex-col items-center lg:items-start justify-center uppercase tracking-[0.2em] font-black leading-none">
                                            <span className="text-[9px] text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                                                {t('marketing:income.math.subheading_part1', 'THE $1/MINUTE STRATEGY')}
                                            </span>
                                        </div>
                                        <h4 className="mt-1 text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight tracking-tight uppercase">
                                            {t('marketing:income.math.heading')}
                                        </h4>
                                    </div>
                                </div>

                                {/* Math Breakdown List */}
                                <div className="space-y-1.5">
                                    {([
                                        { key: 'per_min', amount: '$1', period: t('marketing:income.math.per_min'), highlight: false, delay: 0 },
                                        { key: 'per_hour', amount: '$60', period: t('marketing:income.math.per_hour'), highlight: false, delay: 0.05 },
                                        { key: 'per_day', amount: '$1,440', period: t('marketing:income.math.per_day'), highlight: false, delay: 0.1 },
                                        { key: 'per_month', amount: '$43,200', period: t('marketing:income.math.per_month'), highlight: true, delay: 0.15 },
                                        { key: 'per_year', amount: '$518,400', period: t('marketing:income.math.per_year'), highlight: false, delay: 0.2 },
                                    ] as const).map(({ key, amount, period, highlight, delay }) => (
                                        <m.div
                                            key={key}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={mathVisible ? { opacity: 1, x: 0 } : {}}
                                            transition={{ duration: 0.4, delay }}
                                            className={clsx(
                                                'relative group flex items-center h-10 px-4 rounded-xl border transition-all duration-300',
                                                highlight
                                                    ? 'bg-emerald-500/10 border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                                                    : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10'
                                            )}
                                        >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <ChevronRight className={clsx("w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-1", highlight ? "text-emerald-400" : "text-slate-300 dark:text-white/20")} />
                                                <span className={clsx("text-[10px] sm:text-xs font-black uppercase tracking-tight flex-1", highlight ? "text-emerald-400" : "text-slate-500 dark:text-white/40")}>
                                                    {period}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                <span className={clsx("text-sm sm:text-base font-black tracking-tighter", highlight ? "text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "text-slate-900 dark:text-white")}>
                                                    {amount}
                                                </span>
                                                {highlight && (
                                                    <div className="bg-emerald-500 text-[8px] font-black text-white px-1.5 py-0.5 rounded-md tracking-widest shadow-[0_4px_12px_rgba(16,185,129,0.5)] shrink-0 animate-bounce-subtle">
                                                        {t('marketing:income.math.target_badge')}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer-slide pointer-events-none" />
                                        </m.div>
                                    ))}
                                </div>

                                {/* Bottom Info, Formula, FOMO & CTA */}
                                <div className="flex flex-col gap-3">
                                    <div className="text-[9px] text-center text-slate-400 dark:text-white/25 font-mono tracking-widest uppercase">
                                        {t('marketing:income.math.formula_note')}
                                    </div>

                                    {/* FOMO Alert banner */}
                                    <div className="w-full bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 flex items-center gap-2.5 group">
                                        <div className="relative flex h-1.5 w-1.5 shrink-0">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.4)]" />
                                        </div>
                                        <p className="text-[9px] sm:text-[10px] font-black text-rose-400 uppercase leading-normal tracking-wide group-hover:text-rose-300 transition-colors">
                                            {t('marketing:income.math.fomo_line')}
                                        </p>
                                    </div>

                                    {/* Urgency CTA */}
                                    <m.button
                                        whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            localStorage.setItem('auto_purchase_pro', 'true');
                                            setTimeout(() => window.dispatchEvent(new Event('trigger-auto-purchase')), 100);
                                            onNavigateToPartner?.();
                                        }}
                                        className="w-full bg-linear-to-r from-orange-500 via-orange-600 to-orange-500 bg-size-[200%_auto] hover:bg-pos-right text-white font-black h-11 rounded-xl text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 shadow-2xl shadow-orange-500/30 transition-all duration-500 uppercase group cursor-pointer"
                                    >
                                        {t('marketing:income.math.cta_urgency')}
                                    </m.button>

                                    {/* Social Proof Stats */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                {[
                                                    "https://randomuser.me/api/portraits/women/44.jpg",
                                                    "https://randomuser.me/api/portraits/men/32.jpg",
                                                    "https://randomuser.me/api/portraits/women/68.jpg",
                                                    "https://randomuser.me/api/portraits/men/45.jpg"
                                                ].map((url, i) => (
                                                    <div key={i} className="w-6 h-6 rounded-full border border-white dark:border-slate-900 bg-slate-200 overflow-hidden shadow-sm">
                                                        <img src={url} alt="user" className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="text-left leading-none">
                                                <div className="text-[9px] font-bold text-slate-900 dark:text-white">
                                                    <span className="vibing-crystal-text animate-text-shimmer">{t('marketing:income.math.people_joining_count', '721+ PARTNERS', { val: '721+' })}</span>
                                                </div>
                                                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                                    <span className="vibing-crystal-text animate-text-shimmer">{t('marketing:income.math.joined_protocol', 'JOINED AI MARKETING PROTOCOL')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-right">
                                            <div className="flex flex-col leading-none">
                                                <span className="text-[9px] font-black text-slate-900 dark:text-white">{liveCount}</span>
                                                <span className="text-[7px] font-black text-slate-400 dark:text-white/30 uppercase tracking-tighter">{t('marketing:income.math.online_badge')}</span>
                                            </div>
                                            <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
                                            <div className="flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                <span className="text-amber-500/80 font-black text-[8px] tracking-tight uppercase whitespace-nowrap">
                                                    {t('marketing:income.math.spots_left', { count: slotsLeft })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </m.div>
            {/* Info Modals Portal */}
            {
                typeof document !== 'undefined' && ReactDOM.createPortal(
                    <AnimatePresence>
                        {activeModal && (
                            <>
                                <m.div
                                    key="modal-backdrop"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setActiveModal(null)}
                                    className="fixed inset-0 z-9999 bg-black/60 backdrop-blur-sm"
                                />
                                <div className="fixed inset-0 z-10000 flex items-center justify-center p-4 pointer-events-none">
                                    <m.div
                                        key="modal-content"
                                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                        className="pointer-events-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
                                        <div className="relative z-10 space-y-4">
                                            {activeModal === 'market' && (
                                                <>
                                                    <div className="relative">
                                                        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
                                                            <TrendingUp className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div className="absolute -top-1 -right-1">
                                                            <span className="relative flex h-3 w-3">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <h3 className="text-xl font-bold text-white leading-tight">
                                                        <Trans t={t} i18nKey="income_details.market_title" ns="marketing">
                                                            The Largest Wealth Transfer inside the <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-400">Digital Economy</span>
                                                        </Trans>
                                                    </h3>

                                                    <div className="space-y-3 py-2">
                                                        <p className="text-sm text-slate-300 leading-relaxed">
                                                            <Trans t={t} i18nKey="income_details.market_desc" ns="marketing">
                                                                Crypto adoption is growing <span className="text-white font-bold">2x faster</span> than the Internet did in the 90s.
                                                            </Trans>
                                                        </p>
                                                        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                                            <div className="flex justify-between items-center text-xs mb-1">
                                                                <span className="text-slate-400">{t('income_details.adoption_curve')}</span>
                                                                <span className="text-emerald-400 font-bold">{t('income_details.you_are_here')}</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                                                <div className="h-full w-[15%] bg-blue-500 rounded-full relative">
                                                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 animate-pulse"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => setActiveModal(null)}
                                                        className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all hover:scale-[1.02] text-xs tracking-wider uppercase border border-slate-700"
                                                    >
                                                        {t('income_details.maximize_btn')}
                                                    </button>
                                                </>
                                            )}

                                            {activeModal === 'revenue' && (
                                                <>
                                                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/25">
                                                        <DollarSign className="w-6 h-6 text-white" />
                                                    </div>

                                                    <h3 className="text-xl font-bold text-white leading-tight">
                                                        <Trans t={t} i18nKey="income_details.revenue_title" ns="marketing">
                                                            Unlock <span className="text-emerald-400">True Passive Income</span>
                                                        </Trans>
                                                    </h3>

                                                    <p className="text-xs text-slate-400 font-medium">
                                                        {t('income_details.revenue_desc')}
                                                    </p>

                                                    <div className="space-y-2.5 my-2">
                                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                                            <div className="mt-0.5 p-1 rounded-full bg-emerald-500/10">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            </div>
                                                            <div>
                                                                <h5 className="text-sm font-bold text-white">{t('income_details.benefit_1_title')}</h5>
                                                                <p className="text-label text-slate-400 uppercase tracking-wide">{t('income_details.benefit_1_desc')}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                                            <div className="mt-0.5 p-1 rounded-full bg-blue-500/10">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                            </div>
                                                            <div>
                                                                <h5 className="text-sm font-bold text-white">{t('income_details.benefit_2_title')}</h5>
                                                                <p className="text-label text-slate-400 uppercase tracking-wide">{t('income_details.benefit_2_desc')}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                                            <div className="mt-0.5 p-1 rounded-full bg-purple-500/10">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                                            </div>
                                                            <div>
                                                                <h5 className="text-sm font-bold text-white">{t('income_details.benefit_3_title')}</h5>
                                                                <p className="text-label text-slate-400 uppercase tracking-wide">{t('income_details.benefit_3_desc')}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            localStorage.setItem('auto_purchase_pro', 'true');
                                                            setTimeout(() => window.dispatchEvent(new Event('trigger-auto-purchase')), 100);
                                                            setActiveModal(null);
                                                            onNavigateToPartner?.();
                                                        }}
                                                        className="w-full py-3.5 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                                    >
                                                        {t('income_details.start_earning')}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </m.div>
                                </div>
                            </>
                        )}
                    </AnimatePresence>,
                    document.body
                )
            }
        </section >
    );
};
