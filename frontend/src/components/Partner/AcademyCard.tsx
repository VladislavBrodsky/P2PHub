import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getApiUrl } from '../../utils/api';

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
    // 3D Tilt Effect
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const imageUrl = image ? (image.startsWith('http') ? image : `${getApiUrl()}/images/${image}`) : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "group relative overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 backdrop-blur-2xl shadow-premium cursor-pointer transition-colors hover:bg-white/80 dark:hover:bg-slate-800/80",
                className
            )}
            onClick={onClick}
            {...(href ? { as: 'a', href, target: "_blank", rel: "noopener noreferrer" } : {})}
        >
            {/* Background Image / Gradient */}
            {imageUrl && (
                <div className="absolute inset-0 z-0">
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover opacity-10 dark:opacity-20 group-hover:opacity-20 dark:group-hover:opacity-40 transition-opacity duration-700 scale-105 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-white dark:from-slate-950 via-white/50 dark:via-slate-950/50 to-transparent" />
                </div>
            )}

            {/* Premium Shimmer and Glow */}
            <div className="absolute -inset-1 bg-linear-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-700 pointer-events-none" />
            <div className="absolute inset-0 shimmer-platinum opacity-0 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none" />

            <div
                className="relative z-10 h-full p-6 flex flex-col justify-between"
                {/* #comment: Reduced card padding from p-8 to p-6 for a more compact design */}
                style={{ transform: "translateZ(50px)" }}
            >
                <div className="space-y-4">
                    {/* #comment: Reduced vertical spacing from space-y-5 to space-y-4 */}
                    <div className="flex items-start justify-between">
                        {Icon && (
                            <div className="p-3.5 rounded-[1.125rem] bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 backdrop-blur-xl group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20 group-hover:border-blue-500/20 dark:group-hover:border-blue-500/30 transition-all duration-300 shadow-sm">
                                {/* #comment: Reduced icon container padding from p-4 to p-3.5 and radius slightly */}
                                <Icon className="w-6 h-6 text-slate-700 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                {/* #comment: Reduced icon size from w-7 to w-6 */}
                            </div>
                        )}
                        {badge && (
                            <span className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 shadow-sm">
                                {/* #comment: Reduced badge padding and font size from 10px to 9px */}
                                {badge}
                            </span>
                        )}
                    </div>

                    <div className="space-y-2.5">
                        {/* #comment: Reduced spacing from space-y-3 to space-y-2.5 */}
                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-200 transition-colors">
                            {/* #comment: Reduced title font size from text-2xl to text-xl */}
                            {title}
                        </h3>
                        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                            {/* #comment: Reduced description font size from 13px to 12px */}
                            {description}
                        </p>
                    </div>
                </div>

                <div className="pt-6 flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-all">
                    {/* #comment: Reduced footer top padding from pt-8 to pt-6, gap from 3 to 2.5, and text size from xs to [10px] */}
                    <span>{cta}</span>
                    <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/10 group-hover:translate-x-1 group-hover:bg-blue-500/20 transition-all">
                        {/* #comment: Reduced CTA arrow container from w-8 to w-7 */}
                        <ArrowRight className="w-3.5 h-3.5" />
                        {/* #comment: Reduced CTA arrow size from w-4 to w-3.5 */}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
