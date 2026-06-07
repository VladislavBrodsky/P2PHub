import { retrieveLaunchParams } from '@telegram-apps/sdk-react';

export const getSafeLaunchParams = () => {
    try {
        return retrieveLaunchParams();
    } catch (e) {
        // Fallback to pure window object if SDK fails (happens during hash navigation)
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) {
            return {
                initDataRaw: (window as any).Telegram.WebApp.initData,
                initData: undefined,
                themeParams: (window as any).Telegram.WebApp.themeParams || {},
                platform: (window as any).Telegram.WebApp.platform || 'unknown'
            } as any;
        }
        
        // Fallback to localStorage saved initData (for desktop session syncing)
        if (typeof window !== 'undefined') {
            const savedData = localStorage.getItem('p2p_saved_init_data');
            if (savedData) {
                return {
                    initDataRaw: savedData,
                    initData: undefined,
                    themeParams: {},
                    platform: 'desktop'
                } as any;
            }
        }

        console.warn('[DEBUG] Not in Telegram environment, using empty params');
        return {
            initData: undefined,
            initDataRaw: '' as string,
            themeParams: {} as any,
            platform: 'unknown'
        } as any;
    }
};

export const isTMA = () => {
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
