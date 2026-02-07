import { motion } from 'framer-motion';
import { ChevronRight, ArrowUpRight } from 'lucide-react';
import { getLatestPosts } from '../../data/blogPosts';

export const BlogCarousel = () => {
    const latestPosts = getLatestPosts(3);

    return (
        <section className="py-8 space-y-6">
            <div className="flex items-center justify-between px-4">
                <div className="space-y-1">
                    <h3 className="text-2xl font-black tracking-tight text-text-primary">
                        Latest Insights
                    </h3>
                    <p className="text-xs text-text-secondary font-semibold uppercase tracking-widest">
                        Intelligence Hub
                    </p>
                </div>
                <button className="flex items-center gap-1 text-sm font-bold text-blue-500 bg-blue-500/5 px-3 py-1.5 rounded-full border border-blue-500/20 active:scale-95 transition-transform">
                    View All <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar snap-x snap-mandatory">
                {latestPosts.map((post, index) => (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="min-w-[280px] max-w-[280px] group flex flex-col gap-4 p-5 rounded-[2.5rem] border border-border-glass glass-panel snap-start"
                    >
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/10">
                                    {post.category}
                                </span>
                                <span className="text-[10px] font-bold text-text-secondary opacity-60">
                                    {post.date}
                                </span>
                            </div>

                            <h4 className="text-lg font-extrabold leading-tight text-text-primary group-hover:text-blue-500 transition-colors line-clamp-2">
                                {post.title}
                            </h4>

                            <p className="text-xs font-medium leading-relaxed text-text-secondary line-clamp-3">
                                {post.excerpt}
                            </p>
                        </div>

                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-border-glass">
                            <span className="text-[10px] font-bold text-text-secondary">
                                By {post.author}
                            </span>
                            <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                <ArrowUpRight className="w-4 h-4" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};
