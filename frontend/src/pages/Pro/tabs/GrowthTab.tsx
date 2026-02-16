import { motion } from 'framer-motion';
import {
    Info, CheckCircle2, Bot, TrendingUp, ArrowRight, ShieldCheck,
    Terminal, Share, Flame, Globe, Send, Twitter, Linkedin, ChevronRight,
    Loader2, Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PROStatus } from '../../../services/proService';
import { renderMarkdown } from '../utils/renderMarkdown';

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

    return (
        <motion.div
            key="growth"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 sm:space-y-10 pb-12"
        >
            {/* Master Score Card - Intelligence Hub - Re-engineered for compactness */}
            <div className="pro-card-extreme bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />

                <div className="flex flex-row justify-between items-center gap-4 relative z-10 mb-6 sm:mb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                                <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Elite Alpha Node</span>
                            </div>
                            <button
                                onClick={() => { selection(); setShowManual('academy'); }}
                                className="w-7 h-7 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-indigo-500/50 hover:text-indigo-500 transition-all active:scale-90"
                            >
                                <Info size={12} />
                            </button>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                            {t('pro_dashboard.academy.protocols.title')}
                        </h3>
                    </div>

                    <div className="flex flex-col items-end">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">{t('pro_dashboard.academy.protocols.stats_label')}</p>
                        <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums leading-none flex items-baseline gap-0.5 vibing-blue-text drop-shadow-sm">
                            <motion.span
                                key={academyScore}
                                initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            >
                                {academyScore}
                            </motion.span>
                            <span className="text-indigo-500 text-base sm:text-lg opacity-50">.0</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-end text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400/60">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/40" />
                            <span>Progression Protocol</span>
                        </div>
                        <span className="text-indigo-600 dark:text-indigo-400 font-black">{Math.floor((completedStages.length / 5) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-black/20 rounded-full overflow-hidden p-0.5 shadow-inner border border-slate-200 dark:border-white/5">
                        <motion.div
                            className="h-full vibing-blue-animated rounded-full shadow-lg shadow-indigo-500/20"
                            initial={{ width: "0%" }}
                            animate={{ width: `${(completedStages.length / 5) * 100}%` }}
                            transition={{ duration: 2, ease: "circOut" }}
                        />
                    </div>
                </div>
            </div>

            {/* Expert Intelligence Transmission */}
            <div className="px-5 py-6 bg-white dark:bg-indigo-500/5 rounded-3xl border border-slate-200 dark:border-indigo-500/10 relative overflow-hidden group shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-500">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h4 className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-0.5">MESSAGES FROM ELITE NODES</h4>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest opacity-60 italic">Deciphering viral patterns...</p>
                    </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic border-l-2 border-indigo-500/50 pl-5 ml-1">
                    "{t('pro_dashboard.academy.desc')}"
                </p>
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
                            <p className="text-[8px] font-black text-indigo-500/60 uppercase tracking-widest mt-0.5">Intelligence Dossier</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 snap-x">
                    {(() => {
                        const articles = t('pro_dashboard.academy.articles.items', { returnObjects: true });
                        const articlesList = Array.isArray(articles) ? articles : [];
                        return articlesList.map((article: any, i: number) => (
                            <motion.div
                                key={article.id || i}
                                whileHover={{ y: -3 }}
                                onClick={() => { selection(); setSelectedArticle(article); impact('light'); }}
                                className="min-w-[260px] sm:min-w-[320px] snap-center pro-card-extreme p-5 sm:p-6 rounded-[1.25rem] border border-slate-200 dark:border-white/10 relative overflow-hidden group cursor-pointer active:scale-95 transition-all bg-white dark:bg-slate-900/50 shadow-sm"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2 py-0.5 bg-indigo-500/10 rounded-full text-[7px] font-black text-indigo-500 uppercase tracking-widest border border-indigo-500/10">{article.category}</span>
                                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{article.readTime} MIN READ</span>
                                </div>
                                <h5 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 leading-tight group-hover:text-indigo-500 transition-colors">{article.title}</h5>
                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-4 opacity-80 italic">"{article.desc}"</p>
                                <div className="flex items-center gap-2 text-[8px] font-black text-indigo-500 uppercase tracking-widest group-hover:gap-3 transition-all">
                                    {t('pro_dashboard.academy.articles.btn_read')} <ArrowRight size={10} />
                                </div>
                            </motion.div>
                        ));
                    })()}
                </div>
            </div>

            {/* Masterclass Modules - Optimized for compactness */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500 border border-indigo-100 dark:border-indigo-500/20">
                        <ShieldCheck size={16} />
                    </div>
                    <div>
                        <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">Synchronization Tasks</h4>
                        <p className="text-[8px] font-black text-indigo-500/60 uppercase tracking-widest mt-0.5">Unlock Node Capabilities</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {(() => {
                        const modules = t('pro_dashboard.academy.protocols.modules', { returnObjects: true });
                        const modulesList = Array.isArray(modules) ? modules : [];
                        return modulesList.map((module: any, i: number) => {
                            const isCompleted = completedStages.includes(module.id);
                            const isLoading = isCompletingStage === module.id;

                            return (
                                <motion.div
                                    key={module.id || i}
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`pro-card-extreme rounded-[1.5rem] border overflow-hidden relative transition-all group ${isCompleted
                                        ? 'opacity-60 border-emerald-500/20 bg-emerald-500/5'
                                        : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/10 shadow-md hover:border-indigo-500/30'
                                        }`}
                                >
                                    <div className="p-5 sm:p-8 space-y-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2.5 py-1 rounded-full border text-[7px] font-black uppercase tracking-widest ${module.diff === 'hard' ? 'border-red-500/30 bg-red-500/10 text-red-500' :
                                                        module.diff === 'medium' ? 'border-amber-500/30 bg-amber-500/10 text-amber-500' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                                                        }`}>
                                                        {t(`pro_dashboard.academy.protocols.difficulty_levels.${module.diff}`)}
                                                    </span>
                                                    {isCompleted && (
                                                        <div className="flex items-center gap-1 text-emerald-500 text-[7px] font-black uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                                            <CheckCircle2 size={8} />
                                                            SYNCED
                                                        </div>
                                                    )}
                                                </div>
                                                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{module.title}</h4>
                                                <p className="text-[9px] font-black text-indigo-500/70 uppercase tracking-widest">{module.hook}</p>
                                            </div>
                                            <div className="w-10 h-10 flex-none rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm shadow-sm">
                                                +{module.points}
                                            </div>
                                        </div>

                                        <p className="text-[12px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                                            {renderMarkdown(module.content)}
                                        </p>

                                        <div className="p-4 bg-slate-50 dark:bg-black/40 rounded-[1.25rem] border border-slate-100 dark:border-white/5 space-y-3 shadow-inner group/task">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                                    <Terminal size={12} />
                                                </div>
                                                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500">Node Task</span>
                                            </div>
                                            <p className="text-[12px] font-bold text-slate-900 dark:text-white leading-relaxed">
                                                {module.task}
                                            </p>
                                            {module.link && (
                                                <a
                                                    href={module.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest hover:text-indigo-500 transition-colors"
                                                >
                                                    {module.cta || 'Initiate Sync'} <Share size={10} />
                                                </a>
                                            )}
                                        </div>

                                        {!isCompleted && (
                                            <button
                                                onClick={() => handleCompleteAcademyStage(module.id)}
                                                disabled={isLoading}
                                                className="w-full h-12 vibing-blue-animated rounded-[1rem] font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 text-white"
                                            >
                                                {isLoading ? <Loader2 size={16} className="animate-spin" /> : (
                                                    <>
                                                        Sync Protocol <Sparkles size={14} />
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        });
                    })()}
                </div>
            </div>

            {/* Lifehacks & Strategy Dossier - Compact Grid-ready */}
            <div className="pro-card-extreme p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/10 relative overflow-hidden group bg-white/40 dark:bg-slate-950/40 shadow-xl">
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
                            <div key={i} className="flex gap-3 p-3.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 hover:border-pink-500/20 transition-all group/hack cursor-default shadow-xs">
                                <div className="w-7 h-7 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500 font-black text-xs shrink-0 border border-pink-500/10 shadow-inner group-hover/hack:scale-110 transition-transform">{i + 1}</div>
                                <div className="space-y-0.5">
                                    <h5 className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-tight leading-tight">{hack.title}</h5>
                                    <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-tight italic opacity-70 line-clamp-1">"{hack.desc}"</p>
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            </div>

            <div className="glass-panel-premium p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 dark:border-white/10 relative overflow-hidden group bg-white dark:bg-slate-950 shadow-2xl">
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="flex items-center gap-3 mb-6 relative z-10 font-sans">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 shadow-lg group-hover:rotate-6 transition-transform">
                        <Globe size={20} className="text-indigo-500" />
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white leading-none mb-1">{t('pro_dashboard.academy.social_setup.title')}</h4>
                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em]">{t('pro_dashboard.academy.social_setup.subtitle')}</p>
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
        </motion.div>
    );
};
