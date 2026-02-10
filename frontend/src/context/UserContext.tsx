import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../api/client';
import { getSafeLaunchParams } from '../utils/tma';

interface User {
    id: number;
    telegram_id: string;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
    balance: number;
    total_earned?: number; // Sum of all PRO commissions
    level: number;
    xp: number;
    referral_code: string;
    referrals: any[]; // Extended for Earn Hub
    completed_tasks: string;
    is_pro: boolean;
    is_admin: boolean;
    pro_expires_at: string | null;
    subscription_plan: string | null;

}

interface UserContextType {
    user: User | null;
    isLoading: boolean;
    refreshUser: () => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const saved = localStorage.getItem('p2p_user_cache');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error('[DEBUG] Corrupted User Cache:', e);
            localStorage.removeItem('p2p_user_cache');
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState(!user);
    const lastRefresh = React.useRef(0);

    const updateUser = (updates: Partial<User>) => {
        setUser(prev => {
            const next = prev ? { ...prev, ...updates } : null;
            if (next) localStorage.setItem('p2p_user_cache', JSON.stringify(next));
            return next;
        });
    };

    const refreshUser = async () => {
        const now = Date.now();
        // Throttle refreshes to once every 10 seconds unless forced
        if (now - lastRefresh.current < 10000) return;
        lastRefresh.current = now;

        let tgUser: any = null;
        try {
            // Use Safe SDK helper to get initData without crashing in browser
            const lp = getSafeLaunchParams();
            tgUser = lp.initData?.user;

            console.log('[DEBUG] refreshUser: Fetching profile...');

            const res = await apiClient.get('/api/partner/me');

            const userData = res.data;



            // Enrich with Telegram SDK data if backend is missing details
            if (tgUser) {
                if (!userData.photo_url && tgUser.photoUrl) userData.photo_url = tgUser.photoUrl;
                if (!userData.first_name && tgUser.firstName) userData.first_name = tgUser.firstName;
                if (!userData.last_name && tgUser.lastName) userData.last_name = tgUser.lastName;
            }

            console.log('[DEBUG] refreshUser: Success:', userData.first_name);
            setUser(userData);
            localStorage.setItem('p2p_user_cache', JSON.stringify(userData));
        } catch (error) {
            console.error('[DEBUG] refreshUser: Failed:', error);
            // Fallback: If backend fails, use Telegram SDK data for UI personalization (Optimistic UI)
            if (tgUser && !user) {
                const fallbackUser = {
                    id: tgUser.id,
                    telegram_id: String(tgUser.id),
                    username: tgUser.username || null,
                    first_name: tgUser.firstName,
                    last_name: tgUser.lastName || null,
                    photo_url: tgUser.photoUrl || null,
                    balance: 0,
                    level: 1,
                    xp: 0,
                    referral_code: 'UNVERIFIED',
                    referrals: [],
                    completed_tasks: "[]",
                    is_pro: false,
                    is_admin: false,
                    pro_expires_at: null,
                    subscription_plan: null

                };
                setUser(fallbackUser);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                // Fast path for local development
                if (import.meta.env.DEV && !window.Telegram?.WebApp?.initData) {
                    console.log('[DEBUG] Dev mode detected, mocking user immediately');
                    const devUser = {
                        id: 999,
                        telegram_id: '123456789',
                        username: 'dev_partner',
                        first_name: 'Dev',
                        last_name: 'User',
                        photo_url: null,
                        balance: 5000,
                        level: 5,
                        xp: 150,
                        referral_code: 'DEV-TEST',
                        referrals: [],
                        completed_tasks: "[]",
                        is_pro: true,
                        is_admin: true,
                        pro_expires_at: null,
                        subscription_plan: "DEV_PRO"

                    };
                    setUser(devUser);
                    setIsLoading(false);
                    return;
                }

                // Wait for Telegram environment
                let attempts = 0;
                const checkData = async () => {
                    try {
                        if (window.Telegram?.WebApp?.initData) {
                            await refreshUser();
                        } else if (attempts < 5) { // Reduced attempts to avoid long hangs
                            attempts++;
                            setTimeout(checkData, 500);
                        } else {
                            console.log('[DEBUG] Proceeding with refresh anyway');
                            await refreshUser();
                        }
                    } catch (e) {
                        setIsLoading(false);
                    }
                };

                checkData();
            } catch (e) {
                setIsLoading(false);
            }
        };

        init();

        // Throttled focus listener
        const handleFocus = () => {
            console.log('[DEBUG] Window focused, checking user state');
            refreshUser();
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    return (
        <UserContext.Provider value={{ user, isLoading, refreshUser, updateUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
