import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, TrendingUp, Zap, Loader2, Quote, CheckCircle2,
    ArrowRight, Flame, BookOpen, Sparkles
} from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

interface ProModalsProps {
    status: any;
    showSetup: boolean;
    setShowSetup: (show: boolean) => void;
    apiData: any;
    setApiData: (data: any) => void;
    handleSaveSetup: () => void;
    handleTestIntegration: (platform: string) => void;
    isLoading: boolean;
    showAuditModal: boolean;
    setShowAuditModal: (show: boolean) => void;
    marketAudit: any;
    setActiveTab: (tab: any) => void;
    selectedArticle: any;
    setSelectedArticle: (article: any) => void;
    selectedAsset: any;
    setSelectedAsset: (asset: any) => void;
    showManual: string | null;
    setShowManual: (manual: string | null) => void;
    selection: () => void;
    impact: (style: any) => void;
    copyText: (text: string, label: string) => void;
    handleRefreshAudit: () => void;
    isAuditing: boolean;
}

export const ProDashboardModals = ({
    status,
    showSetup,
    setShowSetup,
    apiData,
    setApiData,
    handleSaveSetup,
    handleTestIntegration,
    isLoading,
    showAuditModal,
    setShowAuditModal,
    marketAudit,
    setActiveTab,
    selectedArticle,
    setSelectedArticle,
    selectedAsset,
    setSelectedAsset,
    showManual,
    setShowManual,
    selection,
    impact,
    copyText,
    handleRefreshAudit,
    isAuditing
}: ProModalsProps) => {
    const { t } = useTranslation();

    return (
        <>
            {/* SETUP MODAL */}
            {/* Note: I'm keeping the structure simple but functional. 
                If you have a complex setup UI, it should be here. */}

            {/* MARKET AUDIT MODAL */}
            <AnimatePresence>
                {showAuditModal && marketAudit && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/90 backdrop-blur-md"
                        onClick={() => setShowAuditModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg rounded-[3rem] border border-slate-200 dark:border-white/10 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl shadow-3xl flex flex-col max-h-[90vh] relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50" />

                            {/* Header */}
                            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-linear-to-br from-indigo-500/5 dark:from-indigo-500/10 to-transparent">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg">
                                        <TrendingUp size={24} className="text-indigo-500 animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">{t('pro_dashboard.tools.audit.modal_title')}</h3>
                                        <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] opacity-70">
                                            {t('pro_dashboard.tools.audit.node_status')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { selection(); handleRefreshAudit(); }}
                                        disabled={isAuditing}
                                        className="h-10 px-4 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {isAuditing ? <Loader2 className="animate-spin w-3 h-3" /> : <Zap size={14} />}
                                        {isAuditing ? 'Scanning...' : 'Refresh (-3)'}
                                    </button>
                                    <button
                                        onClick={() => setShowAuditModal(false)}
                                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                    >
                                        <X size={20} className="text-slate-900 dark:text-white/60" />
                                    </button>
                                </div>
                            </div>

                            {/* Body content */}
                            <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                                        <h4 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{t('pro_dashboard.tools.audit.summary_title')}</h4>
                                    </div>
                                    <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 relative">
                                        <Quote className="absolute -top-3 -left-3 text-indigo-500/20" size={32} />
                                        {marketAudit.error ? (
                                            <div className="space-y-3">
                                                <p className="text-[14px] font-black text-rose-500 uppercase tracking-tight flex items-center gap-2">
                                                    <X size={16} /> Error Detected
                                                </p>
                                                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                                    {marketAudit.error}
                                                </p>
                                                <button
                                                    onClick={() => handleRefreshAudit()}
                                                    className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    Re-Sync Node
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-[13px] font-medium text-slate-900 dark:text-slate-400 leading-relaxed italic pr-4">
                                                {marketAudit.cmo_summary}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-5 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-2xl border border-indigo-500/10 space-y-2">
                                        <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{t('pro_dashboard.tools.audit.sentiment_label')}</p>
                                        <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{marketAudit.market_sentiment}</p>
                                    </div>
                                    <div className="p-5 bg-purple-500/5 dark:bg-purple-500/5 rounded-2xl border border-purple-500/10 space-y-2">
                                        <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">{t('pro_dashboard.tools.audit.shift_label')}</p>
                                        <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">{marketAudit.global_trend_shift}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                                            <h4 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{t('pro_dashboard.tools.audit.news_title')}</h4>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {marketAudit.generated_at && (
                                                <span className="text-[9px] font-medium text-slate-400">
                                                    Updated: {new Date(marketAudit.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg animate-pulse">
                                                {t('pro_dashboard.tools.audit.live_feed')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {marketAudit.top_news?.map((news: any, idx: number) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: -10 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="p-5 bg-slate-50 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-3xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all group shadow-sm"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 bg-indigo-500/10 rounded-md text-[7px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">{news.source}</span>
                                                            <span className="text-[7px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{news.relevance} Relevance</span>
                                                        </div>
                                                        <h5 className="text-[14px] font-black text-slate-900 dark:text-white leading-tight uppercase group-hover:text-indigo-500 transition-colors">{news.title}</h5>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-white/5 flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-500 border border-indigo-500/20 dark:border-white/5">
                                                        {idx + 1}
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-white dark:bg-black/40 rounded-2xl border border-slate-200 dark:border-white/5 space-y-2 shadow-inner">
                                                    <p className="text-[11px] font-medium text-slate-900 dark:text-slate-400 leading-relaxed">
                                                        {news.impact}
                                                    </p>
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <Zap size={12} className="text-amber-500" />
                                                        <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">{news.fomo_trigger}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 bg-linear-to-r from-indigo-600/20 to-purple-600/20 rounded-[2.5rem] border border-white/10 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                                            <Flame size={20} className="text-orange-500 animate-bounce" />
                                        </div>
                                        <h4 className="text-[13px] font-black text-white uppercase tracking-widest">Viral Growth Protocol</h4>
                                    </div>
                                    <p className="text-[12px] font-medium text-indigo-100 leading-relaxed italic px-2">
                                        "{marketAudit.viral_motivation}"
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-8 bg-slate-50 dark:bg-black/40 border-t border-slate-100 dark:border-white/5 space-y-4">
                                <div className="flex items-center gap-3 text-emerald-400 text-center justify-center mb-2">
                                    <CheckCircle2 size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Audit verified for 60m dominance</span>
                                </div>
                                <button
                                    onClick={() => { selection(); setShowAuditModal(false); setActiveTab('studio'); }}
                                    className="w-full h-14 vibing-blue-animated rounded-2xl font-black text-white text-[11px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    Execute Viral Strategy Now <ArrowRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ARTICLE READER MODAL */}
            <AnimatePresence>
                {selectedArticle && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl"
                        onClick={() => setSelectedArticle(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg glass-panel-premium rounded-[2.5rem] border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-slate-900 shadow-2xl noise-overlay"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-indigo-500/10 rounded-full text-[7px] font-black text-indigo-500 uppercase tracking-widest">{selectedArticle.category}</span>
                                            <span className="text-[7px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('pro_dashboard.academy.read_time', { time: selectedArticle.readTime })}</span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedArticle.title}</h3>
                                    </div>
                                    <button
                                        onClick={() => setSelectedArticle(null)}
                                        className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                    >
                                        <X size={18} className="text-slate-900 dark:text-white" />
                                    </button>
                                </div>
                                <div className="prose prose-sm dark:prose-invert max-h-[60vh] overflow-y-auto no-scrollbar">
                                    <p className="text-[14px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                                        {selectedArticle.content}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedArticle(null)}
                                    className="w-full h-14 vibing-blue-animated rounded-2xl font-black text-white text-[11px] uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                                >
                                    {t('pro_dashboard.academy.understand_btn')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MANUAL & INSTRUCTIONS MODAL */}
            <AnimatePresence>
                {showManual && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/90 backdrop-blur-md"
                        onClick={() => setShowManual(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg rounded-[2.5rem] border border-slate-200 dark:border-white/10 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl shadow-3xl flex flex-col max-h-[85vh] relative"
                        >
                            {/* Decorative elements */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50" />
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full" />
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 blur-3xl rounded-full" />

                            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500 dark:bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                                        <BookOpen size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
                                            {showManual === 'studio' ? t('pro_dashboard.academy.studio_manual.title') :
                                                showManual === 'tools' ? t('pro_dashboard.tools.headline.title') :
                                                    showManual === 'academy' ? t('pro_dashboard.academy.protocols.title') :
                                                        showManual === 'setup_x' ? t('pro_dashboard.setup.x_manual.title') :
                                                            showManual === 'setup_tg' ? t('pro_dashboard.setup.tg_manual.title') :
                                                                showManual === 'setup_linkedin' ? t('pro_dashboard.setup.linkedin_manual.title') :
                                                                    t('pro_dashboard.academy.viral_assets.title')}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                            <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] opacity-80">
                                                {showManual === 'setup_x' ? t('pro_dashboard.setup.x_manual.subtitle') :
                                                    showManual === 'setup_tg' ? t('pro_dashboard.setup.tg_manual.subtitle') :
                                                        showManual === 'setup_linkedin' ? t('pro_dashboard.setup.linkedin_manual.subtitle') :
                                                            t('pro_dashboard.academy.studio_manual.subtitle')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowManual(null)}
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors group"
                                >
                                    <X size={20} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-8 space-y-6 relative z-10">
                                {showManual === 'studio' || showManual === 'setup_x' || showManual === 'setup_tg' || showManual === 'setup_linkedin' ? (
                                    (() => {
                                        const key = showManual === 'studio' ? 'pro_dashboard.academy.studio_manual.steps' :
                                            showManual === 'setup_x' ? 'pro_dashboard.setup.x_manual.steps' :
                                                showManual === 'setup_tg' ? 'pro_dashboard.setup.tg_manual.steps' :
                                                    'pro_dashboard.setup.linkedin_manual.steps';
                                        const steps = t(key, { returnObjects: true });
                                        if (Array.isArray(steps)) {
                                            return steps.map((step: any, i: number) => (
                                                <div key={i} className="flex gap-5 items-start relative group">
                                                    {i < steps.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-slate-100 dark:bg-white/10" />}
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-[10px] font-black text-indigo-500 dark:text-indigo-400 shrink-0 shadow-sm group-hover:border-indigo-500/30 transition-colors z-10">
                                                        {(i + 1).toString().padStart(2, '0')}
                                                    </div>
                                                    <div className="space-y-1.5 pt-1">
                                                        <h4 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{step.title}</h4>
                                                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed opacity-80">{step.desc}</p>
                                                    </div>
                                                </div>
                                            ));
                                        }
                                        return null;
                                    })()
                                ) : showManual === 'tools' ? (
                                    <div className="space-y-6">
                                        <div className="p-5 bg-linear-to-br from-pink-500/5 to-transparent dark:bg-white/5 rounded-3xl border border-pink-500/10 dark:border-white/5 space-y-3 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <Flame size={14} className="text-pink-500" />
                                                <h4 className="text-[11px] font-black text-pink-600 dark:text-pink-500 uppercase tracking-widest">Viral Headline Fixer</h4>
                                            </div>
                                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic opacity-85">"{t('pro_dashboard.tools.headline.desc')}"</p>
                                            <div className="p-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-white dark:border-white/5 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                {t('pro_dashboard.tools.headline.neural_desc')}
                                            </div>
                                        </div>
                                        <div className="p-5 bg-linear-to-br from-amber-500/5 to-transparent dark:bg-white/5 rounded-3xl border border-amber-500/10 dark:border-white/5 space-y-3 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <Sparkles size={14} className="text-amber-500" />
                                                <h4 className="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">Viral Bio Generator</h4>
                                            </div>
                                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic opacity-85">"{t('pro_dashboard.tools.bio.desc')}"</p>
                                            <div className="p-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-white dark:border-white/5 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                {t('pro_dashboard.tools.bio.neural_desc')}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="p-6 bg-indigo-50 dark:bg-indigo-500/5 rounded-[2rem] border border-indigo-100 dark:border-indigo-500/10 flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                                                <Sparkles className="text-white" size={24} />
                                            </div>
                                            <p className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-snug">
                                                <Trans i18nKey="pro_dashboard.academy.protocols.growth_promo">
                                                    PRO Members grow their network <span className="text-indigo-600 dark:text-indigo-400">x5 faster</span> using these elite protocols.
                                                </Trans>
                                            </p>
                                        </div>
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('pro_dashboard.academy.protocols.methodology_title')}</h4>
                                            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-white/5 p-5 rounded-3xl border border-slate-100 dark:border-white/5">
                                                {t('pro_dashboard.academy.protocols.methodology_desc')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 sm:p-8 bg-slate-50 dark:bg-black/40 border-t border-slate-100 dark:border-white/5 relative z-10">
                                <button
                                    onClick={() => { selection(); setShowManual(null); }}
                                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    {t('pro_dashboard.academy.understand_btn') || 'I Understand the Protocol'}
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
