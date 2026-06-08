import { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { ChevronRight, ArrowUpRight, Clock } from 'lucide-react';
import { blogService } from '../../services/blogService';
import { BlogPost } from '../../data/blogPosts';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../utils/routes';
import { useNavigation } from '../../hooks/useNavigation';
import { useHaptic } from '../../hooks/useHaptic';
import { SectionHeader } from '../ui/SectionHeader';

export const BlogCarousel = () => {
    const { t } = useTranslation(['marketing', 'common']);
    const { navigateTo } = useNavigation();
    const { selection } = useHaptic();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await blogService.getPosts({ limit: 3 });
                setPosts(data.items);
            } catch (e) {
                console.error('Carousel error', e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const navigateToBlog = (postId?: string) => {
        selection();
        navigateTo(ROUTES.BLOG);
        if (postId) {
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('nav-blog-post', { detail: postId }));
            }, 500);
        }
    };

    if (isLoading) return <div className="py-2 space-y-2 min-h-[466px] w-full" />;

    return (
        <section className="py-2 space-y-2 min-h-[450px]">
            <div className="flex items-center justify-between px-4">
                <SectionHeader
                    title={t('blog.latest')}
                    description={t('blog.title')}
                    align="left"
                    className="space-y-1!"
                />
                <button
                    onClick={() => navigateToBlog()}
                    className="flex items-center gap-1 text-label font-bold uppercase tracking-wider text-blue-500 bg-blue-500/5 px-4 py-2 rounded-full border border-blue-500/20 active:scale-95 transition-transform"
                >
                    {t('blog.view_all')} <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
            </div>

            <div className="flex lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-x-visible lg:px-0 lg:pb-0 gap-4 overflow-x-auto overflow-y-hidden px-4 pb-2 no-scrollbar snap-x snap-mandatory">
                {posts.map((post, index) => (
                    <m.div
                        key={post.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1, type: "spring", bounce: 0.2 }}
                        onClick={() => navigateToBlog(post.id)}
                        className="min-w-[300px] max-w-[300px] lg:min-w-0 lg:max-w-none group flex flex-col gap-4 p-7 rounded-3xl border border-slate-200 dark:border-white/10 glass-panel-premium snap-start active:scale-95 transition-all cursor-pointer relative overflow-hidden"
                    >
                        {(post.image) ? (
                            <>
                                <img
                                    src={post.image}
                                    className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-all duration-700 group-hover:scale-110"
                                    alt={post.title}
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-bg-app via-bg-app/80 dark:from-bg-deep dark:via-bg-deep/80 to-transparent z-10" />
                            </>
                        ) : (
                            <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-indigo-500/10 z-0" />
                        )}
                        <div className="relative z-20 flex flex-col h-full gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-label font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/10">
                                        {post.category}
                                    </span>
                                    <span className="flex items-center gap-1 text-label font-bold text-slate-500 dark:text-slate-400 opacity-60">
                                        <Clock className="w-3 h-3" />
                                        {post.published_at ? new Date(post.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : post.date}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-2 pt-1">
                                    <h4 className="text-lg font-bold leading-tight text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors line-clamp-2">
                                        {post.title}
                                    </h4>

                                    <p className="text-label font-medium leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2 opacity-70">
                                        {post.excerpt}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-200 dark:border-white/10">
                                <div className="flex items-center gap-2 group/author">
                                    <div className="w-6 h-6 rounded-lg bg-linear-to-br from-blue-500/20 to-indigo-500/20 p-px overflow-hidden group-hover/author:from-blue-500/40 transition-colors">
                                        <div className="w-full h-full rounded-[calc(0.5rem-1px)] bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                                            {post.authorImage ? (
                                                <img src={post.authorImage} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <span className="text-[9px] font-bold text-blue-500">{post.author.charAt(0)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-label font-bold text-slate-500 dark:text-slate-400 opacity-80 uppercase tracking-widest group-hover/author:text-blue-500 transition-colors">
                                        {post.author}
                                    </span>
                                </div>
                                <div className="p-2 rounded-full bg-slate-50 dark:bg-white/5 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500 shadow-sm border border-slate-200 dark:border-white/10 group-active:scale-90">
                                    <ArrowUpRight className="w-4 h-4 text-blue-500 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        </div>
                    </m.div>
                ))}
            </div>
        </section>
    );
};
