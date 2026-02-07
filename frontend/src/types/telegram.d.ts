export { };

declare global {
    interface Window {
        Telegram?: {
            WebApp?: {
                initData: string;
                initDataUnsafe: any;
                expand: () => void;
                ready: () => void;
            };
        };
    }
}
