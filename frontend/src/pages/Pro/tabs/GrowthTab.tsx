import { motion } from 'framer-motion';
import {
    Info, CheckCircle2, Bot, TrendingUp, ArrowRight, ShieldCheck,
    Terminal, Share, Flame, Globe, Send, Twitter, Linkedin, ChevronRight
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
            className="space-y-10 pb-12"
        >
            {/* Master Score Card - Intelligence Hub */}
            <div className="pro-card-extreme rounded-[3rem] sm:rounded-[4rem] p-8 sm:p-14 border border-white/10 shadow-3xl relative overflow-hidden group holographic-shine noise-overlay">
                <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full -mr-64 -mt-64 animate-pulse" />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-10 relative z-10 mb-16">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] drop-shadow-sm">Node Status: Elite Alpha</span>
                            </div>
                            <button
                                onClick={() => { selection(); setShowManual('academy'); }}
                                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-indigo-500/50 hover:text-indigo-500 transition-all hover:scale-110"
                            >
                                <Info size={16} />
                            </button>
                        </div>
                        <h3 className="text-5xl sm:text-7xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-[0.9] drop-shadow-3xl max-w-[600px]">
                            {t('pro_dashboard.academy.protocols.title')}
                        </h3>
                    </div>

                    <div className="flex flex-col items-start sm:items-end">
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.6em] mb-4">{t('pro_dashboard.academy.protocols.stats_label')}</p>
                        <div className="text-7xl sm:text-9xl font-black text-slate-900 dark:text-white tabular-nums leading-none flex items-baseline justify-start sm:justify-end vibing-crystal-text drop-shadow-3xl">
                            {academyScore}<span className="text-indigo-500 text-3xl sm:text-5xl">.0</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 relative z-10">
                    <div className="flex justify-between items-end text-[10px] sm:text-xs font-black uppercase tracking-[0.5em] text-slate-500 dark:text-slate-400/60">
                        <div className="flex items-center gap-4">
                            <div className="w-3 h-8 bg-indigo-500 rounded-full vibrating-glow-blue" />
                            <span>Protocol Synchronization Level</span>
                        </div>
                        <span className="text-indigo-500 font-black">{Math.floor((completedStages.length / 5) * 100)}% Complete</span>
                    </div>
                    <div className="h-5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-1.5 shadow-inner border border-black/5 dark:border-white/5">
                        <motion.div
                            className="h-full vibing-blue-animated rounded-full shadow-[0_0_25px_rgba(0,102,255,0.6)]"
                            initial={{ width: "0%" }}
                            animate={{ width: `${(completedStages.length / 5) * 100}%` }}
                            transition={{ duration: 2, ease: "circOut" }}
                        />
                    </div>
                </div>
            </div>

            {/* Expert Intelligence Transmission */}
            <div className="px-4 py-8 bg-indigo-500/5 rounded-[3rem] border border-indigo-500/10 relative overflow-hidden group">
                <div className="flex items-center gap-6 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                        <Bot size={32} />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-indigo-500 uppercase tracking-[0.4em] mb-1">MESSAGES FROM ELITE NODES</h4>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest opacity-60 italic">Deciphering viral growth patterns...</p>
                    </div>
                </div>
                <p className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-slate-200 leading-relaxed italic opacity-90 relative z-10 border-l-4 border-indigo-500 pl-8 ml-2">
                    "{t('pro_dashboard.academy.desc')}"
                </p>
            </div>

            {/* Viral Content Hub */}
            <div className="space-y-8">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-xl">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('pro_dashboard.academy.articles.title')}</h4>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] opacity-60">Intelligence Dossier</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar -mx-4 px-4 snap-x">
                    {(t('pro_dashboard.academy.articles.items', { returnObjects: true }) as any[]).map((article: any, i: number) => (
                        <motion.div
                            key={article.id}
                            whileHover={{ y: -10, scale: 1.02 }}
                            onClick={() => { selection(); setSelectedArticle(article); impact('light'); }}
                            className="min-w-[300px] sm:min-w-[400px] snap-center pro-card-extreme p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden group cursor-pointer active:scale-95 transition-all bg-white/80 dark:bg-slate-950/40 shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl group-hover:bg-indigo-500/20 transition-colors" />
                            <div className="flex items-center gap-3 mb-6">
                                <span className="px-3 py-1 bg-indigo-500/10 rounded-full text-[9px] font-black text-indigo-500 uppercase tracking-widest border border-indigo-500/20">{article.category}</span>
                                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{article.readTime} MISSION TIME</span>
                            </div>
                            <h5 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 leading-tight group-hover:text-indigo-500 transition-colors">{article.title}</h5>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-8 opacity-70 italic">"{article.desc}"</p>
                            <div className="flex items-center gap-3 text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] group-hover:gap-5 transition-all">
                                {t('pro_dashboard.academy.articles.btn_read')} <ArrowRight size={14} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Masterclass Modules - Node Synchronization */}
            <div className="grid grid-cols-1 gap-8">
                <div className="flex items-center gap-4 px-2">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-xl">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Synchronization Tasks</h4>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] opacity-60">Unlock Node Capabilities</p>
                    </div>
                </div>

                {(t('pro_dashboard.academy.protocols.modules', { returnObjects: true }) as any[]).map((module: any, i: number) => {
                    const isCompleted = completedStages.includes(module.id);
                    const isLoading = isCompletingStage === module.id;

                    return (
                        <motion.div
                            key={module.id}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`pro-card-extreme rounded-[3rem] border overflow-hidden relative transition-all group ${isCompleted
                                ? 'opacity-60 border-indigo-500/20 bg-indigo-500/5'
                                : 'border-white/10 shadow-2xl hover:border-indigo-500/30'
                                }`}
                        >
                            <div className="p-10 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.3em] ${module.diff === 'hard' ? 'border-red-500/30 bg-red-500/10 text-red-500' :
                                                module.diff === 'medium' ? 'border-amber-500/30 bg-amber-500/10 text-amber-500' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                                                }`}>
                                                {t(`pro_dashboard.academy.protocols.difficulty_levels.${module.diff}`)}
                                            </span>
                                            {isCompleted && (
                                                <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                                    <CheckCircle2 size={12} />
                                                    SYNCED
                                                </div>
                                            )}
                                        </div>
                                        <h4 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{module.title}</h4>
                                        <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.4em]">{module.hook}</p>
                                    </div>
                                    <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 font-black text-xl shadow-xl">
                                        +{module.points}
                                    </div>
                                </div>

                                <p className="text-base font-medium text-slate-600 dark:text-slate-400 leading-relaxed max-w-4xl">
                                    {renderMarkdown(module.content)}
                                </p>

                                <div className="p-8 bg-slate-900 dark:bg-black/40 rounded-[2.5rem] border border-white/5 space-y-5 shadow-inner group/task">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                                <Terminal size={18} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Node Configuration Task</span>
                                        </div>
                                    </div>
                                    <p className="text-sm sm:text-lg font-bold text-white leading-relaxed opacity-90">
                                        {module.task}
                                    </p>
                                    {module.link && (
                                        <a
                                            href={module.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 text-indigo-400 text-xs font-black uppercase tracking-[0.3em] hover:text-white transition-colors group/link"
                                        >
                                            {module.cta || 'Initiate Sync'} <Share size={14} className="group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                                        </a>
                                    )}
                                </div>

                                {!isCompleted && (
                                    <button
                                        onClick={() => handleCompleteAcademyStage(module.id)}
                                        disabled={isLoading}
                                        className="w-full h-20 vibing-blue-animated rounded-3xl font-black text-xs uppercase tracking-[0.4em] active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-3xl shadow-indigo-500/30"
                                    >
                                        {isLoading ? <Loader2 size={24} className="animate-spin" /> : (
                                            <>
                                                Synchronize Lesson <Sparkles size={20} />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Lifehacks & Strategy Dossier */}
            <div className="pro-card-extreme p-10 rounded-[3rem] border border-white/10 relative overflow-hidden group bg-white/40 dark:bg-slate-950/40 shadow-2xl hover:shadow-pink-500/10 transition-all duration-700">
                <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 blur-[100px] pointer-events-none group-hover:opacity-20 transition-opacity" />

                <div className="flex items-center justify-between mb-10 relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center border border-pink-500/20 shadow-2xl group-hover:rotate-12 transition-transform">
                            <Flame size={28} className="text-pink-500" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white leading-none mb-2">{t('pro_dashboard.academy.lifehacks.title')}</h4>
                            <p className="text-[10px] font-black text-pink-500/60 uppercase tracking-[0.4em]">{t('pro_dashboard.academy.lifehacks.subtitle')}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { selection(); setShowManual('tools'); }}
                        className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-pink-500 hover:bg-pink-500/20 transition-all shadow-xl"
                    >
                        <Info size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    {(t('pro_dashboard.academy.lifehacks.items', { returnObjects: true }) as any[]).map((hack: any, i: number) => (
                        <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-pink-500/20 transition-all group/hack cursor-default shadow-sm hover:shadow-md">
                            <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 font-black text-xs shrink-0 border border-pink-500/10 shadow-inner group-hover/hack:scale-110 transition-transform">{i + 1}</div>
                            <div className="space-y-1">
                                <h5 className="text-[11px] font-black uppercase text-slate-900 dark:text-white tracking-tight">{hack.title}</h5>
                                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic opacity-70 line-clamp-1">"{hack.desc}"</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-panel-premium p-7 rounded-[2.5rem] border border-white/10 relative overflow-hidden group bg-slate-950 shadow-3xl">
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="flex items-center gap-4 mb-8 relative z-10 font-sans">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-xl group-hover:rotate-6 transition-transform">
                        <Globe size={24} className="text-indigo-500" />
                    </div>
                    <div>
                        <h4 className="text-[12px] font-black uppercase tracking-[0.25em] text-white leading-none mb-1.5">{t('pro_dashboard.academy.social_setup.title')}</h4>
                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em]">{t('pro_dashboard.academy.social_setup.subtitle')}</p>
                    </div>
                </div>

                <div className="space-y-3 relative z-10 mb-6">
                    {(t('pro_dashboard.academy.social_setup.platforms', { returnObjects: true, bot_username: status?.bot_username || 'pintopay_probot' }) as any[]).map((platform: any, i: number) => (
                        <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group/platform">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20 group-hover/platform:scale-110 transition-transform">
                                    {platform.name.includes('Telegram') && <Send size={14} className="text-indigo-500" />}
                                    {platform.name.includes('X') && <Twitter size={14} className="text-indigo-500" />}
                                    {platform.name.includes('LinkedIn') && <Linkedin size={14} className="text-indigo-500" />}
                                </div>
                                <span className="text-[9.5px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{platform.name}</span>
                            </div>
                            <div className="grid grid-cols-1 gap-1.5 opacity-60">
                                {platform.steps.slice(0, 2).map((step: string, j: number) => (
                                    <div key={j} className="flex items-center gap-2">
                                        <div className="w-1 h-2 rounded-full bg-indigo-500/30" />
                                        <span className="text-[8px] font-medium text-slate-500 dark:text-slate-400 truncate">{step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => { selection(); setShowSetup(true); }}
                    className="w-full h-11 vibing-blue-animated text-white font-black text-[9px] uppercase tracking-[0.2em] rounded-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 relative overflow-hidden group/btn"
                >
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                    {t('pro_dashboard.tab_setup')} <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>
        </motion.div>
    );
};
