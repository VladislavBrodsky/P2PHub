import { useState, useEffect } from 'react';
import { QrCode, Copy, Gift, DollarSign } from 'lucide-react';
import { useHaptic } from '../hooks/useHaptic';
import { ListSkeleton } from '../components/Skeletons/ListSkeleton';
import { Button } from '../components/ui/Button';
import { useUser } from '../context/UserContext';
import { PersonalizationCard } from '../components/PersonalizationCard';

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
            {/* 0. Personalization Section */}
            <div className="mb-6">
                <PersonalizationCard />
            </div>

            {/* 1. Invitation Method */}
            <div className="mb-8">
                <h2 className="text-[var(--color-text-primary)] text-xl font-bold mb-4">Ambassador Tools</h2>

                <div className="space-y-3">
                    {/* QR Code Row */}
                    <div className="rounded-2xl border border-white/60 bg-white/40 backdrop-blur-md p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between hover:bg-white/60 transition-all active:scale-[0.98]">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                                <QrCode className="w-5 h-5 text-text-primary" />
                            </div>
                            <span className="font-bold text-text-primary text-sm tracking-tight">Personal QR Portfolio</span>
                        </div>
                        <button
                            className="text-brand-blue text-[10px] font-black uppercase tracking-widest px-2"
                            onClick={() => selection()}
                        >
                            Generate
                        </button>
                    </div>

                    {/* Referral Link Row */}
                    <div className="rounded-2xl border border-white/60 bg-white/40 backdrop-blur-md p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between hover:bg-white/60 transition-all active:scale-[0.98]">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm shrink-0">
                                <div className="w-5 h-5 flex items-center justify-center text-lg">🔗</div>
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="font-bold text-text-primary text-sm tracking-tight">Referral Network Link</span>
                                <span className="text-[10px] text-slate-400 truncate max-w-[150px] font-mono leading-none mt-1">{referralLink}</span>
                            </div>
                        </div>
                        <button onClick={copyLink} className="text-slate-400 hover:text-text-primary p-2 active:scale-90 transition-all">
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

            {/* 3. Integrated Action Button */}
            <div className="pt-8 mb-4">
                <Button
                    variant="primary"
                    className="w-full h-16 bg-action-black text-white rounded-2xl font-black text-lg shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                    onClick={() => notification('success')}
                >
                    <span>Expand Network</span>
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="text-white/60 text-xs font-bold tracking-widest">PRO</span>
                </Button>
            </div>

            {/* Extra Spacing at bottom */}
            <div className="h-24 pointer-events-none" />

        </div>
    );
};
