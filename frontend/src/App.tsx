import { useState, useEffect, lazy, Suspense } from 'react';
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
// import { OnboardingStory } from './components/Onboarding/OnboardingStory';
import { useConfig } from './context/ConfigContext';
import { FeatureErrorBoundary } from './components/FeatureErrorBoundary';
import { StartupLoader } from './components/ui/StartupLoader';
import { useStartupProgress } from './context/StartupProgressContext';

import { RevealSkeleton } from './components/Skeletons/RevealSkeleton';
import { UIProvider } from './context/UIContext';

// #comment: Removed hard import of SupportChat to enable the Lazy load strategy defined above.
import { useUI } from './context/UIContext';

const OnboardingStory = lazy(() => import('./components/Onboarding/OnboardingStory').then(m => ({ default: m.OnboardingStory })));

function AppContent({ onReady }: { onReady: () => void }) {
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
            updateProgress(95, t('system.loading.finalizing'));
            // Small delay to ensure smooth transition
            const timer = setTimeout(onReady, 500);
            return () => clearTimeout(timer);
        }
    }, [isUserLoading, config, onReady, updateProgress, t]);

    // Track visited tabs to keep components mounted after first load
    useEffect(() => {
        if (!visitedTabs.has(activeTab)) {
            setVisitedTabs(prev => new Set(prev).add(activeTab));
        }
        // #comment: Added visitedTabs to the dependency array to ensure the effect has access to the latest state
    }, [activeTab, visitedTabs]);

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
                    } else {
                        window.Telegram.WebApp.expand();
                    }
                }

                console.log('[DEBUG] initTMA: Complete');
                updateProgress(98, t('system.loading.ready'));
            } catch (e) {
                console.log('Not in TMA environment or SDK error:', e);
            }
        };

        initTMA();
    }, [updateProgress, t]);

    // Handle Back Button state based on active tab
    useEffect(() => {
        if (!isTMA()) return;

        let cleanup: VoidFunction | undefined;

        try {
            if (activeTab === 'home') {
                if (backButton.hide.isAvailable()) backButton.hide();
            } else if (activeTab !== 'blog') {
                // Blog tab handles its own hierarchical back button
                if (backButton.show.isAvailable()) backButton.show();
                const handleBack = () => setActiveTab('home');
                cleanup = backButton.onClick(handleBack);
            }
        } catch (e) {
            console.warn('[SDK] backButton error:', e);
        }

        return () => {
            if (cleanup) cleanup();
        };
    }, [activeTab]);

    return (
        <Layout activeTab={activeTab} setActiveTab={setActiveTab} prefetchPages={prefetchPages}>
            <Suspense fallback={<RevealSkeleton />}>
                <div className={`h-full ${activeTab === 'home' ? 'block' : 'hidden'}`}>
                    {visitedTabs.has('home') && (
                        <FeatureErrorBoundary featureName="Dashboard">
                            <Dashboard setActiveTab={setActiveTab} />
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
                        <h2 className="text-2xl font-black mb-2 uppercase">{t('system.coming_soon.title')}</h2>
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
        </Layout>
    );
}

function App() {
    const { t } = useTranslation();
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
    // Instead of sequential waiting, we trigger config/user fetches and prefetch the dashboard
    // code immediately. This concurrently loads data and JS bundles while the StartupLoader 
    // provides smooth visual feedback to the user.
    useEffect(() => {
        if (!isConfigLoading && !showOnboarding) {
            updateProgress(50, t('system.loading.config_loaded'));

            // #comment: Aggressive Prefetch Strategy
            // Immediately start loading all core route chunks to ensure instant navigation.
            // This eliminates the RevealSkeleton flash when switching tabs.
            const prefetchCoreRoutes = async () => {
                try {
                    // Critical path
                    await prefetchPages.home();

                    // Secondary paths (Parallel fetch)
                    Promise.all([
                        prefetchPages.earn(),
                        prefetchPages.cards(),
                        prefetchPages.partner(),
                        prefetchPages.league(),
                        prefetchPages.subscription()
                    ]).catch(e => console.debug('Prefetch error', e));

                } catch (e) {
                    console.warn('Prefetch failed', e);
                }
            };

            prefetchCoreRoutes();
        }
    }, [isConfigLoading, showOnboarding, updateProgress, t]);

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
                            <Suspense fallback={null}>
                                <OnboardingStory
                                    onComplete={() => {
                                        setShowOnboarding(false);
                                        localStorage.setItem('p2p_onboarded', 'true');
                                    }}
                                />
                            </Suspense>
                        )}
                    </AnimatePresence>
                    <AppContent onReady={complete} />
                </LazyMotion>
            </div>
        </UIProvider>
    );
}

export default App;
