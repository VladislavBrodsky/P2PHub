import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ArrowLeft, Search, Filter, BookOpen, Clock, ArrowUpRight } from 'lucide-react';
import { blogPosts, BlogPost } from '../data/blogPosts';
import { useHaptic } from '../hooks/useHaptic';

interface BlogPageProps {
    setActiveTab?: (tab: string) => void;
}

export const BlogPage = ({ setActiveTab }: BlogPageProps) => {
    const { t } = useTranslation();
    const { selection } = useHaptic();
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');

    const categories = ['All', ...new Set(blogPosts.map(post => post.category))];

    const filteredPosts = blogPosts.filter(post => {
        const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const featuredPost = filteredPosts[0];
    const otherPosts = filteredPosts.slice(1);

    const handlePostClick = (post: BlogPost) => {
        selection();
        // In a full app, this would navigate to a post detail page
        // For now, we'll just open a link or show a placeholder
        window.open('https://t.me/pintopay_ann', '_blank');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col min-h-screen pb-32"
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
                        placeholder="Search insights..."
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
                <AnimatePresence mode="wait">
                    {featuredPost && selectedCategory === 'All' && searchQuery === '' && (
                        <motion.div
                            key="featured"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            onClick={() => handlePostClick(featuredPost)}
                            className="relative group overflow-hidden rounded-[3rem] border border-(--color-border-glass) glass-panel-premium aspect-4/5 flex flex-col justify-end p-8"
                        >
                            <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent z-10" />

                            {/* Decorative Background Glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] group-hover:bg-blue-600/30 transition-colors" />

                            <div className="relative z-20 space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 rounded-full bg-blue-500 text-[10px] font-black uppercase tracking-widest text-white">
                                        Featured
                                    </span>
                                    <span className="text-[10px] font-bold text-white/60">
                                        {featuredPost.date}
                                    </span>
                                </div>
                                <h3 className="text-3xl font-black leading-tight text-white group-hover:text-blue-400 transition-colors">
                                    {featuredPost.title}
                                </h3>
                                <p className="text-sm font-medium text-white/70 line-clamp-2">
                                    {featuredPost.excerpt}
                                </p>
                                <div className="pt-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                                            <BookOpen className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-xs font-bold text-white/80">{featuredPost.author}</span>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-blue-500 group-hover:scale-110 transition-all duration-500">
                                        <ArrowUpRight className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Grid */}
                <div className="grid gap-4">
                    <AnimatePresence>
                        {(selectedCategory === 'All' && searchQuery === '' ? otherPosts : filteredPosts).map((post, index) => (
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
                    </AnimatePresence>

                    {filteredPosts.length === 0 && (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
                                <Search className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-black">No insights found</h3>
                            <p className="text-sm text-(--color-text-secondary) max-w-[200px] mx-auto">
                                Try adjusting your search or filters to find what you're looking for.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
