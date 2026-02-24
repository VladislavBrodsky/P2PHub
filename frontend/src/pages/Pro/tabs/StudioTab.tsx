import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, ChevronRight, Terminal, Bot, Send, Users, Image as ImageIcon,
    CheckCircle2, Loader2, Copy, Download, RefreshCw, Undo2, Share, ArrowLeft, ArrowRight, X,
    Zap, Link as LinkIcon, Info, Lock, Blocks
} from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { proService, PROStatus } from '../../../services/proService';
import { getApiUrl } from '../../../utils/api';
import { renderMarkdown, sanitizeAIGeneratedText } from '../utils/renderMarkdown';
import { postTypes as defaultPostTypes, audiences as defaultAudiences, languages as defaultLanguages, tones as defaultTones } from '../utils/constants';
import { socialLogos } from '../utils/socialLogos';
import { PremiumSelect } from '../components/PremiumSelect';
import { applyGlitchOverlay } from '../../../utils/glitchImageOverlay';

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
    const { t, i18n } = useTranslation(['pro', 'common']);
    const [postType, setPostType] = useState('');
    const [audience, setAudience] = useState('');
    const [language, setLanguage] = useState(() => {
        const langMap: Record<string, string> = {
            'ru': 'Russian',
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German'
        };
        return langMap[i18n.language.split('-')[0]] || 'English';
    });
    const [tone, setTone] = useState('authoritative');
    const [isGenerating, setIsGenerating] = useState(false);
    const [countdown, setCountdown] = useState(30);

    // Publishing State
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishedPlatforms, setPublishedPlatforms] = useState<string[]>([]);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isSharingSystem, setIsSharingSystem] = useState(false);
    const [selectedPublishPlatforms, setSelectedPublishPlatforms] = useState<('x' | 'telegram' | 'linkedin' | 'threads' | 'pinterest' | 'facebook' | 'discord')[]>([]);
    const [selectedTgChannel, setSelectedTgChannel] = useState<string>(''); // for multi-channel TG select
    const [isRegeneratingHashtags, setIsRegeneratingHashtags] = useState(false);

    // Personal Link State
    const [usePersonalLink, setUsePersonalLink] = useState(false);
    const [personalLink, setPersonalLink] = useState(status?.personal_referral_link || '');
    const [isUpdatingLink, setIsUpdatingLink] = useState(false);

    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    // Glitch image overlay state
    const [glitchImageSrc, setGlitchImageSrc] = useState<string | null>(null);
    const [isApplyingGlitch, setIsApplyingGlitch] = useState(false);
    // Track which result the glitch was built for (avoid redundant work)
    const glitchResultId = useRef<string | null>(null);

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

    // --- Glitch overlay effect ---
    // Runs whenever a new result arrives with an image_url & title.
    useEffect(() => {
        if (!generatedResult?.image_url || !generatedResult?.title) {
            setGlitchImageSrc(null);
            return;
        }
        // Avoid reprocessing the same result
        const resultId = `${generatedResult.id ?? ''}_${generatedResult.image_url}`;
        if (glitchResultId.current === resultId) return;
        glitchResultId.current = resultId;

        let cancelled = false;
        setIsApplyingGlitch(true);
        const baseUrl = getApiUrl().replace(/\/api\/?$/, '');

        applyGlitchOverlay({
            text: generatedResult.title,
            imageUrl: generatedResult.image_url,
            baseUrl,
            fontSizeFraction: 0.06,
            glitchPasses: 3,
            minReadableRatio: 0.015,
        })
            .then((src) => {
                if (!cancelled) setGlitchImageSrc(src);
            })
            .catch(() => {
                if (!cancelled) setGlitchImageSrc(generatedResult.image_url);
            })
            .finally(() => {
                if (!cancelled) setIsApplyingGlitch(false);
            });

        return () => { cancelled = true; };
    }, [generatedResult]);


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

    // --- Publishing State Management ---
    // Reset status if content is regenerated (text/photo)
    useEffect(() => {
        setPublishedPlatforms([]);
    }, [generatedResult]);

    // Auto-refresh publish buttons after 10s of a successful post
    useEffect(() => {
        if (publishedPlatforms.length > 0) {
            const timer = setTimeout(() => {
                setPublishedPlatforms([]);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [publishedPlatforms]);

    const handleGenerate = useCallback(async () => {
        if (!postType || !audience) {
            notification({ title: 'Error', text: 'Select strategy and target', type: 'error' });
            return;
        }

        setIsGenerating(true);
        impact('heavy');

        // Reset previous result state for clean stream
        setGeneratedResult({
            id: null,
            title: '',
            body: '',
            hashtags: [],
            image_prompt: '',
            image_url: null,
            tokens_remaining: status?.pro_tokens || 0
        });

        try {
            // Include referral link if active and valid
            let finalLink: string | undefined = undefined;
            if (usePersonalLink && personalLink) {
                if (personalLink.startsWith('https://t.me/pintopaybot?start=') || personalLink.startsWith('t.me/pintopaybot?start=')) {
                    finalLink = personalLink;
                } else {
                    notification({ title: t('common:error') || 'Invalid Link', text: "Link must start with 'https://t.me/pintopaybot?start='", type: 'error' });
                    setIsGenerating(false);
                    return;
                }
            }

            await proService.generateContentStream(
                postType,
                audience,
                language,
                (event) => {
                    if (event.type === 'meta') {
                        if (event.tokens_remaining !== undefined) {
                            setStatus(status ? { ...status, pro_tokens: event.tokens_remaining } : null);
                        }
                    } else if (event.type === 'title') {
                        setGeneratedResult((prev: any) => ({ ...prev, title: event.content }));
                    } else if (event.type === 'body_chunk') {
                        setGeneratedResult((prev: any) => ({
                            ...prev,
                            body: (prev?.body || '') + event.content
                        }));
                    } else if (event.type === 'hashtags') {
                        setGeneratedResult((prev: any) => ({ ...prev, hashtags: event.content }));
                    } else if (event.type === 'image') {
                        setGeneratedResult((prev: any) => ({ ...prev, image_url: event.content }));
                        impact('medium');
                    } else if (event.type === 'done') {
                        const final = event.content;
                        setGeneratedResult((prev: any) => {
                            const updated = { ...prev, ...final, status: 'success' };
                            // Manage History only when done
                            const newHistory = [...history.slice(0, historyIndex + 1), updated];
                            setHistory(newHistory);
                            setHistoryIndex(newHistory.length - 1);
                            return updated;
                        });
                        setExternalStep(3);
                        notification({
                            title: t('pro_dashboard.notifications.success'),
                            text: t('pro_dashboard.notifications.viral_synthesized'),
                            type: 'success'
                        });
                    } else if (event.type === 'error') {
                        throw new Error(event.content);
                    }
                },
                tone,
                finalLink
            );

        } catch (error: any) {
            console.error('❌ Viral content generation failed:', error);

            // Extract detailed error message
            let errorTitle = t('pro_dashboard.notifications.error');
            let errorMessage = t('pro_dashboard.notifications.gen_failed');

            if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            } else if (error.response?.status === 402) {
                errorTitle = t('pro_dashboard.notifications.tokens_required');
                errorMessage = t('pro_dashboard.notifications.tokens_required_text');
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
    }, [postType, audience, language, tone, usePersonalLink, personalLink, history, historyIndex, status, t, notification, impact, setHistory, setHistoryIndex, setGeneratedResult, setStatus, setExternalStep]);

    const handleRegenerateHashtags = async () => {
        if (!generatedResult || isRegeneratingHashtags) return;
        setIsRegeneratingHashtags(true);
        impact('light');
        try {
            const res = await proService.regenerateHashtags(postType, audience, language, tone);
            const updatedResult = { ...generatedResult, hashtags: res.hashtags };
            setGeneratedResult(updatedResult);

            // Update history too
            if (historyIndex >= 0) {
                const newHistory = [...history];
                newHistory[historyIndex] = updatedResult;
                setHistory(newHistory);
            }

            notification({
                title: t('pro_dashboard.notifications.success'),
                text: t('pro_dashboard.studio.hashtags_refreshed', 'Viral hashtags optimized'),
                type: 'success'
            });
        } catch (error) {
            notification({ title: 'Error', text: 'Hashtag refresh failed', type: 'error' });
        } finally {
            setIsRegeneratingHashtags(false);
        }
    };

    const handleUpdatePersonalLink = async (link: string) => {
        if (!status?.is_pro) return;
        setIsUpdatingLink(true);
        try {
            await proService.updateReferralLink(link);
            setStatus({ ...status, personal_referral_link: link });
            notification({
                title: t('common:success'),
                text: t('pro_dashboard.studio.link_saved', 'Referral link updated successfully'),
                type: 'success'
            });
        } catch (error: any) {
            notification({
                title: t('common:error'),
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

    // Strip all markdown syntax for platforms that don't support it (X, WhatsApp, etc)
    const stripMarkdownForPlainText = (text: string): string => {
        return text
            // Remove **bold** and __bold__
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/__(.*?)__/g, '$1')
            // Remove *italic* and _italic_
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/_(.*?)_/g, '$1')
            // Remove headers (#, ##, ###)
            .replace(/^#{1,3}\s+/gm, '')
            // Remove [CTA:text](url) patterns to just url
            .replace(/\[CTA:\s*(.*?)\]\s*\([^)]+\)/g, '$1')
            // Clean up any double spaces or trailing spaces per line
            .replace(/[ \t]{2,}/g, ' ')
            .trim();
    };

    const getCleanShareText = (platform?: 'x' | 'telegram' | 'whatsapp' | 'linkedin' | 'pinterest' | 'threads' | 'facebook' | 'discord') => {
        if (!generatedResult) return '';

        const sanitizedBody = sanitizeAIGeneratedText(generatedResult.body);

        // Convert Markdown links [text](url)
        const cleanBody = sanitizedBody.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
            const cleanText = text.replace(/^CTA:\s*/i, '');

            if (platform === 'telegram') {
                // Telegram supports Markdown links
                return `[${cleanText}](${url})`;
            }

            // X and others get plain text "text: url"
            if (cleanText.toLowerCase() === 'here' || cleanText.toLowerCase() === 'link') return url;
            return `${cleanText}: ${url}`;
        });

        // Strip all markdown for platforms that render it literally (X, WhatsApp, etc)
        const finalBody = (platform !== 'telegram') ? stripMarkdownForPlainText(cleanBody) : cleanBody;

        const hashtagsStr = generatedResult.hashtags?.map((t: string) => t.startsWith('#') ? t : `#${t}`).join(' ') || '';

        let text = `${generatedResult.title}\n\n${finalBody}`;

        // Append viral hashtags and existing ones
        const viralHashtags = ['#1Dollar1Minute', '#PassiveIncome', '#FinancialFreedom', '#P2PHub'];
        let finalHashtags = hashtagsStr;

        viralHashtags.forEach(tag => {
            if (!finalHashtags.includes(tag.replace('#', ''))) {
                finalHashtags += ` ${tag}`;
            }
        });

        if (finalHashtags.trim()) {
            text += `\n\n${finalHashtags.trim()}`;
        }

        // Ensure #PintopayPRO tag
        if (!text.includes('PintopayPRO')) text += ' #PintopayPRO';

        return text;
    };

    const handleCopyText = () => {
        const text = getCleanShareText('x');
        if (!text) return;

        navigator.clipboard.writeText(text);
        notification({ title: t('pro_dashboard.notifications.copied'), text: t('pro_dashboard.notifications.text_copied'), type: 'success' });
    };

    const handleSystemShare = async () => {
        if (!generatedResult) return;
        setIsSharingSystem(true);
        impact('light');
        const textToShare = getCleanShareText('telegram');
        const shareData: ShareData = {
            title: generatedResult.title,
            text: textToShare,
        };

        if (glitchImageSrc || generatedResult.image_url) {
            try {
                let file: File | null = null;

                if (glitchImageSrc && glitchImageSrc.startsWith('data:')) {
                    // Convert data-URL to File for sharing
                    const res = await fetch(glitchImageSrc);
                    const blob = await res.blob();
                    file = new File([blob], 'viral_post.jpg', { type: 'image/jpeg' });
                } else if (generatedResult.image_url) {
                    let finalUrl = generatedResult.image_url;
                    if (!finalUrl.startsWith('http')) {
                        const baseUrl = getApiUrl().replace(/\/api\/?$/, '');
                        finalUrl = `${baseUrl}${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
                    }
                    finalUrl = finalUrl.replace(/\/api\/images/, '/images');

                    const response = await fetch(finalUrl);
                    const blob = await response.blob();
                    file = new File([blob], 'viral_post.png', { type: blob.type });
                }

                if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
                    shareData.files = [file];
                }
            } catch (error) {
                console.error('Failed to prepare image for sharing', error);
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
        const textToShare = getCleanShareText(platform);
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

        // If we have a glitch-composited data URL, download it directly (no fetch needed)
        if (glitchImageSrc && glitchImageSrc.startsWith('data:')) {
            const link = document.createElement('a');
            link.href = glitchImageSrc;
            link.download = `viral_p2p_${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            notification({ title: t('pro_dashboard.notifications.image_saved'), text: t('pro_dashboard.notifications.image_saved_text'), type: 'success' });
            return;
        }

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

    const handlePublishToPlatform = async (platform: 'x' | 'telegram' | 'linkedin' | 'threads' | 'pinterest' | 'facebook' | 'discord') => {
        if (!generatedResult) return;
        setIsPublishing(true);
        impact('heavy');
        try {
            const fullContent = getCleanShareText(platform);
            // Pass specific TG channel if user chose one
            const channelOverride = platform === 'telegram' && selectedTgChannel ? selectedTgChannel : undefined;
            await proService.publishContent(platform, fullContent, generatedResult.image_url, generatedResult.id, channelOverride);
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
        const fullContent = getCleanShareText('telegram');

        for (const platform of selectedPublishPlatforms) {
            try {
                const channelOverride = platform === 'telegram' && selectedTgChannel ? selectedTgChannel : undefined;
                await proService.publishContent(platform, fullContent, generatedResult.image_url, generatedResult.id, channelOverride);
                results.success.push(platform);
            } catch (error) {
                results.fail.push(platform);
            }
        }

        if (results.success.length > 0) {
            setPublishedPlatforms(prev => [...prev, ...results.success]);
            notification({
                title: t('pro_dashboard.notifications.success'),
                text: `Synced to: ${results.success.join(', ').toUpperCase()}`,
                type: 'success'
            });
        }

        if (results.fail.length > 0) {
            notification({
                title: t('pro_dashboard.notifications.publish_error'),
                text: `Failed: ${results.fail.join(', ').toUpperCase()}`,
                type: 'error'
            });
        }

        setIsPublishing(false);
        if (results.fail.length === 0) {
            setShowPublishModal(false);
        }
    };

    const togglePublishPlatform = (platform: 'x' | 'telegram' | 'linkedin' | 'threads' | 'pinterest' | 'facebook' | 'discord') => {
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
                            className="h-full vibing-crystal-purple-animated shadow-[0_0_15px_rgba(168,85,247,0.5)]"
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
                                className={`w-7 h-7 rounded-xl flex items-center justify-center text-label font-bold transition-all shadow-xl ${externalStep === s
                                    ? 'vibing-crystal-purple-animated text-white ring-4 ring-purple-500/5'
                                    : externalStep > s
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-700 border border-slate-200 dark:border-white/10'
                                    }`}
                            >
                                {externalStep > s ? <CheckCircle2 size={13} /> : (
                                    <span className={externalStep === s ? 'animate-pulse' : ''}>{s}</span>
                                )}
                            </motion.div>
                            <span className={`text-label font-bold uppercase tracking-[0.2em] mt-1.5 transition-colors duration-500 ${externalStep === s ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-700'
                                }`}>
                                {s === 1 ? t('pro_dashboard.studio.stepper.frame') : s === 2 ? t('pro_dashboard.studio.stepper.synthes') : t('pro_dashboard.studio.stepper.deploy')}
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
                    <div className="pro-card-extreme bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-white/10 shadow-3xl relative overflow-hidden group noise-overlay">
                        <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-transparent to-purple-500/20 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full -mr-32 -mt-32 animate-pulse" />

                        <div className="flex items-center justify-between mb-4 sm:mb-5 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl vibing-crystal-purple-animated flex items-center justify-center shrink-0 shadow-xl shadow-purple-500/20">
                                    <Terminal size={16} className="text-white" />
                                </div>
                                <div>
                                    <h4 className="text-label sm:text-caption font-bold text-slate-900 dark:text-white leading-none mb-1">
                                        {t('pro_dashboard.studio.matrix_title')}
                                    </h4>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-label font-medium text-slate-400 leading-none">
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
                                instruction={t('pro_dashboard.studio.strategy_instruction')}
                                value={postType}
                                onChange={(val) => setPostType(val)}
                                options={defaultPostTypes.map(pt => ({
                                    id: pt.id,
                                    label: t(`pro_dashboard.studio.post_types.${pt.id}`),
                                    description: t(`pro_dashboard.studio.post_types_desc.${pt.id}`)
                                }))}
                                placeholder={t('pro_dashboard.studio.strategy_placeholder')}
                                color="purple"
                                isOpen={openDropdown === 'strategy'}
                                onToggle={() => handleToggle('strategy')}
                                onClose={() => setOpenDropdown(null)}
                                indexStr="01"
                            />

                            {/* Target Audience */}
                            <PremiumSelect
                                label={t('pro_dashboard.studio.target_label')}
                                instruction={t('pro_dashboard.studio.target_instruction')}
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
                                        label: t(`pro_dashboard.studio.audiences.${a.id}`),
                                        description: t(`pro_dashboard.studio.audiences_desc.${a.id}`)
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
                                    className="p-5 rounded-3xl bg-linear-to-br from-purple-500/10 via-purple-500/10 to-transparent border border-purple-500/20 relative overflow-hidden group shadow-lg"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-700">
                                        <Zap size={60} className="text-purple-500" />
                                    </div>
                                    <div className="flex items-start gap-4 relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center shadow-xl shadow-purple-500/30 shrink-0">
                                            <Users size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-caption font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-1 flex items-center gap-2">
                                                {t('pro_dashboard.studio.partners_strategy.title')}
                                                <span className="px-1.5 py-0.5 bg-purple-500 rounded text-label text-white">
                                                    {t('pro_dashboard.studio.partners_strategy.mode')}
                                                </span>
                                            </h4>
                                            <p className="text-label font-medium text-slate-500 dark:text-slate-400 leading-relaxed pr-8">
                                                <Trans i18nKey="pro_dashboard.studio.partners_strategy.desc">
                                                    Using geometric growth protocols and specialized Web App referral links for <span className="text-purple-500 font-bold">maximum geometric scaling</span>.
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
                                    className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 space-y-4 shadow-premium-sm relative overflow-hidden group/link"
                                >
                                    <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover/link:opacity-100 transition-opacity duration-500" />

                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 ${usePersonalLink ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                                                <LinkIcon size={16} />
                                            </div>
                                            <div>
                                                <h4 className="text-caption font-bold text-slate-900 dark:text-white">
                                                    {t('pro_dashboard.studio.add_personal_link')}
                                                </h4>
                                                <p className="text-label font-medium text-slate-400 leading-tight mt-0.5">
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
                                            <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500 shadow-inner"></div>
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
                                                        className="w-full h-9 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg pl-3 pr-20 text-label font-medium text-slate-900 dark:text-white placeholder:text-slate-400/50 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/5 outline-hidden transition-all shadow-inner"
                                                    />
                                                    <button
                                                        onClick={() => handleUpdatePersonalLink(personalLink)}
                                                        className="absolute right-1 top-1 bottom-1 px-3 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-label font-bold uppercase tracking-wider disabled:opacity-30 transition-all active:scale-95 shadow-md"
                                                    >
                                                        {isUpdatingLink ? <Loader2 size={10} className="animate-spin" /> : t('common:save', 'Save')}
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-2 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                                                    <Info size={12} className="text-amber-500 shrink-0" />
                                                    <p className="text-label font-medium text-slate-600 dark:text-slate-400 leading-tight">
                                                        {t('pro_dashboard.studio.personal_link_warning')} <span className="font-bold text-purple-500 break-all">https://t.me/pintopaybot?start=...</span>
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
                                instruction={t('pro_dashboard.studio.tone_instruction')}
                                value={tone}
                                onChange={(val) => setTone(val)}
                                options={defaultTones.map(toneObj => ({
                                    id: toneObj.id,
                                    label: t(`pro_dashboard.studio.tones.${toneObj.id}`),
                                    description: t(`pro_dashboard.studio.tones_desc.${toneObj.id}`)
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
                                instruction={t('pro_dashboard.studio.language_instruction')}
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
                                className="w-full h-11 vibing-crystal-purple-animated rounded-xl font-bold text-white text-label uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale sm:hidden"
                            >
                                <Sparkles size={16} className="animate-pulse" />
                                {t('pro_dashboard.studio.initiate_btn')}
                                <ChevronRight size={16} />
                            </button>

                            <p className="text-label font-bold text-slate-400 text-center mt-4 uppercase tracking-widest opacity-40">
                                POWERED BY <a href="https://t.me/web3adopters" target="_blank" rel="noopener noreferrer" className="hover:text-purple-500 transition-colors">@web3adopters</a>
                            </p>

                        </div>
                    </div>
                </motion.div>
            )}

            {externalStep === 2 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-3xl border border-slate-200 dark:border-white/10"
                >
                    <div className="circuit-decor opacity-10" />

                    <div className="relative p-6 sm:p-10 text-center space-y-6">
                        {isGenerating ? (
                            <div className="py-4 flex flex-col items-center justify-center space-y-8">
                                {/* Compact Premium Loader */}
                                <div className="relative w-28 h-28 flex items-center justify-center scanning-glow rounded-3xl">
                                    <div className="absolute inset-0 bg-purple-500/5 backdrop-blur-3xl rounded-3xl border border-purple-500/20" />
                                    <motion.div
                                        className="absolute inset-0 rounded-3xl border-2 border-purple-500/30"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                    />
                                    <div className="relative z-10 w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center border border-purple-500/20 pulse-ring-purple">
                                        <Bot className="w-8 h-8 text-purple-500" />
                                    </div>
                                </div>

                                <div className="space-y-4 w-full max-w-[280px]">
                                    <div className="text-center space-y-2">
                                        <div className="inline-flex items-center gap-2 bg-purple-500/10 py-1.5 px-4 rounded-full border border-purple-500/20">
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                            <h3 className="text-label font-bold uppercase tracking-[0.2em] text-purple-500">
                                                {t('pro_dashboard.studio.processing_viral')}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Compact Progress Bar */}
                                    <div className="bg-slate-50 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-premium-sm">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[28px] font-bold text-slate-900 dark:text-white leading-none tabular-nums">
                                                    {Math.min(Math.floor(((30 - countdown) / 30) * 100), 99)}<span className="text-base opacity-30">%</span>
                                                </span>
                                                <span className="text-label font-bold text-slate-400 uppercase tracking-widest">{t('pro_dashboard.studio.processing_eta', { count: countdown })}</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden relative">
                                                <motion.div
                                                    className="absolute top-0 left-0 bottom-0 vibing-crystal-purple-animated"
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: `${Math.min(((30 - countdown) / 30) * 100, 99)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-label font-bold text-slate-400 uppercase tracking-widest leading-relaxed opacity-60">
                                        {t('pro_dashboard.studio.processing_msg')}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="relative inline-flex mb-2">
                                    <div className="absolute -inset-4 bg-purple-500/10 blur-2xl rounded-full" />
                                    <div className="relative w-20 h-20 bg-linear-to-br from-purple-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-xl pulse-ring-purple">
                                        <Sparkles className="w-9 h-9 text-purple-500" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <h3 className="text-xl font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                                        {t('pro_dashboard.studio.ready_title')}
                                    </h3>
                                    <p className="text-label font-bold uppercase tracking-[0.2em] text-purple-500">
                                        {t('pro_dashboard.studio.ready_subtitle')}
                                    </p>
                                </div>

                                <p className="text-label font-medium leading-relaxed text-slate-500 dark:text-slate-400 max-w-[280px] mx-auto">
                                    {t('pro_dashboard.studio.ready_p')}
                                </p>

                                <div className="flex flex-col gap-2.5 pt-4 w-full max-w-[260px] mx-auto">
                                    <button
                                        onClick={handleGenerate}
                                        className="h-12 vibing-crystal-purple-animated rounded-xl font-bold text-white text-label uppercase tracking-[0.15em] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-purple-500/20"
                                    >
                                        {t('pro_dashboard.studio.go_viral_btn')} <ArrowRight size={14} />
                                    </button>
                                    <button
                                        onClick={() => { selection(); setExternalStep(1); }}
                                        className="h-10 text-label font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                    >
                                        {t('pro_dashboard.studio.back_btn')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            )
            }

            {
                externalStep === 3 && generatedResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="glass-panel-premium rounded-xl border border-slate-200 dark:border-white/10 shadow-3xl overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl">
                            {/* Image Section */}
                            <div className="aspect-16/10 bg-slate-900 relative flex items-center justify-center overflow-hidden group/img scanning-glow">
                                <div className="circuit-decor opacity-20" />
                                <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/60 z-1" />
                                {generatedResult.image_url ? (
                                    <>
                                        <img
                                            src={
                                                glitchImageSrc
                                                    ? (glitchImageSrc.startsWith('http') || glitchImageSrc.startsWith('data:')
                                                        ? glitchImageSrc
                                                        : `${getApiUrl().replace(/\/api$/, '')}${glitchImageSrc}`)
                                                    : (generatedResult.image_url.startsWith('http')
                                                        ? generatedResult.image_url
                                                        : `${getApiUrl().replace(/\/api$/, '')}${generatedResult.image_url}`)
                                            }
                                            alt="Viral"
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                                        />
                                        {/* Glitch processing indicator */}
                                        {isApplyingGlitch && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-purple-500/30 flex items-center justify-center">
                                                        <Sparkles size={16} className="text-purple-400 animate-pulse" />
                                                    </div>
                                                    <span className="text-label font-bold uppercase tracking-widest text-white/70 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                                        Rendering
                                                    </span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </>
                                ) : (
                                    <div className="p-8 text-center z-10">
                                        <div className="w-16 h-16 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                                            <ImageIcon className="w-8 h-8 text-purple-400" />
                                        </div>
                                        <p className="text-label uppercase tracking-[0.2em] text-purple-300 font-bold max-w-[200px] leading-relaxed">
                                            {generatedResult.image_prompt}
                                        </p>
                                    </div>
                                )}

                                {/* Badge */}
                                <div className="absolute top-4 left-4 z-10">
                                    <span className="bg-purple-500/90 backdrop-blur-md text-white text-label font-bold px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border border-purple-400/30 shadow-lg">
                                        {t('pro_dashboard.studio.ai_generated_badge')}
                                    </span>
                                </div>

                                {/* Image Actions Overlay */}
                                <div className="absolute inset-x-0 bottom-0 z-10 opacity-100 lg:opacity-0 lg:group-hover/img:opacity-100 transition-all duration-300 bg-linear-to-t from-black/60 to-transparent p-4 translate-y-0 lg:translate-y-2 lg:group-hover/img:translate-y-0">
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
                                            className="p-2.5 bg-white/10 hover:bg-purple-500 rounded-xl border border-white/20 text-white backdrop-blur-xl transition-all active:scale-90"
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
                                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
                                        {generatedResult.title}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                        <span className="text-label font-bold text-slate-400 uppercase tracking-[0.2em]">Viral Synthesis Optimized</span>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-black/20 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/5 relative group/content overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 flex items-center gap-2 opacity-100 sm:opacity-0 group-hover/content:opacity-100 transition-opacity">
                                        <button
                                            onClick={handleGenerate}
                                            className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-white/10 text-slate-400 hover:text-purple-500 transition-colors"
                                            title="Regenerate Text"
                                        >
                                            <RefreshCw size={12} className={isGenerating ? "animate-spin" : ""} />
                                        </button>
                                        <button
                                            onClick={handleCopyText}
                                            className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-white/10 text-slate-400 hover:text-purple-500 transition-colors"
                                        >
                                            <Copy size={12} />
                                        </button>
                                    </div>
                                    <div className="text-label sm:text-caption font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                                        {renderMarkdown(generatedResult.body)}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex flex-wrap gap-2">
                                        {generatedResult.hashtags?.map((tag: string, i: number) => (
                                            <span key={i} className="px-3 py-1 rounded-full bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/10 text-label font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                                                #{tag.replace(/^#/, '')}
                                            </span>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => { selection(); handleRegenerateHashtags(); }}
                                        disabled={isRegeneratingHashtags}
                                        className="shrink-0 p-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-purple-500 transition-all active:scale-90"
                                        title="Regenerate Hashtags"
                                    >
                                        <RefreshCw size={12} className={isRegeneratingHashtags ? "animate-spin" : ""} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Action Area */}
                        <div className="space-y-3 pb-4 relative">
                            {status?.is_pro_plus && (
                                <div className="flex justify-center mb-4">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-[0.2em] flex items-center gap-1.5 shadow-lg z-10 border border-white/20 whitespace-nowrap"
                                    >
                                        <Blocks size={10} /> {t('pro_dashboard.studio.omni_enabled')}
                                    </motion.div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => { selection(); setShowPublishModal(true); }}
                                    className="h-10 vibing-crystal-purple-animated rounded-xl font-bold text-white text-label uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                                >
                                    {t('pro_dashboard.studio.publish_btn')} <Send size={13} className="animate-pulse" />
                                </button>
                                <button
                                    onClick={() => { impact('light'); setShowShareModal(true); }}
                                    className="h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-label uppercase tracking-widest text-slate-900 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    {t('pro_dashboard.studio.share_btn')} <Share size={13} />
                                </button>
                            </div>

                            <button
                                onClick={handleReset}
                                className="w-full h-11 bg-slate-100 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 rounded-xl font-bold text-label uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-purple-500 dark:hover:text-purple-400 hover:border-purple-500/50 transition-all flex items-center justify-center gap-2"
                            >
                                <Undo2 size={14} />
                                {t('pro_dashboard.studio.generate_new_btn', 'Generate New Post')}
                            </button>

                            <p className="text-label font-bold text-slate-400 text-center mt-6 uppercase tracking-widest opacity-40">
                                POWERED BY <a href="https://t.me/web3adopters" target="_blank" rel="noopener noreferrer" className="hover:text-purple-500 transition-colors">@web3adopters</a>
                            </p>
                        </div>
                    </motion.div>
                )
            }

            {/* Portals for Modals */}
            {
                typeof document !== 'undefined' && createPortal(
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
                                    className="bg-white dark:bg-slate-900 w-full max-w-[340px] rounded-xl p-5 space-y-3 relative border border-slate-200 dark:border-white/10 shadow-3xl mx-4 my-auto"
                                >
                                    <button
                                        onClick={() => setShowPublishModal(false)}
                                        className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors z-10"
                                    >
                                        <X size={18} />
                                    </button>

                                    <div className="flex flex-col items-center text-center space-y-2 pt-1">
                                        <div className="w-12 h-12 bg-linear-to-br from-purple-500/10 to-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 border border-purple-500/20 shadow-lg">
                                            <Send size={20} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <h3 className="text-body font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                                                {t('pro_dashboard.publish.title')}
                                            </h3>
                                            <p className="text-label font-bold uppercase tracking-[0.15em] text-purple-500">
                                                {t('pro_dashboard.publish.subtitle')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <p className="text-label font-medium text-slate-500 dark:text-slate-400 text-center leading-relaxed px-1">
                                            {t('pro_dashboard.publish.mgmt_p')}
                                        </p>

                                        <div className="grid gap-2">
                                            {(status?.is_pro_plus
                                                ? (['x', 'telegram', 'linkedin', 'threads', 'pinterest', 'facebook', 'discord'] as const)
                                                : (['x', 'telegram', 'linkedin'] as const)
                                            ).map((platform) => {
                                                const isSelected = selectedPublishPlatforms.includes(platform as any);
                                                const isPublished = publishedPlatforms.includes(platform);
                                                const isProPlus = status?.is_pro_plus;

                                                const getIcon = () => {
                                                    const iconClass = "w-full h-full object-contain p-1.5";
                                                    switch (platform) {
                                                        case 'x': return <img src={socialLogos.x} className={iconClass + " dark:invert"} alt="X" />;
                                                        case 'telegram': return <img src={socialLogos.telegram} className={iconClass} alt="Telegram" />;
                                                        case 'linkedin': return <img src={socialLogos.linkedin} className={iconClass} alt="LinkedIn" />;
                                                        case 'threads': return <img src={socialLogos.threads} className={iconClass + " dark:invert"} alt="Threads" />;
                                                        case 'pinterest': return <img src={socialLogos.pinterest} className={iconClass} alt="Pinterest" />;
                                                        case 'facebook': return <img src={socialLogos.facebook} className={iconClass} alt="Facebook" />;
                                                        case 'discord': return <img src={socialLogos.discord} className={iconClass} alt="Discord" />;
                                                        default: return <Blocks size={16} />;
                                                    }
                                                };

                                                const getLabel = () => {
                                                    switch (platform) {
                                                        case 'x': return 'Network X';
                                                        case 'telegram': return 'Telegram';
                                                        case 'linkedin': return 'LinkedIn';
                                                        case 'threads': return t('pro_dashboard.setup.tg_sync_multi.more_platforms_t');
                                                        case 'pinterest': return t('pro_dashboard.setup.tg_sync_multi.more_platforms_p');
                                                        case 'facebook': return 'Facebook';
                                                        case 'discord': return 'Discord';
                                                        default: return (platform as string).toUpperCase();
                                                    }
                                                };

                                                return (
                                                    <button
                                                        key={platform}
                                                        onClick={() => isProPlus ? togglePublishPlatform(platform as any) : handlePublishToPlatform(platform as any)}
                                                        disabled={isPublishing || isPublished}
                                                        className={`w-full h-12 rounded-xl border transition-all flex items-center justify-between px-4 group relative overflow-hidden ${isPublished
                                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                                            : isSelected
                                                                ? 'bg-purple-500/10 border-purple-500/40 text-purple-600 dark:text-purple-400 shadow-inner'
                                                                : 'bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.98]'
                                                            }`}
                                                    >
                                                        {isSelected && !isPublished && (
                                                            <motion.div
                                                                layoutId="selected-bg"
                                                                className="absolute inset-0 bg-purple-500/5 pointer-events-none"
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                            />
                                                        )}
                                                        <div className="flex items-center gap-3 relative z-10">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${isPublished ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : isSelected ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 group-hover:scale-110'
                                                                }`}>
                                                                {getIcon()}
                                                            </div>
                                                            <div className="text-left min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="block text-label font-bold uppercase tracking-widest leading-none mb-1 truncate">
                                                                        {getLabel()}
                                                                    </span>
                                                                    {!isProPlus && platform !== 'telegram' && (
                                                                        <Lock size={10} className="text-slate-400" />
                                                                    )}
                                                                </div>
                                                                <span className="block text-label font-bold uppercase tracking-tighter opacity-60">
                                                                    {isPublished ? t('pro_dashboard.publish.platform_success') : (isProPlus ? (isSelected ? t('pro_dashboard.publish.platform_selected') : t('pro_dashboard.publish.platform_tap_select')) : t('pro_dashboard.publish.platform_tap'))}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="relative z-10">
                                                            {isPublished ? (
                                                                <CheckCircle2 size={18} className="text-emerald-500" />
                                                            ) : isProPlus ? (
                                                                <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-slate-200 dark:border-white/10'}`}>
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

                                        {/* TG Channel Picker — shown when Telegram is selected and multiple channels exist */}
                                        {(() => {
                                            const tgSetup = status?.setup;
                                            const mainCh = tgSetup?.telegram_channel_id;
                                            const extraChs = tgSetup?.telegram_channels || [];
                                            const allChs: string[] = mainCh
                                                ? [mainCh, ...extraChs.filter((c: string) => c && c !== mainCh)]
                                                : extraChs.filter((c: string) => c);
                                            const hasTgSelected = selectedPublishPlatforms.includes('telegram') || (!status?.is_pro_plus && status?.has_telegram_setup);
                                            if (allChs.length <= 1 || !hasTgSelected) return null;

                                            return (
                                                <AnimatePresence>
                                                    <motion.div
                                                        key="tg-channel-picker"
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="mt-1 p-3 bg-sky-500/5 border border-sky-500/20 rounded-2xl space-y-2">
                                                            <div className="flex items-center gap-2 px-1">
                                                                <Send size={10} className="text-sky-500" />
                                                                <span className="text-label font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">Post to Channel</span>
                                                            </div>
                                                            <div className="grid gap-1.5">
                                                                {allChs.map((ch: string) => {
                                                                    const isActive = selectedTgChannel === ch || (!selectedTgChannel && allChs[0] === ch);
                                                                    return (
                                                                        <button
                                                                            key={ch}
                                                                            onClick={() => { setSelectedTgChannel(isActive ? '' : ch); selection(); }}
                                                                            className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between transition-all ${isActive
                                                                                ? 'bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-500/20'
                                                                                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-sky-500/40'}`}
                                                                        >
                                                                            <span className="text-label font-bold font-mono truncate">{ch}</span>
                                                                            {isActive && <CheckCircle2 size={14} className="text-white shrink-0 ml-2" />}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                            <p className="text-label font-bold text-slate-400 uppercase tracking-widest px-1">
                                                                {allChs.length} channels configured — select target
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                </AnimatePresence>
                                            );
                                        })()}
                                    </div>

                                    {status?.is_pro_plus && selectedPublishPlatforms.length > 0 && !isPublishing && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="px-1 pt-2"
                                        >
                                            <button
                                                onClick={handleOmniPublish}
                                                className="w-full h-13 vibing-crystal-purple-animated rounded-2xl font-bold text-white text-label uppercase tracking-[0.2em] shadow-xl shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 group"
                                            >
                                                <Zap size={16} className="group-hover:scale-125 transition-transform" />
                                                {t('pro_dashboard.publish.omni_publish_btn', { count: selectedPublishPlatforms.length })}
                                            </button>
                                        </motion.div>
                                    )}

                                    {isPublishing && (
                                        <div className="flex items-center justify-center gap-2 pt-1">
                                            <Loader2 className="animate-spin text-purple-500" size={16} />
                                            <span className="text-label font-bold uppercase tracking-[0.2em] text-purple-400">{t('pro_dashboard.publish.processing')}</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setShowPublishModal(false)}
                                        className="w-full py-2.5 text-label font-bold uppercase tracking-[0.25em] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
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
                                    className="bg-white dark:bg-slate-900 w-full max-w-[340px] rounded-xl p-5 space-y-4 relative border border-slate-200 dark:border-white/10 shadow-3xl mx-4 my-auto"
                                >
                                    <button
                                        onClick={() => setShowShareModal(false)}
                                        className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors z-10"
                                    >
                                        <X size={18} />
                                    </button>

                                    <div className="flex flex-col items-center text-center space-y-2 pt-2">
                                        <div className="w-12 h-12 bg-linear-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-lg">
                                            <Share size={20} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <h3 className="text-body font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                                                {t('pro_dashboard.studio.share_modal.title')}
                                            </h3>
                                            <p className="text-label font-bold uppercase tracking-[0.15em] text-blue-500">
                                                {t('pro_dashboard.studio.share_modal.subtitle')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        <button
                                            onClick={() => handleSharePlatform('telegram')}
                                            className="h-12 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/20 rounded-xl flex items-center justify-center gap-2 transition-all group active:scale-95"
                                        >
                                            <img src={socialLogos.telegram} alt="Telegram" className="w-5 h-5 object-contain" />
                                            <span className="text-label font-bold uppercase text-[#0088cc]">Telegram</span>
                                        </button>
                                        <button
                                            onClick={() => handleSharePlatform('whatsapp')}
                                            className="h-12 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-xl flex items-center justify-center gap-2 transition-all group active:scale-95"
                                        >
                                            <img src={socialLogos.whatsapp} alt="WhatsApp" className="w-5 h-5 object-contain" />
                                            <span className="text-label font-bold uppercase text-[#25D366]">WhatsApp</span>
                                        </button>
                                        <button
                                            onClick={() => handleSharePlatform('x')}
                                            className="h-12 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center gap-2 transition-all group active:scale-95"
                                        >
                                            <img src={socialLogos.x} alt="X" className="w-4 h-4 dark:invert object-contain" />
                                            <span className="text-label font-bold uppercase text-slate-900 dark:text-white">Twitter</span>
                                        </button>
                                        <button
                                            onClick={handleSystemShare}
                                            disabled={isSharingSystem}
                                            className="h-12 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl flex items-center justify-center gap-2 transition-all group active:scale-95 disabled:opacity-50"
                                        >
                                            {isSharingSystem ? (
                                                <Loader2 size={14} className="text-purple-500 animate-spin" />
                                            ) : (
                                                <Share size={14} className="text-purple-500 group-hover:scale-110 transition-transform" />
                                            )}
                                            <span className="text-label font-bold uppercase text-purple-500">{t('pro_dashboard.studio.share_modal.more')}</span>
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => setShowShareModal(false)}
                                        className="w-full mt-2 py-2.5 text-label font-bold uppercase tracking-[0.25em] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                    >
                                        {t('pro_dashboard.studio.back_btn')}
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )
            }
        </motion.div>
    );
};
