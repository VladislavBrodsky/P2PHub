import { apiClient } from '../api/client';

export interface PROStatus {
    is_pro: boolean;
    pro_tokens: number;
    has_x_setup: boolean;
    has_telegram_setup: boolean;
    has_linkedin_setup: boolean;
    capabilities: {
        text_generation: boolean;
        image_generation: boolean;
    };
}

export interface PROSetupPayload {
    x_api_key?: string;
    x_api_secret?: string;
    x_access_token?: string;
    x_access_token_secret?: string;
    telegram_channel_id?: string;
    linkedin_access_token?: string;
}

export interface ViralGenerateResponse {
    title: string;
    body: string;
    hashtags?: string[];
    image_prompt: string;
    tokens_remaining: number;
}

export const proService = {
    getStatus: async (): Promise<PROStatus> => {
        const response = await apiClient.get('/api/pro/status');
        return response.data;
    },

    setupSocial: async (payload: PROSetupPayload) => {
        const response = await apiClient.post('/api/pro/setup', payload);
        return response.data;
    },

    generateContent: async (post_type: string, target_audience: string, language: string, referral_link?: string): Promise<ViralGenerateResponse> => {
        const response = await apiClient.post('/api/pro/generate', {
            post_type,
            target_audience,
            language,
            referral_link
        });
        return response.data;
    },

    publishContent: async (platform: 'x' | 'telegram' | 'linkedin', content: string, image_path?: string) => {
        const response = await apiClient.post('/api/pro/post', {
            platform,
            content,
            image_path
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
    }
};
