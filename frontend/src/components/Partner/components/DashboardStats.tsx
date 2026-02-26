import React from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DashboardStatsProps {
    user: any;
    totalNetworkSize: number;
    growthPct: number;
    selection: () => void;
    setIsFinanceOpen: (open: boolean) => void;
    handleExplorerOpen: () => void;
    handleUpgradeFromBalance: (plan: 'PRO' | 'PRO_PLUS') => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = React.memo(({
    user,
    totalNetworkSize,
    growthPct,
    selection,
    setIsFinanceOpen,
    handleExplorerOpen,
    handleUpgradeFromBalance
}) => {
    const { t } = useTranslation(['social', 'common']);

    return (
        <div className="grid grid-cols-2 gap-2">
            <div
                onClick={() => { selection(); setIsFinanceOpen(true); }}
                className="p-3 rounded-2xl bg-bg-glass border border-border-glass backdrop-blur-md shadow-sm flex flex-col cursor-pointer active:scale-[0.98] transition-all hover:bg-white/80 dark:hover:bg-slate-800/50"
            >
                <div className="text-label font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                    <span>{t('partner_dashboard.total_earned')}</span>
                    <ChevronRight className="w-3 h-3 opacity-30" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">${(user?.total_earned || 0).toFixed(2)}</div>
                {!user?.is_pro && (user?.balance || 0) >= 39 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleUpgradeFromBalance('PRO'); }}
                        className="mt-2 w-full py-2 btn-upgrade-glass btn-upgrade-pro-glass animate-soft-breath"
                    >
                        {t('partner_dashboard.upgrade_pro_btn')}
                    </button>
                )}
                {user?.is_pro && user?.subscription_plan !== 'PRO_PLUS_MONTHLY' && (user?.balance || 0) >= 69 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleUpgradeFromBalance('PRO_PLUS'); }}
                        className="mt-2 w-full py-2 btn-upgrade-glass btn-upgrade-plus-glass"
                    >
                        {t('partner_dashboard.upgrade_plus_btn')}
                    </button>
                )}
            </div>
            <div
                className="p-3 rounded-2xl bg-bg-glass border border-border-glass backdrop-blur-md shadow-sm active:scale-95 transition-transform cursor-pointer relative group overflow-hidden"
                onClick={handleExplorerOpen}
            >
                <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors" />
                <div className="text-label font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                    <span>{t('partner_dashboard.network_size')}</span>
                    <ExternalLink className="w-3 h-3 opacity-50" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {totalNetworkSize}
                    <span className="text-label bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-sm">
                        {growthPct >= 0 ? '+' : ''}{growthPct}%
                    </span>
                </div>
            </div>
        </div>
    );
});

DashboardStats.displayName = 'DashboardStats';
