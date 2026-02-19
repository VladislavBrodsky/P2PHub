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

/** Converts inline markdown to HTML for excerpt display (bold, italic, backtick code). */
function renderExcerpt(text: string): string {
    if (!text) return '';
    return text
        .replace(/\*\*\s*(.*?)\s*\*\*/g, '<strong class="font-black text-slate-900 dark:text-white">$1</strong>')
        .replace(/__(.*?)__/g, '<strong class="font-black text-slate-900 dark:text-white">$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
}

export const PostCard = memo(({ post, index, onClick }: { post: BlogPost & BlogEngagement; index: number; onClick: () => void }) => {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(index * 0.05, 0.3) }}
            onClick={onClick}
            className="group relative p-4 sm:p-5 rounded-[2.25rem] bg-white dark:bg-slate-900/50 dark:backdrop-blur-xl border border-slate-200 dark:border-white/5 hover:border-blue-500/40 transition-all active:scale-[0.98] flex gap-3 sm:gap-4 items-center cursor-pointer shadow-xs hover:shadow-xl hover:shadow-blue-500/10"
        >
            <div className="absolute inset-0 rounded-[2.25rem] bg-linear-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 transition-all duration-500" />

            {(post.image) && (
                <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 shadow-inner">
                    <img
                        src={post.image}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        alt=""
                        loading="lazy"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/5 rounded-2xl" />
                </div>
            )}
            <div className="relative flex-1 min-w-0 space-y-1.5 sm:space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] sm:max-w-none">
                        {t(getCategoryKey(post.category))}
                    </span>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 dark:text-slate-400 opacity-60">
                            <Clock className="w-3 h-3 text-blue-500/70" />
                            <span className="whitespace-nowrap">
                                {post.published_at ? new Date(post.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                            </span>
                        </div>
                        {post.likes > 0 && (
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 dark:text-slate-400 opacity-60">
                                <Heart className={`w-3 h-3 ${post.liked ? 'fill-red-500 text-red-500' : ''}`} />
                                {post.likes}
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <h4 className="text-[14px] sm:text-[15px] font-black leading-snug group-hover:text-blue-500 transition-colors line-clamp-2 text-slate-900 dark:text-white">
                        {post.title}
                    </h4>
                    <p
                        className="mt-1 text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400/70 line-clamp-2 leading-relaxed uppercase tracking-tight opacity-80"
                        dangerouslySetInnerHTML={{ __html: renderExcerpt(post.excerpt) }}
                    />
                </div>
            </div>
            <div className="relative shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-500 shadow-xs group-hover:shadow-lg group-hover:shadow-blue-500/30">
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
            </div>
        </motion.div>
    );
});

PostCard.displayName = 'PostCard';
