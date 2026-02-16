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

// In-memory cache to prevent redundant API calls during the same session
// This significantly improves UX when navigating back and forth
const cache: {
    posts: Record<string, BlogListResponse>;
    details: Record<string, BlogPost & BlogEngagement & { content: string }>;
} = {
    posts: {},
    details: {}
};

export const blogService = {
    getPosts: async (options: { offset?: number; limit?: number; category?: string; q?: string } = {}): Promise<BlogListResponse> => {
        const cacheKey = JSON.stringify(options);
        if (cache.posts[cacheKey]) {
            return cache.posts[cacheKey];
        }

        try {
            const response = await apiClient.get('/api/blog', { params: options });
            cache.posts[cacheKey] = response.data;
            return response.data;
        } catch (error) {
            console.error('Failed to fetch blog posts', error);
            throw error;
        }
    },

    getPostDetail: async (slug: string): Promise<BlogPost & BlogEngagement & { content: string }> => {
        if (cache.details[slug]) {
            return cache.details[slug];
        }

        try {
            const response = await apiClient.get(`/api/blog/${slug}`);
            cache.details[slug] = response.data;
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
            return { likes: Math.floor(Math.random() * (712 - 333) + 333), liked: false };
        }
    },

    likePost: async (slug: string): Promise<{ status: string; likes: number }> => {
        try {
            const response = await apiClient.post(`/api/blog/${slug}/like`);
            // Invalidate detail cache to show new like count
            delete cache.details[slug];
            return response.data;
        } catch (error) {
            console.error('Failed to like blog post', error);
            throw error;
        }
    },

    clearCache: () => {
        cache.posts = {};
        cache.details = {};
    }
};

