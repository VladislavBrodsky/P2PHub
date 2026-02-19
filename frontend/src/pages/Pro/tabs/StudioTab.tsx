import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Send, ChevronRight, Terminal, Bot, Image as ImageIcon,
    CheckCircle2, Loader2, Copy, Download, RefreshCw, Undo2, Share, ArrowLeft, X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { proService, PROStatus } from '../../../services/proService';
import { getApiUrl } from '../../../utils/api';
import { renderMarkdown } from '../utils/renderMarkdown';
import { postTypes as defaultPostTypes, audiences as defaultAudiences, languages as defaultLanguages, tones as defaultTones } from '../utils/constants';
import { PremiumSelect } from '../components/PremiumSelect';

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
    const [tone, setTone] = useState('authoritative');
    const [isGenerating, setIsGenerating] = useState(false);
    const [countdown, setCountdown] = useState(30);

    // Publishing State
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishedPlatforms, setPublishedPlatforms] = useState<string[]>([]);

    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const handleToggle = (key: string) => {
        setOpenDropdown(prev => prev === key ? null : key);
    };

    useEffect(() => {
        setExternalReady(!!postType && !!audience);
    }, [postType, audience, setExternalReady]);


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

    const handleGenerate = useCallback(async () => {
        if (!postType || !audience) {
            notification({ title: 'Error', text: 'Select strategy and target', type: 'error' });
            return;
        }

        setIsGenerating(true);
        impact('heavy');

        try {
            const result = await proService.generateContent(postType, audience, language, tone);

            // Manage History
            const newHistory = [...history.slice(0, historyIndex + 1), result];
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
            setGeneratedResult(result);

            setStatus(status ? { ...status, pro_tokens: result.tokens_remaining } : null);
            setExternalStep(3);
            notification({ title: t('pro_dashboard.notifications.success'), text: t('pro_dashboard.notifications.viral_synthesized'), type: 'success' });
        } catch (error: any) {
            console.error('❌ Viral content generation failed:', error);

            // Extract detailed error message
            let errorTitle = t('pro_dashboard.notifications.error');
            let errorMessage = t('pro_dashboard.notifications.gen_failed');

            if (error.response?.data?.detail) {
                // Backend provided detailed error
                errorMessage = error.response.data.detail;
                console.error('Backend error detail:', errorMessage);
            } else if (error.response?.status === 402) {
                errorTitle = t('pro_dashboard.notifications.tokens_required');
                errorMessage = t('pro_dashboard.notifications.tokens_required_text');
            } else if (error.response?.status === 403) {
                errorTitle = t('pro_dashboard.notifications.pro_required');
                errorMessage = t('pro_dashboard.notifications.pro_required_text');
            } else if (error.message) {
                errorMessage = `${errorMessage}: ${error.message}`;
            }

            notification({
                title: errorTitle,
                text: errorMessage,
                type: 'error'
            });
        } finally {
            setIsGenerating(false);
        }
    }, [postType, audience, language, tone, history, historyIndex, status, t, notification, impact, setHistory, setHistoryIndex, setGeneratedResult, setStatus, setExternalStep]);

    useEffect(() => {
        const handleGen = () => handleGenerate();
        const handlePublish = () => setShowPublishModal(true);

        window.addEventListener('trigger-studio-gen', handleGen);
        window.addEventListener('trigger-studio-publish', handlePublish);
        return () => {
            window.removeEventListener('trigger-studio-gen', handleGen);
            window.removeEventListener('trigger-studio-publish', handlePublish);
        };
    }, [handleGenerate]);

    const handleCopyText = () => {
        if (!generatedResult) return;
        const hashtagsStr = generatedResult.hashtags?.map((t: string) => t.startsWith('#') ? t : `#${t}`).join(' ') || '';
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
                    text: textToShare
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
            notification({ title: t('pro_dashboard.notifications.image_saved'), text: t('pro_dashboard.notifications.image_saved_text'), type: 'success' });
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
            notification({ title: t('pro_dashboard.notifications.published'), text: t('pro_dashboard.notifications.published_text', { platform: platform.toUpperCase() }), type: 'success' });
        } catch (error: any) {
            notification({ title: t('pro_dashboard.notifications.publish_error'), text: error.response?.data?.detail || t('pro_dashboard.notifications.publish_failed'), type: 'error' });
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
                            className="h-full vibing-blue-animated shadow-[0_0_10px_rgba(59,130,246,0.5)]"
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
                            <PremiumSelect
                                label={t('pro_dashboard.studio.strategy_label')}
                                value={postType}
                                onChange={(val) => setPostType(val)}
                                options={defaultPostTypes.map(pt => ({
                                    id: pt.id,
                                    label: i18n.language === 'ru' ? pt.ru : pt.en
                                }))}
                                placeholder={t('pro_dashboard.studio.strategy_placeholder')}
                                color="indigo"
                                isOpen={openDropdown === 'strategy'}
                                onToggle={() => handleToggle('strategy')}
                                onClose={() => setOpenDropdown(null)}
                                indexStr="01"
                            />

                            {/* Target Audience */}
                            <PremiumSelect
                                label={t('pro_dashboard.studio.target_label')}
                                value={audience}
                                onChange={(val) => setAudience(val)}
                                options={defaultAudiences.map(a => ({
                                    id: a.id,
                                    label: i18n.language === 'ru' ? a.ru : a.en
                                }))}
                                placeholder={t('pro_dashboard.studio.target_placeholder')}
                                color="purple"
                                isOpen={openDropdown === 'audience'}
                                onToggle={() => handleToggle('audience')}
                                onClose={() => setOpenDropdown(null)}
                                indexStr="02"
                            />

                            {/* Tone of Voice */}
                            <PremiumSelect
                                label={t('pro_dashboard.studio.tone_label', 'Tone of Voice')}
                                value={tone}
                                onChange={(val) => setTone(val)}
                                options={defaultTones.map(t => ({
                                    id: t.id,
                                    label: i18n.language === 'ru' ? t.ru : t.en
                                }))}
                                placeholder="Select Tone"
                                color="amber"
                                isOpen={openDropdown === 'tone'}
                                onToggle={() => handleToggle('tone')}
                                onClose={() => setOpenDropdown(null)}
                                indexStr="03"
                            />

                            {/* Output Language */}
                            <PremiumSelect
                                label={t('pro_dashboard.studio.language_label')}
                                value={language}
                                onChange={(val) => setLanguage(val)}
                                options={defaultLanguages.map(l => ({
                                    id: l.id,
                                    label: l.label
                                }))}
                                placeholder="Select Language"
                                color="emerald"
                                isOpen={openDropdown === 'language'}
                                onToggle={() => handleToggle('language')}
                                onClose={() => setOpenDropdown(null)}
                                indexStr="04"
                            />
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
                    className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem]"
                >
                    {/* Premium Gradient Border */}
                    <div className="absolute inset-0 bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-20 dark:opacity-30 blur-xl" />
                    <div className="absolute inset-px bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem]" />

                    <div className="relative p-6 sm:p-10 text-center space-y-6 sm:space-y-8">
                        {isGenerating ? (
                            <div className="py-8 sm:py-12 flex flex-col items-center justify-center space-y-6 sm:space-y-10">
                                {/* Premium Icon Container */}
                                <div className="relative">
                                    {/* Animated Glow Rings */}
                                    <motion.div
                                        className="absolute inset-0 rounded-3xl bg-linear-to-br from-indigo-500 to-purple-600 opacity-20"
                                        animate={{
                                            scale: [1, 1.2, 1],
                                            opacity: [0.2, 0.4, 0.2],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    />
                                    <motion.div
                                        className="absolute -inset-2 rounded-3xl bg-linear-to-br from-purple-500 to-pink-600 opacity-10"
                                        animate={{
                                            scale: [1, 1.3, 1],
                                            opacity: [0.1, 0.3, 0.1],
                                        }}
                                        transition={{
                                            duration: 2.5,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: 0.5
                                        }}
                                    />

                                    {/* Icon */}
                                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-linear-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl shadow-2xl flex items-center justify-center border border-slate-200/50 dark:border-white/10">
                                        <Bot className="w-9 h-9 sm:w-11 sm:h-11 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                </div>

                                <div className="space-y-5 sm:space-y-6 w-full max-w-[280px] sm:max-w-sm">
                                    {/* Status Badge */}
                                    <div className="space-y-2 text-center">
                                        <div className="inline-flex items-center gap-2 bg-linear-to-r from-indigo-500 to-purple-600 py-2.5 px-5 sm:py-3 sm:px-6 rounded-2xl shadow-xl border border-indigo-400/30">
                                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                            <h3 className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-white">
                                                AI ENGINE ACTIVE
                                            </h3>
                                        </div>
                                        <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.25em] opacity-70">
                                            {t('pro_dashboard.studio.cooking_title')}
                                        </p>
                                    </div>

                                    {/* Progress Info */}
                                    <div className="bg-slate-50/80 dark:bg-black/40 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/20 dark:border-white/5 shadow-2xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-50" />
                                        <div className="space-y-6 relative z-10">
                                            {/* Percentage Display */}
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-5xl sm:text-6xl font-black bg-linear-to-br from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent drop-shadow-2xl">
                                                        {Math.min(Math.floor(((30 - countdown) / 30) * 100), 99)}
                                                    </span>
                                                    <span className="text-lg sm:text-xl font-black text-slate-400/50">%</span>
                                                </div>
                                            </div>

                                            {/* Progress Bar Container */}
                                            <div className="space-y-3">
                                                <div className="h-3 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden relative shadow-inner border border-white/10">
                                                    <motion.div
                                                        className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                                                        initial={{ width: "0%" }}
                                                        animate={{ width: `${Math.min(((30 - countdown) / 30) * 100, 99)}%` }}
                                                        transition={{ duration: 0.5 }}
                                                    >
                                                        <div className="absolute inset-0 bg-linear-to-r from-white/30 via-transparent to-transparent animate-shimmer-slide" />
                                                    </motion.div>
                                                </div>

                                                <div className="flex justify-between items-center px-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                                        <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Neural Link Active</span>
                                                    </div>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{countdown}S REMAINING</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Message */}
                                    <p className="text-[10px] sm:text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed px-2">
                                        Our agent is prepared to craft viral stories tailored specifically for your audience.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Top Accent Line */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-indigo-500 to-transparent" />

                                {/* Icon */}
                                <div className="relative inline-flex">
                                    <div className="absolute -inset-3 bg-linear-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl" />
                                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-linear-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-3xl flex items-center justify-center border border-indigo-500/20 dark:border-indigo-500/30 shadow-xl group cursor-pointer">
                                        <Bot className="w-9 h-9 sm:w-11 sm:h-11 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="space-y-2">
                                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight bg-linear-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                        {t('pro_dashboard.studio.ready_title')}
                                    </h3>
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400">
                                        {t('pro_dashboard.studio.ready_subtitle')}
                                    </p>
                                </div>

                                {/* Description */}
                                <div className="max-w-sm mx-auto">
                                    <p className="text-[11px] sm:text-[12px] font-medium leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-sm px-5 py-4 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm">
                                        {t('pro_dashboard.studio.ready_p')}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-3 pt-4 max-w-sm mx-auto">
                                    <button
                                        onClick={handleGenerate}
                                        className="group relative w-full h-14 sm:h-16 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-2xl font-black text-white text-[11px] sm:text-[12px] uppercase tracking-[0.2em] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/30 dark:shadow-indigo-500/20 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        <Sparkles size={18} className="animate-pulse" />
                                        GO VIRAL
                                        <Send size={16} className="group-active:translate-x-1 group-active:-translate-y-1 transition-transform" />
                                    </button>
                                    <button
                                        onClick={() => { selection(); setExternalStep(1); }}
                                        className="w-full h-11 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all flex items-center justify-center gap-2 border border-slate-200/50 dark:border-white/10"
                                    >
                                        <ArrowLeft size={14} /> BACK
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
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
                                    <div className="h-1 w-12 vibing-blue-animated rounded-full" />
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
                                    <span key={t} className="text-[9px] font-black text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/10">{t.startsWith('#') ? t : `#${t}`}</span>
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
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {showPublishModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl overflow-y-auto"
                            onClick={() => setShowPublishModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white dark:bg-slate-900 w-full max-w-[340px] rounded-[1.5rem] p-5 space-y-3 relative border border-slate-200 dark:border-white/10 shadow-3xl mx-4 my-auto"
                            >
                                <button
                                    onClick={() => setShowPublishModal(false)}
                                    className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors z-10"
                                >
                                    <X size={18} />
                                </button>

                                <div className="flex flex-col items-center text-center space-y-2 pt-1">
                                    <div className="w-12 h-12 bg-linear-to-br from-indigo-500/10 to-purple-500/10 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-lg">
                                        <Send size={20} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h3 className="text-[15px] font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                            {t('pro_dashboard.publish.title')}
                                        </h3>
                                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-indigo-500">
                                            {t('pro_dashboard.publish.subtitle')}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 text-center leading-relaxed px-1">
                                        {t('pro_dashboard.publish.mgmt_p')}
                                    </p>

                                    <div className="grid gap-2">
                                        {(['x', 'telegram', 'linkedin'] as const).map((platform) => (
                                            <button
                                                key={platform}
                                                onClick={() => handlePublishToPlatform(platform)}
                                                disabled={isPublishing || publishedPlatforms.includes(platform)}
                                                className={`w-full h-12 rounded-lg border transition-all flex items-center justify-between px-3 group ${publishedPlatforms.includes(platform)
                                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 active:scale-98'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${publishedPlatforms.includes(platform) ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300'
                                                        }`}>
                                                        <Send size={14} />
                                                    </div>
                                                    <div className="text-left min-w-0">
                                                        <span className="block text-[10px] font-black uppercase tracking-wider leading-none mb-0.5 truncate">
                                                            {platform === 'x' ? 'X (TW)' : platform}
                                                        </span>
                                                        <span className="block text-[8px] font-bold opacity-60 truncate">
                                                            {publishedPlatforms.includes(platform) ? t('pro_dashboard.publish.platform_success') : t('pro_dashboard.publish.platform_tap')}
                                                        </span>
                                                    </div>
                                                </div>
                                                {publishedPlatforms.includes(platform) ? <CheckCircle2 size={14} className="shrink-0" /> : <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {isPublishing && (
                                    <div className="flex items-center justify-center gap-2 pt-1">
                                        <Loader2 className="animate-spin text-indigo-500" size={16} />
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-indigo-400">Processing...</span>
                                    </div>
                                )}

                                <button
                                    onClick={() => setShowPublishModal(false)}
                                    className="w-full py-2.5 text-[8px] font-black uppercase tracking-[0.25em] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                    {t('pro_dashboard.studio.back_btn')}
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </motion.div>
    );
};
