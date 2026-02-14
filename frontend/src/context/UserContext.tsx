import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../api/client';
import * as Sentry from "@sentry/react";
import { getSafeLaunchParams } from '../utils/tma';
import { useStartupProgress } from './StartupProgressContext';

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
    referral_count: number;
    referrals: any[]; // Extended for Earn Hub
    completed_tasks: string;
    completed_stages: number[]; // Added for Academy
    is_pro: boolean;
    is_admin: boolean;
    pro_expires_at: string | null;
    subscription_plan: string | null;
    total_network_size: number;
    pro_notification_seen: boolean;
    last_checkin_at: string | null;
    checkin_streak: number;
    active_tasks?: ActiveTask[];
}

export interface ActiveTask {
    task_id: string;
    status: string; // STARTED
    initial_metric_value: number;
    started_at: string;
}

interface UserContextType {
    user: User | null;
    isLoading: boolean;
    refreshUser: (force?: boolean) => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
    completeStage: (id: number) => Promise<void>;
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

    const updateUser = React.useCallback((updates: Partial<User>) => {
        setUser(prev => {
            const next = prev ? { ...prev, ...updates } : null;
            if (next) localStorage.setItem('p2p_user_cache', JSON.stringify(next));
            return next;
        });
    }, []);

    const { updateProgress } = useStartupProgress();

    const completeStage = React.useCallback(async (id: number) => {
        // Optimistic update
        updateUser({
            completed_stages: user?.completed_stages ? [...user.completed_stages, id] : [id]
        });

        try {
            await apiClient.post(`/api/partner/academy/stages/${id}/complete`);
        } catch (error) {
            console.error('Failed to persist stage completion:', error);
            // Optionally rollback if needed, but usually optimistic is fine for this
        }
    }, [user, updateUser]);

    const refreshUser = React.useCallback(async (force = false) => {
        const now = Date.now();
        // Throttle refreshes to once every 10 seconds unless forced
        if (!force && now - lastRefresh.current < 10000) return;
        lastRefresh.current = now;

        updateProgress(60, 'Fetching Profile...');
        let tgUser: any = null;
        try {
            // Use Safe SDK helper to get initData without crashing in browser
            const lp = getSafeLaunchParams();
            tgUser = lp.initData?.user;

            console.log('[DEBUG] refreshUser: Fetching profile...');

            const res = await apiClient.get('/api/partner/me');

            const userData = res.data;

            // Ensure completed_stages exists (backend might not send it yet)
            if (!userData.completed_stages) {
                userData.completed_stages = [];
            }

            // Enrich with Telegram SDK data if backend is missing details
            if (tgUser) {
                if (!userData.photo_url && tgUser.photoUrl) userData.photo_url = tgUser.photoUrl;
                if (!userData.first_name && tgUser.firstName) userData.first_name = tgUser.firstName;
                if (!userData.last_name && tgUser.lastName) userData.last_name = tgUser.lastName;
            }

            console.log('[DEBUG] refreshUser: Success:', userData.first_name);
            setUser(userData);
            updateProgress(90, 'User Verified');
            localStorage.setItem('p2p_user_cache', JSON.stringify(userData));
        } catch (error) {
            console.error('[DEBUG] refreshUser: Failed:', error);
            // Fallback: If backend fails, use Telegram SDK data for UI personalization (Optimistic UI)
            if (tgUser) {
                setUser(prev => {
                    if (prev) return prev;
                    return {
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
                        referral_count: 0,
                        referrals: [],
                        completed_tasks: "[]",
                        completed_stages: [],
                        is_pro: false,
                        is_admin: false,
                        pro_expires_at: null,
                        subscription_plan: null,
                        total_network_size: 0,
                        pro_notification_seen: false,
                        last_checkin_at: null,
                        checkin_streak: 0
                    };
                });
            }
        } finally {
            setIsLoading(false);
        }
        // #comment: Added updateProgress to dependencies to ensure refreshUser uses the latest progress tracking function
    }, [updateProgress]); // user dependency removed

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
                        referral_count: 10,
                        referrals: [],
                        completed_tasks: "[]",
                        completed_stages: [1, 2, 3], // Mock stages
                        is_pro: true,
                        is_admin: true,
                        pro_expires_at: null,
                        subscription_plan: "DEV_PRO",
                        total_network_size: 25,
                        pro_notification_seen: false,
                        last_checkin_at: new Date().toISOString(),
                        checkin_streak: 5
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
                            console.log('[DEBUG] Telegram SDK detected, refreshing user...');
                            await refreshUser();
                        } else if (attempts < 20) { // Check every 100ms for 2 seconds
                            attempts++;
                            setTimeout(checkData, 100);
                        } else {
                            console.log('[DEBUG] Telegram SDK timeout, proceeding with refresh anyway');
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
    }, [refreshUser]);

    // #comment: Sentry User Context Sync
    // This allows us to search Sentry issues by telegram_id or username.
    useEffect(() => {
        if (user) {
            Sentry.setUser({
                id: user.telegram_id,
                username: user.username || undefined,
                email: undefined, // TWA users don't have email in initial payload
            });
            Sentry.setTag("is_pro", user.is_pro);
            Sentry.setTag("level", user.level);
        } else {
            Sentry.setUser(null);
        }
    }, [user]);

    const contextValue = React.useMemo(() => ({
        user,
        isLoading,
        refreshUser,
        updateUser,
        completeStage
    }), [user, isLoading, refreshUser, updateUser, completeStage]);

    return (
        <UserContext.Provider value={contextValue}>
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
