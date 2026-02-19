// ProDashboardModals v2.1 - Latest Deployment
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, TrendingUp, Zap, Loader2, Quote, CheckCircle2,
    ArrowRight, Flame, BookOpen, Sparkles, Sliders, Send, Network,
    Plus, Trash2, AlertCircle, Info
} from 'lucide-react';
import { proService } from '../../../services/proService';
import { useNotificationStore } from '../../../store/useNotificationStore';
import { renderMarkdown } from '../utils/renderMarkdown';
import { Trans, useTranslation } from 'react-i18next';

interface ProModalsProps {
    showAuditModal: boolean;
    setShowAuditModal: (show: boolean) => void;
    marketAudit: any;
    setActiveTab: (tab: any) => void;
    selectedArticle: any;
    setSelectedArticle: (article: any) => void;
    showManual: string | null;
    setShowManual: (manual: string | null) => void;
    selection: () => void;
    handleRefreshAudit: () => void;
    isAuditing: boolean;
    showSetup: boolean;
    setShowSetup: (show: boolean) => void;
    status: any;
    showHeadlineModal?: boolean;
    setShowHeadlineModal?: (show: boolean) => void;
    handleFixHeadline?: (headline: string) => Promise<string | undefined>;
    isFixingHeadline?: boolean;
    showBioModal?: boolean;
    setShowBioModal?: (show: boolean) => void;
    handleGenerateBio?: (bio: string) => Promise<string | undefined>;
    isGeneratingBio?: boolean;
}

export const ProDashboardModals = ({
    showAuditModal,
    setShowAuditModal,
    marketAudit,
    setActiveTab,
    selectedArticle,
    setSelectedArticle,
    showManual,
    setShowManual,
    selection,
    handleRefreshAudit,
    isAuditing,
    showSetup,
    setShowSetup,
    status,
    showHeadlineModal,
    setShowHeadlineModal,
    handleFixHeadline,
    isFixingHeadline,
    showBioModal,
    setShowBioModal,
    handleGenerateBio,
    isGeneratingBio
}: ProModalsProps) => {
    const { t } = useTranslation();
    const { showNotification } = useNotificationStore();

    // Setup Local State
    const [setupTab, setSetupTab] = useState<'x' | 'tg'>('x');
    const [isSaving, setIsSaving] = useState(false);

    // Headline Local State
    const [headlineInput, setHeadlineInput] = useState('');
    const [headlineResult, setHeadlineResult] = useState('');

    // Bio Local State
    const [bioInput, setBioInput] = useState('');
    const [bioResult, setBioResult] = useState('');

    // Form Fields
    const [xApiKey, setXApiKey] = useState('');
    const [xApiSecret, setXApiSecret] = useState('');
    const [xAccToken, setXAccToken] = useState('');
    const [xAccSecret, setXAccSecret] = useState('');
    const [tgChannels, setTgChannels] = useState<string[]>(['']);
    const [tgTestResults, setTgTestResults] = useState<Record<string, string>>({});
    const [isTesting, setIsTesting] = useState(false);

    // Pre-fill effect
    React.useEffect(() => {
        if (status?.setup) {
            setXApiKey(status.setup.x_api_key || '');
            setXApiSecret(status.setup.x_api_secret || '');
            setXAccToken(status.setup.x_access_token || '');
            setXAccSecret(status.setup.x_access_token_secret || '');

            const main = status.setup.telegram_channel_id;
            const others = status.setup.telegram_channels || [];
            const all = main ? [main, ...others] : (others.length > 0 ? others : ['']);
            setTgChannels(all);
        }
    }, [status]);

    const handleSaveSetup = async () => {
        setIsSaving(true);
        selection();
        try {
            await proService.setupSocial({
                x_api_key: xApiKey,
                x_api_secret: xApiSecret,
                x_access_token: xAccToken,
                x_access_token_secret: xAccSecret,
                telegram_channel_id: tgChannels[0],
                telegram_channels: tgChannels.slice(1).filter(ch => ch.trim() !== '')
            });
            showNotification({
                title: t('pro_dashboard.setup.save_success_title'),
                message: t('pro_dashboard.setup.save_success_text'),
                type: 'success'
            });
            setShowSetup(false);
        } catch (error: any) {
            console.error(error);
            showNotification({
                title: t('pro_dashboard.setup.save_error_title'),
                message: error.response?.data?.message || t('pro_dashboard.setup.save_error_text'),
                type: 'warning'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestTG = async () => {
        if (isTesting) return;
        setIsTesting(true);
        selection();
        try {
            const res = await proService.testIntegration('telegram');
            if (res.details) {
                const results: Record<string, string> = {};
                res.details.forEach((d: string) => {
                    // detail format: "✅ @channel" or "❌ @channel"
                    const status = d.startsWith('✅') ? 'active' : 'error';
                    const channel = d.substring(2).trim();
                    results[channel] = status;
                });
                setTgTestResults(results);
            }
            showNotification({
                title: t('pro_dashboard.notifications.success'),
                message: res.msg || "Telegram sync verified.",
                type: 'success'
            });
        } catch (error: any) {
            console.error(error);
            showNotification({
                title: t('pro_dashboard.notifications.error'),
                message: error.response?.data?.message || "Failed to verify Telegram status.",
                type: 'warning'
            });
        } finally {
            setIsTesting(false);
        }
    };

    const onFixHeadline = async () => {
        if (!handleFixHeadline || !headlineInput) return;
        try {
            const result = await handleFixHeadline(headlineInput);
            if (result) setHeadlineResult(result);
        } catch (e) {
            // Error handled in parent
        }
    };

    const onGenerateBio = async () => {
        if (!handleGenerateBio || !bioInput) return;
        try {
            const result = await handleGenerateBio(bioInput);
            if (result) setBioResult(result);
        } catch (e) {
            // Error handled in parent
        }
    };

    return (
        <>
            {/* SETUP MODAL */}
            <AnimatePresence>
                {showSetup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/90 backdrop-blur-md"
                        onClick={() => setShowSetup(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg rounded-[2.5rem] border border-slate-200 dark:border-white/10 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl shadow-3xl flex flex-col max-h-[85vh] relative"
                        >
                            {/* Header Section */}
                            <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-linear-to-r from-indigo-500/5 to-transparent relative z-20">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/30">
                                        <Network size={22} className="text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1 truncate">
                                            {t('pro_dashboard.setup.title')}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
                                            <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest truncate">
                                                {t('pro_dashboard.setup.subtitle')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowSetup(false)}
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/10 group"
                                >
                                    <X size={20} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                                </button>
                            </div>

                            {/* Sub Tabs Selection */}
                            <div className="mx-6 sm:mx-8 mt-6">
                                <div className="flex p-1 bg-slate-100 dark:bg-black/40 rounded-2xl border border-slate-200 dark:border-white/5">
                                    <button
                                        onClick={() => { selection(); setSetupTab('x'); }}
                                        className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 ${setupTab === 'x'
                                            ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-white shadow-xl shadow-indigo-500/5 ring-1 ring-slate-100 dark:ring-white/10'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    >
                                        <Network size={12} className={setupTab === 'x' ? 'text-indigo-500' : 'opacity-40'} />
                                        {t('pro_dashboard.setup.x_broadcast')}
                                    </button>
                                    <button
                                        onClick={() => { selection(); setSetupTab('tg'); }}
                                        className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 ${setupTab === 'tg'
                                            ? 'bg-white dark:bg-white/10 text-sky-600 dark:text-white shadow-xl shadow-sky-500/5 ring-1 ring-slate-100 dark:ring-white/10'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    >
                                        <Send size={12} className={setupTab === 'tg' ? 'text-sky-500' : 'opacity-40'} />
                                        {t('pro_dashboard.setup.tg_sync')}
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-8 space-y-6">
                                {setupTab === 'x' ? (
                                    <div className="space-y-6">
                                        <div className="p-5 bg-indigo-500/10 dark:bg-indigo-500/10 rounded-3xl border border-indigo-500/20 flex items-start gap-4 group transition-all">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                                                <Network size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-[0.15em]">Direct API Protocol</h4>
                                                <p className="text-[10px] font-medium text-indigo-700/70 dark:text-indigo-400/70 leading-relaxed mt-1">
                                                    Enter your X Developer keys to enable autonomous posting. Need help?
                                                    <button onClick={() => { selection(); setShowManual('setup_x'); }} className="ml-1.5 text-indigo-600 dark:text-indigo-400 underline font-black hover:text-indigo-500">View Guide</button>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-2">
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center px-1">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('pro_dashboard.setup.api_key')}</label>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={xApiKey}
                                                        onChange={(e) => setXApiKey(e.target.value)}
                                                        className="w-full h-14 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 text-[13px] font-mono focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-hidden transition-all text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/10 shadow-sm"
                                                        placeholder="Enter Consumer Key (API Key)"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('pro_dashboard.setup.api_secret')}</label>
                                                    <input
                                                        type="password"
                                                        value={xApiSecret}
                                                        onChange={(e) => setXApiSecret(e.target.value)}
                                                        className="w-full h-14 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 text-[13px] font-mono focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-hidden transition-all text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/10 shadow-sm"
                                                        placeholder="Enter Consumer Secret"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('pro_dashboard.setup.access_token')}</label>
                                                    <input
                                                        type="text"
                                                        value={xAccToken}
                                                        onChange={(e) => setXAccToken(e.target.value)}
                                                        className="w-full h-14 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 text-[13px] font-mono focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-hidden transition-all text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/10 shadow-sm"
                                                        placeholder="Enter Access Token"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('pro_dashboard.setup.access_token_secret')}</label>
                                                    <input
                                                        type="password"
                                                        value={xAccSecret}
                                                        onChange={(e) => setXAccSecret(e.target.value)}
                                                        className="w-full h-14 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 text-[13px] font-mono focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-hidden transition-all text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/10 shadow-sm"
                                                        placeholder="Enter Token Secret"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="p-5 bg-sky-500/10 dark:bg-sky-500/10 rounded-3xl border border-sky-500/20 flex items-start gap-4 group transition-all">
                                            <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform">
                                                <Send size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-black text-sky-900 dark:text-sky-300 uppercase tracking-[0.15em]">{t('pro_dashboard.setup.tg_sync_multi.title')}</h4>
                                                <p className="text-[10px] font-medium text-sky-700/70 dark:text-sky-400/70 leading-relaxed mt-1">
                                                    {status?.is_pro_plus ? t('pro_dashboard.setup.tg_sync_multi.desc_plus') : t('pro_dashboard.setup.tg_sync_multi.desc_pro')}
                                                    <button onClick={() => { selection(); setShowManual('setup_tg'); }} className="ml-1.5 text-sky-600 dark:text-sky-400 underline font-black hover:text-sky-500">{t('pro_dashboard.setup.tg_manual.title')}</button>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('pro_dashboard.setup.channel_id')}</label>
                                                <button
                                                    onClick={handleTestTG}
                                                    disabled={isTesting || tgChannels.every(c => !c)}
                                                    className="text-[9px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest hover:underline flex items-center gap-1.5 disabled:opacity-50"
                                                >
                                                    {isTesting ? <Loader2 size={10} className="animate-spin" /> : <Zap size={10} />}
                                                    {t('pro_dashboard.setup.tg_sync_multi.verify_btn')}
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                {tgChannels.map((ch, idx) => (
                                                    <div key={idx} className="relative group/input">
                                                        <div className="space-y-2">
                                                            <input
                                                                type="text"
                                                                value={ch}
                                                                onChange={(e) => {
                                                                    const newChannels = [...tgChannels];
                                                                    newChannels[idx] = e.target.value;
                                                                    setTgChannels(newChannels);
                                                                }}
                                                                className="w-full h-14 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 pr-14 text-[13px] font-mono focus:border-sky-500 focus:ring-4 focus:ring-sky-500/5 outline-hidden transition-all text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/10 shadow-sm"
                                                                placeholder="@your_channel_username"
                                                            />

                                                            {tgTestResults[ch.trim()] && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: -5 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    className={`absolute left-3 -top-2.5 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg border ${tgTestResults[ch.trim()] === 'active'
                                                                        ? 'bg-emerald-500 border-emerald-400/50 text-white'
                                                                        : 'bg-rose-500 border-rose-400/50 text-white'}`}
                                                                >
                                                                    {tgTestResults[ch.trim()] === 'active' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                                                    {tgTestResults[ch.trim()] === 'active' ? t('pro_dashboard.setup.tg_sync_multi.active') : t('pro_dashboard.setup.tg_sync_multi.error')}
                                                                </motion.div>
                                                            )}

                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                                                {tgChannels.length > 1 && (
                                                                    <button
                                                                        onClick={() => {
                                                                            selection();
                                                                            const newChannels = tgChannels.filter((_, i) => i !== idx);
                                                                            setTgChannels(newChannels);
                                                                        }}
                                                                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover/input:opacity-100"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {tgChannels.length < (status?.is_pro_plus ? 5 : 1) && (
                                                    <button
                                                        onClick={() => { selection(); setTgChannels([...tgChannels, '']); }}
                                                        className="w-full h-14 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-center gap-3 text-slate-400 hover:border-indigo-500/50 hover:text-indigo-500 hover:bg-indigo-500/5 transition-all group"
                                                    >
                                                        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                                                        <span className="text-[11px] font-black uppercase tracking-widest">
                                                            {t('pro_dashboard.setup.tg_sync_multi.add_channel', { count: tgChannels.length, total: (status?.is_pro_plus ? 5 : 1) })}
                                                        </span>
                                                    </button>
                                                )}
                                            </div>

                                            <div className="p-4 bg-amber-500/5 dark:bg-amber-500/5 rounded-2xl border border-amber-500/10 flex items-start gap-4 shadow-sm">
                                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                                                    <Info size={16} className="text-amber-500" />
                                                </div>
                                                <p className="text-[10px] text-amber-700 dark:text-amber-400/80 leading-relaxed font-bold uppercase tracking-tight">
                                                    {status?.is_pro_plus
                                                        ? t('pro_dashboard.setup.tg_sync_multi.plan_plus')
                                                        : t('pro_dashboard.setup.tg_sync_multi.plan_pro')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sticky Footer */}
                            <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 relative z-20">
                                <button
                                    onClick={handleSaveSetup}
                                    disabled={isSaving}
                                    className="w-full h-13 bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:grayscale group"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            {t('pro_dashboard.tools.trends.scanning')}...
                                        </>
                                    ) : (
                                        <>
                                            {t('pro_dashboard.setup.save_btn')} <CheckCircle2 size={16} className="group-hover:scale-110 transition-transform" />
                                        </>
                                    )}
                                </button>
                                <p className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] text-center mt-4">
                                    P2PHUB PROTOCOL • V2.2 • SECURE SYNC
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MARKET AUDIT MODAL - PRO BENTO EDITION */}
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
                                        <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1 truncate">
                                            CMO Marketing Audit
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
                                                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
                                                    Global Sync Enabled
                                                </span>
                                            </div>
                                            <span className="text-slate-300 dark:text-slate-700">|</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest tabular-nums">
                                                {marketAudit.generated_at ? new Date(marketAudit.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Online'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => { selection(); handleRefreshAudit(); }}
                                        disabled={isAuditing}
                                        className="hidden sm:flex h-10 px-4 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 text-[9px] font-black uppercase tracking-widest items-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {isAuditing ? <Loader2 className="animate-spin w-3 h-3" /> : <Zap size={14} className="text-indigo-500" />}
                                        {isAuditing ? 'Scanning...' : 'Update (-3)'}
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
                                        <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase">Intelligence Error</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{marketAudit.error}</p>
                                        <button
                                            onClick={() => handleRefreshAudit()}
                                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20"
                                        >
                                            Force Re-Sync (-3 Tokens)
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Premium Bento Grid Sections */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Executive Summary Card */}
                                            <div className="col-span-1 sm:col-span-2 p-6 bg-linear-to-br from-indigo-500/10 to-purple-500/5 dark:bg-white/2 rounded-[2rem] border border-indigo-500/10 dark:border-white/5 relative overflow-hidden group shadow-sm">
                                                <Quote className="absolute -top-4 -right-4 text-indigo-500/10 rotate-12" size={80} />
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                                                    <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Strategy Intelligence</h4>
                                                </div>
                                                <p className="text-[13px] sm:text-[14px] font-medium text-slate-800 dark:text-slate-300 leading-relaxed italic relative z-10">
                                                    {marketAudit.cmo_summary}
                                                </p>
                                            </div>

                                            {/* Market Sentiment Stats */}
                                            <div className="p-5 bg-emerald-500/5 dark:bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex flex-col justify-center space-y-1">
                                                <p className="text-[9px] font-black text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-widest">{t('pro_dashboard.tools.audit.sentiment_label')}</p>
                                                <div className="flex items-end gap-2">
                                                    <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{marketAudit.market_sentiment}</p>
                                                    <TrendingUp size={16} className="text-emerald-500 mb-0.5" />
                                                </div>
                                            </div>

                                            {/* Global Trend Shift */}
                                            <div className="p-5 bg-amber-500/5 dark:bg-amber-500/5 rounded-2xl border border-amber-500/10 flex flex-col justify-center space-y-1">
                                                <p className="text-[9px] font-black text-amber-600/70 dark:text-amber-500/70 uppercase tracking-widest">{t('pro_dashboard.tools.audit.shift_label')}</p>
                                                <p className="text-[11px] font-bold text-slate-900 dark:text-slate-300 leading-tight uppercase line-clamp-2">{marketAudit.global_trend_shift}</p>
                                            </div>
                                        </div>

                                        {/* Viral News Feed Sections - Bento Grid Layout */}
                                        <div className="space-y-4 pt-4">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
                                                    <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Global Live Tracker</h4>
                                                </div>
                                                <div className="px-2 py-0.5 bg-rose-500/10 rounded-md text-[7px] font-black text-rose-500 uppercase tracking-[0.2em] animate-pulse">
                                                    Last 180 Minutes
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
                                                        <div className="hidden sm:flex w-10 h-10 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 items-center justify-center text-xs font-black text-indigo-500 shrink-0 group-hover:scale-110 transition-transform">
                                                            {(idx + 1).toString().padStart(2, '0')}
                                                        </div>

                                                        <div className="flex-1 space-y-2.5">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="px-2 py-0.5 bg-indigo-500/10 rounded-md text-[7px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">{news.source}</span>
                                                                <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-[0.2em] ${news.impact === 'Massive'
                                                                    ? 'bg-rose-500/10 text-rose-500'
                                                                    : 'bg-emerald-500/10 text-emerald-500'
                                                                    }`}>{news.relevance || 'High'} Relevance</span>
                                                                {idx === 0 && <span className="px-2 py-0.5 bg-amber-500/10 rounded-md text-[7px] font-black text-amber-500 uppercase tracking-[0.2em] animate-bounce">Hot Now</span>}
                                                            </div>

                                                            <h5 className="text-[15px] font-black text-slate-900 dark:text-white leading-tight uppercase group-hover:text-indigo-500 transition-colors">
                                                                {news.title}
                                                            </h5>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                                                <div className="p-2.5 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5">
                                                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-snug">
                                                                        {news.impact || news.motivation || 'Analyzing market entry points...'}
                                                                    </p>
                                                                </div>
                                                                <div className="p-2.5 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-xl border border-indigo-500/10 flex items-center gap-2">
                                                                    <Zap size={10} className="text-amber-500 shrink-0" />
                                                                    <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest line-clamp-1">
                                                                        {news.fomo_trigger || 'Action Protocol Required'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="sm:hidden absolute top-4 right-4 text-[10px] font-black text-slate-200 dark:text-white/5">
                                                            #{(idx + 1)}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Viral Motivation Summary */}
                                        <div className="p-6 bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-[2rem] border border-white/20 space-y-4 relative overflow-hidden group shadow-xl">
                                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl" />
                                            <div className="flex items-center gap-3 relative z-10">
                                                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                                                    <Flame size={20} className="animate-bounce" />
                                                </div>
                                                <h4 className="text-[13px] font-black text-white uppercase tracking-widest">Growth Imperative</h4>
                                            </div>
                                            <p className="text-[12px] sm:text-[13px] font-bold text-indigo-50 leading-relaxed italic relative z-10 px-1">
                                                "{marketAudit.viral_motivation}"
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Sticky Footer */}
                            <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 space-y-4 sticky bottom-0 z-20">
                                <button
                                    onClick={() => { selection(); setShowAuditModal(false); setActiveTab('studio'); }}
                                    className="w-full h-13 vibing-blue-animated rounded-2xl font-black text-white text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 hover:gap-5 group"
                                >
                                    Initiate Viral Protocol <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
                                    <div className="flex items-center gap-2 text-emerald-500 font-black text-[8px] uppercase tracking-[0.2em]">
                                        <CheckCircle2 size={12} />
                                        Audit Verified for 60m Dominance
                                    </div>
                                    <button
                                        onClick={() => { selection(); handleRefreshAudit(); }}
                                        disabled={isAuditing}
                                        className="text-[8px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                                    >
                                        {isAuditing ? 'Syncing...' : 'Sync Global Node (-3 Tokens)'}
                                    </button>
                                </div>
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
                        className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl"
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
                                    <div>
                                        {renderMarkdown(selectedArticle.content)}
                                    </div>
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
                        className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/90 backdrop-blur-md"
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

            {/* HEADLINE FIXER MODAL */}
            <AnimatePresence>
                {showHeadlineModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/90 backdrop-blur-md"
                        onClick={() => setShowHeadlineModal?.(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg rounded-[2.5rem] border border-slate-200 dark:border-white/10 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl shadow-3xl flex flex-col max-h-[85vh] relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50" />

                            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-linear-to-r from-indigo-500/5 to-transparent">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                        <Zap size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">{t('pro_dashboard.tools.headline.title')}</h3>
                                        <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] opacity-70">
                                            Curiosity Loop Engineering
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowHeadlineModal?.(false)}
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                >
                                    <X size={20} className="text-slate-900 dark:text-white/60" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-8 space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('pro_dashboard.tools.headline.placeholder')}</label>
                                    <textarea
                                        value={headlineInput}
                                        onChange={(e) => setHeadlineInput(e.target.value)}
                                        className="w-full h-24 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-medium focus:border-indigo-500 outline-hidden transition-all text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
                                        placeholder={t('pro_dashboard.tools.headline.placeholder')}
                                    />
                                </div>

                                {headlineResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-5 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/20 space-y-3 relative overflow-hidden group"
                                    >
                                        <div className="absolute top-0 right-0 p-3">
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                        </div>
                                        <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Synthesized Headline</h4>
                                        <p className="text-[14px] font-bold text-slate-900 dark:text-white leading-tight">
                                            {headlineResult}
                                        </p>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(headlineResult);
                                                showNotification({ title: 'Copied', message: 'Headline copied to clipboard.', type: 'success' });
                                            }}
                                            className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                                        >
                                            Copy to Clipboard
                                        </button>
                                    </motion.div>
                                )}

                                <div className="p-4 bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10 flex items-start gap-3">
                                    <Sparkles className="w-5 h-5 text-indigo-500 mt-0.5" />
                                    <p className="text-[10px] text-indigo-700 dark:text-indigo-400 leading-relaxed italic">
                                        {t('pro_dashboard.tools.headline.neural_desc')}
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 sm:p-8 bg-slate-50 dark:bg-black/40 border-t border-slate-100 dark:border-white/5">
                                <button
                                    onClick={onFixHeadline}
                                    disabled={isFixingHeadline || !headlineInput}
                                    className="w-full h-13 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:grayscale"
                                >
                                    {isFixingHeadline ? (
                                        <>
                                            <Loader2 className="animate-spin" size={16} />
                                            Synthesizing...
                                        </>
                                    ) : (
                                        <>
                                            {t('pro_dashboard.tools.headline.btn').toUpperCase()} <Sparkles size={16} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BIO GENERATOR MODAL */}
            <AnimatePresence>
                {showBioModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/90 backdrop-blur-md"
                        onClick={() => setShowBioModal?.(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg rounded-[2.5rem] border border-slate-200 dark:border-white/10 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl shadow-3xl flex flex-col max-h-[85vh] relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-amber-500 via-orange-500 to-amber-500 opacity-50" />

                            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-linear-to-r from-amber-500/5 to-transparent">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                        <Sparkles size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">{t('pro_dashboard.tools.bio.title')}</h3>
                                        <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em] opacity-70">
                                            High-Conversion Persona Sync
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowBioModal?.(false)}
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                >
                                    <X size={20} className="text-slate-900 dark:text-white/60" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-8 space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('pro_dashboard.tools.bio.desc')}</label>
                                    <textarea
                                        value={bioInput}
                                        onChange={(e) => setBioInput(e.target.value)}
                                        className="w-full h-24 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-medium focus:border-amber-500 outline-hidden transition-all text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
                                        placeholder={t('pro_dashboard.tools.bio.placeholder')}
                                    />
                                </div>

                                {bioResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-5 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/20 space-y-3 relative overflow-hidden group"
                                    >
                                        <div className="absolute top-0 right-0 p-3">
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                        </div>
                                        <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Synthesized Bio</h4>
                                        <p className="text-[14px] font-bold text-slate-900 dark:text-white leading-tight">
                                            {bioResult}
                                        </p>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(bioResult);
                                                showNotification({ title: 'Copied', message: 'Bio copied to clipboard.', type: 'success' });
                                            }}
                                            className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:text-amber-600 transition-colors"
                                        >
                                            Copy to Clipboard
                                        </button>
                                    </motion.div>
                                )}

                                <div className="p-4 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-100 dark:border-amber-500/10 flex items-start gap-3">
                                    <Sparkles className="w-5 h-5 text-amber-500 mt-0.5" />
                                    <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed italic">
                                        {t('pro_dashboard.tools.bio.neural_desc')}
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 sm:p-8 bg-slate-50 dark:bg-black/40 border-t border-slate-100 dark:border-white/5">
                                <button
                                    onClick={onGenerateBio}
                                    disabled={isGeneratingBio || !bioInput}
                                    className="w-full h-13 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:grayscale"
                                >
                                    {isGeneratingBio ? (
                                        <>
                                            <Loader2 className="animate-spin" size={16} />
                                            Synthesizing...
                                        </>
                                    ) : (
                                        <>
                                            {t('pro_dashboard.tools.bio.btn').toUpperCase()} <Sparkles size={16} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
