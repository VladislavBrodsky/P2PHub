import { viewport } from '@telegram-apps/sdk';
import { useEffect } from 'react';

export function useExpanded() {
    useEffect(() => {
        try {
            if (viewport.mount.isAvailable()) {
                viewport.mount().then(() => {
                    if (viewport.expand.isAvailable()) {
                        viewport.expand();
                    }
                });
            }
        } catch (e) {
            console.warn('Viewport expansion failed:', e);
        }
    }, []);
}
