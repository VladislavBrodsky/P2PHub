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
let initPromise: Promise<string> | null = null;

const waitForInitData = async (timeoutMs = 5000): Promise<string> => {
    if (initPromise) return initPromise;

    initPromise = new Promise((resolve) => {
        const start = Date.now();
        const check = () => {
            const params = getSafeLaunchParams();
            const data = params.initDataRaw || (window as any).Telegram?.WebApp?.initData || '';
            
            if (data) {
                resolve(data);
                return true;
            }
            
            if (Date.now() - start > timeoutMs) {
                console.warn(`⏳ [API] Initialization timeout after ${timeoutMs}ms`);
                resolve('');
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
        if (status === 401 && !config._retry && isAuthRoute) {
            config._retry = true;
            console.warn(`🔄 [API] 401 Unauthorized for ${config.url}. Clearing cache and re-syncing...`);
            
            // Invalidate current promise and try fresh
            initPromise = null;
            const freshData = await waitForInitData(2000);
            
            if (freshData) {
                config.headers['X-Telegram-Init-Data'] = freshData;
                config.headers['Authorization'] = `Bearer ${freshData}`;
                return apiClient(config); // Recursive retry
            }
        }

        const url = config?.url;
        if (status === 401) {
            console.error(`[API] Permanent 401 at ${url}. Possible session expiry.`);
        } else if (status >= 500) {
            console.error(`[API] Server Error (${status}) at ${url}:`, error.response?.data || error.message);
        }
        
        return Promise.reject(error);
    }
);
