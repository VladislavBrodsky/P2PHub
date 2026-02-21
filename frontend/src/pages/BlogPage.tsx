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
import { BlogSkeleton } from '../components/Skeletons/BlogSkeleton';
import { Skeleton } from '../components/Skeleton';
import React from 'react';

// New Extracted Components
import { PostCard } from '../components/Blog/PostCard';
import { TopicDropdown } from '../components/Blog/TopicDropdown';
import { MarkdownRenderer } from '../components/Blog/MarkdownRenderer';

/** Renders inline markdown (bold, italic) to HTML for use in excerpt snippets. */
function renderExcerpt(text: string): string {
    if (!text) return '';
    return text
        .replace(/\*\*\s*(.*?)\s*\*\*/g, '<strong class="font-black text-slate-900 dark:text-white">$1</strong>')
        .replace(/__(.*?)__/g, '<strong class="font-black text-slate-900 dark:text-white">$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
}

interface BlogPageProps {
    setActiveTab?: (tab: string) => void;
    currentTab?: string;
}

export default function BlogPage({ setActiveTab, currentTab }: BlogPageProps) {
    const { t } = useTranslation();
    const { selection, impact, notification } = useHaptic();
    const { setHeaderVisible, setFooterVisible, setNotificationsVisible } = useUI();

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
        if (selectedPost && currentTab === 'blog') {
            setHeaderVisible(false);
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
    }, [selectedPost, currentTab, setHeaderVisible, setFooterVisible, setNotificationsVisible]);

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

    const handleShare = () => {
        selection();
        if (selectedPost) {
            const blogId = selectedPost.slug || selectedPost.id;
            const shareUrl = `https://t.me/ViralStudioBot/app?startapp=blog_${blogId}`;

            if (navigator.share) {
                navigator.share({
                    title: selectedPost.title,
                    text: selectedPost.excerpt,
                    url: shareUrl,
                }).catch(console.error);
            } else {
                navigator.clipboard.writeText(shareUrl);
                notification('success');
            }
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
            className="flex flex-col min-h-screen pb-32"
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
                            <div className="absolute top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse" />
                            <div className="absolute bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
                        </div>

                        <div className="px-5 pt-4 pb-2 flex items-center justify-between sticky top-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl z-50">
                            <div className="flex items-center gap-3.5">
                                <button
                                    onClick={() => { selection(); setActiveTab?.('home'); }}
                                    className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 active:scale-90 transition-all shadow-sm hover:shadow-md hover:border-blue-500/20"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl font-black tracking-tight leading-none text-slate-900 dark:text-white">{t('blog.title')}</h1>
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                                            <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                                            <span className="text-[7px] font-black uppercase text-blue-500 tracking-tighter">{t('blog.navigation.live')}</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest opacity-60 mt-1">
                                        {t('blog.latest_count', { count: total })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-6 space-y-5">
                            <div className="relative group">
                                <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 dark:text-slate-400 group-focus-within:text-blue-500 transition-all duration-300 group-focus-within:scale-110" />
                                <input
                                    type="text"
                                    placeholder={t('blog.navigation.search_placeholder')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-15 pl-13 pr-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:border-blue-500/50 focus:ring-8 focus:ring-blue-500/5 outline-hidden font-bold text-sm transition-all shadow-sm hover:shadow-md dark:shadow-blue-500/5"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-200 dark:border-white/5 pointer-events-none">
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
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-white">
                                                        {t('blog.navigation.featured')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-8 sm:p-10 space-y-4 relative bg-linear-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60 mt-1">
                                                {currentFeaturedPost.date} • {t('blog.navigation.intelligence_hub')}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl sm:text-3xl font-black leading-tight text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors line-clamp-3">
                                            {currentFeaturedPost.title}
                                        </h3>
                                        <p
                                            className="text-sm sm:text-base font-medium text-slate-500 dark:text-slate-400 line-clamp-3 opacity-80 leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: renderExcerpt(currentFeaturedPost.excerpt) }}
                                        />
                                        <div className="pt-6 flex items-center justify-between border-t border-slate-200 dark:border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-inner">
                                                    <BookOpen className="w-4 h-4 text-blue-500" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{t('blog.navigation.analyst')}</span>
                                                    <span className="text-xs font-black text-slate-900 dark:text-white">{currentFeaturedPost.author}</span>
                                                </div>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-all duration-500">
                                                <ArrowUpRight className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div className="grid gap-4">
                                {isRefreshing && posts.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2"
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
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">
                                            {t('blog.navigation.scanning')}
                                        </p>
                                    </div>
                                )}

                                {posts.length === 0 && !isLoading && (
                                    <div className="py-20 text-center space-y-4">
                                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
                                            <Search className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-xl font-black">{t('blog.navigation.no_results')}</h3>
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

interface BlogDetailProps {
    post: BlogPost & { content?: string };
    allPosts: (BlogPost & BlogEngagement)[];
    engagement: BlogEngagement;
    isLoading: boolean;
    onBack: () => void;
    onLike: () => void;
    onShare: () => void;
    onNext: () => void;
    onPrev: () => void;
    setActiveTab?: (tab: string) => void;
    onPostClick: (post: BlogPost & BlogEngagement) => void;
}

const BlogDetail = ({
    post, allPosts, engagement, isLoading, onBack, onLike, onShare,
    onNext, onPrev, setActiveTab, onPostClick
}: BlogDetailProps) => {
    const { t } = useTranslation();
    const { selection } = useHaptic();
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const main = document.querySelector('main');
        const handleScroll = () => {
            if (!main) return;
            const scrolled = main.scrollTop;
            const height = main.scrollHeight - main.clientHeight;
            const progress = (scrolled / height) * 100;
            setScrollProgress(progress);
        };
        main?.addEventListener('scroll', handleScroll);
        return () => main?.removeEventListener('scroll', handleScroll);
    }, []);

    const MarketingBox = ({ type }: { type: 'card' | 'pro' }) => {
        const isCard = type === 'card';
        return (
            <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                    selection();
                    setActiveTab?.(isCard ? 'cards' : 'partner');
                }}
                className={`my-4 p-3.5 rounded-2xl border overflow-hidden relative cursor-pointer group shadow-xl ${isCard
                    ? 'bg-linear-to-br from-blue-600 to-indigo-900 border-blue-400/30 shadow-blue-900/20'
                    : 'bg-linear-to-br from-amber-500 to-orange-800 border-amber-400/30 shadow-orange-900/20'
                    }`}
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-2xl rounded-full translate-x-10 -translate-y-10 group-hover:bg-white/10 transition-all duration-500" />

                <div className="relative z-10 flex items-center gap-3.5">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner group-hover:scale-105 transition-transform duration-300">
                        {isCard ? <Globe className="w-5 h-5 text-white" /> : <Zap className="w-5 h-5 text-white" />}
                    </div>

                    <div className="flex-1 min-w-0 py-0.5">
                        <h5 className="text-white font-extrabold text-[15px] leading-tight mb-0.5 tracking-tight">
                            {isCard ? t('blog.marketing.get_card') : t('blog.marketing.upgrade_pro')}
                        </h5>
                        <p className="text-white/80 text-[11px] font-medium leading-relaxed line-clamp-1">
                            {isCard ? t('blog.marketing.spend_everywhere') : t('blog.marketing.unlock_tools')}
                        </p>
                    </div>

                    <div className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all ml-1">
                        <ChevronRight className="w-4 h-4 text-white/90" />
                    </div>
                </div>
            </motion.div>
        );
    };

    const getCategoryKey = (cat: string) => {
        const key = cat.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_');
        return `blog.categories.${key}`;
    };

    return (
        <motion.div
            key="detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col min-h-screen bg-(--color-bg-app) relative"
        >
            <div className="fixed top-0 left-0 w-full h-1.5 z-100 bg-slate-100 dark:bg-white/5">
                <motion.div
                    className="h-full bg-linear-to-r from-blue-500 to-indigo-600 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${scrollProgress}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            </div>

            <div className="sticky top-0 w-full pt-[calc(var(--spacing-safe-top)+var(--spacing-telegram-header))] pb-4 px-4 bg-white/50 dark:bg-slate-950/50 backdrop-blur-2xl transition-all z-50 border-b border-slate-200/50 dark:border-white/5">
                <div className="flex items-center justify-between w-full max-w-lg mx-auto">
                    <button
                        onClick={onBack}
                        className="p-2 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-premium active:scale-95 transition-all text-slate-900 dark:text-white flex items-center gap-2 group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('blog.navigation.back_to_blog')}</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center mr-2">
                            <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none mb-0.5">{t('blog.navigation.reading_progress')}</div>
                            <div className="text-[10px] font-black text-blue-500 leading-none">{Math.round(scrollProgress)}%</div>
                        </div>
                        <div className="flex items-center gap-1.5 p-1 px-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-premium">
                            <button
                                onClick={onLike}
                                className={`p-2 rounded-xl transition-all active:scale-90 flex items-center gap-1.5 ${engagement.liked ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <Heart className={`w-4 h-4 ${engagement.liked ? 'fill-current' : ''}`} />
                            </button>
                            <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-0.5" />
                            <button
                                onClick={onShare}
                                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-90"
                            >
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-5 pt-8 pb-32 space-y-8 max-w-lg mx-auto relative z-10 text-justify!">
                <div className="space-y-6">
                    {post.image && (
                        <div className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-white/10 shadow-3xl group">
                            <img
                                src={post.image}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                alt={post.title}
                                loading="eager"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/80 to-transparent" />
                            <div className="absolute bottom-6 left-6 flex items-center gap-2">
                                <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                                    <p className="text-[9px] font-black text-white uppercase tracking-widest">{t('blog.navigation.intel_archive')}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-4">
                        <span className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">
                            {t(getCategoryKey(post.category))}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 opacity-60">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span>5 {t('blog.navigation.min_analysis')}</span>
                        </div>
                    </div>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black leading-[1.1] tracking-tight text-slate-900 dark:text-white drop-shadow-sm uppercase!">
                    {post.title}
                </h1>

                <div className="flex items-center gap-4 py-5 border-y border-slate-200 dark:border-white/5">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-linear-to-br from-blue-500 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20">
                        <div className="w-full h-full rounded-[1.15rem] bg-white dark:bg-slate-900 flex items-center justify-center font-black text-lg text-blue-600 dark:text-blue-400">
                            {post.author?.[0] || 'A'}
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1">{post.author}</p>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('blog.navigation.senior_analyst')}</p>
                    </div>
                    <div className="ml-auto">
                        <div className="flex -space-x-2.5">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`w-8 h-8 rounded-full border-2 border-slate-50 dark:border-slate-950 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm`}>
                                    <User className="w-4 h-4 text-slate-400" />
                                </div>
                            ))}
                            <div className="w-8 h-8 rounded-full border-2 border-slate-50 dark:border-slate-950 bg-blue-500/10 flex items-center justify-center text-[8px] font-black text-blue-600 dark:text-blue-400 backdrop-blur-md shadow-sm">
                                +12k
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 relative">
                    <div className="absolute top-0 left-0 w-px h-full bg-linear-to-b from-blue-500/20 via-transparent to-transparent -translate-x-6 hidden sm:block" />

                    {isLoading ? (
                        <div className="space-y-6">
                            <Skeleton className="h-4 w-full rounded-full bg-slate-200 dark:bg-white/5" />
                            <Skeleton className="h-4 w-[90%] rounded-full bg-slate-200 dark:bg-white/5" />
                            <Skeleton className="h-4 w-[95%] rounded-full bg-slate-200 dark:bg-white/5" />
                            <div className="py-8">
                                <Skeleton className="h-64 w-full rounded-[3rem] bg-slate-200 dark:bg-white/5 shadow-inner" />
                            </div>
                            <Skeleton className="h-4 w-[85%] rounded-full bg-slate-200 dark:bg-white/5" />
                            <Skeleton className="h-4 w-[92%] rounded-full bg-slate-200 dark:bg-white/5" />
                        </div>
                    ) : post.content ? (
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                            <MarkdownRenderer content={post.content} />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <p
                                className="text-lg font-medium leading-[1.8] text-slate-600 dark:text-slate-300 first-letter:text-6xl first-letter:font-black first-letter:mr-4 first-letter:float-left first-letter:text-blue-600 first-letter:leading-none first-letter:mt-2"
                                dangerouslySetInnerHTML={{ __html: renderExcerpt(post.excerpt) }}
                            />
                            <MarketingBox type="card" />
                            <MarketingBox type="pro" />
                        </div>
                    )}
                </div>

                {/* Interaction Footer */}
                <div className="pt-12 border-t border-slate-200 dark:border-white/5 flex flex-col items-center gap-6 pb-16">
                    <div className="flex items-center gap-4">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={onLike}
                            className={`group h-16 px-10 rounded-[2rem] flex items-center gap-4 transition-all duration-500 ${engagement.liked
                                ? 'bg-red-500 text-white scale-105 shadow-2xl shadow-red-500/40'
                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-red-500/30 text-slate-900 dark:text-white hover:shadow-xl'
                                }`}
                        >
                            <Heart className={`w-6 h-6 transition-transform duration-500 ${engagement.liked ? 'fill-current scale-110' : 'group-hover:text-red-500 group-hover:scale-110'}`} />
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{t('blog.navigation.impact')}</span>
                                <span className="font-black text-xl italic!">
                                    {isLoading ? '...' : engagement.likes.toLocaleString()}
                                </span>
                            </div>
                        </motion.button>

                        <button
                            onClick={onShare}
                            className="w-16 h-16 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 active:scale-95 transition-all shadow-sm hover:shadow-xl group"
                        >
                            <Share2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        </button>
                    </div>

                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">
                        {t('blog.navigation.feedback_loop')}
                    </p>
                </div>

                {/* Related Intelligence */}
                <div className="pt-8 space-y-6">
                    <div className="flex items-center gap-4">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 shrink-0">{t('blog.navigation.next_reports')}</h4>
                        <div className="h-px flex-1 bg-linear-to-r from-blue-500/20 to-transparent" />
                    </div>
                    <div className="grid grid-cols-1 gap-5">
                        {allPosts
                            .filter(p => p.id !== post.id)
                            .slice(0, 3)
                            .map((relatedPost) => (
                                <button
                                    key={relatedPost.id}
                                    onClick={() => onPostClick(relatedPost)}
                                    className="flex items-center gap-4 p-4.5 rounded-[2rem] bg-white dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/5 active:scale-[0.98] transition-all text-left group hover:shadow-2xl hover:shadow-blue-500/5 hover:border-blue-500/30"
                                >
                                    {relatedPost.image && (
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 relative">
                                            <img src={relatedPost.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                            <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0 py-1">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-blue-500 mb-1.5 flex items-center gap-1.5">
                                            <div className="w-1 h-1 rounded-full bg-blue-500" />
                                            {t(getCategoryKey(relatedPost.category))}
                                        </p>
                                        <h5 className="text-[15px] font-black leading-tight line-clamp-2 text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors uppercase!">
                                            {relatedPost.title}
                                        </h5>
                                    </div>
                                    <div className="shrink-0 w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner group-hover:shadow-lg group-hover:shadow-blue-500/30">
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </button>
                            ))}
                    </div>
                </div>

                {/* Flow Navigation */}
                <div className="pt-12 grid grid-cols-2 gap-4">
                    <button
                        onClick={() => { selection(); onPrev(); }}
                        className="p-5 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-blue-500/30 active:scale-95 transition-all flex items-center gap-4 group text-left shadow-sm hover:shadow-xl dark:shadow-blue-500/5"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shrink-0">
                            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('blog.navigation.previous_label')}</span>
                            <span className="text-xs font-black truncate text-slate-900 dark:text-white">{t('blog.navigation.back_in_flow')}</span>
                        </div>
                    </button>
                    <button
                        onClick={() => { selection(); onNext(); }}
                        className="p-5 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-blue-500/30 active:scale-95 transition-all flex items-center justify-end gap-4 group text-right shadow-sm hover:shadow-xl dark:shadow-blue-500/5"
                    >
                        <div className="flex flex-col min-w-0 items-end">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('blog.navigation.next_intel')}</span>
                            <span className="text-xs font-black truncate text-slate-900 dark:text-white">{t('blog.navigation.forward_label')}</span>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shrink-0">
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </button>
                </div>
            </div>

            {/* Immersive Scroll Feedback */}
            <motion.div
                className="fixed bottom-safe-bottom right-6 z-50 p-4 rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-600/40 pointer-events-none origin-bottom"
                style={{ scale: scrollProgress / 100, opacity: scrollProgress > 10 ? 1 : 0 }}
            >
                <ArrowUpRight className="w-6 h-6 -rotate-90" />
            </motion.div>
        </motion.div>
    );
};
