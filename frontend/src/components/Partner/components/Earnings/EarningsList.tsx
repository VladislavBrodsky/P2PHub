import React from 'react';
import { Gift } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../../../api/client';
import { EarningRow } from './EarningRow';

interface EarningsListProps {
    isExpanded?: boolean;
}

export const EarningsList: React.FC<EarningsListProps> = ({ isExpanded = false }) => {
    const [xpEarnings, setXpEarnings] = React.useState<any[]>([]);
    const [cryptoData, setCryptoData] = React.useState<{ earnings: any[], transactions: any[] }>({ earnings: [], transactions: [] });
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState<'XP' | 'CRYPTO'>('XP');
    const { t } = useTranslation(['social', 'common']);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const limit = isExpanded ? 50 : 20;

                const results = await Promise.allSettled([
                    apiClient.get(`/api/partner/earnings?limit=${limit}&currency=XP`),
                    apiClient.get(`/api/partner/earnings?limit=${limit}&exclude_xp=true`),
                    apiClient.get('/api/payment/my-transactions')
                ]);
                
                const xpRes = results[0].status === 'fulfilled' ? results[0].value : null;
                const cryptoEarnRes = results[1].status === 'fulfilled' ? results[1].value : null;
                const txRes = results[2].status === 'fulfilled' ? results[2].value : null;

                if (xpRes) setXpEarnings(xpRes.data);
                
                setCryptoData({
                    earnings: cryptoEarnRes?.data || [],
                    transactions: txRes?.data || []
                });
            } catch (error) {
                console.error('Failed to fetch earnings data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isExpanded]);

    const cryptoItems = React.useMemo(() => {
        return [
            ...cryptoData.earnings.map((e: any) => ({
                ...e,
                isTransaction: false,
                date: new Date(e.created_at)
            })),
            ...cryptoData.transactions.map((t: any) => ({
                ...t,
                isTransaction: true,
                description: t.description || `${t.currency} ${t.status.toUpperCase()}`,
                amount: (t.currency === 'TON' && t.amount_crypto) ? t.amount_crypto : t.amount,
                currency: t.currency,
                type: 'TRANSACTION',
                date: new Date(t.created_at)
            }))
        ].sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [cryptoData]);

    if (loading) {
        return (
            <div className="space-y-3">
                <div className="h-16 w-full bg-slate-200 dark:bg-white/5 rounded-2xl animate-pulse" />
                <div className="h-16 w-full bg-slate-200 dark:bg-white/5 rounded-2xl animate-pulse" />
            </div>
        );
    }

    const displayItems = activeTab === 'XP' ? xpEarnings : cryptoItems;

    return (
        <div className="space-y-3 animate-in fade-in duration-500">
            {/* Tab Switcher */}
            <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl w-fit mx-auto shadow-inner border border-slate-200/50 dark:border-white/5">
                <button
                    onClick={() => setActiveTab('XP')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'XP'
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                        }`}
                >
                    {t('social:partner_dashboard.xp_tab')}
                </button>
                <button
                    onClick={() => setActiveTab('CRYPTO')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'CRYPTO'
                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                        }`}
                >
                    {t('social:partner_dashboard.crypto_tab')}
                </button>
            </div>

            <div className="space-y-1">
                {displayItems.length === 0 ? (
                    <div className="py-8 text-center bg-white/40 dark:bg-white/5 rounded-2xl border border-dashed border-slate-300 dark:border-white/10">
                        <Gift className="w-8 h-8 mx-auto text-slate-300 dark:text-white/20 mb-2" />
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('partner_dashboard.no_earnings')}</p>
                    </div>
                ) : (
                    displayItems.map((item: any, idx: number) => (
                        <EarningRow key={item.id || idx} item={item} idx={idx} />
                    ))
                )}
            </div>
        </div>
    );
};

EarningsList.displayName = 'EarningsList';
