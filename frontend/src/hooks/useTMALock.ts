import { useEffect } from 'react';
import { swipeBehavior } from '@telegram-apps/sdk-react';

/**
 * Hook to lock the Telegram Mini App screen.
 * Prevents vertical swipes that would close the app and stops background scroll,
 * WITHOUT blocking scrollable containers inside the modal.
 *
 * Key insight: `document.body.style.overflow = 'hidden'` also kills scroll
 * inside child elements on iOS/Telegram WebView. Instead we use a scroll-position
 * capture approach: fix the body in place, then restore scroll position on unmount.
 */
export function useTMALock(isLocked: boolean) {
    useEffect(() => {
        if (!isLocked) return;

        // 1. Capture current scroll position before locking
        const scrollY = window.scrollY;

        // 2. Fix the body in place (background stops scrolling)
        // We use a small timeout to allow the transition animation to start
        // smoothly before the body's layout is recalculated.
        const lockTimeout = setTimeout(() => {
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.width = '100%';
            document.body.style.overscrollBehavior = 'none';
        }, 300); // Wait for drawer to be mostly visible

        // 3. Disable Telegram vertical swipes (Dual-Layer locking)
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
            clearTimeout(lockTimeout);
            // Unfix body and restore scroll position
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.width = '';
            document.body.style.overscrollBehavior = '';

            // Restore scroll position
            window.scrollTo(0, scrollY);

            // Note: We don't re-enable swipes here because App.tsx
            // manages the global swipe state. Re-enabling here could
            // break the global lock.
        };
    }, [isLocked]);
}
