import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Sparkles, Send, Globe, ChevronRight,
    ArrowLeft, Terminal, Bot, Image as ImageIcon,
    CheckCircle2, AlertCircle, Loader2,
    Lock, Twitter, Cpu, BookOpen, Flame, Settings, Wand2, ShieldCheck,
    Linkedin, Info, Copy, Download, RefreshCw, Undo2, Share, Compass, X,
    TrendingUp, Monitor, Quote, ArrowRight, Users, Trophy, Search
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptic } from '../hooks/useHaptic';
import { useUser } from '../context/UserContext';
import { useUI } from '../context/UIContext';
import { proService, PROStatus } from '../services/proService';
import { getApiUrl } from '../utils/api';

const renderMarkdown = (text: string, isInline = false) => {
    if (!text) return null;
    const html = text
        .replace(/\*\*\*\*(.*?)\*\*\*\*/g, '<strong>$1</strong>') // Handle quadruple stars just in case
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-indigo-500 font-bold underline">$1</a>')
        .replace(/\n/g, isInline ? ' ' : '<br />');

    if (isInline) {
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
    }
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

type Tab = 'studio' | 'tools' | 'growth';

export const ProDashboard = () => {
    const { t, i18n } = useTranslation();
    const { selection, impact, notification } = useHaptic();
    const { user } = useUser();
    const { setFooterVisible, setHeaderVisible } = useUI();

    const [status, setStatus] = useState<PROStatus | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('studio');

    // Studio State
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [postType, setPostType] = useState('');
    const [audience, setAudience] = useState('');
    const [language, setLanguage] = useState(i18n.language === 'ru' ? 'Russian' : 'English');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedResult, setGeneratedResult] = useState<any>(null);

    // Tools State
    const [headlineInput, setHeadlineInput] = useState('');
    const [fixedHeadline, setFixedHeadline] = useState('');
    const [isFixingHeadline, setIsFixingHeadline] = useState(false);
    const [bioInput, setBioInput] = useState('');
    const [fixedBio, setFixedBio] = useState('');
    const [isFixingBio, setIsFixingBio] = useState(false);
    const [trends, setTrends] = useState<any[]>([]);
    const [isHuntingTrends, setIsHuntingTrends] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [academyScore, setAcademyScore] = useState(0);
    const [completedStages, setCompletedStages] = useState<string[]>([]);
    const [isCompletingStage, setIsCompletingStage] = useState<string | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<any>(null);
    const [marketAudit, setMarketAudit] = useState<any>(null);
    const [isAuditing, setIsAuditing] = useState(false);
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [showHeadlineModal, setShowHeadlineModal] = useState(false);
    const [showTrendsModal, setShowTrendsModal] = useState(false);
    const [showBioModal, setShowBioModal] = useState(false);

    // API Setup State
    const [showSetup, setShowSetup] = useState(false);
    const [showManual, setShowManual] = useState<string | null>(null);
    const [apiData, setApiData] = useState({
        x_api_key: '',
        x_api_secret: '',
        x_access_token: '',
        x_access_token_secret: '',
        telegram_channel_id: '', // Main channel
        telegram_channels: [] as string[], // Additional channels
        linkedin_access_token: ''
    });

    const [countdown, setCountdown] = useState(30);

    // History and Cache for Viral Generations
    const [history, setHistory] = useState<any[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Publishing State
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishedPlatforms, setPublishedPlatforms] = useState<string[]>([]);

    useEffect(() => {
        // #comment: Global header and footer are now preserved to maintain app identity. 
        // Modals still hide footer for focus.
        if (showSetup || showPublishModal || showManual || selectedArticle || selectedAsset || showAuditModal) {
            setFooterVisible(false);
            setHeaderVisible(false); // Hide header when modal is open to avoid system button collision
        } else {
            setFooterVisible(true);
            setHeaderVisible(true);
        }
        return () => {
            setHeaderVisible(true);
            setFooterVisible(true);
        };
    }, [showSetup, showPublishModal, showManual, selectedArticle, selectedAsset, setFooterVisible, setHeaderVisible]);

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

    useEffect(() => {
        loadStatus();

        // Telegram Web App Expansion & Swipe Prevention
        const tg = (window as any).Telegram?.WebApp;
        if (tg) {
            tg.expand();
            tg.enableClosingConfirmation();
            // Prevent vertical swipes if supported
            if (tg.isVerticalSwipesEnabled !== undefined) {
                tg.isVerticalSwipesEnabled = false;
            }
            // Set header color to match
            if (tg.setHeaderColor) {
                tg.setHeaderColor('#0f172a'); // slate-950
            }
            if (tg.setBackgroundColor) {
                tg.setBackgroundColor('#0f172a');
            }
        }
    }, []);

    const loadStatus = async () => {
        try {
            const data = await proService.getStatus();
            setStatus(data);
            if (data.setup) {
                setApiData({
                    x_api_key: data.setup.x_api_key || '',
                    x_api_secret: data.setup.x_api_secret || '',
                    x_access_token: data.setup.x_access_token || '',
                    x_access_token_secret: data.setup.x_access_token_secret || '',
                    telegram_channel_id: data.setup.telegram_channel_id || '',
                    telegram_channels: data.setup.telegram_channels || [],
                    linkedin_access_token: data.setup.linkedin_access_token || ''
                });
            }
            if (data.academy_score !== undefined) setAcademyScore(data.academy_score);
            if (data.completed_stages) {
                try {
                    setCompletedStages(JSON.parse(data.completed_stages));
                } catch (e) {
                    console.error("Failed to parse academy stages", e);
                }
            }
        } catch (error) {
            console.error('Failed to load PRO status', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompleteAcademyStage = async (stage_id: string) => {
        if (completedStages.includes(stage_id)) return;
        setIsCompletingStage(stage_id);
        impact('medium');
        try {
            const data = await proService.completeAcademyStage(stage_id);
            setAcademyScore(data.academy_score);
            setCompletedStages(prev => [...prev, stage_id]);
            notification('success');
        } catch (error) {
            console.error('Failed to complete academy stage', error);
            notification('error');
        } finally {
            setIsCompletingStage(null);
        }
    };

    const handleGenerate = async () => {
        if (!postType || !audience) {
            notification('error');
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

            setStatus(prev => prev ? { ...prev, pro_tokens: result.tokens_remaining } : null);
            setStep(3);
            notification('success');
        } catch (error: any) {
            console.error('Generation failed', error);
            alert(error.response?.data?.detail || 'Generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyText = () => {
        if (!generatedResult) return;
        const hashtagsStr = generatedResult.hashtags?.map((t: string) => `#${t}`).join(' ') || '';
        const text = `${generatedResult.title}\n\n${generatedResult.body}\n\n${hashtagsStr}`;

        const copyToClipboard = (str: string) => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                return navigator.clipboard.writeText(str);
            } else {
                const el = document.createElement('textarea');
                el.value = str;
                document.body.appendChild(el);
                el.select();
                const success = document.execCommand('copy');
                document.body.removeChild(el);
                return success ? Promise.resolve() : Promise.reject();
            }
        };

        copyToClipboard(text)
            .then(() => {
                notification('success');
            })
            .catch(() => {
                notification('error');
            });
    };

    const handleCopyAnyText = (text: string) => {
        if (!text) return;

        const copyToClipboard = (str: string) => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                return navigator.clipboard.writeText(str);
            } else {
                const el = document.createElement('textarea');
                el.value = str;
                document.body.appendChild(el);
                el.select();
                const success = document.execCommand('copy');
                document.body.removeChild(el);
                return success ? Promise.resolve() : Promise.reject();
            }
        };

        copyToClipboard(text)
            .then(() => {
                notification('success');
            })
            .catch(() => {
                notification('error');
            });
    };

    const handleSharePost = async () => {
        if (!generatedResult) return;
        const textToShare = `${generatedResult.title}\n\n${generatedResult.body}\n\n#PintopayPRO #FinancialFreedom`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: generatedResult.title,
                    text: textToShare,
                });
            } catch (err) { }
        } else {
            handleCopyText();
        }
    };

    const handleRunMarketingAudit = async () => {
        if (status && status.pro_tokens < 3) {
            notification('error');
            return;
        }
        setIsAuditing(true);
        selection();
        try {
            const res = await proService.getMarketingAudit();
            setMarketAudit(res.audit);
            setStatus(prev => prev ? { ...prev, pro_tokens: res.tokens_remaining } : prev);
            setShowAuditModal(true);
            notification('success');
            impact('heavy');
        } catch (e: any) {
            console.error('Audit failed:', e);
            notification('error');
        } finally {
            setIsAuditing(false);
        }
    };

    const handleSaveImageToDevice = async () => {
        if (!generatedResult?.image_url) return;

        let finalUrl = generatedResult.image_url;
        if (!finalUrl.startsWith('http')) {
            // Handle relative paths - ensure base URL doesn't have double slashes
            const baseUrl = getApiUrl().replace(/\/api\/?$/, '');
            finalUrl = `${baseUrl}${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
        }

        // Fix potential double '/api' issues if present in generated URL
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
            notification('success');
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
        }
    };

    const handleFixHeadline = async () => {
        if (!headlineInput) return;
        setIsFixingHeadline(true);
        try {
            const res = await proService.fixHeadline(headlineInput);
            setFixedHeadline(res.result);
            setStatus(prev => prev ? { ...prev, pro_tokens: res.tokens_remaining } : null);
            notification('success');
        } catch (error) {
            alert("Failed to fix headline");
        } finally {
            setIsFixingHeadline(false);
        }
    };

    const handleFetchTrends = async () => {
        setIsHuntingTrends(true);
        try {
            const res = await proService.fetchTrends();
            setTrends(res.trends);
            setStatus(prev => prev ? { ...prev, pro_tokens: res.tokens_remaining } : null);
            notification('success');
        } catch (error) {
            alert("Failed to fetch trends");
        } finally {
            setIsHuntingTrends(false);
        }
    };

    const handleSaveSetup = async () => {
        setIsLoading(true);
        try {
            await proService.setupSocial(apiData);
            await loadStatus();
            setShowSetup(false);
            notification('success');
        } catch (error) {
            alert('Failed to save API setup');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestIntegration = async (platform: 'x' | 'telegram' | 'linkedin') => {
        try {
            notification('success');
            await proService.testIntegration(platform);
            alert(`Test message successfully sent to ${platform.toUpperCase()}`);
        } catch (error: any) {
            alert(error.response?.data?.detail || `Test failed for ${platform.toUpperCase()}. Please check your keys.`);
            notification('error');
        }
    };

    const handlePublishToPlatform = async (platform: 'x' | 'telegram' | 'linkedin') => {
        if (!generatedResult) return;
        setIsPublishing(true);
        impact('heavy');
        try {
            const hashtagsStr = generatedResult.hashtags?.map((t: string) => `#${t}`).join(' ') || '';
            const fullContent = `${generatedResult.title}\n\n${generatedResult.body}\n\n${hashtagsStr}`;

            await proService.publishContent(platform, fullContent, generatedResult.image_url);
            setPublishedPlatforms([...publishedPlatforms, platform]);
            notification('success');
        } catch (error: any) {
            alert(error.response?.data?.detail || `Failed to publish to ${platform.toUpperCase()}`);
            notification('error');
        } finally {
            setIsPublishing(false);
        }
    };

    const postTypes = [
        { key: "Product Launch", label: t('pro_dashboard.studio.post_types.launch') },
        { key: "FOMO Builder", label: t('pro_dashboard.studio.post_types.fomo') },
        { key: "System Authority", label: t('pro_dashboard.studio.post_types.authority') },
        { key: "Lifestyle Flex", label: t('pro_dashboard.studio.post_types.lifestyle') },
        { key: "Passive Income Proof", label: t('pro_dashboard.studio.post_types.income') },
        { key: "Network Growth", label: t('pro_dashboard.studio.post_types.network') },
        { key: "Web3 Tutorial", label: t('pro_dashboard.studio.post_types.tutorial') }
    ];

    const audiences = [
        { key: "Cryptocurrency Traders", label: t('pro_dashboard.studio.audiences.traders') },
        { key: "Digital Nomads", label: t('pro_dashboard.studio.audiences.nomads') },
        { key: "Affiliate Marketers", label: t('pro_dashboard.studio.audiences.affiliates') },
        { key: "Network Builders", label: t('pro_dashboard.studio.audiences.builders') },
        { key: "Stay-at-home Parents", label: t('pro_dashboard.studio.audiences.parents') },
        { key: "Student Hustlers", label: t('pro_dashboard.studio.audiences.hustlers') },
        { key: "Corporate Burnouts", label: t('pro_dashboard.studio.audiences.burnouts') }
    ];
    const languages = ["English", "Russian", "Spanish", "French", "German"];


    if (!user?.is_pro && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-10 text-center min-h-[70vh]">
                <Lock size={64} className="text-amber-500 mb-6 opacity-20" />
                <h2 className="text-2xl font-black mb-4">{t('pro_dashboard.locked.title')}</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs">
                    {t('pro_dashboard.locked.desc')}
                </p>
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'subscription' }))}
                    className="px-8 h-14 bg-linear-to-r from-amber-400 to-orange-600 rounded-2xl font-black text-white active:scale-95 transition-all"
                >
                    {t('pro_dashboard.locked.upgrade_btn')}
                </button>
            </div>
        );
    }
    return (
        <div className="relative w-full h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden cyber-grid">
            {/* Dashboard Headers - PRO Command Center */}
            <div className="shrink-0 pt-safe-top pb-6 space-y-5 bg-linear-to-b from-white via-white to-transparent dark:from-slate-950 dark:via-slate-950 dark:to-transparent z-30 relative overflow-hidden">
                {/* Background Elite Grid */}
                <div className="absolute inset-0 cyber-grid opacity-10 dark:opacity-20 pointer-events-none" />

                <div className="px-6 flex items-center justify-between relative mt-4">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <motion.div
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
                            />
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] drop-shadow-sm">
                                Node: Global_Elite
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase leading-none">
                            <span className="vibing-crystal-text drop-shadow-2xl">
                                {activeTab === 'studio' ? t('pro_dashboard.tab_studio') :
                                    activeTab === 'tools' ? t('pro_dashboard.tab_tools') :
                                        t('pro_dashboard.tab_growth')}
                            </span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {status && (
                            <div className="hidden sm:flex flex-col items-end px-4 py-2 bg-slate-100/50 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-inner">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest opacity-60">Neural Credits</span>
                                <span className="text-sm font-black text-indigo-500">{status.pro_tokens}</span>
                            </div>
                        )}
                        <button
                            onClick={() => { selection(); setShowSetup(true); }}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 active:scale-90 transition-all shadow-premium hover:border-indigo-500/50 group pro-card-extreme"
                        >
                            <Settings className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:rotate-90 transition-transform duration-500" />
                        </button>
                    </div>
                </div>

                <div className="px-6">
                    <div className="bg-slate-200/50 dark:bg-white/5 p-1.5 rounded-[1.5rem] flex items-center gap-1.5 relative overflow-hidden border border-slate-300/50 dark:border-white/10 shadow-2xl">
                        {(['studio', 'tools', 'growth'] as Tab[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab as any); selection(); impact('light'); }}
                                className={`relative flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group/tab ${activeTab === tab
                                    ? 'text-white'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="pro-tab-active"
                                        className="absolute inset-0 vibing-blue-animated rounded-xl shadow-[0_10px_20px_rgba(0,102,255,0.3)] z-[-1] vibrating-glow-blue"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <div className={`p-1.5 rounded-lg transition-all duration-300 ${activeTab === tab ? 'bg-white/20' : 'bg-slate-300/20 dark:bg-white/5 group-hover/tab:scale-110'}`}>
                                    {tab === 'studio' && <Sparkles size={14} />}
                                    {tab === 'tools' && <Zap size={14} />}
                                    {tab === 'growth' && <BookOpen size={14} />}
                                </div>
                                <span className="hidden xs:block drop-shadow-sm">{t(`pro_dashboard.tab_${tab}`)}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className={`flex-1 ${showSetup ? 'pb-20' : 'pb-32'} custom-scrollbar scroll-smooth overflow-y-auto overscroll-none`}>

                {/* Main Content Areas */}
                <div className="px-6 space-y-6 flex-1">
                    <AnimatePresence mode="wait">
                        {/* STUDIO TAB */}
                        {activeTab === 'studio' && (
                            <motion.div
                                key="studio"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                {/* Stepper - Compact Premium */}
                                <div className="flex items-center justify-center gap-3 py-4">
                                    {[1, 2, 3].map((s) => (
                                        <div key={s} className="flex items-center">
                                            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-[10px] font-black transition-all ${step === s
                                                ? 'vibing-blue-animated text-white scale-110'
                                                : step > s
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 opacity-40'
                                                }`}>
                                                {step > s ? <CheckCircle2 size={14} /> : s}
                                            </div>
                                            {s < 3 && (
                                                <div className="w-8 h-[2px] mx-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full vibing-blue-gradient"
                                                        initial={{ width: "0%" }}
                                                        animate={{ width: step > s ? "100%" : "0%" }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        className="space-y-6"
                                    >
                                        <div className="pro-card-extreme rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border border-white/10 shadow-3xl relative overflow-hidden group noise-overlay holographic-shine">
                                            <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none" />
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-32 -mt-32 animate-pulse" />

                                            <div className="flex items-center justify-between mb-8 sm:mb-12 relative z-10">
                                                <div className="flex items-center gap-4 sm:gap-6">
                                                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl vibing-blue-animated flex items-center justify-center shrink-0 shadow-2xl shadow-indigo-500/40 vibrating-glow-blue">
                                                        <Terminal size={24} className="sm:size-[32px] text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm sm:text-lg font-black uppercase tracking-[0.3em] vibing-blue-text leading-none mb-2 sm:mb-3">
                                                            {t('pro_dashboard.studio.matrix_title')}
                                                        </h3>
                                                        <div className="flex items-center gap-2 sm:gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                                            <span className="text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] leading-none opacity-60">
                                                                {t('pro_dashboard.studio.matrix_subtitle')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => { selection(); setShowManual('studio'); }}
                                                    className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-500 hover:bg-white/10 transition-all active:scale-90 premium-border-glow"
                                                >
                                                    <Info size={20} />
                                                </button>
                                            </div>

                                            <div className="space-y-4 sm:space-y-5 relative z-10">
                                                {/* Strategy Selection */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between px-1">
                                                        <label className="text-[8px] sm:text-[10px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-[0.2em]">
                                                            01. {t('pro_dashboard.studio.strategy_label')}
                                                        </label>
                                                        <Sparkles size={10} className="text-indigo-500/30" />
                                                    </div>
                                                    <div className="relative group/sel">
                                                        <select
                                                            value={postType}
                                                            onChange={(e) => { selection(); setPostType(e.target.value); }}
                                                            className="w-full h-14 sm:h-16 bg-slate-100/50 dark:bg-white/5 backdrop-blur-3xl border border-slate-200 dark:border-white/10 focus:border-indigo-500/50 rounded-2xl sm:rounded-3xl px-6 text-sm sm:text-base font-black text-slate-900 dark:text-white outline-hidden appearance-none transition-all cursor-pointer shadow-inner group-hover/sel:bg-slate-200/50 dark:group-hover/sel:bg-white/10"
                                                        >
                                                            <option value="" disabled className="text-slate-500">{t('pro_dashboard.studio.strategy_placeholder')}</option>
                                                            {postTypes.map(pt => <option key={pt.key} value={pt.key} className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">{pt.label}</option>)}
                                                        </select>
                                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                                                <ChevronRight className="rotate-90 w-5 h-5 text-indigo-500" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Target Audience */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between px-1">
                                                        <label className="text-[10px] sm:text-xs font-black uppercase text-purple-600 dark:text-purple-400 tracking-[0.3em]">
                                                            02. {t('pro_dashboard.studio.target_label')}
                                                        </label>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                                                            <Users size={12} className="text-purple-500/50" />
                                                        </div>
                                                    </div>
                                                    <div className="relative group/sel">
                                                        <select
                                                            value={audience}
                                                            onChange={(e) => { selection(); setAudience(e.target.value); }}
                                                            className="w-full h-14 sm:h-16 bg-slate-100/50 dark:bg-white/5 backdrop-blur-3xl border border-slate-200 dark:border-white/10 focus:border-purple-500/50 rounded-2xl sm:rounded-3xl px-6 text-sm sm:text-base font-black text-slate-900 dark:text-white outline-hidden appearance-none transition-all cursor-pointer shadow-inner group-hover/sel:bg-slate-200/50 dark:group-hover/sel:bg-white/10"
                                                        >
                                                            <option value="" disabled className="text-slate-500">{t('pro_dashboard.studio.target_placeholder')}</option>
                                                            {audiences.map(a => <option key={a.key} value={a.key} className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">{a.label}</option>)}
                                                        </select>
                                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                                                <ChevronRight className="rotate-90 w-5 h-5 text-purple-500" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Output Language */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between px-1">
                                                        <label className="text-[10px] sm:text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-[0.3em]">
                                                            03. {t('pro_dashboard.studio.language_label')}
                                                        </label>
                                                        <Globe size={14} className="text-emerald-500/50" />
                                                    </div>
                                                    <div className="relative group/sel">
                                                        <select
                                                            value={language}
                                                            onChange={(e) => setLanguage(e.target.value)}
                                                            className="w-full h-14 sm:h-16 bg-slate-100/50 dark:bg-white/5 backdrop-blur-3xl border border-slate-200 dark:border-white/10 focus:border-emerald-500/50 rounded-2xl sm:rounded-3xl px-6 text-sm sm:text-base font-black text-slate-900 dark:text-white outline-hidden appearance-none transition-all cursor-pointer shadow-inner group-hover/sel:bg-slate-200/50 dark:group-hover/sel:bg-white/10"
                                                        >
                                                            {languages.map(l => <option key={l} value={l} className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">{l}</option>)}
                                                        </select>
                                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                                                <Globe size={18} className="text-emerald-500" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Area */}
                                            <div className="pt-6 sm:pt-8 relative z-20">
                                                <button
                                                    onClick={() => { selection(); setStep(2); }}
                                                    disabled={!postType || !audience}
                                                    className="w-full h-14 sm:h-16 vibing-blue-animated rounded-xl sm:rounded-2xl font-black text-white text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 sm:gap-4 disabled:opacity-30 disabled:grayscale disabled:shadow-none hover:shadow-indigo-500/40 border border-white/20"
                                                >
                                                    <Sparkles size={16} className="animate-pulse" />
                                                    {t('pro_dashboard.studio.initiate_btn')}
                                                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                                </button>
                                                <p className="text-[8px] sm:text-[9px] font-black text-slate-500 dark:text-slate-400 text-center mt-3 sm:mt-4 uppercase tracking-[0.2em] opacity-40">
                                                    Powered by Claude 3.5 Sonnet & Flux PRO
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="glass-panel-premium rounded-[2.5rem] p-10 text-center space-y-8 relative overflow-hidden border border-white/10 shadow-3xl"
                                    >
                                        <div className="absolute inset-0 bg-linear-to-tr from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />

                                        {isGenerating ? (
                                            <div className="py-6 sm:py-10 flex flex-col items-center justify-center space-y-6 sm:space-y-10 relative bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-3xl border border-black/3">
                                                {/* Premium Synthesis View - White Square Style */}
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
                                                                    {Math.min(Math.floor(((30 - countdown) / 30) * 100), 99)}<span className="text-[10px] sm:text-xs not-italic opacity-30 ml-1 font-bold">%</span>
                                                                </span>
                                                                <span className="text-[8px] sm:text-[9px] font-black text-indigo-500 uppercase tracking-widest border-b border-indigo-500/20 pb-0.5 sm:pb-1">
                                                                    {t('pro_dashboard.studio.cooking_remaining', { count: countdown })}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Simple Premium Progress Bar */}
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

                                                <div className="p-4 bg-white/5 rounded-xl border border-white/10 shadow-inner">
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
                                                        onClick={() => { selection(); setStep(1); }}
                                                        className="w-full h-10 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <ArrowLeft size={12} /> {t('pro_dashboard.studio.back_btn')}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                )}

                                {step === 3 && generatedResult && (
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
                                            <div className="p-7 space-y-5 relative">
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
                            </motion.div>
                        )}

                        {/* TOOLS TAB */}
                        {activeTab === 'tools' && (
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
                                            whileHover={{ y: -5 }}
                                            className="pro-card-extreme rounded-[2.5rem] p-8 border border-white/10 group relative flex flex-col shadow-2xl h-full"
                                        >
                                            <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 overflow-hidden">
                                                    <Zap size={24} />
                                                </div>
                                                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Active</span>
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 px-1">{t('pro_dashboard.tools.headline.title')}</h3>
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-8 px-1 opacity-80">
                                                {t('pro_dashboard.tools.headline.desc')}
                                            </p>
                                            <button
                                                onClick={() => setShowHeadlineModal(true)}
                                                className="mt-auto w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3 border border-indigo-500/20 group/btn"
                                            >
                                                {t('pro_dashboard.tools.headline.btn')}
                                                <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                        </motion.div>
                                    </div>

                                    {/* Trend Hunter Module */}
                                    <motion.div
                                        whileHover={{ y: -5 }}
                                        className="pro-card-extreme rounded-[2.5rem] p-8 border border-white/10 group relative h-full flex flex-col shadow-2xl noise-overlay holographic-shine"
                                    >
                                        <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-xl shadow-orange-500/10">
                                                <Flame size={24} />
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em]">Live Node</span>
                                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest opacity-40">Scanning Global...</span>
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-3 px-1">{t('pro_dashboard.tools.trends.title')}</h3>

                                        {trends.length > 0 ? (
                                            <div className="space-y-3 mb-8">
                                                {trends.slice(0, 2).map((trend, i) => (
                                                    <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold text-slate-500 italic opacity-80">
                                                        "{trend.topic}"
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-8 px-1 opacity-80">
                                                {t('pro_dashboard.tools.trends.desc')}
                                            </p>
                                        )}

                                        <button
                                            onClick={() => setShowTrendsModal(true)}
                                            className="mt-auto w-full h-14 vibing-blue-animated rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20"
                                        >
                                            {t('pro_dashboard.tools.trends.btn')}
                                            <Compass size={16} className="animate-[spin_4s_linear_infinite]" />
                                        </button>
                                    </motion.div>

                                    {/* Global Marketing Audit - Flagship Centerpiece */}
                                    <motion.div
                                        whileHover={{ scale: 1.01 }}
                                        className="pro-card-extreme rounded-[3rem] p-10 border border-indigo-500/30 group relative flex flex-col shadow-3xl col-span-1 sm:col-span-2 holographic-shine border-gradient-pro bg-slate-100/30 dark:bg-indigo-500/3"
                                    >
                                        <div className="absolute -right-20 -top-20 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full group-hover/btn:scale-125 transition-transform duration-1000" />
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-10">
                                            <div className="flex items-center gap-6">
                                                <div className="w-24 h-24 rounded-3xl vibing-blue-animated flex items-center justify-center text-white shadow-3xl shadow-indigo-500/30 vibrating-glow-blue relative">
                                                    <div className="absolute -inset-3 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
                                                    <Search size={40} className="relative z-10" />
                                                </div>
                                                <div>
                                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">{t('pro_dashboard.tools.audit.title')}</h3>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Global Audit Protocol 2.5 Active</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleRunMarketingAudit}
                                                disabled={isAuditing}
                                                className="w-full sm:w-auto px-12 h-20 vibing-blue-animated rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-3xl active:scale-95 transition-all flex items-center justify-center gap-4 border border-white/20 hover:shadow-indigo-500/50"
                                            >
                                                {isAuditing ? <Loader2 className="animate-spin w-6 h-6" /> : (
                                                    <>
                                                        {t('pro_dashboard.tools.audit.btn')}
                                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                                            <ChevronRight size={18} />
                                                        </div>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <div className="p-8 bg-white/80 dark:bg-black/40 rounded-[2.5rem] border border-black/5 dark:border-white/10 backdrop-blur-3xl relative overflow-hidden group/con shadow-inner">
                                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/con:opacity-40 transition-opacity">
                                                <Monitor size={60} className="text-indigo-500" />
                                            </div>
                                            <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-400 leading-relaxed max-w-4xl relative z-10">
                                                {renderMarkdown(t('pro_dashboard.tools.audit.capability'), true)}
                                            </p>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}

                        {/* GROWTH (FORMER ACADEMY) TAB */}
                        {activeTab === 'growth' && (
                            <motion.div
                                key="growth"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-10 pb-12"
                            >
                                {/* Master Score Card - Intelligence Hub */}
                                <div className="pro-card-extreme rounded-[3rem] sm:rounded-[4rem] p-8 sm:p-14 border border-white/10 shadow-3xl relative overflow-hidden group holographic-shine noise-overlay">
                                    <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none" />
                                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full -mr-64 -mt-64 animate-pulse" />

                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-10 relative z-10 mb-16">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] drop-shadow-sm">Node Status: Elite Alpha</span>
                                                </div>
                                                <button
                                                    onClick={() => setShowManual('academy')}
                                                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-indigo-500/50 hover:text-indigo-500 transition-all hover:scale-110"
                                                >
                                                    <Info size={16} />
                                                </button>
                                            </div>
                                            <h3 className="text-5xl sm:text-7xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-[0.9] drop-shadow-3xl max-w-[600px]">
                                                {t('pro_dashboard.academy.protocols.title')}
                                            </h3>
                                        </div>

                                        <div className="flex flex-col items-start sm:items-end">
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.6em] mb-4">{t('pro_dashboard.academy.protocols.stats_label')}</p>
                                            <div className="text-7xl sm:text-9xl font-black text-slate-900 dark:text-white tabular-nums leading-none flex items-baseline justify-start sm:justify-end vibing-crystal-text drop-shadow-3xl">
                                                {academyScore}<span className="text-indigo-500 text-3xl sm:text-5xl">.0</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8 relative z-10">
                                        <div className="flex justify-between items-end text-[10px] sm:text-xs font-black uppercase tracking-[0.5em] text-slate-500 dark:text-slate-400/60">
                                            <div className="flex items-center gap-4">
                                                <div className="w-3 h-8 bg-indigo-500 rounded-full vibrating-glow-blue" />
                                                <span>Protocol Synchronization Level</span>
                                            </div>
                                            <span className="text-indigo-500 font-black">{Math.floor((completedStages.length / 5) * 100)}% Complete</span>
                                        </div>
                                        <div className="h-5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-1.5 shadow-inner border border-black/5 dark:border-white/5">
                                            <motion.div
                                                className="h-full vibing-blue-animated rounded-full shadow-[0_0_25px_rgba(0,102,255,0.6)]"
                                                initial={{ width: "0%" }}
                                                animate={{ width: `${(completedStages.length / 5) * 100}%` }}
                                                transition={{ duration: 2, ease: "circOut" }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Expert Intelligence Transmission */}
                                <div className="px-4 py-8 bg-indigo-500/5 rounded-[3rem] border border-indigo-500/10 relative overflow-hidden group">
                                    <div className="flex items-center gap-6 mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                                            <Bot size={32} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-indigo-500 uppercase tracking-[0.4em] mb-1">MESSAGES FROM ELITE NODES</h4>
                                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest opacity-60 italic">Deciphering viral growth patterns...</p>
                                        </div>
                                    </div>
                                    <p className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-slate-200 leading-relaxed italic opacity-90 relative z-10 border-l-4 border-indigo-500 pl-8 ml-2">
                                        "{t('pro_dashboard.academy.desc')}"
                                    </p>
                                </div>

                                {/* Viral Content Hub */}
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-xl">
                                                <TrendingUp size={24} />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('pro_dashboard.academy.articles.title')}</h4>
                                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] opacity-60">Intelligence Dossier</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar -mx-4 px-4 snap-x">
                                        {(t('pro_dashboard.academy.articles.items', { returnObjects: true }) as any[]).map((article: any, i: number) => (
                                            <motion.div
                                                key={article.id}
                                                whileHover={{ y: -10, scale: 1.02 }}
                                                onClick={() => { setSelectedArticle(article); selection(); impact('light'); }}
                                                className="min-w-[300px] sm:min-w-[400px] snap-center pro-card-extreme p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden group cursor-pointer active:scale-95 transition-all bg-white/80 dark:bg-slate-950/40 shadow-2xl"
                                            >
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl group-hover:bg-indigo-500/20 transition-colors" />
                                                <div className="flex items-center gap-3 mb-6">
                                                    <span className="px-3 py-1 bg-indigo-500/10 rounded-full text-[9px] font-black text-indigo-500 uppercase tracking-widest border border-indigo-500/20">{article.category}</span>
                                                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">{article.readTime} MISSION TIME</span>
                                                </div>
                                                <h5 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 leading-tight group-hover:text-indigo-500 transition-colors">{article.title}</h5>
                                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-8 opacity-70 italic">"{article.desc}"</p>
                                                <div className="flex items-center gap-3 text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] group-hover:gap-5 transition-all">
                                                    {t('pro_dashboard.academy.articles.btn_read')} <ArrowRight size={14} />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Masterclass Modules - Node Synchronization */}
                                <div className="grid grid-cols-1 gap-8">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-xl">
                                            <ShieldCheck size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Synchronization Tasks</h4>
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] opacity-60">Unlock Node Capabilities</p>
                                        </div>
                                    </div>

                                    {(t('pro_dashboard.academy.protocols.modules', { returnObjects: true }) as any[]).map((module: any, i: number) => {
                                        const isCompleted = completedStages.includes(module.id);
                                        const isLoading = isCompletingStage === module.id;

                                        return (
                                            <motion.div
                                                key={module.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: i * 0.1 }}
                                                className={`pro-card-extreme rounded-[3rem] border overflow-hidden relative transition-all group ${isCompleted
                                                    ? 'opacity-60 border-indigo-500/20 bg-indigo-500/5'
                                                    : 'border-white/10 shadow-2xl hover:border-indigo-500/30'
                                                    }`}
                                            >
                                                <div className="p-10 space-y-8">
                                                    <div className="flex justify-between items-start">
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-3">
                                                                <span className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.3em] ${module.diff === 'hard' ? 'border-red-500/30 bg-red-500/10 text-red-500' :
                                                                    module.diff === 'medium' ? 'border-amber-500/30 bg-amber-500/10 text-amber-500' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                                                                    }`}>
                                                                    {t(`pro_dashboard.academy.protocols.difficulty_levels.${module.diff}`)}
                                                                </span>
                                                                {isCompleted && (
                                                                    <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                                                        <CheckCircle2 size={12} />
                                                                        SYNCED
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <h4 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{module.title}</h4>
                                                            <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.4em]">{module.hook}</p>
                                                        </div>
                                                        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 font-black text-xl shadow-xl">
                                                            +{module.points}
                                                        </div>
                                                    </div>

                                                    <p className="text-base font-medium text-slate-600 dark:text-slate-400 leading-relaxed max-w-4xl">
                                                        {renderMarkdown(module.content)}
                                                    </p>

                                                    <div className="p-8 bg-slate-900 dark:bg-black/40 rounded-[2.5rem] border border-white/5 space-y-5 shadow-inner group/task">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                                                    <Terminal size={18} />
                                                                </div>
                                                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Node Configuration Task</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm sm:text-lg font-bold text-white leading-relaxed opacity-90">
                                                            {module.task}
                                                        </p>
                                                        {module.link && (
                                                            <a
                                                                href={module.link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-3 text-indigo-400 text-xs font-black uppercase tracking-[0.3em] hover:text-white transition-colors group/link"
                                                            >
                                                                {module.cta || 'Initiate Sync'} <Share size={14} className="group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                                                            </a>
                                                        )}
                                                    </div>

                                                    {!isCompleted && (
                                                        <button
                                                            onClick={() => handleCompleteAcademyStage(module.id)}
                                                            disabled={isLoading}
                                                            className="w-full h-20 vibing-blue-animated rounded-3xl font-black text-xs uppercase tracking-[0.4em] active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-3xl shadow-indigo-500/30"
                                                        >
                                                            {isLoading ? <Loader2 size={24} className="animate-spin" /> : (
                                                                <>
                                                                    Synchronize Lesson <Sparkles size={20} />
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                                {/* Lifehacks & Strategy Dossier */}
                                <div className="pro-card-extreme p-10 rounded-[3rem] border border-white/10 relative overflow-hidden group bg-white/40 dark:bg-slate-950/40 shadow-2xl hover:shadow-pink-500/10 transition-all duration-700">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 blur-[100px] pointer-events-none group-hover:opacity-20 transition-opacity" />

                                    <div className="flex items-center justify-between mb-10 relative z-10">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center border border-pink-500/20 shadow-2xl group-hover:rotate-12 transition-transform">
                                                <Flame size={28} className="text-pink-500" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white leading-none mb-2">{t('pro_dashboard.academy.lifehacks.title')}</h4>
                                                <p className="text-[10px] font-black text-pink-500/60 uppercase tracking-[0.4em]">{t('pro_dashboard.academy.lifehacks.subtitle')}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { selection(); setShowManual('tools'); }}
                                            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-pink-500 hover:bg-pink-500/20 transition-all shadow-xl"
                                        >
                                            <Info size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {(t('pro_dashboard.academy.lifehacks.items', { returnObjects: true }) as any[]).map((hack: any, i: number) => (
                                            <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-pink-500/20 transition-all group/hack cursor-default shadow-sm hover:shadow-md">
                                                <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 font-black text-xs shrink-0 border border-pink-500/10 shadow-inner group-hover/hack:scale-110 transition-transform">{i + 1}</div>
                                                <div className="space-y-1">
                                                    <h5 className="text-[11px] font-black uppercase text-slate-900 dark:text-white tracking-tight">{hack.title}</h5>
                                                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic opacity-70 line-clamp-1">"{hack.desc}"</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="glass-panel-premium p-7 rounded-[2.5rem] border border-white/10 relative overflow-hidden group bg-slate-950 shadow-3xl">
                                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
                                    <div className="flex items-center gap-4 mb-8 relative z-10 font-sans">
                                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-xl group-hover:rotate-6 transition-transform">
                                            <Globe size={24} className="text-indigo-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-[12px] font-black uppercase tracking-[0.25em] text-white leading-none mb-1.5">{t('pro_dashboard.academy.social_setup.title')}</h4>
                                            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em]">{t('pro_dashboard.academy.social_setup.subtitle')}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 relative z-10 mb-6">
                                        {(t('pro_dashboard.academy.social_setup.platforms', { returnObjects: true, bot_username: status?.bot_username || 'pintopay_probot' }) as any[]).map((platform: any, i: number) => (
                                            <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group/platform">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20 group-hover/platform:scale-110 transition-transform">
                                                        {platform.name.includes('Telegram') && <Send size={14} className="text-indigo-500" />}
                                                        {platform.name.includes('X') && <Twitter size={14} className="text-indigo-500" />}
                                                        {platform.name.includes('LinkedIn') && <Linkedin size={14} className="text-indigo-500" />}
                                                    </div>
                                                    <span className="text-[9.5px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{platform.name}</span>
                                                </div>
                                                <div className="grid grid-cols-1 gap-1.5 opacity-60">
                                                    {platform.steps.slice(0, 2).map((step: string, j: number) => (
                                                        <div key={j} className="flex items-center gap-2">
                                                            <div className="w-1 h-2 rounded-full bg-indigo-500/30" />
                                                            <span className="text-[8px] font-medium text-slate-500 dark:text-slate-400 truncate">{step}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => { selection(); setShowSetup(true); }}
                                        className="w-full h-11 vibing-blue-animated text-white font-black text-[9px] uppercase tracking-[0.2em] rounded-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 relative overflow-hidden group/btn"
                                    >
                                        <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                                        {t('pro_dashboard.tab_setup')} <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* API Setup Modal */}
                    <AnimatePresence>
                        {
                            showSetup && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-slate-950/98 backdrop-blur-3xl"
                                >
                                    <motion.div
                                        initial={{ scale: 0.95, y: 30, opacity: 0 }}
                                        animate={{ scale: 1, y: 0, opacity: 1 }}
                                        exit={{ scale: 0.95, y: 30, opacity: 0 }}
                                        className="bg-white/95 dark:bg-slate-900/95 w-full max-w-lg rounded-[3rem] p-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] space-y-5 max-h-[92vh] flex flex-col relative overflow-hidden shadow-3xl border border-slate-200 dark:border-white/10"
                                    >
                                        <div className="absolute top-0 left-0 w-full h-px vibing-blue-animated opacity-80" />

                                        <div className="flex justify-between items-center shrink-0">
                                            <div className="flex flex-col">
                                                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
                                                    {t('pro_dashboard.tab_setup')}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500 leading-none">{t('pro_dashboard.setup.global_integration')}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { selection(); setShowSetup(false); }}
                                                className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white hover:border-indigo-500/30 active:scale-90 transition-all shadow-sm"
                                            >
                                                <ArrowLeft size={18} />
                                            </button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 pr-1 py-1">
                                            {/* Deployment Guide - Premium Steps */}
                                            <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-indigo-500/20 relative overflow-hidden group shadow-2xl">
                                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/5 dark:bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-1000" />

                                                <div className="flex items-center justify-between mb-6 relative z-10">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-center shadow-lg">
                                                            <Zap size={18} className="text-indigo-500 animate-pulse" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 leading-none mb-1">SYNC PROTOCOL</h4>
                                                            <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Global Node Deployment</p>
                                                        </div>
                                                    </div>
                                                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
                                                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest whitespace-nowrap">SECURE LINK</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-6 relative z-10">
                                                    <div className="flex gap-4">
                                                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                                                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-center text-[11px] font-black text-indigo-600 dark:text-indigo-400">01</div>
                                                            <div className="w-[2px] h-full bg-linear-to-b from-indigo-500/30 to-transparent rounded-full" />
                                                        </div>
                                                        <div className="pb-1">
                                                            <h5 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-wide mb-1.5">X Dev Environment</h5>
                                                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                                                Initialize App at <a href="https://developer.x.com" target="_blank" className="text-indigo-500 dark:text-indigo-400 underline decoration-indigo-400/30 hover:text-indigo-400 dark:hover:text-indigo-300">developer.x.com</a>. Grant <span className="text-indigo-500 dark:text-indigo-400 font-bold">Read/Write</span> access via OAuth 1.0a.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-4">
                                                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                                                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-center text-[11px] font-black text-indigo-600 dark:text-indigo-400">02</div>
                                                            <div className="w-[2px] h-full bg-linear-to-b from-indigo-500/30 to-transparent rounded-full" />
                                                        </div>
                                                        <div className="pb-1">
                                                            <h5 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-wide mb-1.5">Telegram Broadcast Node</h5>
                                                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                                                Authorize <a href={`https://t.me/${status?.bot_username || 'pintopay_probot'}`} target="_blank" rel="noreferrer" className="text-indigo-500 dark:text-indigo-400 font-bold hover:underline">@{status?.bot_username || 'pintopay_probot'}</a> as Admin in your target channel for automated cross-platform sync.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-4">
                                                        <div className="flex flex-col items-center shrink-0">
                                                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-center text-[11px] font-black text-indigo-600 dark:text-indigo-400">03</div>
                                                        </div>
                                                        <div>
                                                            <h5 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-wide mb-1.5">Protocol Verification</h5>
                                                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                                                Inject API tokens below and execute <span className="text-emerald-500 dark:text-emerald-400 font-bold">System Test</span> to verify 2026 reach capability.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* X Integration Card */}
                                            <div className="p-5 bg-white dark:bg-slate-800/40 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-xs space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-xl bg-black border border-white/10 flex items-center justify-center">
                                                            <Twitter size={14} className="text-white" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white leading-none">X (Twitter) API</span>
                                                            <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Direct Content Push</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => { selection(); handleTestIntegration('x'); }}
                                                            className="h-8 px-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:bg-indigo-500/20 transition-all active:scale-95 flex items-center gap-2"
                                                        >
                                                            <Send size={10} /> Test
                                                        </button>
                                                        <button
                                                            onClick={() => { selection(); setShowManual('setup_x'); }}
                                                            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-indigo-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-90"
                                                        >
                                                            <Info size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="grid gap-2.5">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">API Key & Secret</label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <input
                                                                type="password"
                                                                value={apiData.x_api_key}
                                                                onChange={(e) => setApiData({ ...apiData, x_api_key: e.target.value })}
                                                                placeholder="API Key"
                                                                className="h-11 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-xs font-bold outline-hidden transition-all text-slate-900 dark:text-white placeholder:opacity-20"
                                                            />
                                                            <input
                                                                type="password"
                                                                value={apiData.x_api_secret}
                                                                onChange={(e) => setApiData({ ...apiData, x_api_secret: e.target.value })}
                                                                placeholder="API Secret"
                                                                className="h-11 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-xs font-bold outline-hidden transition-all text-slate-900 dark:text-white placeholder:opacity-20"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Access Token & Secret</label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <input
                                                                type="password"
                                                                value={apiData.x_access_token}
                                                                onChange={(e) => setApiData({ ...apiData, x_access_token: e.target.value })}
                                                                placeholder="Access Token"
                                                                className="h-11 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-xs font-bold outline-hidden transition-all text-slate-900 dark:text-white placeholder:opacity-20"
                                                            />
                                                            <input
                                                                type="password"
                                                                value={apiData.x_access_token_secret}
                                                                onChange={(e) => setApiData({ ...apiData, x_access_token_secret: e.target.value })}
                                                                placeholder="Token Secret"
                                                                className="h-11 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-xs font-bold outline-hidden transition-all text-slate-900 dark:text-white placeholder:opacity-20"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Telegram Integration Card */}
                                            <div className="p-5 bg-white dark:bg-slate-800/40 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-xs space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-xl bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                                            <Send size={14} className="text-white" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white leading-none">Telegram Sync</span>
                                                            <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Multi-Channel Broadcasting</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => { selection(); handleTestIntegration('telegram'); }}
                                                            className="h-8 px-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
                                                        >
                                                            <Send size={10} /> Test
                                                        </button>
                                                        <button
                                                            onClick={() => { selection(); setShowManual('setup_tg'); }}
                                                            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-blue-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-90"
                                                        >
                                                            <Info size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="grid gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Main Channel</label>
                                                        <input
                                                            type="text"
                                                            value={apiData.telegram_channel_id}
                                                            onChange={(e) => setApiData({ ...apiData, telegram_channel_id: e.target.value })}
                                                            placeholder="@channelname (Main)"
                                                            className="w-full h-11 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-xs font-bold outline-hidden transition-all text-slate-900 dark:text-white placeholder:opacity-20"
                                                        />
                                                    </div>

                                                    {apiData.telegram_channels.length > 0 && (
                                                        <div className="space-y-2.5">
                                                            <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Additional Channels</label>
                                                            {apiData.telegram_channels.map((ch, idx) => (
                                                                <div key={idx} className="flex gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={ch}
                                                                        onChange={(e) => {
                                                                            const newChannels = [...apiData.telegram_channels];
                                                                            newChannels[idx] = e.target.value;
                                                                            setApiData({ ...apiData, telegram_channels: newChannels });
                                                                        }}
                                                                        placeholder={`@channelname ${idx + 2}`}
                                                                        className="flex-1 h-11 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-xs font-bold outline-hidden transition-all text-slate-900 dark:text-white"
                                                                    />
                                                                    <button
                                                                        onClick={() => {
                                                                            const newChannels = apiData.telegram_channels.filter((_, i) => i !== idx);
                                                                            setApiData({ ...apiData, telegram_channels: newChannels });
                                                                        }}
                                                                        className="w-11 h-11 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center active:scale-90 transition-all border border-red-500/20"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <button
                                                        onClick={() => setApiData({ ...apiData, telegram_channels: [...apiData.telegram_channels, ''] })}
                                                        className="w-full h-10 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 hover:text-indigo-500 hover:border-indigo-500/30 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Sparkles size={10} /> + Add Network Node
                                                    </button>
                                                </div>
                                            </div>

                                            {/* LinkedIn Authority Card - Compact */}
                                            <div className="p-5 bg-white dark:bg-slate-800/40 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-xs flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                                                        <div className="p-2.5 bg-blue-600/10 rounded-xl">
                                                            <Linkedin size={22} className="text-blue-600 grayscale opacity-40" />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('pro_dashboard.setup.professional_network')}</span>
                                                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded-md text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">SYNC LOCKED</span>
                                                        </div>
                                                        <p className="text-[8px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">{t('pro_dashboard.setup.linkedin_hint')}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => { selection(); setShowManual('setup_linkedin'); }}
                                                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-blue-600 hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-90"
                                                >
                                                    <Info size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pt-2 shrink-0">
                                            <button
                                                onClick={() => { selection(); handleSaveSetup(); }}
                                                className="w-full h-14 vibing-blue-animated rounded-2xl font-black text-white text-[11px] uppercase tracking-[0.25em] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:grayscale disabled:opacity-50 shadow-xl shadow-indigo-500/30"
                                                disabled={isLoading}
                                            >
                                                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                                    <span className="flex items-center gap-2">
                                                        <ShieldCheck size={16} /> {t('pro_dashboard.setup.save_btn')}
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )
                        }
                    </AnimatePresence >

                    {/* Publish Modal */}
                    <AnimatePresence>
                        {
                            showPublishModal && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-101 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/90 backdrop-blur-xl"
                                >
                                    <motion.div
                                        initial={{ scale: 0.95, y: 20, opacity: 0 }}
                                        animate={{ scale: 1, y: 0, opacity: 1 }}
                                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                                        className="glass-panel-premium w-full max-w-[340px] rounded-[2.5rem] p-6 space-y-5 relative overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl"
                                    >
                                        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />

                                        <div className="flex justify-between items-center">
                                            <div className="space-y-0.5">
                                                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">{t('pro_dashboard.publish.title')}</h3>
                                                <p className="text-[8px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em]">{t('pro_dashboard.publish.subtitle')}</p>
                                            </div>
                                            <button
                                                onClick={() => { selection(); setShowPublishModal(false); }}
                                                className="p-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 active:scale-90 transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                            >
                                                <ArrowLeft size={16} />
                                            </button>
                                        </div>

                                        <div className="space-y-5">
                                            <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 relative overflow-hidden group">
                                                <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none"><Zap size={40} /></div>
                                                <h4 className="text-[9px] font-black uppercase mb-1.5 text-indigo-500 flex items-center gap-1.5 tracking-widest">
                                                    <Info size={10} />
                                                    {t('pro_dashboard.publish.mgmt_title')}
                                                </h4>
                                                <p className="text-[10px] leading-relaxed text-slate-900 dark:text-white/70 font-medium">
                                                    {t('pro_dashboard.publish.mgmt_p')}
                                                    <em className="block mt-1 text-indigo-500/60 italic text-[9px]"> {t('pro_dashboard.publish.mgmt_tip')}</em>
                                                </p>
                                            </div>

                                            <div className="space-y-2.5">
                                                {(['telegram', 'x', 'linkedin'] as const).map((platform) => {
                                                    const isPublished = publishedPlatforms.includes(platform);
                                                    const hasSetup = status?.[`has_${platform === 'x' ? 'x' : platform}_setup` as keyof PROStatus];

                                                    return (
                                                        <button
                                                            key={platform}
                                                            disabled={!hasSetup || isPublishing || isPublished}
                                                            onClick={() => handlePublishToPlatform(platform)}
                                                            className={`w-full group relative flex items-center justify-between p-3.5 rounded-2xl border transition-all active:scale-[0.98] ${isPublished
                                                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                                                : !hasSetup
                                                                    ? 'bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-white/5 opacity-40 grayscale pointer-events-none'
                                                                    : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-white/10 hover:border-indigo-500/40 hover:bg-indigo-500/5'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${platform === 'x' ? 'bg-slate-950 border border-white/10' :
                                                                    platform === 'telegram' ? 'bg-linear-to-br from-blue-400 to-blue-600' : 'bg-linear-to-br from-blue-600 to-blue-800'
                                                                    }`}>
                                                                    {platform === 'x' && <Twitter size={16} className="text-white" />}
                                                                    {platform === 'telegram' && <Send size={16} className="text-white" />}
                                                                    {platform === 'linkedin' && <Linkedin size={16} className="text-white" />}
                                                                </div>
                                                                <div className="text-left">
                                                                    <span className="text-[12px] font-black uppercase tracking-tight text-slate-900 dark:text-white block">{platform}</span>
                                                                    <div className={`text-[8px] font-bold uppercase tracking-wider ${isPublished ? 'text-emerald-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                        {!hasSetup ? t('pro_dashboard.publish.platform_not_configured') : isPublished ? t('pro_dashboard.publish.platform_success') : t('pro_dashboard.publish.platform_tap')}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {isPublished ? (
                                                                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                                                                    <CheckCircle2 size={16} className="text-emerald-400" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-7 h-7 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/5 group-hover:border-indigo-500/30 transition-colors">
                                                                    <ChevronRight size={16} className="text-slate-500 dark:text-slate-400 group-hover:text-indigo-400 transition-colors" />
                                                                </div>
                                                            )}

                                                            {isPublishing && !isPublished && (
                                                                <div className="absolute inset-0 bg-slate-950/20 dark:bg-slate-950/40 backdrop-blur-xs rounded-2xl flex items-center justify-center">
                                                                    <Loader2 className="animate-spin w-5 h-5 text-indigo-500" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <button
                                                onClick={() => { selection(); setShowPublishModal(false); setStep(1); }}
                                                className="w-full h-11 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl font-black text-[9px] uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
                                            >
                                                {t('pro_dashboard.publish.create_another_btn')}
                                            </button>
                                            <div className="flex flex-col items-center gap-1 opacity-20">
                                                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">
                                                    {t('pro_dashboard.publish.footer')}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )
                        }
                    </AnimatePresence >

                    {/* Asset Detail Modal */}
                    <AnimatePresence>
                        {
                            selectedAsset && (
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
                                                    onClick={() => { handleCopyAnyText(selectedAsset.desc); selection(); }}
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
                            )
                        }
                    </AnimatePresence >
                    {/* Market Audit Modal */}
                    <AnimatePresence>
                        {
                            showAuditModal && marketAudit && (
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
                                        {/* Modal Header */}
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

                                        {/* Modal Content */}
                                        <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
                                            {/* CMO Summary */}
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

                                            {/* Sentiment & Flow */}
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

                                            {/* Top News Feed */}
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
                                                            animate={{ opacity: 1, x: 0 }}
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

                                            {/* Viral Motivation */}
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

                                        {/* Modal Footer */}
                                        <div className="p-8 bg-black/40 border-t border-white/10 space-y-4">
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
                            )
                        }
                    </AnimatePresence >

                    {/* Article Reader Modal */}
                    <AnimatePresence>
                        {
                            selectedArticle && (
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
                                        className="w-full max-w-lg glass-panel-premium rounded-[2.5rem] border border-white/10 overflow-hidden bg-white dark:bg-slate-900 shadow-2xl noise-overlay"
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
                            )
                        }
                    </AnimatePresence >

                    {/* Manual & Instructions Modal */}
                    <AnimatePresence>
                        {
                            showManual && (
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
                                                        <p className="text-[12px] font-black text-white uppercase tracking-tight leading-snug">
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
                            )
                        }
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
