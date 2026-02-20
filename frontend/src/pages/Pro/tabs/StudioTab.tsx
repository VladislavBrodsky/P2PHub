import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, Send, ChevronRight, Terminal, Bot, Image as ImageIcon,
    CheckCircle2, Loader2, Copy, Download, RefreshCw, Undo2, Share, ArrowLeft, ArrowRight, X,
    Zap, Users, Link as LinkIcon, Info
} from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
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
    const [showShareModal, setShowShareModal] = useState(false);
    const [isSharingSystem, setIsSharingSystem] = useState(false);
    const [selectedPublishPlatforms, setSelectedPublishPlatforms] = useState<('x' | 'telegram' | 'linkedin')[]>([]);

    // Personal Link State
    const [usePersonalLink, setUsePersonalLink] = useState(false);
    const [personalLink, setPersonalLink] = useState(status?.personal_referral_link || '');
    const [isUpdatingLink, setIsUpdatingLink] = useState(false);

    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const handleToggle = (key: string) => {
        setOpenDropdown(prev => prev === key ? null : key);
    };

    useEffect(() => {
        setExternalReady(!!postType && !!audience);

        // Auto-switch audience if partners strategy is chosen and current audience is not in the partners set
        const isPartnerStrategy = ['partners', 'partners_cards', 'partners_network'].includes(postType);
        if (isPartnerStrategy) {
            const partnerAudiences = ['passive_seekers', 'growth_masters', 'automation_kings', 'empire_builders', 'partners'];
            if (!partnerAudiences.includes(audience)) {
                setAudience('partners');
            }
        }
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

    const handleUpdatePersonalLink = async (link: string) => {
        if (!status?.is_pro) return;
        setIsUpdatingLink(true);
        try {
            await proService.updateReferralLink(link);
            setStatus({ ...status, personal_referral_link: link });
            notification({
                title: t('common.success'),
                text: t('pro_dashboard.studio.link_saved', 'Referral link updated successfully'),
                type: 'success'
            });
        } catch (error: any) {
            notification({
                title: t('common.error'),
                text: error.response?.data?.detail || t('pro_dashboard.studio.link_error', 'Invalid link format'),
                type: 'error'
            });
        } finally {
            setIsUpdatingLink(false);
        }
    };

    useEffect(() => {
        const handleGen = () => handleGenerate();
        const handlePublish = () => setShowPublishModal(true);
        const handleParams = (e: CustomEvent) => {
            const params = e.detail;
            if (params?.postType) setPostType(params.postType);
            if (params?.audience) setAudience(params.audience);
            setExternalStep(1);
        };

        window.addEventListener('trigger-studio-gen', handleGen);
        window.addEventListener('trigger-studio-publish', handlePublish);
        window.addEventListener('studio-params', handleParams as EventListener);

        return () => {
            window.removeEventListener('trigger-studio-gen', handleGen);
            window.removeEventListener('trigger-studio-publish', handlePublish);
            window.removeEventListener('studio-params', handleParams as EventListener);
        };
    }, [handleGenerate, setExternalStep]);

    const getCleanShareText = () => {
        if (!generatedResult) return '';
        // Convert Markdown links [text](url) to "text: url" for plain text sharing
        const cleanBody = generatedResult.body.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1: $2');
        const hashtagsStr = generatedResult.hashtags?.map((t: string) => t.startsWith('#') ? t : `#${t}`).join(' ') || '';

        let text = `🔥 ${generatedResult.title} 🔥\n\n${cleanBody}`;

        // Append hashtags if they exist
        if (hashtagsStr) text += `\n\n${hashtagsStr}`;

        // Ensure #PintopayPRO tag
        if (!hashtagsStr.includes('PintopayPRO')) text += ' #PintopayPRO';

        return text;
    };

    const handleCopyText = () => {
        const text = getCleanShareText();
        if (!text) return;

        navigator.clipboard.writeText(text);
        notification({ title: t('pro_dashboard.notifications.copied'), text: t('pro_dashboard.notifications.text_copied'), type: 'success' });
    };

    const handleSystemShare = async () => {
        if (!generatedResult) return;
        setIsSharingSystem(true);
        impact('light');
        const textToShare = getCleanShareText();
        const shareData: ShareData = {
            title: generatedResult.title,
            text: textToShare,
        };

        if (generatedResult.image_url) {
            try {
                let finalUrl = generatedResult.image_url;
                if (!finalUrl.startsWith('http')) {
                    const baseUrl = getApiUrl().replace(/\/api\/?$/, '');
                    finalUrl = `${baseUrl}${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
                }
                finalUrl = finalUrl.replace(/\/api\/images/, '/images');

                const response = await fetch(finalUrl);
                const blob = await response.blob();
                const file = new File([blob], 'viral_post.png', { type: blob.type });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    shareData.files = [file];
                    // On some platforms sharing both files and text is tricky,
                    // but most modern browsers handle it well.
                }
            } catch (error) {
                console.error('Failed to fetch image for sharing', error);
            }
        }

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err: any) {
                console.error('Share failed', err);
                if (err.name !== 'AbortError') {
                    handleCopyText();
                }
            }
        } else {
            handleCopyText();
        }
        setIsSharingSystem(false);
    };

    const handleSharePlatform = (platform: 'telegram' | 'whatsapp' | 'x') => {
        if (!generatedResult) return;
        impact('light');
        const textToShare = getCleanShareText();
        const encodedText = encodeURIComponent(textToShare);

        // For better previews, we can try to pass the image as the URL parameter
        // if the platform supports it and it unfurls correctly.
        let imageUrl = '';
        if (generatedResult.image_url) {
            imageUrl = generatedResult.image_url;
            if (!imageUrl.startsWith('http')) {
                const baseUrl = getApiUrl().replace(/\/api$/, '');
                imageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
            }
        }

        switch (platform) {
            case 'telegram':
                // Using t.me/share/url?url={link}&text={text}
                // If we have an image, we can use it as the 'url' to get a preview, 
                // but usually the referral link is more important.
                // However, the text already contains the referral link if synthesized correctly.
                const tgUrl = imageUrl ? encodeURIComponent(imageUrl) : '';
                window.open(`https://t.me/share/url?url=${tgUrl}&text=${encodedText}`, '_blank');
                break;
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodedText}`, '_blank');
                break;
            case 'x':
                window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank');
                break;
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

    const handleReset = () => {
        setExternalStep(1);
        setPostType('');
        setAudience('');
        setGeneratedResult(null);
        setHistory([]);
        setHistoryIndex(-1);
        impact('heavy');
    };

    const handlePublishToPlatform = async (platform: 'x' | 'telegram' | 'linkedin') => {
        if (!generatedResult) return;
        setIsPublishing(true);
        impact('heavy');
        try {
            const hashtagsStr = generatedResult.hashtags?.map((t: string) => t.startsWith('#') ? t : `#${t}`).join(' ') || '';
            const fullContent = `${generatedResult.title}\n\n${generatedResult.body}\n\n${hashtagsStr}`;

            await proService.publishContent(platform, fullContent, generatedResult.image_url, generatedResult.id);
            setPublishedPlatforms(prev => [...prev, platform]);
            notification({ title: t('pro_dashboard.notifications.success'), text: t('pro_dashboard.notifications.published_text', { platform: platform.toUpperCase() }), type: 'success' });
        } catch (error: any) {
            notification({ title: t('pro_dashboard.notifications.publish_error'), text: error.response?.data?.detail || t('pro_dashboard.notifications.publish_failed'), type: 'error' });
        } finally {
            setIsPublishing(false);
        }
    };

    const handleOmniPublish = async () => {
        if (!generatedResult || selectedPublishPlatforms.length === 0) return;
        setIsPublishing(true);
        impact('heavy');

        const results: { success: string[], fail: string[] } = { success: [], fail: [] };

        const hashtagsStr = generatedResult.hashtags?.map((t: string) => t.startsWith('#') ? t : `#${t}`).join(' ') || '';
        const fullContent = `${generatedResult.title}\n\n${generatedResult.body}\n\n${hashtagsStr}`;

        for (const platform of selectedPublishPlatforms) {
            try {
                await proService.publishContent(platform, fullContent, generatedResult.image_url, generatedResult.id);
                results.success.push(platform);
            } catch (error) {
                results.fail.push(platform);
            }
        }

        if (results.success.length > 0) {
            setPublishedPlatforms(prev => [...prev, ...results.success]);
            notification({
                title: t('pro_dashboard.notifications.success'),
                text: `Successfully published to: ${results.success.join(', ').toUpperCase()}`,
                type: 'success'
            });
        }

        if (results.fail.length > 0) {
            notification({
                title: t('pro_dashboard.notifications.publish_error'),
                text: `Failed to publish to: ${results.fail.join(', ').toUpperCase()}`,
                type: 'error'
            });
        }

        setIsPublishing(false);
        if (results.fail.length === 0) {
            setShowPublishModal(false);
        }
    };

    const togglePublishPlatform = (platform: 'x' | 'telegram' | 'linkedin') => {
        if (publishedPlatforms.includes(platform)) return;
        setSelectedPublishPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
        selection();
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
                                className={`w-8 h-8 rounded-2xl flex items-center justify-center text-[10px] font-black transition-all shadow-xl ${externalStep === s
                                    ? 'vibing-blue-animated text-white ring-4 ring-indigo-500/5'
                                    : externalStep > s
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-700 border border-slate-200 dark:border-white/10'
                                    }`}
                            >
                                {externalStep > s ? <CheckCircle2 size={14} /> : (
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
                                    <h4 className="text-[13px] sm:text-[15px] font-bold text-slate-900 dark:text-white leading-none mb-1.5">
                                        {t('pro_dashboard.studio.matrix_title')}
                                    </h4>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] font-medium text-slate-400 leading-none">
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
                                instruction={i18n.language === 'ru' ? 'Выберите стратегию для вашего поста.' : 'Select the strategy for your post.'}
                                value={postType}
                                onChange={(val) => setPostType(val)}
                                options={defaultPostTypes.map(pt => ({
                                    id: pt.id,
                                    label: i18n.language === 'ru' ? pt.ru : pt.en,
                                    description: i18n.language === 'ru' ? pt.desc_ru : pt.desc_en
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
                                instruction={i18n.language === 'ru' ? 'Выберите целевую аудиторию, к которой обращаетесь.' : 'Select the target audience you are addressing.'}
                                value={audience}
                                onChange={(val) => setAudience(val)}
                                options={defaultAudiences
                                    .filter(a => {
                                        const isPartnerStrategy = ['partners', 'partners_cards', 'partners_network'].includes(postType);
                                        const partnerAudiences = ['passive_seekers', 'growth_masters', 'automation_kings', 'empire_builders', 'partners'];

                                        if (isPartnerStrategy) {
                                            return partnerAudiences.includes(a.id);
                                        }
                                        return !partnerAudiences.includes(a.id);
                                    })
                                    .map(a => ({
                                        id: a.id,
                                        label: i18n.language === 'ru' ? a.ru : a.en,
                                        description: i18n.language === 'ru' ? a.desc_ru : a.desc_en
                                    }))}
                                placeholder={t('pro_dashboard.studio.target_placeholder')}
                                color="purple"
                                isOpen={openDropdown === 'audience'}
                                onToggle={() => handleToggle('audience')}
                                onClose={() => setOpenDropdown(null)}
                                indexStr="02"
                            />

                            {/* Partner Strategy Special Indicator */}
                            {postType === 'partners' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-5 rounded-3xl bg-linear-to-br from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 relative overflow-hidden group shadow-lg"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-700">
                                        <Zap size={60} className="text-indigo-500" />
                                    </div>
                                    <div className="flex items-start gap-4 relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-500/30 shrink-0">
                                            <Users size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1 flex items-center gap-2">
                                                {t('pro_dashboard.studio.partners_strategy.title')}
                                                <span className="px-1.5 py-0.5 bg-indigo-500 rounded text-[7px] text-white">
                                                    {t('pro_dashboard.studio.partners_strategy.mode')}
                                                </span>
                                            </h4>
                                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed pr-8">
                                                <Trans i18nKey="pro_dashboard.studio.partners_strategy.desc">
                                                    Using geometric growth protocols and specialized Web App referral links for <span className="text-indigo-500 font-bold">maximum geometric scaling</span>.
                                                </Trans>
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Personal Link Option - Visible for PRO/PRO+ */}
                            {status?.is_pro && postType !== 'partners' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-5 rounded-[2rem] bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 space-y-4 shadow-premium-sm relative overflow-hidden group/link"
                                >
                                    <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover/link:opacity-100 transition-opacity duration-500" />

                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 ${usePersonalLink ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                                                <LinkIcon size={16} />
                                            </div>
                                            <div>
                                                <h4 className="text-[12px] font-bold text-slate-900 dark:text-white">
                                                    {t('pro_dashboard.studio.add_personal_link')}
                                                </h4>
                                                <p className="text-[9px] font-medium text-slate-400 leading-tight mt-0.5">
                                                    {t('pro_dashboard.studio.personal_link_subtitle')}
                                                </p>
                                            </div>
                                        </div>

                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={usePersonalLink}
                                                onChange={(e) => {
                                                    setUsePersonalLink(e.target.checked);
                                                    if (e.target.checked && status.personal_referral_link) {
                                                        setPersonalLink(status.personal_referral_link);
                                                    }
                                                }}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 shadow-inner"></div>
                                        </label>
                                    </div>

                                    <AnimatePresence>
                                        {usePersonalLink && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                                animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                                className="overflow-hidden space-y-3 pt-1 border-t border-slate-100 dark:border-white/5"
                                            >
                                                <div className="relative group/input">
                                                    <input
                                                        type="text"
                                                        value={personalLink}
                                                        onChange={(e) => setPersonalLink(e.target.value)}
                                                        placeholder="https://t.me/pintopaybot?start=..."
                                                        className="w-full h-11 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-4 pr-24 text-[11px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400/50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-hidden transition-all shadow-inner"
                                                    />
                                                    <button
                                                        onClick={() => handleUpdatePersonalLink(personalLink)}
                                                        className="absolute right-1 top-1 bottom-1 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider disabled:opacity-30 transition-all active:scale-95 shadow-md"
                                                    >
                                                        {isUpdatingLink ? <Loader2 size={10} className="animate-spin" /> : t('common.save', 'Save')}
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-2 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                                                    <Info size={12} className="text-amber-500 shrink-0" />
                                                    <p className="text-[9px] font-medium text-slate-600 dark:text-slate-400 leading-tight">
                                                        {t('pro_dashboard.studio.personal_link_warning')} <span className="font-bold text-indigo-500 break-all">https://t.me/pintopaybot?start=...</span>
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}

                            {/* Tone of Voice */}
                            <PremiumSelect
                                label={t('pro_dashboard.studio.tone_label', 'Tone of Voice')}
                                instruction={i18n.language === 'ru' ? 'Настройте тон и эмоцию генерации.' : 'Adjust the tone and emotion of the generation.'}
                                value={tone}
                                onChange={(val) => setTone(val)}
                                options={defaultTones.map(t => ({
                                    id: t.id,
                                    label: i18n.language === 'ru' ? t.ru : t.en,
                                    description: i18n.language === 'ru' ? t.desc_ru : t.desc_en
                                }))}
                                placeholder={t('pro_dashboard.studio.tone_placeholder')}
                                color="amber"
                                isOpen={openDropdown === 'tone'}
                                onToggle={() => handleToggle('tone')}
                                onClose={() => setOpenDropdown(null)}
                                indexStr="03"
                            />

                            {/* Output Language */}
                            <PremiumSelect
                                label={t('pro_dashboard.studio.language_label')}
                                instruction={i18n.language === 'ru' ? 'Язык, на котором будет написан контент.' : 'The language in which the content will be written.'}
                                value={language}
                                onChange={(val) => setLanguage(val)}
                                options={defaultLanguages.map(l => ({
                                    id: l.id,
                                    label: l.label,
                                    description: l.description
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
                                className="w-full h-12 vibing-blue-animated rounded-xl font-black text-white text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale sm:hidden"
                            >
                                <Sparkles size={14} className="animate-pulse" />
                                {t('pro_dashboard.studio.initiate_btn')}
                                <ChevronRight size={14} />
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
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-3xl border border-slate-200 dark:border-white/10"
                >
                    <div className="circuit-decor opacity-10" />

                    <div className="relative p-8 sm:p-12 text-center space-y-8">
                        {isGenerating ? (
                            <div className="py-4 flex flex-col items-center justify-center space-y-8">
                                {/* Compact Premium Loader */}
                                <div className="relative w-28 h-28 flex items-center justify-center scanning-glow rounded-3xl">
                                    <div className="absolute inset-0 bg-indigo-500/5 backdrop-blur-3xl rounded-3xl border border-indigo-500/20" />
                                    <motion.div
                                        className="absolute inset-0 rounded-3xl border-2 border-indigo-500/30"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                    />
                                    <div className="relative z-10 w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center border border-indigo-500/20 pulse-ring-indigo">
                                        <Bot className="w-8 h-8 text-indigo-500" />
                                    </div>
                                </div>

                                <div className="space-y-4 w-full max-w-[280px]">
                                    <div className="text-center space-y-2">
                                        <div className="inline-flex items-center gap-2 bg-indigo-500/10 py-1.5 px-4 rounded-full border border-indigo-500/20">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500">
                                                SYNTHESIZING VIRAL CORE
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Compact Progress Bar */}
                                    <div className="bg-slate-50 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-premium-sm">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[32px] font-black text-slate-900 dark:text-white leading-none tabular-nums">
                                                    {Math.min(Math.floor(((30 - countdown) / 30) * 100), 99)}<span className="text-lg opacity-30">%</span>
                                                </span>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{countdown}s ETA</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden relative">
                                                <motion.div
                                                    className="absolute top-0 left-0 bottom-0 vibing-blue-animated"
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: `${Math.min(((30 - countdown) / 30) * 100, 99)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed opacity-60">
                                        Architecting narrative resonance...
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="relative inline-flex mb-2">
                                    <div className="absolute -inset-4 bg-indigo-500/10 blur-2xl rounded-full" />
                                    <div className="relative w-20 h-20 bg-linear-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-xl pulse-ring-indigo">
                                        <Sparkles className="w-9 h-9 text-indigo-500" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                        {t('pro_dashboard.studio.ready_title')}
                                    </h3>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500">
                                        {t('pro_dashboard.studio.ready_subtitle')}
                                    </p>
                                </div>

                                <p className="text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400 max-w-[280px] mx-auto">
                                    {t('pro_dashboard.studio.ready_p')}
                                </p>

                                <div className="flex flex-col gap-2.5 pt-4 w-full max-w-[260px] mx-auto">
                                    <button
                                        onClick={handleGenerate}
                                        className="h-12 vibing-blue-animated rounded-xl font-black text-white text-[10px] uppercase tracking-[0.15em] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20"
                                    >
                                        {t('pro_dashboard.studio.go_viral_btn')} <ArrowRight size={14} />
                                    </button>
                                    <button
                                        onClick={() => { selection(); setExternalStep(1); }}
                                        className="h-10 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                    >
                                        {t('pro_dashboard.studio.back_btn')}
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
                    <div className="glass-panel-premium rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-3xl overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl">
                        {/* Image Section */}
                        <div className="aspect-16/10 bg-slate-900 relative flex items-center justify-center overflow-hidden group/img scanning-glow">
                            <div className="circuit-decor opacity-20" />
                            <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/60 z-1" />
                            {generatedResult.image_url ? (
                                <img
                                    src={generatedResult.image_url.startsWith('http') ? generatedResult.image_url : `${getApiUrl().replace(/\/api$/, '')}${generatedResult.image_url}`}
                                    alt="Viral"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                                />
                            ) : (
                                <div className="p-8 text-center z-10">
                                    <div className="w-16 h-16 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                                        <ImageIcon className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-indigo-300 font-bold max-w-[200px] leading-relaxed">
                                        {generatedResult.image_prompt}
                                    </p>
                                </div>
                            )}

                            {/* Badge */}
                            <div className="absolute top-4 left-4 z-10">
                                <span className="bg-indigo-500/90 backdrop-blur-md text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border border-indigo-400/30 shadow-lg">
                                    {t('pro_dashboard.studio.ai_generated_badge')}
                                </span>
                            </div>

                            {/* Image Actions Overlay */}
                            <div className="absolute inset-x-0 bottom-0 z-10 opacity-0 group-hover/img:opacity-100 transition-all duration-300 bg-linear-to-t from-black/60 to-transparent p-4 translate-y-2 group-hover/img:translate-y-0">
                                <div className="flex items-center justify-end gap-2.5">
                                    <button
                                        onClick={() => { selection(); handleSaveImageToDevice(); }}
                                        className="p-2.5 bg-white/10 hover:bg-emerald-500 rounded-xl border border-white/20 text-white backdrop-blur-xl transition-all active:scale-90"
                                        title="Download"
                                    >
                                        <Download size={16} />
                                    </button>
                                    <button
                                        onClick={handleGenerate}
                                        className="p-2.5 bg-white/10 hover:bg-indigo-500 rounded-xl border border-white/20 text-white backdrop-blur-xl transition-all active:scale-90"
                                        title="Regenerate"
                                    >
                                        <RefreshCw size={16} className={isGenerating ? "animate-spin" : ""} />
                                    </button>
                                    {historyIndex > 0 && (
                                        <button
                                            onClick={handleUndoVersion}
                                            className="p-2.5 bg-white/10 hover:bg-amber-500 rounded-xl border border-white/20 text-white backdrop-blur-xl transition-all active:scale-90"
                                            title="Undo"
                                        >
                                            <Undo2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-5 sm:p-7 space-y-4">
                            <div className="space-y-1">
                                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
                                    {generatedResult.title}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Viral Synthesis Optimized</span>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-black/20 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/5 relative group/content overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 flex items-center gap-2 opacity-100 sm:opacity-0 group-hover/content:opacity-100 transition-opacity">
                                    <button
                                        onClick={handleGenerate}
                                        className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-white/10 text-slate-400 hover:text-indigo-500 transition-colors"
                                        title="Regenerate Text"
                                    >
                                        <RefreshCw size={12} className={isGenerating ? "animate-spin" : ""} />
                                    </button>
                                    <button
                                        onClick={handleCopyText}
                                        className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-white/10 text-slate-400 hover:text-indigo-500 transition-colors"
                                    >
                                        <Copy size={12} />
                                    </button>
                                </div>
                                <div className="text-[11px] sm:text-[12px] font-medium leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                                    {renderMarkdown(generatedResult.body)}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {generatedResult.hashtags?.map((tag: string, i: number) => (
                                    <span key={i} className="px-3 py-1 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                        #{tag.replace(/^#/, '')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="space-y-3 pb-4">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => { selection(); setShowPublishModal(true); }}
                                className="h-12 vibing-blue-animated rounded-xl font-black text-white text-[10px] uppercase tracking-[0.15em] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                            >
                                {t('pro_dashboard.studio.publish_btn')} <Send size={14} className="animate-pulse" />
                            </button>
                            <button
                                onClick={() => { impact('light'); setShowShareModal(true); }}
                                className="h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] text-slate-900 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                {t('pro_dashboard.studio.share_btn')} <Share size={14} />
                            </button>
                        </div>

                        <button
                            onClick={handleReset}
                            className="w-full h-11 bg-slate-100 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-500/50 transition-all flex items-center justify-center gap-2"
                        >
                            <Undo2 size={14} />
                            {t('pro_dashboard.studio.generate_new_btn', 'Generate New Post')}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Portals for Modals */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {showPublishModal && (
                        <motion.div
                            key="publish-modal"
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
                                        {(['x', 'telegram', 'linkedin'] as const).map((platform) => {
                                            const isSelected = selectedPublishPlatforms.includes(platform);
                                            const isPublished = publishedPlatforms.includes(platform);
                                            const isProPlus = status?.is_pro_plus;

                                            return (
                                                <button
                                                    key={platform}
                                                    onClick={() => isProPlus ? togglePublishPlatform(platform) : handlePublishToPlatform(platform)}
                                                    disabled={isPublishing || isPublished}
                                                    className={`w-full h-14 rounded-2xl border transition-all flex items-center justify-between px-4 group relative overflow-hidden ${isPublished
                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                                        : isSelected
                                                            ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400 shadow-inner'
                                                            : 'bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.98]'
                                                        }`}
                                                >
                                                    {isSelected && !isPublished && (
                                                        <motion.div
                                                            layoutId="selected-bg"
                                                            className="absolute inset-0 bg-indigo-500/5 pointer-events-none"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                        />
                                                    )}
                                                    <div className="flex items-center gap-3 relative z-10">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${isPublished ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : isSelected ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 group-hover:scale-110'
                                                            }`}>
                                                            {platform === 'x' ? <Network size={16} /> : platform === 'telegram' ? <Send size={16} className="-ml-0.5" /> : <Users size={16} />}
                                                        </div>
                                                        <div className="text-left min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="block text-[11px] font-black uppercase tracking-widest leading-none mb-1 truncate">
                                                                    {platform === 'x' ? 'Network X' : platform === 'telegram' ? 'Telegram' : 'LinkedIn'}
                                                                </span>
                                                                {!isProPlus && platform !== 'telegram' && (
                                                                    <Lock size={10} className="text-slate-400" />
                                                                )}
                                                            </div>
                                                            <span className="block text-[8px] font-black uppercase tracking-tighter opacity-60">
                                                                {isPublished ? t('pro_dashboard.publish.platform_success') : (isProPlus ? (isSelected ? 'SELECTED FOR OMNI-SYNC' : 'TAP TO SELECT') : t('pro_dashboard.publish.platform_tap'))}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="relative z-10">
                                                        {isPublished ? (
                                                            <CheckCircle2 size={18} className="text-emerald-500" />
                                                        ) : isProPlus ? (
                                                            <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-200 dark:border-white/10'}`}>
                                                                {isSelected && <CheckCircle2 size={12} className="text-white" />}
                                                            </div>
                                                        ) : (
                                                            <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {status?.is_pro_plus && selectedPublishPlatforms.length > 0 && !isPublishing && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="px-1 pt-2"
                                    >
                                        <button
                                            onClick={handleOmniPublish}
                                            className="w-full h-13 vibing-blue-animated rounded-2xl font-black text-white text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 group"
                                        >
                                            <Zap size={16} className="group-hover:scale-125 transition-transform" />
                                            OMNI-SYNC PUBLISH ({selectedPublishPlatforms.length})
                                        </button>
                                    </motion.div>
                                )}

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

                    {showShareModal && (
                        <motion.div
                            key="share-modal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl"
                            onClick={() => setShowShareModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white dark:bg-slate-900 w-full max-w-[340px] rounded-[1.5rem] p-5 space-y-4 relative border border-slate-200 dark:border-white/10 shadow-3xl mx-4 my-auto"
                            >
                                <button
                                    onClick={() => setShowShareModal(false)}
                                    className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors z-10"
                                >
                                    <X size={18} />
                                </button>

                                <div className="flex flex-col items-center text-center space-y-2 pt-2">
                                    <div className="w-12 h-12 bg-linear-to-br from-blue-500/10 to-indigo-500/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-lg">
                                        <Share size={20} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h3 className="text-[15px] font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                            {t('pro_dashboard.studio.share_modal.title')}
                                        </h3>
                                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-500">
                                            {t('pro_dashboard.studio.share_modal.subtitle')}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <button
                                        onClick={() => handleSharePlatform('telegram')}
                                        className="h-12 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/20 rounded-xl flex items-center justify-center gap-2 transition-all group active:scale-95"
                                    >
                                        <Send size={14} className="text-[#0088cc] -rotate-45 translate-x-0.5" />
                                        <span className="text-[10px] font-black uppercase text-[#0088cc]">Telegram</span>
                                    </button>
                                    <button
                                        onClick={() => handleSharePlatform('whatsapp')}
                                        className="h-12 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-xl flex items-center justify-center gap-2 transition-all group active:scale-95"
                                    >
                                        <div className="w-4 h-4 rounded-full bg-[#25D366] shrink-0" />
                                        <span className="text-[10px] font-black uppercase text-[#25D366]">WhatsApp</span>
                                    </button>
                                    <button
                                        onClick={() => handleSharePlatform('x')}
                                        className="h-12 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center gap-2 transition-all group active:scale-95"
                                    >
                                        <span className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-0.5">𝕏</span>
                                        <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white">Twitter</span>
                                    </button>
                                    <button
                                        onClick={handleSystemShare}
                                        disabled={isSharingSystem}
                                        className="h-12 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl flex items-center justify-center gap-2 transition-all group active:scale-95 disabled:opacity-50"
                                    >
                                        {isSharingSystem ? (
                                            <Loader2 size={14} className="text-indigo-500 animate-spin" />
                                        ) : (
                                            <Share size={14} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                                        )}
                                        <span className="text-[10px] font-black uppercase text-indigo-500">{t('pro_dashboard.studio.share_modal.more')}</span>
                                    </button>
                                </div>

                                <button
                                    onClick={() => setShowShareModal(false)}
                                    className="w-full mt-2 py-2.5 text-[8px] font-black uppercase tracking-[0.25em] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
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
