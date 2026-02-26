import { ROUTES } from './routes';

/**
 * DeepLinkResult — Parsed result from a Telegram deep link start_param.
 */
export interface DeepLinkResult {
    tab: string;
    payload?: string;
}

/**
 * parseDeepLink — Parse a Telegram `start_param` or URL param into a
 * navigation target.
 *
 * Supports:
 *   - 'network'      → partner tab
 *   - 'blog_<slug>'  → blog tab + dispatches nav-blog-post event
 *   - 'pro_<tab>'    → pro tab + dispatches nav-pro-tab event
 *
 * @returns DeepLinkResult or null if no valid deep link found
 */
export function parseDeepLink(startParam: string | null | undefined): DeepLinkResult | null {
    if (!startParam) return null;

    if (startParam === 'network') {
        return { tab: ROUTES.PARTNER };
    }

    if (startParam.startsWith('blog_')) {
        return { tab: ROUTES.BLOG, payload: startParam.replace('blog_', '') };
    }

    if (startParam.startsWith('pro_')) {
        return { tab: ROUTES.PRO, payload: startParam.replace('pro_', '') };
    }

    return null;
}

/**
 * getStartParam — Reads the start_param from Telegram WebApp or URL query params.
 */
export function getStartParam(): string | null {
    const tgParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (tgParam) return tgParam;

    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('start_param') || urlParams.get('startapp');
}
