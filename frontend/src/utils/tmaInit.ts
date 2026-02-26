import { miniApp, backButton, viewport, swipeBehavior } from '@telegram-apps/sdk-react';
import { isTMA } from './tma';

/**
 * initTMA — Initializes the Telegram Mini App SDK.
 *
 * Extracted from App.tsx for separation of concerns and testability.
 * Call this once on app startup with an onComplete callback.
 *
 * @param onComplete - Called with a progress value when init finishes.
 */
export async function initTMA(onComplete: (progress: number, message: string) => void): Promise<void> {
    if (!isTMA()) {
        if (import.meta.env.DEV) console.log('[DEBUG] initTMA: Not in TMA, skipping SDK initialization');
        return;
    }

    try {
        if (import.meta.env.DEV) console.log('[DEBUG] initTMA: Starting...');

        // 1. Mount components (Safety first)
        if (miniApp.mount.isAvailable() && !miniApp.isMounted()) miniApp.mount();
        if (miniApp.ready.isAvailable()) miniApp.ready();
        if (backButton.mount.isAvailable() && !backButton.isMounted()) backButton.mount();

        // 2. Expansion & Fullscreen (Immersive Mode)
        if (viewport.mount.isAvailable()) {
            try {
                if (!viewport.isMounted()) await viewport.mount();

                if (viewport.expand.isAvailable()) {
                    viewport.expand();
                    if (import.meta.env.DEV) console.log('[DEBUG] initTMA: viewport expanded');
                }

                if ((viewport as any).requestFullscreen && (viewport as any).requestFullscreen.isAvailable?.()) {
                    (viewport as any).requestFullscreen();
                    if (import.meta.env.DEV) console.log('[DEBUG] initTMA: Fullscreen requested via SDK');
                }
            } catch (e) {
                console.warn('Viewport error:', e);
            }
        }

        // 3. Swipe Locking (Single pass)
        if (swipeBehavior.mount.isAvailable()) {
            try {
                if (!swipeBehavior.isMounted()) await swipeBehavior.mount();
                if (swipeBehavior.disableVertical.isAvailable()) {
                    swipeBehavior.disableVertical();
                }
            } catch (e) {
                console.warn('Swipe error:', e);
            }
        }

        // 4. Fallback for older environments / direct JS
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.ready();
            if ((window.Telegram.WebApp as any).requestFullscreen) {
                (window.Telegram.WebApp as any).requestFullscreen();
            }
            if (import.meta.env.DEV) console.log('[DEBUG] initTMA: SDK methods executing...');
        }

        if (import.meta.env.DEV) console.log('[DEBUG] initTMA: Complete');
        onComplete(98, 'Interface Ready');
    } catch (e) {
        console.error('[CRITICAL] initTMA: Initialization failure:', e);
    }
}
