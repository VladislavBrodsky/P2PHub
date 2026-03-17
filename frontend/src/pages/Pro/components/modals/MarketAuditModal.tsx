import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Zap, Loader2, Quote, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MarketAuditModalProps {
    showAuditModal: boolean;
    setShowAuditModal: (show: boolean) => void;
    marketAudit: any;
    isAuditing: boolean;
    handleRefreshAudit: () => void;
    selection: () => void;
}

export const MarketAuditModal: React.FC<MarketAuditModalProps> = ({
    showAuditModal,
    setShowAuditModal,
    marketAudit,
    isAuditing,
    handleRefreshAudit,
    selection
}) => {
    const { t } = useTranslation('pro');

    return (
        <AnimatePresence>
            {showAuditModal && marketAudit && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/95 backdrop-blur-xl"
                    onClick={() => setShowAuditModal(false)}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-2xl rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/98 backdrop-blur-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] flex flex-col max-h-[92vh] relative overflow-hidden"
                    >
                        {/* Animated Top Border */}
                        <div className="absolute top-0 left-0 w-full h-1.5 overflow-hidden">
                            <div className="absolute inset-0 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-gradient-x" />
                        </div>

                        {/* Header Section */}
                        <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-linear-to-b from-indigo-500/5 to-transparent sticky top-0 z-20">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                    <TrendingUp size={24} className="text-white" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1 truncate">
                                        {t('pro_dashboard.tools.audit.modal_title')}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
                                            <span className="text-label font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
                                                {t('pro_dashboard.tools.audit.node_status_sync')}
                                            </span>
                                        </div>
                                        <span className="text-slate-300 dark:text-slate-700">|</span>
                                        <span className="text-label font-bold text-slate-400 uppercase tracking-widest tabular-nums">
                                            {marketAudit.generated_at ? new Date(marketAudit.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('pro_dashboard.status_online')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => { selection(); handleRefreshAudit(); }}
                                    disabled={isAuditing}
                                    className="hidden sm:flex h-10 px-4 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 text-label font-bold uppercase tracking-widest items-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {isAuditing ? <Loader2 className="animate-spin w-3 h-3" /> : <Zap size={14} className="text-indigo-500" />}
                                    {isAuditing ? t('pro_dashboard.tools.audit.scanning') : t('pro_dashboard.tools.audit.update_btn')}
                                </button>
                                <button
                                    onClick={() => setShowAuditModal(false)}
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                >
                                    <X size={20} className="text-slate-900 dark:text-white/60" />
                                </button>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 overflow-y-auto no-scrollbar p-5 sm:p-8 space-y-6">

                            {marketAudit.error ? (
                                <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4">
                                    <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-2">
                                        <X size={32} />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase">{t('pro_dashboard.tools.audit.error_title')}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{marketAudit.error}</p>
                                    <button
                                        onClick={() => handleRefreshAudit()}
                                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-indigo-500/20"
                                    >
                                        {t('pro_dashboard.tools.audit.force_sync_btn')}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Premium Bento Grid Sections */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Executive Summary Card */}
                                        <div className="col-span-1 sm:col-span-2 p-6 bg-linear-to-br from-indigo-500/10 to-purple-500/5 dark:bg-white/2 rounded-2xl border border-indigo-500/10 dark:border-white/5 relative overflow-hidden group shadow-sm">
                                            <Quote className="absolute -top-4 -right-4 text-indigo-500/10 rotate-12" size={80} />
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                                                <h4 className="text-label font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">{t('pro_dashboard.tools.audit.summary_title')}</h4>
                                            </div>
                                            <p className="text-caption sm:text-sm font-medium text-slate-800 dark:text-slate-300 leading-relaxed italic relative z-10">
                                                {marketAudit.cmo_summary}
                                            </p>
                                        </div>

                                        {/* Market Sentiment Stats */}
                                        <div className="p-5 bg-emerald-500/5 dark:bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex flex-col justify-center space-y-1">
                                            <p className="text-label font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-widest">{t('pro_dashboard.tools.audit.sentiment_label')}</p>
                                            <div className="flex items-end gap-2">
                                                <p className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">{marketAudit.market_sentiment}</p>
                                                <TrendingUp size={16} className="text-emerald-500 mb-0.5" />
                                            </div>
                                        </div>

                                        {/* Global Trend Shift */}
                                        <div className="p-5 bg-amber-500/5 dark:bg-amber-500/5 rounded-2xl border border-amber-500/10 flex flex-col justify-center space-y-1">
                                            <p className="text-label font-bold text-amber-600/70 dark:text-amber-500/70 uppercase tracking-widest">{t('pro_dashboard.tools.audit.shift_label')}</p>
                                            <p className="text-label font-bold text-slate-900 dark:text-slate-300 leading-tight uppercase line-clamp-2">{marketAudit.global_trend_shift}</p>
                                        </div>
                                    </div>

                                    {/* Viral News Feed Sections - Bento Grid Layout */}
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
                                                <h4 className="text-label font-bold text-slate-900 dark:text-white uppercase tracking-widest">{t('pro_dashboard.tools.audit.live_tracker')}</h4>
                                            </div>
                                            <div className="px-2 py-0.5 bg-rose-500/10 rounded-md text-label font-bold text-rose-500 uppercase tracking-[0.2em] animate-pulse">
                                                {t('pro_dashboard.tools.audit.live_timeframe')}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            {marketAudit.top_news?.slice(0, 20).map((news: any, idx: number) => (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    viewport={{ once: true, margin: "-20px" }}
                                                    className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 group shadow-sm flex flex-col sm:flex-row gap-4 relative overflow-hidden ${idx === 0
                                                        ? 'bg-linear-to-br from-indigo-500/5 via-white to-white dark:from-indigo-500/10 dark:via-slate-900 dark:to-slate-900 border-indigo-500/20'
                                                        : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 hover:border-indigo-500/20'
                                                        }`}
                                                >
                                                    {/* Number Badge */}
                                                    <div className="hidden sm:flex w-10 h-10 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 items-center justify-center text-xs font-bold text-indigo-500 shrink-0 group-hover:scale-110 transition-transform">
                                                        {(idx + 1).toString().padStart(2, '0')}
                                                    </div>

                                                    <div className="flex-1 space-y-2.5">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="px-2 py-0.5 bg-indigo-500/10 rounded-md text-label font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">{news.source}</span>
                                                            <span className={`px-2 py-0.5 rounded-md text-label font-bold uppercase tracking-[0.2em] ${news.impact === 'Massive'
                                                                ? 'bg-rose-500/10 text-rose-500'
                                                                : 'bg-emerald-500/10 text-emerald-500'
                                                                }`}>{news.relevance === 'Massive' ? t('pro_dashboard.tools.audit.relevance_massive') : t('pro_dashboard.tools.audit.relevance_high')} {t('pro_dashboard.tools.audit.relevance')}</span>
                                                            {idx === 0 && <span className="px-2 py-0.5 bg-amber-500/10 rounded-md text-label font-bold text-amber-500 uppercase tracking-[0.2em] animate-bounce">{t('pro_dashboard.tools.audit.hot_now')}</span>}
                                                        </div>

                                                        <h5 className="text-body font-bold text-slate-900 dark:text-white leading-tight uppercase group-hover:text-indigo-500 transition-colors">
                                                            {news.title}
                                                        </h5>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                                            <div className="p-2.5 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5">
                                                                <p className="text-label font-bold text-slate-500 dark:text-slate-400 leading-snug">
                                                                    {news.impact || news.motivation || t('pro_dashboard.tools.audit.analyzing')}
                                                                </p>
                                                            </div>
                                                            <div className="p-2.5 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-xl border border-indigo-500/10 flex items-center gap-2">
                                                                <Zap size={10} className="text-amber-500 shrink-0" />
                                                                <p className="text-label font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest line-clamp-1">
                                                                    {news.fomo_trigger || t('pro_dashboard.tools.audit.action_required')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="sm:hidden absolute top-4 right-4 text-label font-bold text-slate-200 dark:text-white/5">
                                                        #{(idx + 1)}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Viral Motivation Summary */}
                                    <div className="p-6 bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-2xl border border-white/20 space-y-4 relative overflow-hidden group shadow-xl">
                                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl" />
                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                                                <Flame size={20} className="animate-bounce" />
                                            </div>
                                            <h4 className="text-caption font-bold text-white uppercase tracking-widest">{t('pro_dashboard.tools.audit.imperative')}</h4>
                                        </div>
                                        <p className="text-caption sm:text-caption font-bold text-indigo-50 leading-relaxed italic relative z-10 px-1">
                                            "{marketAudit.viral_motivation}"
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
