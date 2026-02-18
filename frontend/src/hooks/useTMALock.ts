import { useEffect } from 'react';
import { swipeBehavior } from '@telegram-apps/sdk-react';

/**
 * Hook to lock the Telegram Mini App screen.
 * Prevents vertical swipes that could close the app and locks body scroll.
 */
export function useTMALock(isLocked: boolean) {
    useEffect(() => {
        if (!isLocked) return;

        // 1. Lock background scroll and prevent bounce
        const originalOverflow = document.body.style.overflow;
        const originalOverscroll = document.body.style.overscrollBehavior;

        document.body.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'none';

        // 2. Disable Telegram vertical swipes (Dual-Layer locking)
        const disableSwipes = async () => {
            // A. SDK Method
            try {
                if (swipeBehavior.mount.isAvailable() && !swipeBehavior.isMounted()) {
                    await swipeBehavior.mount();
                }

                if (swipeBehavior.disableVertical.isAvailable()) {
                    swipeBehavior.disableVertical();
                }
            } catch (e) {
                console.warn('[useTMALock] SDK Swipe Lock Failed:', e);
            }

            // B. Direct WebApp Method (High Compatibility Fallback)
            try {
                if (window.Telegram?.WebApp) {
                    if ((window.Telegram.WebApp as any).disableVerticalSwipes) {
                        (window.Telegram.WebApp as any).disableVerticalSwipes();
                    }
                    // Ensure expanded mode to give window room to breathe
                    window.Telegram.WebApp.expand?.();
                }
            } catch (e) {
                // Ignore fallback errors
            }
        };

        disableSwipes();

        return () => {
            // Restore original styles
            document.body.style.overflow = originalOverflow;
            document.body.style.overscrollBehavior = originalOverscroll;

            // Note: We don't re-enable swipes here because App.tsx 
            // manages the global swipe state. Re-enabling here could 
            // break the global lock.
        };
    }, [isLocked]);
}
