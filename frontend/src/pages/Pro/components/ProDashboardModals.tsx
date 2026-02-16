import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Send, Info, ShieldCheck, Loader2, Sparkles, Linkedin,
    TrendingUp, Quote, Zap, CheckCircle2, ArrowRight, ArrowLeft,
    Twitter, Download, Copy, BookOpen, Terminal, Share, Flame, Monitor, Globe
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PROStatus } from '../../../services/proService';

interface ProModalsProps {
    // Setup Modal
    showSetup: boolean;
    setShowSetup: (show: boolean) => void;
    apiData: any;
    setApiData: (data: any) => void;
    isLoading: boolean;
    handleSaveSetup: () => Promise<void>;
    handleTestIntegration: (platform: string) => Promise<void>;

    // Audit Modal
    showAuditModal: boolean;
    setShowAuditModal: (show: boolean) => void;
    marketAudit: any;
    setActiveTab: (tab: 'studio' | 'tools' | 'growth') => void;

    // Article Modal
    selectedArticle: any;
    setSelectedArticle: (article: any) => void;

    // Asset Modal
    selectedAsset: any;
    setSelectedAsset: (asset: any) => void;
    copyText: (text: string) => void;

    // Manual Modal
    showManual: string | null;
    setShowManual: (manual: string | null) => void;

    // Misc
    status: PROStatus | null;
    selection: () => void;
    impact: (style: any) => void;
}

export const ProDashboardModals = ({
    showSetup, setShowSetup, apiData, setApiData, isLoading, handleSaveSetup, handleTestIntegration,
    showAuditModal, setShowAuditModal, marketAudit, setActiveTab,
    selectedArticle, setSelectedArticle,
    selectedAsset, setSelectedAsset, copyText,
    showManual, setShowManual,
    status, selection, impact
}: ProModalsProps) => {
    const { t } = useTranslation();

    return (
        <>
            {/* SETUP MODAL */}
            <AnimatePresence>
                {showSetup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl"
                        onClick={() => setShowSetup(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[380px] rounded-[2.5rem] border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-50 dark:bg-slate-950 shadow-3xl flex flex-col max-h-[85vh] relative"
                        >
                            <div className="absolute inset-0 bg-linear-to-b from-indigo-500/5 to-transparent pointer-events-none" />

                            <div className="px-6 pt-6 pb-4 flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                                        <ShieldCheck size={20} className="text-indigo-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                                            {t('pro_dashboard.setup.title')}
                                        </h3>
                                        <p className="text-[8px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest opacity-60">
                                            {t('pro_dashboard.setup.subtitle')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowSetup(false)}
                                    className="w-8 h-8 rounded-full bg-slate-200/50 dark:bg-white/5 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-white/10 transition-colors"
                                >
                                    <X size={16} className="text-slate-500 dark:text-white/60" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-6 space-y-4 relative z-10">
                                {/* X (Twitter) Integration Card */}
                                <div className="p-4 bg-white dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center shadow-md">
                                                <Twitter size={14} className="text-white" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white leading-none">X Broadcast</span>
                                                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Direct API protocol</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => { selection(); handleTestIntegration('x'); }}
                                                className="h-7 px-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[8px] font-black uppercase tracking-widest text-indigo-500 hover:bg-indigo-500/20 transition-all flex items-center gap-1.5"
                                            >
                                                <Send size={10} /> {t('pro_dashboard.setup.test_btn') || 'Test'}
                                            </button>
                                            <button
                                                onClick={() => { selection(); setShowManual('setup_x'); }}
                                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-all"
                                            >
                                                <Info size={12} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { key: 'x_api_key', label: 'API Key', type: 'text' },
                                            { key: 'x_api_secret', label: 'API Secret', type: 'password' },
                                            { key: 'x_access_token', label: 'Access Token', type: 'text' },
                                            { key: 'x_access_token_secret', label: 'Token Secret', type: 'password' }
                                        ].map((input) => (
                                            <input
                                                key={input.key}
                                                type={input.type}
                                                value={apiData[input.key as keyof typeof apiData]}
                                                onChange={(e) => setApiData({ ...apiData, [input.key]: e.target.value })}
                                                placeholder={input.label}
                                                className="h-9 bg-slate-100/50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl px-3 text-[10px] font-medium outline-hidden text-slate-900 dark:text-white placeholder:opacity-30 placeholder:text-[9px] focus:border-indigo-500/50 transition-colors"
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Telegram Integration Card */}
                                <div className="p-4 bg-white dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                                                <Send size={14} className="text-white" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white leading-none">TG Sync</span>
                                                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Multi-Node broadcasting</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => { selection(); handleTestIntegration('telegram'); }}
                                                className="h-7 px-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[8px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500/20 transition-all flex items-center gap-1.5"
                                            >
                                                <Send size={10} /> {t('pro_dashboard.setup.test_btn') || 'Test'}
                                            </button>
                                            <button
                                                onClick={() => { selection(); setShowManual('setup_tg'); }}
                                                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-all"
                                            >
                                                <Info size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[7px] font-black uppercase tracking-widest text-slate-400 ml-1">Main Channel</label>
                                            <input
                                                type="text"
                                                value={apiData.telegram_channel_id}
                                                onChange={(e) => setApiData({ ...apiData, telegram_channel_id: e.target.value })}
                                                placeholder="@channelname"
                                                className="w-full h-9 bg-slate-100/50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl px-3 text-[10px] font-medium outline-hidden text-slate-900 dark:text-white placeholder:opacity-30 focus:border-blue-500/50 transition-colors"
                                            />
                                        </div>

                                        {apiData.telegram_channels.length > 0 && (
                                            <div className="space-y-1.5">
                                                <label className="text-[7px] font-black uppercase tracking-widest text-slate-400 ml-1">Additional Nodes</label>
                                                <div className="space-y-1.5">
                                                    {apiData.telegram_channels.map((ch: string, idx: number) => (
                                                        <div key={idx} className="flex gap-1.5">
                                                            <input
                                                                type="text"
                                                                value={ch}
                                                                onChange={(e) => {
                                                                    const newChannels = [...apiData.telegram_channels];
                                                                    newChannels[idx] = e.target.value;
                                                                    setApiData({ ...apiData, telegram_channels: newChannels });
                                                                }}
                                                                placeholder={`@node_${idx + 2}`}
                                                                className="flex-1 h-9 bg-slate-100/50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl px-3 text-[10px] font-medium outline-hidden text-slate-900 dark:text-white focus:border-blue-500/50 transition-colors"
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const newChannels = apiData.telegram_channels.filter((_: any, i: number) => i !== idx);
                                                                    setApiData({ ...apiData, telegram_channels: newChannels });
                                                                }}
                                                                className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center active:scale-90 transition-all border border-red-500/20"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setApiData({ ...apiData, telegram_channels: [...apiData.telegram_channels, ''] })}
                                            disabled={apiData.telegram_channels.length >= 4}
                                            className="w-full h-9 border border-dashed border-slate-200 dark:border-white/10 rounded-xl text-[7px] font-black uppercase text-slate-400 hover:text-indigo-500 hover:border-indigo-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                                        >
                                            <Sparkles size={10} /> {apiData.telegram_channels.length >= 4 ? 'Node Limit Reached' : 'Connect Node'}
                                        </button>
                                    </div>
                                </div>

                                {/* LinkedIn Authority Card - Ultra Compact */}
                                <div className="p-3 bg-white dark:bg-white/5 rounded-[1.25rem] border border-slate-200 dark:border-white/5 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-600/10 rounded-lg flex items-center justify-center">
                                            <Linkedin size={14} className="text-blue-600 grayscale opacity-40" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('pro_dashboard.setup.professional_network')}</span>
                                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sync locked • Professional tier</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { selection(); setShowManual('setup_linkedin'); }}
                                        className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all"
                                    >
                                        <Info size={10} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 bg-white dark:bg-white/5 border-t border-slate-200 dark:border-white/5 relative z-10">
                                <button
                                    onClick={() => { selection(); handleSaveSetup(); }}
                                    className="w-full h-12 vibing-blue-animated rounded-xl font-black text-white text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:grayscale disabled:opacity-50 shadow-xl shadow-indigo-500/20"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : (
                                        <>
                                            <ShieldCheck size={14} /> {t('pro_dashboard.setup.save_btn')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ASSET DETAIL MODAL */}
            <AnimatePresence>
                {selectedAsset && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-102 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl"
                        onClick={() => setSelectedAsset(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass-panel-premium w-full max-w-[340px] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-white dark:bg-slate-900"
                        >
                            <div className="p-6 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-500">Asset Protocol</span>
                                        </div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">{selectedAsset.title}</h3>
                                    </div>
                                    <button
                                        onClick={() => { selection(); setSelectedAsset(null); }}
                                        className="p-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-slate-500 dark:text-slate-400"
                                    >
                                        <ArrowLeft size={16} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                                        <h4 className="text-[10px] font-black uppercase text-indigo-500 mb-2 tracking-widest">HOOK STRATEGY</h4>
                                        <p className="text-[11px] font-medium text-slate-900 dark:text-white/70 leading-relaxed italic pr-4">
                                            "{selectedAsset.hook}"
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">Important Information</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {selectedAsset.specs?.map((spec: string, idx: number) => (
                                                <div key={idx} className="p-3 bg-slate-50 dark:bg-white/2 rounded-xl border border-slate-200 dark:border-white/5">
                                                    <p className="text-[8px] font-black text-slate-900 dark:text-white/80 uppercase leading-tight line-clamp-2">{spec}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ShieldCheck size={14} className="text-emerald-500" />
                                            <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Usage Protocol</h4>
                                        </div>
                                        <p className="text-[10.5px] font-medium text-slate-900 dark:text-white/70 leading-relaxed">
                                            {selectedAsset.usage}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { copyText(selectedAsset.desc); selection(); }}
                                        className="flex-1 h-12 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                                    >
                                        <Copy size={16} className="text-slate-500 dark:text-slate-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Copy Key Info</span>
                                    </button>
                                    <a
                                        href="https://drive.google.com/drive/folders/1ASIObhRIBO_RX24pc6hhDpeqTV1G6WUX?usp=sharing"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => impact('heavy')}
                                        className="h-12 px-6 vibing-blue-animated text-white rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20"
                                    >
                                        <Download size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Download</span>
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MARKET AUDIT MODAL */}
            <AnimatePresence>
                {showAuditModal && marketAudit && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl"
                        onClick={() => setShowAuditModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg glass-panel-premium rounded-[3rem] border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-slate-900 shadow-3xl flex flex-col max-h-[90vh] noise-overlay"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-linear-to-br from-indigo-500/5 dark:from-indigo-500/10 to-transparent">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg">
                                        <TrendingUp size={24} className="text-indigo-500 animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">Marketing Audit</h3>
                                        <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] opacity-70">
                                            Global Node: Active • 2026
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAuditModal(false)}
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                >
                                    <X size={20} className="text-slate-900 dark:text-white/60" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                                        <h4 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-widest">CMO Executive Summary</h4>
                                    </div>
                                    <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 relative">
                                        <Quote className="absolute -top-3 -left-3 text-indigo-500/20" size={32} />
                                        <p className="text-[13px] font-medium text-slate-900 dark:text-slate-400 leading-relaxed italic pr-4">
                                            {marketAudit.cmo_summary}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-5 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-2xl border border-indigo-500/10 space-y-2">
                                        <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Market Sentiment</p>
                                        <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{marketAudit.market_sentiment}</p>
                                    </div>
                                    <div className="p-5 bg-purple-500/5 dark:bg-purple-500/5 rounded-2xl border border-purple-500/10 space-y-2">
                                        <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">Global Shift</p>
                                        <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">{marketAudit.global_trend_shift}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                                            <h4 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Elite News Intelligence (Top 20)</h4>
                                        </div>
                                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">LIVE FEED</span>
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

                            <div className="p-8 bg-slate-50 dark:bg-black/40 border-t border-white/10 space-y-4">
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
                                            <span className="text-[7px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{selectedArticle.readTime} min read</span>
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
                                    I Understand the Protocol
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
                        className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl"
                        onClick={() => setShowManual(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg glass-panel-premium rounded-[3rem] border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-slate-900 shadow-3xl flex flex-col max-h-[85vh] noise-overlay"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-linear-to-br from-indigo-500/5 dark:from-indigo-500/10 to-transparent">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-center shadow-xl">
                                        <BookOpen size={24} className="text-indigo-500 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                            {showManual === 'studio' ? t('pro_dashboard.academy.studio_manual.title') :
                                                showManual === 'tools' ? t('pro_dashboard.tools.headline.title') :
                                                    showManual === 'academy' ? t('pro_dashboard.academy.protocols.title') :
                                                        showManual === 'setup_x' ? t('pro_dashboard.setup.x_manual.title') :
                                                            showManual === 'setup_tg' ? t('pro_dashboard.setup.tg_manual.title') :
                                                                showManual === 'setup_linkedin' ? t('pro_dashboard.setup.linkedin_manual.title') :
                                                                    t('pro_dashboard.academy.viral_assets.title')}
                                        </h3>
                                        <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] opacity-70">
                                            {showManual === 'setup_x' ? t('pro_dashboard.setup.x_manual.subtitle') :
                                                showManual === 'setup_tg' ? t('pro_dashboard.setup.tg_manual.subtitle') :
                                                    showManual === 'setup_linkedin' ? t('pro_dashboard.setup.linkedin_manual.subtitle') :
                                                        t('pro_dashboard.academy.studio_manual.subtitle')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowManual(null)}
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                >
                                    <X size={20} className="text-slate-900 dark:text-white/60" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
                                {showManual === 'studio' || showManual === 'setup_x' || showManual === 'setup_tg' || showManual === 'setup_linkedin' ? (
                                    (() => {
                                        const key = showManual === 'studio' ? 'pro_dashboard.academy.studio_manual.steps' :
                                            showManual === 'setup_x' ? 'pro_dashboard.setup.x_manual.steps' :
                                                showManual === 'setup_tg' ? 'pro_dashboard.setup.tg_manual.steps' :
                                                    'pro_dashboard.setup.linkedin_manual.steps';
                                        const steps = t(key, { returnObjects: true }) as any[];
                                        return steps.map((step: any, i: number) => (
                                            <div key={i} className="flex gap-6 items-start relative group">
                                                {i < steps.length - 1 && <div className="absolute left-[23.5px] top-12 bottom-0 w-px bg-linear-to-b from-indigo-500/20 dark:from-indigo-500/30 to-transparent" />}
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-lg font-black text-indigo-500 dark:text-indigo-400 shrink-0 shadow-lg group-hover:border-indigo-500/30 transition-colors">
                                                    {i + 1}
                                                </div>
                                                <div className="space-y-2 pt-1">
                                                    <h4 className="text-[14px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{step.title}</h4>
                                                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed opacity-80">{step.desc}</p>
                                                </div>
                                            </div>
                                        ));
                                    })()
                                ) : showManual === 'tools' ? (
                                    <div className="space-y-8">
                                        <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 space-y-4 shadow-sm">
                                            <h4 className="text-[12px] font-black text-pink-600 dark:text-pink-500 uppercase tracking-widest">Viral Headline Fixer</h4>
                                            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic opacity-85">"{t('pro_dashboard.tools.headline.desc')}"</p>
                                            <div className="p-4 bg-white dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed shadow-inner">
                                                Our neural engine analyzes current high-performing hooks and adapts your headline to trigger curiosity loops.
                                            </div>
                                        </div>
                                        <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 space-y-4 shadow-sm">
                                            <h4 className="text-[12px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">Viral Bio Generator</h4>
                                            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic opacity-85">"{t('pro_dashboard.tools.bio.desc')}"</p>
                                            <div className="p-4 bg-white dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed shadow-inner">
                                                Optimizes your social identity for conversion. High-converters focus on the 'Benefit' first, not the 'Feature'.
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                            Follow the elite protocols to maximize your reach. Every asset and lesson is designed for 2026 algorithmic dominance.
                                        </p>
                                        <div className="p-6 bg-indigo-500/5 rounded-[2rem] border border-indigo-500/10 flex items-center gap-5">
                                            <Sparkles className="text-indigo-400 shrink-0" size={32} />
                                            <p className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-snug">
                                                PRO Members grow their network <span className="vibing-blue-text">x5 faster</span> using these assets.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-black/20 border-t border-white/5">
                                <button
                                    onClick={() => setShowManual(null)}
                                    className="w-full h-14 vibing-blue-animated rounded-2xl font-black text-white text-[11px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
                                >
                                    I Understand the Protocol
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
