import { m, AnimatePresence } from 'framer-motion';
import ReactDOM from 'react-dom';
import { TrendingUp, Users, DollarSign, ArrowRight, Calculator, Clock, AlertCircle, Lock, Flame, ChevronRight, Zap } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
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
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
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

    useEffect(() => {
        if (!isStrategyUnlocked) return;
        const interval = setInterval(() => {
            setCurrentMessageIndex((prev) => (prev + 1) % viralMessages.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [isStrategyUnlocked, viralMessages.length]);

    // Profit Math
    const estimatedMonthlyRaw = activePartners * 45;
    const estimatedMonthly = estimatedMonthlyRaw.toLocaleString();

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

    return (
        <section className="px-4 py-8">
            <m.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.01 }}
                className="relative overflow-hidden rounded-[2.5rem] md:rounded-[3rem] bg-white dark:bg-bg-app text-slate-900 dark:text-white p-5 md:p-8 flex flex-col gap-8 border border-slate-200 dark:border-white/10 shadow-premium dark:shadow-[0_20px_50px_-12px_rgba(59,130,246,0.2)]"
            >
                {/* Background Glow */}
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-600/20 blur-[120px] pointer-events-none animate-pulse" />
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-600/10 blur-[120px] pointer-events-none" />

                <div className="space-y-6 relative z-10 flex flex-col items-center text-center">
                    <m.div
                        className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/5 backdrop-blur-sm px-3 py-1.5"
                        animate={{
                            boxShadow: ["0 0 0px rgba(59, 130, 246, 0)", "0 0 15px rgba(59, 130, 246, 0.4)", "0 0 0px rgba(59, 130, 246, 0)"],
                            borderColor: ["rgba(59, 130, 246, 0.3)", "rgba(59, 130, 246, 0.8)", "rgba(59, 130, 246, 0.3)"]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-label font-black uppercase tracking-[0.2em] text-blue-500">
                            {t('income.badge')}
                        </span>
                    </m.div>

                    <h3 className="text-3xl font-black tracking-tight leading-none max-w-[340px] mx-auto">
                        {t('income.title')} <br />
                        <span className="text-blue-500 animate-text-shimmer dark:text-transparent dark:bg-clip-text dark:bg-linear-to-r dark:from-blue-400 dark:via-emerald-400 dark:to-blue-400">{t('income.title_highlight')}</span>
                    </h3>
                    <div className="relative">
                        <p className="text-sm text-slate-600 dark:text-white font-medium leading-relaxed max-w-[360px] mx-auto">
                            <Trans i18nKey="income.desc">
                                Traditional finance is a <span className="text-blue-600 dark:text-blue-400 font-bold">walled garden</span>.
                                As a <span className="text-slate-900 dark:text-white font-black">Pintopay Partner</span>, you are the bridge.
                                Every global transaction becomes your dividends.
                            </Trans>
                        </p>
                    </div>
                </div>


                {/* Dual Mode Calculator / Unlocked Network Status */}
                <div className={clsx(
                    "p-6 rounded-2xl md:rounded-[2.5rem] relative z-10 backdrop-blur-md transition-all duration-700 border flex flex-col gap-6",
                    !isStrategyUnlocked
                        ? "bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-white/10"
                        : "bg-white/40 dark:bg-[#020805]/80 border-emerald-500/20 shadow-[0_30px_60px_-15px_rgba(16,185,129,0.15)]"
                )}>
                    {!isStrategyUnlocked ? (
                        <>
                            {/* Mode Toggle */}
                            <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-white/10">
                                <button
                                    onClick={() => setMode('profit')}
                                    className={`flex-1 py-1.5 rounded-md text-label font-black uppercase tracking-wide transition-all ${mode === 'profit' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-white/5'}`}
                                >
                                    {t('income.modes.profit')}
                                </button>
                                <button
                                    onClick={() => setMode('inaction')}
                                    className={`flex-1 py-1.5 rounded-md text-label font-black uppercase tracking-wide transition-all ${mode === 'inaction' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-white/5'}`}
                                >
                                    {t('income.modes.inaction')}
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
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calculator className="w-4 h-4 text-blue-500" />
                                            <span className="text-label font-black uppercase tracking-widest opacity-60">{t('income.profit.projector')}</span>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('income.profit.active_partners')}</span>
                                                <span className="text-xl font-black text-blue-500">{activePartners}</span>
                                            </div>
                                            <div className="relative h-6 flex items-center">
                                                <input
                                                    type="range"
                                                    min="5"
                                                    max="960"
                                                    value={activePartners}
                                                    onChange={(e) => setActivePartners(parseInt(e.target.value))}
                                                    className="range-input-premium"
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col gap-6 bg-white/5 dark:bg-black/5 -mx-4 px-4 rounded-xl">
                                            <div className="flex justify-between items-center bg-white/10 dark:bg-white/5 p-3 rounded-xl border border-slate-200/50 dark:border-white/10">
                                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('income.profit.monthly_income')}</span>
                                                <span className="text-3xl font-black text-emerald-500 tracking-tight drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">${estimatedMonthly}</span>
                                            </div>

                                            <button
                                                onClick={() => handleUnlock()}
                                                className="w-full group relative flex items-center justify-center gap-2 acid-blue-liquid h-14 rounded-2xl font-black text-sm tracking-widest active:scale-[0.98] transition-all overflow-hidden shadow-lg shadow-blue-500/20"
                                            >
                                                <Lock className="w-4 h-4 text-white" />
                                                <span className="text-white uppercase">{t('income.profit.unlock_btn')}</span>
                                                <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shimmer-slide" />
                                            </button>
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
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-4 h-4 text-rose-500" />
                                            <span className="text-label font-black uppercase tracking-widest opacity-60">{t('income.inaction.projector')}</span>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('income.inaction.status')}</label>
                                                <div className="relative">
                                                    <select
                                                        value={selectedLevel.id}
                                                        onChange={(e) => setSelectedLevel(JOB_LEVELS.find(l => l.id === e.target.value) || JOB_LEVELS[2])}
                                                        className="w-full appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs font-bold rounded-xl px-4 py-3 focus:outline-hidden focus:ring-2 focus:ring-rose-500/50"
                                                    >
                                                        {JOB_LEVELS.map((level) => (
                                                            <option key={level.id} value={level.id}>
                                                                {level.label} (${level.rate}/hr)
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                        <ArrowRight className="w-3 h-3 rotate-90 opacity-50" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('income.inaction.hours')}</span>
                                                    <span className="text-label font-black text-rose-500">{hoursWorked} Hours</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="16"
                                                    value={hoursWorked}
                                                    onChange={(e) => setHoursWorked(parseInt(e.target.value))}
                                                    className="range-input-premium"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-6 text-center space-y-4">
                                            <div className="space-y-1">
                                                <div className="text-label font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 opacity-60">
                                                    {t('income.inaction.value_per_min')}
                                                </div>
                                                <div className={`text-4xl font-black transition-colors duration-300 ${currentValPerMin >= 1
                                                    ? 'text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                                    : 'text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                                                    }`}>
                                                    ${currentValPerMin.toFixed(4)}
                                                </div>
                                            </div>

                                            <div className="p-3 rounded-2xl bg-[#1A103C] border border-white/5 shadow-inner">
                                                <div className="text-label font-black uppercase tracking-[0.2em] text-white/60 mb-0.5">
                                                    {t('income.inaction.daily_loss')}
                                                </div>
                                                <div className="text-2xl font-black text-white">
                                                    ${displayLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        </div>
                                    </m.div>
                                )}
                            </AnimatePresence>
                        </>
                    ) : (
                        <m.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                    <span className="text-label font-black uppercase tracking-widest text-emerald-500">{t('income.network.title')}</span>
                                </div>
                                <button
                                    onClick={() => setIsStrategyUnlocked(false)}
                                    className="text-label font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                    {t('income.network.close')}
                                </button>
                            </div>

                            <ReferralGraph />

                            <div className="text-center h-12 flex items-center justify-center">
                                <AnimatePresence mode="wait">
                                    <m.p
                                        key={currentMessageIndex}
                                        initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                        exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                        className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-tight max-w-[280px]"
                                    >
                                        {viralMessages[currentMessageIndex]}
                                    </m.p>
                                </AnimatePresence>
                            </div>
                        </m.div>
                    )}
                </div>

                {/* ──────────────── $1/MIN MATH BREAKDOWN ──────────────── */}
                <AnimatePresence>
                    {showMathSection && (
                        <m.div
                            initial={{ opacity: 0, height: 0, scale: 0.95 }}
                            animate={{ opacity: 1, height: 'auto', scale: 1 }}
                            exit={{ opacity: 0, height: 0, scale: 0.95 }}
                            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                            className="overflow-hidden"
                        >
                            <div ref={mathRef} className="relative z-10 overflow-hidden rounded-2xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-linear-to-br dark:from-slate-900/90 dark:via-[#0a1a0f]/90 dark:to-slate-900/90 p-4 space-y-2 shadow-premium dark:shadow-[0_15px_40px_-10px_rgba(16,185,129,0.15)] mb-4">
                                {/* Ambient glow */}
                                <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 dark:bg-emerald-500/20 blur-[60px] rounded-full pointer-events-none" />
                                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />

                                {/* Header: Structured and Centered */}
                                <div className="relative flex flex-col items-center text-center pt-2 mb-4">
                                    {/* Pulsing live dot - Centered Above Subheading */}
                                    <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-full px-2.5 py-0.5 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.1)] mb-3">
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                        </span>
                                        <span className="text-label font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">LIVE</span>
                                    </div>

                                    <div className="max-w-[85%] space-y-1.5">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <Zap className="w-3 h-3 text-emerald-500 dark:text-emerald-400 animate-pulse shrink-0" />
                                            <span className="text-label font-black uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400 leading-tight">
                                                {t('income.math.subheading')}
                                            </span>
                                        </div>
                                        <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight drop-shadow-sm">
                                            {t('income.math.heading')}
                                        </h4>
                                    </div>
                                </div>

                                {/* THE MATH ROWS */}
                                {([
                                    { key: 'per_min', amount: '$1', period: '/min', highlight: false, delay: 0 },
                                    { key: 'per_hour', amount: '$60', period: '/hr', highlight: false, delay: 0.08 },
                                    { key: 'per_day', amount: '$1,440', period: '/day', highlight: false, delay: 0.16 },
                                    { key: 'per_month', amount: '$43,200', period: '/month', highlight: true, delay: 0.24 },
                                    { key: 'per_year', amount: '$518,400', period: '/year', highlight: false, delay: 0.32 },
                                ] as const).map(({ key, amount, period, highlight, delay }, idx, arr) => (
                                    <m.div
                                        key={key}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={mathVisible ? { opacity: 1, x: 0 } : {}}
                                        transition={{ duration: 0.5, delay, ease: 'circOut' }}
                                        className={clsx(
                                            'relative flex items-center justify-between rounded-xl px-3 py-2 border transition-all',
                                            highlight
                                                ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/40 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                                                : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/8'
                                        )}
                                    >
                                        {/* Left: row label */}
                                        <div className="flex items-center gap-2">
                                            {highlight ? (
                                                <Flame className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                                            ) : (
                                                <ChevronRight className="w-3 h-3 text-slate-300 dark:text-white/20 shrink-0" />
                                            )}
                                            <span className={clsx(
                                                'text-label font-bold',
                                                highlight ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-white/50'
                                            )}>
                                                {t(`income.math.${key}`)}
                                            </span>
                                        </div>

                                        {highlight && (
                                            <div className="absolute -top-px -right-px bg-emerald-500 text-label font-black uppercase tracking-wider text-white px-1.5 py-0.5 rounded-tr-xl rounded-bl-lg">
                                                TARGET
                                            </div>
                                        )}
                                    </m.div>
                                ))}

                                {/* Formula note */}
                                <m.div
                                    initial={{ opacity: 0 }}
                                    animate={mathVisible ? { opacity: 1 } : {}}
                                    transition={{ delay: 0.5 }}
                                    className="text-center -mt-1"
                                >
                                    <span className="text-label text-slate-400 dark:text-white/20 font-mono">{t('income.math.formula_note')}</span>
                                </m.div>

                                {/* FOMO red bar */}
                                <m.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={mathVisible ? { opacity: 1, y: 0 } : {}}
                                    transition={{ delay: 0.55 }}
                                    className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25"
                                >
                                    <span className="relative flex h-2.5 w-2.5 mt-0.5 shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                                    </span>
                                    <p className="text-label font-bold text-rose-700 dark:text-rose-300 leading-snug">
                                        {t('income.math.fomo_line')}
                                    </p>
                                </m.div>

                                {/* Live social proof */}
                                <div className="pt-1.5 flex flex-col gap-3">
                                    <div className="flex items-center justify-between bg-slate-50 dark:bg-white/5 rounded-2xl px-3 py-2 border border-slate-200 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex -space-x-2">
                                                {displayAvatars.map((avatar, i) => {
                                                    const src = avatar.file_id
                                                        ? `${getApiUrl()}/api/partner/photo/${avatar.file_id}`
                                                        : avatar.url;
                                                    return (
                                                        <div key={i} className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 shadow-lg">
                                                            <img
                                                                src={src}
                                                                alt="Partner"
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    // Fallback if image fails to load
                                                                    e.currentTarget.src = `https://randomuser.me/api/portraits/women/${40 + i}.jpg`;
                                                                }}
                                                            />
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1">
                                                    <AnimatePresence mode="wait">
                                                        <m.span
                                                            key={liveCount}
                                                            initial={{ y: -5, opacity: 0 }}
                                                            animate={{ y: 0, opacity: 1 }}
                                                            exit={{ y: 5, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="text-xs font-black text-slate-900 dark:text-white leading-none"
                                                        >
                                                            {liveCount.toLocaleString()}
                                                        </m.span>
                                                    </AnimatePresence>
                                                    <span className="text-label font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">online</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-500/20">
                                                <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                                                <span className="text-amber-600 dark:text-amber-500 font-black text-label tracking-tight">
                                                    {t('income.math.spots_left', { count: slotsLeft })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <m.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => {
                                            localStorage.setItem('auto_purchase_pro', 'true');
                                            setTimeout(() => window.dispatchEvent(new Event('trigger-auto-purchase')), 100);
                                            onNavigateToPartner?.();
                                        }}
                                        className="bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-extrabold h-10 rounded-xl text-label tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all uppercase"
                                    >
                                        {t('income.math.cta_urgency')}
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </m.button>
                                </div>
                            </div>
                        </m.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-2 gap-4 relative z-0">
                    <div className="glass-panel-premium p-5 rounded-[2rem] flex flex-col gap-4 group transition-all hover:scale-[1.02] duration-500">
                        <div className="flex justify-between items-start">
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-500 shrink-0" />
                            </div>
                            <button onClick={() => setActiveModal('market')} className="text-slate-400 dark:text-white/20 hover:text-blue-400 mt-1">
                                <AlertCircle className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-1 min-w-0">
                            <div className="text-2xl sm:text-3xl font-black tabular-nums text-slate-900 dark:text-white tracking-tight drop-shadow-sm">1.2B</div>
                            <div className="text-[10px] sm:text-label font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] leading-none truncate">{t('income.stats.global_target')}</div>
                        </div>
                    </div>

                    <div className="glass-panel-premium p-5 rounded-[2rem] flex flex-col gap-4 group transition-all hover:scale-[1.02] duration-500">
                        <div className="flex justify-between items-start">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-emerald-500 shrink-0" />
                            </div>
                            <button onClick={() => setActiveModal('revenue')} className="text-slate-400 dark:text-white/20 hover:text-emerald-400 mt-1">
                                <AlertCircle className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-1 min-w-0">
                            <div className="text-2xl sm:text-3xl font-black tabular-nums text-slate-900 dark:text-white tracking-tight drop-shadow-sm">24/7</div>
                            <div className="text-[10px] sm:text-label font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] leading-none truncate">{t('income.stats.revenue')}</div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mx-1 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-500/20 dark:border-white/10 backdrop-blur-2xl mt-4 md:mt-8 overflow-hidden group shadow-sm dark:shadow-[0_20px_40px_-20px_rgba(244,63,94,0.15)]">
                    {/* Liquid Background Layer */}
                    <div className="absolute inset-0 bg-linear-to-br from-rose-500/10 via-transparent to-indigo-500/10 opacity-30 pointer-events-none animate-liquid-fast" />
                    <div className="absolute -inset-full bg-linear-to-tr from-rose-500/5 via-fuchsia-500/5 to-indigo-500/5 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity animate-liquid" />

                    <div className="flex gap-4 relative z-10">
                        <div className="shrink-0 pt-1">
                            <div className="w-1.5 h-12 rounded-full bg-linear-to-b from-rose-500 via-rose-600 to-indigo-600 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-vibing" />
                        </div>
                        <div className="space-y-1.5">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                {t('income.waiting.title')}
                            </h4>
                            <div className="text-label leading-relaxed text-slate-600 dark:text-slate-200 font-medium">
                                <Trans i18nKey="income.waiting.desc">
                                    While you trade hours for a fixed wage, the Digital Economy generates value 24/7.
                                    <span className="block my-3 bg-linear-to-r from-rose-500 via-fuchsia-500 to-rose-500 bg-clip-text text-transparent font-black bg-size-[200%_auto] animate-text-shimmer dark:drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                                        Every minute you wait is a tax on your potential
                                    </span>
                                    <span className="block opacity-80 dark:text-slate-300">
                                        Unlock the strategy to stop calculating loss and start capturing value.
                                    </span>
                                </Trans>
                            </div>
                        </div>
                    </div>
                </div>

                {!isStrategyUnlocked ? (
                    <div className="pt-4 relative z-10">
                        <button
                            onClick={() => {
                                localStorage.setItem('auto_purchase_pro', 'true');
                                setTimeout(() => window.dispatchEvent(new Event('trigger-auto-purchase')), 100);
                                onNavigateToPartner?.();
                            }}
                            className="group relative w-full flex items-center justify-center gap-2 vibing-blue-animated h-14 px-8 rounded-full font-black text-sm active:scale-[0.98] transition-all overflow-hidden shadow-[0_15px_30px_-5px_rgba(0,102,255,0.3)] hover:brightness-110"
                        >
                            <span className="relative z-10 flex items-center gap-2 uppercase tracking-widest">
                                {t('income.math.cta_urgency')}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                            </span>
                            {/* Glass overlay */}
                            <div className="absolute inset-0 bg-linear-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
                            <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shimmer-slide" />
                        </button>
                        <p className="text-center mt-6 text-label font-bold text-neutral-500 uppercase tracking-[0.2em] opacity-60">
                            {t('income.cta.beta')}
                        </p>
                    </div>
                ) : (
                    /* Post-Unlock Content: "Lead the Market" Button Redesign */
                    <div className="pt-4 relative z-10 text-center">
                        <m.button
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="group relative w-full flex items-center justify-center gap-2 emerald-liquid-gradient h-11 px-8 rounded-full font-black text-label tracking-widest shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all overflow-hidden animate-liquid"
                        >
                            {t('income.cta.lead')}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                            <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shimmer-slide" />
                        </m.button>
                        <p className="mt-4 text-label font-bold text-emerald-500 uppercase tracking-[0.2em] opacity-80">
                            {t('income.cta.unlocked')}
                        </p>

                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center justify-center gap-4">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map(i => {
                                        const gender = i % 2 === 0 ? 'men' : 'women';
                                        return (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 overflow-hidden shadow-sm">
                                                <img src={`https://randomuser.me/api/portraits/${gender}/${i + 20}.jpg`} alt="user" className="w-full h-full object-cover" />
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="text-left">
                                    <div className="text-label font-black text-slate-900 dark:text-white leading-none">12,402+ PARTNERS</div>
                                    <div className="text-label font-bold text-slate-500 uppercase tracking-wider">JOINED THE $1/MIN PROTOCOL TODAY</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
                                        className="pointer-events-auto bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-sm w-full shadow-2xl relative overflow-hidden"
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

                                                    <h3 className="text-xl font-black text-white leading-tight">
                                                        <Trans i18nKey="income_details.market_title">
                                                            The Largest Wealth Transfer inside the <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-400">Digital Economy</span>
                                                        </Trans>
                                                    </h3>

                                                    <div className="space-y-3 py-2">
                                                        <p className="text-sm text-slate-300 leading-relaxed">
                                                            <Trans i18nKey="income_details.market_desc">
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

                                                    <h3 className="text-xl font-black text-white leading-tight">
                                                        <Trans i18nKey="income_details.revenue_title">
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
                                                            setActiveModal(null);
                                                            onNavigateToPartner?.();
                                                        }}
                                                        className="w-full py-3.5 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                                    >
                                                        {t('income_details.start_earning')} <ArrowRight className="w-4 h-4" />
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
