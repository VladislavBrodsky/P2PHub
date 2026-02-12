import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Sparkles, Send, Globe, ChevronRight,
    ArrowLeft, Terminal, Bot, Image as ImageIcon,
    Share2, CheckCircle2, AlertCircle, Loader2,
    Lock, Instagram, Twitter, Cpu, BookOpen, Flame, Settings
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptic } from '../hooks/useHaptic';
import { useUser } from '../context/UserContext';
import { proService, PROStatus } from '../services/proService';
import { getApiUrl } from '../utils/api';

type Tab = 'studio' | 'tools' | 'academy';

export const ProDashboard = () => {
    const { t, i18n } = useTranslation();
    const { selection, impact, notification } = useHaptic();
    const { user } = useUser();

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

    const [countdown, setCountdown] = useState(15);

    useEffect(() => {
        let interval: any;
        if (isGenerating) {
            setCountdown(15);
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
        <div className="flex flex-col min-h-screen pb-32">
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
                                    <div className="bg-(--color-bg-surface) rounded-[2rem] p-5 border border-(--color-border-glass) shadow-sm">
                                        <h3 className="text-sm font-black mb-4 flex items-center gap-2 uppercase tracking-wide opacity-70">
                                            <Bot size={16} className="text-indigo-500" /> Configuration
                                        </h3>

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
                                        onClick={() => setStep(2)}
                                        disabled={!postType || !audience}
                                        className="w-full h-14 bg-linear-to-r from-indigo-500 to-purple-700 rounded-2xl font-black text-white text-sm shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                                    >
                                        INITIATE AI AGENT <ChevronRight size={18} />
                                    </button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <div className="bg-(--color-bg-surface) rounded-[2.5rem] p-8 border border-(--color-border-glass) text-center space-y-6">
                                    <div className="w-20 h-20 mx-auto bg-indigo-500/10 rounded-full flex items-center justify-center relative">
                                        <Bot className="w-8 h-8 text-indigo-500" />
                                        <div className="absolute inset-0 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                    <h3 className="text-xl font-black uppercase">AI CMO READY</h3>
                                    <p className="text-xs font-medium opacity-60">Ready to synthesize 2026 viral trends.</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setStep(1)} className="h-14 bg-(--color-bg-surface) border border-(--color-border-glass) rounded-2xl font-black text-xs">BACK</button>
                                        <button onClick={handleGenerate} disabled={isGenerating} className="h-14 bg-indigo-500 rounded-2xl font-black text-white shadow-lg flex items-center justify-center gap-2">
                                            {isGenerating ? <Loader2 className="animate-spin w-4 h-4" /> : "GO VIRAL 🚀"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && generatedResult && (
                                <div className="space-y-4">
                                    <div className="bg-(--color-bg-surface) rounded-[2rem] overflow-hidden border border-(--color-border-glass)">
                                        <div className="aspect-video bg-indigo-900/20 relative flex items-center justify-center overflow-hidden">
                                            {generatedResult.image_url ? (
                                                <img src={generatedResult.image_url.startsWith('http') ? generatedResult.image_url : `${getApiUrl().replace(/\/api$/, '')}${generatedResult.image_url}`} alt="Viral" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="p-6 text-center"><ImageIcon className="w-8 h-8 text-indigo-500 mx-auto mb-2 opacity-50" /><p className="text-[9px] uppercase tracking-widest text-indigo-300">{generatedResult.image_prompt}</p></div>
                                            )}
                                        </div>
                                        <div className="p-5 space-y-3">
                                            <h4 className="text-lg font-black leading-tight">{generatedResult.title}</h4>
                                            <p className="text-sm opacity-80 whitespace-pre-wrap">{generatedResult.body}</p>
                                            <div className="flex flex-wrap gap-2">{generatedResult.hashtags?.map((t: string) => <span key={t} className="text-[10px] font-black text-indigo-500">#{t}</span>)}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setStep(1)} className="w-full h-14 bg-(--color-bg-surface) border border-(--color-border-glass) rounded-2xl font-black text-xs">CREATE NEW</button>
                                </div>
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
                            <div className="bg-(--color-bg-surface) p-6 rounded-[2rem] border border-(--color-border-glass)">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-pink-500/10 rounded-xl"><Sparkles className="w-5 h-5 text-pink-500" /></div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase">{t('pro_dashboard.tools.headline.title')}</h3>
                                        <p className="text-[10px] opacity-60">{t('pro_dashboard.tools.headline.desc')}</p>
                                    </div>
                                </div>
                                <input
                                    value={headlineInput}
                                    onChange={(e) => setHeadlineInput(e.target.value)}
                                    placeholder={t('pro_dashboard.tools.headline.placeholder')}
                                    className="w-full h-12 bg-black/5 dark:bg-white/5 rounded-xl px-4 text-xs font-bold mb-3 outline-hidden"
                                />
                                {fixedHeadline && (
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-3">
                                        <p className="text-xs font-black text-emerald-500">{fixedHeadline}</p>
                                    </div>
                                )}
                                <button
                                    onClick={handleFixHeadline}
                                    disabled={isFixingHeadline || !headlineInput}
                                    className="w-full h-12 bg-pink-500 rounded-xl font-black text-white text-xs shadow-lg active:scale-95 transition-transform flex items-center justify-center"
                                >
                                    {isFixingHeadline ? <Loader2 className="animate-spin w-4 h-4" /> : t('pro_dashboard.tools.headline.btn')}
                                </button>
                            </div>

                            {/* Trend Hunter */}
                            <div className="bg-(--color-bg-surface) p-6 rounded-[2rem] border border-(--color-border-glass)">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-orange-500/10 rounded-xl"><Flame className="w-5 h-5 text-orange-500" /></div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase">{t('pro_dashboard.tools.trends.title')}</h3>
                                        <p className="text-[10px] opacity-60">{t('pro_dashboard.tools.trends.desc')}</p>
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
                                    onClick={handleFetchTrends}
                                    disabled={isHuntingTrends}
                                    className="w-full h-12 bg-orange-500 rounded-xl font-black text-white text-xs shadow-lg active:scale-95 transition-transform flex items-center justify-center"
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
                            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Expert Level</h3>
                                <p className="text-2xl font-black text-indigo-500">GRANDMASTER</p>
                            </div>

                            {['hook_rule', 'algorithm', 'psycho'].map((key) => (
                                <div key={key} className="bg-(--color-bg-surface) p-5 rounded-[2rem] border border-(--color-border-glass) relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <BookOpen className="w-12 h-12" />
                                    </div>
                                    <h4 className="text-sm font-black uppercase mb-1">{t(`pro_dashboard.academy.${key}.title`)}</h4>
                                    <p className="text-[10px] font-bold opacity-50 mb-3">{t(`pro_dashboard.academy.${key}.desc`)}</p>
                                    <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl">
                                        <p className="text-xs font-medium leading-relaxed">{t(`pro_dashboard.academy.${key}.content`)}</p>
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
                        className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-(--color-bg-surface) w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-black uppercase tracking-tight">{t('pro_dashboard.tab_setup')}</h3>
                                <button onClick={() => setShowSetup(false)} className="opacity-50"><ArrowLeft /></button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                                    <h4 className="text-[10px] font-black uppercase text-indigo-500 mb-2">Instructions</h4>
                                    <p className="text-[10px] font-medium opacity-60 leading-relaxed">
                                        1. Get X API keys from Developer Portal.<br />
                                        2. Get Telegram Channel ID and add our Bot as Admin.<br />
                                        3. Paste your credentials below to enable autoposting.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase opacity-50 ml-2 mb-1 block">X API Key</label>
                                        <input
                                            type="password"
                                            value={apiData.x_api_key}
                                            onChange={(e) => setApiData({ ...apiData, x_api_key: e.target.value })}
                                            placeholder="••••••••••••"
                                            className="w-full h-12 bg-black/5 dark:bg-white/5 border border-transparent focus:border-indigo-500 rounded-xl px-4 text-xs outline-hidden"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase opacity-50 ml-2 mb-1 block">X Access Token</label>
                                        <input
                                            type="password"
                                            value={apiData.x_access_token}
                                            onChange={(e) => setApiData({ ...apiData, x_access_token: e.target.value })}
                                            placeholder="••••••••••••"
                                            className="w-full h-12 bg-black/5 dark:bg-white/5 border border-transparent focus:border-indigo-500 rounded-xl px-4 text-xs outline-hidden"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase opacity-50 ml-2 mb-1 block">Telegram Channel ID</label>
                                        <input
                                            type="text"
                                            value={apiData.telegram_channel_id}
                                            onChange={(e) => setApiData({ ...apiData, telegram_channel_id: e.target.value })}
                                            placeholder="@channelname or id"
                                            className="w-full h-12 bg-black/5 dark:bg-white/5 border border-transparent focus:border-indigo-500 rounded-xl px-4 text-xs outline-hidden"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase opacity-50 ml-2 mb-1 block">LinkedIn Token</label>
                                        <input
                                            type="password"
                                            value={apiData.linkedin_access_token}
                                            onChange={(e) => setApiData({ ...apiData, linkedin_access_token: e.target.value })}
                                            placeholder="••••••••••••"
                                            className="w-full h-12 bg-black/5 dark:bg-white/5 border border-transparent focus:border-indigo-500 rounded-xl px-4 text-xs outline-hidden"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveSetup}
                                className="w-full h-16 bg-indigo-500 text-white rounded-3xl font-black shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform"
                            >
                                SAVE CONFIGURATION
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
