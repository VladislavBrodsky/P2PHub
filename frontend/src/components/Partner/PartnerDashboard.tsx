import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Copy, Gift, DollarSign, ExternalLink, Users, ChevronRight } from 'lucide-react';
import { useHaptic } from '../../hooks/useHaptic';
import { useUser } from '../../context/UserContext';
import { Button } from '../ui/Button';
import { PersonalizationCard } from '../PersonalizationCard';
import { NetworkExplorer } from './NetworkExplorer';
import { ReferralGrowthChart } from './ReferralGrowthChart';
import { apiClient } from '../../api/client';
import { getApiUrl } from '../../utils/api';

export const PartnerDashboard = () => {
    const { notification, selection } = useHaptic();
    const { user } = useUser();
    const [isExplorerOpen, setIsExplorerOpen] = React.useState(false);
    const [isQrOpen, setIsQrOpen] = React.useState(false);

    // Correct bot username as requested
    const referralLink = `https://t.me/pintopay_probot?start=${user?.referral_code || 'ref_dev'}`;
    const qrImageUrl = user?.referral_code
        ? `${getApiUrl()}/api/tools/qr?url=${encodeURIComponent(referralLink)}&scale=10&dark=%23000000`
        : '';

    const [copied, setCopied] = React.useState(false);

    // Fetch Tree Stats for the Dashboard visualization
    const [treeStats, setTreeStats] = React.useState<Record<string, number>>({});
    const [timeframe, setTimeframe] = React.useState<'24H' | '7D' | '1M' | '3M' | '6M' | '1Y'>('7D');
    const [growthPct, setGrowthPct] = React.useState<number>(0);

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await apiClient.get('/api/partner/tree');
                if (res.data && typeof res.data === 'object') {
                    setTreeStats(res.data);
                }
            } catch (e) {
                console.error('Failed to fetch tree stats', e);
            }
        };
        fetchStats();
    }, []);

    // Valid "Network Size" calculation summing all levels from treeStats
    const totalNetworkSize = React.useMemo(() => {
        const sum = Object.values(treeStats).reduce((acc, val) => acc + (Number(val) || 0), 0);
        return sum > 0 ? sum : (user?.referrals?.length || 0); // Fallback to direct referrals if tree is empty/loading but user has data
    }, [treeStats, user?.referrals?.length]);

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

    // ... (existing code)

    return (
        <>
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* 0. Personalization Section */}
                <div>
                    <PersonalizationCard variant="compact" />
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 backdrop-blur-md shadow-sm">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Total Earned</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">${user?.balance?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div
                        className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 backdrop-blur-md shadow-sm active:scale-95 transition-transform cursor-pointer relative group overflow-hidden"
                        onClick={() => {
                            selection();
                            setIsExplorerOpen(true);
                        }}
                    >
                        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors" />
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                            <span>Network Size</span>
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
                        onMetricsUpdate={(m) => setGrowthPct(m.growth_pct)}
                        onReportClick={() => setIsExplorerOpen(true)}
                    />
                    {/* Explorer is now an overlay, but we might want a teaser here or just hide it */}
                    <div
                        className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        onClick={() => setIsExplorerOpen(true)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/10 p-2 rounded-xl text-blue-600 dark:text-blue-400">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Explore Connectivity</h3>
                                <p className="text-[10px] text-slate-500">View your 9-level deep downline</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                </div>

                {/* ... (Rest of dashboard) ... */}
                {/* 2. Invitation Method */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-slate-900 dark:text-white text-base font-bold">Ambassador Tools</h2>
                    </div>

                    <div className="space-y-2">
                        {/* QR Code Row with Modal Trigger */}
                        <div className="group rounded-2xl border border-slate-200 dark:border-white/5 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md p-3 shadow-sm dark:shadow-premium flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-all active:scale-[0.98] cursor-pointer" onClick={() => { selection(); setIsQrOpen(true); }}>
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                                    <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">Personal QR Portfolio</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">High-converting personalized assets</span>
                                </div>
                            </div>
                            <div className='p-2 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors'>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </div>
                        </div>

                        {/* Referral Link Row */}
                        <div className="group rounded-2xl border border-slate-200 dark:border-white/5 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md p-3 shadow-sm dark:shadow-premium flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-all active:scale-[0.98]">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="bg-purple-500/10 p-2 rounded-xl border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors shrink-0">
                                    <div className="w-5 h-5 flex items-center justify-center text-base">🔗</div>
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">Referral Network Link</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[180px] font-mono leading-none mt-1 opacity-60">{referralLink}</span>
                                </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); copyLink(); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 active:scale-90 transition-all bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl relative group">
                                {copied ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-emerald-500 animate-in zoom-in spin-in-180 duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </div>
                                ) : (
                                    <Copy className="w-3.5 h-3.5 transition-all group-active:scale-90" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. Rewards List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Earnings</h2>
                        <button className="text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">View All</button>
                    </div>

                    <EarningsList />
                </div>

                {/* 4. Integrated Action Button */}
                <div className="pt-2">
                    <Button
                        variant="primary"
                        className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-blue-50 rounded-2xl font-black text-sm shadow-premium flex items-center justify-center gap-3 active:scale-[0.98] transition-all relative overflow-hidden group"
                        onClick={() => notification('success')}
                    >
                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <span className="relative z-10">EXPAND YOUR NETWORK</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 relative z-10 animate-pulse" />
                    </Button>
                </div>
            </div>

            {/* Network Explorer Overlay */}
            <AnimatePresence>
                {isExplorerOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
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
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full max-w-lg h-[85vh] sm:h-[600px] relative z-10"
                        >
                            <NetworkExplorer onClose={() => setIsExplorerOpen(false)} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* QR Code Modal (existing code) */}
            {isQrOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsQrOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-xs space-y-4 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="text-center space-y-1">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Your Personal QR</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Scan to join your network instantly</p>
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
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
};

const EarningsList = () => {
    const [earnings, setEarnings] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchEarnings = async () => {
            try {
                const res = await apiClient.get('/api/partner/earnings');
                setEarnings(res.data);
            } catch (error) {
                console.error('Failed to fetch earnings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEarnings();
    }, []);

    if (loading) {
        return (
            <div className="space-y-3">
                <div className="h-16 w-full bg-slate-200 dark:bg-white/5 rounded-2xl animate-pulse" />
                <div className="h-16 w-full bg-slate-200 dark:bg-white/5 rounded-2xl animate-pulse" />
            </div>
        );
    }

    if (earnings.length === 0) {
        return (
            <div className="py-8 text-center bg-white/40 dark:bg-white/5 rounded-2xl border border-dashed border-slate-300 dark:border-white/10">
                <Gift className="w-8 h-8 mx-auto text-slate-300 dark:text-white/20 mb-2" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">No earnings yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {earnings.map((earning) => (
                <div key={earning.id} className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <div className='flex flex-col'>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{earning.description}</span>
                            <span className="text-[10px] text-slate-500">
                                {new Date(earning.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm tracking-tight">+{earning.amount.toFixed(3)} USDT</span>
                </div>
            ))}
        </div>
    );
};
