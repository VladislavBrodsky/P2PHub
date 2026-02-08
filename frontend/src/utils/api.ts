export const getApiUrl = () => {
    // Priority 1: Environment variable (VITE_API_URL)
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // Priority 2: Production fallback
    // Correct production URL: https://p2phub-production.up.railway.app
    return 'https://p2phub-production.up.railway.app';
};
