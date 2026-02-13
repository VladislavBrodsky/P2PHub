import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Sparkles, Send, Globe, ChevronRight,
    ArrowLeft, Terminal, Bot, Image as ImageIcon,
    Share2, CheckCircle2, AlertCircle, Loader2,
    Lock, Instagram, Twitter, Cpu, BookOpen, Flame, Settings,
    Linkedin, Info, Copy, Download, RefreshCw, Undo2, Share
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

    const postTypes = ["Viral Strategy", "Financial Shift", "Growth Hack", "Wealth Creation", "Tech Insider", "Digital Nomad Lifestyle"];
    const audiences = ["Crypto Investors", "Digital Nomads", "Freelancers", "E-commerce Owners", "Tech Enthusiasts", "High-Net-Worth Individuals"];
    const languages = ["English", "Russian", "Spanish", "French", "German", "Portuguese", "Chinese", "Japanese", "Arabic", "Hindi"];

    const renderTabs = () => (
        <div className="flex items-center gap-2 px-6 mb-6 overflow-x-auto no-scrollbar">
            {(['studio', 'tools', 'academy'] as Tab[]).map((tab) => (
                <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); selection(); }}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wide transition-all whitespace-nowrap ${activeTab === tab
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                        : 'bg-(--color-bg-surface) text-(--color-text-secondary) border border-(--color-border-glass)'
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
                <h2 className="text-2xl font-black mb-4">PRO MEMBERS ONLY</h2>
                <p className="text-(--color-text-secondary) mb-8 max-w-xs">
                    Unlock the Viral Marketing Studio and Autocontent creation by upgrading to PRO.
                </p>
                <button
                    onClick={() => window.location.hash = '/subscription'}
                    className="px-8 h-14 bg-linear-to-r from-amber-400 to-orange-600 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-all"
                >
                    Upgrade Now
                </button>
            </div>
        );
    }

    return (
        <div className={`flex flex-col min-h-screen ${showSetup ? 'pb-10' : 'pb-32'}`}>
            {/* Header */}
            <div className="px-6 pt-12 pb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-700 shadow-xl shadow-indigo-500/20">
                        <Zap className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight leading-none uppercase">{t('pro_dashboard.title_studio')}</h1>
                        <div className="flex items-center gap-2 mt-1.5">
                            {status && (
                                <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                    {t('pro_dashboard.tokens_left', { count: status.pro_tokens })}
                                </span>
                            )}
                            {status && !status.capabilities?.text_generation && (
                                <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                    {t('pro_dashboard.system_offline')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setShowSetup(true)}
                    className="p-3 rounded-2xl bg-(--color-bg-surface) border border-(--color-border-glass) active:scale-90 transition-transform"
                >
                    <Settings className="w-5 h-5 text-(--color-text-secondary)" />
                </button>
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
                                    <div className="glass-panel-premium rounded-[2rem] p-5 relative overflow-hidden">
                                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/20 blur-[60px] pointer-events-none" />
                                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/10 blur-[60px] pointer-events-none" />

                                        <div className="flex items-center gap-4 mb-6 relative z-10">
                                            <div className="w-10 h-10 rounded-2xl vibing-blue-animated flex items-center justify-center shadow-lg shadow-indigo-500/40 shrink-0 animate-pulse">
                                                <Terminal size={20} className="text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 leading-none mb-1">
                                                    Configuration Matrix
                                                </h3>
                                                <p className="text-[9px] font-bold text-(--color-text-secondary) uppercase tracking-wider opacity-70 flex items-center gap-1">
                                                    Synthesize Selection <Sparkles size={8} className="text-amber-500 animate-pulse" />
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {/* Post Type */}
                                            <div className="relative group">
                                                <label className="text-[9px] font-black uppercase text-indigo-500 ml-3 mb-1 block tracking-wider">Strategy</label>
                                                <div className="relative">
                                                    <select
                                                        value={postType}
                                                        onChange={(e) => { selection(); setPostType(e.target.value); }}
                                                        className="w-full h-12 bg-black/5 dark:bg-white/5 border border-transparent focus:border-indigo-500/50 rounded-xl px-4 pr-10 text-xs font-bold outline-hidden appearance-none transition-all cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
                                                    >
                                                        <option value="" disabled>Select Viral Strategy</option>
                                                        {postTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                        <ChevronRight className="rotate-90 w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Target Audience */}
                                            <div className="relative group">
                                                <label className="text-[9px] font-black uppercase text-pink-500 ml-3 mb-1 block tracking-wider">Target</label>
                                                <div className="relative">
                                                    <select
                                                        value={audience}
                                                        onChange={(e) => { selection(); setAudience(e.target.value); }}
                                                        className="w-full h-12 bg-black/5 dark:bg-white/5 border border-transparent focus:border-pink-500/50 rounded-xl px-4 pr-10 text-xs font-bold outline-hidden appearance-none transition-all cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
                                                    >
                                                        <option value="" disabled>Select Audience</option>
                                                        {audiences.map(a => <option key={a} value={a}>{a}</option>)}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                        <ChevronRight className="rotate-90 w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Language */}
                                            <div className="relative group">
                                                <label className="text-[9px] font-black uppercase text-emerald-500 ml-3 mb-1 block tracking-wider">Language</label>
                                                <div className="relative">
                                                    <select
                                                        value={language}
                                                        onChange={(e) => setLanguage(e.target.value)}
                                                        className="w-full h-12 bg-black/5 dark:bg-white/5 border border-transparent focus:border-emerald-500/50 rounded-xl px-4 pr-10 text-xs font-bold outline-hidden appearance-none transition-all cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
                                                    >
                                                        {languages.map(l => <option key={l} value={l}>{l}</option>)}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                        <Globe size={14} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => { selection(); setStep(2); }}
                                        disabled={!postType || !audience}
                                        className="w-full h-12 vibing-blue-animated rounded-xl font-black text-white text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale disabled:scale-100"
                                    >
                                        INITIATE AI AGENT <ChevronRight size={14} />
                                    </button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="glass-panel-premium rounded-[2rem] p-6 text-center space-y-5 relative overflow-hidden"
                                >
                                    {isGenerating ? (
                                        <div className="py-10 flex flex-col items-center justify-center space-y-6 relative">
                                            {/* Cooking Animation */}
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-indigo-500/20 blur-xl animate-pulse rounded-full" />
                                                <div className="w-24 h-24 bg-black/20 rounded-full border border-indigo-500/30 flex items-center justify-center relative overflow-hidden">
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                                        className="absolute inset-0 bg-[conic-gradient(var(--tw-gradient-stops))] from-transparent via-indigo-500/50 to-transparent opacity-50"
                                                    />
                                                    <Bot className="w-10 h-10 text-indigo-400 relative z-10 animate-pulse" />
                                                </div>

                                                {/* Floating Particles */}
                                                <motion.div
                                                    animate={{ y: [-10, -20], opacity: [0, 1, 0] }}
                                                    transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                                                    className="absolute -top-4 right-0 text-amber-400"
                                                >
                                                    <Sparkles size={16} />
                                                </motion.div>
                                                <motion.div
                                                    animate={{ y: [-5, -15], opacity: [0, 1, 0] }}
                                                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
                                                    className="absolute -top-2 left-0 text-pink-400"
                                                >
                                                    <Sparkles size={12} />
                                                </motion.div>
                                            </div>

                                            <div className="space-y-2 relative z-10 w-full max-w-[200px]">
                                                <h3 className="text-sm font-black uppercase tracking-widest text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-400 animate-pulse">
                                                    Cooking Viral Post...
                                                </h3>

                                                {/* Percentage & Progress Bar */}
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className="text-2xl font-black text-white px-2">
                                                        {Math.min(Math.floor(((30 - countdown) / 30) * 100), 99)}%
                                                    </span>
                                                    <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden border border-white/5">
                                                        <motion.div
                                                            className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500"
                                                            initial={{ width: "0%" }}
                                                            animate={{ width: `${Math.min(((30 - countdown) / 30) * 100, 99)}%` }}
                                                            transition={{ duration: 0.5 }}
                                                        />
                                                    </div>
                                                </div>

                                                <p className="text-[9px] font-bold text-indigo-300/60 uppercase tracking-widest pt-2">
                                                    Synthesizing Context • {countdown}s remaining
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-20" />

                                            <div className="w-16 h-16 mx-auto bg-indigo-500/10 rounded-2xl flex items-center justify-center relative group">
                                                <Bot className="w-7 h-7 text-indigo-500 group-hover:scale-110 transition-transform" />
                                                <div className="absolute -inset-1 border border-indigo-500/30 rounded-2xl animate-pulse" />
                                                <div className="absolute inset-0 border-2 border-indigo-500 border-t-transparent rounded-2xl animate-spin [animation-duration:3s]" />
                                            </div>

                                            <div className="space-y-1">
                                                <h3 className="text-lg font-black uppercase tracking-tight text-brand-text">AI CMO READY</h3>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Quantum Synthesis Active</p>
                                            </div>

                                            <div className="p-3 bg-white/5 dark:bg-black/20 rounded-xl border border-white/10">
                                                <p className="text-[11px] font-medium leading-relaxed opacity-70">
                                                    Our agent is ready to synthesize 2026 viral narratives specifically for your audience.
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                <button
                                                    onClick={() => { selection(); setStep(1); }}
                                                    className="h-11 bg-(--color-bg-surface) border border-(--color-border-glass) rounded-xl font-black text-[10px] uppercase tracking-wider active:scale-95 transition-all"
                                                >
                                                    BACK
                                                </button>
                                                <button
                                                    onClick={handleGenerate}
                                                    className="h-11 vibing-blue-animated rounded-xl font-black text-white text-[10px] uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                                                >
                                                    GO VIRAL <Send size={12} />
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
                                    <div className="glass-panel-premium rounded-[2rem] overflow-hidden">
                                        <div className="aspect-video bg-indigo-950/20 relative flex items-center justify-center overflow-hidden group/img">
                                            <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/60 z-1" />
                                            {generatedResult.image_url ? (
                                                <img src={generatedResult.image_url.startsWith('http') ? generatedResult.image_url : `${getApiUrl().replace(/\/api$/, '')}${generatedResult.image_url}`} alt="Viral" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="p-6 text-center z-2">
                                                    <ImageIcon className="w-10 h-10 text-indigo-500 mx-auto mb-3 opacity-50" />
                                                    <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-300 font-bold">{generatedResult.image_prompt}</p>
                                                </div>
                                            )}

                                            {/* Image Actions Overlay */}
                                            <div className="absolute inset-0 z-2 opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/40 backdrop-blur-xs flex items-center justify-center gap-4">
                                                <button onClick={handleSaveImageToDevice} className="p-3 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 text-white backdrop-blur-md transition-all">
                                                    <Download size={20} />
                                                </button>
                                                <button onClick={handleGenerate} className="p-3 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 text-white backdrop-blur-md transition-all">
                                                    <RefreshCw size={20} />
                                                </button>
                                                {historyIndex > 0 && (
                                                    <button onClick={handleUndoVersion} className="p-3 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 text-white backdrop-blur-md transition-all">
                                                        <Undo2 size={20} />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="absolute top-4 right-4 z-2">
                                                <span className="bg-indigo-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest">AI Generated</span>
                                            </div>
                                        </div>
                                        <div className="p-6 space-y-4 relative">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <h4 className="text-base font-black leading-tight text-brand-text uppercase tracking-tight">{generatedResult.title}</h4>
                                                    <div className="h-0.5 w-12 bg-indigo-500 rounded-full" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={handleCopyText} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-brand-muted transition-all">
                                                        <Copy size={14} />
                                                    </button>
                                                    <button onClick={handleGenerate} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-brand-muted transition-all">
                                                        <RefreshCw size={14} className={isGenerating ? "animate-spin" : ""} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-xs font-medium leading-relaxed opacity-80 whitespace-pre-wrap">
                                                {renderMarkdown(generatedResult.body)}
                                            </div>
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {generatedResult.hashtags?.map((t: string) => (
                                                    <span key={t} className="text-[9px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">#{t}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => { selection(); setShowPublishModal(true); }} className="h-11 vibing-blue-animated rounded-xl font-black text-white text-[10px] uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                                            PUBLISH <Send size={12} />
                                        </button>
                                        <button onClick={() => { impact('light'); handleSharePost(); }} className="h-11 bg-(--color-bg-surface) border border-(--color-border-glass) rounded-xl font-black text-[10px] uppercase tracking-wider active:scale-95 transition-all">
                                            SHARE POST <Share size={12} />
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
                            <div className="glass-panel-premium p-6 rounded-[2rem] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Sparkles size={60} />
                                </div>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2.5 bg-pink-500/10 rounded-xl border border-pink-500/20"><Sparkles className="w-5 h-5 text-pink-500" /></div>
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{t('pro_dashboard.tools.headline.title')}</h3>
                                        <p className="text-[10px] opacity-60 font-medium">{t('pro_dashboard.tools.headline.desc')}</p>
                                    </div>
                                </div>
                                <input
                                    value={headlineInput}
                                    onChange={(e) => setHeadlineInput(e.target.value)}
                                    placeholder={t('pro_dashboard.tools.headline.placeholder')}
                                    className="w-full h-11 bg-white/5 dark:bg-black/20 border border-white/10 rounded-xl px-4 text-xs font-bold mb-4 outline-hidden focus:border-pink-500/50 transition-all"
                                />
                                {fixedHeadline && (
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-3">
                                        <p className="text-xs font-black text-emerald-500">{fixedHeadline}</p>
                                    </div>
                                )}
                                <button
                                    onClick={() => { selection(); handleFixHeadline(); }}
                                    disabled={isFixingHeadline || !headlineInput}
                                    className="w-full h-11 bg-pink-500 rounded-xl font-black text-white text-[10px] uppercase tracking-wider shadow-lg shadow-pink-500/20 active:scale-95 transition-all flex items-center justify-center disabled:opacity-30 disabled:grayscale"
                                >
                                    {isFixingHeadline ? <Loader2 className="animate-spin w-4 h-4" /> : t('pro_dashboard.tools.headline.btn')}
                                </button>
                            </div>

                            {/* Trend Hunter */}
                            <div className="glass-panel-premium p-6 rounded-[2rem] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Flame size={60} />
                                </div>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/20"><Flame className="w-5 h-5 text-orange-500" /></div>
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{t('pro_dashboard.tools.trends.title')}</h3>
                                        <p className="text-[10px] opacity-60 font-medium">{t('pro_dashboard.tools.trends.desc')}</p>
                                    </div>
                                </div>
                                {trends.length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        {trends.map((trend, i) => (
                                            <div key={i} className="p-3 bg-black/5 dark:bg-white/5 rounded-xl">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-black text-orange-500">#{i + 1} {trend.topic}</span>
                                                </div>
                                                <p className="text-[10px] font-medium opacity-70">{trend.viral_angle}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <button
                                    onClick={() => { selection(); handleFetchTrends(); }}
                                    disabled={isHuntingTrends}
                                    className="w-full h-11 bg-orange-500 rounded-xl font-black text-white text-[10px] uppercase tracking-wider shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center disabled:opacity-30 disabled:grayscale"
                                >
                                    {isHuntingTrends ? <Loader2 className="animate-spin w-4 h-4" /> : t('pro_dashboard.tools.trends.btn')}
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
                                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1 relative z-1">Current Protocol Rank</h3>
                                <p className="text-2xl font-black text-indigo-500 relative z-1 tracking-tight">GRANDMASTER</p>
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
                        className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                selection();
                                setShowSetup(false);
                            }
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 30, opacity: 0 }}
                            className="glass-panel-premium w-full max-w-sm rounded-[2.5rem] p-6 space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 via-transparent to-indigo-500 opacity-20" />

                            <div className="flex justify-between items-center">
                                <div className="flex flex-col">
                                    <h3 className="text-xl font-black uppercase tracking-tight text-brand-text">
                                        {t('pro_dashboard.tab_setup')}
                                    </h3>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500/60 leading-none">Global Integration</span>
                                </div>
                                <button
                                    onClick={() => { selection(); setShowSetup(false); }}
                                    className="p-2.5 bg-white/5 dark:bg-white/5 border border-white/10 rounded-xl opacity-80 hover:opacity-100 active:scale-90 transition-all"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl relative overflow-hidden">
                                    <div className="absolute -right-2 -top-2 opacity-10"><Info size={40} /></div>
                                    <h4 className="text-[10px] font-black uppercase text-indigo-500 mb-2 flex items-center gap-2">
                                        <Zap size={10} /> Protocol Instructions
                                    </h4>
                                    <div className="space-y-1.5">
                                        {[
                                            "Get X API credentials from Dev Portal",
                                            "Add Bot as Admin to your Telegram Channel",
                                            "Sync keys to enable automated viral reach"
                                        ].map((step, idx) => (
                                            <div key={idx} className="flex gap-2 text-[10px] font-bold text-brand-text/70">
                                                <span className="text-indigo-500">{idx + 1}.</span>
                                                <span className="leading-tight">{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 px-2 text-[10px] font-black uppercase tracking-widest opacity-40">
                                            <Twitter size={10} className="text-blue-400" /> X Integration
                                        </div>
                                        <div className="grid gap-2">
                                            <input
                                                type="password"
                                                value={apiData.x_api_key}
                                                onChange={(e) => setApiData({ ...apiData, x_api_key: e.target.value })}
                                                placeholder="X API Key"
                                                className="w-full h-11 bg-white/5 dark:bg-black/20 border border-white/10 focus:border-indigo-500/50 rounded-xl px-4 text-xs font-bold outline-hidden transition-all"
                                            />
                                            <input
                                                type="password"
                                                value={apiData.x_access_token}
                                                onChange={(e) => setApiData({ ...apiData, x_access_token: e.target.value })}
                                                placeholder="X Access Token"
                                                className="w-full h-11 bg-white/5 dark:bg-black/20 border border-white/10 focus:border-indigo-500/50 rounded-xl px-4 text-xs font-bold outline-hidden transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 px-2 text-[10px] font-black uppercase tracking-widest opacity-40">
                                            <Send size={10} className="text-blue-500" /> Telegram Sync
                                        </div>
                                        <input
                                            type="text"
                                            value={apiData.telegram_channel_id}
                                            onChange={(e) => setApiData({ ...apiData, telegram_channel_id: e.target.value })}
                                            placeholder="@channelname or -100..."
                                            className="w-full h-11 bg-white/5 dark:bg-black/20 border border-white/10 focus:border-indigo-500/50 rounded-xl px-4 text-xs font-bold outline-hidden transition-all"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 px-2 text-[10px] font-black uppercase tracking-widest opacity-40">
                                            <Linkedin size={10} className="text-blue-700" /> Professional Network
                                        </div>
                                        <input
                                            type="password"
                                            value={apiData.linkedin_access_token}
                                            onChange={(e) => setApiData({ ...apiData, linkedin_access_token: e.target.value })}
                                            placeholder="LinkedIn Access Token"
                                            className="w-full h-11 bg-white/5 dark:bg-black/20 border border-white/10 focus:border-indigo-500/50 rounded-xl px-4 text-xs font-bold outline-hidden transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => { selection(); handleSaveSetup(); }}
                                className="w-full h-12 vibing-blue-animated rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all text-white mt-4"
                            >
                                SAVE PROTOCOL CONFIG
                            </button>
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
                            className="glass-panel-premium w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />

                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight text-brand-text">OmniPublish</h3>
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1 italic">PRO Protocol Active</p>
                                </div>
                                <button
                                    onClick={() => setShowPublishModal(false)}
                                    className="p-2 bg-white/5 border border-white/10 rounded-xl active:scale-90 transition-all"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <h4 className="text-[10px] font-black uppercase mb-3 text-brand-muted flex items-center gap-2">
                                        <Info size={12} className="text-indigo-500" />
                                        PRO Content Management
                                    </h4>
                                    <p className="text-[11px] leading-relaxed opacity-70">
                                        Select your target platforms. Our AI agents will use your connected API keys to push this content instantly.
                                        <em> Tip: Publishing across multiple platforms increases viral probability by 400%.</em>
                                    </p>
                                </div>

                                <div className="space-y-2">
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
                                                            ? 'bg-white/5 border-white/5 opacity-40 grayscale pointer-events-none'
                                                            : 'bg-white/5 border-white/10 hover:border-indigo-500/50 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${platform === 'x' ? 'bg-slate-900' :
                                                            platform === 'telegram' ? 'bg-blue-500' : 'bg-blue-700'
                                                        }`}>
                                                        {platform === 'x' && <Twitter size={16} className="text-white" />}
                                                        {platform === 'telegram' && <Send size={16} className="text-white" />}
                                                        {platform === 'linkedin' && <Linkedin size={16} className="text-white" />}
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="text-xs font-black uppercase text-brand-text">{platform}</span>
                                                        <div className="text-[9px] font-bold text-brand-muted leading-tight">
                                                            {!hasSetup ? 'NOT CONFIGURED' : isPublished ? 'POSTED SUCCESSFULLY' : 'TAP TO PUBLISH'}
                                                        </div>
                                                    </div>
                                                </div>
                                                {isPublished ? (
                                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                                ) : (
                                                    <ChevronRight size={16} className="text-brand-muted group-hover:text-indigo-500 transition-colors" />
                                                )}

                                                {isPublishing && !isPublished && (
                                                    <div className="absolute inset-0 bg-black/20 backdrop-blur-xs rounded-2xl flex items-center justify-end px-4">
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
                                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-wider text-brand-muted hover:text-brand-text transition-colors"
                                >
                                    CREATE ANOTHER POST
                                </button>
                                <p className="text-[9px] text-center font-bold opacity-30 uppercase tracking-[0.2em]">
                                    Pintopay Global Sync • 2026
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
