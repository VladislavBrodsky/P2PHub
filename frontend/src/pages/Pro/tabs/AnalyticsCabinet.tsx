import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Eye, ThumbsUp, Share2, BrainCircuit, Target, Sparkles, Zap, Send, X, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { proService } from '../../../services/proService';
import { useUser } from '../../../context/UserContext';

interface AnalyticsCabinetProps {
    impact: (style: 'light' | 'medium' | 'heavy') => void;
}

export const AnalyticsCabinet = ({ impact }: AnalyticsCabinetProps) => {
    const { t } = useTranslation();
    const { user } = useUser();
    const [stats, setStats] = useState<any>(null);
    const [resonance, setResonance] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isProPlus = (user?.subscription_plan || "").includes('PLUS');

    useEffect(() => {
        const loadData = async () => {
            try {
                // If not Pro+, we might still want to fetch data for the "preview" blur effect 
                // but the backend might restrict it. Assuming it's allowed for preview.
                const [statsData, resonanceData] = await Promise.all([
                    proService.getAnalyticsCabinet(),
                    proService.getPredictiveResonance()
                ]);
                setStats(statsData);
                setResonance(resonanceData);
            } catch (error) {
                console.error('Failed to load analytics', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <BrainCircuit size={40} className="text-indigo-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">{t('pro_dashboard.analytics.decrypting')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            {/* Summary Stats Grid */}
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 transition-all duration-700 ${!isProPlus ? 'blur-md pointer-events-none opacity-50 grayscale' : ''}`}>
                {[
                    { label: t('pro_dashboard.analytics.total_views'), value: stats?.summary?.total_views || 0, icon: Eye, color: 'text-blue-500' },
                    { label: t('pro_dashboard.analytics.engagement'), value: stats?.summary?.total_likes || 0, icon: ThumbsUp, color: 'text-emerald-500' },
                    { label: t('pro_dashboard.analytics.viral_reach'), value: stats?.summary?.total_reposts || 0, icon: Share2, color: 'text-purple-500' },
                    { label: t('pro_dashboard.analytics.success_rate'), value: `${((stats?.summary?.avg_engagement || 0) * 100).toFixed(1)}%`, icon: TrendingUp, color: 'text-orange-500' }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white/40 dark:bg-white/5 backdrop-blur-3xl p-4 rounded-2xl border border-white/40 dark:border-white/10 shadow-premium-sm"
                    >
                        <div className={`p-2 rounded-lg bg-slate-100 dark:bg-white/5 w-fit mb-3 ${stat.color}`}>
                            <stat.icon size={16} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums leading-none">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="relative">
                <div className={`space-y-6 transition-all duration-700 ${!isProPlus ? 'blur-md pointer-events-none opacity-30 select-none' : ''}`}>
                    <div className="pro-card-extreme bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2rem] p-6 border border-slate-200 dark:border-white/10 shadow-3xl relative overflow-hidden group noise-overlay">
                        <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -mr-32 -mt-32 animate-pulse" />

                        <div className="circuit-decor opacity-10" />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-xl shadow-indigo-500/10 border border-indigo-500/10 shrink-0 pulse-ring-indigo">
                                    <BrainCircuit size={24} className="animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-[14px] sm:text-[16px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                                        {t('pro_dashboard.analytics.resonance.title')}
                                    </h3>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div className={`w-1.5 h-1.5 rounded-full ${resonance?.resonance_engine_status === 'gathering_data' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'} animate-pulse`} />
                                        <span className={`text-[9px] font-black ${resonance?.resonance_engine_status === 'gathering_data' ? 'text-amber-500' : 'text-emerald-500'} uppercase tracking-widest leading-none`}>
                                            {resonance?.resonance_engine_status === 'gathering_data' ? 'GATHERING DATA...' : t('pro_dashboard.analytics.resonance.status')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className={`px-4 py-2 rounded-2xl border shrink-0 shadow-sm flex items-center justify-center ${resonance?.resonance_engine_status === 'gathering_data' ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/10' : 'bg-slate-50 dark:bg-indigo-500/5 border-slate-100 dark:border-indigo-500/10'}`}>
                                <span className={`text-[10px] font-black uppercase tracking-tighter whitespace-nowrap ${resonance?.resonance_engine_status === 'gathering_data' ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                    {resonance?.resonance_engine_status === 'gathering_data' ? `NEEDS ${resonance?.generations_needed || 10} POSTS` : t('pro_dashboard.analytics.resonance.confidence', { percent: resonance?.confidence || 94 })}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {resonance?.resonance_engine_status === 'gathering_data' ? (
                                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl text-center">
                                    <Lock size={24} className="text-slate-400 mb-3" />
                                    <h4 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Insufficient Data</h4>
                                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-snug max-w-[200px] mb-4">
                                        Publish {resonance?.generations_needed || 10} more high-quality posts to calibrate the AI properly.
                                    </p>

                                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden flex items-center shadow-inner">
                                        <motion.div
                                            className="bg-indigo-500 h-full rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(Math.max(0, 10 - (resonance?.generations_needed || 10)) / 10) * 100}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                resonance?.top_resonance_segments?.map((rec: any, i: number) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.3 + i * 0.1 }}
                                        className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-indigo-500/20 group/item shadow-inner hover:shadow-xl hover:shadow-indigo-500/5"
                                    >
                                        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-premium-sm text-indigo-500 group-hover/item:scale-110 transition-transform shrink-0 border border-slate-100 dark:border-white/5">
                                            {rec.type === 'scaling' ? <Target size={18} /> : <Sparkles size={18} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1 truncate">{rec.headline}</h4>
                                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-snug line-clamp-1">{rec.reason}</p>
                                        </div>
                                        <div className="text-right shrink-0 flex flex-col items-end">
                                            <span className="text-[12px] font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{(rec.resonance_score * 100).toFixed(0)}%</span>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Reso</p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        <div className="pt-6 relative z-10">
                            <button
                                onClick={() => {
                                    impact('heavy');
                                    if (resonance?.resonance_engine_status === 'gathering_data') {
                                        window.dispatchEvent(new CustomEvent('nav-pro-tab', { detail: 'studio' }));
                                    } else {
                                        const detail = resonance?.next_best_action
                                            ? { tab: 'studio', action: 'set_studio_params', params: { postType: resonance.next_best_action.post_type, audience: resonance.next_best_action.target_audience } }
                                            : { tab: 'studio' };
                                        window.dispatchEvent(new CustomEvent('nav-pro-tab', { detail }));
                                    }
                                }}
                                className={`w-full h-12 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${resonance?.resonance_engine_status === 'gathering_data' ? 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-slate-300 shadow-xl' : 'vibing-blue-animated shadow-xl shadow-indigo-500/20'}`}
                            >
                                <Zap size={14} className={resonance?.resonance_engine_status === 'gathering_data' ? '' : 'animate-pulse'} />
                                {resonance?.resonance_engine_status === 'gathering_data' ? 'GOTO STUDIO TO PUBLISH' : t('pro_dashboard.analytics.resonance.action_btn')}
                            </button>
                            <p className="text-center text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-3 opacity-60">
                                Neural Engine 2.0
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[2rem] border border-white/40 dark:border-white/10 shadow-premium overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/30 dark:bg-white/2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                                    <BarChart3 size={14} />
                                </div>
                                <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{t('pro_dashboard.analytics.raw_data.title')}</h3>
                            </div>
                        </div>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-white/5">
                                        <th className="pl-6 pr-3 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('pro_dashboard.analytics.raw_data.source')}</th>
                                        <th className="px-3 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">{t('pro_dashboard.analytics.raw_data.reach')}</th>
                                        <th className="px-3 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">{t('pro_dashboard.analytics.raw_data.engagement')}</th>
                                        <th className="pl-3 pr-6 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {stats?.posts?.map((post: any, i: number) => {
                                        const PlatformIcon = post.platform === 'x' ? Zap : Send;
                                        const platformColor = post.platform === 'x' ? 'bg-slate-900' : 'bg-sky-500';

                                        return (
                                            <tr key={i} className="group relative hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all duration-300">
                                                <td className="pl-6 pr-3 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`w-7 h-7 rounded-lg ${platformColor} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                                            <PlatformIcon size={12} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{post.platform}</span>
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                                                                {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3.5 text-center">
                                                    <div className="inline-flex flex-col">
                                                        <span className="text-[12px] font-black text-slate-800 dark:text-white tabular-nums leading-none">{post.views.toLocaleString()}</span>
                                                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Views</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3.5 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="flex items-center gap-0.5">
                                                                <ThumbsUp size={8} className="text-emerald-500" />
                                                                <span className="text-[10px] font-black text-emerald-500 tabular-nums">{post.likes}</span>
                                                            </div>
                                                            <div className="w-px h-2 bg-slate-200 dark:bg-white/10" />
                                                            <div className="flex items-center gap-0.5">
                                                                <Share2 size={8} className="text-purple-500" />
                                                                <span className="text-[10px] font-black text-purple-500 tabular-nums">{post.reposts}</span>
                                                            </div>
                                                        </div>
                                                        <div className="w-10 h-1 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full vibing-blue-animated"
                                                                style={{ width: `${Math.min(((post.likes + post.reposts) / (post.views || 1)) * 500, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="pl-3 pr-6 py-3.5 text-right">
                                                    {post.link ? (
                                                        <a
                                                            href={post.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={() => impact('light')}
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-500 hover:border-indigo-500/30 hover:shadow-lg transition-all active:scale-90"
                                                        >
                                                            <Eye size={14} />
                                                        </a>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center opacity-40">
                                                            <X size={12} />
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {(!stats?.posts || stats.posts.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Target size={24} className="text-slate-200 dark:text-slate-800" />
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('pro_dashboard.analytics.raw_data.empty')}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {!isProPlus && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center bg-linear-to-b from-transparent via-white/40 dark:via-slate-900/40 to-white/90 dark:to-slate-950/90 backdrop-blur-[2px] rounded-[2rem]"
                    >
                        <div className="relative mb-6">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute inset-x-[-20px] inset-y-[-20px] bg-purple-500/20 blur-2xl rounded-full"
                            />
                            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-purple-500 shadow-2xl relative z-10 border border-purple-500/20">
                                <Lock size={32} />
                            </div>
                        </div>

                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
                            {t('pro_dashboard.analytics.locked_plus.title')}
                        </h3>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 max-w-[240px] mb-8 leading-relaxed uppercase tracking-wide">
                            {t('pro_dashboard.analytics.locked_plus.desc')}
                        </p>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                impact('heavy');
                                window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'subscription' }));
                            }}
                            className="group relative px-8 py-3.5 rounded-2xl bg-linear-to-r from-purple-600 via-fuchsia-500 to-purple-600 bg-size-[200%_auto] animate-gradient-xy text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(168,85,247,0.4)] border border-white/20 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                            <div className="relative z-10 flex items-center gap-2">
                                <Sparkles size={14} className="animate-pulse" />
                                {t('pro_dashboard.analytics.locked_plus.upgrade_btn')}
                            </div>
                        </motion.button>

                        <p className="mt-6 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-50">
                            Neural Engine Access Restricted
                        </p>
                    </motion.div>
                )}
            </div>
        </div >
    );
};

