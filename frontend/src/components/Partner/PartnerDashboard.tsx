import { QrCode, Copy, Gift, DollarSign, ExternalLink } from 'lucide-react';
import { useHaptic } from '../../hooks/useHaptic';
import { useUser } from '../../context/UserContext';
import { Button } from '../ui/Button';
import { PersonalizationCard } from '../PersonalizationCard';

export const PartnerDashboard = () => {
    const { notification, selection } = useHaptic();
    const { user } = useUser();
    const referralLink = `https://t.me/pintopay_bot?start=${user?.referral_code || 'ref_dev'}`;

    const copyLink = () => {
        navigator.clipboard.writeText(referralLink);
        notification('success');
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 0. Personalization Section */}
            <div>
                <PersonalizationCard />
            </div>

            {/* Quick Stats Row (New) */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 backdrop-blur-md shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Total Earned</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">$45.20</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 backdrop-blur-md shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Network Size</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        128 <span className="text-[10px] bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-sm">+12%</span>
                    </div>
                </div>
            </div>

            {/* 1. Invitation Method */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-slate-900 dark:text-white text-lg font-bold">Ambassador Tools</h2>
                </div>

                <div className="space-y-3">
                    {/* QR Code Row */}
                    <div className="group rounded-2xl border border-slate-200 dark:border-white/5 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md p-4 shadow-sm dark:shadow-premium flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-all active:scale-[0.98] cursor-pointer" onClick={() => selection()}>
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                                <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">Personal QR Portfolio</span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">High-converting personalized assets</span>
                            </div>
                        </div>
                        <div className='p-2 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-colors'>
                            <ExternalLink className="w-4 h-4" />
                        </div>
                    </div>

                    {/* Referral Link Row */}
                    <div className="group rounded-2xl border border-slate-200 dark:border-white/5 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md p-4 shadow-sm dark:shadow-premium flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-all active:scale-[0.98]">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="bg-purple-500/10 p-2 rounded-xl border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors shrink-0">
                                <div className="w-6 h-6 flex items-center justify-center text-lg">🔗</div>
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">Referral Network Link</span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[180px] font-mono leading-none mt-1 opacity-60">{referralLink}</span>
                            </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); copyLink(); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2.5 active:scale-90 transition-all bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl">
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Rewards List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Earnings</h2>
                    <button className="text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">View All</button>
                </div>

                <div className="space-y-3">
                    {/* Reward Item 1 */}
                    <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <Gift className="w-5 h-5" />
                            </div>
                            <div className='flex flex-col'>
                                <span className="font-bold text-slate-900 dark:text-white text-sm">Card Top Up Reward</span>
                                <span className="text-[10px] text-slate-500">Today, 10:23 AM</span>
                            </div>
                        </div>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm tracking-tight">+1.516 USDT</span>
                    </div>

                    {/* Reward Item 2 */}
                    <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <DollarSign className="w-5 h-5" />
                            </div>
                            <div className='flex flex-col'>
                                <span className="font-bold text-slate-900 dark:text-white text-sm">Transfer Fee Reward</span>
                                <span className="text-[10px] text-slate-500">Yesterday, 4:15 PM</span>
                            </div>
                        </div>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm tracking-tight">+0.113 USDT</span>
                    </div>
                </div>
            </div>

            {/* 3. Integrated Action Button */}
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
    );
};
