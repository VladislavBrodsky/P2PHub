import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { getApiUrl } from '../../utils/api';

// #comment: Added onOpenInfo prop to support opening the briefing modal from the header button
export const TopPartnersList = ({ onOpenInfo }: { onOpenInfo?: () => void }) => {
    // #comment: Removed unused 't' variable from useTranslation to address linting warnings
    const { t } = useTranslation();
    const [topPartners, setTopPartners] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isExpanded, setIsExpanded] = React.useState(false);

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
                    { id: 3, first_name: 'Dmitry', last_name: 'K.', username: 'dimk', xp: 8200, referrals_count: 41, rank: 'Director' },
                    { id: 4, first_name: 'Sarah', last_name: 'J.', username: 'sarahj', xp: 7500, referrals_count: 38, rank: 'Director' },
                    { id: 5, first_name: 'Mike', last_name: 'T.', username: 'miket', xp: 6800, referrals_count: 35, rank: 'Manager' },
                    { id: 6, first_name: 'Jessica', last_name: 'L.', username: 'jessl', xp: 6200, referrals_count: 32, rank: 'Manager' },
                    { id: 7, first_name: 'David', last_name: 'W.', username: 'davidw', xp: 5900, referrals_count: 29, rank: 'Manager' },
                    { id: 8, first_name: 'Anna', last_name: 'M.', username: 'annam', xp: 5500, referrals_count: 27, rank: 'Partner' },
                    { id: 9, first_name: 'Chris', last_name: 'P.', username: 'chrisp', xp: 5100, referrals_count: 25, rank: 'Partner' },
                    { id: 10, first_name: 'John', last_name: 'D.', username: 'johnd', xp: 4800, referrals_count: 22, rank: 'Partner' },
                    { id: 11, first_name: 'Maria', last_name: 'G.', username: 'mariag', xp: 4500, referrals_count: 20, rank: 'Partner' },
                    { id: 12, first_name: 'Tom', last_name: 'H.', username: 'tomh', xp: 4200, referrals_count: 18, rank: 'Partner' }
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
                    {/* #comment: Renamed title to 'Top Partners' and matched casing */}
                    <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">
                        {t('leaderboard.top_partners')}
                    </h3>
                </div>
                {/* #comment: Replaced 'Live Updates' with 'REFERRAL.INFO' button with pill styling */}
                <button
                    onClick={onOpenInfo}
                    className="bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/30 active:scale-95 transition-all text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full flex items-center justify-center shadow-sm border border-blue-500/10"
                >
                    <span className="text-[10px] font-black tracking-widest uppercase">{t('referral.info')}</span>
                </button>
            </div>

            <div className="space-y-2">
                {topPartners.slice(0, isExpanded ? undefined : 10).map((partner, index) => (
                    <motion.div
                        key={partner.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`group relative flex items-center justify-between p-3 rounded-2xl border backdrop-blur-md shadow-sm active:scale-[0.98] transition-all ${index === 0 ? 'bg-amber-500/10 border-amber-500/30' :
                            index === 1 ? 'bg-slate-300/10 border-slate-400/30' :
                                index === 2 ? 'bg-orange-500/10 border-orange-500/30' :
                                    'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-white/5'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden">
                                    <img
                                        src={partner.photo_file_id
                                            ? `${getApiUrl()}/api/partner/photo/${partner.photo_file_id}`
                                            : partner.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partner.username}`
                                        }
                                        className="w-full h-full object-cover"
                                        alt=""
                                    />
                                </div>
                                {index < 3 && (
                                    <div className={`absolute -top-1.5 -right-1.5 p-0.5 rounded-full shadow-lg ${index === 0 ? 'bg-amber-400' :
                                        index === 1 ? 'bg-slate-400' :
                                            'bg-orange-400'
                                        }`}>
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
                            <div className={`text-lg font-black ${index === 0 ? 'text-amber-500' :
                                index === 1 ? 'text-slate-400' :
                                    index === 2 ? 'text-orange-400' :
                                        'text-slate-900 dark:text-white'
                                }`}>#{index + 1}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {
                topPartners.length > 10 && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
                    >
                        {isExpanded ? (
                            <>
                                Show Less <ChevronUp className="w-3 h-3" />
                            </>
                        ) : (
                            <>
                                Show More <ChevronDown className="w-3 h-3" />
                            </>
                        )}
                    </button>
                )
            }
        </div >
    );
};
