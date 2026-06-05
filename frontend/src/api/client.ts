import axios from 'axios';
import { getSafeLaunchParams } from '../utils/tma';
import i18next from 'i18next';
import { getApiUrl } from '../utils/api';

const getBaseUrl = () => {
    const url = getApiUrl();
    if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
        return url.replace('http://', 'https://');
    }
    return url;
};

// Create a centralized Axios instance
export const apiClient = axios.create({
    baseURL: getBaseUrl(),
    timeout: 60000,
});

// Global promise to track initialization (Singleton pattern)
// NOTE: We intentionally do NOT cache empty-string resolutions.
// If Telegram is slow to inject initData on mobile, we must retry on next request.
let initPromise: Promise<string> | null = null;
let cachedInitData: string = '';

// Direct fast path: always try to read synchronously first
const getInitDataSync = (): string => {
    if (cachedInitData) return cachedInitData;
    try {
        const params = getSafeLaunchParams();
        const data = params.initDataRaw || (window as any).Telegram?.WebApp?.initData || '';
        if (data) {
            cachedInitData = data;
        }
        return data;
    } catch {
        return (window as any).Telegram?.WebApp?.initData || '';
    }
};

const waitForInitData = async (timeoutMs = 8000): Promise<string> => {
    // Fast synchronous path — avoids creating a Promise if data is already available
    const syncData = getInitDataSync();
    if (syncData) return syncData;

    // If a pending promise exists, return it (don't create duplicates)
    if (initPromise) return initPromise;

    initPromise = new Promise((resolve) => {
        const start = Date.now();
        const check = () => {
            const data = getInitDataSync();
            
            if (data) {
                resolve(data);
                initPromise = null; // Reset so future calls can retry if needed
                return true;
            }
            
            if (Date.now() - start > timeoutMs) {
                console.warn(`⏳ [API] Initialization timeout after ${timeoutMs}ms. Will retry on next request.`);
                resolve('');
                // CRITICAL: Reset singleton so the NEXT request tries again
                // instead of permanently serving '' to all subsequent calls.
                initPromise = null;
                return true;
            }
            return false;
        };

        if (!check()) {
            const interval = setInterval(() => {
                if (check()) clearInterval(interval);
            }, 100);
        }
    });

    return initPromise;
};

// Allow external code to refresh the cached initData (e.g. on app focus)
export const refreshInitData = () => {
    cachedInitData = '';
    initPromise = null;
};

// Request Interceptor: Automatically inject Telegram Init Data
apiClient.interceptors.request.use(
    async (config) => {
        try {
            const authPrefixes = ['/api/partner/', '/api/pro/', '/api/payment/', '/api/admin/', '/api/tools/', '/api/leaderboard/'];
            const isAuthRoute = authPrefixes.some(prefix => config.url?.includes(prefix));

            let initDataRaw = '';

            // #comment: Robust Guard - If an auth route is missing headers, we await the global init promise.
            if (isAuthRoute) {
                initDataRaw = await waitForInitData();
                if (!initDataRaw) {
                    console.error(`🚨 [API] BLOCKED: Request to ${config.url} missing X-Telegram-Init-Data header after synchronization.`);
                }
            } else {
                // Non-auth routes just try a quick grab if available
                const params = getSafeLaunchParams();
                initDataRaw = params.initDataRaw || (window as any).Telegram?.WebApp?.initData || '';
            }

            if (initDataRaw) {
                config.headers['X-Telegram-Init-Data'] = initDataRaw;
                config.headers['Authorization'] = `Bearer ${initDataRaw}`;
            }

            // Inject Content-Language based on current app setting
            if (i18next.language) {
                config.headers['Accept-Language'] = i18next.language;
            }
        } catch (error) {
            console.warn('[API] Failed to inject Telegram params', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Global Error Handling + Smart Retry for 401s
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;
        const config = error.config;

        const authPrefixes = ['/api/partner/', '/api/pro/', '/api/payment/', '/api/admin/', '/api/tools/', '/api/leaderboard/'];
        const isAuthRoute = authPrefixes.some(prefix => config.url?.includes(prefix));

        // #comment: Smart Retry Logic for 401 "Race Condition"
        // On mobile Telegram can be slow to inject initData; always retry once with fresh data.
        if (status === 401 && !config._retry && isAuthRoute) {
            config._retry = true;
            console.warn(`🔄 [API] 401 Unauthorized for ${config.url}. Clearing cache and re-syncing...`);
            
            // Force-invalidate cache so waitForInitData re-reads from Telegram
            cachedInitData = '';
            initPromise = null;
            const freshData = await waitForInitData(4000);
            
            if (freshData) {
                config.headers['X-Telegram-Init-Data'] = freshData;
                config.headers['Authorization'] = `Bearer ${freshData}`;
                return apiClient(config); // Recursive retry with fresh auth
            }
        }

        const url = config?.url;
        if (status === 401) {
            // Only fire session-expired if we genuinely have no initData at all
            // (prevents false lock-outs when Telegram is just slow on mobile)
            const currentData = getInitDataSync();
            if (!currentData) {
                console.error(`[API] Permanent 401 at ${url}. No initData available — genuine session expiry.`);
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('tma-session-expired', { detail: { url } }));
                }
            } else {
                console.warn(`[API] 401 at ${url} but initData IS present — likely a backend issue, not session expiry.`);
            }
        } else if (status >= 500) {
            console.error(`[API] Server Error (${status}) at ${url}:`, error.response?.data || error.message);
        }
        
        return Promise.reject(error);
    }
);
