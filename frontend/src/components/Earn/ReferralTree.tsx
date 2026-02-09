import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';

interface ReferralTreeProps {
    stats: Record<string, number>;
}

export const ReferralTree = ({ stats }: ReferralTreeProps) => {
    const { t } = useTranslation();

    // Sort keys and convert to array for rendering
    const levels = Object.entries(stats)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([level, count]) => ({ level: parseInt(level), count }));

    const totalPartners = Object.values(stats).reduce((acc, curr) => acc + curr, 0);

    return (
        <div className="bg-(--color-bg-surface) border border-(--color-brand-border) rounded-3xl p-6 shadow-sm overflow-hidden relative">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-black text-white leading-none mb-1">{t('referral.tree.title')}</h3>
                    <p className="text-[10px] font-bold text-slate-400 italic">9-Level Network Matrix</p>
                </div>
                <div className="flex items-center gap-1.5 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-black text-blue-500">{totalPartners.toLocaleString()}</span>
                </div>
            </div>

            <motion.div
                className="grid grid-cols-3 gap-3"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={{
                    hidden: { opacity: 0 },
                    show: {
                        opacity: 1,
                        transition: {
                            staggerChildren: 0.05
                        }
                    }
                }}
            >
                {levels.map(({ level, count }) => (
                    <motion.div
                        key={level}
                        variants={{
                            hidden: { opacity: 0, scale: 0.8, y: 10 },
                            show: { opacity: 1, scale: 1, y: 0 }
                        }}
                        className="glass-panel border-0 bg-white/5 rounded-2xl p-3 flex flex-col items-center justify-center relative group hover:bg-white/10 transition-colors"
                    >
                        <span className="absolute top-2 left-2 text-[8px] font-black text-white/30 group-hover:text-blue-500 transition-colors">L{level}</span>
                        <span className="text-lg font-black text-white line-clamp-1">{count.toLocaleString()}</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Partners</span>
                    </motion.div>
                ))}
            </motion.div>

            <div className="mt-6 flex items-center justify-between">
                <p className="text-[9px] font-bold text-slate-500 max-w-[180px] leading-tight opacity-60 italic">
                    You earn XP from every active partner in your 9-level matrix.
                </p>
                <div className="h-1 w-12 bg-linear-to-r from-blue-500 to-transparent rounded-full" />
            </div>
        </div>
    );
};
