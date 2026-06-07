import { retrieveLaunchParams } from '@telegram-apps/sdk-react';

// Modules are evaluated synchronously on app load, before any rendering or routing.
// This is the absolute best time to parse and cache launch parameters from the URL hash/query.
let cachedLaunchParams: any = null;

try {
    const lp = retrieveLaunchParams();
    if (lp && (lp.initDataRaw || lp.initData)) {
        cachedLaunchParams = lp;
        if (typeof window !== 'undefined') {
            try {
                sessionStorage.setItem('p2p_tma_launch_params', JSON.stringify(lp));
            } catch (se) {
                // Ignore storage errors in restricted contexts
            }
        }
    }
} catch (e) {
    // Silent catch - might not be in a TMA environment or URL params already cleared
}

const getCachedLaunchParams = (): any => {
    if (cachedLaunchParams && cachedLaunchParams.initDataRaw) return cachedLaunchParams;
    
    if (typeof window !== 'undefined') {
        try {
            const data = sessionStorage.getItem('p2p_tma_launch_params');
            if (data) {
                const lp = JSON.parse(data);
                if (lp && lp.initDataRaw) {
                    cachedLaunchParams = lp;
                    return lp;
                }
            }
        } catch (e) {
            // Ignore storage/parsing errors
        }
    }
    return null;
};

export const getSafeLaunchParams = () => {
    // 1. Try our cache (memory or sessionStorage) first, since it is stable across navigation
    const cached = getCachedLaunchParams();
    if (cached && cached.initDataRaw) return cached;

    // 2. Try SDK retrieveLaunchParams() from current URL
    try {
        const lp = retrieveLaunchParams();
        if (lp && lp.initDataRaw) {
            cachedLaunchParams = lp;
            if (typeof window !== 'undefined') {
                try {
                    sessionStorage.setItem('p2p_tma_launch_params', JSON.stringify(lp));
                } catch (se) {}
            }
            return lp;
        }
    } catch (e) {
        // Fallback
    }

    // 3. Fallback to Telegram WebApp JS global object if available
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) {
        return {
            initDataRaw: (window as any).Telegram.WebApp.initData,
            initData: undefined,
            themeParams: (window as any).Telegram.WebApp.themeParams || {},
            platform: (window as any).Telegram.WebApp.platform || 'unknown'
        } as any;
    }
    
    // 4. Fallback to localStorage saved initData (for desktop session syncing)
    if (typeof window !== 'undefined') {
        try {
            const savedData = localStorage.getItem('p2p_saved_init_data');
            if (savedData) {
                return {
                    initDataRaw: savedData,
                    initData: undefined,
                    themeParams: {},
                    platform: 'desktop'
                } as any;
            }
        } catch (le) {}
    }

    console.warn('[DEBUG] Not in Telegram environment, using empty params');
    return {
        initData: undefined,
        initDataRaw: '' as string,
        themeParams: {} as any,
        platform: 'unknown'
    } as any;
};

export const isTMA = () => {
    if (getCachedLaunchParams()) return true;
    try {
        retrieveLaunchParams();
        return true;
    } catch (e) {
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) {
            return true;
        }
        return false;
    }
};
import { hapticFeedback } from '@telegram-apps/sdk-react';

export class Haptic {
    static impact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') {
        try {
            if (hapticFeedback.impactOccurred.isAvailable()) {
                hapticFeedback.impactOccurred(style);
            }
        } catch {
            // Ignore if not available
        }
    }

    static notification(type: 'error' | 'success' | 'warning') {
        try {
            if (hapticFeedback.notificationOccurred.isAvailable()) {
                hapticFeedback.notificationOccurred(type);
            }
        } catch {
            // Ignore
        }
    }

    static selection() {
        try {
            if (hapticFeedback.selectionChanged.isAvailable()) {
                hapticFeedback.selectionChanged();
            }
        } catch {
            // Ignore
        }
    }
}
