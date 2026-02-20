import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Info, CheckCircle2, Bot, TrendingUp, ArrowRight, ShieldCheck,
    Terminal, Share, Flame, Globe, Send, Twitter, Linkedin, ChevronRight,
    Loader2, Brain, Lock, Play, ChevronDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PROStatus } from '../../../services/proService';
import { renderMarkdown } from '../utils/renderMarkdown';
import { LiquidCounter } from '../utils/LiquidCounter';

interface GrowthTabProps {
    status: PROStatus | null;
    academyScore: number;
    completedStages: string[];
    isCompletingStage: string | null;
    handleCompleteAcademyStage: (stageId: string) => Promise<void>;
    setSelectedArticle: (article: any) => void;
    setShowSetup: (show: boolean) => void;
    setShowManual: (manual: string | null) => void;
    selection: () => void;
    impact: (style: 'light' | 'medium' | 'heavy') => void;
}

export const GrowthTab = ({
    status,
    academyScore,
    completedStages,
    isCompletingStage,
    handleCompleteAcademyStage,
    setSelectedArticle,
    setShowSetup,
    setShowManual,
    selection,
    impact
}: GrowthTabProps) => {
    const { t } = useTranslation();
    const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
    const isSetupComplete = !!(status?.setup?.telegram_channel_id || status?.setup?.x_access_token);

    return (
        <motion.div
            key="growth"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4 sm:space-y-6 pb-8"
        >
            {/* Master Score Card - Intelligence Hub - Re-engineered for compactness */}
            {/* Master Score Card - Intelligence Hub - Re-engineered for maximum compactness */}
            {/* Master Score Card - Intelligence Hub - Re-engineered for maximum premium vibe */}
            <div className="bg-white dark:bg-slate-950/80 rounded-[32px] p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-white/10 relative overflow-hidden group">
                {/* Tech Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none">
                    <svg width="100%" height="100%">
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        </pattern>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                {/* Dynamic Glow Orbs */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none animate-pulse-slow" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 dark:bg-blue-600/20 blur-[100px] rounded-full pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 relative z-10">
                    <div className="flex items-start gap-4 sm:gap-5">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[22px] bg-linear-to-br from-indigo-500 to-blue-600 p-px shadow-xl shadow-indigo-500/20 shrink-0 group-hover:rotate-3 transition-transform duration-500">
                            <div className="w-full h-full rounded-[21px] bg-white dark:bg-slate-950 flex items-center justify-center">
                                <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-500 dark:text-indigo-400" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 pt-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none italic">
                                    {t('pro_dashboard.academy.protocols.title').split(' ')[0]} <span className="text-indigo-500">{t('pro_dashboard.academy.protocols.title').split(' ').slice(1).join(' ')}</span>
                                </h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="px-2.5 py-0.5 bg-indigo-500 text-white dark:bg-indigo-500/20 dark:text-indigo-400 rounded-md text-[8px] font-black uppercase tracking-[0.2em] shadow-sm">
                                    {academyScore < 300 ? t('pro_dashboard.academy.protocols.difficulty_levels.easy') :
                                        academyScore < 800 ? t('pro_dashboard.academy.protocols.difficulty_levels.medium') :
                                            t('pro_dashboard.academy.protocols.difficulty_levels.hard')}
                                </span>
                                <div className="h-3 w-px bg-slate-200 dark:bg-white/10" />
                                <button
                                    onClick={() => { selection(); setShowManual('academy'); }}
                                    className="flex items-center gap-1 text-[9px] font-black text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors uppercase tracking-[0.15em]"
                                >
                                    <Info className="w-3 h-3" /> {t('pro_dashboard.academy.intel_label')}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-0">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-1">
                            {t('pro_dashboard.academy.protocols.stats_label')}
                        </p>
                        <div className="relative group/score">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl opacity-0 group-hover/score:opacity-100 transition-opacity duration-700" />
                            <div className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tabular-nums leading-none tracking-tighter vibing-crystal-text flex items-baseline gap-1">
                                <LiquidCounter value={academyScore} />
                                <span className="text-xs text-indigo-500/60 dark:text-indigo-400/60 tracking-normal italic ml-1 font-bold">XP</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Visualizer - Segmented Bars */}
                <div className="space-y-4 relative z-10 w-full mt-2 bg-slate-50 dark:bg-white/2 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                    {(() => {
                        const modules = t('pro_dashboard.academy.protocols.modules', { returnObjects: true });
                        const moduleCount = Array.isArray(modules) ? modules.length : 6;
                        const uniqueCompleted = [...new Set(completedStages)].filter(id => Array.isArray(modules) && modules.some((m: any) => m.id === id)).length;
                        const progress = Math.min(Math.round((uniqueCompleted / moduleCount) * 100), 100);

                        return (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Synchronization Status</span>
                                    <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest tabular-nums italic">
                                        {progress}% DEPLOYED
                                    </span>
                                </div>

                                <div className="flex gap-1.5 h-3">
                                    {Array.from({ length: 12 }).map((_, i) => {
                                        const threshold = (i + 1) * (100 / 12);
                                        const isActive = progress >= threshold;
                                        return (
                                            <div
                                                key={i}
                                                className={`flex-1 rounded-sm transition-all duration-700 relative overflow-hidden ${isActive
                                                    ? 'bg-linear-to-t from-indigo-500 to-blue-400 shadow-[0_0_10px_rgba(79,70,229,0.3)]'
                                                    : 'bg-slate-200 dark:bg-white/5'
                                                    }`}
                                            >
                                                {isActive && (
                                                    <motion.div
                                                        className="absolute inset-0 bg-white/30"
                                                        animate={{ opacity: [0, 0.5, 0] }}
                                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Expert Intelligence Transmission - Sleek Ticker Style */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/10 flex items-center gap-3 sm:gap-4 relative overflow-hidden shadow-[0_4px_15px_rgb(0,0,0,0.02)]">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-100/80 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-[13px] font-bold text-slate-600 dark:text-slate-300 leading-snug italic truncate">
                        "{t('pro_dashboard.academy.desc')}"
                    </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 bg-white/50 dark:bg-black/20 px-2.5 py-1.5 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mt-0.5">{t('pro_dashboard.academy.live_signal')}</span>
                </div>
            </div>

            {/* Viral Content Hub - Modules Component */}
            <div className="space-y-5 sm:space-y-6">
                <div className="flex flex-row items-center gap-3 px-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-blue-500 border border-indigo-100 dark:border-blue-500/20 shadow-sm shrink-0">
                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="flex flex-col">
                        <h4 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t('pro_dashboard.academy.articles.title')}</h4>
                        <p className="text-[9px] font-black text-indigo-500/60 dark:text-indigo-400 uppercase tracking-widest mt-0.5">{t('pro_dashboard.academy.dossier_label')}</p>
                    </div>
                </div>

                <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 pt-2 no-scrollbar -mx-4 px-4 snap-x">
                    {(() => {
                        const articles = t('pro_dashboard.academy.articles.items', { returnObjects: true });
                        const articlesList = Array.isArray(articles) ? articles : [];
                        return articlesList.map((article: any, i: number) => {
                            const mockProgress = [35, 72, 100, 15, 60][i % 5];
                            return (
                                <motion.div
                                    key={article.id || i}
                                    whileHover={{ y: -4 }}
                                    onClick={() => { selection(); setSelectedArticle(article); impact('light'); }}
                                    className="min-w-[240px] sm:min-w-[300px] snap-center bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 relative overflow-hidden group cursor-pointer active:scale-95 transition-all shadow-[0_4px_15px_rgb(0,0,0,0.03)] flex flex-col"
                                >
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-full text-[9px] sm:text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{article.category}</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{article.readTime} MIN READ</span>
                                        </div>
                                        {mockProgress === 100 && (
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                <CheckCircle2 size={14} />
                                            </div>
                                        )}
                                    </div>
                                    <h5 className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter mb-3 leading-tight group-hover:text-indigo-500 transition-colors">{article.title}</h5>
                                    <p className="text-[12px] sm:text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic mb-6 flex-1 line-clamp-2">"{article.desc}"</p>

                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest group-hover:gap-2.5 transition-all">
                                            {t('pro_dashboard.academy.articles.btn_read')} <ArrowRight className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-300 dark:bg-indigo-500/50 rounded-full" style={{ width: `${mockProgress}%` }} />
                                            </div>
                                            <span className="text-[9px] font-black text-slate-400">{mockProgress}%</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        });
                    })()}
                </div>
            </div>

            {/* Masterclass Modules - Academy Path */}
            <div className="space-y-6 relative">
                {/* Timeline Line - Re-aligned for compact nodes */}
                <div className="absolute left-[12px] sm:left-[14px] top-10 bottom-0 w-px bg-slate-200 dark:bg-white/10 z-0 overflow-hidden">
                    <motion.div
                        className="absolute top-0 left-0 w-full bg-linear-to-b from-transparent via-indigo-500 to-transparent h-24"
                        animate={{
                            top: ["-10%", "110%"],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                </div>

                <div className="flex items-center gap-2 px-1 relative z-10">
                    <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500 border border-indigo-100 dark:border-indigo-500/20 shadow-lg shadow-indigo-500/10">
                        <ShieldCheck size={16} />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t('pro_dashboard.academy.growth_protocol')}</h4>
                        <p className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest mt-0.5">{t('pro_dashboard.academy.node_capabilities')}</p>
                    </div>
                </div>

                <div className="space-y-4 relative z-10">
                    {(() => {
                        const modules = t('pro_dashboard.academy.protocols.modules', { returnObjects: true });
                        const modulesList = Array.isArray(modules) ? modules : [];

                        // Auto-expand first uncompleted if none expanded
                        if (expandedModuleId === null && modulesList.length > 0) {
                            const firstUncompletedId = modulesList.find((m: any) => !completedStages.includes(m.id))?.id;
                            if (firstUncompletedId) setExpandedModuleId(firstUncompletedId);
                        }

                        return modulesList.map((module: any, i: number) => {
                            const isCompleted = completedStages.includes(module.id);
                            const isLoading = isCompletingStage === module.id;
                            const isExpanded = expandedModuleId === module.id;
                            const cost = module.tokens || 0;
                            const xpCost = module.xp_cost || 0;
                            const xpReward = module.points || 0;

                            const userTokens = status?.pro_tokens || 0;
                            const canAffordTokens = cost >= 0 || userTokens >= Math.abs(cost);
                            const canAffordXP = academyScore >= xpCost;
                            const isPaid = cost < 0 || xpCost > 0;
                            const isLocked = !isCompleted && (!canAffordTokens || !canAffordXP);

                            const toggleExpand = () => {
                                selection();
                                impact('light');
                                setExpandedModuleId(isExpanded ? null : module.id);
                            };

                            return (
                                <motion.div
                                    key={module.id || i}
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05 }}
                                    className="pl-10 sm:pl-12 relative group"
                                >
                                    {/* Timeline Node - Premium Style */}
                                    <div className={`absolute left-0 top-5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all duration-500 z-20 ${isCompleted
                                        ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-2 ring-emerald-50 dark:ring-emerald-500/10'
                                        : isLocked
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 ring-2 ring-white dark:ring-slate-900'
                                            : 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-2 ring-emerald-50 dark:ring-emerald-500/10'
                                        }`}>
                                        <span className="font-black text-[10px] sm:text-xs">{i + 1}</span>
                                        {!isCompleted && !isLocked && (
                                            <motion.div
                                                className="absolute inset-0 rounded-full bg-emerald-500 -z-10"
                                                animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        )}
                                    </div>

                                    {/* Premium Masterclass Card */}
                                    <div className={`pro-card-extreme rounded-[20px] overflow-hidden relative transition-all duration-300 border ${isCompleted
                                        ? 'opacity-90 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/40'
                                        : isLocked
                                            ? 'opacity-60 border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5'
                                            : isExpanded
                                                ? 'bg-white dark:bg-slate-900 border-indigo-500/20 shadow-xl shadow-indigo-500/5'
                                                : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-white/10 hover:border-indigo-500/30 shadow-[0_4px_15px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.08)]'
                                        }`}>

                                        {/* Header - Clickable Area */}
                                        <div
                                            onClick={toggleExpand}
                                            className="px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between cursor-pointer group/header bg-white dark:bg-slate-900"
                                        >
                                            <div className="flex flex-col gap-2 min-w-0 flex-1">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest shrink-0 ${module.diff === 'hard' ? 'bg-red-50 text-red-500 dark:bg-red-500/10' :
                                                        module.diff === 'medium' ? 'bg-amber-50 text-amber-500 dark:bg-amber-500/10' :
                                                            'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10'
                                                        }`}>
                                                        {t(`pro_dashboard.academy.protocols.difficulty_levels.${module.diff}`).split(' ')[0]}
                                                    </span>
                                                    <h4 className={`text-xs sm:text-sm font-black uppercase tracking-tighter leading-none transition-colors truncate ${isExpanded ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                                                        {module.title}
                                                    </h4>
                                                </div>
                                                <div className="flex items-center gap-3 ml-1 mt-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'} opacity-70`} />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {isCompleted ? (
                                                    <div className="flex items-center gap-2 text-emerald-500">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{t('pro_dashboard.academy.synced')}</span>
                                                    </div>
                                                ) : (
                                                    <div className={`text-[9px] font-black uppercase tracking-tight flex items-center gap-2 ${isPaid ? 'text-indigo-500' : 'text-emerald-500'}`}>
                                                        {cost < 0 && <span>{cost} T</span>}
                                                        {xpCost > 0 && <span className="text-red-500">-{xpCost} XP</span>}
                                                        {!isPaid && <span>+{xpReward} XP</span>}
                                                    </div>
                                                )}
                                                <motion.div
                                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                                    className="text-slate-400 group-hover/header:text-indigo-500 transition-colors"
                                                >
                                                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </motion.div>
                                            </div>
                                        </div>

                                        {/* Expandable Content */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                >
                                                    <div className="px-4 pb-4 pt-1 sm:px-6 sm:pb-6 space-y-4 border-t border-slate-50 dark:border-white/5 bg-white dark:bg-slate-900">
                                                        <p className="text-[10px] sm:text-[11px] font-black text-indigo-500/80 uppercase tracking-widest border-b border-indigo-50 dark:border-indigo-500/10 pb-3">{module.hook}</p>

                                                        {/* Content Logic: Hide if Paid and Not Completed */}
                                                        {(!isCompleted && isPaid) ? (
                                                            <div className="relative overflow-hidden rounded-[16px]">
                                                                <div className="bg-slate-50 dark:bg-black/20 p-4 sm:p-5 blur-md select-none opacity-40 text-[12px]">
                                                                    {module.content.substring(0, 150)}...
                                                                </div>
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/10 dark:bg-black/10 backdrop-blur-[2px]">
                                                                    <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl shadow-xl border border-indigo-500/20 flex flex-col items-center gap-1.5">
                                                                        <Lock className="w-5 h-5 text-indigo-500" />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Protocol Locked</span>
                                                                        <span className="text-[8px] font-bold text-slate-400 uppercase">Unlock to access intelligence</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="bg-slate-50 dark:bg-black/20 p-4 sm:p-5 rounded-[16px] border border-slate-100 dark:border-white/5 text-[12px] sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                                                {renderMarkdown(module.content)}
                                                            </div>
                                                        )}

                                                        {/* Action / Task - Also hidden if Paid and Not Completed */}
                                                        {!isCompleted && !isLocked && (
                                                            <div className={`relative p-5 sm:p-6 rounded-[24px] border border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 space-y-4 overflow-hidden group/task ${isPaid && 'pt-6'}`}>
                                                                <div className="absolute inset-0 bg-linear-to-r from-indigo-500/5 to-purple-500/5 opacity-50" />
                                                                <div className="relative z-10">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <Terminal size={14} className="text-indigo-500" />
                                                                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Node Task</span>
                                                                    </div>

                                                                    {!isPaid ? (
                                                                        <>
                                                                            <p className="text-[13px] sm:text-[14px] font-bold text-slate-800 dark:text-slate-200 leading-relaxed mb-4">
                                                                                {module.task}
                                                                            </p>

                                                                            {module.link && (
                                                                                <a href={module.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[11px] font-black uppercase tracking-widest hover:underline mb-4">
                                                                                    {module.cta || 'Initiate Sync'} <Share size={12} />
                                                                                </a>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <p className="text-[11px] font-bold text-slate-400 italic mb-4">
                                                                            Task requirements will be revealed after synchronization.
                                                                        </p>
                                                                    )}

                                                                    <button
                                                                        onClick={() => handleCompleteAcademyStage(module.id)}
                                                                        disabled={isLoading}
                                                                        className="w-full min-h-[44px] h-auto py-2.5 bg-slate-900 dark:bg-white hover:scale-[1.01] active:scale-95 text-white dark:text-slate-900 rounded-[12px] font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 flex-wrap text-center shadow-lg relative overflow-hidden"
                                                                    >
                                                                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : (
                                                                            <>
                                                                                <span>
                                                                                    {!isPaid ? "Complete & Claim" : `Unlock Protocol (-${Math.abs(cost)} T)`}
                                                                                </span>
                                                                                {xpCost > 0 && (
                                                                                    <span className="opacity-80 text-red-400">(-{xpCost} XP)</span>
                                                                                )}
                                                                                <div className="w-px h-4 bg-current opacity-20 hidden sm:block mx-1" />
                                                                                <span className="opacity-70">+{xpReward} XP Reward</span>
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {isLocked && !isCompleted && (
                                                            <div className="p-5 bg-slate-100 dark:bg-white/5 rounded-[24px] border border-slate-200 dark:border-white/5 text-center">
                                                                <div className="flex flex-col items-center gap-2 opacity-60">
                                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                                        {!canAffordTokens ? "Insufficient Tokens" : "Insufficient XP Score"}
                                                                    </span>
                                                                    <span className="text-[9px] font-medium text-slate-400 uppercase tracking-tight leading-none">
                                                                        {xpCost > academyScore ? `Requires ${xpCost} XP (You have ${academyScore})` : "Earn more tokens or upgrade to PRO+"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            );

                        });
                    })()}
                </div>
            </div>

            {/* Lifehacks & Strategy Dossier - Compact Grid-ready */}
            <div className="pro-card-extreme p-4 sm:p-6 rounded-[20px] border border-white/10 relative overflow-hidden group bg-white/40 dark:bg-slate-950/40 shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 blur-[60px] pointer-events-none group-hover:opacity-20 transition-opacity" />

                <div className="flex items-center justify-between mb-5 relative z-10">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-pink-500/10 rounded-lg flex items-center justify-center border border-pink-500/20 shadow-lg group-hover:rotate-12 transition-transform">
                            <Flame size={16} className="text-pink-500" />
                        </div>
                        <div>
                            <h4 className="text-[11px] font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none mb-1">{t('pro_dashboard.academy.lifehacks.title')}</h4>
                            <p className="text-[9px] font-black text-pink-500/60 uppercase tracking-widest">{t('pro_dashboard.academy.lifehacks.subtitle')}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(() => {
                        const hacks = t('pro_dashboard.academy.lifehacks.items', { returnObjects: true });
                        const hacksList = Array.isArray(hacks) ? hacks : [];
                        return hacksList.map((hack: any, i: number) => (
                            <div
                                key={i}
                                onClick={() => {
                                    navigator.clipboard.writeText(hack.desc);
                                    impact('medium');
                                }}
                                className="flex gap-3 p-3.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 hover:border-pink-500/20 transition-all group/hack cursor-pointer active:scale-95 shadow-xs relative"
                            >
                                <div className="w-7 h-7 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500 font-black text-xs shrink-0 border border-pink-500/10 shadow-inner group-hover/hack:scale-110 transition-transform">{i + 1}</div>
                                <div className="space-y-0.5 pr-6">
                                    <h5 className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-tighter leading-tight">{hack.title}</h5>
                                    <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-tight italic opacity-70 line-clamp-1">"{hack.desc}"</p>
                                </div>
                                <div className="absolute top-3.5 right-3.5 opacity-0 group-hover/hack:opacity-100 transition-opacity text-pink-500">
                                    <Share size={12} />
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            </div>

            <div className="glass-panel-premium p-4 sm:p-6 rounded-[20px] border border-slate-200 dark:border-white/10 relative overflow-hidden group bg-white dark:bg-slate-950 shadow-2xl">
                <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none" />
                <div className="flex items-center justify-between gap-4 mb-5 relative z-10 font-sans">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 shadow-lg group-hover:rotate-6 transition-transform shrink-0">
                            <Globe size={20} className="text-indigo-500" />
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none mb-1 truncate">{t('pro_dashboard.academy.social_setup.title')}</h4>
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest truncate">{t('pro_dashboard.academy.social_setup.subtitle')}</p>
                        </div>
                    </div>
                    {/* Multi-Sync Status Display */}
                    <div className="flex flex-col items-end shrink-0 text-right">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full whitespace-nowrap ${status?.is_pro_plus ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-500/10 text-slate-400'}`}>
                            {status?.is_pro_plus ? t('pro_dashboard.setup.tg_sync_multi.plan_plus') : t('pro_dashboard.setup.tg_sync_multi.plan_pro')}
                        </span>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5 whitespace-nowrap">{t('pro_dashboard.setup.tg_sync_multi.multi_node_capacity', { val: status?.is_pro_plus ? '5/5' : '1/1' })}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10 mb-6">
                    {(() => {
                        const platforms = t('pro_dashboard.academy.social_setup.platforms', { returnObjects: true, bot_username: status?.bot_username || 'pintopay_probot' });
                        const platformsList = Array.isArray(platforms) ? platforms : [];
                        return platformsList.map((platform: any, i: number) => (
                            <div key={i} className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group/platform">
                                <div className="flex items-center gap-2.5 mb-2">
                                    <div className="w-7 h-7 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20 group-hover/platform:scale-110 transition-transform">
                                        {platform.name && platform.name.includes('Telegram') && <Send size={12} className="text-indigo-500" />}
                                        {platform.name && platform.name.includes('X') && <Twitter size={12} className="text-indigo-500" />}
                                        {platform.name && platform.name.includes('LinkedIn') && <Linkedin size={12} className="text-indigo-500" />}
                                    </div>
                                    <span className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">{platform.name}</span>
                                </div>
                                <div className="grid grid-cols-1 gap-1 opacity-60">
                                    {Array.isArray(platform.steps) && platform.steps.slice(0, 2).map((step: string, j: number) => (
                                        <div key={j} className="flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-indigo-500/30" />
                                            <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 truncate tracking-tight">{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ));
                    })()}
                </div>

                <button
                    onClick={() => { selection(); setShowSetup(true); }}
                    className="w-full h-10 vibing-blue-animated text-white font-black text-[10px] uppercase tracking-widest rounded-[1rem] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 relative overflow-hidden group/btn"
                >
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                    {t('pro_dashboard.tab_setup')} <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Elite Psychological Warfare (TOP 9) - Black Ops Intelligence Style */}
            {/* Elite Psychological Warfare (TOP 9) - Black Ops Intelligence Style */}
            <div className={`relative rounded-[32px] border transition-all duration-700 overflow-hidden ${isSetupComplete
                ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-indigo-500/20 shadow-[0_30px_60px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_rgba(0,0,0,0.6)]'
                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5'
                }`}>

                {/* Section Header with Scanning Signal */}
                <div className="relative px-6 py-8 sm:px-8 border-b border-slate-100 dark:border-white/5 overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-r from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
                    <motion.div
                        className="absolute top-0 left-0 w-1 h-full bg-indigo-500/40 blur-sm z-10"
                        animate={{ left: ["-10%", "110%"] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />

                    <div className="flex items-center gap-4 relative z-20">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-2xl transition-all duration-500 ${isSetupComplete
                            ? 'bg-indigo-500 text-white border-indigo-400 shadow-indigo-500/40 rotate-12 scale-110'
                            : 'bg-slate-200 dark:bg-white/10 text-slate-400 border-slate-300 dark:border-white/10'
                            }`}>
                            <Brain size={24} className={isSetupComplete ? 'animate-pulse' : ''} />
                        </div>
                        <div>
                            <h4 className="text-xl sm:text-2xl font-black uppercase tracking-tighter leading-none mb-1.5 flex items-center gap-2 italic">
                                {t('pro_dashboard.academy.psych_strategies.title')}
                            </h4>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 dark:text-indigo-400">
                                    {t('pro_dashboard.academy.psych_strategies.subtitle')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {!isSetupComplete && (
                    <div className="absolute inset-x-0 bottom-0 top-[110px] z-20 backdrop-blur-2xl bg-white/40 dark:bg-black/60 flex flex-col items-center justify-center text-center p-6 sm:p-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative mb-8"
                        >
                            <div className="w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-linear-to-t from-indigo-500/20 to-transparent animate-pulse" />
                                <Lock size={40} className="text-indigo-500 relative z-10" />
                                <motion.div
                                    className="absolute left-0 right-0 h-0.5 bg-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.8)] z-20"
                                    animate={{ top: ["0%", "100%", "0%"] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                />
                            </div>
                        </motion.div>

                        <div className="space-y-3 mb-10">
                            <span className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.5em] animate-pulse">
                                {t('pro_dashboard.academy.bio_auth')}
                            </span>
                            <h4 className="text-2xl font-black uppercase text-slate-900 dark:text-white tracking-widest leading-none italic">
                                {t('pro_dashboard.academy.psych_strategies.title')}
                            </h4>
                            <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 max-w-[320px] uppercase tracking-wider mx-auto leading-relaxed">
                                {t('pro_dashboard.academy.psych_strategies.unlock_desc')}
                            </p>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(99,102,241,0.6)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { selection(); setShowSetup(true); }}
                            className="px-10 py-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.3em] transition-all shadow-[0_20px_40px_rgba(99,102,241,0.4)] flex items-center gap-4 group/lock-btn"
                        >
                            {t('pro_dashboard.academy.social_sync')} <Terminal size={16} className="group-hover/lock-btn:rotate-12 transition-transform" />
                        </motion.button>
                    </div>
                )}

                <div className={`p-6 sm:p-8 relative z-10 ${!isSetupComplete ? 'blur-2xl pointer-events-none' : ''}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {(() => {
                            const strats = t('pro_dashboard.academy.psych_strategies.items', { returnObjects: true });
                            const stratsList = Array.isArray(strats) ? strats : [];
                            return stratsList.map((item: any, i: number) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -8 }}
                                    className="p-6 rounded-[24px] border relative overflow-hidden group/card bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 hover:border-indigo-500/40 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                                >
                                    {/* Tech Gradients */}
                                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 dark:bg-indigo-500/10 blur-xl rounded-full" />

                                    {/* Trigger Badge - Premium Label */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="w-8 h-8 rounded-xl bg-slate-200/50 dark:bg-white/10 flex items-center justify-center text-slate-800 dark:text-white text-[12px] font-black italic border border-slate-300 dark:border-white/10">
                                            {i + 1}
                                        </div>
                                        <div className="px-3 py-1 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-lg border border-indigo-500/20">
                                            <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em]">{item.trigger}</span>
                                        </div>
                                    </div>

                                    <h5 className="text-[15px] font-black uppercase tracking-tighter leading-snug mb-3 group-hover/card:text-indigo-500 transition-colors italic">
                                        {item.title}
                                    </h5>

                                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-6 min-h-[48px]">
                                        {item.desc}
                                    </p>

                                    {/* Tactical BluePrint Action Container */}
                                    <div className="p-4 bg-white dark:bg-black/40 rounded-2xl border border-slate-100 dark:border-white/10 relative overflow-hidden group/blueprint">
                                        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-emerald-500/40 to-transparent" />
                                        <div className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
                                                <Play size={10} className="text-emerald-500 fill-emerald-500/20" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest">Tactical Directive</span>
                                                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight leading-tight">
                                                    {item.action}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Copy/Share micro-action */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(item.action);
                                                impact('medium');
                                            }}
                                            className="absolute right-2 bottom-2 w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center opacity-0 group-hover/blueprint:opacity-100 transition-opacity hover:bg-emerald-500/10 hover:text-emerald-500"
                                        >
                                            <Share size={10} />
                                        </button>
                                    </div>
                                </motion.div>
                            ));
                        })()}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
