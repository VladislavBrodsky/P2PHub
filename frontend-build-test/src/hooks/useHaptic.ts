import { hapticFeedback } from '@telegram-apps/sdk-react';

export const useHaptic = () => {
    const selection = () => {
        try {
            if (hapticFeedback && hapticFeedback.selectionChanged && hapticFeedback.selectionChanged.isAvailable()) {
                hapticFeedback.selectionChanged();
            }
        } catch (e) {
            // Ignore errors in non-TMA environment
        }
    };

    const impact = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
        try {
            if (hapticFeedback && hapticFeedback.impactOccurred && hapticFeedback.impactOccurred.isAvailable()) {
                hapticFeedback.impactOccurred(style);
            }
        } catch (e) {
            // Ignore
        }
    };

    const notification = (type: 'error' | 'success' | 'warning') => {
        try {
            if (hapticFeedback && hapticFeedback.notificationOccurred && hapticFeedback.notificationOccurred.isAvailable()) {
                hapticFeedback.notificationOccurred(type);
            }
        } catch (e) {
            // Ignore
        }
    };

    return { selection, impact, notification };
};
