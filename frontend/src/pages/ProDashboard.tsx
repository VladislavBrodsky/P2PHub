import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Sparkles, ChevronRight, Cpu, BookOpen, Settings, Info, Trophy, Users
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptic } from '../hooks/useHaptic';
import { useUser } from '../context/UserContext';
import { useUI } from '../context/UIContext';
import { proService, PROStatus } from '../services/proService';

// Extracted Sub-components
import { StudioTab } from './Pro/tabs/StudioTab';
import { ToolsTab } from './Pro/tabs/ToolsTab';
import { GrowthTab } from './Pro/tabs/GrowthTab';
import { ProDashboardModals } from './Pro/components/ProDashboardModals';

type Tab = 'studio' | 'tools' | 'growth';

export const ProDashboard = () => {
    const { t, i18n } = useTranslation();
    const { selection, impact, notification } = useHaptic();
    const { user } = useUser();
    const { setFooterVisible, setHeaderVisible } = useUI();

    const [status, setStatus] = useState<PROStatus | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('studio');

    // Shared State (passed to multiple tabs/modals)
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showSetup, setShowSetup] = useState(false);
    const [showManual, setShowManual] = useState<string | null>(null);
    const [apiData, setApiData] = useState({
        x_api_key: '',
        x_api_secret: '',
        x_access_token: '',
        x_access_token_secret: '',
        telegram_channel_id: '',
        telegram_channels: [] as string[],
        linkedin_access_token: ''
    });

    // Studio/Generation State
    const [step, setStep] = useState(1);
    const [generatedResult, setGeneratedResult] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishedPlatforms, setPublishedPlatforms] = useState<string[]>([]);

    // Tools/Growth State
    const [trends, setTrends] = useState<any[]>([]);
    const [marketAudit, setMarketAudit] = useState<any>(null);
    const [isAuditing, setIsAuditing] = useState(false);
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [academyScore, setAcademyScore] = useState(0);
    const [completedStages, setCompletedStages] = useState<string[]>([]);
    const [isCompletingStage, setIsCompletingStage] = useState<string | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<any>(null);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);

    useEffect(() => {
        if (showSetup || showPublishModal || showManual || selectedArticle || selectedAsset || showAuditModal) {
            setFooterVisible(false);
            setHeaderVisible(false);
        } else {
            setFooterVisible(true);
            setHeaderVisible(true);
        }
        return () => {
            setHeaderVisible(true);
            setFooterVisible(true);
        };
    }, [showSetup, showPublishModal, showManual, selectedArticle, selectedAsset, showAuditModal, setFooterVisible, setHeaderVisible]);

    useEffect(() => {
        loadStatus();
        const tg = (window as any).Telegram?.WebApp;
        if (tg) {
            tg.expand();
            tg.enableClosingConfirmation();
            if (tg.isVerticalSwipesEnabled !== undefined) tg.isVerticalSwipesEnabled = false;
            if (tg.setHeaderColor) tg.setHeaderColor('#0f172a');
            if (tg.setBackgroundColor) tg.setBackgroundColor('#0f172a');
        }
    }, []);

    const loadStatus = async () => {
        try {
            const data = await proService.getStatus();
            setStatus(data);
            if (data?.api_config) {
                setApiData({
                    x_api_key: data.api_config.x_api_key || '',
                    x_api_secret: data.api_config.x_api_secret || '',
                    x_access_token: data.api_config.x_access_token || '',
                    x_access_token_secret: data.api_config.x_access_token_secret || '',
                    telegram_channel_id: data.api_config.telegram_channel_id || '',
                    telegram_channels: data.api_config.telegram_channels || [],
                    linkedin_access_token: data.api_config.linkedin_access_token || ''
                });
            }
            setAcademyScore(data?.academy_score || 0);
            if (data?.completed_stages) {
                try {
                    const parsed = typeof data.completed_stages === 'string' ? JSON.parse(data.completed_stages) : data.completed_stages;
                    setCompletedStages(parsed || []);
                } catch (e) {
                    setCompletedStages([]);
                }
            }
        } catch (error) {
            console.error('Failed to load PRO status', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSetup = async () => {
        setIsLoading(true);
        impact('heavy');
        try {
            await proService.saveSetup(apiData);
            await loadStatus();
            setShowSetup(false);
            notification({ title: t('pro_dashboard.setup.save_success_title'), text: t('pro_dashboard.setup.save_success_text'), type: 'success' });
        } catch (error) {
            console.error('Failed to save setup', error);
            notification({ title: t('pro_dashboard.setup.save_error_title'), text: t('pro_dashboard.setup.save_error_text'), type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestIntegration = async (platform: string) => {
        impact('medium');
        try {
            await proService.testIntegration(platform);
            notification({ title: 'Test Successful', text: `${platform.toUpperCase()} integration is active and verified.`, type: 'success' });
        } catch (error: any) {
            const msg = error.response?.data?.error || `Failed to verify ${platform} node. Check your keys.`;
            notification({ title: 'Test Failed', text: msg, type: 'error' });
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
        } finally {
            setIsCompletingStage(null);
        }
    };

    const handleRunMarketingAudit = async () => {
        if (isAuditing) return;
        setIsAuditing(true);
        impact('heavy');
        try {
            const result = await proService.runMarketingAudit();
            setMarketAudit(result);
            setShowAuditModal(true);
            notification({ title: 'Global Sync Complete', text: 'Market intelligence dossier updated.', type: 'success' });
        } catch (error) {
            console.error(error);
            notification({ title: 'Sync Error', text: 'Global intelligence node unreachable. Try again.', type: 'error' });
        } finally {
            setIsAuditing(false);
        }
    };

    const handleCopyAnyText = (text: string) => {
        navigator.clipboard.writeText(text);
        notification({ title: 'Copied', text: 'Intelligence data copied to clipboard.', type: 'success' });
        impact('light');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(30,58,138,0.15)_0%,_transparent_50%)] pointer-events-none" />
            <div className="relative z-10 max-w-5xl mx-auto px-4 pt-10 pb-32">
                {/* Header Section */}
                <div className="flex flex-col gap-8 mb-12">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="w-12 h-12 rounded-2xl vibing-blue-animated flex items-center justify-center text-white shadow-3xl shadow-indigo-500/40 relative group"
                                >
                                    <div className="absolute inset-0 bg-white/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Zap size={24} className="relative z-10" />
                                </motion.div>
                                <div className="space-y-0.5">
                                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-2">
                                        PRO <span className="text-indigo-500">Node</span>
                                    </h1>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t('pro_dashboard.status_online')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-1.5 bg-white/5 backdrop-blur-3xl rounded-[2rem] border border-white/10 shadow-3xl">
                            <div className="flex items-center gap-3 px-5 py-3 rounded-[1.5rem] bg-indigo-500/10 border border-indigo-500/20 group hover:bg-indigo-500/20 transition-all cursor-default overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-8 h-8 bg-white/5 -mr-4 -mt-4 rotate-45" />
                                <Trophy size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] leading-none mb-1">XP Points</span>
                                    <span className="text-xl font-black text-white tabular-nums leading-none tracking-tight">{academyScore}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSetup(true)}
                                className="p-3.5 bg-white/5 hover:bg-white/10 rounded-[1.5rem] border border-white/5 hover:border-white/20 transition-all group active:scale-95"
                            >
                                <Settings size={18} className="text-slate-400 group-hover:text-white transition-colors group-hover:rotate-45 transition-transform duration-500" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex p-2 bg-slate-900/50 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-inner relative group/nav">
                        {(['studio', 'tools', 'growth'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { selection(); setActiveTab(tab); impact('light'); }}
                                className={`flex-1 relative py-4 sm:py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 vibing-blue-animated rounded-[2rem] shadow-2xl shadow-indigo-500/20"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {tab === 'studio' && <Cpu size={14} className={activeTab === tab ? 'animate-pulse' : ''} />}
                                    {tab === 'tools' && <Settings size={14} />}
                                    {tab === 'growth' && <Users size={14} />}
                                    <span className="hidden sm:inline">{t(`pro_dashboard.tab_${tab}`)}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content Display */}
                <div className="relative min-h-[500px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'studio' && (
                            <StudioTab
                                key="studio"
                                status={status}
                                step={step}
                                setStep={setStep}
                                isGenerating={isGenerating}
                                setIsGenerating={setIsGenerating}
                                generatedResult={generatedResult}
                                setGeneratedResult={setGeneratedResult}
                                history={history}
                                setHistory={setHistory}
                                historyIndex={historyIndex}
                                setHistoryIndex={setHistoryIndex}
                                isPublishing={isPublishing}
                                setIsPublishing={setIsPublishing}
                                showPublishModal={showPublishModal}
                                setShowPublishModal={setShowPublishModal}
                                publishedPlatforms={publishedPlatforms}
                                setPublishedPlatforms={setPublishedPlatforms}
                                impact={impact}
                                selection={selection}
                                notification={notification}
                            />
                        )}

                        {activeTab === 'tools' && (
                            <ToolsTab
                                key="tools"
                                trends={trends}
                                isAuditing={isAuditing}
                                handleRunMarketingAudit={handleRunMarketingAudit}
                                setShowHeadlineModal={setShowAuditModal} // Using audit modal for now as placeholder or update logic
                                setShowTrendsModal={setShowAuditModal}
                                setShowBioModal={setShowAuditModal}
                                selection={selection}
                                impact={impact}
                            />
                        )}

                        {activeTab === 'growth' && (
                            <GrowthTab
                                key="growth"
                                status={status}
                                academyScore={academyScore}
                                completedStages={completedStages}
                                isCompletingStage={isCompletingStage}
                                handleCompleteAcademyStage={handleCompleteAcademyStage}
                                setSelectedArticle={setSelectedArticle}
                                setShowSetup={setShowSetup}
                                setShowManual={setShowManual}
                                selection={selection}
                                impact={impact}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Modals Layer */}
                <ProDashboardModals
                    showSetup={showSetup}
                    setShowSetup={setShowSetup}
                    apiData={apiData}
                    setApiData={setApiData}
                    isLoading={isLoading}
                    handleSaveSetup={handleSaveSetup}
                    handleTestIntegration={handleTestIntegration}
                    showAuditModal={showAuditModal}
                    setShowAuditModal={setShowAuditModal}
                    marketAudit={marketAudit}
                    setActiveTab={setActiveTab}
                    selectedArticle={selectedArticle}
                    setSelectedArticle={setSelectedArticle}
                    selectedAsset={selectedAsset}
                    setSelectedAsset={setSelectedAsset}
                    handleCopyAnyText={handleCopyAnyText}
                    showManual={showManual}
                    setShowManual={setShowManual}
                    status={status}
                    selection={selection}
                    impact={impact}
                />
            </div>
        </div>
    );
};
