import { isTMA } from './tma';

export interface ShareOptions {
    title?: string;
    text?: string;
    url?: string;
}

/**
 * Shared utility to handle sharing across the app.
 * Favors Telegram-native APIs when in TMA.
 */
export const shareToTelegram = (text: string, url?: string) => {
    const encodedText = encodeURIComponent(text);
    const encodedUrl = url ? encodeURIComponent(url) : '';

    // Telegram share URL format: https://t.me/share/url?url={url}&text={text}
    const telegramShareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;

    if (isTMA() && window.Telegram?.WebApp) {
        // use openTelegramLink for better reliability on Android TMA
        try {
            window.Telegram.WebApp.openTelegramLink(telegramShareUrl);
            return true;
        } catch (e) {
            console.error('TMA openTelegramLink failed', e);
        }
    }

    // Fallback for standard web or if TMA API fails
    window.open(telegramShareUrl, '_blank');
    return true;
};

/**
 * Universal share function that uses navigator.share if available,
 * otherwise falls back to Telegram sharing or clipboard.
 */
export const shareUniversal = async (options: ShareOptions): Promise<'shared' | 'copied' | 'failed'> => {
    const { title, text, url } = options;

    // 1. Try native navigator.share (works well on mobile browsers and some TMA versions)
    if (navigator.share) {
        try {
            await navigator.share({
                title,
                text,
                url
            });
            return 'shared';
        } catch (e: any) {
            // AbortError is normal (user cancelled)
            if (e.name === 'AbortError') return 'shared';
            console.error('navigator.share failed', e);
        }
    }

    // 2. If navigator.share fails or is unavailable, use Telegram share as primary fallback
    // because most of our users are on Telegram.
    const shareText = `${text || ''}${url ? '\n' + url : ''}`;
    shareToTelegram(shareText);

    // We return 'shared' here because we've opened the share window, 
    // even if we don't know if the user completed it.
    return 'shared';
};

/**
 * Clean markdown symbols from text for platforms that don't support it.
 */
export const stripMarkdown = (text: string): string => {
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/_(.*?)_/g, '$1')
        .replace(/^#{1,3}\s+/gm, '')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1: $2')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
};
