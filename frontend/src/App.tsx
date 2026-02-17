// Deployment Track: 2026-02-16T18:40 [v1.7.2 Force Redeploy]
import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { AnimatePresence, LazyMotion, domAnimation, motion } from 'framer-motion';
import { Layout } from './components/Layout/Layout';
// #comment: Reorganized imports and lazy declarations to satisfy Fast Refresh (react-refresh/only-export-components).
// Constants and non-component exports (like prefetchPages) were moved to separate utility files.
import { prefetchPages } from './utils/navigation';

const Dashboard = lazy(prefetchPages.home);
const CardsPage = lazy(prefetchPages.cards);
const CommunityPage = lazy(prefetchPages.partner);
const ReferralPage = lazy(prefetchPages.earn);
const LeaderboardPage = lazy(prefetchPages.league);
const SubscriptionPage = lazy(prefetchPages.subscription);
const BlogPage = lazy(prefetchPages.blog);
const AdminPage = lazy(prefetchPages.admin);
const ProPage = lazy(prefetchPages.pro);
// #comment: Strategic Lazy Loading for non-critical features.
// SupportChat is a heavy component (icons + framer-motion animations).
// By lazy-loading it, we reduce the initial bundle size, speeding up TTI.
const SupportChat = lazy(() => import('./components/Support/SupportChat').then(m => ({ default: m.SupportChat })));


import { miniApp, backButton, viewport, swipeBehavior } from '@telegram-apps/sdk-react';
import { isTMA } from './utils/tma';
import { useUser } from './context/UserContext';
import { useTranslation } from 'react-i18next';
// #comment: Removed unused apiClient, Skeleton and PageSkeleton imports to clean up the dependency list
import { NotificationOverlay } from './components/ui/NotificationOverlay';
import { useRealtimeAlerts } from './hooks/useRealtimeAlerts';
const OnboardingStory = lazy(() => import('./components/Onboarding/OnboardingStory').then(m => ({ default: m.OnboardingStory })));
import { useConfig } from './context/ConfigContext';
import { FeatureErrorBoundary } from './components/FeatureErrorBoundary';
import { StartupLoader } from './components/ui/StartupLoader';
import { useStartupProgress } from './context/StartupProgressContext';

import { RevealSkeleton } from './components/Skeletons/RevealSkeleton';
import { UIProvider } from './context/UIContext';

// #comment: Removed hard import of SupportChat to enable the Lazy load strategy defined above.
import { useUI } from './context/UIContext';

const DashboardSkeleton = lazy(() => import('./components/Skeletons/DashboardSkeleton').then(m => ({ default: m.DashboardSkeleton })));

function AppContent({ onReady, showOnboarding }: { onReady: () => void; showOnboarding: boolean }) {
    const { t } = useTranslation();
    const { config } = useConfig();
    const { isSupportOpen, setSupportOpen } = useUI();
    const [activeTab, setActiveTab] = useState('home');
    const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['home']));
    // #comment: Removed unused showOnboarding state in AppContent as it is managed in the parent App component
    const { isLoading: isUserLoading } = useUser();
    const { updateProgress } = useStartupProgress();
    useRealtimeAlerts();

    // Signal completion when both user and config are ready
    useEffect(() => {
        if (!isUserLoading && config) {
            updateProgress(95, 'Finalizing UI...');
            const timer = setTimeout(onReady, 50);
            return () => clearTimeout(timer);
        }
    }, [isUserLoading, config, onReady, updateProgress]);

    // Handle deep linking via startapp param
    useEffect(() => {
        const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
        const urlParams = new URLSearchParams(window.location.search);
        const urlStartParam = urlParams.get('start_param') || urlParams.get('startapp');

        if (startParam === 'network' || urlStartParam === 'network') {
            setActiveTab('partner');
        } else if (startParam?.startsWith('blog_') || urlStartParam?.startsWith('blog_')) {
            const slug = (startParam || urlStartParam)?.replace('blog_', '');
            setActiveTab('blog');
            // Small delay to ensure BlogPage component is mounted and event listener is ready
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('nav-blog-post', { detail: slug }));
            }, 500);
        } else if (startParam?.startsWith('pro_') || urlStartParam?.startsWith('pro_')) {
            const tab = (startParam || urlStartParam)?.replace('pro_', '');
            setActiveTab('pro');
            // Small delay to ensure ProPage component is mounted and event listener is ready
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('nav-pro-tab', { detail: tab }));
            }, 500);
        }
    }, []);

    // Track visited tabs to keep components mounted after first load
    useEffect(() => {
        if (!visitedTabs.has(activeTab)) {
            setVisitedTabs(prev => new Set(prev).add(activeTab));
        }
    }, [activeTab, visitedTabs]);

    // Sync activeTab with URL path handles direct links and back button
    useEffect(() => {
        const handlePathSync = () => {
            const path = window.location.pathname.replace(/^\//, '');
            const validTabs = ['pro', 'admin', 'cards', 'partner', 'earn', 'league', 'blog', 'subscription'];
            if (validTabs.includes(path)) {
                setActiveTab(path);
            } else if (path === '' || path === 'home') {
                setActiveTab('home');
            }
        };

        handlePathSync();
        window.addEventListener('popstate', handlePathSync);
        return () => window.removeEventListener('popstate', handlePathSync);
    }, []);

    // Helper to change tabs with URL synchronization
    const navigateTo = useCallback((tab: string) => {
        setActiveTab(tab);
        const newPath = tab === 'home' ? '/' : `/${tab}`;
        if (window.location.pathname !== newPath) {
            window.history.pushState({ tab }, '', newPath);
        }
    }, []);


    // Initialize TMA SDK once
    useEffect(() => {
        const initTMA = async () => {
            if (!isTMA()) {
                console.log('[DEBUG] initTMA: Not in TMA, skipping SDK initialization');
                return;
            }
            try {
                // Initialize SDK components
                console.log('[DEBUG] initTMA: Starting...');

                // 1. Mount components (Safety first)
                if (miniApp.mount.isAvailable() && !miniApp.isMounted()) miniApp.mount();
                if (miniApp.ready.isAvailable()) miniApp.ready();
                if (backButton.mount.isAvailable() && !backButton.isMounted()) backButton.mount();

                // 2. Expansion & Fullscreen (Immersive Mode)
                if (viewport.mount.isAvailable()) {
                    try {
                        if (!viewport.isMounted()) await viewport.mount();

                        // Aggressive expansion
                        if (viewport.expand.isAvailable()) {
                            viewport.expand();
                            console.log('[DEBUG] initTMA: viewport expanded');
                        }

                        // Support for new Fullscreen API if available
                        if ((viewport as any).requestFullscreen && (viewport as any).requestFullscreen.isAvailable?.()) {
                            (viewport as any).requestFullscreen();
                            console.log('[DEBUG] initTMA: Fullscreen requested via SDK');
                        }
                    } catch (e) {
                        console.warn('Viewport error:', e);
                    }
                }

                // 3. Swipe Locking (Single pass)
                if (swipeBehavior.mount.isAvailable()) {
                    try {
                        if (!swipeBehavior.isMounted()) await swipeBehavior.mount();
                        if (swipeBehavior.disableVertical.isAvailable()) {
                            swipeBehavior.disableVertical();
                        }
                    } catch (e) {
                        console.warn('Swipe error:', e);
                    }
                }

                // 4. Fallback for older environments / direct JS
                if (window.Telegram?.WebApp) {
                    window.Telegram.WebApp.ready();
                    if ((window.Telegram.WebApp as any).requestFullscreen) {
                        (window.Telegram.WebApp as any).requestFullscreen();
                    }
                    console.log('[DEBUG] initTMA: SDK methods executing...');
                }

                console.log('[DEBUG] initTMA: Complete');
                updateProgress(98, 'Interface Ready');
            } catch (e) {
                console.error('[CRITICAL] initTMA: Initialization failure:', e);
            }
        };

        const tmaTimeout = setTimeout(initTMA, 100);
        return () => clearTimeout(tmaTimeout);
    }, [updateProgress]);

    useEffect(() => {
        if (!isTMA()) return;

        let cleanup: VoidFunction | undefined;

        try {
            if (activeTab === 'home') {
                if (backButton.hide.isAvailable()) backButton.hide();
            } else if (activeTab !== 'blog') {
                // Blog tab handles its own hierarchical back button
                if (backButton.show.isAvailable()) backButton.show();
                const handleBack = () => navigateTo('home');
                cleanup = backButton.onClick(handleBack);
            }
        } catch (e) {
            console.warn('[SDK] backButton error:', e);
        }

        return () => {
            if (cleanup) cleanup();
        };
    }, [activeTab, navigateTo]);

    // We no longer return null here to ensure the TMA SDK initialization and other effects
    // always run correctly. Instead, the UI is controlled by visibility.
    // if (showOnboarding) return null;

    return (
        <Layout activeTab={activeTab} setActiveTab={navigateTo} prefetchPages={prefetchPages}>
            <div className={showOnboarding ? 'hidden' : 'block h-full'}>
                <Suspense fallback={<RevealSkeleton />}>
                    <div className={`h-full ${activeTab === 'home' ? 'block' : 'hidden'}`}>
                        {visitedTabs.has('home') && (
                            <FeatureErrorBoundary featureName="Dashboard">
                                <Suspense fallback={<DashboardSkeleton />}>
                                    <Dashboard setActiveTab={navigateTo} />
                                </Suspense>
                            </FeatureErrorBoundary>
                        )}
                    </div>
                    <div className={`h-full ${activeTab === 'cards' ? 'block' : 'hidden'}`}>
                        {visitedTabs.has('cards') && (
                            <FeatureErrorBoundary featureName="Cards">
                                <CardsPage setActiveTab={setActiveTab} />
                            </FeatureErrorBoundary>
                        )}
                    </div>
                    <div className={`h-full ${activeTab === 'partner' ? 'block' : 'hidden'}`}>
                        {visitedTabs.has('partner') && (
                            <FeatureErrorBoundary featureName="Community Orbit">
                                <CommunityPage />
                            </FeatureErrorBoundary>
                        )}
                    </div>
                    <div className={`h-full ${activeTab === 'earn' ? 'block' : 'hidden'}`}>
                        {visitedTabs.has('earn') && (
                            <FeatureErrorBoundary featureName="Referral Program">
                                <ReferralPage />
                            </FeatureErrorBoundary>
                        )}
                    </div>
                    <div className={`h-full ${activeTab === 'league' ? 'block' : 'hidden'}`}>
                        {visitedTabs.has('league') && (
                            <FeatureErrorBoundary featureName="Leaderboard">
                                <LeaderboardPage />
                            </FeatureErrorBoundary>
                        )}
                    </div>
                    <div className={`h-full ${activeTab === 'subscription' ? 'block' : 'hidden'}`}>
                        {visitedTabs.has('subscription') && (
                            <FeatureErrorBoundary featureName="Subscription">
                                <SubscriptionPage />
                            </FeatureErrorBoundary>
                        )}
                    </div>
                    <div className={`h-full ${activeTab === 'blog' ? 'block' : 'hidden'}`}>
                        {visitedTabs.has('blog') && (
                            <FeatureErrorBoundary featureName="Blog">
                                <BlogPage setActiveTab={setActiveTab} currentTab={activeTab} />
                            </FeatureErrorBoundary>
                        )}
                    </div>
                    <div className={`h-full ${activeTab === 'admin' ? 'block' : 'hidden'}`}>
                        {visitedTabs.has('admin') && (
                            <FeatureErrorBoundary featureName="Admin Panel">
                                <AdminPage />
                            </FeatureErrorBoundary>
                        )}
                    </div>
                    <div className={`h-full ${activeTab === 'pro' ? 'block' : 'hidden'}`}>
                        {visitedTabs.has('pro') && (
                            <FeatureErrorBoundary featureName="PRO Dashboard">
                                <ProPage />
                            </FeatureErrorBoundary>
                        )}
                    </div>

                    {['coming_soon'].includes(activeTab) && (
                        <div className="flex flex-col items-center justify-center text-center px-10 h-full">
                            <div className="text-4xl mb-4">🚀</div>
                            <h2 className="text-2xl font-black mb-2 uppercase text-(--color-text-primary)">{t('system.coming_soon.title')}</h2>
                            <p className="text-(--color-text-secondary) font-medium">
                                {t('system.coming_soon.desc')}
                            </p>
                        </div>
                    )}
                </Suspense>
                {/* #comment: Render SupportChat within Suspense to handle lazy loading transition */}
                <Suspense fallback={null}>
                    {isSupportOpen && (
                        <SupportChat isOpen={isSupportOpen} onClose={() => setSupportOpen(false)} />
                    )}
                </Suspense>
            </div>
        </Layout>
    );
}

function App() {
    const { isLoading: isConfigLoading } = useConfig();
    const { progress, status, isComplete, complete, updateProgress } = useStartupProgress();

    // Initialize from localStorage to avoid effect flash
    const [showOnboarding, setShowOnboarding] = useState(() => {
        try {
            return !localStorage.getItem('p2p_onboarded');
        } catch {
            return false;
        }
    });

    // #comment: Parallel Initialization Strategy
    // Trigger prefetching immediately to load JS chunks while config/user APIs are pending.
    useEffect(() => {
        if (!showOnboarding) {
            const prefetchCoreRoutes = async () => {
                try {
                    // Start prefetching immediately
                    prefetchPages.home();

                    // Delay heavy route prefetching slightly to prioritize TTI
                    setTimeout(() => {
                        Promise.all([
                            prefetchPages.earn(),
                            prefetchPages.cards(),
                            prefetchPages.partner(),
                            prefetchPages.league(),
                            prefetchPages.subscription()
                        ]).catch(e => console.debug('Lazy prefetch error', e));
                    }, 2000);
                } catch (e) {
                    console.warn('Prefetch failed', e);
                }
            };
            prefetchCoreRoutes();
        } else {
            // #comment: Eagerly load Onboarding if needed
            import('./components/Onboarding/OnboardingStory');
        }
    }, [showOnboarding]);

    // Update progress when config loads
    useEffect(() => {
        if (!isConfigLoading) {
            updateProgress(50, 'Config Loaded');
        }
    }, [isConfigLoading, updateProgress]);

    return (
        <UIProvider>
            <AnimatePresence>
                {!isComplete && (
                    <motion.div
                        key="loader"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="fixed inset-0 z-100"
                    >
                        <StartupLoader progress={progress} statusText={status} />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={!isComplete ? 'hidden' : 'block h-full'}>
                <NotificationOverlay />
                <LazyMotion features={domAnimation}>
                    <AnimatePresence mode="wait">
                        {showOnboarding && (
                            <Suspense fallback={<div className="fixed inset-0 bg-slate-950 z-200" />}>
                                <OnboardingStory
                                    onComplete={() => {
                                        setShowOnboarding(false);
                                        localStorage.setItem('p2p_onboarded', 'true');
                                    }}
                                />
                            </Suspense>
                        )}
                    </AnimatePresence>
                    <AppContent onReady={complete} showOnboarding={showOnboarding} />
                </LazyMotion>
            </div>
        </UIProvider>
    );
}

export default App;
