export const getApiUrl = () => {
    // Priority 1: Environment variable (VITE_API_URL)
    let url = import.meta.env.VITE_API_URL;

    // Priority 2: Production fallback
    if (!url) {
        url = 'https://p2phub-production.up.railway.app';
    }

    // Security check: Force HTTPS in production environments
    // This is crucial for Railway/Vercel where the app is served via HTTPS
    if (url && url.includes('railway.app')) {
        url = url.replace('http://', 'https://');
    }

    // General safety for any HTTPS origin
    if (typeof window !== 'undefined' &&
        window.location.protocol === 'https:' &&
        url && url.startsWith('http://') &&
        !url.includes('localhost') &&
        !url.includes('127.0.0.1')) {
        url = url.replace('http://', 'https://');
    }

    if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
        console.log('[API] Final URL:', url);
    }

    return url;
};
