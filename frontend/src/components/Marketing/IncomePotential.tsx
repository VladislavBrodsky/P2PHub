import { motion, AnimatePresence } from 'framer-motion';
import ReactDOM from 'react-dom';
import { TrendingUp, Users, DollarSign, ArrowRight, Calculator, Clock, AlertCircle, Lock } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ReferralGraph } from './ReferralGraph';
import { useTranslation, Trans } from 'react-i18next';

type CalculatorMode = 'profit' | 'inaction';

interface IncomePotentialProps {
    onNavigateToPartner?: () => void;
}

export const IncomePotential = ({ onNavigateToPartner }: IncomePotentialProps) => {
    const { t } = useTranslation();

    const JOB_LEVELS = useMemo(() => [
        { id: 'student', label: t('income.levels.student'), rate: 0 },
        { id: 'entry', label: t('income.levels.entry'), rate: 15 },
        { id: 'pro', label: t('income.levels.pro'), rate: 30 },
        { id: 'manager', label: t('income.levels.manager'), rate: 60 },
        { id: 'exec', label: t('income.levels.exec'), rate: 120 }
    ], [t]);

    const [mode, setMode] = useState<CalculatorMode>('profit');
    const [activeModal, setActiveModal] = useState<'market' | 'revenue' | null>(null);
    const [activePartners, setActivePartners] = useState(50);
    const [selectedLevel, setSelectedLevel] = useState(JOB_LEVELS[2]); // Default to Professional
    const [hoursWorked, setHoursWorked] = useState(8);
    const [isStrategyUnlocked, setIsStrategyUnlocked] = useState(false);

    const handleUnlock = () => {
        setIsStrategyUnlocked(true);
    };

    // Profit Math
    const estimatedMonthly = (activePartners * 45).toLocaleString();

    // Inaction Math
    const p2pDailyPotential = 1440;
    const currentDailyIncome = selectedLevel.rate * hoursWorked;
    const currentValPerMin = currentDailyIncome / 1440;
    const dailyLoss = p2pDailyPotential - currentDailyIncome;
    const displayLoss = dailyLoss > 0 ? dailyLoss : 0;

    return (
        <section className="px-4 py-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.01 }}
                className="relative overflow-hidden rounded-[3.5rem] bg-(--color-bg-surface) dark:bg-neutral-950 text-(--color-text-primary) dark:text-white p-6 md:p-10 space-y-10 border border-(--color-border-glass) shadow-premium dark:shadow-[0_20px_50px_-12px_rgba(59,130,246,0.2)]"
            >
                {/* Background Glow */}
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-600/30 blur-[120px] pointer-events-none animate-pulse" />
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-600/20 blur-[120px] pointer-events-none" />

                <div className="space-y-6 relative z-10">
                    <motion.div
                        className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/5 backdrop-blur-sm px-3 py-1.5"
                        animate={{
                            boxShadow: ["0 0 0px rgba(59, 130, 246, 0)", "0 0 15px rgba(59, 130, 246, 0.4)", "0 0 0px rgba(59, 130, 246, 0)"],
                            borderColor: ["rgba(59, 130, 246, 0.3)", "rgba(59, 130, 246, 0.8)", "rgba(59, 130, 246, 0.3)"]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500">
                            {t('income.badge')}
                        </span>
                    </motion.div>

                    <h3 className="text-4xl font-black tracking-tight leading-none max-w-[280px]">
                        {t('income.title')} <br />
                        <span className="text-blue-500 dark:text-transparent dark:bg-clip-text dark:bg-linear-to-r dark:from-blue-400 dark:via-emerald-400 dark:to-blue-400 dark:text-animate-shimmer">{t('income.title_highlight')}</span>
                    </h3>
                    <div className="relative">
                        <div className="absolute -left-4 top-0 w-1 h-full bg-linear-to-b from-blue-500 to-transparent opacity-50 rounded-full" />
                        <p className="text-sm text-slate-600 dark:text-white font-medium leading-relaxed max-w-[340px] pl-2">
                            <Trans i18nKey="income.desc">
                                Traditional finance is a <span className="text-blue-600 dark:text-blue-400 font-bold">walled garden</span>.
                                As a <span className="text-slate-900 dark:text-white font-black underline decoration-blue-500/30 underline-offset-4">Pintopay Partner</span>, you are the bridge.
                                Every global transaction becomes your dividends.
                            </Trans>
                        </p>
                    </div>
                </div>

                {/* Dual Mode Calculator */}
                <div className="p-6 rounded-[2.5rem] bg-(--color-bg-app)/50 border border-(--color-border-glass) space-y-6 relative z-10 backdrop-blur-md transition-all duration-500">
                    {!isStrategyUnlocked ? (
                        <>
                            {/* Mode Toggle */}
                            <div className="flex p-0.5 bg-(--color-bg-surface) rounded-lg border border-(--color-border-glass)">
                                <button
                                    onClick={() => setMode('profit')}
                                    className={`flex-1 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wide transition-all ${mode === 'profit' ? 'bg-blue-500 text-white shadow-md' : 'text-(--color-text-secondary) hover:bg-white/5'}`}
                                >
                                    {t('income.modes.profit')}
                                </button>
                                <button
                                    onClick={() => setMode('inaction')}
                                    className={`flex-1 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wide transition-all ${mode === 'inaction' ? 'bg-rose-500 text-white shadow-md' : 'text-(--color-text-secondary) hover:bg-white/5'}`}
                                >
                                    {t('income.modes.inaction')}
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                {mode === 'profit' ? (
                                    <motion.div
                                        key="profit"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calculator className="w-4 h-4 text-blue-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{t('income.profit.projector')}</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs font-bold text-(--color-text-secondary)">{t('income.profit.active_partners')}</span>
                                                <span className="text-xl font-black text-blue-500">{activePartners}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="5"
                                                max="500"
                                                value={activePartners}
                                                onChange={(e) => setActivePartners(parseInt(e.target.value))}
                                                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                            />
                                        </div>
                                        <div className="pt-4 border-t border-(--color-border-glass)">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-xs font-semibold text-(--color-text-secondary)">{t('income.profit.monthly_income')}</span>
                                                <span className="text-2xl font-black text-emerald-500">${estimatedMonthly}</span>
                                            </div>

                                            {/* UNLOCK STRATEGY BUTTON REDESIGN (v3 - ACID BLUE LIQUID) */}
                                            <button
                                                onClick={handleUnlock}
                                                className="w-full group relative flex items-center justify-center gap-2 acid-blue-liquid h-11 rounded-full font-black text-[11px] tracking-widest active:scale-[0.98] transition-all overflow-hidden animate-vibing"
                                            >
                                                <Lock className="w-3.5 h-3.5 mb-0.5 text-white" />
                                                <span className="text-white">{t('income.profit.unlock_btn')}</span>
                                                <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:animate-shimmer" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="inaction"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-6"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-4 h-4 text-rose-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{t('income.inaction.projector')}</span>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-(--color-text-secondary)">{t('income.inaction.status')}</label>
                                                <div className="relative">
                                                    <select
                                                        value={selectedLevel.id}
                                                        onChange={(e) => setSelectedLevel(JOB_LEVELS.find(l => l.id === e.target.value) || JOB_LEVELS[2])}
                                                        className="w-full appearance-none bg-(--color-bg-surface) border border-(--color-border-glass) text-(--color-text-primary) text-xs font-bold rounded-xl px-4 py-3 focus:outline-hidden focus:ring-2 focus:ring-rose-500/50"
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
                                                    <span className="text-xs font-bold text-(--color-text-secondary)">{t('income.inaction.hours')}</span>
                                                    <span className="text-[10px] font-black text-rose-500">{hoursWorked} Hours</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="16"
                                                    value={hoursWorked}
                                                    onChange={(e) => setHoursWorked(parseInt(e.target.value))}
                                                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-6 text-center space-y-4">
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-(--color-text-secondary) opacity-60">
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
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-0.5">
                                                    {t('income.inaction.daily_loss')}
                                                </div>
                                                <div className="text-2xl font-black text-white">
                                                    ${displayLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{t('income.network.title')}</span>
                                </div>
                                <button
                                    onClick={() => setIsStrategyUnlocked(false)}
                                    className="text-[10px] font-bold text-slate-400 hover:text-white"
                                >
                                    {t('income.network.close')}
                                </button>
                            </div>

                            <ReferralGraph />

                            <div className="text-center space-y-2">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {t('income.network.desc')}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 relative z-10">
                    <div className="p-5 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/80 border border-blue-500/10 dark:border-white/10 backdrop-blur-xl space-y-3 group transition-all hover:bg-blue-500/5 relative overflow-hidden shadow-sm dark:shadow-[0_10px_30px_-15px_rgba(59,130,246,0.3)]">
                        {/* Glow effect for dark mode */}
                        <div className="absolute -top-10 -right-10 w-20 h-20 bg-blue-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex justify-between items-start mb-2">
                            <Users className="w-5 h-5 text-slate-400 dark:text-blue-400 group-hover:text-blue-500 transition-colors" />
                        </div>

                        <div className="mb-4">
                            <div className="text-3xl font-black tabular-nums tracking-tighter text-slate-900 dark:text-white dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">1.2B</div>
                            <div className="text-[9px] font-black text-slate-500 dark:text-blue-300/80 uppercase tracking-[0.2em] mb-1">{t('income.stats.global_target')}</div>
                            <div className="text-[9px] font-medium text-slate-400 dark:text-slate-300 leading-tight">
                                {t('income.stats.scaling')}
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                                <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tighter whitespace-nowrap">+17% YoY</span>
                            </div>
                            <button onClick={() => setActiveModal('market')} className="text-slate-300 dark:text-white/20 hover:text-blue-400 transition-colors">
                                <AlertCircle className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="p-5 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/80 border border-blue-500/10 dark:border-white/10 backdrop-blur-xl space-y-2 group transition-all hover:bg-blue-500/5 shadow-sm dark:shadow-[0_10px_30px_-15px_rgba(16,185,129,0.3)] relative overflow-hidden">
                        <DollarSign className="w-5 h-5 text-emerald-500 dark:text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                        <div className="text-3xl font-black tabular-nums tracking-tighter text-slate-900 dark:text-white dark:drop-shadow-[0_0_15px_rgba(52,211,153,0.2)]">24/7</div>
                        <div className="text-[9px] font-black text-slate-500 dark:text-emerald-300/80 uppercase tracking-[0.2em]">{t('income.stats.revenue')}</div>
                        <div className="text-[9px] font-medium text-slate-400 dark:text-slate-300 leading-tight">
                            {t('income.stats.dividends')}
                        </div>
                        <button onClick={() => setActiveModal('revenue')} className="absolute bottom-3 right-3 text-slate-300 dark:text-white/20 hover:text-emerald-400 transition-colors">
                            <AlertCircle className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="relative z-10 mx-2 p-5 rounded-[2rem] bg-slate-50/80 dark:bg-slate-900/80 border border-rose-500/10 dark:border-white/10 backdrop-blur-2xl mt-4 overflow-hidden group shadow-sm dark:shadow-[0_20px_40px_-20px_rgba(244,63,94,0.15)]">
                    {/* Inner Accent Glow */}
                    <div className="absolute top-0 right-0 w-32 h-full bg-rose-500/5 blur-3xl rounded-full" />

                    <div className="flex gap-4 relative z-10">
                        <div className="shrink-0 pt-1">
                            <div className="w-1.5 h-12 rounded-full bg-linear-to-b from-rose-500 via-rose-600 to-indigo-600 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse" />
                        </div>
                        <div className="space-y-1.5">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                {t('income.waiting.title')}
                            </h4>
                            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-200 font-medium">
                                <Trans i18nKey="income.waiting.desc">
                                    While you trade hours for a fixed wage, the Digital Economy generates value 24/7.
                                    <span className="block my-3 bg-linear-to-r from-rose-500 via-fuchsia-500 to-rose-500 bg-clip-text text-transparent font-black bg-[length:200%_auto] text-animate-shimmer dark:drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                                        Every minute you wait is a tax on your potential
                                    </span>
                                    <span className="block opacity-80 dark:text-slate-300">
                                        Unlock the strategy to stop calculating loss and start capturing value.
                                    </span>
                                </Trans>
                            </p>
                        </div>
                    </div>
                </div>

                {!isStrategyUnlocked ? (
                    <div className="pt-4 relative z-10">
                        <button
                            onClick={onNavigateToPartner}
                            className="group relative w-full flex items-center justify-center gap-2 bg-white text-black h-12 px-6 rounded-2xl font-black text-xs hover:bg-blue-50 transition-all active:scale-[0.98] shadow-[0_10px_20px_-5px_rgba(255,255,255,0.3)]"
                        >
                            {t('income.cta.join')}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                        </button>
                        <p className="text-center mt-6 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] opacity-60">
                            {t('income.cta.beta')}
                        </p>
                    </div>
                ) : (
                    /* Post-Unlock Content: "Lead the Market" Button Redesign */
                    <div className="pt-4 relative z-10 text-center">
                        <motion.button
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="group relative w-full flex items-center justify-center gap-2 emerald-liquid-gradient h-11 px-8 rounded-full font-black text-[11px] tracking-widest shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all overflow-hidden animate-liquid"
                        >
                            {t('income.cta.lead')}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                            <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shimmer" />
                        </motion.button>
                        <p className="mt-4 text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] opacity-80">
                            {t('income.cta.unlocked')}
                        </p>
                    </div>
                )}
            </motion.div>
            {/* Info Modals Portal */}
            {typeof document !== 'undefined' && ReactDOM.createPortal(
                <AnimatePresence>
                    {activeModal && (
                        <>
                            <motion.div
                                key="modal-backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setActiveModal(null)}
                                className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm"
                            />
                            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
                                <motion.div
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
                                                    The Largest Wealth Transfer inside the <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-400">Digital Economy</span>
                                                </h3>

                                                <div className="space-y-3 py-2">
                                                    <p className="text-sm text-slate-300 leading-relaxed">
                                                        Crypto adoption is growing <span className="text-white font-bold">2x faster</span> than the Internet did in the 90s.
                                                    </p>
                                                    <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                                        <div className="flex justify-between items-center text-xs mb-1">
                                                            <span className="text-slate-400">Adoption Curve</span>
                                                            <span className="text-emerald-400 font-bold">You are here (Early)</span>
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
                                                    Maximize This Opportunity
                                                </button>
                                            </>
                                        )}

                                        {activeModal === 'revenue' && (
                                            <>
                                                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/25">
                                                    <DollarSign className="w-6 h-6 text-white" />
                                                </div>

                                                <h3 className="text-xl font-black text-white leading-tight">
                                                    Unlock <span className="text-emerald-400">True Passive Income</span>
                                                </h3>

                                                <p className="text-xs text-slate-400 font-medium">
                                                    Earn lifetime commissions from every action in your network:
                                                </p>

                                                <div className="space-y-2.5 my-2">
                                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                                        <div className="mt-0.5 p-1 rounded-full bg-emerald-500/10">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-sm font-bold text-white">Up to 30%</h5>
                                                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">From Pintopay Card Sales</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                                        <div className="mt-0.5 p-1 rounded-full bg-blue-500/10">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-sm font-bold text-white">Up to 0.3% (Lifetime)</h5>
                                                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">From All Network Top-ups</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                                        <div className="mt-0.5 p-1 rounded-full bg-purple-500/10">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-sm font-bold text-white">30% Rewards</h5>
                                                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">From Partner Network</p>
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
                                                    Start Earning Dividends <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </section>
    );
};
