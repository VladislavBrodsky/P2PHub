import { useEffect } from 'react';
import { swipeBehavior } from '@telegram-apps/sdk-react';

/**
 * Hook to lock the Telegram Mini App screen.
 * Prevents vertical swipes that could close the app and locks body scroll.
 */
export function useTMALock(isLocked: boolean) {
    useEffect(() => {
        if (!isLocked) return;

        // 1. Lock body scroll
        const originalOverflow = document.body.style.overflow;
        const originalTouchAction = document.body.style.touchAction;

        document.body.style.overflow = 'hidden';
        // Prevent gestures on the body
        document.body.style.touchAction = 'none';

        // 2. Disable Telegram vertical swipes if available
        const disableSwipes = async () => {
            try {
                if (swipeBehavior.mount.isAvailable() && !swipeBehavior.isMounted()) {
                    await swipeBehavior.mount();
                }

                if (swipeBehavior.disableVertical.isAvailable()) {
                    swipeBehavior.disableVertical();
                } else if ((swipeBehavior as any).disableVerticalSwipes?.isAvailable?.()) {
                    (swipeBehavior as any).disableVerticalSwipes();
                }
            } catch (e) {
                console.warn('[useTMALock] Failed to disable swipes:', e);
            }
        };

        disableSwipes();

        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.touchAction = originalTouchAction;

            // We usually want to re-enable vertical swipes when the lock is released,
            // UNLESS the app is supposed to be always locked (which App.tsx tries to do).
            // But if it's already locked in App.tsx, calling enable here might break it.
            // However, if the user *wants* it locked during modals, we should ensure it's locked.
            // For now, let's just make sure it's disabled when locked.
        };
    }, [isLocked]);
}
