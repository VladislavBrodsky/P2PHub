import { useState, useEffect } from 'react';
import { QrCode, Copy, Gift, DollarSign } from 'lucide-react';
import { useHaptic } from '../hooks/useHaptic';
import { ListSkeleton } from '../components/Skeletons/ListSkeleton';
import { Button } from '../components/ui/Button';
import { useUser } from '../context/UserContext';

// Mock translation function for now, replace with actual i18n if needed
const t = (key: string, defaultValue: string) => defaultValue;

export default function CommunityPage() {
    const [isLoading, setIsLoading] = useState(true);
    const { notification, selection } = useHaptic();
    const { user } = useUser();

    const referralLink = `https://t.me/pintopay_bot?start=${user?.referral_code || 'ref_dev'}`;

    useEffect(() => {
        const fetchData = async () => {
            try {
                // await api.get('/user/stats');
                // Simulate fetch delay
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error('Error fetching community data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const copyLink = () => {
        navigator.clipboard.writeText(referralLink);
        notification('success');
    };

    if (isLoading) return <div className="p-4"><ListSkeleton /></div>;

    return (
        <div className="flex flex-col min-h-[85vh] px-4 pt-4 pb-32">

            {/* 1. Invitation Method */}
            <div className="mb-8">
                <h2 className="text-[var(--color-text-primary)] text-xl font-bold mb-4">Ambassador Tools</h2>

                <div className="space-y-3">
                    {/* QR Code Row */}
                    <div className="rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-bg-surface)] p-4 shadow-sm flex items-center justify-between hover:bg-[var(--color-bg-glass)] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="bg-[var(--color-bg-glass)] p-2 rounded-xl border border-[var(--color-brand-border)]">
                                <QrCode className="w-6 h-6 text-[var(--color-text-primary)]" />
                            </div>
                            <span className="font-bold text-[var(--color-text-primary)] text-sm">Personal QR Portfolio</span>
                        </div>
                        <button
                            className="text-[var(--color-text-primary)] text-sm font-black uppercase tracking-widest px-2"
                            onClick={() => selection()}
                        >
                            Generate
                        </button>
                    </div>

                    {/* Referral Link Row */}
                    <div className="rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-bg-surface)] p-4 shadow-sm flex items-center justify-between hover:bg-[var(--color-bg-glass)] transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="bg-[var(--color-bg-glass)] p-2 rounded-xl border border-[var(--color-brand-border)] shrink-0">
                                <div className="w-6 h-6 flex items-center justify-center font-bold text-[var(--color-text-primary)]">🔗</div>
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="font-bold text-[var(--color-text-primary)] text-sm">Referral Network Link</span>
                                <span className="text-xs text-[var(--color-text-secondary)] truncate max-w-[150px] font-mono">{referralLink}</span>
                            </div>
                        </div>
                        <button onClick={copyLink} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-2 active:scale-90 transition-all">
                            <Copy className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Rewards List */}
            <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{t('misc.partner_earnings', 'Partner Earnings')}</h2>
                    <button className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-[10px] font-black uppercase tracking-widest">History</button>
                </div>

                <div className="space-y-3">
                    {/* Reward Item 1 */}
                    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-brand-border)] rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--color-bg-glass)] border border-[var(--color-brand-border)] flex items-center justify-center text-[var(--color-text-secondary)]">
                                <Gift className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-[var(--color-text-primary)] text-sm">Card Top Up Reward</span>
                        </div>
                        <span className="font-bold text-emerald-500 text-sm">+1.516 USDT</span>
                    </div>

                    {/* Reward Item 2 */}
                    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-brand-border)] rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--color-bg-glass)] border border-[var(--color-brand-border)] flex items-center justify-center text-[var(--color-text-secondary)]">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-[var(--color-text-primary)] text-sm">Card Top Up Reward</span>
                        </div>
                        <span className="font-bold text-emerald-500 text-sm">+0.113 USDT</span>
                    </div>

                    {/* Reward Item 3 (Mock) */}
                    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-brand-border)] rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--color-bg-glass)] border border-[var(--color-brand-border)] flex items-center justify-center text-[var(--color-text-secondary)]">
                                <Gift className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-[var(--color-text-primary)] text-sm">Referral Bonus</span>
                        </div>
                        <span className="font-bold text-emerald-500 text-sm">+5.000 USDT</span>
                    </div>
                </div>
            </div>

            {/* 3. Sticky Bottom Button */}
            <div className="fixed bottom-24 left-0 right-0 px-4 z-50">
                <Button
                    variant="primary"
                    className="w-full text-lg h-16 shadow-2xl shadow-[var(--color-brand-dark)]/20"
                    onClick={() => notification('success')}
                >
                    Expand Network
                </Button>
            </div>

        </div>
    );
};
