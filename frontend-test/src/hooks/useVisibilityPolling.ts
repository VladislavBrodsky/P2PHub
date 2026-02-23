import { useEffect, useRef } from 'react';

/**
 * A custom hook that executes a polling function only when the tab is visible.
 * This saves battery, CPU, and network resources.
 * 
 * @param callback The function to execute on each interval
 * @param delay The interval in milliseconds (null to stop polling)
 * @param executeImmediately Whether to execute the callback immediately when visible
 */
export function useVisibilityPolling(
    callback: () => void | Promise<void>,
    delay: number | null,
    executeImmediately = true
) {
    const savedCallback = useRef(callback);

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        if (delay === null) return;

        // #comment: Using 'any' for intervalId to maintain compatibility across different TypeScript environments 
        // (Vite/Browser/Node) without requiring specific @types/node configuration.
        let intervalId: any = null;
        let isVisible = !document.hidden;

        const tick = () => {
            if (isVisible) {
                savedCallback.current();
            }
        };

        const handleVisibilityChange = () => {
            const wasInvisible = !isVisible;
            isVisible = !document.hidden;

            if (isVisible && wasInvisible) {
                // Return to tab - refresh immediately if requested
                if (executeImmediately) {
                    tick();
                }

                // Restart interval
                if (intervalId) clearInterval(intervalId);
                intervalId = setInterval(tick, delay);
            } else if (!isVisible) {
                // Tab hidden - stop interval
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
            }
        };

        // Initial setup
        if (isVisible) {
            if (executeImmediately) tick();
            intervalId = setInterval(tick, delay);
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (intervalId) clearInterval(intervalId);
        };
    }, [delay, executeImmediately]);
}
