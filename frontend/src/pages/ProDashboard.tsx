import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Settings, Cpu, Users, Shield
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    mainButton,
    backButton,
    settingsButton,
    viewport
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
    const { t, i18n } = useTranslation();
    const { selection, impact, notification: hapticNotification } = useHaptic();
    const { showNotification } = useNotificationStore();
    const { setFooterVisible, setHeaderVisible } = useUI();

    const [status, setStatus] = useState<PROStatus | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('studio');

    // Shared State
    const [isLoading, setIsLoading] = useState(true);
    const [showSetup, setShowSetup] = useState(false);
    const [showManual, setShowManual] = useState<string | null>(null);

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
    const [showHeadlineModal, setShowHeadlineModal] = useState(false);
    const [isFixingHeadline, setIsFixingHeadline] = useState(false);
    const [showBioModal, setShowBioModal] = useState(false);
    const [isGeneratingBio, setIsGeneratingBio] = useState(false);

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
                // apiData removed
            }
            setAcademyScore(data?.academy_score || 0);
            if (data?.completed_stages) {
                try {
                    const parsed = typeof data.completed_stages === 'string' ? JSON.parse(data.completed_stages) : data.completed_stages;
                    setCompletedStages(Array.isArray(parsed) ? parsed : []);
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

    useEffect(() => {
        loadStatus();
    }, []);

    const handleRunMarketingAudit = useCallback(async (force: boolean = false) => {
        if (isAuditing) return;
        setIsAuditing(true);
        impact('heavy');

        const lang = i18n.language.startsWith('ru') ? 'Russian' : 'English';

        try {
            const result = await proService.getMarketingAudit(lang, force);
            setMarketAudit(result.audit);

            // #comment: Update tokens if returned
            if (result.tokens_remaining !== undefined && status) {
                setStatus({ ...status, pro_tokens: result.tokens_remaining });
            }

            setShowAuditModal(true);
            showNotification({
                title: force ? 'Viral Research Complete' : 'Global Sync Complete',
                message: force ? 'Fresh intelligence acquired (-3 Tokens).' : 'Market intelligence dossier updated.',
                type: 'success'
            });
            hapticNotification('success');
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.detail || error.response?.data?.message || 'Global intelligence node unreachable. Check your network.';
            showNotification({
                title: 'Sync Error',
                message: msg,
                type: 'warning'
            });
            hapticNotification('error');
        } finally {
            setIsAuditing(false);
        }
    }, [isAuditing, impact, i18n.language, status, showNotification, hapticNotification]);

    const handleRefreshAudit = () => handleRunMarketingAudit(true);

    const handleCompleteAcademyStage = useCallback(async (stage_id: string) => {
        if (completedStages.includes(stage_id)) return;
        setIsCompletingStage(stage_id);
        impact('medium');
        try {
            const data = await proService.completeAcademyStage(stage_id);
            setAcademyScore(data.academy_score);
            setCompletedStages((prev: string[]) => [...prev, stage_id]);

            // #comment: Update tokens if returned
            if (data.tokens_remaining !== undefined && status) {
                setStatus({ ...status, pro_tokens: data.tokens_remaining });
            }

            hapticNotification('success');
            showNotification({
                title: 'Module Complete',
                message: `XP Earned! Tokens updated.`,
                type: 'success'
            });
        } catch (error: any) {
            console.error('Failed to complete academy stage', error);
            const msg = error.response?.data?.detail || error.response?.data?.message || 'Failed to complete stage. Sync error.';
            showNotification({
                title: 'Error',
                message: msg,
                type: 'warning'
            });
            hapticNotification('error');
        } finally {
            setIsCompletingStage(null);
        }
    }, [completedStages, impact, status, hapticNotification, showNotification]);

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
    const handleFixHeadline = async (headline: string) => {
        if (!headline || isFixingHeadline) return;
        setIsFixingHeadline(true);
        impact('medium');
        try {
            const data = await proService.fixHeadline(headline);
            if (data.tokens_remaining !== undefined && status) {
                setStatus({ ...status, pro_tokens: data.tokens_remaining });
            }
            hapticNotification('success');
            return data.result;
        } catch (error: any) {
            console.error('Failed to fix headline', error);
            const msg = error.response?.data?.detail || error.response?.data?.message || 'Failed to synthesize headline.';
            showNotification({
                title: 'Sync Error',
                message: msg,
                type: 'warning'
            });
            hapticNotification('error');
            throw error;
        } finally {
            setIsFixingHeadline(false);
        }
    };

    const handleGenerateBio = async (bio: string) => {
        if (!bio || isGeneratingBio) return;
        setIsGeneratingBio(true);
        impact('medium');
        try {
            const data = await proService.generateBio(bio);
            if (data.tokens_remaining !== undefined && status) {
                setStatus({ ...status, pro_tokens: data.tokens_remaining });
            }
            hapticNotification('success');
            return data.bio;
        } catch (error: any) {
            console.error('Failed to generate bio', error);
            const msg = error.response?.data?.detail || error.response?.data?.message || 'Failed to synthesize bio.';
            showNotification({
                title: 'Sync Error',
                message: msg,
                type: 'warning'
            });
            hapticNotification('error');
            throw error;
        } finally {
            setIsGeneratingBio(false);
        }
    };




    // --- Lifecycle Effects ---

    useEffect(() => {
        const anyModalOpen = showSetup || showManual || selectedArticle || selectedAsset || showAuditModal || showHeadlineModal || showBioModal;
        setFooterVisible(!anyModalOpen);
        setHeaderVisible(!anyModalOpen);

        if (anyModalOpen) {
            try {
                if (backButton && backButton.show && backButton.show.isAvailable()) backButton.show();
                const hideAllModals = () => {
                    setShowSetup(false);
                    setShowManual(null);
                    setSelectedArticle(null);
                    setSelectedAsset(null);
                    setShowAuditModal(false);
                    setShowHeadlineModal(false);
                    setShowBioModal(false);
                };
                if (backButton && backButton.onClick) {
                    const cleanup = backButton.onClick(hideAllModals);
                    return () => { if (cleanup) cleanup(); };
                }
            } catch (e) { console.warn(e); }
        } else {
            try {
                if (backButton && backButton.hide && backButton.hide.isAvailable()) backButton.hide();
            } catch (e) { console.warn(e); }
        }
    }, [showSetup, showManual, selectedArticle, selectedAsset, showAuditModal, showHeadlineModal, showBioModal, setFooterVisible, setHeaderVisible]);

    useEffect(() => {
        const initSDK = async () => {
            try {
                if (viewport && viewport.expand && typeof viewport.expand.isAvailable === 'function' && viewport.expand.isAvailable()) {
                    viewport.expand();
                }

                if (settingsButton && settingsButton.show && typeof settingsButton.show.isAvailable === 'function' && settingsButton.show.isAvailable()) {
                    settingsButton.show();
                    const openSetup = () => {
                        impact('light');
                        setShowSetup(true);
                    };

                    if (typeof settingsButton.onClick === 'function') {
                        const cleanup = settingsButton.onClick(openSetup);
                        return cleanup;
                    }
                }
            } catch (e) {
                console.warn('[PRO] SDK Init warning:', e);
            }
        };

        const cleanup = initSDK();
        return () => {
            cleanup.then(c => typeof c === 'function' && c());
        };
    }, [impact]);

    useEffect(() => {
        if (!isTMA() || !mainButton) return;

        try {
            const isModalOpen = !!(showSetup || showManual || selectedArticle || selectedAsset || showAuditModal || showHeadlineModal || showBioModal);

            if (isModalOpen) {
                mainButton.setParams({ isVisible: false });
                return;
            }

            if (activeTab === 'studio') {
                if (studioStep === 1) {
                    mainButton.setParams({
                        text: String(t('pro_dashboard.studio.initiate_btn')).toUpperCase(),
                        isVisible: true,
                        isEnabled: !!studioReady,
                        backgroundColor: '#6366f1',
                        textColor: '#ffffff'
                    });
                    const handleStep1 = () => {
                        impact('medium');
                        setStudioStep(2);
                    };
                    return typeof mainButton.onClick === 'function' ? mainButton.onClick(handleStep1) : undefined;
                } else if (studioStep === 2) {
                    mainButton.setParams({
                        text: String(t('pro_dashboard.studio.go_viral_btn')).toUpperCase(),
                        isVisible: true,
                        isEnabled: !isLoading,
                        backgroundColor: '#6366f1',
                        textColor: '#ffffff'
                    });
                    const triggerGen = () => window.dispatchEvent(new CustomEvent('trigger-studio-gen'));
                    return typeof mainButton.onClick === 'function' ? mainButton.onClick(triggerGen) : undefined;
                } else if (studioStep === 3) {
                    mainButton.setParams({
                        text: String(t('pro_dashboard.studio.publish_btn')).toUpperCase(),
                        isVisible: true,
                        isEnabled: true,
                        backgroundColor: '#10b981',
                        textColor: '#ffffff'
                    });
                    const triggerPublish = () => window.dispatchEvent(new CustomEvent('trigger-studio-publish'));
                    return typeof mainButton.onClick === 'function' ? mainButton.onClick(triggerPublish) : undefined;
                }
            } else if (activeTab === 'tools') {
                mainButton.setParams({
                    text: String(t('pro_dashboard.tools.audit.btn')).toUpperCase(),
                    isVisible: true,
                    isEnabled: !isAuditing,
                    backgroundColor: '#6366f1',
                    textColor: '#ffffff'
                });
                return typeof mainButton.onClick === 'function' ? mainButton.onClick(handleRunMarketingAudit) : undefined;
            } else if (activeTab === 'growth') {
                const modulesRaw = t('pro_dashboard.academy.protocols.modules', { returnObjects: true });
                const modulesList = Array.isArray(modulesRaw) ? modulesRaw : [];
                const nextModule = modulesList.find((m: any) => m && m.id && !completedStages.includes(m.id));

                if (nextModule) {
                    const setupTitle = String(t('pro_dashboard.academy.social_setup.title') || 'Setup').toUpperCase();
                    const moduleTitle = String(nextModule.title || '').toUpperCase();
                    mainButton.setParams({
                        text: `${setupTitle}: ${moduleTitle}`,
                        isVisible: true,
                        isEnabled: !isCompletingStage,
                        backgroundColor: '#4f46e5',
                        textColor: '#ffffff'
                    });
                    const handleComplete = () => handleCompleteAcademyStage(nextModule.id);
                    return typeof mainButton.onClick === 'function' ? mainButton.onClick(handleComplete) : undefined;
                } else {
                    mainButton.setParams({ isVisible: false });
                }
            } else {
                mainButton.setParams({ isVisible: false });
            }
        } catch (e) {
            console.warn('[SDK] mainButton error:', e);
            try {
                if (mainButton && mainButton.setParams) mainButton.setParams({ isVisible: false });
            } catch { /* ignore */ }
        }
    }, [activeTab, studioStep, studioReady, isAuditing, isCompletingStage, completedStages, showSetup, showManual, selectedArticle, selectedAsset, showAuditModal, showHeadlineModal, showBioModal, t, isLoading, handleRunMarketingAudit, handleCompleteAcademyStage, impact]);

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
        <div
            id="pro-dashboard-container"
            className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden pt-2 pb-12"
        >
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(30,58,138,0.15)_0%,transparent_50%)] pointer-events-none" />
            <div className="relative z-10 max-w-5xl mx-auto px-4 pt-6 pb-24 min-h-screen">
                {/* Header Section - Mobile Optimized */}
                <div className="flex flex-row items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl vibing-blue-animated flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 relative shrink-0"
                        >
                            <Zap size={20} className="relative z-10 w-4 h-4 sm:w-5 sm:h-5" />
                        </motion.div>
                        <div className="space-y-1">
                            <h1 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none flex items-center gap-2 whitespace-nowrap">
                                Viral Marketing <span className="vibing-crystal-text">Studio</span>
                            </h1>
                            <div className="flex items-center gap-1.5 px-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500/80 uppercase tracking-widest leading-none">
                                    {t('pro_dashboard.status_online')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 p-1 bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/40 dark:border-white/10 shadow-premium-sm shrink-0">
                        <div className="flex items-center gap-2.5 px-3 py-1.5 sm:px-4 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 group/tokens relative overflow-hidden">
                            <div className="absolute inset-0 bg-linear-to-r from-indigo-500/10 to-transparent opacity-0 group-hover/tokens:opacity-100 transition-opacity duration-500" />
                            <Zap size={14} className="text-indigo-600 dark:text-indigo-400 relative z-10 animate-pulse w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <div className="flex flex-col relative z-10">
                                <span className="text-[7px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] leading-none mb-0.5 hidden sm:block">{t('pro_dashboard.tokens_left').split(' ')[1]}</span>
                                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tabular-nums leading-none tracking-tight">
                                    {status?.pro_tokens || 0}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => { selection(); setShowSetup(true); }}
                            className="w-8 h-8 sm:w-10 sm:h-10 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 rounded-xl border border-white/60 dark:border-white/10 transition-all group active:scale-90 flex items-center justify-center shadow-xs"
                        >
                            <Settings size={16} className="text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 group-hover:rotate-45 transition-all duration-500 w-4 h-4 sm:w-4 sm:h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex p-1.5 bg-white/60 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[1.5rem] border border-white/60 dark:border-white/10 shadow-premium relative group/nav mt-4 mx-auto max-w-md w-full">
                    {(['studio', 'tools', 'growth'] as const).map((tab) => {
                        const tabConfig = {
                            studio: {
                                gradient: 'from-blue-600 via-indigo-500 to-blue-600',
                                shadow: 'shadow-indigo-500/20',
                                icon: 'text-indigo-100'
                            },
                            tools: {
                                gradient: 'from-amber-500 via-orange-500 to-amber-500',
                                shadow: 'shadow-orange-500/20',
                                icon: 'text-orange-100'
                            },
                            growth: {
                                gradient: 'from-emerald-500 via-teal-500 to-emerald-500',
                                shadow: 'shadow-emerald-500/20',
                                icon: 'text-emerald-100'
                            }
                        };

                        return (
                            <button
                                key={tab}
                                onClick={() => { selection(); setActiveTab(tab); impact('light'); }}
                                className={`flex-1 relative py-3 rounded-2xl transition-all duration-500 ${activeTab === tab
                                    ? 'text-white'
                                    : 'text-slate-400 dark:text-slate-500 hover:text-indigo-500'}`}
                            >
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className={`absolute inset-0 bg-linear-to-r ${tabConfig[tab].gradient} bg-size-[200%_auto] animate-gradient-xy rounded-2xl ${tabConfig[tab].shadow}`}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    >
                                        <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] rounded-2xl" />
                                    </motion.div>
                                )}
                                <span className="relative z-10 flex items-center justify-center gap-2.5">
                                    {tab === 'studio' && <Cpu size={16} className={`transition-transform duration-500 ${activeTab === tab ? 'scale-110' : 'group-hover/nav:rotate-12'}`} />}
                                    {tab === 'tools' && <Settings size={16} className={`transition-transform duration-500 ${activeTab === tab ? 'scale-110' : 'group-hover/nav:rotate-12'}`} />}
                                    {tab === 'growth' && <Users size={16} className={`transition-transform duration-500 ${activeTab === tab ? 'scale-110' : 'group-hover/nav:rotate-12'}`} />}
                                    <span className="text-[10px] font-black uppercase tracking-[0.15em]">{t(`pro_dashboard.tab_${tab}`)}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="relative min-h-[60vh] mt-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 animate-pulse">Syncing with Global Nodes...</p>
                        </div>
                    ) : status && !status.is_pro ? (
                        <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-white dark:bg-slate-900/50 backdrop-blur-3xl p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl max-w-sm w-full relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />
                                <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto mb-6 shadow-xl shadow-indigo-500/20">
                                    <Shield size={32} className="animate-pulse" />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-3 leading-tight">
                                    {t('pro_dashboard.locked.title')}
                                </h2>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                                    {t('pro_dashboard.locked.desc')}
                                </p>
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'subscription' }))}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-indigo-500/20"
                                >
                                    {t('pro_dashboard.locked.upgrade_btn')}
                                </button>
                            </motion.div>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                            >
                                {activeTab === 'studio' && status && (
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
                                        setShowHeadlineModal={setShowHeadlineModal}
                                        setShowBioModal={setShowBioModal}
                                        setShowAuditModal={setShowAuditModal}
                                        marketAudit={marketAudit}
                                        selection={selection}
                                    />
                                )}

                                {activeTab === 'growth' && status && (
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
                    )}
                </div>

            </div>

            <ProDashboardModals
                showAuditModal={showAuditModal}
                setShowAuditModal={setShowAuditModal}
                marketAudit={marketAudit}
                setActiveTab={setActiveTab}
                selectedArticle={selectedArticle}
                setSelectedArticle={setSelectedArticle}
                showManual={showManual}
                setShowManual={setShowManual}
                selection={selection}
                handleRefreshAudit={handleRefreshAudit}
                isAuditing={isAuditing}
                showSetup={showSetup}
                setShowSetup={setShowSetup}
                status={status}
                showHeadlineModal={showHeadlineModal}
                setShowHeadlineModal={setShowHeadlineModal}
                handleFixHeadline={handleFixHeadline}
                isFixingHeadline={isFixingHeadline}
                showBioModal={showBioModal}
                setShowBioModal={setShowBioModal}
                handleGenerateBio={handleGenerateBio}
                isGeneratingBio={isGeneratingBio}
            />
        </div>
    );
};
