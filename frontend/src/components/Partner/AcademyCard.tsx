import { motion } from 'framer-motion';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils'; // Assuming you have a utils file for clsx/tailwind-merge

interface AcademyCardProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    image?: string;
    className?: string;
    onClick?: () => void;
    href?: string;
    delay?: number;
    badge?: string;
    cta?: string;
}

export const AcademyCard = ({
    title,
    description,
    icon: Icon,
    image,
    className,
    onClick,
    href,
    delay = 0,
    badge,
    cta = "Learn More"
}: AcademyCardProps) => {
    const Component = href ? 'a' : 'div';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className={cn(
                "group relative overflow-hidden rounded-[2rem] border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl shadow-sm dark:shadow-premium cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:scale-[1.01] active:scale-[0.99]",
                className
            )}
            onClick={onClick}
            {...(href ? { href, target: "_blank", rel: "noopener noreferrer" } : {})}
        >
            {/* Background Image / Gradient */}
            {image && (
                <div className="absolute inset-0">
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500 scale-105 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/50 to-transparent" />
                </div>
            )}

            {/* Hover Glow */}
            <div className="absolute -inset-1 bg-linear-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />

            <div className="relative z-10 h-full p-6 flex flex-col justify-between">
                <div className="space-y-4">
                    <div className="flex items-start justify-between">
                        {Icon && (
                            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20 group-hover:border-blue-500/20 dark:group-hover:border-blue-500/30 transition-colors">
                                <Icon className="w-6 h-6 text-slate-700 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                            </div>
                        )}
                        {badge && (
                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                {badge}
                            </span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-200 transition-colors">
                            {title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="pt-6 flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors">
                    {cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </motion.div>
    );
};
