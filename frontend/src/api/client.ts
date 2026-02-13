import axios from 'axios';
import { getSafeLaunchParams } from '../utils/tma';
import { getApiUrl } from '../utils/api';

// Create a centralized Axios instance
export const apiClient = axios.create({
    baseURL: getApiUrl(),
    timeout: 60000,
});

// Request Interceptor: Automatically inject Telegram Init Data
apiClient.interceptors.request.use(
    (config) => {
        try {
            const params = getSafeLaunchParams();
            const initDataRaw = params.initDataRaw || '';

            if (initDataRaw) {
                config.headers['X-Telegram-Init-Data'] = initDataRaw;
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

// Response Interceptor: Global Error Handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url;

        if (status === 401) {
            // Only log warning if we are actually in a TMA environment
            try {
                const params = getSafeLaunchParams();
                if (params.initDataRaw) {
                    console.error('[API] Unauthorized. Init Data might be expired or invalid.');
                }
            } catch (e) {
                // Ignore errors checking TMA state
            }
        } else if (status >= 500) {
            console.error(`[API] Server Error (${status}) at ${url}:`, error.response?.data || error.message);
        } else {
            console.warn(`[API] Error (${status}) at ${url}:`, error.message);
        }
        return Promise.reject(error);
    }
);
