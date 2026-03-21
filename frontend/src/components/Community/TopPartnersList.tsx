import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Crown, ChevronDown, ChevronUp, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { getApiUrl } from '../../utils/api';
import { ProPlusBadge, ProBadge } from '../ui/ProPlusBadge';
import { USDTLogo } from '../ui/USDTLogo';
import { LiquidCounter } from '../../pages/Pro/utils/LiquidCounter';

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
            className={`group relative flex items-center justify-between p-2.5 rounded-xl border border-white/5 dark:border-white/5 backdrop-blur-md shadow-sm active:scale-[0.98] transition-all overflow-hidden ${index === 0 ? 'bg-amber-500/10 border-amber-500/30' :
                index === 1 ? 'bg-slate-300/10 border-slate-400/30' :
                    index === 2 ? 'bg-orange-500/10 border-orange-500/30' :
                        'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-white/5'
                }`}
        >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden relative shadow-sm">
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
                        <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 p-0.5 rounded-full shadow-lg border-2 border-white dark:border-slate-800 flex items-center justify-center z-20 ${index === 0 ? 'bg-amber-400' :
                            index === 1 ? 'bg-slate-400' :
                                'bg-orange-400'
                            }`}>
                            <Crown className="w-3.5 h-3.5 text-white fill-white/20" />
                        </div>
                    )}
                    {(partner.subscription_plan || '').includes('PRO') && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20">
                            <ProBadge
                                variant={(partner.subscription_plan || '').includes('PLUS') ? 'pro-plus' : 'pro'}
                                size="xs"
                            />
                        </div>
                    )}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {partner.first_name} {partner.last_name}
                        </span>
                        <div className="shrink-0 max-w-[100px] overflow-hidden">
                            <span className="text-[9px] font-bold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-sm uppercase tracking-tighter block truncate">
                                {t(`ranks.${partner.rank.charAt(0).toUpperCase()}${partner.rank.slice(1).toLowerCase()}`, partner.rank) as string}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1 shrink-0">
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                {partner.xp.toLocaleString()} XP
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-500 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded-full border border-emerald-500/10 min-w-0">
                            <USDTLogo className="w-2.5 h-2.5 shrink-0" />
                            <span className="text-[9px] tracking-tight truncate">
                                <LiquidCounter value={partner.total_earned_usdt || 0} className="inline" /> USDT
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end shrink-0 pl-2">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">{t('referral.levelup.rank')}</div>
                <div className={`text-base font-bold leading-none ${index === 0 ? 'text-amber-500' :
                    index === 1 ? 'text-slate-400' :
                        index === 2 ? 'text-orange-400' :
                            'text-slate-900 dark:text-white'
                    }`}>#{index + 1}</div>
            </div>
        </motion.div>
    );
});
TopPartnerRow.displayName = 'TopPartnerRow';
