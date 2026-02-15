import { motion } from 'framer-motion';
import {
    Zap, Flame, Search, ChevronRight, Compass, Monitor, Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { renderMarkdown } from '../utils/renderMarkdown';

interface ToolsTabProps {
    trends: any[];
    isAuditing: boolean;
    isFetchingTrends: boolean;
    handleRunMarketingAudit: () => Promise<void>;
    handleFetchTrends: () => Promise<void>;
    setShowHeadlineModal: (show: boolean) => void;
    selection: () => void;
}

export const ToolsTab = ({
    trends,
    isAuditing,
    isFetchingTrends,
    handleRunMarketingAudit,
    handleFetchTrends,
    setShowHeadlineModal,
    selection
}: ToolsTabProps) => {
    const { t } = useTranslation();

    return (
        <motion.div
            key="tools"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
        >
            {/* Neural Tool Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                {/* Headline & Bio AI Module */}
                <div className="space-y-6 flex flex-col">
                    {/* Headline Fixer */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="pro-card-extreme bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/10 group relative flex flex-col shadow-2xl h-full"
                    >
                        <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 overflow-hidden">
                                <Zap size={24} />
                            </div>
                            <div className="px-3 py-1 bg-slate-50 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10">
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Active</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 px-1">{t('pro_dashboard.tools.headline.title')}</h3>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-8 px-1 opacity-80">
                            {t('pro_dashboard.tools.headline.desc')}
                        </p>
                        <button
                            onClick={() => { selection(); setShowHeadlineModal(true); }}
                            className="mt-auto w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3 border border-indigo-500/20 group/btn"
                        >
                            {t('pro_dashboard.tools.headline.btn')}
                            <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </motion.div>
                </div>

                {/* Trend Hunter Module */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="pro-card-extreme bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/10 group relative h-full flex flex-col shadow-2xl noise-overlay holographic-shine"
                >
                    <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-xl shadow-orange-500/10">
                            <Flame size={24} />
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em]">Live Node</span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest opacity-40">Scanning Global...</span>
                        </div>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-3 px-1">{t('pro_dashboard.tools.trends.title')}</h3>

                    {trends.length > 0 ? (
                        <div className="space-y-3 mb-8">
                            {trends.slice(0, 2).map((trend, i) => (
                                <div key={i} className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-[10px] font-bold text-slate-500 italic opacity-80">
                                    "{trend.topic}"
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-8 px-1 opacity-80">
                            {t('pro_dashboard.tools.trends.desc')}
                        </p>
                    )}

                    <button
                        onClick={() => { selection(); handleFetchTrends(); }}
                        disabled={isFetchingTrends}
                        className="mt-auto w-full h-14 vibing-blue-animated rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 disabled:grayscale disabled:opacity-70"
                    >
                        {isFetchingTrends ? <Loader2 className="animate-spin w-5 h-5" /> : (
                            <>
                                {trends.length > 0 ? t('pro_dashboard.tools.trends.btn_refresh') : t('pro_dashboard.tools.trends.btn')}
                                <Compass size={16} className={isFetchingTrends ? "animate-spin" : "animate-[spin_4s_linear_infinite]"} />
                            </>
                        )}
                    </button>
                </motion.div>

                {/* Global Marketing Audit - Flagship Centerpiece */}
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="pro-card-extreme bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-indigo-500/30 group relative flex flex-col shadow-3xl col-span-1 sm:col-span-2 holographic-shine border-gradient-pro"
                >
                    <div className="absolute -right-20 -top-20 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full group-hover/btn:scale-125 transition-transform duration-1000" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-10">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-3xl vibing-blue-animated flex items-center justify-center text-white shadow-3xl shadow-indigo-500/30 vibrating-glow-blue relative">
                                <div className="absolute -inset-3 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
                                <Search size={40} className="relative z-10" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">{t('pro_dashboard.tools.audit.title')}</h3>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Global Audit Protocol 2.5 Active</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleRunMarketingAudit}
                            disabled={isAuditing}
                            className="w-full sm:w-auto px-12 h-20 vibing-blue-animated rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-3xl active:scale-95 transition-all flex items-center justify-center gap-4 border border-white/20 hover:shadow-indigo-500/50"
                        >
                            {isAuditing ? <Loader2 className="animate-spin w-6 h-6" /> : (
                                <>
                                    {t('pro_dashboard.tools.audit.btn')}
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                        <ChevronRight size={18} />
                                    </div>
                                </>
                            )}
                        </button>
                    </div>
                    <div className="p-8 bg-white/80 dark:bg-black/40 rounded-[2.5rem] border border-black/5 dark:border-white/10 backdrop-blur-3xl relative overflow-hidden group/con shadow-inner">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/con:opacity-40 transition-opacity">
                            <Monitor size={60} className="text-indigo-500" />
                        </div>
                        <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-400 leading-relaxed max-w-4xl relative z-10">
                            {renderMarkdown(t('pro_dashboard.tools.audit.capability'), true)}
                        </p>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};
