import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Users, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';

export const TopPartnersList = () => {
    const { t } = useTranslation();
    const [topPartners, setTopPartners] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchTop = async () => {
            try {
                // We'll implement this endpoint next
                const res = await apiClient.get('/api/partner/top');
                setTopPartners(res.data);
            } catch (e) {
                // Fallback / Mock for UI dev
                setTopPartners([
                    { id: 1, first_name: 'Alex', last_name: 'V.', username: 'alexv', xp: 12500, referrals_count: 84, rank: 'Global Partner' },
                    { id: 2, first_name: 'Elena', last_name: 'S.', username: 'elenas', xp: 9800, referrals_count: 52, rank: 'President' },
                    { id: 3, first_name: 'Dmitry', last_name: 'K.', username: 'dimk', xp: 8200, referrals_count: 41, rank: 'Director' }
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchTop();
    }, []);

    if (loading) return (
        <div className="space-y-3 px-1">
            <div className="h-20 w-full bg-slate-200 dark:bg-white/5 rounded-2xl animate-pulse" />
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Top Network Leaders
                    </h3>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Live Updates</span>
                </div>
            </div>

            <div className="space-y-2">
                {topPartners.map((partner, index) => (
                    <motion.div
                        key={partner.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative flex items-center justify-between p-3 rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 backdrop-blur-md shadow-sm active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden">
                                    <img
                                        src={partner.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.username}`}
                                        className="w-full h-full object-cover"
                                        alt=""
                                    />
                                </div>
                                {index === 0 && (
                                    <div className="absolute -top-1.5 -right-1.5 bg-amber-400 p-0.5 rounded-full shadow-lg">
                                        <Crown className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-black text-slate-900 dark:text-white">
                                        {partner.first_name} {partner.last_name}
                                    </span>
                                    <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-1.5 rounded-sm uppercase tracking-tighter">
                                        {partner.rank}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                            {partner.xp.toLocaleString()} XP
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="w-3 h-3 text-blue-400" />
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                            {partner.referrals_count} members
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RANK</div>
                            <div className="text-lg font-black text-slate-900 dark:text-white">#{index + 1}</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
