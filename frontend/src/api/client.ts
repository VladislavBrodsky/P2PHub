import axios from 'axios';
import { getSafeLaunchParams } from '../utils/tma';
import i18n from '../i18n';
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

// #comment: Helper to wait for Telegram initData if available
const waitForInitData = async (timeout = 3000): Promise<string> => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const params = getSafeLaunchParams();
        if (params.initDataRaw) return params.initDataRaw;
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return '';
};

// Request Interceptor: Automatically inject Telegram Init Data
apiClient.interceptors.request.use(
    async (config) => {
        try {
            // #comment: We attempt to wait FOR THE FIRST FEW REQUESTS 
            // to ensure headers are present even if the SDK is slow to load.
            let initDataRaw = '';
            const params = getSafeLaunchParams();
            
            const authPrefixes = ['/api/partner/', '/api/pro/', '/api/payment/', '/api/admin/', '/api/tools/'];
            const isAuthRoute = authPrefixes.some(prefix => config.url?.includes(prefix));

            if (!params.initDataRaw && isAuthRoute) {
                initDataRaw = await waitForInitData();
            } else {
                initDataRaw = params.initDataRaw || '';
            }

            if (initDataRaw) {
                config.headers['X-Telegram-Init-Data'] = initDataRaw;
                // Dual-send in standard Authorization header for aggressive proxy compatibility
                config.headers['Authorization'] = `Bearer ${initDataRaw}`;
            } else if (config.url?.startsWith('/api/partner/') || config.url?.startsWith('/api/pro/') || config.url?.startsWith('/api/admin/')) {
                // #comment: Tactical Protection - If we are hitting an authenticated endpoint 
                // but have NO initData, we should fail early with a descriptive error 
                // to prevent 401 noise and help debug Production "Guest" mode.
                console.error(`🚨 [API] BLOCKED: Request to ${config.url} missing X-Telegram-Init-Data header.`);
                
                // In production, we might want to throw an error here to prevent the request from even firing
                // return Promise.reject(new Error('Authentication required (missing Telegram initData)'));
            }

            // Inject Content-Language based on current app setting
            if (i18n.language) {
                config.headers['Accept-Language'] = i18n.language;
            }
        } catch (error) {
            console.warn('[API] Failed to inject Telegram params', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Global Error Handling + Smart Retry for 401s
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;
        const config = error.config;

        // #comment: Smart Retry Logic for 401 "Race Condition"
        // If we get a 401 and haven't retried yet, and we are on an authenticated endpoint,
        // we wait for initData once more and retry. This handles cases where the SDK
        // loads slightly AFTER the first API call is initiated.
        const authPrefixes = ['/api/partner/', '/api/pro/', '/api/payment/', '/api/admin/', '/api/tools/'];
        const isAuthRoute = authPrefixes.some(prefix => config.url?.includes(prefix));

        if (status === 401 && !config._retry && isAuthRoute) {
            config._retry = true;
            console.warn(`[API] 401 detected for ${config.url}. Attempting smart retry...`);
            
            // Wait up to 2 seconds for a "late" SDK initialization
            const initData = await waitForInitData(2000);
            if (initData) {
                config.headers['X-Telegram-Init-Data'] = initData;
                config.headers['Authorization'] = `Bearer ${initData}`;
                return apiClient(config); // Retry the request with the new header
            }
        }

        const url = config?.url;
        if (status === 401) {
            try {
                const params = getSafeLaunchParams();
                if (params.initDataRaw) {
                    console.error('[API] Unauthorized. Init Data might be expired or invalid.');
                }
            } catch (e) { /* ignore */ }
        } else if (status >= 500) {
            console.error(`[API] Server Error (${status}) at ${url}:`, error.response?.data || error.message);
        } else {
            console.warn(`[API] Error (${status}) at ${url}:`, error.message);
        }
        return Promise.reject(error);
    }
);
