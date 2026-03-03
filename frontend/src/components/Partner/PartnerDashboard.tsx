import React from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptic } from '../../hooks/useHaptic';
import { useUser } from '../../context/UserContext';
import { Button } from '../ui/Button';
import { PersonalizationCard } from '../PersonalizationCard';
import { ReferralGrowthChart } from './ReferralGrowthChart';
import { apiClient } from '../../api/client';
import { getApiUrl } from '../../utils/api';

import { TopPartnersList } from '../Community/TopPartnersList';
import { useUI } from '../../context/UIContext';

// Sub-components
import { DashboardStats } from './components/DashboardStats';
import { AmbassadorTools } from './components/AmbassadorTools';
import { EarningsList } from './components/Earnings/EarningsList';
import { DashboardModals } from './components/DashboardModals';

export const PartnerDashboard = () => {
    const { t } = useTranslation(['social', 'common']);
    const { notification, selection } = useHaptic();
    const { setFooterVisible } = useUI();
    const { user, updateUser, refreshUser } = useUser();

    // UI States
    const [isExplorerOpen, setIsExplorerOpen] = React.useState(false);
    const [isQrOpen, setIsQrOpen] = React.useState(false);
    const [isBriefingOpen, setIsBriefingOpen] = React.useState(false);
    const [isProWelcomeOpen, setIsProWelcomeOpen] = React.useState(false);
    const [isEarningsExpanded, setIsEarningsExpanded] = React.useState(false);
    const [isFinanceOpen, setIsFinanceOpen] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    const [timeframe, setTimeframe] = React.useState<'24H' | '7D' | '1M' | '3M' | '6M' | '1Y'>('7D');
    const [growthPct, setGrowthPct] = React.useState<number>(0);

    // Initial checks and side effects
    React.useEffect(() => {
        const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
        if (startParam === 'network') {
            setIsExplorerOpen(true);
        }
    }, []);

    React.useEffect(() => {
        if (isExplorerOpen) {
            setFooterVisible(false);
            return () => setFooterVisible(true);
        }
    }, [isExplorerOpen, setFooterVisible]);

    React.useEffect(() => {
        if (user?.is_pro && !user?.pro_notification_seen) {
            setIsProWelcomeOpen(true);
        }
    }, [user?.is_pro, user?.pro_notification_seen]);

    // Handlers
    const handleCloseProWelcome = async () => {
        setIsProWelcomeOpen(false);
        try {
            updateUser({ pro_notification_seen: true });
            await apiClient.post('/api/partner/notification/seen');
        } catch (e) {
            console.error('Failed to mark notification as seen', e);
        }
    };

    const referralLink = `https://t.me/pintopay_probot?start=${user?.referral_code || 'ref_dev'}`;
    const qrImageUrl = user?.referral_code
        ? `${getApiUrl()}/api/tools/qr?url=${encodeURIComponent(referralLink)}&scale=10&dark=%23000000`
        : '';

    const totalNetworkSize = React.useMemo(() => user?.total_network_size ?? 0, [user?.total_network_size]);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            notification('success');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error('Failed to copy', e);
        }
    };

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
            <div className="flex flex-col gap-5 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* 0. Personalization Section */}
                <div onClick={() => setIsBriefingOpen(true)} className="cursor-pointer relative z-10 shrink-0">
                    <PersonalizationCard variant="compact" />
                </div>

                {/* Quick Stats Row */}
                <DashboardStats
                    user={user}
                    totalNetworkSize={totalNetworkSize}
                    growthPct={growthPct}
                    selection={selection}
                    setIsFinanceOpen={setIsFinanceOpen}
                    handleExplorerOpen={handleExplorerOpen}
                    handleUpgradeFromBalance={handleUpgradeFromBalance}
                />

                {/* 1. Network Visualization (Inline Preview) */}
                <div className="space-y-4">
                    <ReferralGrowthChart
                        timeframe={timeframe}
                        setTimeframe={setTimeframe}
                        onMetricsUpdate={handleMetricsUpdate}
                        onReportClick={handleExplorerOpen}
                    />

                    {/* Partner Briefing Card */}
                    <div
                        onClick={() => { selection(); setIsBriefingOpen(true); }}
                        className="group relative overflow-hidden rounded-[1.25rem] bg-bg-glass border border-border-glass p-2 px-3 shadow-sm backdrop-blur-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all active:scale-[0.98]"
                    >
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-r from-transparent via-blue-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                                    <BookOpen className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <h3 className="text-label font-bold uppercase tracking-[0.08em] text-slate-900 dark:text-white leading-tight truncate">
                                        {t('brief.title')}
                                    </h3>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 opacity-60 leading-none mt-0.5">
                                        {t('brief.guide')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 pr-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                <div className="flex flex-col text-right">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 italic leading-none group-hover:text-blue-500 transition-colors">
                                        {t('brief.read_line1')}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 italic leading-none mt-0.5 group-hover:text-blue-500 transition-colors">
                                        {t('brief.read_line2')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Explore Network Entry */}
                    <div
                        className="bg-bg-glass border border-border-glass rounded-[1.25rem] p-2.5 px-4 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        onClick={handleExplorerOpen}
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/10 p-2 rounded-full text-blue-600 dark:text-blue-400">
                                <span className="w-5 h-5 flex items-center justify-center">🌐</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-tight">{t('partner_dashboard.explore_connectivity')}</h3>
                                <p className="text-label font-bold text-slate-500 opacity-60 uppercase tracking-widest leading-none mt-1">{t('partner_dashboard.explore_desc')}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                </div>

                {/* 1.5 Social Proof - Top Partners */}
                <TopPartnersList />

                {/* 2. Invitation Method */}
                <AmbassadorTools
                    referralLink={referralLink}
                    copied={copied}
                    selection={selection}
                    setIsQrOpen={setIsQrOpen}
                    copyLink={copyLink}
                />

                {/* 3. Rewards List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('partner_dashboard.recent_earnings')}</h2>
                        <button
                            onClick={() => setIsEarningsExpanded(!isEarningsExpanded)}
                            className="text-slate-500 hover:text-white text-label font-bold uppercase tracking-widest transition-colors"
                        >
                            {isEarningsExpanded ? t('common:show_less') : t('common:view_all')}
                        </button>
                    </div>

                    <EarningsList isExpanded={isEarningsExpanded} />
                </div>

                {/* 4. Integrated Action Button */}
                <div className="pt-2">
                    <Button
                        variant="primary"
                        className="w-full h-15 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-blue-50 rounded-2xl font-bold text-sm shadow-premium flex flex-col items-center justify-center gap-0.5 active:scale-[0.98] transition-all relative overflow-hidden group"
                        onClick={() => {
                            notification('success');
                            setIsBriefingOpen(true);
                        }}
                    >
                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 dark:via-blue-400/20 to-transparent -translate-x-full group-hover:animate-shimmer-slide pointer-events-none" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-linear-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 transition-opacity duration-500" />

                        <div className="flex items-center gap-3 relative z-10 pt-1">
                            <span className="tracking-widest">{t('partner_dashboard.expand_btn')}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 relative z-10 animate-pulse" />
                        </div>
                        <span className="text-label font-bold opacity-50 tracking-tight relative z-10 pb-1 italic">{t('partner_dashboard.expand_sub')}</span>
                    </Button>
                </div>
            </div>

            <DashboardModals
                isBriefingOpen={isBriefingOpen}
                setIsBriefingOpen={setIsBriefingOpen}
                isProWelcomeOpen={isProWelcomeOpen}
                handleCloseProWelcome={handleCloseProWelcome}
                isFinanceOpen={isFinanceOpen}
                setIsFinanceOpen={setIsFinanceOpen}
                isExplorerOpen={isExplorerOpen}
                setIsExplorerOpen={setIsExplorerOpen}
                isQrOpen={isQrOpen}
                setIsQrOpen={setIsQrOpen}
                totalNetworkSize={totalNetworkSize}
                qrImageUrl={qrImageUrl}
                referralLink={referralLink}
            />
        </>
    );
};
