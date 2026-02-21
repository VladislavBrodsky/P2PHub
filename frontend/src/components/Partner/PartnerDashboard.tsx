import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Copy, Gift, DollarSign, ExternalLink, Users, ChevronRight, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptic } from '../../hooks/useHaptic';
import { useUser } from '../../context/UserContext';
import { Button } from '../ui/Button';
import { PersonalizationCard } from '../PersonalizationCard';
import { NetworkExplorer } from './NetworkExplorer';
import { ReferralGrowthChart } from './ReferralGrowthChart';
import { apiClient } from '../../api/client';
import { getApiUrl } from '../../utils/api';

import { PartnerBriefingModal } from './PartnerBriefingModal';
import { TopPartnersList } from '../Community/TopPartnersList';
import { ProWelcomeCard } from './ProWelcomeCard';
import { FinanceStatsModal } from './FinanceStatsModal';
import { useUI } from '../../context/UIContext';
import { USDTLogo, TONLogo } from '../ui/CryptoIcons';

export const PartnerDashboard = () => {
    const { t } = useTranslation();
    const { notification, selection } = useHaptic();
    const { setFooterVisible } = useUI();
    const { user, updateUser, refreshUser } = useUser();
    const [isExplorerOpen, setIsExplorerOpen] = React.useState(false);
    const [isQrOpen, setIsQrOpen] = React.useState(false);
    const [isBriefingOpen, setIsBriefingOpen] = React.useState(false);
    const [isProWelcomeOpen, setIsProWelcomeOpen] = React.useState(false);
    const [isEarningsExpanded, setIsEarningsExpanded] = React.useState(false);
    const [isFinanceOpen, setIsFinanceOpen] = React.useState(false);

    React.useEffect(() => {
        const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
        if (startParam === 'network') {
            setIsExplorerOpen(true);
        }
    }, []);

    // #comment: Manage app footer visibility when explorer is open to prevent UI overlap
    React.useEffect(() => {
        if (isExplorerOpen) {
            setFooterVisible(false);
            return () => setFooterVisible(true);
        }
    }, [isExplorerOpen, setFooterVisible]);

    // Show Pro Welcome if user is pro but hasn't seen the notification
    React.useEffect(() => {
        if (user?.is_pro && !user?.pro_notification_seen) {
            setIsProWelcomeOpen(true);
        }
    }, [user?.is_pro, user?.pro_notification_seen]);

    const handleCloseProWelcome = async () => {
        setIsProWelcomeOpen(false);
        try {
            await apiClient.post('/api/partner/notification/seen');
            updateUser({ pro_notification_seen: true });
        } catch (e) {
            console.error('Failed to mark notification as seen', e);
        }
    };

    // Correct bot username as requested
    const referralLink = `https://t.me/pintopay_probot?start=${user?.referral_code || 'ref_dev'}`;
    const qrImageUrl = user?.referral_code
        ? `${getApiUrl()}/api/tools/qr?url=${encodeURIComponent(referralLink)}&scale=10&dark=%23000000`
        : '';

    const [copied, setCopied] = React.useState(false);

    const [timeframe, setTimeframe] = React.useState<'24H' | '7D' | '1M' | '3M' | '6M' | '1Y'>('7D');
    const [growthPct, setGrowthPct] = React.useState<number>(0);

    // Valid "Network Size" calculation prioritizing materialized O(1) data
    const totalNetworkSize = React.useMemo(() => {
        return user?.total_network_size ?? 0;
    }, [user?.total_network_size]);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            notification('success');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error('Failed to copy', e);
            // Fallback for some browsers if needed, but usually navigator.clipboard works in secure context
        }
    };

    // #comment: Memoize handlers to prevent infinite re-render loops when passed to children with useEffect dependencies
    const handleMetricsUpdate = React.useCallback((m: { growth_pct: number; current_count: number }) => {
        setGrowthPct(m.growth_pct);
    }, []);

    const handleExplorerOpen = React.useCallback(() => {
        selection();
        setIsExplorerOpen(true);
    }, [selection]);

    const handleUpgradeFromBalance = async (plan: 'PRO' | 'PRO_PLUS') => {
        if (!user) return;
        const price = plan === 'PRO' ? 39 : 69;
        if (user.balance < price) return;

        try {
            notification('success');
            await apiClient.post('/api/payment/upgrade-from-balance', { plan });
            await refreshUser(true);
        } catch (e) {
            console.error('Upgrade failed', e);
            notification('error');
        }
    };


    return (
        <>
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* 0. Personalization Section */}
                <div onClick={() => setIsBriefingOpen(true)} className="cursor-pointer">
                    <PersonalizationCard variant="compact" />
                </div>



                {/* Quick Stats Row */}
                <div className="grid grid-cols-2 gap-2">
                    <div
                        onClick={() => { selection(); setIsFinanceOpen(true); }}
                        className="p-3 rounded-2xl bg-(--color-bg-glass) border border-(--color-border-glass) backdrop-blur-md shadow-sm flex flex-col cursor-pointer active:scale-[0.98] transition-all hover:bg-white/80 dark:hover:bg-slate-800/50"
                    >
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                            <span>{t('partner_dashboard.total_earned')}</span>
                            <ChevronRight className="w-3 h-3 opacity-30" />
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">${(user?.total_earned || 0).toFixed(2)}</div>
                        {!user?.is_pro && (user?.balance || 0) >= 39 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleUpgradeFromBalance('PRO'); }}
                                className="mt-2 w-full py-1.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[8px] font-black uppercase tracking-widest rounded-lg transition-all shadow-md active:scale-95 animate-pulse"
                            >
                                {t('partner_dashboard.upgrade_pro_btn')}
                            </button>
                        )}
                        {user?.is_pro && user?.subscription_plan !== 'PRO_PLUS_MONTHLY' && (user?.balance || 0) >= 69 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleUpgradeFromBalance('PRO_PLUS'); }}
                                className="mt-2 w-full py-1.5 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-[8px] font-black uppercase tracking-widest rounded-lg transition-all shadow-md active:scale-95"
                            >
                                {t('partner_dashboard.upgrade_plus_btn')}
                            </button>
                        )}
                    </div>
                    <div
                        className="p-3 rounded-2xl bg-(--color-bg-glass) border border-(--color-border-glass) backdrop-blur-md shadow-sm active:scale-95 transition-transform cursor-pointer relative group overflow-hidden"
                        onClick={handleExplorerOpen}
                    >
                        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors" />
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                            <span>{t('partner_dashboard.network_size')}</span>
                            <ExternalLink className="w-3 h-3 opacity-50" />
                        </div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            {totalNetworkSize}
                            <span className="text-[10px] bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-sm">
                                {growthPct >= 0 ? '+' : ''}{growthPct}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* 1. Network Visualization (Inline Preview) */}
                <div className="space-y-4">
                    <ReferralGrowthChart
                        timeframe={timeframe}
                        setTimeframe={setTimeframe}
                        onMetricsUpdate={handleMetricsUpdate}
                        onReportClick={handleExplorerOpen}
                    />

                    {/* Partner Briefing Card - Moved from CommunityPage */}
                    <div
                        onClick={() => { selection(); setIsBriefingOpen(true); }}
                        className="group relative overflow-hidden rounded-[1.25rem] bg-(--color-bg-glass) border border-(--color-border-glass) p-2 px-3 shadow-sm backdrop-blur-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all active:scale-[0.98]"
                    >
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-r from-transparent via-blue-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                                    <BookOpen className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <h3 className="text-xs font-black uppercase tracking-[0.08em] text-slate-900 dark:text-white leading-tight truncate">
                                        {t('referral.brief.title')}
                                    </h3>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 opacity-60 leading-none mt-0.5">
                                        {t('referral.brief.guide')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 pr-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                <div className="flex flex-col text-right">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 italic leading-none group-hover:text-blue-500 transition-colors">
                                        {t('referral.brief.read').split(' ')[0]}
                                    </span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 italic leading-none mt-0.5 group-hover:text-blue-500 transition-colors">
                                        {t('referral.brief.read').split(' ')[1]}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* #comment: Unified card styling for secondary tools to maintain dashboard vertical breathing room */}
                    <div
                        className="bg-(--color-bg-glass) border border-(--color-border-glass) rounded-[1.25rem] p-2.5 px-4 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        onClick={handleExplorerOpen}
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/10 p-2 rounded-full text-blue-600 dark:text-blue-400">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-tight">{t('partner_dashboard.explore_connectivity')}</h3>
                                <p className="text-[10px] font-bold text-slate-500 opacity-60 uppercase tracking-widest leading-none mt-1">{t('partner_dashboard.explore_desc')}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                </div>

                {/* 1.5 Social Proof - Top Partners */}
                {/* 1.5 Social Proof - Top Partners */}
                <TopPartnersList />

                {/* ... (Rest of dashboard) ... */}
                {/* 2. Invitation Method */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-slate-900 dark:text-white text-base font-bold">{t('partner_dashboard.ambassador_tools')}</h2>
                    </div>

                    <div className="space-y-2">
                        {/* QR Code Row with Modal Trigger */}
                        <div
                            className="group relative rounded-[1.25rem] border border-slate-200 dark:border-white/5 bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl p-4 shadow-sm dark:shadow-premium flex items-center justify-between hover:bg-white dark:hover:bg-slate-800/60 transition-all active:scale-[0.98] cursor-pointer overflow-hidden"
                            onClick={() => { selection(); setIsQrOpen(true); }}
                        >
                            <div className="absolute inset-0 bg-linear-to-r from-blue-500/0 via-blue-500/0 to-blue-500/5 dark:to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:scale-110 transition-all duration-300">
                                    <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-black text-slate-900 dark:text-white text-sm tracking-tight">{t('partner_dashboard.qr_title')}</span>
                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 opacity-80">{t('partner_dashboard.qr_desc')}</span>
                                </div>
                            </div>
                            <div className='w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-full text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-all'>
                                <ExternalLink className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Referral Link Row */}
                        <div className="group relative rounded-[1.25rem] border border-slate-200 dark:border-white/5 bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl p-4 shadow-sm dark:shadow-premium flex items-center justify-between hover:bg-white dark:hover:bg-slate-800/60 transition-all active:scale-[0.98] overflow-hidden">
                            <div className="absolute inset-0 bg-linear-to-r from-purple-500/0 via-purple-500/0 to-purple-500/5 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-center gap-4 overflow-hidden relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 group-hover:scale-110 transition-all duration-300 shrink-0">
                                    <div className="w-5 h-5 flex items-center justify-center text-base">🔗</div>
                                </div>
                                <div className="flex flex-col gap-0.5 overflow-hidden">
                                    <span className="font-black text-slate-900 dark:text-white text-sm tracking-tight">{t('partner_dashboard.link_title')}</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[180px] font-mono font-medium opacity-60 leading-none py-0.5">{referralLink}</span>
                                </div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); copyLink(); }}
                                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-purple-500 active:scale-90 transition-all bg-slate-100 dark:bg-white/5 hover:bg-purple-500/10 rounded-full relative z-10"
                            >
                                {copied ? (
                                    <div className="animate-in zoom-in spin-in-180 duration-300 text-emerald-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </div>
                                ) : (
                                    <Copy className="w-4 h-4 transition-all" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. Rewards List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('partner_dashboard.recent_earnings')}</h2>
                        <button
                            onClick={() => setIsEarningsExpanded(!isEarningsExpanded)}
                            className="text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                        >
                            {isEarningsExpanded ? t('common.show_less') : t('common.view_all')}
                        </button>
                    </div>

                    <EarningsList isExpanded={isEarningsExpanded} />
                </div>

                {/* 4. Integrated Action Button */}
                <div className="pt-2">
                    <Button
                        variant="primary"
                        className="w-full h-15 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-blue-50 rounded-2xl font-black text-sm shadow-premium flex flex-col items-center justify-center gap-0.5 active:scale-[0.98] transition-all relative overflow-hidden group"
                        onClick={() => {
                            notification('success');
                            setIsBriefingOpen(true);
                        }}
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 dark:via-blue-400/20 to-transparent -translate-x-full group-hover:animate-shimmer-slide pointer-events-none" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-linear-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 transition-opacity duration-500" />

                        <div className="flex items-center gap-3 relative z-10 pt-1">
                            <span className="tracking-widest">{t('partner_dashboard.expand_btn')}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 relative z-10 animate-pulse" />
                        </div>
                        <span className="text-[9px] font-bold opacity-50 tracking-tight relative z-10 pb-1 italic">{t('partner_dashboard.expand_sub')}</span>
                    </Button>
                </div>
            </div>

            <PartnerBriefingModal isOpen={isBriefingOpen} onClose={() => setIsBriefingOpen(false)} />
            <ProWelcomeCard isOpen={isProWelcomeOpen} onClose={handleCloseProWelcome} />
            <AnimatePresence>
                {isFinanceOpen && (
                    <FinanceStatsModal isOpen={isFinanceOpen} onClose={() => setIsFinanceOpen(false)} />
                )}
            </AnimatePresence>

            {/* Network Explorer Overlay */}
            <AnimatePresence>
                {isExplorerOpen && (
                    <div className="fixed inset-0 z-1000 flex items-stretch justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsExplorerOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                            className="w-full max-w-lg mx-auto relative z-10 flex flex-col"
                        >
                            <NetworkExplorer onClose={() => setIsExplorerOpen(false)} initialTotalCount={totalNetworkSize} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* QR Code Modal (existing code) */}
            {isQrOpen && (
                <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsQrOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-xs space-y-4 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="text-center space-y-1">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('partner_dashboard.qr_modal_title')}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{t('partner_dashboard.qr_modal_desc')}</p>
                        </div>

                        <div className="aspect-square bg-white rounded-2xl p-4 flex items-center justify-center border border-slate-100 dark:border-white/5 shadow-inner">
                            {qrImageUrl ? (
                                <img src={qrImageUrl} alt="My QR Code" className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                            ) : (
                                <div className="animate-pulse w-full h-full bg-slate-200 rounded-xl" />
                            )}
                        </div>

                        <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 text-center">
                            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 break-all">{referralLink}</p>
                        </div>

                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => setIsQrOpen(false)}
                        >
                            {t('common.close')}
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
};



const EarningsList = ({ isExpanded = false }: { isExpanded?: boolean }) => {
    const [xpEarnings, setXpEarnings] = React.useState<any[]>([]);
    const [cryptoItems, setCryptoItems] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState<'XP' | 'CRYPTO'>('XP');
    const { t } = useTranslation();

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const limit = isExpanded ? 50 : 20;

                // Fetch XP and Crypto separately using new backend filters
                const [xpRes, cryptoEarnRes, txRes] = await Promise.all([
                    apiClient.get(`/api/partner/earnings?limit=${limit}&currency=XP`),
                    apiClient.get(`/api/partner/earnings?limit=${limit}&exclude_xp=true`),
                    apiClient.get('/api/payment/my-transactions')
                ]);

                setXpEarnings(xpRes.data);

                // Merge crypto commissions with direct transactions
                const mergedCrypto = [
                    ...cryptoEarnRes.data.map((e: any) => ({
                        ...e,
                        isTransaction: false,
                        date: new Date(e.created_at)
                    })),
                    ...txRes.data.map((t: any) => ({
                        ...t,
                        isTransaction: true,
                        description: t.description || `${t.currency} ${t.status.toUpperCase()}`,
                        amount: (t.currency === 'TON' && t.amount_crypto) ? t.amount_crypto : t.amount,
                        currency: t.currency,
                        type: 'TRANSACTION',
                        date: new Date(t.created_at)
                    }))
                ].sort((a, b) => b.date.getTime() - a.date.getTime());

                setCryptoItems(mergedCrypto);
            } catch (error) {
                console.error('Failed to fetch earnings data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isExpanded]);

    const formatEarningDescription = (desc: string) => {
        if (!desc) return '';

        if (desc.startsWith('Task Reward: ')) {
            const taskId = desc.replace('Task Reward: ', '').trim();
            const taskTitleKey = `tasks.${taskId}.title`;
            const translatedTitle = t(taskTitleKey);

            if (translatedTitle && translatedTitle !== taskTitleKey) {
                return `${translatedTitle}`;
            }

            return taskId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }

        return desc.replace('(Level ', '(L');
    };

    if (loading) {
        return (
            <div className="space-y-3">
                <div className="h-16 w-full bg-slate-200 dark:bg-white/5 rounded-2xl animate-pulse" />
                <div className="h-16 w-full bg-slate-200 dark:bg-white/5 rounded-2xl animate-pulse" />
            </div>
        );
    }

    const displayItems = activeTab === 'XP' ? xpEarnings : cryptoItems;

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'PRO_COMMISSION':
            case 'COMMISSION':
                return {
                    icon: <DollarSign className="w-4 h-4" />,
                    bg: 'bg-emerald-500/10',
                    border: 'border-emerald-500/20',
                    text: 'text-emerald-600 dark:text-emerald-400'
                };
            case 'TRANSACTION':
                return {
                    icon: <DollarSign className="w-4 h-4" />,
                    bg: 'bg-purple-500/10',
                    border: 'border-purple-500/20',
                    text: 'text-purple-600 dark:text-purple-400'
                };
            case 'TASK_XP':
                return {
                    icon: <Gift className="w-4 h-4" />,
                    bg: 'bg-blue-500/10',
                    border: 'border-blue-500/20',
                    text: 'text-blue-600 dark:text-blue-400'
                };
            case 'REFERRAL_XP':
                return {
                    icon: <Users className="w-4 h-4" />,
                    bg: 'bg-amber-500/10',
                    border: 'border-amber-500/20',
                    text: 'text-amber-600 dark:text-amber-400'
                };
            default:
                return {
                    icon: <DollarSign className="w-4 h-4" />,
                    bg: 'bg-slate-500/10',
                    border: 'border-slate-500/20',
                    text: 'text-slate-600 dark:text-slate-400'
                };
        }
    };

    return (
        <div className="space-y-3 animate-in fade-in duration-500">
            {/* Tab Switcher */}
            <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl w-fit mx-auto shadow-inner border border-slate-200/50 dark:border-white/5">
                <button
                    onClick={() => setActiveTab('XP')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'XP'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                        }`}
                >
                    {t('partner_dashboard.xp_tab')}
                </button>
                <button
                    onClick={() => setActiveTab('CRYPTO')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'CRYPTO'
                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                        }`}
                >
                    {t('partner_dashboard.crypto_tab')}
                </button>
            </div>

            <div className="space-y-1">
                {displayItems.length === 0 ? (
                    <div className="py-8 text-center bg-white/40 dark:bg-white/5 rounded-2xl border border-dashed border-slate-300 dark:border-white/10">
                        <Gift className="w-8 h-8 mx-auto text-slate-300 dark:text-white/20 mb-2" />
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('partner_dashboard.no_earnings')}</p>
                    </div>
                ) : (
                    displayItems.map((item: any, idx: number) => {
                        const styles = getTypeStyles(item.type);
                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                key={item.id || idx}
                                className="bg-[--color-bg-glass] rounded-xl p-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`w-6.5 h-6.5 rounded-lg ${styles.bg} ${styles.border} flex items-center justify-center ${styles.text}`}>
                                        {item.currency === 'TON' ? (
                                            <TONLogo className="w-3.5 h-3.5" />
                                        ) : item.currency === 'USDT' || item.type === 'COMMISSION' || item.type === 'PRO_COMMISSION' ? (
                                            <USDTLogo className="w-3.5 h-3.5" />
                                        ) : (
                                            React.cloneElement(styles.icon as React.ReactElement, { className: 'w-3 h-3' })
                                        )}
                                    </div>
                                    <div className='flex flex-col'>
                                        <span className="font-bold text-slate-900 dark:text-white text-[10.5px] leading-tight">
                                            {formatEarningDescription(item.description)}
                                        </span>
                                        <span className="text-[7.5px] text-slate-500 opacity-50 font-medium">
                                            {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {item.status && item.status !== 'completed' && (
                                        <div className={`px-1 rounded text-[6px] font-black uppercase tracking-tighter ${item.status === 'pending' || item.status === 'manual_review'
                                            ? 'bg-amber-500/20 text-amber-500'
                                            : 'bg-red-500/20 text-red-500'
                                            }`}>
                                            {item.status === 'manual_review' ? 'REVIEW' : item.status}
                                        </div>
                                    )}
                                    {item.level && (
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-linear-to-br from-purple-500/20 via-blue-500/20 to-purple-500/20 rounded-md blur-[2px] group-hover:blur-[3px] transition-all" />
                                            <div className="relative bg-linear-to-br from-purple-500/10 via-blue-500/10 to-purple-500/10 dark:from-purple-500/20 dark:via-blue-500/20 dark:to-purple-500/20 px-1 py-0.5 rounded-md border border-purple-500/30 dark:border-purple-400/30 flex flex-col items-center min-w-[28px] shadow-sm backdrop-blur-sm">
                                                <span className="text-[5.5px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 opacity-80 leading-none">{t('common.lvl')}</span>
                                                <span className="text-[11px] font-black bg-linear-to-br from-purple-600 via-blue-600 to-purple-600 dark:from-purple-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent leading-none">{item.level}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <span className={`font-black ${item.isTransaction ? 'text-slate-400' : styles.text} text-sm tracking-tight leading-none`}>
                                            {item.isTransaction ? '-' : '+'}{item.currency === 'XP' ? Math.floor(item.amount ?? 0) : (item.amount ?? 0).toFixed((item.amount ?? 0) < 1 ? 3 : 2)}
                                        </span>
                                        <span className={`text-[7.5px] font-black ${item.isTransaction ? 'text-slate-400' : styles.text} opacity-70 uppercase tracking-widest self-end pb-0.5`}>
                                            {item.currency}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
