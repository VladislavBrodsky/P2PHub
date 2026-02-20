import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Eye, ThumbsUp, Share2, BrainCircuit, Target, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { proService } from '../../../services/proService';

interface AnalyticsCabinetProps {
    impact: (style: 'light' | 'medium' | 'heavy') => void;
}

export const AnalyticsCabinet = ({ impact }: AnalyticsCabinetProps) => {
    const { t } = useTranslation();
    const [stats, setStats] = useState<any>(null);
    const [resonance, setResonance] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
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
        <div className="space-y-6">
            {/* Summary Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

            {/* Predictive Resonance Engine */}
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-linear-to-r from-indigo-500 to-purple-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-white dark:bg-slate-900/80 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/40 dark:border-white/10 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                <BrainCircuit size={20} className="animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('pro_dashboard.analytics.resonance.title')}</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{t('pro_dashboard.analytics.resonance.status')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10">
                            <span className="text-[10px] font-black text-slate-600 dark:text-indigo-400 uppercase tracking-tighter">
                                {t('pro_dashboard.analytics.resonance.confidence', { percent: 94 })}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {resonance?.top_resonance_segments?.map((rec: any, i: number) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all border border-transparent hover:border-indigo-500/30 group/item"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-premium-sm text-indigo-500 group-hover/item:scale-110 transition-transform">
                                    {rec.type === 'scaling' ? <Target size={16} /> : <Sparkles size={16} />}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight mb-1">{rec.headline}</h4>
                                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{rec.reason}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-indigo-500">{(rec.resonance_score * 100).toFixed(0)}%</span>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Resonance</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <button className="w-full mt-6 py-4 bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98]">
                        {t('pro_dashboard.analytics.resonance.action_btn')}
                    </button>
                </div>
            </div>

            {/* Platform Performance Table */}
            <div className="bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[2rem] border border-white/40 dark:border-white/10 shadow-premium overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BarChart3 size={16} className="text-indigo-500" />
                        <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{t('pro_dashboard.analytics.raw_data.title')}</h3>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                                <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{t('pro_dashboard.analytics.raw_data.source')}</th>
                                <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{t('pro_dashboard.analytics.raw_data.reach')}</th>
                                <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{t('pro_dashboard.analytics.raw_data.engagement')}</th>
                                <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{t('pro_dashboard.analytics.raw_data.viral')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                            {stats?.posts?.map((post: any, i: number) => (
                                <tr key={i} className="hover:bg-indigo-50/50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-md bg-slate-900 flex items-center justify-center text-white text-[10px] font-black">
                                                {post.platform.toUpperCase()[0]}
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 capitalize">{post.platform}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-[11px] font-black tabular-nums">{post.views}</td>
                                    <td className="px-6 py-4 text-[11px] font-black tabular-nums text-emerald-500">{post.likes}</td>
                                    <td className="px-6 py-4 text-[11px] font-black tabular-nums text-purple-500">{post.reposts}</td>
                                </tr>
                            ))}
                            {(!stats?.posts || stats.posts.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">{t('pro_dashboard.analytics.raw_data.empty')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
