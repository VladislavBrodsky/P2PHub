import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    ChevronRight, ArrowLeft, Search, BookOpen, Clock,
    ArrowUpRight, Heart, Share2, ChevronLeft, Zap,
    Globe
} from 'lucide-react';
import { blogPosts, BlogPost } from '../data/blogPosts';
import { useHaptic } from '../hooks/useHaptic';
import { blogService, BlogEngagement } from '../services/blogService';

import { backButton } from '@telegram-apps/sdk-react';
import { useUI } from '../context/UIContext';

interface BlogPageProps {
    setActiveTab?: (tab: string) => void;
    currentTab?: string;
}

export const BlogPage = ({ setActiveTab, currentTab }: BlogPageProps) => {
    const { t, i18n } = useTranslation();
    const { setHeaderVisible, setFooterVisible, setNotificationsVisible } = useUI();
    const { selection, impact, notification } = useHaptic();
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
    const [engagement, setEngagement] = useState<BlogEngagement>({ likes: 0, liked: false });
    const [isLoadingEngagement, setIsLoadingEngagement] = useState(false);

    // Sync header visibility with selectedPost
    useEffect(() => {
        if (currentTab === 'blog') {
            const isVisible = !selectedPost;
            setHeaderVisible(isVisible);
            setFooterVisible(isVisible);
            setNotificationsVisible(isVisible);
        }
        return () => {
            if (currentTab === 'blog') {
                setHeaderVisible(true);
                setFooterVisible(true);
                setNotificationsVisible(true);
            }
        };
    }, [selectedPost, currentTab, setHeaderVisible, setFooterVisible, setNotificationsVisible]);

    // Reset scroll when post changes
    useEffect(() => {
        const main = document.querySelector('main');
        if (main) main.scrollTop = 0;
    }, [selectedPost]);

    // Optimized: Wrapped in useCallback to suppress lint warning and ensure stable reference for useEffect
    const handlePostClick = useCallback(async (post: BlogPost) => {
        selection();
        setSelectedPost(post);
        setIsLoadingEngagement(true);
        try {
            const data = await blogService.getEngagement(post.id);
            setEngagement(data);
        } catch (error) {
            console.error('Failed to load engagement', error);
        } finally {
            setIsLoadingEngagement(false);
        }
    }, [selection]);

    useEffect(() => {
        const handleDeepLink = (e: any) => {
            const postId = e.detail;
            const post = blogPosts.find(p => p.id === postId);
            if (post) {
                handlePostClick(post);
            }
        };

        window.addEventListener('nav-blog-post', handleDeepLink);
        return () => window.removeEventListener('nav-blog-post', handleDeepLink);
    }, [handlePostClick]); // Added dependency

    // Telegram Native Back Button Integration
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
    }, [selectedPost, setActiveTab, currentTab, selection]); // Added selection dependency

    const categories = useMemo(() => ['All', ...new Set(blogPosts.map(post => post.category))], []);
    // Removed unused variables featuredPost/otherPosts to clean up code

    const handleLike = async () => {
        if (!selectedPost || engagement.liked) return;

        impact('medium');
        // Optimistic update
        setEngagement(prev => ({ ...prev, likes: prev.likes + 1, liked: true }));

        try {
            await blogService.likePost(selectedPost.id);
            notification('success');
        } catch (error: any) {
            console.error('Fail to like', error);
            // Check for 404 which might mean partner record missing in dev
            if (error?.response?.status === 404) {
                // In dev mode/local, we might not have a partner record, so we keep the optimistic update
                // but warn in console
                console.warn('Like failed due to missing partner record (likely Dev environment). Keeping optimistic state.');
            } else {
                // Revert on real errors
                setEngagement(prev => ({ ...prev, likes: prev.likes - 1, liked: false }));
            }
        }
    };

    const handleShare = () => {
        selection();
        if (navigator.share && selectedPost) {
            navigator.share({
                title: selectedPost.title,
                text: selectedPost.excerpt,
                url: window.location.href,
            }).catch(console.error);
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            notification('success');
        }
    };

    const navigatePost = (direction: 'next' | 'prev') => {
        if (!selectedPost) return;
        const currentIndex = blogPosts.findIndex(p => p.id === selectedPost.id);
        const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

        if (nextIndex >= 0 && nextIndex < blogPosts.length) {
            handlePostClick(blogPosts[nextIndex]);
        }
    };

    const isRussian = i18n.language === 'ru';

    // Memoize localized posts to avoid re-mapping on every search keystroke
    const localizedPosts = useMemo(() => {
        return blogPosts.map(post => {
            const localized = t(`blog.posts.${post.id}`, { returnObjects: true }) as any;
            return {
                ...post,
                title: (localized && localized.title) || post.title,
                excerpt: (localized && localized.excerpt) || post.excerpt,
                category: (localized && localized.category) || post.category
            };
        });
    }, [blogPosts, t]);

    // Memoize filtered posts for instant search performance
    const currentFilteredPosts = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return localizedPosts.filter(post => {
            const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
            const matchesSearch =
                post.title.toLowerCase().includes(query) ||
                post.excerpt.toLowerCase().includes(query);
            return matchesCategory && matchesSearch;
        });
    }, [localizedPosts, selectedCategory, searchQuery]);

    const currentFeaturedPost = useMemo(() => currentFilteredPosts[0], [currentFilteredPosts]);
    const currentOtherPosts = useMemo(() => currentFilteredPosts.slice(1), [currentFilteredPosts]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col min-h-screen pb-32"
        >
            <AnimatePresence mode="wait">
                {!selectedPost ? (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex flex-col"
                    >
                        {/* Header Area - Sticky with Glassmorphism */}
                        <div className="px-4 pt-2 pb-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => { selection(); setActiveTab?.('home'); }}
                                    className="p-2 rounded-full bg-(--color-bg-surface) border border-(--color-border-glass) active:scale-90 transition-transform"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight leading-none">{t('blog.title')}</h2>
                                    <p className="text-[9px] font-bold text-(--color-text-secondary) uppercase tracking-widest opacity-60 mt-1">
                                        {blogPosts.length} {t('blog.latest')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Search and Filters */}
                        <div className="px-4 py-4 space-y-4">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-secondary) group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder={t('blog.navigation.search_placeholder')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-(--color-bg-surface) border border-(--color-border-glass) focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-hidden font-medium text-sm transition-all"
                                />
                            </div>

                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => { selection(); setSelectedCategory(category); }}
                                        className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedCategory === category
                                            ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                                            : 'bg-(--color-bg-surface) text-(--color-text-secondary) border-(--color-border-glass) hover:border-blue-500/30'
                                            }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="px-4 space-y-6">
                            {/* Featured Post */}
                            {currentFeaturedPost && selectedCategory === 'All' && searchQuery === '' && (
                                <motion.div
                                    key="featured"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => handlePostClick(currentFeaturedPost)}
                                    className="group overflow-hidden rounded-[2.5rem] border border-(--color-border-glass) bg-(--color-bg-surface) flex flex-col shadow-sm"
                                >
                                    {currentFeaturedPost.image && (
                                        <div className="aspect-video w-full overflow-hidden relative">
                                            <img
                                                src={currentFeaturedPost.image}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                alt={currentFeaturedPost.title}
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                                        </div>
                                    )}

                                    <div className="p-6 sm:p-8 space-y-3 sm:space-y-4">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-1 rounded-full bg-blue-500 text-[9px] font-black uppercase tracking-widest text-white">
                                                {t('blog.navigation.featured')}
                                            </span>
                                            <span className="text-[9px] font-bold text-(--color-text-secondary) opacity-60">
                                                {currentFeaturedPost.date}
                                            </span>
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-black leading-tight text-(--color-text-primary) group-hover:text-blue-500 transition-colors line-clamp-3">
                                            {currentFeaturedPost.title}
                                        </h3>
                                        <p className="text-xs sm:text-sm font-medium text-(--color-text-secondary) line-clamp-2">
                                            {currentFeaturedPost.excerpt}
                                        </p>
                                        <div className="pt-2 sm:pt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                                    <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                                                </div>
                                                <span className="text-[10px] sm:text-xs font-bold text-(--color-text-secondary)">{currentFeaturedPost.author}</span>
                                            </div>
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/5 flex items-center justify-center border border-blue-500/10 group-hover:bg-blue-500 group-hover:text-white group-hover:scale-110 transition-all duration-500">
                                                <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Grid */}
                            <div className="grid gap-4">
                                {(selectedCategory === 'All' && searchQuery === '' ? currentOtherPosts : currentFilteredPosts).map((post, index) => (
                                    <motion.div
                                        key={post.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => handlePostClick(post)}
                                        className="group p-5 rounded-[2rem] bg-(--color-bg-surface) border border-(--color-border-glass) hover:border-blue-500/30 transition-all active:scale-[0.98] flex gap-4 items-center"
                                    >
                                        {post.image && (
                                            <div className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden border border-(--color-border-glass)">
                                                <img
                                                    src={post.image}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    alt=""
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/10">
                                                    {post.category}
                                                </span>
                                                <div className="flex items-center gap-1 text-[9px] font-bold text-(--color-text-secondary) opacity-60">
                                                    <Clock className="w-3 h-3" />
                                                    {post.date}
                                                </div>
                                            </div>
                                            <h4 className="text-[15px] font-extrabold leading-tight group-hover:text-blue-500 transition-colors line-clamp-2">
                                                {post.title}
                                            </h4>
                                            <p className="text-[11px] font-medium text-(--color-text-secondary) line-clamp-2 leading-relaxed">
                                                {post.excerpt}
                                            </p>
                                        </div>
                                        <div className="shrink-0 w-10 h-10 rounded-full bg-(--color-bg-app) border border-(--color-border-glass) flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </motion.div>
                                ))}

                                {currentFilteredPosts.length === 0 && (
                                    <div className="py-20 text-center space-y-4">
                                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
                                            <Search className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-xl font-black">{t('blog.navigation.no_results')}</h3>
                                        <p className="text-sm text-(--color-text-secondary) max-w-[200px] mx-auto">
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
                        engagement={engagement}
                        isLoading={isLoadingEngagement}
                        onBack={() => { selection(); setSelectedPost(null); }}
                        onLike={handleLike}
                        onShare={handleShare}
                        onNext={() => navigatePost('next')}
                        onPrev={() => navigatePost('prev')}
                        setActiveTab={setActiveTab}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

interface BlogDetailProps {
    post: BlogPost;
    engagement: BlogEngagement;
    isLoading: boolean;
    onBack: () => void;
    onLike: () => void;
    onShare: () => void;
    onNext: () => void;
    onPrev: () => void;
    setActiveTab?: (tab: string) => void;
}

const BlogDetail = ({ post, engagement, isLoading, onBack, onLike, onShare, onNext, onPrev, setActiveTab }: BlogDetailProps) => {
    const { t, i18n } = useTranslation();
    const isRussian = i18n.language === 'ru';
    const { selection } = useHaptic();

    // Marketing "Between the lines" snippets
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

    return (
        <motion.div
            key="detail"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex flex-col min-h-screen bg-(--color-bg-app) relative"
        >
            {/* Header Area - Non-sticky to avoid overlapping */}
            <div className="w-full pt-[calc(env(safe-area-inset-top,0px)+3rem)] pb-3 px-4 bg-transparent transition-all">
                <div className="flex items-center justify-between w-full">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-(--color-bg-surface) active:scale-90 transition-all text-(--color-text-primary)">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-3">
                        <button onClick={onShare} className="p-2.5 rounded-full bg-(--color-bg-surface) border border-(--color-border-glass) active:scale-90 transition-all hover:border-blue-500/30">
                            <Share2 className="w-5 h-5 text-(--color-text-secondary)" />
                        </button>
                        <button
                            onClick={onLike}
                            className={`p-2.5 rounded-full border transition-all active:scale-95 flex items-center justify-center ${engagement.liked
                                ? 'bg-red-500/15 border-red-500/30 text-red-500 shadow-lg shadow-red-500/10'
                                : 'bg-(--color-bg-surface) border-(--color-border-glass) text-(--color-text-secondary) hover:border-red-500/20'
                                }`}
                        >
                            <Heart className={`w-5 h-5 ${engagement.liked ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Container - Compact spacing */}
            <div className="px-4 pt-5 pb-24 space-y-6 max-w-lg mx-auto">
                {/* Meta */}
                <div className="space-y-4">
                    {post.image && (
                        <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-(--color-border-glass) shadow-2xl">
                            <img
                                src={post.image}
                                className="absolute inset-0 w-full h-full object-cover"
                                alt={post.title}
                                loading="eager"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/60 to-transparent" />
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                            {post.category}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-(--color-text-secondary) opacity-60">
                            <Clock className="w-3 h-3" />
                            {post.date}
                        </div>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight text-(--color-text-primary)">
                        {post.title}
                    </h1>
                    <div className="flex items-center gap-3 py-1.5 border-y border-(--color-border-glass)">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-slate-400 to-slate-600 dark:from-slate-700 dark:to-slate-900 flex items-center justify-center font-black text-sm text-white shadow-inner">
                            {post.author[0]}
                        </div>
                        <div>
                            <p className="text-xs font-black">{post.author}</p>
                            <p className="text-[10px] font-bold text-(--color-text-secondary) opacity-60">Pintopay Intelligence Hub</p>
                        </div>
                    </div>
                </div>

                {/* Body Text (Simulated content structure) */}
                <div className="space-y-6 text-lg leading-relaxed text-(--color-text-primary)/90 font-medium whitespace-pre-wrap">
                    <p className="first-letter:text-5xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-blue-500 first-letter:leading-none first-letter:pt-2">
                        {post.excerpt}
                    </p>

                    <p>
                        {t('blog.content.p1')}
                    </p>

                    <MarketingBox type="card" />

                    <p>
                        {t('blog.content.p2')}
                    </p>

                    <MarketingBox type="pro" />

                    <p>
                        {t('blog.content.p3')}
                    </p>
                </div>

                {/* Engagement Footer */}
                <div className="pt-8 border-t border-(--color-border-glass) flex flex-col items-center gap-4 pb-12">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onLike}
                        className={`group px-7 py-3.5 rounded-full flex items-center gap-3 transition-all ${engagement.liked
                            ? 'liquid-red-premium scale-105 shadow-red-500/40'
                            : 'bg-(--color-bg-surface) border border-(--color-border-glass) hover:border-red-500/30 text-(--color-text-secondary)'
                            }`}
                    >
                        <Heart className={`w-5 h-5 ${engagement.liked ? 'fill-current' : 'group-hover:text-red-500 transition-colors'}`} />
                        <span className="font-black text-base">
                            {isLoading ? '...' : engagement.likes}
                        </span>
                    </motion.button>
                    <p className="text-[9px] font-bold text-(--color-text-secondary) uppercase tracking-widest opacity-60">
                        {t('blog.navigation.support_article')}
                    </p>
                </div>

                {/* Navigation Buttons */}
                <div className="pt-8 grid grid-cols-2 gap-3">
                    <button
                        onClick={() => { selection(); onPrev(); }}
                        className="p-3.5 rounded-[1.25rem] bg-(--color-bg-surface) border border-(--color-border-glass) hover:border-blue-500/30 active:scale-95 transition-all flex items-center gap-2.5 group text-left"
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                            <ChevronLeft className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-extrabold text-(--color-text-secondary) uppercase tracking-wider">{t('blog.navigation.back')}</span>
                            <span className="text-[9px] font-black">{t('blog.navigation.prev')}</span>
                        </div>
                    </button>
                    <button
                        onClick={() => { selection(); onNext(); }}
                        className="p-3.5 rounded-[1.25rem] bg-(--color-bg-surface) border border-(--color-border-glass) hover:border-blue-500/30 active:scale-95 transition-all flex items-center justify-end gap-2.5 group text-right"
                    >
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] font-extrabold text-(--color-text-secondary) uppercase tracking-wider">{t('blog.navigation.next')}</span>
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
