import { retrieveLaunchParams } from '@telegram-apps/sdk-react';

export const getSafeLaunchParams = () => {
    try {
        return retrieveLaunchParams();
    } catch (e) {
        console.warn('[DEBUG] Not in Telegram environment, using empty params');
        return {
            initData: undefined,
            initDataRaw: '',
            themeParams: {},
            platform: 'unknown'
        };
    }
};
