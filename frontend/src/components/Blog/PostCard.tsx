import { memo } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronRight, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BlogPost {
    id: number | string;
    title: string;
    excerpt: string;
    image?: string;
    category: string;
    published_at?: string;
}

interface BlogEngagement {
    likes: number;
    liked: boolean;
}

const getCategoryKey = (cat: string) => {
    const key = cat.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_');
    return `blog.categories.${key}`;
};

export const PostCard = memo(({ post, index, onClick }: { post: BlogPost & BlogEngagement; index: number; onClick: () => void }) => {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.3) }}
            onClick={onClick}
            className="group p-4 sm:p-5 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-blue-500/30 transition-all active:scale-[0.98] flex gap-3 sm:gap-4 items-center cursor-pointer shadow-sm hover:shadow-md"
        >
            {(post.image) && (
                <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800">
                    <img
                        src={post.image}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        alt=""
                        loading="lazy"
                    />
                </div>
            )}
            <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/10 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] sm:max-w-none">
                        {t(getCategoryKey(post.category))}
                    </span>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 dark:text-slate-400 opacity-60">
                            <Clock className="w-3 h-3" />
                            <span className="whitespace-nowrap">
                                {post.published_at ? new Date(post.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                            </span>
                        </div>
                        {post.likes > 0 && (
                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 dark:text-slate-400 opacity-60">
                                <Heart className={`w-3 h-3 ${post.liked ? 'fill-red-500 text-red-500' : ''}`} />
                                {post.likes}
                            </div>
                        )}
                    </div>
                </div>
                <h4 className="text-sm sm:text-[15px] font-extrabold leading-tight group-hover:text-blue-500 transition-colors line-clamp-2">
                    {post.title}
                </h4>
                <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed opacity-80">
                    {post.excerpt}
                </p>
            </div>
            <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
        </motion.div>
    );
});

PostCard.displayName = 'PostCard';
