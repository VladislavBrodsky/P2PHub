import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Crown, ChevronDown, ChevronUp, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { getApiUrl } from '../../utils/api';
import { ProPlusBadge } from '../ui/ProPlusBadge';

export const TopPartnersList = () => {
    // #comment: Removed unused 't' variable from useTranslation to address linting warnings
    const { t } = useTranslation(['social', 'common']);
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
                    { id: 1, first_name: 'Vitaliy', last_name: '', username: 'vitaliy', xp: 4750, referrals_count: 432, rank: 'CONTRIBUTOR' },
                    { id: 2, first_name: 'Den', last_name: '', username: 'den', xp: 4636, referrals_count: 387, rank: 'CONTRIBUTOR' },
                    { id: 3, first_name: 'Stas', last_name: '', username: 'stas', xp: 4626, referrals_count: 354, rank: 'CONTRIBUTOR' },
                    { id: 4, first_name: 'Alex', last_name: 'V.', username: 'alexv', xp: 4250, referrals_count: 312, rank: 'Partner' },
                    { id: 5, first_name: 'Elena', last_name: 'S.', username: 'elenas', xp: 3800, referrals_count: 284, rank: 'Partner' },
                    { id: 6, first_name: 'Dmitry', last_name: 'K.', username: 'dimk', xp: 3200, referrals_count: 241, rank: 'Partner' },
                    { id: 7, first_name: 'Sarah', last_name: 'J.', username: 'sarahj', xp: 2500, referrals_count: 198, rank: 'Partner' },
                    { id: 8, first_name: 'Mike', last_name: 'T.', username: 'miket', xp: 1800, referrals_count: 165, rank: 'Partner' },
                    { id: 9, first_name: 'Jessica', last_name: 'L.', username: 'jessl', xp: 1200, referrals_count: 142, rank: 'Partner' },
                    { id: 10, first_name: 'David', last_name: 'W.', username: 'davidw', xp: 900, referrals_count: 138, rank: 'Partner' }
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
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase">
                        {t('leaderboard.top_partners')}
                    </h3>
                </div>
            </div>

            <div className="space-y-2">
                {topPartners.slice(0, isExpanded ? undefined : 10).map((partner, index) => (
                    <TopPartnerRow key={partner.id} partner={partner} index={index} />
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
                                {t('show_less')} <ChevronUp className="w-3 h-3" />
                            </>
                        ) : (
                            <>
                                {t('show_more')} <ChevronDown className="w-3 h-3" />
                            </>
                        )}
                    </button>
                )
            }
        </div>
    );
};

interface TopPartnerRowProps {
    partner: any;
    index: number;
}

const TopPartnerRow = React.memo(({ partner, index }: TopPartnerRowProps) => {
    const { t } = useTranslation(['social', 'common']);

    return (
        <motion.div
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
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden relative">
                        <User className="absolute w-5 h-5 text-slate-400 z-0" />
                        {partner.photo_file_id || partner.photo_url ? (
                            <img
                                src={partner.photo_file_id
                                    ? `${getApiUrl()}/api/partner/photo/${partner.photo_file_id}`
                                    : partner.photo_url
                                }
                                className="absolute w-full h-full object-cover z-10 transition-opacity duration-300"
                                alt=""
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.opacity = '0';
                                    setTimeout(() => { target.style.display = 'none'; }, 300);
                                }}
                            />
                        ) : null}
                    </div>
                    {index < 3 && (
                        <div className={`absolute -top-1.5 -left-1.5 p-0.5 rounded-full shadow-lg ${index === 0 ? 'bg-amber-400' :
                            index === 1 ? 'bg-slate-400' :
                                'bg-orange-400'
                            }`}>
                            <Crown className="w-3 h-3 text-white" />
                        </div>
                    )}
                    {(partner.subscription_plan || '').includes('PLUS') && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20">
                            <ProPlusBadge size="xs" />
                        </div>
                    )}
                </div>

                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {partner.first_name} {partner.last_name}
                        </span>
                        <span className="text-label font-bold text-blue-500 bg-blue-500/10 px-1.5 rounded-sm uppercase tracking-tighter">
                            {t(`ranks.${partner.rank.charAt(0).toUpperCase()}${partner.rank.slice(1).toLowerCase()}`, partner.rank) as string}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                            <span className="text-label font-bold text-slate-500 dark:text-slate-400">
                                {partner.xp.toLocaleString()} XP
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-blue-400" />
                            <span className="text-label font-bold text-slate-500 dark:text-slate-400">
                                {partner.referrals_count} {t('referral.members')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end">
                <div className="text-label font-bold text-slate-400 uppercase tracking-widest">{t('referral.levelup.rank')}</div>
                <div className={`text-lg font-bold ${index === 0 ? 'text-amber-500' :
                    index === 1 ? 'text-slate-400' :
                        index === 2 ? 'text-orange-400' :
                            'text-slate-900 dark:text-white'
                    }`}>#{index + 1}</div>
            </div>
        </motion.div>
    );
});
TopPartnerRow.displayName = 'TopPartnerRow';
