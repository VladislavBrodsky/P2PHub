import axios from 'axios';
import { getSafeLaunchParams } from '../utils/tma';
import { getApiUrl } from '../utils/api';

// Create a centralized Axios instance
export const apiClient = axios.create({
    baseURL: getApiUrl(),
    timeout: 10000,
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
        if (error.response?.status === 401) {
            console.error('[API] Unauthorized. Init Data might be expired.');
        }
        return Promise.reject(error);
    }
);
