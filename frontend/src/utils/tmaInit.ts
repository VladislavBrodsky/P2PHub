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

        // Set colors via SDK if available to match the app's premium dark design system
        try {
            if (miniApp.setHeaderColor.isAvailable()) miniApp.setHeaderColor('#030712');
            if (miniApp.setBackgroundColor.isAvailable()) miniApp.setBackgroundColor('#030712');
            if ((miniApp as any).setBottomBarColor?.isAvailable?.()) {
                (miniApp as any).setBottomBarColor('#030712');
            }
        } catch (e) {
            console.warn('[TMA SDK] Failed to set colors:', e);
        }

        // 2. Expansion & Fullscreen (Immersive Mode) - Non-blocking mount to prevent slow iframe loads from hanging startup
        if (viewport.mount.isAvailable()) {
            (async () => {
                try {
                    if (!viewport.isMounted()) {
                        await Promise.race([
                            viewport.mount(),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Viewport mount timeout')), 1500))
                        ]);
                    }

                    if (viewport.expand.isAvailable()) {
                        viewport.expand();
                        if (import.meta.env.DEV) console.log('[DEBUG] initTMA: viewport expanded');
                    }

                    if ((viewport as any).requestFullscreen && (viewport as any).requestFullscreen.isAvailable?.()) {
                        (viewport as any).requestFullscreen();
                        if (import.meta.env.DEV) console.log('[DEBUG] initTMA: Fullscreen requested via SDK');
                    }
                } catch (e) {
                    console.warn('[TMA] Viewport initialization failed or timed out:', e);
                }
            })();
        }

        // 3. Swipe Locking (Single pass) - Non-blocking mount
        if (swipeBehavior.mount.isAvailable()) {
            (async () => {
                try {
                    if (!swipeBehavior.isMounted()) {
                        await Promise.race([
                            swipeBehavior.mount(),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Swipe behavior mount timeout')), 1500))
                        ]);
                    }
                    if (swipeBehavior.disableVertical.isAvailable()) {
                        swipeBehavior.disableVertical();
                    }
                } catch (e) {
                    console.warn('[TMA] Swipe locking initialization failed or timed out:', e);
                }
            })();
        }

        // 4. Fallback for older environments / direct JS
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand?.();

            // Set native colors to match the app's premium dark design system
            try {
                (window.Telegram.WebApp as any).setHeaderColor?.('#030712');
                (window.Telegram.WebApp as any).setBackgroundColor?.('#030712');
                if ((window.Telegram.WebApp as any).setBottomBarColor) {
                    (window.Telegram.WebApp as any).setBottomBarColor('#030712');
                }
            } catch (e) {
                console.warn('[TMA] Failed to set native colors:', e);
            }

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
