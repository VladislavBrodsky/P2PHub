import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    ChevronRight, ArrowLeft, Search, BookOpen, Clock,
    Share2, Heart, ArrowUpRight, ChevronLeft, Globe, Zap, User
} from 'lucide-react';
import { useHaptic } from '../hooks/useHaptic';
import { backButton } from '@telegram-apps/sdk-react';
import { blogService, BlogEngagement } from '../services/blogService';
import { BlogPost } from '../data/blogPosts';
import { useUI } from '../context/UIContext';
import { useTabActive } from '../components/ui/TabPanel';
import { BlogSkeleton } from '../components/Skeletons/BlogSkeleton';
import { Skeleton } from '../components/Skeleton';
import { authorAvatars } from '../data/authorAvatars';
import { shareUniversal } from '../utils/shareUtils';
import { renderExcerpt } from '../utils/blogUtils';
import React from 'react';

// New Extracted Components
import { PostCard } from '../components/Blog/PostCard';
import { TopicDropdown } from '../components/Blog/TopicDropdown';
import { MarkdownRenderer } from '../components/Blog/MarkdownRenderer';
import { BlogDetail } from '../components/Blog/BlogDetail';
import { MarketingBox } from '../components/Blog/MarketingBox';

interface BlogPageProps {
    setActiveTab?: (tab: string) => void;
    currentTab?: string;
}

export default function BlogPage({ setActiveTab, currentTab }: BlogPageProps) {
    const { t } = useTranslation('marketing');
    const { selection, impact, notification } = useHaptic();
    const { setHeaderVisible, setFooterVisible, setNotificationsVisible } = useUI();
    const isActive = useTabActive();

    const [posts, setPosts] = useState<(BlogPost & BlogEngagement)[]>([]);
    const [selectedPost, setSelectedPost] = useState<(BlogPost & BlogEngagement & { content?: string }) | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingEngagement, setIsLoadingEngagement] = useState(false);
    const [engagement, setEngagement] = useState<BlogEngagement>({ likes: 0, liked: false });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [total, setTotal] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const fetchPosts = useCallback(async (isInitial = false) => {
        if (isInitial) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            const result = await blogService.getPosts({
                offset: isInitial ? 0 : posts.length,
                limit: 10,
                category: selectedCategory === 'All' ? undefined : selectedCategory,
                q: searchQuery || undefined
            });

            if (isInitial) {
                setPosts(result.items);
            } else {
                setPosts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const newItems = result.items.filter(p => !existingIds.has(p.id));
                    return [...prev, ...newItems];
                });
            }
            setTotal(result.total);
        } catch (error) {
            console.error('Failed to fetch posts', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [posts.length, selectedCategory, searchQuery]);

    useEffect(() => {
        fetchPosts(true);
    }, [fetchPosts, selectedCategory, searchQuery]);

    // UI Cleanup on Post Select
    useEffect(() => {
        if (!isActive) {
            setHeaderVisible(true);
            setFooterVisible(true);
            setNotificationsVisible(true);
            return;
        }

        if (selectedPost && currentTab === 'blog') {
            setFooterVisible(false);
            setNotificationsVisible(false);
        } else if (currentTab === 'blog') {
            const timer = setTimeout(() => {
                setHeaderVisible(true);
                setFooterVisible(true);
                setNotificationsVisible(true);
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [selectedPost, currentTab, setHeaderVisible, setFooterVisible, setNotificationsVisible, isActive]);

    // Reset scroll when post changes
    useEffect(() => {
        const main = document.querySelector('main');
        if (main) main.scrollTop = 0;
    }, [selectedPost]);

    const handlePostClick = useCallback(async (post: BlogPost & BlogEngagement) => {
        selection();

        // Instant navigation if in cache
        const cached = blogService.getDetailSync(post.id);
        if (cached) {
            setSelectedPost(cached);
            setEngagement({ likes: cached.likes, liked: cached.liked });
            setIsLoadingEngagement(false);
        } else {
            setSelectedPost(post);
            setIsLoadingEngagement(true);
        }

        try {
            const detail = await blogService.getPostDetail(post.id);
            setSelectedPost(detail);
            setEngagement({ likes: detail.likes, liked: detail.liked });
        } catch (error) {
            console.error('Failed to load post detail', error);
        } finally {
            setIsLoadingEngagement(false);
        }
    }, [selection]);

    useEffect(() => {
        const handleDeepLink = async (e: any) => {
            const postId = e.detail;
            try {
                const detail = await blogService.getPostDetail(postId);
                handlePostClick(detail);
            } catch (error) {
                console.error('Deep link fail', error);
            }
        };

        window.addEventListener('nav-blog-post', handleDeepLink);
        return () => window.removeEventListener('nav-blog-post', handleDeepLink);
    }, [handlePostClick]);

    useEffect(() => {
        if (!backButton.isMounted() || currentTab !== 'blog') return;

        backButton.show();
        const cleanup = backButton.onClick(() => {
            selection();
            if (selectedPost) {
                setSelectedPost(null);
            } else {
                setActiveTab?.('home');
            }
        });

        return () => {
            cleanup();
        };
    }, [selectedPost, setActiveTab, currentTab, selection]);

    const categories = useMemo(() => [
        { id: 'All', label: 'blog.categories.all' },
        { id: 'Tactical Blueprints', label: 'blog.categories.tactical_blueprints' },
        { id: 'Geopolitical Shifts', label: 'blog.categories.geopolitical_shifts' },
        { id: 'Sovereign Mindset', label: 'blog.categories.sovereign_mindset' },
        { id: 'Wealth Strategy', label: 'blog.categories.wealth_strategy' },
        { id: 'Global Trends', label: 'blog.categories.global_trends' },
        { id: 'Financial Shift', label: 'blog.categories.financial_shift' },
        { id: 'Network Velocity', label: 'blog.categories.network_velocity' },
        { id: 'Web3 Intelligence', label: 'blog.categories.web3_intelligence' },
        { id: 'Innovation', label: 'blog.categories.innovation' },
        { id: 'Viral Marketing', label: 'blog.categories.viral_marketing' },
        { id: 'Problem & Solution', label: 'blog.categories.problem_solution' },
        { id: 'Intelligence Culture', label: 'blog.categories.intelligence_culture' }
    ], []);

    const handleLike = async () => {
        if (!selectedPost || engagement.liked) return;

        impact('medium');
        setEngagement(prev => ({ ...prev, likes: prev.likes + 1, liked: true }));

        try {
            await blogService.likePost(selectedPost.id);
            notification('success');
        } catch (error: any) {
            console.error('Fail to like', error);
            setEngagement(prev => ({ ...prev, likes: prev.likes - 1, liked: false }));
        }
    };

    const handleShare = async () => {
        selection();
        if (selectedPost) {
            const blogId = selectedPost.slug || selectedPost.id;
            const shareUrl = `https://t.me/pintopay_probot/app?startapp=blog_${blogId}`;

            await shareUniversal({
                title: selectedPost.title,
                text: selectedPost.excerpt,
                url: shareUrl,
            });
        }
    };

    const navigatePost = (direction: 'next' | 'prev') => {
        if (!selectedPost) return;
        const currentIndex = posts.findIndex(p => p.id === selectedPost.id);
        const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

        if (nextIndex >= 0 && nextIndex < posts.length) {
            handlePostClick(posts[nextIndex]);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && posts.length < total && !isLoading && !isRefreshing && !selectedPost) {
                fetchPosts();
            }
        }, { threshold: 0.1, rootMargin: '200px' });

        if (sentinelRef.current) {
            observer.observe(sentinelRef.current);
        }

        return () => observer.disconnect();
    }, [posts.length, total, isLoading, fetchPosts, selectedPost, isRefreshing]);

    const currentFeaturedPost = useMemo(() => posts[0], [posts]);
    const currentOtherPosts = useMemo(() => posts.slice(1), [posts]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col min-h-screen pb-32 lg:max-w-4xl xl:max-w-5xl lg:mx-auto w-full"
        >
            <AnimatePresence mode="popLayout">
                {isLoading && posts.length === 0 ? (
                    <motion.div
                        key="skeleton"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full"
                    >
                        <BlogSkeleton />
                    </motion.div>
                ) : !selectedPost ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex flex-col relative z-10"
                    >
                        {/* Decorative Background Blobs */}
                        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                            {/* Removed glowing blobs for uniform aesthetic */}
                        </div>

                        <div className="px-5 pt-4 pb-2 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3.5">
                                <button
                                    onClick={() => { selection(); setActiveTab?.('home'); }}
                                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 active:scale-90 transition-all shadow-sm hover:shadow-md hover:border-blue-500/20 text-slate-900 dark:text-white"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-none text-slate-900 dark:text-white">{t('blog.title')}</h1>
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 shrink-0">
                                            <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                                            <span className="text-[9px] font-bold text-blue-500 tracking-tighter">{t('blog.navigation.live')}</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest opacity-60 mt-0.5">
                                        {t('blog.latest_count', { count: total })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-6 space-y-5">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 group-focus-within:text-blue-500 transition-all duration-300 group-focus-within:scale-110" />
                                <input
                                    type="text"
                                    placeholder={t('blog.navigation.search_placeholder')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-12 pl-12 pr-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:border-blue-500/50 focus:ring-8 focus:ring-blue-500/5 outline-hidden font-bold text-sm transition-all shadow-sm hover:shadow-md dark:shadow-blue-500/5 placeholder:text-slate-400 dark:placeholder:text-slate-500/70"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-300/80 border border-slate-200 dark:border-white/5 pointer-events-none">
                                    {t('blog.navigation.search_label')}
                                </div>
                            </div>

                            <TopicDropdown
                                selected={selectedCategory}
                                onSelect={(cat) => { selection(); setSelectedCategory(cat); }}
                                categories={categories}
                                t={t}
                            />
                        </div>

                        <div className="px-5 space-y-8">
                            {currentFeaturedPost && selectedCategory === 'All' && searchQuery === '' && (
                                <motion.div
                                    key="featured"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={() => handlePostClick(currentFeaturedPost)}
                                    className="group relative overflow-hidden rounded-[3rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 flex flex-col shadow-2xl shadow-blue-500/5 cursor-pointer active:scale-[0.99] transition-all duration-500"
                                >
                                    {currentFeaturedPost.image && (
                                        <div className="aspect-4/3 sm:aspect-video w-full overflow-hidden relative">
                                            <img
                                                src={currentFeaturedPost.image}
                                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                                alt={currentFeaturedPost.title}
                                                loading="eager"
                                            />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent z-10" />

                                            <div className="absolute top-6 left-6 z-20">
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/90 backdrop-blur-md border border-white/20 shadow-xl">
                                                    <Zap className="w-3 h-3 text-white fill-current" />
                                                    <span className="text-label font-bold tracking-widest text-white">
                                                        {t('blog.navigation.featured')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-8 sm:p-10 space-y-4 relative bg-linear-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            <span className="text-label font-bold text-slate-400 tracking-widest opacity-60 mt-1">
                                                {currentFeaturedPost.date} • {t('blog.navigation.intelligence_hub')}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl sm:text-3xl font-bold leading-tight text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors line-clamp-3">
                                            {currentFeaturedPost.title}
                                        </h3>
                                        <p
                                            className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400 line-clamp-3 opacity-80 leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: renderExcerpt(currentFeaturedPost.excerpt) }}
                                        />
                                        <div className="pt-6 flex items-center justify-between border-t border-slate-200 dark:border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-blue-500/20 to-indigo-500/20 p-px overflow-hidden shadow-inner">
                                                    <div className="w-full h-full rounded-[calc(1rem-1px)] bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                                                        {currentFeaturedPost.authorImage ? (
                                                            <img src={currentFeaturedPost.authorImage} className="w-full h-full object-cover" alt={currentFeaturedPost.author} />
                                                        ) : (
                                                            <BookOpen className="w-4 h-4 text-blue-500" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-label font-bold text-slate-400 tracking-widest leading-none mb-1">{t('blog.navigation.analyst')}</span>
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">{currentFeaturedPost.author || 'Marcus Vance'}</span>
                                                </div>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-all duration-500">
                                                <ArrowUpRight className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                                {isRefreshing && posts.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-blue-600/90 backdrop-blur-md text-white text-label font-bold tracking-widest shadow-xl flex items-center gap-2"
                                    >
                                        <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        {t('blog.navigation.updating')}
                                    </motion.div>
                                )}
                                {(selectedCategory === 'All' && searchQuery === '' ? currentOtherPosts : posts).map((post, index) => (
                                    <PostCard
                                        key={`${post.id}-${index}`}
                                        post={post}
                                        index={index}
                                        onClick={() => handlePostClick(post)}
                                    />
                                ))}

                                {posts.length < total && (
                                    <div ref={sentinelRef} className="py-10 flex flex-col items-center justify-center gap-3">
                                        <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                        <p className="text-label font-bold tracking-widest text-slate-400 animate-pulse">
                                            {t('blog.navigation.scanning')}
                                        </p>
                                    </div>
                                )}

                                {posts.length === 0 && !isLoading && (
                                    <div className="py-20 text-center space-y-4">
                                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
                                            <Search className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-xl font-bold">{t('blog.navigation.no_results')}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[200px] mx-auto">
                                            {t('blog.navigation.no_results_desc')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <BlogDetail
                        post={selectedPost}
                        allPosts={posts}
                        engagement={engagement}
                        isLoading={isLoadingEngagement}
                        onBack={() => { selection(); setSelectedPost(null); }}
                        onLike={handleLike}
                        onShare={handleShare}
                        onNext={() => navigatePost('next')}
                        onPrev={() => navigatePost('prev')}
                        setActiveTab={setActiveTab}
                        onPostClick={handlePostClick}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
