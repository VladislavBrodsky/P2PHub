import { motion } from 'framer-motion';
import { ChevronRight, ArrowUpRight } from 'lucide-react';
import { getLatestPosts } from '../../data/blogPosts';
import { useTranslation } from 'react-i18next';
import { useHaptic } from '../../hooks/useHaptic';

export const BlogCarousel = () => {
    const { t } = useTranslation();
    const { selection } = useHaptic();
    const latestPosts = getLatestPosts(3);

    const navigateToBlog = (postId?: string) => {
        selection();
        window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'blog' }));
        if (postId) {
            // Give a small delay for the tab to switch
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('nav-blog-post', { detail: postId }));
            }, 100);
        }
    };

    return (
        <section className="py-8 space-y-6">
            <div className="flex items-center justify-between px-4">
                <div className="space-y-1">
                    <h3 className="text-2xl font-black tracking-tight text-(--color-text-primary)">
                        {t('blog.latest')}
                    </h3>
                    <p className="text-[10px] text-(--color-text-secondary) font-black uppercase tracking-[0.2em] opacity-60">
                        {t('blog.title')}
                    </p>
                </div>
                <button
                    onClick={() => navigateToBlog()}
                    className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-blue-500 bg-blue-500/5 px-4 py-2 rounded-full border border-blue-500/20 active:scale-95 transition-transform"
                >
                    {t('blog.view_all')} <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
            </div>

            <div className="flex gap-4 overflow-x-auto px-4 pb-6 no-scrollbar snap-x snap-mandatory">
                {latestPosts.map((post, index) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1, type: "spring", bounce: 0.2 }}
                        onClick={() => navigateToBlog(post.id)}
                        className="min-w-[280px] max-w-[280px] group flex flex-col gap-4 p-6 rounded-[2.5rem] border border-(--color-border-glass) glass-panel-premium snap-start active:scale-95 transition-all cursor-pointer"
                    >
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/10">
                                    {t(`blog.posts.${post.id}.category`)}
                                </span>
                                <span className="text-[9px] font-bold text-(--color-text-secondary) opacity-60">
                                    {post.date}
                                </span>
                            </div>

                            <h4 className="text-xl font-black leading-tight text-(--color-text-primary) group-hover:text-blue-500 transition-colors line-clamp-2">
                                {t(`blog.posts.${post.id}.title`)}
                            </h4>

                            <p className="text-xs font-semibold leading-relaxed text-(--color-text-secondary) line-clamp-3 opacity-80">
                                {t(`blog.posts.${post.id}.excerpt`)}
                            </p>
                        </div>

                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-(--color-border-glass)">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] font-black text-blue-500 border border-blue-500/10 shadow-inner">
                                    {post.author.charAt(0)}
                                </div>
                                <span className="text-[10px] font-black text-(--color-text-secondary) opacity-80 uppercase tracking-wider">
                                    {post.author}
                                </span>
                            </div>
                            <div className="p-2 rounded-full bg-(--color-bg-app) group-hover:bg-blue-500 group-hover:text-white transition-all duration-500 shadow-sm border border-(--color-border-glass) group-active:scale-90">
                                <ArrowUpRight className="w-4 h-4" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};
