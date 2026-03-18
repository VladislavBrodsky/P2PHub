import React from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Bot } from 'lucide-react';

interface SocialProofStatsProps {
    t: any;
}

export const SocialProofStats = ({ t }: SocialProofStatsProps) => {
    const stats = [
        { value: '5K+', label: t('pro:subscription.stats.partners'), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { value: 'ELITE', label: t('pro:subscription.stats.growth'), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { value: 'LIVE', label: t('pro:subscription.stats.ai_active'), icon: Bot, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-12 px-1">
            <div className="grid grid-cols-3 gap-3">
                {stats.map((stat) => (
                    <div key={stat.label} className="p-3 rounded-xl bg-white/50 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 backdrop-blur-xl flex flex-col items-center text-center gap-1.5 group transition-all duration-300 hover:scale-[1.05] shadow-xl">
                        <div className={`w-8 h-8 rounded-xl shrink-0 ${stat.bg} flex items-center justify-center ${stat.color} group-hover:rotate-12 transition-transform`}>
                            <stat.icon size={14} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                            <div className={`text-[clamp(0.75rem,3vw,0.875rem)] font-black tabular-nums tracking-tighter ${stat.color} leading-none`}>{stat.value}</div>
                            <div className="text-[clamp(0.45rem,1.8vw,0.55rem)] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest leading-tight">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
