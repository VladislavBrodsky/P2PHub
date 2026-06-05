import { apiClient } from '../api/client';
import { BlogPost } from '../data/blogPosts';
import { authorAvatars } from '../data/authorAvatars';
import i18next from 'i18next';

const AUTHOR_MAP: Record<string, string> = {
    'Marcus Vance': 'marcus_vance',
    'Alex Rivera': 'alex_rivera',
    'Sarah Chen': 'sarah_chen',
    'Liam Frost': 'liam_frost',
    'Ava Sterling': 'ava_sterling',
    'Noah Vance': 'noah_vance',
    'Zoe Chen': 'zoe_chen',
    'Kai Rivera': 'kai_rivera'
};

const injectAuthorImage = (post: any) => {
    const key = AUTHOR_MAP[post.author];
    if (key && authorAvatars[key]) {
        post.authorImage = authorAvatars[key];
    }
    return post;
};

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

// In-memory cache + Persistence for instantaneous UX
const cache: {
    posts: Record<string, { data: BlogListResponse; timestamp: number }>;
    details: Record<string, { data: BlogPost & BlogEngagement & { content: string }; timestamp: number }>;
} = {
    posts: {},
    details: {}
};

const CACHE_TTL = 1000 * 60 * 15; // 15 minutes
const PERSIST_KEY = 'p2phub_blog_cache';

// Load initial cache from sessionStorage if available (faster than localStorage for session-bound data)
try {
    const saved = sessionStorage.getItem(PERSIST_KEY);
    if (saved) {
        const parsed = JSON.parse(saved);
        if (Date.now() - parsed.timestamp < CACHE_TTL * 4) { // Allow longer TTL for persisted data
            Object.assign(cache, parsed.cache);
        }
    }
} catch (e) {
    console.warn('Blog cache restoration failed', e);
}

const persistCache = () => {
    try {
        sessionStorage.setItem(PERSIST_KEY, JSON.stringify({
            cache,
            timestamp: Date.now()
        }));
    } catch (e) { /* ignore */ }
};

export const blogService = {
    getPosts: async (options: { offset?: number; limit?: number; category?: string; q?: string } = {}): Promise<BlogListResponse> => {
        const lang = i18next.language?.split('-')[0] || 'en';
        const cacheKey = `${lang}:${JSON.stringify(options)}`;
        const cached = cache.posts[cacheKey];

        // Return cached immediately if valid
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            return cached.data;
        }

        try {
            const response = await apiClient.get('/api/blog', { params: options });
            const data = response.data;
            data.items = data.items.map(injectAuthorImage);
            cache.posts[cacheKey] = { data, timestamp: Date.now() };
            persistCache();
            return data;
        } catch (error) {
            // Fallback to stale cache if network fails
            if (cached) return cached.data;
            console.error('Failed to fetch blog posts', error);
            throw error;
        }
    },

    // Synchronous check for UI to avoid flickers
    getPostsSync: (options: { offset?: number; limit?: number; category?: string; q?: string } = {}): BlogListResponse | null => {
        const lang = i18next.language?.split('-')[0] || 'en';
        const cacheKey = `${lang}:${JSON.stringify(options)}`;
        const cached = cache.posts[cacheKey];
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            return cached.data;
        }
        return null;
    },

    getPostDetail: async (slug: string): Promise<BlogPost & BlogEngagement & { content: string }> => {
        const lang = i18next.language?.split('-')[0] || 'en';
        const detailKey = `${lang}:${slug}`;
        const cached = cache.details[detailKey];
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            return cached.data;
        }

        try {
            const response = await apiClient.get(`/api/blog/${slug}`);
            const data = injectAuthorImage(response.data);
            cache.details[detailKey] = { data, timestamp: Date.now() };
            persistCache();
            return data;
        } catch (error) {
            if (cached) return cached.data;
            console.error('Failed to fetch blog post detail', error);
            throw error;
        }
    },

    getDetailSync: (slug: string): (BlogPost & BlogEngagement & { content: string }) | null => {
        const lang = i18next.language?.split('-')[0] || 'en';
        const detailKey = `${lang}:${slug}`;
        const cached = cache.details[detailKey];
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            return cached.data;
        }
        return null;
    },

    // Background prefetcher to make transitions feel instant
    prefetchNext: (posts: BlogPost[]) => {
        // Prefetch first 3 posts content in background
        const lang = i18next.language?.split('-')[0] || 'en';
        posts.slice(0, 3).forEach(post => {
            const detailKey = `${lang}:${post.slug}`;
            if (!cache.details[detailKey]) {
                apiClient.get(`/api/blog/${post.slug}`).then(res => {
                    cache.details[detailKey] = { data: res.data, timestamp: Date.now() };
                }).catch(() => { /* silent fail for prefetch */ });
            }
        });
    },

    getEngagement: async (slug: string): Promise<BlogEngagement> => {
        try {
            const response = await apiClient.get(`/api/blog/${slug}/engagement`);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch blog engagement', error);
            return { likes: 333, liked: false };
        }
    },

    likePost: async (slug: string): Promise<{ status: string; likes: number }> => {
        try {
            const response = await apiClient.post(`/api/blog/${slug}/like`);
            delete cache.details[slug]; // Invalidate cache
            persistCache();
            return response.data;
        } catch (error) {
            console.error('Failed to like blog post', error);
            throw error;
        }
    },

    clearCache: () => {
        cache.posts = {};
        cache.details = {};
        sessionStorage.removeItem(PERSIST_KEY);
    }
};

