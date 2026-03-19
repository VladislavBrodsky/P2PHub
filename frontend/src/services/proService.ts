import { apiClient } from '../api/client';
import { getSafeLaunchParams } from '../utils/tma';
import { getApiUrl } from '../utils/api';

export interface PROStatus {
    is_pro: boolean;
    is_pro_plus: boolean;
    pro_tokens: number;
    has_x_setup: boolean;
    has_telegram_setup: boolean;
    has_linkedin_setup: boolean;
    has_pinterest_setup: boolean;
    has_threads_setup: boolean;
    capabilities: {
        text_generation: boolean;
        image_generation: boolean;
    };
    personal_referral_link?: string;
    academy_score?: number;
    completed_stages?: string; // JSON string from backend
    unlocked_stages?: string; // JSON string from backend
    bot_username?: string;
    setup?: {
        x_api_key: string;
        x_api_secret: string;
        x_access_token: string;
        x_access_token_secret: string;
        telegram_channel_id: string;
        telegram_channels: string[];
        linkedin_access_token: string;
        pinterest_access_token: string;
        threads_access_token: string;
        facebook_access_token: string | null;
        discord_webhook_url: string | null;
    };
}

export interface PROSetupPayload {
    x_api_key?: string;
    x_api_secret?: string;
    x_access_token?: string;
    x_access_token_secret?: string;
    telegram_channel_id?: string;
    telegram_channels?: string[];
    linkedin_access_token?: string;
    pinterest_access_token?: string;
    threads_access_token?: string;
    facebook_access_token?: string;
    discord_webhook_url?: string;
}

export interface ViralGenerateResponse {
    id?: number;
    title: string;
    body: string;
    hashtags?: string[];
    image_prompt: string;
    image_url?: string;
    tokens_remaining: number;
}

export const proService = {
    getStatus: async (): Promise<PROStatus> => {
        const response = await apiClient.get('/api/pro/status');
        return response.data;
    },

    getMemberAvatars: async (limit: number = 10): Promise<{ avatars: { url?: string, file_id?: string }[] }> => {
        const response = await apiClient.get(`/api/pro/members/avatars?limit=${limit}`);
        return response.data;
    },

    setupSocial: async (payload: PROSetupPayload) => {
        const response = await apiClient.post('/api/pro/setup', payload);
        return response.data;
    },

    generateContent: async (post_type: string, target_audience: string, language: string, tone?: string, referral_link?: string): Promise<ViralGenerateResponse> => {
        const response = await apiClient.post('/api/pro/generate', {
            post_type,
            target_audience,
            language,
            tone_of_voice: tone,
            referral_link
        });
        return response.data;
    },

    publishContent: async (platform: 'x' | 'telegram' | 'linkedin' | 'pinterest' | 'threads' | 'facebook' | 'discord', content: string, image_path?: string, generation_id?: number, channel_id?: string) => {
        const response = await apiClient.post('/api/pro/post', {
            platform,
            content,
            image_path,
            generation_id,
            ...(channel_id ? { channel_id } : {})
        });
        return response.data;
    },

    testIntegration: async (platform: 'x' | 'telegram' | 'linkedin' | 'pinterest' | 'threads' | 'facebook' | 'discord') => {
        const response = await apiClient.post('/api/pro/test', {
            platform,
            content: "Test Message", // Backend ignores this for test
        });
        return response.data;
    },

    fixHeadline: async (headline: string): Promise<{ result: string, tokens_remaining: number }> => {
        const response = await apiClient.post('/api/pro/tools/headline', { headline });
        return response.data;
    },

    fetchTrends: async (): Promise<{ trends: any[], tokens_remaining: number }> => {
        const response = await apiClient.post('/api/pro/tools/trends', {});
        return response.data;
    },

    generateBio: async (bio: string): Promise<{ bio: string, tokens_remaining: number }> => {
        const response = await apiClient.post('/api/pro/tools/bio', { bio });
        return response.data;
    },

    completeAcademyStage: async (stage_id: string): Promise<{ status: string, academy_score: number, tokens_remaining?: number }> => {
        const response = await apiClient.post(`/api/pro/academy/complete/${stage_id}`, {});
        return response.data;
    },

    unlockAcademyStage: async (stage_id: string): Promise<{ status: string, new_xp: number, unlocked_stages: string[] }> => {
        const response = await apiClient.post(`/api/pro/academy/unlock/${stage_id}`, {});
        return response.data;
    },

    getMarketingAudit: async (language: string = 'English', force_refresh: boolean = false): Promise<{ audit: any, tokens_remaining: number }> => {
        const response = await apiClient.post('/api/pro/tools/audit', {
            language,
            force_refresh
        });
        return response.data;
    },

    updateReferralLink: async (referral_link: string) => {
        const response = await apiClient.post('/api/pro/referral-link', { referral_link });
        return response.data;
    },

    getAnalyticsCabinet: async () => {
        const response = await apiClient.get('/api/pro/analytics/cabinet');
        return response.data;
    },

    async getPredictiveResonance() {
        const response = await apiClient.get('/api/pro/analytics/resonance');
        return response.data;
    },

    regenerateHashtags: async (post_type: string, target_audience: string, language: string, tone?: string): Promise<{ hashtags: string[] }> => {
        const response = await apiClient.post('/api/pro/regenerate-hashtags', {
            post_type,
            target_audience,
            language,
            tone_of_voice: tone
        });
        return response.data;
    },

    refreshPostMetrics: async (post_id: number) => {
        const response = await apiClient.post(`/api/pro/analytics/post/${post_id}/refresh`);
        return response.data;
    },

    generateContentStream: async (
        post_type: string,
        target_audience: string,
        language: string,
        onEvent: (event: { type: string; content?: any; tokens_remaining?: number }) => void,
        tone?: string,
        referral_link?: string
    ) => {
        const url = `${getApiUrl().replace('http://', 'https://')}/api/pro/generate-stream`;
        const params = getSafeLaunchParams();
        const initDataRaw = params.initDataRaw
            || (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData)
            || '';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-Init-Data': initDataRaw,
            },
            body: JSON.stringify({
                post_type,
                target_audience,
                language,
                tone_of_voice: tone,
                referral_link
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('ReadableStream supported');

        const decoder = new TextDecoder();
        let partialData = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            partialData += decoder.decode(value, { stream: true });
            const lines = partialData.split('\n\n');
            partialData = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        onEvent(data);
                    } catch (e) {
                        console.error('[SSE] JSON Parse Error:', e);
                    }
                }
            }
        }
    }
};
