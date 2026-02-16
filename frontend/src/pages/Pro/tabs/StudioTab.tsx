import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Send, ChevronRight, Terminal, Bot, Image as ImageIcon,
    CheckCircle2, Loader2, Copy, Download, RefreshCw, Undo2, Share, ArrowLeft, X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { proService, PROStatus } from '../../../services/proService';
import { getApiUrl } from '../../../utils/api';
import { renderMarkdown } from '../utils/renderMarkdown';
import { postTypes as defaultPostTypes, audiences as defaultAudiences, languages as defaultLanguages } from '../utils/constants';

interface StudioTabProps {
    status: PROStatus | null;
    setStatus: (status: PROStatus | null) => void;
    selection: () => void;
    impact: (style: 'light' | 'medium' | 'heavy') => void;
    notification: (notif: any) => void;
    externalStep: number;
    setExternalStep: (step: number) => void;
    setExternalReady: (ready: boolean) => void;
    generatedResult: any;
    setGeneratedResult: (res: any) => void;
    history: any[];
    setHistory: (history: any[]) => void;
    historyIndex: number;
    setHistoryIndex: (index: number) => void;
}

export const StudioTab = ({
    status,
    setStatus,
    selection,
    impact,
    notification,
    externalStep,
    setExternalStep,
    setExternalReady,
    generatedResult,
    setGeneratedResult,
    history,
    setHistory,
    historyIndex,
    setHistoryIndex
}: StudioTabProps) => {
    const { t, i18n } = useTranslation();
    const [postType, setPostType] = useState('');
    const [audience, setAudience] = useState('');
    const [language, setLanguage] = useState(i18n.language === 'ru' ? 'Russian' : 'English');
    const [isGenerating, setIsGenerating] = useState(false);
    const [countdown, setCountdown] = useState(30);

    // Publishing State
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishedPlatforms, setPublishedPlatforms] = useState<string[]>([]);

    useEffect(() => {
        setExternalReady(!!postType && !!audience);
    }, [postType, audience, setExternalReady]);

    useEffect(() => {
        const handleGen = () => handleGenerate();
        const handlePublish = () => setShowPublishModal(true);

        window.addEventListener('trigger-studio-gen', handleGen);
        window.addEventListener('trigger-studio-publish', handlePublish);
        return () => {
            window.removeEventListener('trigger-studio-gen', handleGen);
            window.removeEventListener('trigger-studio-publish', handlePublish);
        };
    }, [postType, audience, language, generatedResult, status]);

    useEffect(() => {
        let interval: any;
        if (isGenerating) {
            setCountdown(30);
            interval = setInterval(() => {
                setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isGenerating]);

    const handleGenerate = async () => {
        if (!postType || !audience) {
            notification({ title: 'Error', text: 'Select strategy and target', type: 'error' });
            return;
        }

        setIsGenerating(true);
        impact('heavy');

        try {
            const result = await proService.generateContent(postType, audience, language);

            // Manage History
            const newHistory = [...history.slice(0, historyIndex + 1), result];
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
            setGeneratedResult(result);

            setStatus(status ? { ...status, pro_tokens: result.tokens_remaining } : null);
            setExternalStep(3);
            notification({ title: t('pro_dashboard.notifications.success'), text: t('pro_dashboard.notifications.viral_synthesized'), type: 'success' });
        } catch (error: any) {
            console.error('Generation failed', error);
            notification({ title: t('pro_dashboard.notifications.error'), text: t('pro_dashboard.notifications.gen_failed'), type: 'error' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyText = () => {
        if (!generatedResult) return;
        const hashtagsStr = generatedResult.hashtags?.map((t: string) => `#${t}`).join(' ') || '';
        const text = `${generatedResult.title}\n\n${generatedResult.body}\n\n${hashtagsStr}`;

        navigator.clipboard.writeText(text);
        notification({ title: t('pro_dashboard.notifications.copied'), text: t('pro_dashboard.notifications.text_copied'), type: 'success' });
    };

    const handleSharePost = async () => {
        if (!generatedResult) return;
        const textToShare = `${generatedResult.title}\n\n${generatedResult.body}\n\n#PintopayPRO #FinancialFreedom`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: generatedResult.title,
                });
            } catch (err) {
                console.error('Share failed', err);
            }
        } else {
            handleCopyText();
        }
    };

    const handleSaveImageToDevice = async () => {
        if (!generatedResult?.image_url) return;

        let finalUrl = generatedResult.image_url;
        if (!finalUrl.startsWith('http')) {
            const baseUrl = getApiUrl().replace(/\/api\/?$/, '');
            finalUrl = `${baseUrl}${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
        }
        finalUrl = finalUrl.replace(/\/api\/images/, '/images');

        try {
            const response = await fetch(finalUrl);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `viral_p2p_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            notification({ title: 'Saved', text: 'Image saved to device.', type: 'success' });
        } catch (err) {
            window.open(finalUrl, '_blank');
        }
    };

    const handleUndoVersion = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setGeneratedResult(history[newIndex]);
            impact('medium');
            setExternalStep(3); // Ensure we are on step 3
        }
    };

    const handlePublishToPlatform = async (platform: 'x' | 'telegram' | 'linkedin') => {
        if (!generatedResult) return;
        setIsPublishing(true);
        impact('heavy');
        try {
            const hashtagsStr = generatedResult.hashtags?.map((t: string) => t.startsWith('#') ? t : `#${t}`).join(' ') || '';
            const fullContent = `${generatedResult.title}\n\n${generatedResult.body}\n\n${hashtagsStr}`;

            await proService.publishContent(platform, fullContent, generatedResult.image_url);
            setPublishedPlatforms([...publishedPlatforms, platform]);
            notification({ title: 'Published', text: `Synchronized with ${platform.toUpperCase()}.`, type: 'success' });
        } catch (error: any) {
            notification({ title: 'Publish Error', text: error.response?.data?.detail || 'Failed to publish.', type: 'error' });
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <motion.div
            key="studio"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            {/* Stepper - Premium High-Fidelity */}
            <div className="flex items-center justify-center pt-2 pb-6 px-4">
                <div className="flex items-center w-full max-w-xs justify-between relative">
                    {/* Background Progress Line */}
                    <div className="absolute top-[18px] left-0 w-full h-[2px] bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full vibing-blue-gradient shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                            initial={{ width: "0%" }}
                            animate={{ width: externalStep === 1 ? "0%" : externalStep === 2 ? "50%" : "100%" }}
                            transition={{ duration: 0.8, ease: "circOut" }}
                        />
                    </div>

                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex flex-col items-center relative z-10">
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: externalStep === s ? 1.15 : 1,
                                    backgroundColor: externalStep === s ? 'rgb(255, 255, 255)' : externalStep > s ? 'rgb(16, 185, 129)' : 'rgb(241, 245, 249)'
                                }}
                                className={`w-9 h-9 rounded-2xl flex items-center justify-center text-[10px] font-black transition-all shadow-xl ${externalStep === s
                                    ? 'vibing-blue-animated text-white ring-4 ring-indigo-500/10'
                                    : externalStep > s
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-white/5'
                                    }`}
                            >
                                {externalStep > s ? <CheckCircle2 size={16} /> : (
                                    <span className={externalStep === s ? 'animate-pulse' : ''}>{s}</span>
                                )}
                            </motion.div>
                            <span className={`text-[7px] font-black uppercase tracking-[0.2em] mt-2 transition-colors duration-500 ${externalStep === s ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-700'
                                }`}>
                                {s === 1 ? 'Frame' : s === 2 ? 'Synthes' : 'Deploy'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {externalStep === 1 && (
                <motion.div
                    key="step1"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="space-y-6"
                >
                    <div className="pro-card-extreme bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 border border-slate-200 dark:border-white/10 shadow-3xl relative overflow-hidden group noise-overlay">
                        <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-32 -mt-32 animate-pulse" />

                        <div className="flex items-center justify-between mb-5 sm:mb-7 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl vibing-blue-animated flex items-center justify-center shrink-0 shadow-xl shadow-indigo-500/20">
                                    <Terminal size={18} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-[11px] sm:text-[13px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white leading-none mb-1">
                                        {t('pro_dashboard.studio.matrix_title')}
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                            {t('pro_dashboard.studio.matrix_subtitle')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {/* Strategy Selection */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest">
                                        01. {t('pro_dashboard.studio.strategy_label')}
                                    </label>
                                </div>
                                <div className="relative">
                                    <select
                                        value={postType}
                                        onChange={(e) => { selection(); setPostType(e.target.value); }}
                                        className="w-full h-12 sm:h-14 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-indigo-500/50 rounded-xl sm:rounded-2xl px-5 text-[13px] font-bold text-slate-900 dark:text-white outline-hidden appearance-none transition-all cursor-pointer shadow-sm"
                                    >
                                        <option value="" disabled>{t('pro_dashboard.studio.strategy_placeholder')}</option>
                                        {defaultPostTypes.map(pt => <option key={pt.id} value={pt.id}>{i18n.language === 'ru' ? pt.ru : pt.en}</option>)}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500">
                                        <ChevronRight className="rotate-90 w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            {/* Target Audience */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[9px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-widest">
                                        02. {t('pro_dashboard.studio.target_label')}
                                    </label>
                                </div>
                                <div className="relative">
                                    <select
                                        value={audience}
                                        onChange={(e) => { selection(); setAudience(e.target.value); }}
                                        className="w-full h-12 sm:h-14 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-purple-500/50 rounded-xl sm:rounded-2xl px-5 text-[13px] font-bold text-slate-900 dark:text-white outline-hidden appearance-none transition-all cursor-pointer shadow-sm"
                                    >
                                        <option value="" disabled>{t('pro_dashboard.studio.target_placeholder')}</option>
                                        {defaultAudiences.map(a => <option key={a.id} value={a.id}>{i18n.language === 'ru' ? a.ru : a.en}</option>)}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-purple-500">
                                        <ChevronRight className="rotate-90 w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            {/* Output Language */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">
                                        03. {t('pro_dashboard.studio.language_label')}
                                    </label>
                                </div>
                                <div className="relative">
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="w-full h-12 sm:h-14 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-emerald-500/50 rounded-xl sm:rounded-2xl px-5 text-[13px] font-bold text-slate-900 dark:text-white outline-hidden appearance-none transition-all cursor-pointer shadow-sm"
                                    >
                                        {defaultLanguages.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500">
                                        <Send size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Area */}
                        <div className="pt-6 sm:pt-10 relative z-20">
                            <button
                                onClick={() => { selection(); setExternalStep(2); }}
                                disabled={!postType || !audience}
                                className="w-full h-14 vibing-blue-animated rounded-xl font-black text-white text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale sm:hidden"
                            >
                                <Sparkles size={16} className="animate-pulse" />
                                {t('pro_dashboard.studio.initiate_btn')}
                                <ChevronRight size={16} />
                            </button>
                            <p className="text-[9px] font-black text-slate-400 text-center mt-4 uppercase tracking-widest opacity-40">
                                Powered by Claude 3.5 & Flux PRO
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {externalStep === 2 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel-premium rounded-[2rem] p-6 sm:p-10 text-center space-y-6 sm:space-y-8 relative overflow-hidden border border-white/10 shadow-3xl"
                >
                    <div className="absolute inset-0 bg-linear-to-tr from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />

                    {isGenerating ? (
                        <div className="py-6 sm:py-10 flex flex-col items-center justify-center space-y-6 sm:space-y-10 relative bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-3xl border border-black/3">
                            <div className="relative">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] flex items-center justify-center border border-black/3 dark:border-white/5 relative z-10">
                                    <Bot className="w-7 h-7 sm:w-9 sm:h-9 text-indigo-500" />
                                </div>
                                <div className="absolute -inset-4 bg-indigo-500/5 blur-2xl rounded-full animate-pulse" />
                            </div>

                            <div className="space-y-4 sm:space-y-6 w-full max-w-[240px] sm:max-w-xs px-4 sm:px-6">
                                <div className="space-y-1 text-center">
                                    <div className="vibing-blue-animated py-2 px-4 sm:py-3 sm:px-6 rounded-xl shadow-lg border border-blue-400/30">
                                        <h3 className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] text-white">
                                            {t('pro_dashboard.studio.cooking_title')}
                                        </h3>
                                    </div>
                                    <p className="text-[7px] sm:text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-2 opacity-60">
                                        DEEP LEARNING OPTIMIZATION ACTIVE
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-baseline gap-1.5 sm:gap-2">
                                            <span className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter">
                                                {Math.min(Math.floor(((30 - countdown) / 30) * 100), 99)} <span className="text-[10px] sm:text-xs not-italic opacity-30 ml-1 font-bold">%</span>
                                            </span>
                                            <span className="text-[8px] sm:text-[9px] font-black text-indigo-500 uppercase tracking-widest border-b border-indigo-500/20 pb-0.5 sm:pb-1">
                                                {t('pro_dashboard.studio.cooking_remaining', { count: countdown })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="h-1 sm:h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden relative">
                                        <motion.div
                                            className="h-full vibing-blue-animated rounded-full"
                                            initial={{ width: "0%" }}
                                            animate={{ width: `${Math.min(((30 - countdown) / 30) * 100, 99)}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-40" />
                            <div className="w-20 h-20 mx-auto bg-indigo-500/10 rounded-2xl flex items-center justify-center relative group">
                                <Bot className="w-8 h-8 text-indigo-500 group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute -inset-1.5 border border-indigo-500/20 rounded-[1.5rem] animate-pulse" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-black uppercase tracking-tight text-white">{t('pro_dashboard.studio.ready_title')}</h3>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-400">{t('pro_dashboard.studio.ready_subtitle')}</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 shadow-inner">
                                <p className="text-[10px] font-medium leading-relaxed text-slate-900 dark:text-white/70">
                                    {t('pro_dashboard.studio.ready_p')}
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    onClick={handleGenerate}
                                    className="w-full h-14 vibing-blue-animated rounded-xl font-black text-white text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3 group"
                                >
                                    {t('pro_dashboard.studio.go_viral_btn')} <Send size={14} className="group-active:translate-x-1 group-active:-translate-y-1 transition-transform" />
                                </button>
                                <button
                                    onClick={() => { selection(); setExternalStep(1); }}
                                    className="w-full h-10 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={12} /> {t('pro_dashboard.studio.back_btn')}
                                </button>
                            </div>
                        </>
                    )}
                </motion.div>
            )}

            {externalStep === 3 && generatedResult && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <div className="glass-panel-premium rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl">
                        <div className="aspect-square sm:aspect-video bg-slate-900 relative flex items-center justify-center overflow-hidden group/img">
                            <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/80 z-1" />
                            {generatedResult.image_url ? (
                                <img src={generatedResult.image_url.startsWith('http') ? generatedResult.image_url : `${getApiUrl().replace(/\/api$/, '')}${generatedResult.image_url}`} alt="Viral" className="w-full h-full object-cover" />
                            ) : (
                                <div className="p-6 text-center z-2">
                                    <ImageIcon className="w-10 h-10 text-indigo-500 mx-auto mb-3 opacity-50" />
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-300 font-bold">{generatedResult.image_prompt}</p>
                                </div>
                            )}

                            {/* Image Actions Overlay */}
                            <div className="absolute inset-x-0 bottom-0 z-10 opacity-0 group-hover/img:opacity-100 transition-all duration-300 bg-linear-to-t from-black/90 to-transparent p-6 translate-y-4 group-hover/img:translate-y-0">
                                <div className="flex items-center justify-center gap-4">
                                    <button onClick={() => { selection(); handleSaveImageToDevice(); }} className="p-4 bg-white/10 hover:bg-emerald-500 rounded-2xl border border-white/20 text-white backdrop-blur-xl transition-all active:scale-90">
                                        <Download size={20} />
                                    </button>
                                    <button onClick={handleGenerate} className="p-4 bg-white/10 hover:bg-indigo-500 rounded-2xl border border-white/20 text-white backdrop-blur-xl transition-all active:scale-90">
                                        <RefreshCw size={20} />
                                    </button>
                                    {historyIndex > 0 && (
                                        <button onClick={handleUndoVersion} className="p-4 bg-white/10 hover:bg-amber-500 rounded-2xl border border-white/20 text-white backdrop-blur-xl transition-all active:scale-90">
                                            <Undo2 size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="absolute top-6 right-6 z-2">
                                <span className="bg-indigo-500/90 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border border-indigo-400/30">{t('pro_dashboard.studio.ai_generated_badge')}</span>
                            </div>
                        </div>
                        <div className="p-5 sm:p-7 space-y-4 relative">
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-2">
                                    <h4 className="text-lg font-black leading-tight text-slate-900 dark:text-white uppercase tracking-tight">
                                        {renderMarkdown(generatedResult.title, true)}
                                    </h4>
                                    <div className="h-1 w-12 vibing-blue-gradient rounded-full" />
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => { selection(); handleCopyText(); }} className="p-2.5 bg-white/60 dark:bg-slate-900/60 hover:bg-indigo-500/10 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-all active:scale-90">
                                        <Copy size={14} />
                                    </button>
                                    <button onClick={handleGenerate} className="p-2.5 bg-white/60 dark:bg-slate-900/60 hover:bg-indigo-500/10 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-all active:scale-90">
                                        <RefreshCw size={14} className={isGenerating ? "animate-spin" : ""} />
                                    </button>
                                </div>
                            </div>
                            <div className="text-[13px] font-medium leading-relaxed text-slate-900 dark:text-white/80 whitespace-pre-wrap selection:bg-indigo-500/20">
                                {renderMarkdown(generatedResult.body)}
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {generatedResult.hashtags?.map((t: string) => (
                                    <span key={t} className="text-[9px] font-black text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/10">#{t}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pb-4">
                        <button onClick={() => { selection(); setShowPublishModal(true); }} className="h-12 vibing-blue-animated rounded-xl font-black text-white text-[10px] uppercase tracking-[0.15em] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                            {t('pro_dashboard.studio.publish_btn')} <Send size={14} className="animate-pulse" />
                        </button>
                        <button onClick={() => { impact('light'); handleSharePost(); }} className="h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] text-slate-900 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm">
                            {t('pro_dashboard.studio.share_btn')} <Share size={14} />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Local Publishing Modal */}
            <AnimatePresence>
                {showPublishModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-2000 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-3xl overflow-y-auto"
                        onClick={() => setShowPublishModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 30, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 relative border border-white/10 shadow-3xl"
                        >
                            <button
                                onClick={() => setShowPublishModal(false)}
                                className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-xl">
                                    <Send size={28} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">System Broadcast</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Channel Synchronization</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {(['x', 'telegram', 'linkedin'] as const).map((platform) => (
                                    <button
                                        key={platform}
                                        onClick={() => handlePublishToPlatform(platform)}
                                        disabled={isPublishing || publishedPlatforms.includes(platform)}
                                        className={`w-full h-16 rounded-2xl border transition-all flex items-center justify-between px-6 group ${publishedPlatforms.includes(platform)
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                            : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent flex items-center justify-center">
                                                <Send size={18} />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest">{platform === 'x' ? 'X (Twitter)' : platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                                        </div>
                                        {publishedPlatforms.includes(platform) ? <CheckCircle2 size={18} /> : <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                                    </button>
                                ))}
                            </div>

                            {isPublishing && (
                                <div className="flex items-center justify-center gap-3 pt-2">
                                    <Loader2 className="animate-spin text-indigo-500" size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Synchronizing...</span>
                                </div>
                            )}

                            <button
                                onClick={() => setShowPublishModal(false)}
                                className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-colors"
                            >
                                Dismiss Protocol
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
