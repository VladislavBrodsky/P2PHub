import { motion } from 'framer-motion';
import {
    Zap, Flame, Search, ChevronRight, Compass, Loader2, Info, Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { renderMarkdown } from '../utils/renderMarkdown';
import { useNotificationStore } from '../../../store/useNotificationStore';

interface ToolsTabProps {
    trends: any[];
    isAuditing: boolean;
    isFetchingTrends: boolean;
    handleRunMarketingAudit: () => Promise<void>;
    handleFetchTrends: () => Promise<void>;
    setShowHeadlineModal: (show: boolean) => void;
    setShowBioModal: (show: boolean) => void;
    setShowAuditModal: (show: boolean) => void;
    marketAudit: any;
    selection: () => void;
}

export const ToolsTab = ({
    trends,
    isAuditing,
    isFetchingTrends,
    handleRunMarketingAudit,
    handleFetchTrends,
    setShowHeadlineModal,
    setShowBioModal,
    setShowAuditModal,
    marketAudit,
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
                        <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="flex items-center justify-between mb-5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-all duration-500 shadow-sm shrink-0">
                                <Zap size={18} />
                            </div>
                            <div className="flex items-center gap-2">
                                <div
                                    className="group/info relative"
                                    onClick={() => useNotificationStore.getState().showNotification({
                                        title: t('pro_dashboard.tools.headline.title'),
                                        message: t('pro_dashboard.tools.headline.info'),
                                        type: 'info'
                                    })}
                                >
                                    <Info size={14} className="text-slate-400 hover:text-indigo-500 transition-colors cursor-help" />
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-semibold rounded-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-300 w-48 text-center pointer-events-none shadow-2xl z-200">
                                        {t('pro_dashboard.tools.headline.info')}
                                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-slate-900 dark:border-t-white" />
                                    </div>
                                </div>
                                <div className="px-2.5 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 shrink-0">
                                    <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active</span>
                                </div>
                            </div>
                        </div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 truncate">{t('pro_dashboard.tools.headline.title')}</h3>
                        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-5 opacity-80 min-h-[32px]">
                            {t('pro_dashboard.tools.headline.desc')}
                        </p>
                        <button
                            onClick={() => { selection(); setShowHeadlineModal(true); }}
                            className="mt-auto w-full h-9 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[8.5px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 border border-indigo-500/20 shrink-0 relative z-20 shadow-premium-sm"
                        >
                            {t('pro_dashboard.tools.headline.btn')}
                            <ChevronRight size={10} />
                        </button>
                    </motion.div>

                    {/* Bio Generator */}
                    <motion.div
                        whileHover={{ y: -3 }}
                        className="pro-card-extreme bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-7 border border-slate-200 dark:border-white/10 group relative flex flex-col shadow-xl h-full"
                    >
                        <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="flex items-center justify-between mb-5">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-all duration-500 shadow-sm shrink-0">
                                <Sparkles size={18} />
                            </div>
                            <div className="flex items-center gap-2">
                                <div
                                    className="group/info relative"
                                    onClick={() => useNotificationStore.getState().showNotification({
                                        title: t('pro_dashboard.tools.bio.title'),
                                        message: t('pro_dashboard.tools.bio.neural_desc'),
                                        type: 'info'
                                    })}
                                >
                                    <Info size={14} className="text-slate-400 hover:text-amber-500 transition-colors cursor-help" />
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-semibold rounded-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-300 w-48 text-center pointer-events-none shadow-2xl z-200">
                                        {t('pro_dashboard.tools.bio.neural_desc')}
                                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-slate-900 dark:border-t-white" />
                                    </div>
                                </div>
                                <div className="px-2.5 py-1 bg-amber-500/10 rounded-full border border-amber-500/20 shrink-0">
                                    <span className="text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Active</span>
                                </div>
                            </div>
                        </div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 truncate">{t('pro_dashboard.tools.bio.title')}</h3>
                        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-5 opacity-80 min-h-[32px]">
                            {t('pro_dashboard.tools.bio.desc')}
                        </p>
                        <button
                            onClick={() => { selection(); setShowBioModal(true); }}
                            className="mt-auto w-full h-9 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[8.5px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 border border-amber-500/20 shrink-0 relative z-20 shadow-premium-sm"
                        >
                            {t('pro_dashboard.tools.bio.btn')}
                            <ChevronRight size={10} />
                        </button>
                    </motion.div>
                </div>

                {/* Trend Hunter Module */}
                <motion.div
                    whileHover={{ y: -3 }}
                    className="pro-card-extreme bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-7 border border-slate-200 dark:border-white/10 group relative h-full flex flex-col shadow-xl"
                >
                    <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="flex items-center justify-between mb-5 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-500 group-hover:scale-110 transition-all duration-500 shadow-sm shrink-0">
                            <Flame size={18} />
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                className="group/info relative"
                                onClick={() => useNotificationStore.getState().showNotification({
                                    title: t('pro_dashboard.tools.trends.title'),
                                    message: t('pro_dashboard.tools.trends.info'),
                                    type: 'info'
                                })}
                            >
                                <Info size={14} className="text-slate-400 hover:text-orange-500 transition-colors cursor-help" />
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-semibold rounded-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-300 w-48 text-center pointer-events-none shadow-2xl z-200">
                                    {t('pro_dashboard.tools.trends.info')}
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-slate-900 dark:border-t-white" />
                                </div>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                                <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest leading-none">{t('pro_dashboard.tools.trends.scanning')}</span>
                                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest opacity-40 mt-0.5">{t('pro_dashboard.tools.trends.node_id')}</span>
                            </div>
                        </div>
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 truncate">{t('pro_dashboard.tools.trends.title')}</h3>

                    {trends.length > 0 ? (
                        <div className="space-y-1.5 mb-5 min-h-[82px] relative z-10">
                            {trends.slice(0, 2).map((trend, i) => (
                                <div key={i} className="p-2 bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-lg text-[9px] font-semibold text-slate-500 italic truncate">
                                    "{trend.topic}"
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-5 opacity-80 min-h-[32px]">
                            {t('pro_dashboard.tools.trends.desc')}
                        </p>
                    )}

                    <button
                        onClick={() => { selection(); handleFetchTrends(); }}
                        disabled={isFetchingTrends}
                        className="mt-auto w-full h-9 bg-linear-to-r from-orange-600 to-amber-500 text-white rounded-xl font-black text-[8.5px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10 disabled:grayscale shrink-0 relative z-20"
                    >
                        {isFetchingTrends ? <Loader2 className="animate-spin w-3 h-3" /> : (
                            <>
                                {trends.length > 0 ? t('pro_dashboard.tools.trends.btn_refresh') : t('pro_dashboard.tools.trends.btn')}
                                <Compass size={10} className="animate-[spin_6s_linear_infinite]" />
                            </>
                        )}
                    </button>
                </motion.div>

                {/* Global Marketing Audit - Compact & Attractive */}
                <motion.div
                    whileHover={{ y: -2 }}
                    onClick={() => {
                        if (marketAudit && !isAuditing) {
                            selection();
                            setShowAuditModal(true);
                        }
                    }}
                    className={`pro-card-extreme bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 border border-slate-200 dark:border-indigo-500/20 group relative flex flex-col shadow-xl col-span-1 sm:col-span-2 ${marketAudit ? 'cursor-pointer' : ''}`}
                >
                    <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />

                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl vibing-blue-animated flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
                                <Search size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                        {t('pro_dashboard.tools.audit.title')}
                                    </h3>
                                    <div
                                        className="group/info relative"
                                        onClick={() => useNotificationStore.getState().showNotification({
                                            title: t('pro_dashboard.tools.audit.title'),
                                            message: t('pro_dashboard.tools.audit.info'),
                                            type: 'info'
                                        })}
                                    >
                                        <Info size={14} className="text-slate-400 hover:text-indigo-500 transition-colors cursor-help" />
                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-semibold rounded-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-300 w-48 text-center pointer-events-none shadow-2xl z-200">
                                            {t('pro_dashboard.tools.audit.info')}
                                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-slate-900 dark:border-t-white" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
                                        {t('pro_dashboard.tools.audit.status')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRunMarketingAudit();
                            }}
                            disabled={isAuditing}
                            className="w-full sm:w-auto px-4 h-9 vibing-blue-animated rounded-xl font-black text-[8.5px] uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-white shrink-0 disabled:grayscale relative z-20"
                        >
                            {isAuditing ? <Loader2 className="animate-spin w-3 h-3" /> : (
                                <>
                                    {t('pro_dashboard.tools.audit.btn')}
                                    <ChevronRight size={10} />
                                </>
                            )}
                        </button>
                    </div>

                    {/* Capability Description */}
                    <div className="p-4 bg-slate-50 dark:bg-black/30 rounded-xl border border-slate-100 dark:border-white/5 backdrop-blur-xl relative overflow-hidden shadow-inner">
                        <p className="text-[11px] sm:text-[12px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed relative z-10">
                            {renderMarkdown(t('pro_dashboard.tools.audit.capability'), true)}
                        </p>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};
