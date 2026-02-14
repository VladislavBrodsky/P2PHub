import { motion } from 'framer-motion';
import { ChevronRight, ArrowUpRight } from 'lucide-react';
import { getLatestPosts } from '../../data/blogPosts';
import { useTranslation } from 'react-i18next';
import { useHaptic } from '../../hooks/useHaptic';
// #comment: Imported SectionHeader to maintain visual and semantic consistency in section titling.
import { SectionHeader } from '../ui/SectionHeader';

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
                {/* #comment: Phase 2 - Replaced manual h3 with SectionHeader (managed via title prop) for consistency. 
                    Added Tailwind v4 compliant exclamation for overrides. */}
                <SectionHeader
                    title={t('blog.latest')}
                    description={t('blog.title')}
                    align="left"
                    className="space-y-1!"
                />
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
                        className="min-w-[280px] max-w-[280px] group flex flex-col gap-4 p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/10 glass-panel-premium snap-start active:scale-95 transition-all cursor-pointer relative overflow-hidden"
                    >
                        {post.image && (
                            <>
                                <img
                                    src={post.image}
                                    className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-all duration-700 group-hover:scale-110"
                                    alt={post.title}
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-slate-50 via-slate-50/80 dark:from-slate-950 dark:via-slate-950/80 to-transparent z-10" />
                            </>
                        )}
                        <div className="relative z-20 flex flex-col h-full gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/10">
                                        {t(`blog.posts.${post.id}.category`)}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 opacity-60">
                                        {post.date}
                                    </span>
                                </div>

                                <h4 className="text-xl font-black leading-tight text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors line-clamp-2">
                                    {t(`blog.posts.${post.id}.title`)}
                                </h4>

                                <p className="text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-3 opacity-80">
                                    {t(`blog.posts.${post.id}.excerpt`)}
                                </p>
                            </div>

                            <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-200 dark:border-white/10">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] font-black text-blue-500 border border-blue-500/10 shadow-inner">
                                        {post.author.charAt(0)}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 opacity-80 uppercase tracking-wider">
                                        {post.author}
                                    </span>
                                </div>
                                <div className="p-2 rounded-full bg-slate-50 dark:bg-slate-950 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500 shadow-sm border border-slate-200 dark:border-white/10 group-active:scale-90">
                                    <ArrowUpRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};
