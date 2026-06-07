import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient, refreshInitData } from '../api/client';
import * as Sentry from "@sentry/react";
import { getSafeLaunchParams, isTMA } from '../utils/tma';
import { useStartupProgress } from './StartupProgressContext';
import { getApiUrl } from '../utils/api';

interface User {
    id: number;
    telegram_id: string;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
    photo_file_id?: string | null;
    balance: number;
    total_earned?: number; // Sum of all PRO commissions
    total_earned_usdt?: number; // Materialized total for leaderboard
    level: number;
    xp: number;
    referral_code: string;
    referral_count: number;
    referrals: any[]; // Extended for Earn Hub
    completed_tasks: string[];
    completed_stages: (string | number)[]; // Added for Academy
    unlocked_stages: (string | number)[]; // Added for stage-specific unlocking
    is_pro: boolean;
    is_admin: boolean;
    pro_expires_at: string | null;
    subscription_plan: string | null;
    is_pro_plus: boolean;
    total_network_size: number;
    pro_notification_seen: boolean;
    last_checkin_at: string | null;
    checkin_streak: number;
    notifications_paused: boolean;
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
    completeStage: (id: number | string) => Promise<void>;
    unlockStage: (id: number | string) => Promise<void>;
    isSessionExpired: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Bump this version string whenever you want to force-clear all users' cached state.
// This prevents stale zero-data from persisting in localStorage across deploys.
const CACHE_KEY = 'p2p_user_cache_v6';

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        try {
            // Clear old unversioned cache on first run
            localStorage.removeItem('p2p_user_cache');
            const saved = localStorage.getItem(CACHE_KEY);
            if (saved) {
                const cachedUser = JSON.parse(saved);
                // Eagerly preload cached profile photo for instant display
                if (cachedUser?.photo_file_id) {
                    const img = new Image();
                    const baseUrl = getApiUrl().replace(/\/$/, '');
                    img.src = `${baseUrl}/api/partner/photo/${cachedUser.photo_file_id}`;
                    img.loading = 'eager';
                } else if (cachedUser?.photo_url) {
                    const img = new Image();
                    img.src = cachedUser.photo_url;
                    img.loading = 'eager';
                }
                return cachedUser;
            }
            return null;
        } catch (e) {
            console.error('[DEBUG] Corrupted User Cache:', e);
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState(!user);
    const [isSessionExpired, setIsSessionExpired] = useState(false);
    const lastRefresh = React.useRef(0);

    useEffect(() => {
        const handleSessionExpired = () => {
            console.warn('⚠️ [UserContext] Session expired event received. Clearing cache...');
            setIsSessionExpired(true);
            localStorage.removeItem(CACHE_KEY);
            setUser(null);
        };
        window.addEventListener('tma-session-expired', handleSessionExpired);
        return () => window.removeEventListener('tma-session-expired', handleSessionExpired);
    }, []);

    const updateUser = useCallback((updates: Partial<User>) => {
        setUser(prev => {
            const next = prev ? { ...prev, ...updates } : null;
            if (next) localStorage.setItem(CACHE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const { updateProgress } = useStartupProgress();

    const completeStage = useCallback(async (id: number | string) => {
        try {
            // #comment: FIX - Use the correct mission completion endpoint from pro.router
            const response = await apiClient.post(`/api/pro/academy/complete/${id}`);

            // #comment: Update local state with the rewards returned from server
            if (response.data.status === 'success' || response.data.status === 'already_completed') {
                const newCompleted = Array.from(new Set([
                    ...(user?.completed_stages ?? []).map(String),
                    String(id)
                ]));
                updateUser({
                    xp: response.data.new_xp,
                    completed_stages: newCompleted
                });
            }
        } catch (error) {
            console.error('Failed to persist stage completion:', error);
            throw error; // Re-throw so callers can handle UI feedback
        }
    }, [updateUser, user?.completed_stages]);

    const unlockStage = useCallback(async (id: number | string) => {
        try {
            const response = await apiClient.post(`/api/pro/academy/unlock/${id}`);
            if (response.data.status === 'success' || response.data.status === 'already_unlocked') {
                const unlocked = response.data.unlocked_stages || [];
                updateUser({
                    xp: response.data.new_xp,
                    unlocked_stages: Array.isArray(unlocked) ? unlocked.map(String) : [],
                });
            }
        } catch (error) {
            console.error('Failed to unlock stage:', error);
            throw error;
        }
    }, [updateUser]);

    const refreshUser = useCallback(async (force = false) => {
        const now = Date.now();
        // Throttle refreshes to once every 10 seconds unless forced
        if (!force && now - lastRefresh.current < 10000) return;
        lastRefresh.current = now;

        updateProgress(60, 'Fetching Profile...');

        const lp = getSafeLaunchParams();
        const hasInitData = !!(lp?.initDataRaw || (window as any).Telegram?.WebApp?.initData);

        if (!hasInitData) {
            console.warn('[UserContext] No Telegram initData available — skipping profile fetch (Guest Mode).');
            setUser(null);
            setIsLoading(false);
            updateProgress(100, 'Guest Mode');
            return;
        }

        let tgUser: any = null;
        try {
            tgUser = lp.initData?.user;

            // #comment: OPTIMISTIC UI FIX
            // We apply the SDK data IMMEDIATELY if we don't have a user yet.
            if (tgUser) {
                setUser(prev => {
                    if (prev && prev.telegram_id === String(tgUser.id)) return prev;
                    return {
                        ...(prev || {} as any),
                        first_name: tgUser.firstName,
                        last_name: tgUser.lastName || null,
                        photo_url: tgUser.photoUrl || null,
                    };
                });

                // Eagerly preload profile photo from SDK data
                if (tgUser.photoUrl) {
                    const img = new Image();
                    img.src = tgUser.photoUrl;
                    img.loading = 'eager';
                }
            }


            const res = await apiClient.get('/api/partner/me');
            const userData = res.data;

            // Self-healing: Ensure stages are parsed arrays of strings
            const parseStages = (val: any) => {
                try {
                    const parsed = typeof val === 'string' ? JSON.parse(val) : val;
                    return Array.isArray(parsed) ? parsed.map(String) : [];
                } catch (e) {
                    return [];
                }
            };

            userData.completed_stages = parseStages(userData.completed_stages);
            userData.unlocked_stages = parseStages(userData.unlocked_stages);

            // #comment: FORCE NUMERIC INTEGRITY
            userData.xp = Number(userData.xp) || 0;
            userData.level = Number(userData.level) || 1;
            userData.balance = Number(userData.balance) || 0;

            // Enrich with Telegram SDK data if backend is missing details
            if (tgUser) {
                if (!userData.photo_url && tgUser.photoUrl) userData.photo_url = tgUser.photoUrl;
                if (!userData.first_name && tgUser.firstName) userData.first_name = tgUser.firstName;
                if (!userData.last_name && tgUser.lastName) userData.last_name = tgUser.lastName;
            }

            setUser(userData);
            updateProgress(100, 'User Verified');
            localStorage.setItem(CACHE_KEY, JSON.stringify(userData));

            // Eagerly preload profile photo for instant display
            if (userData.photo_file_id) {
                const img = new Image();
                const baseUrl = getApiUrl().replace(/\/$/, '');
                img.src = `${baseUrl}/api/partner/photo/${userData.photo_file_id}`;
                img.loading = 'eager';
            } else if (userData.photo_url) {
                const img = new Image();
                img.src = userData.photo_url;
                img.loading = 'eager';
            }
        } catch (error: any) {
            console.error('[API] refreshUser: Failed:', error.response?.status, error.response?.data || error.message);
            if (error.response?.status === 401) {
                // #comment: FIX — Do NOT immediately trigger SessionExpired on a 401.
                // On slow mobile devices Telegram injects initData late, causing a startup
                // race where the first /api/partner/me call fires before initData is ready.
                // The API client already retries with fresh initData once.
                // Only mark as expired if we truly have no initData source at all.
                const hasInitData = !!(getSafeLaunchParams()?.initDataRaw || (window as any).Telegram?.WebApp?.initData);
                if (!hasInitData) {
                    console.error('[UserContext] No initData available — genuine session expiry.');
                    setIsSessionExpired(true);
                    localStorage.removeItem(CACHE_KEY);
                    setUser(null);
                } else {
                    console.warn('[UserContext] 401 but initData present — keeping existing user, will retry on next focus.');
                    // Keep existing user from cache so the UI doesn’t go blank
                }
            } else if (tgUser) {
                console.warn('[API] Using Guest/Fallback profile due to backend error.');
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
                        completed_tasks: [],
                        completed_stages: [],
                        unlocked_stages: [],
                        is_pro: false,
                        is_admin: false,
                        pro_expires_at: null,
                        subscription_plan: null,
                        total_network_size: 0,
                        pro_notification_seen: false,
                        is_pro_plus: false,
                        last_checkin_at: null,
                        checkin_streak: 0,
                        notifications_paused: false
                    };
                });
            }
            updateProgress(100, 'Offline Ready');
        } finally {
            setIsLoading(false);
        }
    }, [updateProgress]);

    useEffect(() => {
        const init = async () => {
            try {
                // Parse tgWebAppData from URL query params or hash (desktop auth linking)
                let urlInitData = '';
                try {
                    const searchParams = new URLSearchParams(window.location.search);
                    urlInitData = searchParams.get('tgWebAppData') || '';
                    
                    if (!urlInitData && window.location.hash) {
                        const hashParams = new URLSearchParams(window.location.hash.substring(1));
                        urlInitData = hashParams.get('tgWebAppData') || '';
                    }
                    
                    if (urlInitData) {
                        let decodedData = urlInitData;
                        try {
                            if (urlInitData.includes('%')) {
                                decodedData = decodeURIComponent(urlInitData);
                            }
                        } catch (e) {
                            console.error('[UserContext] decodeURIComponent error:', e);
                        }
                        localStorage.setItem('p2p_saved_init_data', decodedData);
                        console.log('[UserContext] Found and stored tgWebAppData from URL.');
                        
                        // Clean the URL bar so the token isn't visible in history
                        const cleanUrl = window.location.origin + window.location.pathname;
                        window.history.replaceState({}, document.title, cleanUrl);
                    }
                } catch (urlErr) {
                    console.error('[UserContext] Failed parsing URL token:', urlErr);
                }

                // Fast path for local development
                if (import.meta.env.DEV && !window.Telegram?.WebApp?.initData) {
                    const devUser = {
                        id: 999,
                        telegram_id: '123456789',
                        username: 'dev_partner',
                        first_name: 'Dev',
                        last_name: 'User',
                        photo_url: null,
                        photo_file_id: null,
                        balance: 5000,
                        level: 5,
                        xp: 150,
                        referral_code: 'DEV-TEST',
                        referral_count: 10,
                        referrals: [],
                        completed_tasks: [],
                        completed_stages: ["1", "2", "3"], // Mock stages
                        unlocked_stages: [],
                        is_pro: true,
                        is_admin: true,
                        pro_expires_at: null,
                        subscription_plan: "DEV_PRO",
                        total_network_size: 25,
                        pro_notification_seen: false,
                        is_pro_plus: true,
                        total_earned_usdt: 1250.50,
                        last_checkin_at: new Date().toISOString(),
                        checkin_streak: 5,
                        notifications_paused: false
                    };
                    setUser(devUser);
                    setIsLoading(false);
                    return;
                }

                if (!window.Telegram?.WebApp && !isTMA()) {
                    await refreshUser();
                    return;
                }

                // Wait for Telegram environment (up to 2 seconds total)
                let attempts = 0;
                const maxAttempts = 20;
                const checkData = async () => {
                    try {
                        if (window.Telegram?.WebApp?.initData || attempts >= maxAttempts) {
                            await refreshUser();
                        } else {
                            attempts++;
                            setTimeout(checkData, 100);
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

        const handleFocus = () => {
            // Refresh the initData cache on app focus (user switches back to Telegram)
            refreshInitData();
            refreshUser();
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [refreshUser]);

    useEffect(() => {
        if (user) {
            Sentry.setUser({
                id: user.telegram_id,
                username: user.username || undefined,
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
        completeStage,
        unlockStage,
        isSessionExpired
    }), [user, isLoading, refreshUser, updateUser, completeStage, unlockStage, isSessionExpired]);

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
