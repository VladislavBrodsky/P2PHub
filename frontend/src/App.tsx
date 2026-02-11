import { useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import { Layout } from './components/Layout/Layout';
// Lazy load pages
const DashboardLoader = () => import('./pages/Dashboard');
const CardsLoader = () => import('./pages/Cards');
const CommunityLoader = () => import('./pages/Community');
const ReferralLoader = () => import('./pages/Referral');
const LeaderboardLoader = () => import('./pages/Leaderboard');
const SubscriptionLoader = () => import('./pages/Subscription');
const BlogLoader = () => import('./pages/BlogPage').then(m => ({ default: m.BlogPage }));
const AdminLoader = () => import('./pages/AdminPage').then(m => ({ default: m.AdminPage }));

const Dashboard = lazy(DashboardLoader);
const CardsPage = lazy(CardsLoader);
const CommunityPage = lazy(CommunityLoader);
const ReferralPage = lazy(ReferralLoader);
const LeaderboardPage = lazy(LeaderboardLoader);
const SubscriptionPage = lazy(SubscriptionLoader);
const BlogPage = lazy(BlogLoader);
const AdminPage = lazy(AdminLoader);

export const prefetchPages = {
    home: DashboardLoader,
    cards: CardsLoader,
    partner: CommunityLoader,
    earn: ReferralLoader,
    league: LeaderboardLoader,
    subscription: SubscriptionLoader,
    blog: BlogLoader,
    admin: AdminLoader,
};


import { miniApp, backButton, viewport, swipeBehavior } from '@telegram-apps/sdk-react';
import { UserProvider } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { isTMA } from './utils/tma';
import { useUser } from './context/UserContext';
import { apiClient } from './api/client';
import { NotificationOverlay } from './components/ui/NotificationOverlay';
import { useRealtimeAlerts } from './hooks/useRealtimeAlerts';
import { Skeleton } from './components/Skeleton';
import { PageSkeleton } from './components/Skeletons/PageSkeleton';
import { OnboardingStory } from './components/Onboarding/OnboardingStory';
import { useConfig } from './context/ConfigContext';

function AppContent() {
    const { config } = useConfig();
    const [activeTab, setActiveTab] = useState('home');
    const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['home']));
    const [showOnboarding, setShowOnboarding] = useState(false);
    const { user, updateUser } = useUser();
    useRealtimeAlerts();

    // Check onboarding status
    useEffect(() => {
        const hasOnboarded = localStorage.getItem('p2p_onboarded');
        if (!hasOnboarded) {
            setShowOnboarding(true);
        }
    }, []);

    // Track visited tabs to keep components mounted after first load
    useEffect(() => {
        if (!visitedTabs.has(activeTab)) {
            setVisitedTabs(prev => new Set(prev).add(activeTab));
        }
    }, [activeTab]);

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
            } catch (e) {
                console.log('Not in TMA environment or SDK error:', e);
            }
        };

        initTMA();
    }, []);

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
            <Suspense fallback={<PageSkeleton />}>
                <div className={`h-full ${activeTab === 'home' ? 'block' : 'hidden'}`}>
                    {visitedTabs.has('home') && <Dashboard setActiveTab={setActiveTab} />}
                </div>
                <div className={`h-full ${activeTab === 'cards' ? 'block' : 'hidden'}`}>
                    {visitedTabs.has('cards') && <CardsPage setActiveTab={setActiveTab} />}
                </div>
                <div className={`h-full ${activeTab === 'partner' ? 'block' : 'hidden'}`}>
                    {visitedTabs.has('partner') && <CommunityPage />}
                </div>
                <div className={`h-full ${activeTab === 'earn' ? 'block' : 'hidden'}`}>
                    {visitedTabs.has('earn') && <ReferralPage />}
                </div>
                <div className={`h-full ${activeTab === 'league' ? 'block' : 'hidden'}`}>
                    {visitedTabs.has('league') && <LeaderboardPage />}
                </div>
                <div className={`h-full ${activeTab === 'subscription' ? 'block' : 'hidden'}`}>
                    {visitedTabs.has('subscription') && <SubscriptionPage />}
                </div>
                <div className={`h-full ${activeTab === 'blog' ? 'block' : 'hidden'}`}>
                    {visitedTabs.has('blog') && <BlogPage setActiveTab={setActiveTab} currentTab={activeTab} />}
                </div>
                <div className={`h-full ${activeTab === 'admin' ? 'block' : 'hidden'}`}>
                    {visitedTabs.has('admin') && <AdminPage />}
                </div>

                {['coming_soon'].includes(activeTab) && (
                    <div className="flex flex-col items-center justify-center text-center px-10 h-full">
                        <div className="text-4xl mb-4">🚀</div>
                        <h2 className="text-2xl font-black mb-2 uppercase">Coming Soon</h2>
                        <p className="text-(--color-text-secondary) font-medium">
                            We're building something amazing for our partners. Stay tuned!
                        </p>
                    </div>
                )}
            </Suspense>
        </Layout>
    );
}

function App() {
    const { config, isLoading: isConfigLoading } = useConfig();
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Initial check for onboarding to avoid flash if possible
    useEffect(() => {
        const hasOnboarded = localStorage.getItem('p2p_onboarded');
        if (!hasOnboarded) {
            setShowOnboarding(true);
        }
    }, []);

    if (isConfigLoading) {
        return (
            <div className="h-screen w-full bg-(--color-bg-deep) flex items-center justify-center p-8">
                <Skeleton className="w-full h-full max-w-md rounded-3xl" />
            </div>
        );
    }

    return (
        <TonConnectUIProvider manifestUrl={config?.ton_manifest_url || "https://p2phub-frontend-production.up.railway.app/tonconnect-manifest.json"}>
            <ThemeProvider>
                <UserProvider>
                    <NotificationOverlay />
                    <LazyMotion features={domAnimation}>
                        <AnimatePresence mode="wait">
                            {showOnboarding && (
                                <OnboardingStory
                                    onComplete={() => {
                                        setShowOnboarding(false);
                                        localStorage.setItem('p2p_onboarded', 'true');
                                    }}
                                />
                            )}
                        </AnimatePresence>
                        <AppContent />
                    </LazyMotion>
                </UserProvider>
            </ThemeProvider>
        </TonConnectUIProvider>
    );
}

export default App;
