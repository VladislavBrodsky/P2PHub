import { useState, useEffect } from 'react';
import { Layout } from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import CardsPage from './pages/Cards';
import CommunityPage from './pages/Community';
import ReferralPage from './pages/Referral';
import LeaderboardPage from './pages/Leaderboard';
import { miniApp, backButton, viewport, swipeBehavior } from '@telegram-apps/sdk-react';
import { UserProvider } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

function App() {
    const [activeTab, setActiveTab] = useState('home');

    // Initialize TMA SDK once
    useEffect(() => {
        const initTMA = async () => {
            try {
                // Initialize SDK components
                console.log('[DEBUG] initTMA: Starting...');

                // 1. Mount components (Safety first)
                if (miniApp.mount.isAvailable() && !miniApp.isMounted()) miniApp.mount();
                if (miniApp.ready.isAvailable()) miniApp.ready();
                if (backButton.mount.isAvailable() && !backButton.isMounted()) backButton.mount();

                // 2. Expansion Logic (Single pass)
                if (viewport.mount.isAvailable()) {
                    try {
                        if (!viewport.isMounted()) await viewport.mount();
                        if (viewport.expand.isAvailable() && !viewport.isExpanded()) {
                            viewport.expand();
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

                // 4. Fallback for older environments
                if (window.Telegram?.WebApp) {
                    window.Telegram.WebApp.ready();
                    if (!viewport.isMounted()) {
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
        let cleanup: VoidFunction | undefined;

        try {
            if (activeTab === 'home') {
                backButton.hide();
            } else {
                backButton.show();
                const handleBack = () => setActiveTab('home');
                cleanup = backButton.onClick(handleBack);
            }
        } catch (e) {
            // Ignore errors if backButton not mounted/available
        }

        return () => {
            if (cleanup) cleanup();
        };
    }, [activeTab]);

    return (
        <TonConnectUIProvider manifestUrl="https://p2phub-frontend-production.up.railway.app/tonconnect-manifest.json">
            <ThemeProvider>
                <UserProvider>
                    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
                        {activeTab === 'home' && <Dashboard setActiveTab={setActiveTab} />}
                        {activeTab === 'cards' && <CardsPage setActiveTab={setActiveTab} />}
                        {activeTab === 'partner' && <CommunityPage />}
                        {activeTab === 'earn' && <ReferralPage />}
                        {activeTab === 'league' && <LeaderboardPage />}
                        {['coming_soon'].includes(activeTab) && (
                            <div className="flex flex-col items-center justify-center h-[60vh] text-center px-10">
                                <div className="text-4xl mb-4">🚀</div>
                                <h2 className="text-2xl font-black mb-2 uppercase">Coming Soon</h2>
                                <p className="text-(--color-text-secondary) font-medium">
                                    We're building something amazing for our partners. Stay tuned!
                                </p>
                            </div>
                        )}
                    </Layout>
                </UserProvider>
            </ThemeProvider>
        </TonConnectUIProvider>
    );
}

export default App;
