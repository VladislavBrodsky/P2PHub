import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    ChevronRight, ArrowLeft, Search, Filter, BookOpen, Clock,
    ArrowUpRight, Heart, Share2, ChevronLeft, Sparkles, Zap, Shield, Globe
} from 'lucide-react';
import { blogPosts, BlogPost } from '../data/blogPosts';
import { useHaptic } from '../hooks/useHaptic';
import { blogService, BlogEngagement } from '../services/blogService';

interface BlogPageProps {
    setActiveTab?: (tab: string) => void;
}

export const BlogPage = ({ setActiveTab }: BlogPageProps) => {
    const { t, i18n } = useTranslation();
    const { selection, impact, notification } = useHaptic();
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
    const [engagement, setEngagement] = useState<BlogEngagement>({ likes: 0, liked: false });
    const [isLoadingEngagement, setIsLoadingEngagement] = useState(false);

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
    }, []);

    const categories = ['All', ...new Set(blogPosts.map(post => post.category))];

    const filteredPosts = blogPosts.filter(post => {
        const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
        const matchesSearch =
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const featuredPost = filteredPosts[0];
    const otherPosts = filteredPosts.slice(1);

    const handlePostClick = async (post: BlogPost) => {
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
    };

    const handleLike = async () => {
        if (!selectedPost || engagement.liked) return;

        impact('medium');
        // Optimistic update
        setEngagement(prev => ({ ...prev, likes: prev.likes + 1, liked: true }));

        try {
            await blogService.likePost(selectedPost.id);
            notification('success');
        } catch (error) {
            console.error('Fail to like', error);
            // Revert on error
            setEngagement(prev => ({ ...prev, likes: prev.likes - 1, liked: false }));
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
    const localizedPosts = blogPosts.map(post => {
        const localized = t(`blog.posts.${post.id}`, { returnObjects: true }) as any;
        return {
            ...post,
            title: localized.title || post.title,
            excerpt: localized.excerpt || post.excerpt,
            category: localized.category || post.category
        };
    });

    // Re-filter with localized content
    const currentFilteredPosts = localizedPosts.filter(post => {
        const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
        const matchesSearch =
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const currentFeaturedPost = currentFilteredPosts[0];
    const currentOtherPosts = currentFilteredPosts.slice(1);

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
                        {/* Header Area */}
                        <div className="px-4 py-6 flex items-center justify-between sticky top-0 z-30 bg-(--color-bg-app)/80 backdrop-blur-xl border-b border-(--color-border-glass)">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => { selection(); setActiveTab?.('home'); }}
                                    className="p-2 rounded-full bg-(--color-bg-surface) border border-(--color-border-glass) active:scale-95 transition-transform"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight">{t('blog.title')}</h2>
                                    <p className="text-[10px] font-bold text-(--color-text-secondary) uppercase tracking-widest opacity-60">
                                        {blogPosts.length} {t('blog.latest')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Search and Filters */}
                        <div className="px-4 py-6 space-y-6">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-secondary) group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder={isRussian ? "Поиск идей..." : "Search insights..."}
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
                        <div className="px-4 space-y-8">
                            {/* Featured Post */}
                            {currentFeaturedPost && selectedCategory === 'All' && searchQuery === '' && (
                                <motion.div
                                    key="featured"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => handlePostClick(currentFeaturedPost)}
                                    className="relative group overflow-hidden rounded-[3rem] border border-(--color-border-glass) glass-panel-premium aspect-4/5 flex flex-col justify-end p-8"
                                >
                                    <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent z-10" />

                                    {/* Decorative Background Glow */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] group-hover:bg-blue-600/30 transition-colors" />

                                    <div className="relative z-20 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 rounded-full bg-blue-500 text-[10px] font-black uppercase tracking-widest text-white">
                                                {isRussian ? "Главное" : "Featured"}
                                            </span>
                                            <span className="text-[10px] font-bold text-white/60">
                                                {currentFeaturedPost.date}
                                            </span>
                                        </div>
                                        <h3 className="text-3xl font-black leading-tight text-white group-hover:text-blue-400 transition-colors">
                                            {currentFeaturedPost.title}
                                        </h3>
                                        <p className="text-sm font-medium text-white/70 line-clamp-2">
                                            {currentFeaturedPost.excerpt}
                                        </p>
                                        <div className="pt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                                                    <BookOpen className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="text-xs font-bold text-white/80">{currentFeaturedPost.author}</span>
                                            </div>
                                            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-blue-500 group-hover:scale-110 transition-all duration-500">
                                                <ArrowUpRight className="w-6 h-6 text-white" />
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
                                        className="group p-5 rounded-[2rem] bg-(--color-bg-surface) border border-(--color-border-glass) hover:border-blue-500/30 transition-all active:scale-[0.98] flex gap-4"
                                    >
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
                                            <h4 className="text-base font-extrabold leading-tight group-hover:text-blue-500 transition-colors line-clamp-2">
                                                {post.title}
                                            </h4>
                                            <p className="text-xs font-medium text-(--color-text-secondary) line-clamp-2 leading-relaxed">
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
                                        <h3 className="text-xl font-black">{isRussian ? "Ничего не найдено" : "No insights found"}</h3>
                                        <p className="text-sm text-(--color-text-secondary) max-w-[200px] mx-auto">
                                            {isRussian ? "Попробуйте изменить поиск или фильтры." : "Try adjusting your search or filters to find what you're looking for."}
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
                        isRussian={isRussian}
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
    isRussian: boolean;
    setActiveTab?: (tab: string) => void;
}

const BlogDetail = ({ post, engagement, isLoading, onBack, onLike, onShare, onNext, onPrev, isRussian, setActiveTab }: BlogDetailProps) => {
    const { t } = useTranslation();
    const { selection } = useHaptic();

    // Marketing "Between the lines" snippets
    const MarketingBox = ({ type }: { type: 'card' | 'pro' }) => {
        const isCard = type === 'card';
        return (
            <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                    selection();
                    setActiveTab?.(isCard ? 'cards' : 'partner');
                }}
                className={`my-8 p-6 rounded-[2rem] border overflow-hidden relative cursor-pointer group ${isCard
                    ? 'bg-linear-to-br from-blue-600 to-indigo-900 border-blue-400/30'
                    : 'bg-linear-to-br from-amber-500 to-orange-800 border-amber-400/30'
                    }`}
            >
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 blur-[50px] group-hover:bg-white/20 transition-all" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                        {isCard ? <Globe className="w-6 h-6 text-white" /> : <Zap className="w-6 h-6 text-white" />}
                    </div>
                    <div className="flex-1">
                        <h5 className="text-white font-black text-lg">
                            {isCard
                                ? (isRussian ? "Оформите карту Pintopay 💳" : "Get your Pintopay Card 💳")
                                : (isRussian ? "Апгрейд до PRO Статуса 🚀" : "Upgrade to PRO Status 🚀")
                            }
                        </h5>
                        <p className="text-white/70 text-xs font-bold">
                            {isCard
                                ? (isRussian ? "Тратьте крипту везде в 180+ странах." : "Spend your crypto everywhere in 180+ countries.")
                                : (isRussian ? "Разблокируйте виральные инструменты маркетинга." : "Unlock viral marketing automation tools.")
                            }
                        </p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
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
            className="flex flex-col min-h-screen bg-(--color-bg-app)"
        >
            {/* Header Sticky */}
            <div className="px-4 py-4 flex items-center justify-between sticky top-0 z-40 bg-(--color-bg-app)/90 backdrop-blur-xl border-b border-(--color-border-glass)">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-(--color-bg-surface) transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                    <button onClick={onShare} className="p-2 rounded-full hover:bg-(--color-bg-surface) transition-colors">
                        <Share2 className="w-5 h-5 text-(--color-text-secondary)" />
                    </button>
                    <button onClick={onLike} className={`p-2 rounded-full transition-all ${engagement.liked ? 'text-red-500 bg-red-500/10' : 'text-(--color-text-secondary)'}`}>
                        <Heart className={`w-5 h-5 ${engagement.liked ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Content Container */}
            <div className="px-5 pt-8 pb-32 space-y-8 max-w-2xl mx-auto">
                {/* Meta */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                            {post.category}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-(--color-text-secondary) opacity-60">
                            <Clock className="w-3 h-3" />
                            {post.date}
                        </div>
                    </div>
                    <h1 className="text-4xl font-black leading-tight tracking-tight text-(--color-text-primary)">
                        {post.title}
                    </h1>
                    <div className="flex items-center gap-3 py-2 border-y border-(--color-border-glass)">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-slate-200 to-slate-400 dark:from-slate-700 dark:to-slate-900 flex items-center justify-center font-black text-sm text-(--color-bg-app)">
                            {post.author[0]}
                        </div>
                        <div>
                            <p className="text-xs font-black">{post.author}</p>
                            <p className="text-[10px] font-bold text-(--color-text-secondary) opacity-60">Pintopay Intelligence Hub</p>
                        </div>
                    </div>
                </div>

                {/* Body Text (Simulated content structure) */}
                <div className="space-y-6 text-readable text-lg leading-relaxed text-(--color-text-primary)/90 font-medium whitespace-pre-wrap">
                    <p className="first-letter:text-5xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-blue-500">
                        {post.excerpt}
                    </p>

                    <p>
                        {isRussian
                            ? "В мире, где границы становятся все более осязаемыми, цифровая свобода — это не просто роскошь, а необходимость. Традиционные финансовые системы застряли в прошлом веке, предлагая медленные расчеты и бесконечную бюрократию."
                            : "In a world where borders are becoming more tangible, digital freedom is no longer a luxury, but a necessity. Traditional financial systems are stuck in the last century, offering slow settlements and endless bureaucracy."
                        }
                    </p>

                    <MarketingBox type="card" />

                    <p>
                        {isRussian
                            ? "Мы верим в будущее без посредников. Наша миссия — предоставить каждому партнеру инструменты для достижения истинного суверенитета. С Pintopay вы не просто пользователь, вы — часть глобальной децентрализованной инфраструктуры."
                            : "We believe in a future without intermediaries. Our mission is to provide every partner with the tools to achieve true sovereignty. With Pintopay, you are not just a user, you are part of a global decentralized infrastructure."
                        }
                    </p>

                    <MarketingBox type="pro" />

                    <p>
                        {isRussian
                            ? "Эволюция неизбежна. Те, кто адаптируется сегодня, будут лидировать завтра. Начните строить свою империю уже сейчас, используя лучшие финтех-решения на рынке."
                            : "Evolution is inevitable. Those who adapt today will lead tomorrow. Start building your empire now, using the best fintech solutions on the market."
                        }
                    </p>
                </div>

                {/* Engagement Footer */}
                <div className="pt-12 border-t border-(--color-border-glass) flex flex-col items-center gap-6">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onLike}
                        className={`group px-8 py-4 rounded-full flex items-center gap-3 transition-all ${engagement.liked
                            ? 'liquid-red-premium scale-110 shadow-red-500/40'
                            : 'bg-(--color-bg-surface) border border-(--color-border-glass) hover:border-red-500/30 text-(--color-text-secondary)'
                            }`}
                    >
                        <Heart className={`w-6 h-6 ${engagement.liked ? 'fill-current' : 'group-hover:text-red-500 transition-colors'}`} />
                        <span className="font-black text-lg">
                            {isLoading ? '...' : engagement.likes}
                        </span>
                    </motion.button>
                    <p className="text-[10px] font-bold text-(--color-text-secondary) uppercase tracking-widest opacity-40">
                        {isRussian ? "Нажмите, чтобы поддержать статью" : "Tap to support this insight"}
                    </p>
                </div>

                {/* Navigation Buttons */}
                <div className="pt-12 grid grid-cols-2 gap-4">
                    <button
                        onClick={() => { selection(); onPrev(); }}
                        className="p-6 rounded-[2rem] bg-(--color-bg-surface) border border-(--color-border-glass) hover:border-blue-500/30 transition-all flex flex-col gap-2 group text-left"
                    >
                        <ChevronLeft className="w-5 h-5 text-blue-500" />
                        <span className="text-[10px] font-bold text-(--color-text-secondary) uppercase tracking-wider">{isRussian ? "Предыдущая" : "Previous"}</span>
                    </button>
                    <button
                        onClick={() => { selection(); onNext(); }}
                        className="p-6 rounded-[2rem] bg-(--color-bg-surface) border border-(--color-border-glass) hover:border-blue-500/30 transition-all flex flex-col items-end gap-2 group text-right"
                    >
                        <ChevronRight className="w-5 h-5 text-blue-500" />
                        <span className="text-[10px] font-bold text-(--color-text-secondary) uppercase tracking-wider">{isRussian ? "Следующая" : "Next"}</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
