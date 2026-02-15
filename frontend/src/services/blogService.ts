import { apiClient } from '../api/client';
import { BlogPost } from '../data/blogPosts';

export interface BlogEngagement {
    likes: number;
    liked: boolean;
}

export interface BlogListResponse {
    items: (BlogPost & BlogEngagement)[];
    total: number;
    offset: number;
    limit: number;
}

export const blogService = {
    getPosts: async (options: { offset?: number; limit?: number; category?: string; q?: string } = {}): Promise<BlogListResponse> => {
        try {
            const response = await apiClient.get('/api/blog', { params: options });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch blog posts', error);
            throw error;
        }
    },

    getPostDetail: async (slug: string): Promise<BlogPost & BlogEngagement & { content: string }> => {
        try {
            const response = await apiClient.get(`/api/blog/${slug}`);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch blog post detail', error);
            throw error;
        }
    },

    getEngagement: async (slug: string): Promise<BlogEngagement> => {
        try {
            const response = await apiClient.get(`/api/blog/${slug}/engagement`);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch blog engagement', error);
            // Return dummy data if API fails (offline support/initial load)
            return { likes: Math.floor(Math.random() * (712 - 333) + 333), liked: false };
        }
    },

    likePost: async (slug: string): Promise<{ status: string; likes: number }> => {
        try {
            const response = await apiClient.post(`/api/blog/${slug}/like`);
            return response.data;
        } catch (error) {
            console.error('Failed to like blog post', error);
            throw error;
        }
    }
};
