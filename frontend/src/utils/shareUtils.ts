import { isTMA } from './tma';

export interface ShareOptions {
    title?: string;
    text?: string;
    url?: string;
    referralCode?: string;
    files?: File[];
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
    const { title, text, url, referralCode } = options;

    // 1. If referralCode is provided and we're in TMA, use switchInlineQuery for best UX
    if (referralCode && window.Telegram?.WebApp) {
        try {
            window.Telegram.WebApp.switchInlineQuery(referralCode, ['users', 'groups', 'channels']);
            return 'shared';
        } catch (e) {
            console.error('switchInlineQuery failed', e);
        }
    }

    // 2. Try native navigator.share (works well on mobile browsers and some TMA versions)
    if (navigator.share) {
        try {
            const shareData: ShareData = {
                title: title,
                text: text,
                url: url
            };

            // Only add files if browser supports it
            if (options.files && navigator.canShare && navigator.canShare({ files: options.files })) {
                shareData.files = options.files;
            }

            await navigator.share(shareData);
            return 'shared';
        } catch (e: any) {
            // AbortError is normal (user cancelled)
            if (e.name === 'AbortError') return 'shared';
            console.error('navigator.share failed', e);
        }
    }

    // 3. Fallback: Telegram direct link
    const shareText = `${text || ''}${url ? '\n' + url : ''}`;
    shareToTelegram(shareText);

    // 4. Final fallback: Clipboard
    try {
        const fallbackText = `${title ? title + '\n' : ''}${text || ''}${url ? '\n' + url : ''}`;
        await navigator.clipboard.writeText(fallbackText);
        // If we opened Telegram, we already return 'shared', but let's be safe
        return 'shared';
    } catch (e) {
        console.error('Clipboard fallback failed', e);
        return 'failed';
    }
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
