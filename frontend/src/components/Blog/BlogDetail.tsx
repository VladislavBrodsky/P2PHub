import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    ChevronRight, ArrowLeft, Share2, Heart,
    ArrowUpRight, ChevronLeft, Zap, Clock
} from 'lucide-react';
import { useHaptic } from '../../hooks/useHaptic';
import { BlogPost } from '../../data/blogPosts';
import { BlogEngagement } from '../../services/blogService';
import { authorAvatars } from '../../data/authorAvatars';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MarketingBox } from './MarketingBox';
import { renderExcerpt } from '../../utils/blogUtils';

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

export const BlogDetail = ({
    post, allPosts, engagement, isLoading, onBack, onLike, onShare,
    onNext, onPrev, setActiveTab, onPostClick
}: BlogDetailProps) => {
    const { t } = useTranslation('marketing');
    const { selection } = useHaptic();
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const main = document.querySelector('main') || document.documentElement;
        const handleScroll = () => {
            const scrolled = main === document.documentElement ? window.scrollY : main.scrollTop;
            const height = (main === document.documentElement ? document.documentElement.scrollHeight - window.innerHeight : main.scrollHeight - main.clientHeight) || 1;
            const progress = Math.min(100, Math.max(0, (scrolled / height) * 100));
            setScrollProgress(progress);
        };

        if (main === document.documentElement) {
            window.addEventListener('scroll', handleScroll, { passive: true });
        } else {
            main.addEventListener('scroll', handleScroll, { passive: true });
        }

        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            main.removeEventListener('scroll', handleScroll);
        };
    }, []);

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
            className="flex flex-col min-h-screen bg-bg-app relative"
        >
            <div className="fixed top-0 left-0 w-full h-1.5 z-1001 bg-slate-100/10 dark:bg-white/5 pointer-events-none">
                <motion.div
                    className="h-full bg-linear-to-r from-blue-500 to-indigo-600 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${scrollProgress}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            </div>

            <div className="sticky top-0 w-full pt-[22px] pb-1.5 px-4 bg-white/50 dark:bg-slate-950/50 backdrop-blur-2xl transition-all z-50 border-b border-slate-200/50 dark:border-white/5">
                <div className="flex items-center justify-between w-full max-w-lg lg:max-w-3xl xl:max-w-4xl mx-auto">
                    <button
                        onClick={onBack}
                        className="p-2 sm:px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-premium active:scale-95 transition-all text-slate-900 dark:text-white flex items-center gap-2 group shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        <span className="hidden sm:block text-[10px] font-bold tracking-[0.2em]">{t('blog.navigation.back_to_blog')}</span>
                    </button>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex flex-col items-end sm:items-center mr-1 sm:mr-2 min-w-0">
                            <div className="text-[9px] font-bold tracking-wider text-slate-400 leading-none mb-0.5 whitespace-nowrap truncate">{t('blog.navigation.reading_progress')}</div>
                            <div className="text-[10px] font-bold text-blue-500 leading-none">{Math.round(scrollProgress)}%</div>
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

            <div className="px-5 pt-8 pb-32 space-y-8 max-w-lg lg:max-w-3xl xl:max-w-4xl mx-auto relative z-10">
                <div className="space-y-6">
                    {post.image && (
                        <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-3xl group">
                            <img
                                src={post.image}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                alt={post.title}
                                loading="eager"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/80 to-transparent" />
                            <div className="absolute bottom-6 left-6 flex items-center gap-2">
                                <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                                    <p className="text-label font-bold text-white tracking-widest">{t('blog.navigation.intel_archive')}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-4">
                        <span className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-label font-bold tracking-widest shadow-lg shadow-blue-600/20">
                            {t(getCategoryKey(post.category))}
                        </span>
                        <div className="flex items-center gap-2 text-label font-bold text-slate-500 dark:text-slate-400 opacity-60">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span>5 {t('blog.navigation.min_analysis')}</span>
                        </div>
                    </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
                    {post.title}
                </h1>

                <div className="flex items-center gap-3 py-4 border-y border-slate-200 dark:border-white/5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)] p-px flex items-center justify-center relative group">
                        <div className="w-full h-full rounded-[calc(1rem-1px)] bg-bg-app flex items-center justify-center font-bold text-base text-blue-500 relative z-10 border border-white/5 overflow-hidden">
                            {post.authorImage ? (
                                <img src={post.authorImage} className="w-full h-full object-cover" alt={post.author} />
                            ) : (
                                post.author?.[0] || 'P'
                            )}
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{post.author || 'Marcus Vance'}</p>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest">{t('blog.navigation.senior_analyst')}</p>
                    </div>
                    <div className="ml-auto">
                        <div className="flex -space-x-3">
                            {['marcus_vance', 'alex_rivera', 'sarah_chen'].map((key, i) => (
                                <div key={key} style={{ zIndex: 10 - i }} className="w-9 h-9 rounded-full border-2 border-slate-50 dark:border-slate-950 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-lg relative overflow-hidden group/avatar">
                                    <img src={authorAvatars[key as keyof typeof authorAvatars]} className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110" alt="" onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg class="w-4 h-4 text-slate-400 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                                    }} />
                                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/5 rounded-full" />
                                </div>
                            ))}
                            <div className="w-9 h-9 rounded-full border-2 border-slate-50 dark:border-slate-950 bg-linear-to-br from-slate-800 to-black text-white flex items-center justify-center text-[9px] font-bold backdrop-blur-md shadow-lg z-10 relative">
                                +12K
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 relative">
                    <div className="absolute top-0 left-0 w-px h-full bg-linear-to-b from-blue-500/20 via-transparent to-transparent -translate-x-6 hidden sm:block" />

                    {isLoading ? (
                        <div className="space-y-6">
                            <div className="h-4 w-full rounded-full bg-slate-200 dark:bg-white/5 animate-pulse" />
                            <div className="h-4 w-[90%] rounded-full bg-slate-200 dark:bg-white/5 animate-pulse" />
                            <div className="h-4 w-[95%] rounded-full bg-slate-200 dark:bg-white/5 animate-pulse" />
                            <div className="py-8">
                                <div className="h-64 w-full rounded-[3rem] bg-slate-200 dark:bg-white/5 shadow-inner animate-pulse" />
                            </div>
                            <div className="h-4 w-[85%] rounded-full bg-slate-200 dark:bg-white/5 animate-pulse" />
                            <div className="h-4 w-[92%] rounded-full bg-slate-200 dark:bg-white/5 animate-pulse" />
                        </div>
                    ) : post.content ? (
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                            <MarkdownRenderer content={post.content} />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <p
                                className="text-lg font-medium leading-[1.8] text-slate-600 dark:text-slate-300 first-letter:text-6xl first-letter:font-bold first-letter:mr-4 first-letter:float-left first-letter:text-blue-600 first-letter:leading-none first-letter:mt-2"
                                dangerouslySetInnerHTML={{ __html: renderExcerpt(post.excerpt) }}
                            />
                            <MarketingBox type="card" t={t} selection={selection} setActiveTab={setActiveTab} />
                            <MarketingBox type="pro" t={t} selection={selection} setActiveTab={setActiveTab} />
                        </div>
                    )}
                </div>

                {/* Interaction Footer */}
                <div className="pt-12 border-t border-slate-200 dark:border-white/5 flex flex-col items-center gap-6 pb-16">
                    <div className="flex items-center gap-4">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={onLike}
                            className={`group h-10 px-5 rounded-xl flex items-center gap-2.5 transition-all duration-500 ${engagement.liked
                                ? 'bg-red-500 text-white scale-105 shadow-2xl shadow-red-500/40'
                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-red-500/30 text-slate-900 dark:text-white hover:shadow-xl'
                                }`}
                        >
                            <Heart className={`w-4 h-4 transition-transform duration-500 ${engagement.liked ? 'fill-current scale-110' : 'group-hover:text-red-500 group-hover:scale-110'}`} />
                            <div className="flex flex-col items-start leading-none mt-0.5">
                                <span className="text-[8px] font-bold tracking-widest opacity-60 mb-0.5">{t('blog.navigation.impact')}</span>
                                <span className="font-bold text-base italic!">
                                    {isLoading ? '...' : engagement.likes.toLocaleString()}
                                </span>
                            </div>
                        </motion.button>

                        <button
                            onClick={onShare}
                            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 active:scale-95 transition-all shadow-sm hover:shadow-xl group"
                        >
                            <Share2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        </button>
                    </div>

                    <p className="text-label font-bold text-slate-400 tracking-[0.2em] animate-pulse">
                        {t('blog.navigation.feedback_loop')}
                    </p>
                </div>

                {/* Related Intelligence */}
                <div className="pt-8 space-y-6">
                    <div className="flex items-center gap-4">
                        <h4 className="text-xs font-bold tracking-[0.3em] text-blue-500 shrink-0">{t('blog.navigation.next_reports')}</h4>
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
                                    className="flex items-center gap-4 p-4.5 rounded-2xl bg-white dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-white/5 active:scale-[0.98] transition-all text-left group hover:shadow-2xl hover:shadow-blue-500/5 hover:border-blue-500/30"
                                >
                                    {relatedPost.image && (
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 relative">
                                            <img src={relatedPost.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                            <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0 py-1">
                                        <p className="text-label font-bold tracking-widest text-blue-500 mb-1.5 flex items-center gap-1.5">
                                            <div className="w-1 h-1 rounded-full bg-blue-500" />
                                            {t(getCategoryKey(relatedPost.category))}
                                        </p>
                                        <h5 className="text-body font-bold leading-tight line-clamp-2 text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
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
                        className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-blue-500/30 active:scale-95 transition-all flex items-center gap-4 group text-left shadow-sm hover:shadow-xl dark:shadow-blue-500/5"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shrink-0">
                            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-label font-bold text-slate-400 tracking-wider mb-1 truncate">{t('blog.navigation.previous_label')}</span>
                            <span className="text-xs font-bold truncate text-slate-900 dark:text-white">{t('blog.navigation.back_in_flow')}</span>
                        </div>
                    </button>
                    <button
                        onClick={() => { selection(); onNext(); }}
                        className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-blue-500/30 active:scale-95 transition-all flex items-center justify-end gap-4 group text-right shadow-sm hover:shadow-xl dark:shadow-blue-500/5"
                    >
                        <div className="flex flex-col min-w-0 items-end">
                            <span className="text-label font-bold text-slate-400 tracking-wider mb-1 truncate">{t('blog.navigation.next_intel')}</span>
                            <span className="text-xs font-bold truncate text-slate-900 dark:text-white">{t('blog.navigation.forward_label')}</span>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shrink-0">
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </button>
                </div>
            </div>

            <motion.div
                className="fixed bottom-safe-bottom right-6 z-50 p-4 rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-600/40 pointer-events-none origin-bottom"
                style={{ scale: scrollProgress / 100, opacity: scrollProgress > 10 ? 1 : 0 }}
            >
                <ArrowUpRight className="w-6 h-6 -rotate-90" />
            </motion.div>
        </motion.div>
    );
};
