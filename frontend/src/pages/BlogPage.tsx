import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    ChevronRight, ArrowLeft, Search, BookOpen, Clock,
    Share2, Heart, ArrowUpRight, ChevronLeft, Globe, Zap
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
    }, [selectedCategory, searchQuery]);

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
    }, [posts.length, total, isLoading, fetchPosts, selectedPost]);

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
                        className="flex flex-col"
                    >
                        <div className="px-4 pt-2 pb-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => { selection(); setActiveTab?.('home'); }}
                                    className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 active:scale-90 transition-transform"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <h1 className="text-xl font-black tracking-tight leading-none">{t('blog.title')}</h1>
                                    <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest opacity-60 mt-1">
                                        {total} {t('blog.latest')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-4 py-4 space-y-4">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder={t('blog.navigation.search_placeholder')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-hidden font-medium text-sm transition-all shadow-sm"
                                />
                            </div>

                            <TopicDropdown
                                selected={selectedCategory}
                                onSelect={(cat) => { selection(); setSelectedCategory(cat); }}
                                categories={categories}
                                t={t}
                            />
                        </div>

                        <div className="px-4 space-y-6">
                            {currentFeaturedPost && selectedCategory === 'All' && searchQuery === '' && (
                                <motion.div
                                    key="featured"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => handlePostClick(currentFeaturedPost)}
                                    className="group overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 flex flex-col shadow-sm"
                                >
                                    {currentFeaturedPost.image && (
                                        <div className="aspect-video w-full overflow-hidden relative">
                                            <img
                                                src={currentFeaturedPost.image}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                alt={currentFeaturedPost.title}
                                                loading="eager"
                                            />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                                        </div>
                                    )}

                                    <div className="p-6 sm:p-8 space-y-3 sm:space-y-4">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-1 rounded-full bg-blue-500 text-[9px] font-black uppercase tracking-widest text-white">
                                                {t('blog.navigation.featured')}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 opacity-60">
                                                {currentFeaturedPost.date}
                                            </span>
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-black leading-tight text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors line-clamp-3">
                                            {currentFeaturedPost.title}
                                        </h3>
                                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-2">
                                            {currentFeaturedPost.excerpt}
                                        </p>
                                        <div className="pt-2 sm:pt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                                    <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                                                </div>
                                                <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">{currentFeaturedPost.author}</span>
                                            </div>
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/5 flex items-center justify-center border border-blue-500/10 group-hover:bg-blue-500 group-hover:text-white group-hover:scale-110 transition-all duration-500">
                                                <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" />
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
                                        Updating Intelligence...
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
                                            Scanning Intelligence...
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
            className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 relative"
        >
            <div className="fixed top-0 left-0 w-full h-1 z-100 bg-slate-100 dark:bg-white/5">
                <motion.div
                    className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${scrollProgress}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            </div>

            <div className="w-full pt-safe-top pb-3 px-4 bg-transparent transition-all z-20">
                <div className="flex items-center justify-between w-full">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-sm active:scale-90 transition-all text-slate-500 dark:text-slate-400"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3">
                        {/* Compact Actions in Header */}
                        <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-sm">
                            <button
                                onClick={onLike}
                                className={`p-2 rounded-full transition-all active:scale-90 ${engagement.liked ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                <Heart className={`w-4.5 h-4.5 ${engagement.liked ? 'fill-current' : ''}`} />
                            </button>
                            <div className="w-px h-4 bg-slate-200 dark:bg-white/10" />
                            <button
                                onClick={onShare}
                                className="p-2 rounded-full text-slate-500 dark:text-slate-400 active:scale-90"
                            >
                                <Share2 className="w-4.5 h-4.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 pt-5 pb-24 space-y-6 max-w-lg mx-auto">
                <div className="space-y-4">
                    {post.image && (
                        <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl">
                            <img
                                src={post.image}
                                className="absolute inset-0 w-full h-full object-cover"
                                alt={post.title}
                                loading="eager"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/60 to-transparent" />
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                            {t(getCategoryKey(post.category))}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 opacity-60">
                            <Clock className="w-3.5 h-3.5" />
                            <span>5 min read</span>
                        </div>
                    </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                    {post.title}
                </h1>
                <div className="flex items-center gap-3 py-1.5 border-y border-slate-200 dark:border-white/10">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-slate-400 to-slate-600 dark:from-slate-700 dark:to-slate-900 flex items-center justify-center font-black text-sm text-white shadow-inner">
                        {post.author?.[0] || 'A'}
                    </div>
                    <div>
                        <p className="text-xs font-black">{post.author}</p>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 opacity-60">Pintopay Intelligence Hub</p>
                    </div>
                </div>


                <div className="space-y-6">
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-full rounded-full bg-slate-200 dark:bg-white/5" />
                            <Skeleton className="h-4 w-[90%] rounded-full bg-slate-200 dark:bg-white/5" />
                            <Skeleton className="h-4 w-[95%] rounded-full bg-slate-200 dark:bg-white/5" />
                            <div className="py-6">
                                <Skeleton className="h-32 w-full rounded-[2rem] bg-slate-200 dark:bg-white/5 shadow-inner" />
                            </div>
                            <Skeleton className="h-4 w-[85%] rounded-full bg-slate-200 dark:bg-white/5" />
                            <Skeleton className="h-4 w-[92%] rounded-full bg-slate-200 dark:bg-white/5" />
                        </div>
                    ) : post.content ? (
                        <MarkdownRenderer content={post.content} />
                    ) : (
                        <>
                            <p className="first-letter:text-5xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-blue-500 first-letter:leading-none first-letter:pt-2">
                                {post.excerpt}
                            </p>
                            <MarketingBox type="card" />
                            <MarketingBox type="pro" />
                        </>
                    )}
                </div>

                <div className="pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col items-center gap-4 pb-12">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onLike}
                        className={`group px-7 py-3.5 rounded-full flex items-center gap-3 transition-all ${engagement.liked
                            ? 'bg-red-500 text-white scale-105 shadow-red-500/40'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-red-500/30 text-slate-500 dark:text-slate-400'
                            }`}
                    >
                        <Heart className={`w-5 h-5 ${engagement.liked ? 'fill-current' : 'group-hover:text-red-500 transition-colors'}`} />
                        <span className="font-black text-base">
                            {isLoading ? '...' : engagement.likes}
                        </span>
                    </motion.button>
                    <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest opacity-60">
                        {t('blog.navigation.support_article')}
                    </p>
                </div>

                {/* Related Intelligence */}
                <div className="pt-8 space-y-5">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Related Intelligence</h4>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-white/10 ml-4" />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {allPosts
                            .filter(p => p.id !== post.id && (p.category === post.category || true))
                            .slice(0, 3)
                            .map((relatedPost) => (
                                <button
                                    key={relatedPost.id}
                                    onClick={() => onPostClick(relatedPost)}
                                    className="flex items-center gap-3 sm:gap-4 p-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 active:scale-[0.98] transition-all text-left group shadow-sm hover:shadow-md"
                                >
                                    {relatedPost.image && (
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shrink-0 border border-slate-200 dark:border-white/10">
                                            <img src={relatedPost.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-1 whitespace-nowrap overflow-hidden text-ellipsis">{t(getCategoryKey(relatedPost.category))}</p>
                                        <h5 className="text-[13px] font-black leading-tight line-clamp-2 dark:text-white group-hover:text-blue-500 transition-colors">
                                            {relatedPost.title}
                                        </h5>
                                    </div>
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </button>
                            ))}
                    </div>
                </div>

                <div className="pt-8 grid grid-cols-2 gap-3">
                    <button
                        onClick={() => { selection(); onPrev(); }}
                        className="p-3.5 rounded-[1.25rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-blue-500/30 active:scale-95 transition-all flex items-center gap-2.5 group text-left"
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                            <ChevronLeft className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('blog.navigation.back')}</span>
                            <span className="text-[9px] font-black">{t('blog.navigation.prev')}</span>
                        </div>
                    </button>
                    <button
                        onClick={() => { selection(); onNext(); }}
                        className="p-3.5 rounded-[1.25rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-blue-500/30 active:scale-95 transition-all flex items-center justify-end gap-2.5 group text-right"
                    >
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('blog.navigation.next')}</span>
                            <span className="text-[9px] font-black">{t('blog.navigation.forward')}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
