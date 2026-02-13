import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Sparkles, Send, Globe, ChevronRight,
    ArrowLeft, Terminal, Bot, Image as ImageIcon,
    Share2, CheckCircle2, AlertCircle, Loader2,
    Lock, Instagram, Twitter, Cpu, BookOpen, Flame, Settings,
    Linkedin, Info, Copy, Download, RefreshCw, Undo2, Share, Compass
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptic } from '../hooks/useHaptic';
import { useUser } from '../context/UserContext';
import { useUI } from '../context/UIContext';
import { proService, PROStatus } from '../services/proService';
import { getApiUrl } from '../utils/api';

const renderMarkdown = (text: string) => {
    if (!text) return null;
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-indigo-500 font-bold underline">$1</a>')
        .replace(/\n/g, '<br />');
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

type Tab = 'studio' | 'tools' | 'academy';

export const ProDashboard = () => {
    const { t, i18n } = useTranslation();
    const { selection, impact, notification } = useHaptic();
    const { user } = useUser();
    const { setFooterVisible } = useUI();

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

    // API Setup State
    const [showSetup, setShowSetup] = useState(false);
    const [apiData, setApiData] = useState({
        x_api_key: '',
        x_api_secret: '',
        x_access_token: '',
        x_access_token_secret: '',
        telegram_channel_id: '',
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
        if (showSetup) {
            setFooterVisible(false);
        } else {
            setFooterVisible(true);
        }
        return () => setFooterVisible(true);
    }, [showSetup, setFooterVisible]);

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
                    linkedin_access_token: data.setup.linkedin_access_token || ''
                });
            }
        } catch (error) {
            console.error('Failed to load PRO status', error);
        } finally {
            setIsLoading(false);
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

    const handleSharePost = async () => {
        if (!generatedResult) return;
        try {
            const shareData = {
                title: generatedResult.title,
                text: generatedResult.body,
                url: window.location.href
            };
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                handleCopyText();
            }
        } catch (err) {
            console.log('Share failed', err);
        }
    };

    const handleSaveImageToDevice = async () => {
        if (!generatedResult?.image_url) return;
        const url = generatedResult.image_url.startsWith('http') ? generatedResult.image_url : `${getApiUrl().replace(/\/api$/, '')}${generatedResult.image_url}`;
        const finalUrl = url.replace('https://p2phub-production.up.railway.app/api', 'https://p2phub-production.up.railway.app');

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

    const renderTabs = () => (
        <div className="flex items-center gap-2 px-6 mb-6 overflow-x-auto no-scrollbar py-2">
            {(['studio', 'tools', 'academy'] as Tab[]).map((tab) => (
                <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); selection(); }}
                    className={`px-6 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeTab === tab
                        ? 'vibing-blue-animated text-white shadow-lg scale-105 border-blue-400/50'
                        : 'bg-(--color-bg-surface) text-(--color-text-secondary) border-(--color-border-glass) hover:border-indigo-500/30'
                        }`}
                >
                    {t(`pro_dashboard.tab_${tab}`)}
                </button>
            ))}
        </div>
    );

    if (!user?.is_pro && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-10 text-center min-h-[70vh]">
                <Lock size={64} className="text-amber-500 mb-6 opacity-20" />
                <h2 className="text-2xl font-black mb-4">{t('pro_dashboard.locked.title')}</h2>
                <p className="text-(--color-text-secondary) mb-8 max-w-xs">
                    {t('pro_dashboard.locked.desc')}
                </p>
                <button
                    onClick={() => window.location.hash = '/subscription'}
                    className="px-8 h-14 bg-linear-to-r from-amber-400 to-orange-600 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-all"
                >
                    {t('pro_dashboard.locked.upgrade_btn')}
                </button>
            </div>
        );
    }

    return (
        <div className={`flex flex-col min-h-screen ${showSetup ? 'pb-10' : 'pb-32'} bg-(--color-bg-app)`}>
            {/* Header - Premium Liquid Style */}
            <div className="px-6 pt-10 pb-6">
                <div className="flex items-center justify-between glass-panel-premium p-4 rounded-3xl border-(--color-border-glass) relative overflow-hidden group shadow-2xl">
                    <div className="absolute inset-0 bg-linear-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 animate-liquid pointer-events-none" />
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-11 h-11 rounded-2xl vibing-blue-animated flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Zap className="text-white w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-sm font-black tracking-tight leading-none uppercase text-brand-text">{t('pro_dashboard.title_studio')}</h1>
                            <div className="flex items-center gap-2 mt-1.5">
                                {status && (
                                    <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-tighter">
                                        {t('pro_dashboard.tokens_left', { count: status.pro_tokens })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => { selection(); setShowSetup(true); }}
                        className="p-3 rounded-xl bg-(--color-bg-surface) border border-(--color-border-glass) active:scale-95 transition-all shadow-sm relative z-10"
                    >
                        <Settings className="w-5 h-5 text-(--color-text-secondary)" />
                    </button>
                </div>
            </div>

            {renderTabs()}

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
                            {/* Step Progress */}
                            <div className="flex items-center justify-between px-4">
                                {[1, 2, 3].map((s) => (
                                    <div key={s} className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${step >= s ? 'bg-indigo-500 text-white' : 'bg-(--color-bg-surface) text-(--color-text-secondary)'}`}>
                                            {s}
                                        </div>
                                        {s < 3 && <div className={`w-12 h-0.5 mx-2 rounded-full ${step > s ? 'bg-indigo-500' : 'bg-(--color-border-glass)'}`} />}
                                    </div>
                                ))}
                            </div>

                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <div className="glass-panel-premium rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden group">
                                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/30 blur-[80px] pointer-events-none group-hover:bg-indigo-500/40 transition-colors" />
                                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/20 blur-[80px] pointer-events-none group-hover:bg-purple-500/30 transition-colors" />

                                        <div className="flex items-center gap-5 mb-8 relative z-10">
                                            <div className="w-12 h-12 rounded-[1.25rem] vibing-blue-animated flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(99,102,241,0.6)] shrink-0">
                                                <Terminal size={22} className="text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-400 leading-none mb-1.5">
                                                    {t('pro_dashboard.studio.matrix_title')}
                                                </h3>
                                                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest flex items-center gap-2">
                                                    {t('pro_dashboard.studio.matrix_subtitle')} <Sparkles size={10} className="text-amber-500 animate-pulse" />
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-5 relative z-10">
                                            {/* Post Type */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-indigo-400/80 ml-4 tracking-widest">{t('pro_dashboard.studio.strategy_label')}</label>
                                                <div className="relative">
                                                    <select
                                                        value={postType}
                                                        onChange={(e) => { selection(); setPostType(e.target.value); }}
                                                        className="w-full h-14 bg-black/40 border border-white/5 focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/5 rounded-2xl px-5 pr-10 text-[11px] font-bold text-white outline-hidden appearance-none transition-all cursor-pointer hover:bg-black/60 shadow-inner"
                                                    >
                                                        <option value="" disabled>{t('pro_dashboard.studio.strategy_placeholder')}</option>
                                                        {postTypes.map(pt => <option key={pt.key} value={pt.key}>{pt.label}</option>)}
                                                    </select>
                                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                                                        <ChevronRight className="rotate-90 w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Target Audience */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-pink-400/80 ml-4 tracking-widest">{t('pro_dashboard.studio.target_label')}</label>
                                                <div className="relative">
                                                    <select
                                                        value={audience}
                                                        onChange={(e) => { selection(); setAudience(e.target.value); }}
                                                        className="w-full h-14 bg-black/40 border border-white/5 focus:border-pink-500/40 focus:ring-4 focus:ring-pink-500/5 rounded-2xl px-5 pr-10 text-[11px] font-bold text-white outline-hidden appearance-none transition-all cursor-pointer hover:bg-black/60 shadow-inner"
                                                    >
                                                        <option value="" disabled>{t('pro_dashboard.studio.target_placeholder')}</option>
                                                        {audiences.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
                                                    </select>
                                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                                                        <ChevronRight className="rotate-90 w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Language */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-emerald-400/80 ml-4 tracking-widest">{t('pro_dashboard.studio.language_label')}</label>
                                                <div className="relative">
                                                    <select
                                                        value={language}
                                                        onChange={(e) => setLanguage(e.target.value)}
                                                        className="w-full h-14 bg-black/40 border border-white/5 focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/5 rounded-2xl px-5 pr-12 text-[11px] font-bold text-white outline-hidden appearance-none transition-all cursor-pointer hover:bg-black/60 shadow-inner"
                                                    >
                                                        {languages.map(l => <option key={l} value={l}>{l}</option>)}
                                                    </select>
                                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 flex items-center gap-1.5 font-black text-[10px]">
                                                        <Globe size={14} className="text-emerald-500" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { selection(); setStep(2); }}
                                        disabled={!postType || !audience}
                                        className="w-full h-16 vibing-blue-animated rounded-2xl font-black text-white text-[11px] uppercase tracking-[0.3em] shadow-[0_15px_30px_-5px_rgba(37,99,235,0.4)] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale disabled:scale-100 disabled:shadow-none"
                                    >
                                        {t('pro_dashboard.studio.initiate_btn')} <ChevronRight size={18} className="animate-bounce-x" />
                                    </button>
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
                                        <div className="py-8 flex flex-col items-center justify-center space-y-8 relative">
                                            {/* Cooking Animation */}
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl animate-pulse rounded-full" />
                                                <div className="w-28 h-28 bg-(--color-bg-surface) rounded-[2.5rem] border border-(--color-border-glass) flex items-center justify-center relative overflow-hidden shadow-2xl">
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                                        className="absolute inset-0 bg-[conic-gradient(var(--tw-gradient-stops))] from-transparent via-indigo-500/20 to-transparent opacity-60"
                                                    />
                                                    <div className="absolute inset-1.5 bg-(--color-bg-surface) rounded-[2.2rem] border border-(--color-border-glass) flex items-center justify-center z-10 shadow-sm">
                                                        <Bot className="w-12 h-12 text-indigo-500 animate-pulse" />
                                                    </div>
                                                </div>

                                                {/* Floating Particles */}
                                                {[...Array(3)].map((_, i) => (
                                                    <motion.div
                                                        key={i}
                                                        animate={{
                                                            y: [-20, -60],
                                                            x: [0, (i - 1) * 20],
                                                            opacity: [0, 1, 0],
                                                            scale: [0.5, 1, 0.5]
                                                        }}
                                                        transition={{
                                                            duration: 2.5,
                                                            repeat: Infinity,
                                                            delay: i * 0.7,
                                                            ease: "easeOut"
                                                        }}
                                                        className={`absolute -top-4 ${i === 0 ? 'left-0 text-amber-500' : i === 1 ? 'right-0 text-pink-500' : 'left-1/2 text-emerald-500'}`}
                                                    >
                                                        <Sparkles size={i === 1 ? 20 : 16} />
                                                    </motion.div>
                                                ))}
                                            </div>

                                            <div className="space-y-4 relative z-10 w-full max-w-xs">
                                                <div className="space-y-1">
                                                    <h3 className="text-lg font-black uppercase tracking-[0.3em] text-transparent bg-clip-text vibing-blue-animated bg-size-[200%_auto]">
                                                        {t('pro_dashboard.studio.cooking_title')}
                                                    </h3>
                                                    <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest opacity-60">
                                                        Deep Learning Optimization Active
                                                    </p>
                                                </div>

                                                {/* Percentage & Progress Bar */}
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-end px-1">
                                                        <span className="text-3xl font-black text-brand-text italic leading-none">
                                                            {Math.min(Math.floor(((30 - countdown) / 30) * 100), 99)}<span className="text-sm not-italic opacity-30 ml-1.5">%</span>
                                                        </span>
                                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pb-1 border-b border-indigo-500/20">
                                                            {t('pro_dashboard.studio.cooking_remaining', { count: countdown })}
                                                        </span>
                                                    </div>
                                                    <div className="h-2.5 w-full bg-(--color-bg-surface) rounded-full overflow-hidden border border-(--color-border-glass) p-0.5 shadow-inner">
                                                        <motion.div
                                                            className="h-full vibing-blue-animated rounded-full shadow-[0_0_15px_rgba(0,102,255,0.4)]"
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
                                            <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-40" />

                                            <div className="w-24 h-24 mx-auto bg-indigo-500/10 rounded-[2rem] flex items-center justify-center relative group">
                                                <Bot className="w-10 h-10 text-indigo-500 group-hover:scale-110 transition-transform duration-500" />
                                                <div className="absolute -inset-2 border border-indigo-500/20 rounded-[2.5rem] animate-pulse" />
                                                <div className="absolute inset-0 border-2 border-indigo-500/40 border-t-indigo-500 rounded-[2rem] animate-spin [animation-duration:4s]" />
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-black uppercase tracking-tight text-white">{t('pro_dashboard.studio.ready_title')}</h3>
                                                <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-400">{t('pro_dashboard.studio.ready_subtitle')}</p>
                                            </div>

                                            <div className="p-5 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                                                <p className="text-xs font-medium leading-relaxed text-brand-text/70">
                                                    {t('pro_dashboard.studio.ready_p')}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-4">
                                                <button
                                                    onClick={() => { selection(); setStep(1); }}
                                                    className="h-14 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest text-brand-muted hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                                                >
                                                    {t('pro_dashboard.studio.back_btn')}
                                                </button>
                                                <button
                                                    onClick={handleGenerate}
                                                    className="h-14 vibing-blue-animated rounded-2xl font-black text-white text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                                                >
                                                    {t('pro_dashboard.studio.go_viral_btn')} <Send size={14} className="animate-pulse" />
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
                                    <div className="glass-panel-premium rounded-[2rem] border border-(--color-border-glass) shadow-2xl overflow-hidden bg-(--color-bg-surface)/40 backdrop-blur-2xl">
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
                                                    <button onClick={handleSaveImageToDevice} className="p-4 bg-white/10 hover:bg-emerald-500 rounded-2xl border border-white/20 text-white backdrop-blur-xl transition-all shadow-lg active:scale-90">
                                                        <Download size={20} />
                                                    </button>
                                                    <button onClick={handleGenerate} className="p-4 bg-white/10 hover:bg-indigo-500 rounded-2xl border border-white/20 text-white backdrop-blur-xl transition-all shadow-lg active:scale-90">
                                                        <RefreshCw size={20} />
                                                    </button>
                                                    {historyIndex > 0 && (
                                                        <button onClick={handleUndoVersion} className="p-4 bg-white/10 hover:bg-amber-500 rounded-2xl border border-white/20 text-white backdrop-blur-xl transition-all shadow-lg active:scale-90">
                                                            <Undo2 size={20} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="absolute top-6 right-6 z-2">
                                                <span className="bg-indigo-500/90 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border border-indigo-400/30 shadow-lg shadow-indigo-500/40">{t('pro_dashboard.studio.ai_generated_badge')}</span>
                                            </div>
                                        </div>
                                        <div className="p-7 space-y-5 relative">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="space-y-2">
                                                    <h4 className="text-lg font-black leading-tight text-brand-text uppercase tracking-tight">{generatedResult.title}</h4>
                                                    <div className="h-1 w-12 vibing-blue-gradient rounded-full" />
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    <button onClick={handleCopyText} className="p-2.5 bg-(--color-bg-surface) hover:bg-indigo-500/10 rounded-xl border border-(--color-border-glass) text-brand-muted hover:text-indigo-500 transition-all active:scale-90 shadow-sm">
                                                        <Copy size={14} />
                                                    </button>
                                                    <button onClick={handleGenerate} className="p-2.5 bg-(--color-bg-surface) hover:bg-indigo-500/10 rounded-xl border border-(--color-border-glass) text-brand-muted hover:text-indigo-500 transition-all active:scale-90 shadow-sm">
                                                        <RefreshCw size={14} className={isGenerating ? "animate-spin" : ""} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-[13px] font-medium leading-relaxed text-brand-text/80 whitespace-pre-wrap selection:bg-indigo-500/20">
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
                                        <button onClick={() => { selection(); setShowPublishModal(true); }} className="h-12 vibing-blue-animated rounded-xl font-black text-white text-[10px] uppercase tracking-[0.15em] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                                            {t('pro_dashboard.studio.publish_btn')} <Send size={14} className="animate-pulse" />
                                        </button>
                                        <button onClick={() => { impact('light'); handleSharePost(); }} className="h-12 bg-(--color-bg-surface) border border-(--color-border-glass) rounded-xl font-black text-[10px] uppercase tracking-[0.15em] text-brand-muted hover:text-brand-text active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm">
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
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {/* Headline Fixer */}
                            <div className="glass-panel-premium p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden group shadow-2xl bg-grid-white/5">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                                    <Sparkles size={120} />
                                </div>
                                <div className="flex items-center gap-5 mb-8">
                                    <div className="w-14 h-14 bg-pink-500/10 rounded-2xl border border-pink-500/20 flex items-center justify-center shadow-lg shadow-pink-500/10"><Sparkles className="w-7 h-7 text-pink-500" /></div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-pink-400">{t('pro_dashboard.tools.headline.title')}</h3>
                                        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest leading-relaxed">{t('pro_dashboard.tools.headline.desc')}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <input
                                            value={headlineInput}
                                            onChange={(e) => setHeadlineInput(e.target.value)}
                                            placeholder={t('pro_dashboard.tools.headline.placeholder')}
                                            className="w-full h-16 bg-black/40 border border-white/5 focus:border-pink-500/40 focus:ring-4 focus:ring-pink-500/5 rounded-2xl px-6 text-xs font-bold outline-hidden transition-all shadow-inner"
                                        />
                                    </div>

                                    {fixedHeadline && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl relative overflow-hidden shadow-2xl"
                                        >
                                            <div className="absolute top-2 right-2"><CheckCircle2 size={12} className="text-emerald-500 opacity-40" /></div>
                                            <p className="text-sm font-black text-emerald-400 leading-relaxed italic select-all cursor-copy">"{fixedHeadline}"</p>
                                        </motion.div>
                                    )}

                                    <button
                                        onClick={() => { selection(); handleFixHeadline(); }}
                                        disabled={isFixingHeadline || !headlineInput}
                                        className="w-full h-16 bg-linear-to-r from-pink-600 to-rose-500 rounded-2xl font-black text-white text-[11px] uppercase tracking-[0.3em] shadow-[0_15px_30px_-5px_rgba(244,63,94,0.3)] active:scale-95 transition-all flex items-center justify-center disabled:opacity-30 disabled:grayscale disabled:shadow-none"
                                    >
                                        {isFixingHeadline ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                            <span className="flex items-center gap-3">
                                                {t('pro_dashboard.tools.headline.btn')} <Zap size={14} className="animate-pulse" />
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Viral Bio Generator */}
                            <div className="glass-panel-premium p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden group shadow-2xl bg-grid-white/5">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                                    <Bot size={120} />
                                </div>
                                <div className="flex items-center gap-5 mb-8">
                                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10"><Bot className="w-7 h-7 text-indigo-500" /></div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-indigo-400">{t('pro_dashboard.tools.bio.title')}</h3>
                                        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest leading-relaxed">{t('pro_dashboard.tools.bio.desc')}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <textarea
                                            value={bioInput}
                                            onChange={(e) => setBioInput(e.target.value)}
                                            placeholder={t('pro_dashboard.tools.bio.placeholder')}
                                            className="w-full h-32 bg-black/40 border border-white/5 focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/5 rounded-2xl p-6 text-xs font-bold outline-hidden transition-all shadow-inner resize-none"
                                        />
                                    </div>

                                    {fixedBio && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl relative overflow-hidden shadow-2xl"
                                        >
                                            <div className="absolute top-2 right-2"><CheckCircle2 size={12} className="text-indigo-500 opacity-40" /></div>
                                            <p className="text-xs font-medium text-brand-text/90 leading-relaxed whitespace-pre-wrap select-all cursor-copy">{fixedBio}</p>
                                        </motion.div>
                                    )}

                                    <button
                                        onClick={async () => {
                                            if (!bioInput) return;
                                            setIsFixingBio(true);
                                            selection();
                                            try {
                                                const res = await proService.generateBio(bioInput);
                                                setFixedBio(res.bio);
                                                notification('success');
                                            } catch (e) {
                                                notification('error');
                                            } finally {
                                                setIsFixingBio(false);
                                            }
                                        }}
                                        disabled={isFixingBio || !bioInput}
                                        className="w-full h-16 bg-linear-to-r from-indigo-600 to-blue-500 rounded-2xl font-black text-white text-[11px] uppercase tracking-[0.3em] shadow-[0_15px_30px_-5px_rgba(37,99,235,0.3)] active:scale-95 transition-all flex items-center justify-center disabled:opacity-30 disabled:grayscale disabled:shadow-none"
                                    >
                                        {isFixingBio ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                            <span className="flex items-center gap-3">
                                                {t('pro_dashboard.tools.bio.btn')} <Terminal size={14} className="animate-pulse" />
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Trend Hunter */}
                            <div className="glass-panel-premium p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden group shadow-2xl bg-grid-white/5">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                                    <Flame size={120} />
                                </div>
                                <div className="flex items-center gap-5 mb-8">
                                    <div className="w-14 h-14 bg-orange-500/10 rounded-2xl border border-orange-500/20 flex items-center justify-center shadow-lg shadow-orange-500/10"><Flame className="w-7 h-7 text-orange-500" /></div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-orange-400">{t('pro_dashboard.tools.trends.title')}</h3>
                                        <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest leading-relaxed">{t('pro_dashboard.tools.trends.desc')}</p>
                                    </div>
                                </div>

                                {trends.length > 0 && (
                                    <div className="space-y-3 mb-6">
                                        {trends.map((trend, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-default group/item"
                                            >
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-xs font-black text-orange-400 uppercase tracking-tight flex items-center gap-2">
                                                        <span className="w-5 h-5 bg-orange-500/20 rounded-md flex items-center justify-center text-[10px]">{i + 1}</span>
                                                        {trend.topic}
                                                    </span>
                                                    <div className="h-1 w-8 bg-orange-500/20 rounded-full overflow-hidden">
                                                        <div className="h-full bg-orange-500 w-2/3" />
                                                    </div>
                                                </div>
                                                <p className="text-[11px] font-medium text-brand-text/70 leading-relaxed italic">{trend.viral_angle}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={() => { selection(); handleFetchTrends(); }}
                                    disabled={isHuntingTrends}
                                    className="w-full h-16 bg-linear-to-r from-orange-600 to-amber-500 rounded-2xl font-black text-white text-[11px] uppercase tracking-[0.3em] shadow-[0_15px_30px_-5px_rgba(245,158,11,0.3)] active:scale-95 transition-all flex items-center justify-center disabled:opacity-30 disabled:grayscale disabled:shadow-none"
                                >
                                    {isHuntingTrends ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                        <span className="flex items-center gap-3">
                                            {t('pro_dashboard.tools.trends.btn')} <Compass size={14} className="animate-spin [animation-duration:3s]" />
                                        </span>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ACADEMY TAB */}
                    {activeTab === 'academy' && (
                        <motion.div
                            key="academy"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="glass-panel-premium p-4 rounded-2xl border border-indigo-500/20 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />
                                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1 relative z-1">{t('pro_dashboard.academy.protocol_rank')}</h3>
                                <p className="text-2xl font-black text-indigo-500 relative z-1 tracking-tight">{t('pro_dashboard.academy.rank_name')}</p>
                            </div>

                            {['hook_rule', 'algorithm', 'psycho'].map((key) => (
                                <div key={key} className="glass-panel-premium p-5 rounded-[2rem] border border-(--color-border-glass) relative overflow-hidden group active:scale-[0.98] transition-all">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                                        <BookOpen className="w-16 h-16" />
                                    </div>
                                    <h4 className="text-xs font-black uppercase mb-1 tracking-tight text-brand-text">{t(`pro_dashboard.academy.${key}.title`)}</h4>
                                    <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest mb-3">{t(`pro_dashboard.academy.${key}.desc`)}</p>
                                    <div className="p-4 bg-white/5 dark:bg-black/20 rounded-2xl border border-white/5">
                                        <p className="text-[11px] font-medium leading-relaxed opacity-80">{t(`pro_dashboard.academy.${key}.content`)}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Hook Library */}
                            <div className="glass-panel-premium p-8 rounded-[3rem] border border-white/10 hover:border-indigo-500/30 transition-all group overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-8 opacity-5"><Zap size={100} /></div>
                                <div className="flex items-center gap-5 mb-8">
                                    <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20 shadow-xl"><Zap className="w-8 h-8 text-yellow-400" /></div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tight text-white">{t('pro_dashboard.academy.hooks.title')}</h3>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t('pro_dashboard.academy.hooks.subtitle')}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {((t('pro_dashboard.academy.hooks.items', { returnObjects: true }) as any[]) || []).map((hook: any, idx: number) => (
                                        <div key={idx} className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-2 group/hook hover:bg-white/10 transition-all">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full uppercase tracking-widest">{hook.category}</span>
                                                <Copy
                                                    size={12}
                                                    className="text-brand-muted hover:text-white cursor-pointer transition-colors"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(hook.template);
                                                        notification('success');
                                                    }}
                                                />
                                            </div>
                                            <p className="text-xs font-black text-white italic">"{hook.template}"</p>
                                            <p className="text-[10px] text-brand-muted leading-relaxed">{hook.explanation}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* API Setup Modal */}
            <AnimatePresence>
                {showSetup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-101 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 30, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-6 space-y-4 max-h-[92vh] flex flex-col relative overflow-hidden shadow-2xl border border-black/5 dark:border-white/10"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-30" />

                            <div className="flex justify-between items-center shrink-0">
                                <div className="flex flex-col">
                                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white">
                                        {t('pro_dashboard.tab_setup')}
                                    </h3>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 leading-none">{t('pro_dashboard.setup.global_integration')}</span>
                                </div>
                                <button
                                    onClick={() => { selection(); setShowSetup(false); }}
                                    className="p-2.5 bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl opacity-80 hover:opacity-100 active:scale-90 transition-all text-slate-600 dark:text-white"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pr-1">
                                {/* X Integration */}
                                <div className="space-y-4 p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-indigo-400/60">
                                            <Twitter size={12} className="text-blue-400" /> {t('pro_dashboard.setup.x_integration')}
                                        </div>
                                        {status?.has_x_setup && (
                                            <button
                                                onClick={() => handleTestIntegration('x')}
                                                className="text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded-full"
                                            >
                                                <Zap size={10} /> TEST
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <div className="grid gap-2">
                                            <input
                                                type="password"
                                                value={apiData.x_api_key}
                                                onChange={(e) => setApiData({ ...apiData, x_api_key: e.target.value })}
                                                placeholder="X API Key"
                                                className="w-full h-11 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:border-indigo-500/50 rounded-xl px-4 text-xs font-bold outline-hidden transition-all dark:text-white"
                                            />
                                            <input
                                                type="password"
                                                value={apiData.x_api_secret}
                                                onChange={(e) => setApiData({ ...apiData, x_api_secret: e.target.value })}
                                                placeholder="X API Secret"
                                                className="w-full h-11 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:border-indigo-500/50 rounded-xl px-4 text-xs font-bold outline-hidden transition-all dark:text-white"
                                            />
                                            <input
                                                type="password"
                                                value={apiData.x_access_token}
                                                onChange={(e) => setApiData({ ...apiData, x_access_token: e.target.value })}
                                                placeholder="X Access Token"
                                                className="w-full h-11 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:border-indigo-500/50 rounded-xl px-4 text-xs font-bold outline-hidden transition-all dark:text-white"
                                            />
                                            <input
                                                type="password"
                                                value={apiData.x_access_token_secret}
                                                onChange={(e) => setApiData({ ...apiData, x_access_token_secret: e.target.value })}
                                                placeholder="X Token Secret"
                                                className="w-full h-11 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:border-indigo-500/50 rounded-xl px-4 text-xs font-bold outline-hidden transition-all dark:text-white"
                                            />
                                        </div>
                                        <div className="p-3 bg-white dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5 space-y-1">
                                            <div className="text-[9px] font-black uppercase text-indigo-500 tracking-tighter">Instructions:</div>
                                            <p className="text-[10px] text-slate-500 dark:text-brand-muted leading-relaxed font-medium">{t('pro_dashboard.setup.x_hint')}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Telegram Sync */}
                                <div className="space-y-4 p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-indigo-400/60">
                                            <Send size={12} className="text-blue-500" /> {t('pro_dashboard.setup.tg_sync')}
                                        </div>
                                        {status?.has_telegram_setup && (
                                            <button
                                                onClick={() => handleTestIntegration('telegram')}
                                                className="text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded-full"
                                            >
                                                <Zap size={10} /> TEST
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={apiData.telegram_channel_id}
                                        onChange={(e) => setApiData({ ...apiData, telegram_channel_id: e.target.value })}
                                        placeholder="@channelname or -100..."
                                        className="w-full h-11 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:border-indigo-500/50 rounded-xl px-4 text-xs font-bold outline-hidden transition-all dark:text-white"
                                    />
                                    <div className="p-3 bg-white dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5 space-y-1">
                                        <div className="text-[9px] font-black uppercase text-indigo-500 tracking-tighter">Instructions:</div>
                                        <p className="text-[10px] text-slate-500 dark:text-brand-muted leading-relaxed font-medium">{t('pro_dashboard.setup.tg_hint')}</p>
                                    </div>
                                </div>

                                {/* LinkedIn INTEGRATION */}
                                <div className="space-y-4 p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-indigo-400/60">
                                            <Linkedin size={12} className="text-blue-700" /> {t('pro_dashboard.setup.professional_network')}
                                        </div>
                                        {status?.has_linkedin_setup && (
                                            <button
                                                onClick={() => handleTestIntegration('linkedin')}
                                                className="text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded-full"
                                            >
                                                <Zap size={10} /> TEST
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="password"
                                        value={apiData.linkedin_access_token}
                                        onChange={(e) => setApiData({ ...apiData, linkedin_access_token: e.target.value })}
                                        placeholder="LinkedIn Access Token"
                                        className="w-full h-11 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:border-indigo-500/50 rounded-xl px-4 text-xs font-bold outline-hidden transition-all dark:text-white"
                                    />
                                    <div className="p-3 bg-white dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5 space-y-1">
                                        <div className="text-[9px] font-black uppercase text-indigo-500 tracking-tighter">Instructions:</div>
                                        <p className="text-[10px] text-slate-500 dark:text-brand-muted leading-relaxed font-medium">{t('pro_dashboard.setup.linkedin_hint')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 shrink-0">
                                <button
                                    onClick={() => { selection(); handleSaveSetup(); }}
                                    className="w-full h-14 bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all text-white"
                                >
                                    {t('pro_dashboard.setup.save_btn')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Publish Modal */}
            <AnimatePresence>
                {showPublishModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-101 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 30, opacity: 0 }}
                            className="glass-panel-premium w-full max-w-sm rounded-[3rem] p-10 space-y-8 relative overflow-hidden border border-white/10 shadow-3xl"
                        >
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />

                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black uppercase tracking-tight text-white">{t('pro_dashboard.publish.title')}</h3>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{t('pro_dashboard.publish.subtitle')}</p>
                                </div>
                                <button
                                    onClick={() => { selection(); setShowPublishModal(false); }}
                                    className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 active:scale-90 transition-all text-brand-muted hover:text-white"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 relative overflow-hidden group shadow-inner">
                                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700"><Zap size={60} /></div>
                                    <h4 className="text-[10px] font-black uppercase mb-2 text-indigo-500 flex items-center gap-2 tracking-widest">
                                        <Info size={12} />
                                        {t('pro_dashboard.publish.mgmt_title')}
                                    </h4>
                                    <p className="text-[11px] leading-relaxed text-brand-text/70 font-medium">
                                        {t('pro_dashboard.publish.mgmt_p')}
                                        <em className="block mt-1 text-indigo-500/60 italic"> {t('pro_dashboard.publish.mgmt_tip')}</em>
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {(['telegram', 'x', 'linkedin'] as const).map((platform) => {
                                        const isPublished = publishedPlatforms.includes(platform);
                                        const hasSetup = status?.[`has_${platform === 'x' ? 'x' : platform}_setup` as keyof PROStatus];

                                        return (
                                            <button
                                                key={platform}
                                                disabled={!hasSetup || isPublishing || isPublished}
                                                onClick={() => handlePublishToPlatform(platform)}
                                                className={`w-full group relative flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${isPublished
                                                    ? 'bg-emerald-500/10 border-emerald-500/30'
                                                    : !hasSetup
                                                        ? 'bg-(--color-bg-surface)/40 border-(--color-border-glass) opacity-40 grayscale pointer-events-none'
                                                        : 'bg-(--color-bg-surface) border-(--color-border-glass) hover:border-indigo-500/40 hover:bg-indigo-500/5'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3.5">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${platform === 'x' ? 'bg-slate-950 border border-white/10' :
                                                        platform === 'telegram' ? 'bg-linear-to-br from-blue-400 to-blue-600' : 'bg-linear-to-br from-blue-600 to-blue-800'
                                                        }`}>
                                                        {platform === 'x' && <Twitter size={18} className="text-white" />}
                                                        {platform === 'telegram' && <Send size={18} className="text-white" />}
                                                        {platform === 'linkedin' && <Linkedin size={18} className="text-white" />}
                                                    </div>
                                                    <div className="text-left space-y-0.5">
                                                        <span className="text-[13px] font-black uppercase tracking-tight text-brand-text">{platform}</span>
                                                        <div className={`text-[9px] font-bold uppercase tracking-wider ${isPublished ? 'text-emerald-500' : 'text-brand-muted'}`}>
                                                            {!hasSetup ? t('pro_dashboard.publish.platform_not_configured') : isPublished ? t('pro_dashboard.publish.platform_success') : t('pro_dashboard.publish.platform_tap')}
                                                        </div>
                                                    </div>
                                                </div>
                                                {isPublished ? (
                                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                                                        <CheckCircle2 size={18} className="text-emerald-400" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-indigo-500/30 transition-colors">
                                                        <ChevronRight size={18} className="text-brand-muted group-hover:text-indigo-400 transition-colors" />
                                                    </div>
                                                )}

                                                {isPublishing && !isPublished && (
                                                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs rounded-[1.5rem] flex items-center justify-center">
                                                        <Loader2 className="animate-spin w-6 h-6 text-indigo-500" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4">
                                <button
                                    onClick={() => { selection(); setShowPublishModal(false); setStep(1); }}
                                    className="w-full h-12 bg-(--color-bg-surface) border border-(--color-border-glass) rounded-xl font-black text-[10px] uppercase tracking-[0.15em] text-brand-muted hover:text-brand-text transition-all active:scale-95 shadow-sm"
                                >
                                    {t('pro_dashboard.publish.create_another_btn')}
                                </button>
                                <div className="flex flex-col items-center gap-1 opacity-30">
                                    <div className="h-px w-12 bg-white/20 mb-1" />
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em]">
                                        {t('pro_dashboard.publish.footer')}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
