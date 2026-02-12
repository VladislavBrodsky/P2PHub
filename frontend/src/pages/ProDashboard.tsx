import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Sparkles, Send, Globe, ChevronRight,
    ArrowLeft, Terminal, Bot, Image as ImageIcon,
    Share2, CheckCircle2, AlertCircle, Loader2,
    Lock, Instagram, Twitter
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptic } from '../hooks/useHaptic';
import { useUser } from '../context/UserContext';
import { proService, PROStatus } from '../services/proService';
import { getApiUrl } from '../utils/api';

export const ProDashboard = () => {
    const { t, i18n } = useTranslation();
    const { selection, impact, notification } = useHaptic();
    const { user } = useUser();

    const [status, setStatus] = useState<PROStatus | null>(null);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    // Viral Studio State
    const [postType, setPostType] = useState('');
    const [audience, setAudience] = useState('');
    const [language, setLanguage] = useState(i18n.language === 'ru' ? 'Russian' : 'English');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedResult, setGeneratedResult] = useState<any>(null);

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

    const isRussian = i18n.language === 'ru';

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

    const postTypes = [
        "Viral Strategy", "Financial Shift", "Growth Hack",
        "Wealth Creation", "Tech Insider", "Digital Nomad Lifestyle"
    ];

    const audiences = [
        "Crypto Investors", "Digital Nomads", "Freelancers",
        "E-commerce Owners", "Tech Enthusiasts", "High-Net-Worth Individuals"
    ];

    const languages = [
        "English", "Russian", "Spanish", "French", "German",
        "Portuguese", "Chinese", "Japanese", "Arabic", "Hindi"
    ];

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
                        <h1 className="text-xl font-black tracking-tight leading-none uppercase">PRO COMMAND CENTER</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">ACTIVE</span>
                            {status && (
                                <span className="text-[10px] font-black text-amber-500">{status.pro_tokens} TOKENS LEFT</span>
                            )}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setShowSetup(true)}
                    className="p-3 rounded-2xl bg-(--color-bg-surface) border border-(--color-border-glass) active:scale-90 transition-transform"
                >
                    <Terminal className="w-5 h-5 text-(--color-text-secondary)" />
                </button>
            </div>

            {/* Main Content Areas */}
            <div className="px-6 space-y-6">
                {/* Step Progress */}
                <div className="flex items-center justify-between px-4">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${step >= s ? 'bg-indigo-500 text-white' : 'bg-(--color-bg-surface) text-(--color-text-secondary)'
                                }`}>
                                {s}
                            </div>
                            {s < 3 && (
                                <div className={`w-12 h-0.5 mx-2 rounded-full ${step > s ? 'bg-indigo-500' : 'bg-(--color-border-glass)'}`} />
                            )}
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="bg-(--color-bg-surface) rounded-[2.5rem] p-6 border border-(--color-border-glass)">
                                <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                                    <Bot className="text-indigo-500" /> Viral Marketing Studio
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase opacity-50 ml-4 mb-2 block">Post Type</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {postTypes.map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => { selection(); setPostType(type); }}
                                                    className={`p-3 rounded-2xl text-[10px] font-black border transition-all ${postType === type
                                                            ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg'
                                                            : 'bg-black/5 dark:bg-white/5 border-transparent opacity-60'
                                                        }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase opacity-50 ml-4 mb-2 block">Target Audience</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {audiences.map(a => (
                                                <button
                                                    key={a}
                                                    onClick={() => { selection(); setAudience(a); }}
                                                    className={`p-3 rounded-2xl text-[10px] font-black border transition-all ${audience === a
                                                            ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg'
                                                            : 'bg-black/5 dark:bg-white/5 border-transparent opacity-60'
                                                        }`}
                                                >
                                                    {a}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase opacity-50 ml-4 mb-2 block">Language</label>
                                        <select
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                            className="w-full h-14 bg-black/5 dark:bg-white/5 border-none rounded-2xl px-6 font-bold text-sm outline-hidden cursor-pointer"
                                        >
                                            {languages.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={!postType || !audience}
                                className="w-full h-18 bg-linear-to-r from-indigo-500 to-purple-700 rounded-3xl font-black text-white shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                NEXT PHASE <ChevronRight size={20} />
                            </button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-(--color-bg-surface) rounded-[2.5rem] p-8 border border-(--color-border-glass) text-center space-y-6"
                        >
                            <div className="relative w-24 h-24 mx-auto">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 rounded-full border-b-2 border-indigo-500"
                                />
                                <div className="absolute inset-2 bg-indigo-500/10 rounded-full flex items-center justify-center">
                                    <Sparkles className="w-10 h-10 text-indigo-500" />
                                </div>
                            </div>

                            <h3 className="text-2xl font-black uppercase tracking-tight">AI CMO ACTIVATED</h3>
                            <p className="text-(--color-text-secondary) text-sm font-medium">
                                Collecting real-time 2026 data, hashtags, and social triggers to ensure your post goes viral.
                            </p>

                            <ul className="space-y-3 text-left bg-black/5 dark:bg-white/5 p-5 rounded-3xl">
                                <li className="flex items-center gap-3 text-xs font-black">
                                    <CheckCircle2 size={16} className="text-emerald-500" /> FOMO Strategy Engine
                                </li>
                                <li className="flex items-center gap-3 text-xs font-black">
                                    <CheckCircle2 size={16} className="text-emerald-500" /> Cinematic Image Prompting
                                </li>
                                <li className="flex items-center gap-3 text-xs font-black">
                                    <CheckCircle2 size={16} className="text-emerald-500" /> Psychographic Analysis
                                </li>
                            </ul>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="h-16 bg-(--color-bg-surface) border border-(--color-border-glass) rounded-3xl font-black text-xs active:scale-95 transition-transform"
                                >
                                    BACK
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="h-16 bg-indigo-500 rounded-3xl font-black text-white shadow-lg active:scale-95 transition-transform flex flex-col items-center justify-center gap-0.5"
                                >
                                    {isGenerating ? (
                                        <Loader2 className="animate-spin w-5 h-5" />
                                    ) : (
                                        <>
                                            <span className="text-sm">GO VIRAL 🚀</span>
                                            <span className="text-[9px] font-bold opacity-70">COST: 2 TOKENS</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && generatedResult && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="bg-(--color-bg-surface) rounded-[2.5rem] border border-(--color-border-glass) overflow-hidden">
                                <div className="aspect-video bg-indigo-900/20 flex flex-col items-center justify-center border-b border-(--color-border-glass) relative overflow-hidden">
                                    {generatedResult.image_url ? (
                                        <img
                                            src={generatedResult.image_url.startsWith('http') ? generatedResult.image_url : `${getApiUrl().replace(/\/api$/, '')}${generatedResult.image_url}`}
                                            alt="Generated Viral Content"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="p-8 text-center flex flex-col items-center">
                                            <ImageIcon className="w-12 h-12 text-indigo-500 mb-4 opacity-50" />
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-relaxed line-clamp-3">
                                                {generatedResult.image_prompt}
                                            </p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-linear-to-t from-indigo-950/40 to-transparent pointer-events-none" />
                                </div>
                                <div className="p-6 space-y-4">
                                    <h4 className="text-xl font-black leading-tight">{generatedResult.title}</h4>
                                    <p className="text-sm font-medium leading-relaxed opacity-80 whitespace-pre-wrap">
                                        {generatedResult.body}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {generatedResult.hashtags?.map((tag: string) => (
                                            <span key={tag} className="text-[10px] font-black text-indigo-500">#{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-500 active:scale-90 transition-transform">
                                    <Send size={20} />
                                    <span className="text-[9px] font-black">TELEGRAM</span>
                                </button>
                                <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-sky-500/10 border border-sky-500/20 text-sky-500 active:scale-90 transition-transform">
                                    <Twitter size={20} />
                                    <span className="text-[9px] font-black">X</span>
                                </button>
                                <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 active:scale-90 transition-transform">
                                    <Share2 size={20} />
                                    <span className="text-[9px] font-black">OTHERS</span>
                                </button>
                            </div>

                            <button
                                onClick={() => setStep(1)}
                                className="w-full h-16 bg-(--color-bg-surface) border border-(--color-border-glass) rounded-3xl font-black text-xs active:scale-95 transition-transform"
                            >
                                GENERATE ANOTHER
                            </button>
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
                                <h3 className="text-xl font-black uppercase tracking-tight">API Setup</h3>
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
