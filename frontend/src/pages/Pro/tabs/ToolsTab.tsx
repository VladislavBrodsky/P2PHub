import { motion } from 'framer-motion';
import {
    Zap, Flame, Search, ChevronRight, Compass, Loader2
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
                        whileHover={{ y: -3 }}
                        className="pro-card-extreme bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-7 border border-slate-200 dark:border-white/10 group relative flex flex-col shadow-xl h-full"
                    >
                        <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="flex items-center justify-between mb-5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-all duration-500 shadow-sm">
                                <Zap size={18} />
                            </div>
                            <div className="px-2.5 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active</span>
                            </div>
                        </div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">{t('pro_dashboard.tools.headline.title')}</h3>
                        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-5 opacity-80">
                            {t('pro_dashboard.tools.headline.desc')}
                        </p>
                        <button
                            onClick={() => { selection(); setShowHeadlineModal(true); }}
                            className="mt-auto w-full h-11 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 border border-indigo-500/20"
                        >
                            {t('pro_dashboard.tools.headline.btn')}
                            <ChevronRight size={12} />
                        </button>
                    </motion.div>
                </div>

                {/* Trend Hunter Module */}
                <motion.div
                    whileHover={{ y: -3 }}
                    className="pro-card-extreme bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-7 border border-slate-200 dark:border-white/10 group relative h-full flex flex-col shadow-xl"
                >
                    <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex items-center justify-between mb-5">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-500 group-hover:scale-110 transition-all duration-500 shadow-sm">
                            <Flame size={18} />
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest leading-none">{t('pro_dashboard.tools.trends.scanning')}</span>
                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest opacity-40 mt-0.5">{t('pro_dashboard.tools.trends.node_id')}</span>
                        </div>
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">{t('pro_dashboard.tools.trends.title')}</h3>

                    {trends.length > 0 ? (
                        <div className="space-y-1.5 mb-5">
                            {trends.slice(0, 2).map((trend, i) => (
                                <div key={i} className="p-2.5 bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-lg text-[10px] font-semibold text-slate-500 italic">
                                    "{trend.topic}"
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-5 opacity-80">
                            {t('pro_dashboard.tools.trends.desc')}
                        </p>
                    )}

                    <button
                        onClick={() => { selection(); handleFetchTrends(); }}
                        disabled={isFetchingTrends}
                        className="mt-auto w-full h-11 vibing-blue-animated rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 disabled:grayscale"
                    >
                        {isFetchingTrends ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : (
                            <>
                                {trends.length > 0 ? t('pro_dashboard.tools.trends.btn_refresh') : t('pro_dashboard.tools.trends.btn')}
                                <Compass size={12} className="animate-[spin_6s_linear_infinite]" />
                            </>
                        )}
                    </button>
                </motion.div>

                {/* Global Marketing Audit - Optimized spacing */}
                <motion.div
                    whileHover={{ scale: 1.005 }}
                    className="pro-card-extreme bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-slate-200 dark:border-indigo-500/20 group relative flex flex-col shadow-2xl col-span-1 sm:col-span-2"
                >
                    <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-xl vibing-blue-animated flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 relative">
                                <Search size={24} className="relative z-10" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-0.5">{t('pro_dashboard.tools.audit.title')}</h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Protocol 2.5 Active</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleRunMarketingAudit}
                            disabled={isAuditing}
                            className="w-full sm:w-auto px-6 h-12 vibing-blue-animated rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 text-white"
                        >
                            {isAuditing ? <Loader2 className="animate-spin w-4 h-4" /> : (
                                <>
                                    {t('pro_dashboard.tools.audit.btn')}
                                    <ChevronRight size={14} />
                                </>
                            )}
                        </button>
                    </div>
                    <div className="p-5 bg-slate-50 dark:bg-black/40 rounded-xl border border-slate-100 dark:border-white/5 backdrop-blur-3xl relative overflow-hidden shadow-inner">
                        <p className="text-[12px] sm:text-[13px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl relative z-10">
                            {renderMarkdown(t('pro_dashboard.tools.audit.capability'), true)}
                        </p>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};
