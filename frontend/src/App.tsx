import { useState, useEffect } from 'react';
import { Layout } from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import CardsPage from './pages/Cards';
import CommunityPage from './pages/Community';
import ReferralPage from './pages/Referral';
import LeaderboardPage from './pages/Leaderboard';
import { miniApp, backButton, viewport } from '@telegram-apps/sdk-react';
import { UserProvider } from './context/UserContext';

function App() {
    const [activeTab, setActiveTab] = useState('home');

    useEffect(() => {
        const initTMA = async () => {
            try {
                // Initialize SDK components
                if (miniApp.mount.isAvailable()) miniApp.mount();
                if (miniApp.ready.isAvailable()) miniApp.ready();

                // Use Viewport for true full-screen/expanded state
                if (viewport.mount.isAvailable()) {
                    try {
                        await viewport.mount();
                        if (viewport.expand.isAvailable()) {
                            viewport.expand();
                        }
                    } catch (e) {
                        console.error('Viewport mount error:', e);
                    }
                }

                // Fallback for older environments
                if (window.Telegram?.WebApp) {
                    window.Telegram.WebApp.ready();
                    window.Telegram.WebApp.expand();
                }

                // Handle back button
                if (backButton.mount.isAvailable()) {
                    backButton.mount();
                    if (activeTab === 'home') {
                        backButton.hide();
                    } else {
                        backButton.show();
                        backButton.onClick(() => setActiveTab('home'));
                    }
                }
            } catch (e) {
                console.log('Not in TMA environment or SDK error:', e);
            }
        };

        initTMA();
    }, [activeTab]);

    return (
        <UserProvider>
            <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
                {activeTab === 'home' && <Dashboard />}
                {activeTab === 'cards' && <CardsPage />}
                {activeTab === 'partner' && <CommunityPage />}
                {activeTab === 'earn' && <ReferralPage />}
                {activeTab === 'league' && <LeaderboardPage />}
                {['coming_soon'].includes(activeTab) && (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-10">
                        <div className="text-4xl mb-4">🚀</div>
                        <h2 className="text-2xl font-black mb-2 uppercase">Coming Soon</h2>
                        <p className="text-[var(--color-text-secondary)] font-medium">
                            We're building something amazing for our partners. Stay tuned!
                        </p>
                    </div>
                )}
            </Layout>
        </UserProvider>
    );
}

export default App;
