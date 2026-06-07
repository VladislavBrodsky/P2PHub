import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { AnimatePresence, LazyMotion, domMax, m, MotionConfig } from 'framer-motion';
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
const FAQPage = lazy(prefetchPages.faq);
const StripeReturnPage = lazy(() => import('./pages/StripeReturnPage').then(m => ({ default: m.StripeReturnPage })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));

// #comment: Strategic Lazy Loading for non-critical features.
// SupportChat is a heavy component (icons + framer-motion animations).
// By lazy-loading it, we reduce the initial bundle size, speeding up TTI.
const SupportChat = lazy(() => import('./components/Support/SupportChat').then(m => ({ default: m.SupportChat })));


import { isTMA } from './utils/tma';
import { initTMA } from './utils/tmaInit';
import { parseDeepLink, getStartParam } from './utils/deepLink';
import { backButton } from '@telegram-apps/sdk-react';
import { useUser } from './context/UserContext';
import { useTranslation } from 'react-i18next';
import i18n, { loadResources } from './i18n';
import { PerformanceProvider } from './hooks/usePerformance';
// #comment: Removed unused apiClient, Skeleton and PageSkeleton imports to clean up the dependency list
import { NotificationOverlay } from './components/ui/NotificationOverlay';
import { PulseBanner } from './components/ui/PulseBanner';
import { DebugOverlay } from './components/ui/DebugOverlay';
import { SessionExpiredOverlay } from './components/ui/SessionExpiredOverlay';

const OnboardingStory = lazy(() => import('./components/Onboarding/OnboardingStory').then(m => ({ default: m.OnboardingStory })));
import { useConfig } from './context/ConfigContext';
import { FeatureErrorBoundary } from './components/FeatureErrorBoundary';
import { StartupLoader } from './components/ui/StartupLoader';
import { useStartupProgress } from './context/StartupProgressContext';
import { LOGO_DATA } from './data/avatars';

import { RevealSkeleton } from './components/Skeletons/RevealSkeleton';
import { UIProvider } from './context/UIContext';
import { TabPanel } from './components/ui/TabPanel';

// #comment: Removed hard import of SupportChat to enable the Lazy load strategy defined above.
import { useUI } from './context/UIContext';

const DashboardSkeleton = lazy(() => import('./components/Skeletons/DashboardSkeleton').then(m => ({ default: m.DashboardSkeleton })));

function AppContent({ onReady, showOnboarding }: { onReady: () => void; showOnboarding: boolean }) {
    const { t } = useTranslation('common');
    const { config } = useConfig();
    const { isSupportOpen, setSupportOpen, isDebugOpen, setDebugOpen } = useUI();
    const [activeTab, setActiveTab] = useState('home');
    const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['home']));
    // #comment: Removed unused showOnboarding state in AppContent as it is managed in the parent App component
    const { user, isLoading: isUserLoading } = useUser();
    const { updateProgress } = useStartupProgress();


    // Signal completion when both user and config are ready
    // #comment: Startup speed optimization. 
    // If we have cached data, we can signal 'Ready' earlier and let background refreshes happen silently.
    useEffect(() => {
        if (config && !isUserLoading) {
            updateProgress(100, 'User Verified');
            onReady();
        }
    }, [isUserLoading, config, onReady, updateProgress]);

    // Handle deep linking via startapp param
    useEffect(() => {
        const result = parseDeepLink(getStartParam());
        if (!result) return;

        setActiveTab(result.tab);
        if (result.payload) {
            const eventName = result.tab === 'blog' ? 'nav-blog-post' : 'nav-pro-tab';
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent(eventName, { detail: result.payload }));
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
            const rawPath = window.location.pathname.replace(/^\//, '');
            const validTabs = ['pro', 'admin', 'cards', 'partner', 'earn', 'league', 'blog', 'subscription', 'faq', 'home', 'stripe-return'];

            // Map aliases
            let path = rawPath;
            if (rawPath === 'community' || rawPath === 'marketing') path = 'partner';
            if (rawPath === 'growth') path = 'earn';
            if (rawPath === 'leaderboard') path = 'league';

            if (path === '' || path === 'home') {
                setActiveTab('home');
            } else if (validTabs.includes(path)) {
                setActiveTab(path);
            }
        };

        handlePathSync();
        window.addEventListener('popstate', handlePathSync);
        return () => window.removeEventListener('popstate', handlePathSync);
    }, []);

    // Helper to change tabs with URL synchronization
    const navigateTo = useCallback((tab: string) => {
        setActiveTab(tab);
        setVisitedTabs(prev => {
            if (prev.has(tab)) return prev;
            const next = new Set(prev);
            next.add(tab);
            return next;
        });
        const newPath = tab === 'home' ? '/' : `/${tab}`;
        if (window.location.pathname !== newPath) {
            window.history.pushState({ tab }, '', newPath);
        }
    }, []);


    // Initialize TMA SDK once
    useEffect(() => {
        const tmaTimeout = setTimeout(() => initTMA(updateProgress), 100);
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

    const isMobileDevice = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    // #comment: Guard behind isUserLoading — if the user is already stored in localStorage cache
    // and the context is still hydrating, we must NOT redirect to Login prematurely.
    const isDesktopGuest = !isUserLoading && !isTMA() && !user && !isMobileDevice;

    if (isDesktopGuest) {
        return (
            <Suspense fallback={null}>
                <Login />
            </Suspense>
        );
    }


    return (
        <Layout activeTab={activeTab} setActiveTab={navigateTo} prefetchPages={prefetchPages}>
            <div className={showOnboarding ? 'hidden' : 'block'}>
                <Suspense fallback={<RevealSkeleton />}>
                    <TabPanel id="home" activeTab={activeTab} visitedTabs={visitedTabs} featureName={t('system.features.dashboard')} fallback={<DashboardSkeleton />}>
                        <Dashboard setActiveTab={navigateTo} />
                    </TabPanel>

                    <TabPanel id="cards" activeTab={activeTab} visitedTabs={visitedTabs} featureName={t('system.features.cards')}>
                        <CardsPage setActiveTab={navigateTo} />
                    </TabPanel>

                    <TabPanel id="partner" activeTab={activeTab} visitedTabs={visitedTabs} featureName={t('system.features.community')}>
                        <CommunityPage />
                    </TabPanel>

                    <TabPanel id="earn" activeTab={activeTab} visitedTabs={visitedTabs} featureName={t('system.features.referral')}>
                        <ReferralPage />
                    </TabPanel>

                    <TabPanel id="league" activeTab={activeTab} visitedTabs={visitedTabs} featureName={t('system.features.leaderboard')}>
                        <LeaderboardPage />
                    </TabPanel>

                    <TabPanel id="subscription" activeTab={activeTab} visitedTabs={visitedTabs} featureName={t('system.features.subscription')}>
                        <SubscriptionPage />
                    </TabPanel>

                    <TabPanel id="blog" activeTab={activeTab} visitedTabs={visitedTabs} featureName={t('system.features.blog')}>
                        <BlogPage setActiveTab={navigateTo} currentTab={activeTab} />
                    </TabPanel>

                    <TabPanel id="admin" activeTab={activeTab} visitedTabs={visitedTabs} featureName={t('system.features.admin')}>
                        <AdminPage />
                    </TabPanel>

                    <TabPanel id="pro" activeTab={activeTab} visitedTabs={visitedTabs} featureName={t('system.features.pro_dashboard')}>
                        <ProPage />
                    </TabPanel>

                    <TabPanel id="faq" activeTab={activeTab} visitedTabs={visitedTabs} featureName={t('system.features.faq')}>
                        <FAQPage />
                    </TabPanel>

                    <TabPanel id="stripe-return" activeTab={activeTab} visitedTabs={visitedTabs} featureName="Stripe Return">
                        <StripeReturnPage />
                    </TabPanel>

                    {['coming_soon'].includes(activeTab) && (
                        <div className="flex flex-col items-center justify-center text-center px-10 h-full">
                            <div className="text-4xl mb-4">🚀</div>
                            <h2 className="text-2xl font-bold mb-2 uppercase text-text-primary">{t('system.coming_soon.title')}</h2>
                            <p className="text-text-secondary font-medium">
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

                {/* Debug Diagnostics Overlay */}
                <DebugOverlay isOpen={isDebugOpen} onClose={() => setDebugOpen(false)} />
            </div>
        </Layout>
    );
}

function App() {
    const { isLoading: isConfigLoading } = useConfig();
    const { progress, status, isComplete, complete, updateProgress } = useStartupProgress();
    const { isSessionExpired } = useUser();

    // Initialize from localStorage to avoid effect flash
    // #comment: Desktop (non-TMA) users bypass onboarding entirely — Login is their entry point.
    // Only mobile TMA users need the onboarding story flow.
    const [showOnboarding, setShowOnboarding] = useState(() => {
        try {
            if (!isTMA()) return false; // Desktop users → skip onboarding, go to Login
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
                    // Start prefetching logo immediately
                    const img = new Image();
                    img.src = LOGO_DATA;

                    // Start prefetching routes
                    prefetchPages.home();

                    // Delay heavy route prefetching slightly to prioritize TTI
                    setTimeout(() => {
                        Promise.all([
                            prefetchPages.earn(),
                            prefetchPages.cards(),
                            prefetchPages.partner(),
                            prefetchPages.league(),
                            prefetchPages.subscription(),
                            import('./utils/i18n-maps').then(async ({ featureToNamespace }) => {
                                const namespaces = ['cards', 'marketing', 'academy'];
                                namespaces.forEach(async (ns) => {
                                    if (!i18n.hasResourceBundle(i18n.language, ns)) {
                                        const res = await loadResources(i18n.language, ns);
                                        i18n.addResourceBundle(i18n.language, ns, res, true, true);
                                    }
                                });
                            })
                        ]).catch(e => console.debug('Lazy prefetch error', e));
                    }, 3000);
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
        <PerformanceProvider>
            <UIProvider>
                <MotionConfig reducedMotion="user">
                    <AnimatePresence>
                        {!isComplete && (
                        <m.div
                            key="loader"
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                            className="fixed inset-0 z-100"
                        >
                            <StartupLoader progress={progress} statusText={status} />
                        </m.div>
                    )}
                </AnimatePresence>

                <div className={!isComplete ? 'hidden' : 'block h-full relative'}>
                    <NotificationOverlay />
                    <SessionExpiredOverlay isOpen={isSessionExpired} />

                    <LazyMotion features={domMax}>
                        <m.div className="h-full">
                            <AnimatePresence mode="wait">
                                {showOnboarding ? (
                                    <m.div
                                        key="onboarding-overlay"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-200"
                                    >
                                        <Suspense fallback={<div className="fixed inset-0 bg-slate-950" />}>
                                            <OnboardingStory
                                                onComplete={() => {
                                                    setShowOnboarding(false);
                                                    localStorage.setItem('p2p_onboarded', 'true');
                                                }}
                                            />
                                        </Suspense>
                                    </m.div>
                                ) : (
                                    <m.div
                                        key="app-content-root"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className="h-full"
                                    >
                                        <AppContent onReady={complete} showOnboarding={false} />
                                    </m.div>
                                )}
                            </AnimatePresence>
                        </m.div>
                    </LazyMotion>
                </div>
            </MotionConfig>
        </UIProvider>
        </PerformanceProvider>
    );
}

export default App;
