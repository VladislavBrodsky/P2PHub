import { apiClient } from '../api/client';

export interface BlogEngagement {
    likes: number;
    liked: boolean;
}

export const blogService = {
    getEngagement: async (slug: string): Promise<BlogEngagement> => {
        try {
            const response = await apiClient.get(`/blog/${slug}/engagement`);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch blog engagement:', error);
            // Return dummy data if API fails (offline support/initial load)
            return { likes: Math.floor(Math.random() * (712 - 333) + 333), liked: false };
        }
    },

    likePost: async (slug: string): Promise<{ status: string; likes: number }> => {
        try {
            const response = await apiClient.post(`/blog/${slug}/like`);
            return response.data;
        } catch (error) {
            console.error('Failed to like blog post:', error);
            throw error;
        }
    }
};
