import { retrieveLaunchParams } from '@telegram-apps/sdk-react';

export const getSafeLaunchParams = () => {
    try {
        return retrieveLaunchParams();
    } catch (e) {
        console.warn('[DEBUG] Not in Telegram environment, using empty params');
        return {
            initData: undefined,
            initDataRaw: '',
            themeParams: {},
            platform: 'unknown'
        };
    }
};
export const isTMA = () => {
    try {
        retrieveLaunchParams();
        return true;
    } catch (e) {
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
