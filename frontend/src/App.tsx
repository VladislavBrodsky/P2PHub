import { useState, useEffect } from 'react';
import { Layout } from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import CardsPage from './pages/Cards';
import CommunityPage from './pages/Community';
import ReferralPage from './pages/Referral';
import LeaderboardPage from './pages/Leaderboard';
// import { miniApp } from '@telegram-apps/sdk-react';

function App() {
    const [activeTab, setActiveTab] = useState('home');

    // useEffect(() => {
    //     // Expand on mount if available
    //     try {
    //         if (miniApp.ready.isAvailable()) {
    //             miniApp.ready();
    //         }
    //     } catch (e) {
    //         console.log('Not in TMA environment');
    //         // If sdk-react is not working, try the old sdk or ignore
    //     }
    // }, []);

    return (
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
    );
}

export default App;
