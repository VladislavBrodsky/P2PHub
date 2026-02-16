export const getApiUrl = () => {
    // Priority 1: Environment variable (VITE_API_URL)
    let url = import.meta.env.VITE_API_URL;

    // Priority 2: Production fallback
    if (!url) {
        url = 'https://p2phub-production.up.railway.app';
    }

    // Security check: Force HTTPS in production environments
    if (typeof window !== 'undefined' &&
        window.location.protocol === 'https:' &&
        url.startsWith('http://') &&
        !url.includes('localhost') &&
        !url.includes('127.0.0.1')) {
        url = url.replace('http://', 'https://');
    }

    return url;
};
