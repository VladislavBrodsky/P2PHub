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
import { PremiumSelect } from '../components/PremiumSelect';
import { applyGlitchOverlay } from '../../../utils/glitchImageOverlay';
import { usePerformance } from '../../../hooks/usePerformance';
import { shareToTelegram, shareUniversal, stripMarkdown } from '../../../utils/shareUtils';
import {
    StudioStepper,
    StudioMatrixStepper,
    StudioSynthesisDisplay,
    StudioResultPreview,
    StudioPublishModal,
    StudioShareModal
} from '../components/StudioComponents';

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
    const { lowPowerMode } = usePerformance();
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
            lowPowerMode,
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
        return stripMarkdown(text);
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

        const result = await shareUniversal({
            title: shareData.title,
            text: shareData.text,
            url: undefined, // text already contains links in StudioTab logic
            files: shareData.files
        });

        if (result === 'copied') {
            notification({
                title: t('pro_dashboard.notifications.copied'),
                text: t('pro_dashboard.notifications.text_copied'),
                type: 'success'
            });
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
                // Using centralized sharing utility for better reliability on Android TMA
                shareToTelegram(textToShare);
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
            <StudioStepper step={externalStep} t={t} lowPowerMode={lowPowerMode} />

            {externalStep === 1 && (
                <StudioMatrixStepper
                    postType={postType}
                    setPostType={setPostType}
                    audience={audience}
                    setAudience={setAudience}
                    tone={tone}
                    setTone={setTone}
                    language={language}
                    setLanguage={setLanguage}
                    usePersonalLink={usePersonalLink}
                    setUsePersonalLink={setUsePersonalLink}
                    personalLink={personalLink}
                    setPersonalLink={setPersonalLink}
                    handleUpdatePersonalLink={handleUpdatePersonalLink}
                    isUpdatingLink={isUpdatingLink}
                    openDropdown={openDropdown}
                    handleToggle={handleToggle}
                    setOpenDropdown={setOpenDropdown}
                    status={status}
                    selection={selection}
                    setExternalStep={setExternalStep}
                    t={t}
                />
            )}

            {externalStep === 2 && (
                <StudioSynthesisDisplay
                    isGenerating={isGenerating}
                    countdown={countdown}
                    t={t}
                    handleGenerate={handleGenerate}
                    selection={selection}
                    setExternalStep={setExternalStep}
                />
            )}

            {externalStep === 3 && generatedResult && (
                <StudioResultPreview
                    generatedResult={generatedResult}
                    glitchImageSrc={glitchImageSrc}
                    isApplyingGlitch={isApplyingGlitch}
                    isGenerating={isGenerating}
                    isRegeneratingHashtags={isRegeneratingHashtags}
                    historyIndex={historyIndex}
                    status={status}
                    t={t}
                    handleGenerate={handleGenerate}
                    handleSaveImageToDevice={handleSaveImageToDevice}
                    handleUndoVersion={handleUndoVersion}
                    handleCopyText={handleCopyText}
                    handleRegenerateHashtags={handleRegenerateHashtags}
                    setShowPublishModal={setShowPublishModal}
                    setShowShareModal={setShowShareModal}
                    handleReset={handleReset}
                    selection={selection}
                    impact={impact}
                    getApiUrl={getApiUrl}
                />
            )}

            <AnimatePresence>
                {showPublishModal && (
                    <StudioPublishModal
                        setShowPublishModal={setShowPublishModal}
                        status={status}
                        selectedPublishPlatforms={selectedPublishPlatforms}
                        togglePublishPlatform={togglePublishPlatform}
                        handlePublishToPlatform={handlePublishToPlatform}
                        handleOmniPublish={handleOmniPublish}
                        isPublishing={isPublishing}
                        publishedPlatforms={publishedPlatforms}
                        selectedTgChannel={selectedTgChannel}
                        setSelectedTgChannel={setSelectedTgChannel}
                        selection={selection}
                        t={t}
                    />
                )}

                {showShareModal && (
                    <StudioShareModal
                        setShowShareModal={setShowShareModal}
                        handleSharePlatform={handleSharePlatform}
                        handleSystemShare={handleSystemShare}
                        isSharingSystem={isSharingSystem}
                        t={t}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};
