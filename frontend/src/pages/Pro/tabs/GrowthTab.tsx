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

    return (
        <motion.div
            key="growth"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 sm:space-y-10 pb-12"
        >
            {/* Master Score Card - Intelligence Hub - Re-engineered for compactness */}
            {/* Master Score Card - Intelligence Hub - Re-engineered for maximum compactness */}
            <div className="pro-card-extreme bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-white/10 shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />

                <div className="flex items-center justify-between gap-4 relative z-10 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-inner">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-1">
                                {t('pro_dashboard.academy.protocols.title')}
                                <span className="ml-2 px-1.5 py-0.5 bg-indigo-500/10 rounded-md text-[7px] font-black text-indigo-500 align-middle">
                                    {academyScore < 300 ? t('pro_dashboard.academy.protocols.difficulty_levels.easy').split(' ')[0] :
                                        academyScore < 800 ? t('pro_dashboard.academy.protocols.difficulty_levels.medium').split(' ')[0] :
                                            t('pro_dashboard.academy.protocols.difficulty_levels.hard').split(' ')[0]}
                                </span>
                            </h3>
                            <button
                                onClick={() => { selection(); setShowManual('academy'); }}
                                className="flex items-center gap-1 text-[8px] font-black text-slate-400 hover:text-indigo-500 transition-colors uppercase tracking-widest"
                            >
                                <Info size={10} /> {t('pro_dashboard.academy.intel_label')}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.3em] mb-0.5">{t('pro_dashboard.academy.protocols.stats_label')}</p>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums leading-none flex items-baseline gap-0.5 vibing-crystal-text">
                            <LiquidCounter value={academyScore} className="vibing-crystal-text" />
                            <span className="text-indigo-500 text-xs opacity-50 font-black">PTS</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 relative z-10">
                    {(() => {
                        const modules = t('pro_dashboard.academy.protocols.modules', { returnObjects: true });
                        const moduleCount = Array.isArray(modules) ? modules.length : 5;
                        const uniqueCompleted = [...new Set(completedStages)].filter(id => Array.isArray(modules) && modules.some((m: any) => m.id === id));
                        const progress = Math.min(Math.round((uniqueCompleted.length / moduleCount) * 100), 100);

                        return (
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-black/40 rounded-full overflow-hidden shadow-inner border border-slate-200 dark:border-white/5 relative">
                                    <motion.div
                                        className="h-full vibing-blue-animated rounded-full relative overflow-hidden"
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 2, ease: "circOut" }}
                                    >
                                        <div className="absolute inset-0 bg-linear-to-r from-white/20 via-transparent to-transparent animate-shimmer-slide" />
                                    </motion.div>
                                </div>
                                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tabular-nums">{progress}% SYNC</span>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Expert Intelligence Transmission - Sleek Ticker Style */}
            <div className="px-4 py-3 bg-indigo-500/5 dark:bg-white/5 rounded-2xl border border-indigo-500/10 dark:border-white/5 flex items-center gap-3 relative overflow-hidden shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                    <Bot size={16} className="animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight italic truncate pr-4">
                        "{t('pro_dashboard.academy.desc')}"
                    </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{t('pro_dashboard.academy.live_signal')}</span>
                </div>
            </div>

            {/* Viral Content Hub - More Compact Snap-slider */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                            <TrendingUp size={16} />
                        </div>
                        <div>
                            <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('pro_dashboard.academy.articles.title')}</h4>
                            <p className="text-[8px] font-black text-indigo-500/60 uppercase tracking-widest mt-0.5">{t('pro_dashboard.academy.dossier_label')}</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 snap-x">
                    {(() => {
                        const articles = t('pro_dashboard.academy.articles.items', { returnObjects: true });
                        const articlesList = Array.isArray(articles) ? articles : [];
                        return articlesList.map((article: any, i: number) => {
                            // Simulated reading progress for visual flair
                            const mockProgress = [35, 72, 100, 15, 60][i % 5];
                            return (
                                <motion.div
                                    key={article.id || i}
                                    whileHover={{ y: -3 }}
                                    onClick={() => { selection(); setSelectedArticle(article); impact('light'); }}
                                    className="min-w-[260px] sm:min-w-[320px] snap-center pro-card-extreme p-5 sm:p-6 rounded-[1.25rem] border border-slate-200 dark:border-white/10 relative overflow-hidden group cursor-pointer active:scale-95 transition-all bg-white dark:bg-slate-900/50 shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-indigo-500/10 rounded-full text-[7px] font-black text-indigo-500 uppercase tracking-widest border border-indigo-500/10">{article.category}</span>
                                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{article.readTime} MIN READ</span>
                                        </div>
                                        {mockProgress === 100 && (
                                            <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                <CheckCircle2 size={10} />
                                            </div>
                                        )}
                                    </div>
                                    <h5 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{article.title}</h5>
                                    <p className="text-[11px] font-normal text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 mb-4 opacity-100 dark:opacity-80 italic">"{article.desc}"</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[8px] font-black text-indigo-500 uppercase tracking-widest group-hover:gap-3 transition-all">
                                            {t('pro_dashboard.academy.articles.btn_read')} <ArrowRight size={10} />
                                        </div>
                                        {/* Micro progress indicator */}
                                        <div className="flex items-center gap-2">
                                            <div className="w-12 h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500/40" style={{ width: `${mockProgress}%` }} />
                                            </div>
                                            <span className="text-[6px] font-black text-slate-400">{mockProgress}%</span>
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
                {/* Timeline Line - Re-aligned for compact nodes with Energy Pulse */}
                <div className="absolute left-[14px] sm:left-[16px] top-12 bottom-0 w-px bg-slate-200 dark:bg-white/10 z-0 overflow-hidden">
                    <motion.div
                        className="absolute top-0 left-0 w-full bg-linear-to-b from-transparent via-indigo-500 to-transparent h-32"
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
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-100 dark:border-indigo-500/20 shadow-lg shadow-indigo-500/10">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t('pro_dashboard.academy.growth_protocol')}</h4>
                        <p className="text-[9px] font-black text-indigo-500/60 uppercase tracking-[0.2em] mt-1">{t('pro_dashboard.academy.node_capabilities')}</p>
                    </div>
                </div>

                <div className="space-y-6 relative z-10">
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
                                    {/* Timeline Node - More Compact with Status Pulse */}
                                    <div className={`absolute left-0 top-[18px] w-7 h-7 sm:w-8 sm:h-8 rounded-full border-[3px] border-slate-50 dark:border-slate-950 flex items-center justify-center transition-all duration-500 z-20 ${isCompleted
                                        ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                        : isLocked
                                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                            : 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                                        }`}>
                                        <span className="font-black text-[9px] sm:text-xs">{i + 1}</span>
                                        {!isCompleted && !isLocked && (
                                            <motion.div
                                                className="absolute inset-0 rounded-full bg-indigo-500 -z-10"
                                                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        )}
                                    </div>

                                    {/* Compact Card / Accordion */}
                                    <div className={`pro-card-extreme rounded-2xl overflow-hidden relative transition-all duration-300 border ${isCompleted
                                        ? 'opacity-90 border-emerald-500/10 bg-emerald-500/5'
                                        : isLocked
                                            ? 'opacity-60 border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5'
                                            : isExpanded
                                                ? 'bg-white dark:bg-slate-900 border-indigo-500/40 shadow-xl shadow-indigo-500/10 scale-[1.01]'
                                                : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-white/10 hover:border-indigo-500/30'
                                        }`}>

                                        {/* Header - Clickable Area */}
                                        <div
                                            onClick={toggleExpand}
                                            className="px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between cursor-pointer group/header"
                                        >
                                            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest shrink-0 ${module.diff === 'hard' ? 'bg-red-500/10 text-red-500' :
                                                        module.diff === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                                                            'bg-emerald-500/10 text-emerald-500'
                                                        }`}>
                                                        {t(`pro_dashboard.academy.protocols.difficulty_levels.${module.diff}`).split(' ')[0]}
                                                    </span>
                                                    <h4 className={`text-[10px] sm:text-xs font-black uppercase tracking-tight leading-none transition-colors truncate ${isExpanded ? 'text-indigo-500' : 'text-slate-900 dark:text-white'}`}>
                                                        {module.title}
                                                    </h4>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {isCompleted ? (
                                                    <div className="flex items-center gap-1.5 text-emerald-500">
                                                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span className="text-[8px] font-black uppercase tracking-widest hidden sm:inline">{t('pro_dashboard.academy.synced')}</span>
                                                    </div>
                                                ) : (
                                                    <div className={`text-[8px] font-black uppercase tracking-widest ${cost > 0 ? 'text-emerald-500' : 'text-indigo-500'}`}>
                                                        {cost > 0 ? `+${cost} T` : `${cost} T`}
                                                    </div>
                                                )}
                                                <motion.div
                                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                                    className="text-slate-400 group-hover/header:text-indigo-500 transition-colors"
                                                >
                                                    <ChevronDown size={14} />
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
                                                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-4 border-t border-slate-100 dark:border-white/5 pt-4">
                                                        <p className="text-[9px] font-bold text-indigo-500/80 uppercase tracking-widest">{module.hook}</p>

                                                        <div className="bg-slate-50 dark:bg-black/20 p-4 rounded-xl border border-slate-100 dark:border-white/5 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                                            {renderMarkdown(module.content)}
                                                        </div>

                                                        {/* Action / Task */}
                                                        {!isCompleted && !isLocked && (
                                                            <div className="relative p-3 sm:p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-3 overflow-hidden group/task">
                                                                <div className="absolute inset-0 bg-linear-to-r from-indigo-500/5 to-purple-500/5 opacity-50" />
                                                                <div className="relative z-10">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Terminal size={12} className="text-indigo-500" />
                                                                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-indigo-500">Node Task</span>
                                                                    </div>
                                                                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-relaxed mb-3">
                                                                        {module.task}
                                                                    </p>

                                                                    {module.link && (
                                                                        <a href={module.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest hover:underline mb-3">
                                                                            {module.cta || 'Initiate Sync'} <Share size={10} />
                                                                        </a>
                                                                    )}

                                                                    <button
                                                                        onClick={() => handleCompleteAcademyStage(module.id)}
                                                                        disabled={isLoading}
                                                                        className="w-full min-h-[44px] h-auto py-2 bg-slate-900 dark:bg-white hover:scale-[1.02] active:scale-95 text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-wider sm:tracking-widest transition-all flex items-center justify-center gap-2 flex-wrap text-center shadow-lg relative overflow-hidden"
                                                                    >
                                                                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : (
                                                                            <>
                                                                                <span>
                                                                                    {cost > 0 ? "Complete & Claim" : `Unlock (-${Math.abs(cost)})`}
                                                                                </span>
                                                                                {xpCost > 0 && (
                                                                                    <span className="opacity-80 text-red-400">(-{xpCost} XP)</span>
                                                                                )}
                                                                                <div className="w-px h-3 bg-current opacity-20 hidden sm:block" />
                                                                                <span className="opacity-70">+{xpReward} XP</span>
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {isLocked && !isCompleted && (
                                                            <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 text-center">
                                                                <div className="flex flex-col items-center gap-2 opacity-60">
                                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                                        {!canAffordTokens ? "Insufficient Tokens" : "Insufficient XP Score"}
                                                                    </span>
                                                                    <span className="text-[8px] font-medium text-slate-400">
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
            <div className="pro-card-extreme p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/10 relative overflow-hidden group bg-white/40 dark:bg-slate-950/40 shadow-xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/5 blur-[80px] pointer-events-none group-hover:opacity-20 transition-opacity" />

                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center border border-pink-500/20 shadow-lg group-hover:rotate-12 transition-transform">
                            <Flame size={20} className="text-pink-500" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-[0.25em] text-slate-900 dark:text-white leading-none mb-1.5">{t('pro_dashboard.academy.lifehacks.title')}</h4>
                            <p className="text-[8px] font-black text-pink-500/60 uppercase tracking-[0.3em]">{t('pro_dashboard.academy.lifehacks.subtitle')}</p>
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
                                    <h5 className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-tight leading-tight">{hack.title}</h5>
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

            <div className="glass-panel-premium p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 dark:border-white/10 relative overflow-hidden group bg-white dark:bg-slate-950 shadow-2xl">
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="flex items-center justify-between gap-4 mb-6 relative z-10 font-sans">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 shadow-lg group-hover:rotate-6 transition-transform shrink-0">
                            <Globe size={20} className="text-indigo-500" />
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white leading-none mb-1 truncate">{t('pro_dashboard.academy.social_setup.title')}</h4>
                            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] truncate">{t('pro_dashboard.academy.social_setup.subtitle')}</p>
                        </div>
                    </div>
                    {/* Multi-Sync Status Display */}
                    <div className="flex flex-col items-end shrink-0 text-right">
                        <span className={`text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full whitespace-nowrap ${status?.is_pro_plus ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-500/10 text-slate-400'}`}>
                            {status?.is_pro_plus ? t('pro_dashboard.setup.tg_sync_multi.plan_plus') : t('pro_dashboard.setup.tg_sync_multi.plan_pro')}
                        </span>
                        <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest mt-1.5 whitespace-nowrap">{t('pro_dashboard.setup.tg_sync_multi.multi_node_capacity', { val: status?.is_pro_plus ? '5/5' : '1/1' })}</p>
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
                                    <span className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{platform.name}</span>
                                </div>
                                <div className="grid grid-cols-1 gap-1 opacity-60">
                                    {Array.isArray(platform.steps) && platform.steps.slice(0, 2).map((step: string, j: number) => (
                                        <div key={j} className="flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-indigo-500/30" />
                                            <span className="text-[7.5px] font-medium text-slate-500 dark:text-slate-400 truncate">{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ));
                    })()}
                </div>

                <button
                    onClick={() => { selection(); setShowSetup(true); }}
                    className="w-full h-10 vibing-blue-animated text-white font-black text-[8px] uppercase tracking-[0.15em] rounded-[1rem] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 relative overflow-hidden group/btn"
                >
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                    {t('pro_dashboard.tab_setup')} <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Elite Psychological Warfare (TOP 9) - Locked until Setup is done */}
            {(() => {
                const isSetupComplete = !!(status?.setup?.telegram_channel_id || status?.setup?.x_access_token);
                // For demo purposes, we can uncomment this to test unlocked state if needed
                // const isSetupComplete = true; 

                return (
                    <div className={`relative rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-500 overflow-hidden ${isSetupComplete
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-indigo-500/30 shadow-2xl shadow-indigo-500/10'
                        : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5'
                        }`}>

                        {!isSetupComplete && (
                            <div className="absolute inset-0 z-20 backdrop-blur-xl bg-white/40 dark:bg-black/60 flex flex-col items-center justify-center text-center p-6 sm:p-10">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative mb-6"
                                >
                                    <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-2xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-linear-to-t from-indigo-500/20 to-transparent animate-pulse" />
                                        <Lock size={32} className="text-indigo-500 relative z-10" />
                                        {/* Scanning line animation */}
                                        <motion.div
                                            className="absolute left-0 right-0 h-0.5 bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.8)] z-20"
                                            animate={{ top: ["0%", "100%", "0%"] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        />
                                    </div>
                                </motion.div>

                                <div className="space-y-2 mb-8">
                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] animate-pulse">
                                        {t('pro_dashboard.academy.bio_auth')}
                                    </span>
                                    <h4 className="text-2xl font-black uppercase text-slate-900 dark:text-white tracking-widest leading-none">
                                        {t('pro_dashboard.academy.psych_strategies.title')}
                                    </h4>
                                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 max-w-[280px] uppercase tracking-wider mx-auto">
                                        {t('pro_dashboard.academy.psych_strategies.unlock_desc')}
                                    </p>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => { selection(); setShowSetup(true); }}
                                    className="px-8 py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center gap-3 group/lock-btn"
                                >
                                    {t('pro_dashboard.academy.social_sync')} <Terminal size={14} className="group-hover/lock-btn:rotate-12 transition-transform" />
                                </motion.button>
                            </div>
                        )}

                        <div className={`p-6 sm:p-8 relative z-10 ${!isSetupComplete ? 'blur-md select-none' : ''}`}>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg ${isSetupComplete
                                        ? 'bg-indigo-500 text-white border-indigo-400 shadow-indigo-500/20'
                                        : 'bg-slate-200 dark:bg-white/10 text-slate-400 border-slate-300 dark:border-white/10'
                                        }`}>
                                        <Brain size={20} />
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-black uppercase tracking-[0.25em] leading-none mb-1.5 ${isSetupComplete ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                                            {t('pro_dashboard.academy.psych_strategies.title')}
                                        </h4>
                                        <p className={`text-[8px] font-black uppercase tracking-[0.3em] ${isSetupComplete ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-500'}`}>
                                            {t('pro_dashboard.academy.psych_strategies.subtitle')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(() => {
                                    const strats = t('pro_dashboard.academy.psych_strategies.items', { returnObjects: true });
                                    const stratsList = Array.isArray(strats) ? strats : [];
                                    return stratsList.map((item: any, i: number) => (
                                        <div key={i} className={`p-5 rounded-2xl border relative overflow-hidden group/card ${isSetupComplete
                                            ? 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-indigo-500/50'
                                            : 'bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/5'
                                            }`}>
                                            <div className="absolute top-0 right-0 px-2 py-1 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-bl-xl border-l border-b border-indigo-500/20 dark:border-indigo-500/20">
                                                <span className="text-[7px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{item.trigger}</span>
                                            </div>

                                            <div className="flex items-start gap-3 mb-3 pt-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-[10px] font-bold shrink-0 border border-indigo-500/30 dark:border-indigo-500/20">
                                                    {i + 1}
                                                </div>
                                                <h5 className={`text-xs font-black uppercase tracking-tight leading-snug mt-1 ${isSetupComplete ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                                                    {item.title}
                                                </h5>
                                            </div>

                                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-4 min-h-[40px]">
                                                {item.desc}
                                            </p>

                                            <div className="p-3 bg-slate-100 dark:bg-black/30 rounded-lg border border-slate-200 dark:border-white/5 flex items-start gap-2">
                                                <Play size={10} className="text-emerald-600 dark:text-emerald-500 mt-0.5 shrink-0" />
                                                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide leading-tight">
                                                    {item.action}
                                                </span>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </motion.div>
    );
};
