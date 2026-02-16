import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Settings, Trophy, Cpu, Users, ChevronLeft
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    mainButton,
    backButton,
    settingsButton,
    viewport,
    hapticFeedback
} from '@telegram-apps/sdk-react';
import { isTMA } from '../utils/tma';
import { useHaptic } from '../hooks/useHaptic';
import { useUI } from '../context/UIContext';
import { proService, PROStatus } from '../services/proService';
import { useNotificationStore } from '../store/useNotificationStore';

// Extracted Sub-components
import { StudioTab } from './Pro/tabs/StudioTab';
import { ToolsTab } from './Pro/tabs/ToolsTab';
import { GrowthTab } from './Pro/tabs/GrowthTab';
import { ProDashboardModals } from './Pro/components/ProDashboardModals';

type Tab = 'studio' | 'tools' | 'growth';

export const ProDashboard = () => {
    const { t } = useTranslation();
    const { selection, impact, notification: hapticNotification } = useHaptic();
    const { showNotification } = useNotificationStore();
    const { setFooterVisible, setHeaderVisible } = useUI();

    const [status, setStatus] = useState<PROStatus | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('studio');

    // Shared State
    const [isLoading, setIsLoading] = useState(true);
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

    const [trends, setTrends] = useState<any[]>([]);
    const [isFetchingTrends, setIsFetchingTrends] = useState(false);
    const [marketAudit, setMarketAudit] = useState<any>(null);
    const [isAuditing, setIsAuditing] = useState(false);
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [academyScore, setAcademyScore] = useState(0);
    const [completedStages, setCompletedStages] = useState<string[]>([]);
    const [isCompletingStage, setIsCompletingStage] = useState<string | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<any>(null);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);

    // Studio Sub-step (needed for MainButton orchestration)
    const [studioStep, setStudioStep] = useState(1);
    const [studioReady, setStudioReady] = useState(false); // If strategy/audience selected
    const [generatedResult, setGeneratedResult] = useState<any>(null);
    const [studioHistory, setStudioHistory] = useState<any[]>([]);
    const [studioHistoryIndex, setStudioHistoryIndex] = useState(-1);

    // --- Action Handlers (Stable) ---

    const loadStatus = async () => {
        try {
            const data = await proService.getStatus();
            setStatus(data);
            if (data?.setup) {
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

    const handleRunMarketingAudit = async () => {
        if (isAuditing) return;
        setIsAuditing(true);
        impact('heavy');
        try {
            const result = await proService.getMarketingAudit();
            setMarketAudit(result.audit);
            setShowAuditModal(true);
            showNotification({
                title: 'Global Sync Complete',
                message: 'Market intelligence dossier updated.',
                type: 'success'
            });
            hapticNotification('success');
        } catch (error) {
            console.error(error);
            showNotification({
                title: 'Sync Error',
                message: 'Global intelligence node unreachable. Try again.',
                type: 'warning'
            });
            hapticNotification('error');
        } finally {
            setIsAuditing(false);
        }
    };

    const handleCompleteAcademyStage = async (stage_id: string) => {
        if (completedStages.includes(stage_id)) return;
        setIsCompletingStage(stage_id);
        impact('medium');
        try {
            const data = await proService.completeAcademyStage(stage_id);
            setAcademyScore(data.academy_score);
            setCompletedStages((prev: string[]) => [...prev, stage_id]);
            hapticNotification('success');
        } catch (error) {
            console.error('Failed to complete academy stage', error);
            hapticNotification('error');
        } finally {
            setIsCompletingStage(null);
        }
    };

    const handleFetchTrends = async () => {
        if (isFetchingTrends) return;
        setIsFetchingTrends(true);
        impact('medium');
        try {
            const data = await proService.fetchTrends();
            setTrends(data.trends);
            showNotification({
                title: 'Trends Synced',
                message: 'Global viral patterns updated.',
                type: 'success'
            });
            hapticNotification('success');
        } catch (error) {
            console.error(error);
            showNotification({
                title: 'Sync Failed',
                message: 'Could not fetch global trends.',
                type: 'warning'
            });
            hapticNotification('error');
        } finally {
            setIsFetchingTrends(false);
        }
    };

    const handleCopyAnyText = (text: string) => {
        navigator.clipboard.writeText(text);
        showNotification({
            title: 'Copied',
            message: 'Intelligence data copied to clipboard.',
            type: 'success'
        });
        impact('light');
    };

    const handleSaveSetup = async () => {
        setIsLoading(true);
        impact('heavy');
        try {
            await proService.setupSocial(apiData);
            await loadStatus();
            setShowSetup(false);
            showNotification({
                title: t('pro_dashboard.setup.save_success_title'),
                message: t('pro_dashboard.setup.save_success_text'),
                type: 'success'
            });
            hapticNotification('success');
        } catch (error) {
            console.error('Failed to save setup', error);
            showNotification({
                title: t('pro_dashboard.setup.save_error_title'),
                message: t('pro_dashboard.setup.save_error_text'),
                type: 'warning'
            });
            hapticNotification('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestIntegration = async (platform: string) => {
        impact('medium');
        try {
            await proService.testIntegration(platform as any);
            showNotification({
                title: 'Test Successful',
                message: `${platform.toUpperCase()} integration is active and verified.`,
                type: 'success'
            });
            hapticNotification('success');
        } catch (error: any) {
            const msg = error.response?.data?.error || `Failed to verify ${platform} node. Check your keys.`;
            showNotification({
                title: 'Test Failed',
                message: msg,
                type: 'warning'
            });
            hapticNotification('error');
        }
    };

    // --- Lifecycle Effects ---

    useEffect(() => {
        const anyModalOpen = showSetup || showManual || selectedArticle || selectedAsset || showAuditModal;
        setFooterVisible(!anyModalOpen);
        setHeaderVisible(!anyModalOpen);

        if (anyModalOpen) {
            try {
                if (backButton.show.isAvailable()) backButton.show();
                const hideAllModals = () => {
                    setShowSetup(false);
                    setShowManual(null);
                    setSelectedArticle(null);
                    setSelectedAsset(null);
                    setShowAuditModal(false);
                };
                const cleanup = backButton.onClick(hideAllModals);
                return () => { if (cleanup) cleanup(); };
            } catch (e) { console.warn(e); }
        } else {
            try {
                if (backButton.hide.isAvailable()) backButton.hide();
            } catch (e) { console.warn(e); }
        }
    }, [showSetup, showManual, selectedArticle, selectedAsset, showAuditModal, setFooterVisible, setHeaderVisible]);

    useEffect(() => {
        loadStatus();
        try {
            if (viewport && viewport.expand.isAvailable() && !viewport.isExpanded) {
                viewport.expand();
            }
            if (settingsButton.show.isAvailable()) {
                settingsButton.show();
                const openSetup = () => {
                    impact('light');
                    setShowSetup(true);
                };
                const cleanup = settingsButton.onClick(openSetup);
                return () => { if (cleanup) cleanup(); };
            }
        } catch (e) { console.warn(e); }
    }, [viewport]);

    useEffect(() => {
        if (!isTMA()) return;

        try {
            const isModalOpen = !!(showSetup || showManual || selectedArticle || selectedAsset || showAuditModal);

            if (isModalOpen) {
                mainButton.setParams({ isVisible: false });
                return;
            }

            if (activeTab === 'studio') {
                if (studioStep === 1) {
                    mainButton.setParams({
                        text: t('pro_dashboard.studio.initiate_btn').toUpperCase(),
                        isVisible: true,
                        isEnabled: studioReady,
                        backgroundColor: '#6366f1',
                        textColor: '#ffffff'
                    });
                    const cleanup = mainButton.onClick(() => {
                        impact('medium');
                        setStudioStep(2);
                    });
                    return () => { if (cleanup) cleanup(); };
                } else if (studioStep === 2) {
                    mainButton.setParams({
                        text: t('pro_dashboard.studio.go_viral_btn').toUpperCase(),
                        isVisible: true,
                        isEnabled: !isLoading,
                        backgroundColor: '#6366f1',
                        textColor: '#ffffff'
                    });
                    // This will be handled via a custom event or shared trigger
                    const triggerGen = () => window.dispatchEvent(new CustomEvent('trigger-studio-gen'));
                    const cleanup = mainButton.onClick(triggerGen);
                    return () => { if (cleanup) cleanup(); };
                } else if (studioStep === 3) {
                    mainButton.setParams({
                        text: t('pro_dashboard.studio.publish_btn').toUpperCase(),
                        isVisible: true,
                        isEnabled: true,
                        backgroundColor: '#10b981',
                        textColor: '#ffffff'
                    });
                    const triggerPublish = () => window.dispatchEvent(new CustomEvent('trigger-studio-publish'));
                    const cleanup = mainButton.onClick(triggerPublish);
                    return () => { if (cleanup) cleanup(); };
                }
            } else if (activeTab === 'tools') {
                mainButton.setParams({
                    text: t('pro_dashboard.tools.audit.btn').toUpperCase(),
                    isVisible: true,
                    isEnabled: !isAuditing,
                    backgroundColor: '#6366f1',
                    textColor: '#ffffff'
                });
                const cleanup = mainButton.onClick(handleRunMarketingAudit);
                return () => { if (cleanup) cleanup(); };
            } else if (activeTab === 'growth') {
                // Determine if there's a pending academy stage
                const nextModule = (t('pro_dashboard.academy.protocols.modules', { returnObjects: true }) as any[])
                    .find(m => !completedStages.includes(m.id));

                if (nextModule) {
                    mainButton.setParams({
                        text: `${t('pro_dashboard.academy.social_setup.title').toUpperCase()}: ${nextModule.title.toUpperCase()}`,
                        isVisible: true,
                        isEnabled: !isCompletingStage,
                        backgroundColor: '#4f46e5',
                        textColor: '#ffffff'
                    });
                    const cleanup = mainButton.onClick(() => handleCompleteAcademyStage(nextModule.id));
                    return () => { if (cleanup) cleanup(); };
                } else {
                    mainButton.setParams({ isVisible: false });
                }
            } else {
                mainButton.setParams({ isVisible: false });
            }
        } catch (e) {
            console.warn('[SDK] mainButton error:', e);
            mainButton.setParams({ isVisible: false });
        }
    }, [activeTab, studioStep, studioReady, isAuditing, isCompletingStage, completedStages, showSetup, showManual, selectedArticle, selectedAsset, showAuditModal, t, isLoading, handleRunMarketingAudit, handleCompleteAcademyStage]);

    // Handle deep linking for Pro Tabs
    useEffect(() => {
        const handleNav = (e: CustomEvent) => {
            const tab = e.detail;
            if (['studio', 'tools', 'growth'].includes(tab)) {
                setActiveTab(tab as Tab);
            }
        };
        window.addEventListener('nav-pro-tab', handleNav as EventListener);
        return () => window.removeEventListener('nav-pro-tab', handleNav as EventListener);
    }, []);

    const notificationShim = (notif: any) => {
        if (typeof notif === 'string') {
            hapticNotification(notif as any);
        } else {
            showNotification({
                title: notif.title,
                message: notif.text || notif.message,
                type: notif.type === 'error' ? 'warning' : notif.type
            });
            hapticNotification(notif.type === 'error' ? 'error' : notif.type);
        }
    };

    return (
        <div className="h-dvh overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(30,58,138,0.15)_0%,transparent_50%)] pointer-events-none" />
            <div className="relative z-10 max-w-5xl mx-auto px-4 pt-6 pb-24">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="w-10 h-10 rounded-xl vibing-blue-animated flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 relative"
                        >
                            <Zap size={20} className="relative z-10" />
                        </motion.div>
                        <div className="space-y-0">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none flex items-center gap-2">
                                Viral Marketing <span className="text-indigo-600 dark:text-indigo-500">Studio</span>
                            </h1>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">{t('pro_dashboard.status_online')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-1 bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100/50 dark:border-indigo-500/20">
                            <Zap size={10} className="text-indigo-600 dark:text-indigo-400" />
                            <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none">TOKENS:</span>
                            <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums leading-none">{status?.pro_tokens || 0}</span>
                        </div>
                        <button
                            onClick={() => setShowSetup(true)}
                            className="p-2 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl border border-slate-200 dark:border-white/5 transition-all group active:scale-90"
                        >
                            <Settings size={12} className="text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        </button>
                    </div>
                </div>

                <div className="flex p-1 bg-white dark:bg-slate-900/50 backdrop-blur-3xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm relative group/nav">
                    {(['studio', 'tools', 'growth'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { selection(); setActiveTab(tab); impact('light'); }}
                            className={`flex-1 relative py-2.5 rounded-[1.125rem] transition-colors duration-300 ${activeTab === tab ? 'text-white' : 'text-slate-400 dark:text-slate-500 hover:text-indigo-500'
                                }`}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 nav-active-bubble rounded-[1rem] shadow-xl shadow-indigo-500/20"
                                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                />
                            )}
                            <span className="relative z-10 flex flex-row items-center justify-center gap-2">
                                {tab === 'studio' && <Cpu size={14} className={activeTab === tab ? 'animate-pulse' : ''} />}
                                {tab === 'tools' && <Settings size={14} />}
                                {tab === 'growth' && <Users size={14} />}
                                <span className="text-[9px] font-black uppercase tracking-widest">{t(`pro_dashboard.tab_${tab}`)}</span>
                            </span>
                        </button>
                    ))}
                </div>
                <div className="relative min-h-[60vh]">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        >
                            {activeTab === 'studio' && (
                                <StudioTab
                                    status={status}
                                    setStatus={setStatus}
                                    impact={impact}
                                    selection={selection}
                                    notification={notificationShim}
                                    externalStep={studioStep}
                                    setExternalStep={setStudioStep}
                                    setExternalReady={setStudioReady}
                                    generatedResult={generatedResult}
                                    setGeneratedResult={setGeneratedResult}
                                    history={studioHistory}
                                    setHistory={setStudioHistory}
                                    historyIndex={studioHistoryIndex}
                                    setHistoryIndex={setStudioHistoryIndex}
                                />
                            )}

                            {activeTab === 'tools' && (
                                <ToolsTab
                                    trends={trends}
                                    isAuditing={isAuditing}
                                    isFetchingTrends={isFetchingTrends}
                                    handleRunMarketingAudit={handleRunMarketingAudit}
                                    handleFetchTrends={handleFetchTrends}
                                    setShowHeadlineModal={setShowAuditModal}
                                    selection={selection}
                                />
                            )}

                            {activeTab === 'growth' && (
                                <GrowthTab
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
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <ProDashboardModals
                status={status}
                showSetup={showSetup}
                setShowSetup={setShowSetup}
                apiData={apiData}
                setApiData={setApiData}
                handleSaveSetup={handleSaveSetup}
                handleTestIntegration={handleTestIntegration}
                isLoading={isLoading}
                showAuditModal={showAuditModal}
                setShowAuditModal={setShowAuditModal}
                marketAudit={marketAudit}
                setActiveTab={setActiveTab}
                selectedArticle={selectedArticle}
                setSelectedArticle={setSelectedArticle}
                selectedAsset={selectedAsset}
                setSelectedAsset={setSelectedAsset}
                showManual={showManual}
                setShowManual={setShowManual}
                selection={selection}
                impact={impact}
                copyText={handleCopyAnyText}
            />
        </div >
    );
};
