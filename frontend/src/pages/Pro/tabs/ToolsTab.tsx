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
                        className="pro-card-extreme bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[2rem] p-6 sm:p-8 border border-slate-200 dark:border-white/10 group relative flex flex-col shadow-xl h-full"
                    >
                        <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-500 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 overflow-hidden shadow-sm">
                                <Zap size={20} />
                            </div>
                            <div className="px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active</span>
                            </div>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">{t('pro_dashboard.tools.headline.title')}</h3>
                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-6 opacity-80">
                            {t('pro_dashboard.tools.headline.desc')}
                        </p>
                        <button
                            onClick={() => { selection(); setShowHeadlineModal(true); }}
                            className="mt-auto w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3 border border-indigo-500/20"
                        >
                            {t('pro_dashboard.tools.headline.btn')}
                            <ChevronRight size={14} />
                        </button>
                    </motion.div>
                </div>

                {/* Trend Hunter Module */}
                <motion.div
                    whileHover={{ y: -5 }}
                    className="pro-card-extreme bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[2rem] p-6 sm:p-8 border border-slate-200 dark:border-white/10 group relative h-full flex flex-col shadow-xl"
                >
                    <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-500 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-sm">
                            <Flame size={20} />
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest leading-none">Scanning</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest opacity-40 mt-0.5">Global Node 1</span>
                        </div>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">{t('pro_dashboard.tools.trends.title')}</h3>

                    {trends.length > 0 ? (
                        <div className="space-y-2 mb-6">
                            {trends.slice(0, 2).map((trend, i) => (
                                <div key={i} className="p-3 bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl text-[11px] font-semibold text-slate-500 italic">
                                    "{trend.topic}"
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-6 opacity-80">
                            {t('pro_dashboard.tools.trends.desc')}
                        </p>
                    )}

                    <button
                        onClick={() => { selection(); handleFetchTrends(); }}
                        disabled={isFetchingTrends}
                        className="mt-auto w-full h-12 vibing-blue-animated rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/10 disabled:grayscale"
                    >
                        {isFetchingTrends ? <Loader2 className="animate-spin w-4 h-4" /> : (
                            <>
                                {trends.length > 0 ? t('pro_dashboard.tools.trends.btn_refresh') : t('pro_dashboard.tools.trends.btn')}
                                <Compass size={14} className="animate-[spin_6s_linear_infinite]" />
                            </>
                        )}
                    </button>
                </motion.div>

                {/* Global Marketing Audit - Flagship Centerpiece */}
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="pro-card-extreme bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[2.5rem] p-8 sm:p-10 border border-slate-200 dark:border-indigo-500/20 group relative flex flex-col shadow-2xl col-span-1 sm:col-span-2"
                >
                    <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-[1.25rem] vibing-blue-animated flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 relative">
                                <Search size={28} className="relative z-10" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{t('pro_dashboard.tools.audit.title')}</h3>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Protocol 2.5 Active</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleRunMarketingAudit}
                            disabled={isAuditing}
                            className="w-full sm:w-auto px-8 h-14 vibing-blue-animated rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 text-white"
                        >
                            {isAuditing ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                <>
                                    {t('pro_dashboard.tools.audit.btn')}
                                    <ChevronRight size={16} />
                                </>
                            )}
                        </button>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-black/40 rounded-2xl border border-slate-100 dark:border-white/5 backdrop-blur-3xl relative overflow-hidden shadow-inner">
                        <p className="text-[13px] sm:text-[14px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl relative z-10">
                            {renderMarkdown(t('pro_dashboard.tools.audit.capability'), true)}
                        </p>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};
