export { };

declare global {
    interface Window {
        Telegram?: {
            WebApp?: {
                initData: string;
                initDataUnsafe: any;
                expand: () => void;
                ready: () => void;
                switchInlineQuery: (query: string, choose_types?: string[]) => void;
                openTelegramLink: (url: string) => void;
                openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
                HapticFeedback: {
                    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
                    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
                    selectionChanged: () => void;
                };
            };
        };
    }
}
