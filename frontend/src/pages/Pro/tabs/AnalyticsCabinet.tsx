import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Eye, ThumbsUp, Share2, BrainCircuit, Target, Sparkles, Zap, Send, X, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { proService } from '../../../services/proService';
import { ROUTES } from '../../../utils/routes';
import { useNavigation } from '../../../hooks/useNavigation';
import { useUser } from '../../../context/UserContext';
import { usePerformance } from '../../../hooks/usePerformance';

interface AnalyticsCabinetProps {
    impact: (style: 'light' | 'medium' | 'heavy') => void;
}

// Parses channel_name which may be stored as a JSON array string e.g. ["@PINTOPAY_SUPERAPP","@PINTOPAY_GROWTH"]
const parseChannelName = (raw: string | null | undefined): string => {
    if (!raw) return '';
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
        try {
            const arr = JSON.parse(trimmed);
            if (Array.isArray(arr) && arr.length > 0) return arr[0];
        } catch {
            // fall through to raw value
        }
    }
    return trimmed;
};

const ResonanceSegment = memo(({ rec, i, t, lowPowerMode }: { rec: any; i: number; t: any; lowPowerMode: boolean }) => (
    <motion.div
        initial={lowPowerMode ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: lowPowerMode ? 0 : 0.3 + i * 0.1 }}
        className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-indigo-500/20 group/item shadow-inner hover:shadow-xl hover:shadow-indigo-500/5"
    >
        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-premium-sm text-indigo-500 group-hover/item:scale-110 transition-transform shrink-0 border border-slate-100 dark:border-white/5">
            {rec.type === 'scaling' ? <Target size={18} /> : <Sparkles size={18} />}
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="text-caption font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-1 truncate">{rec.headline}</h4>
            <p className="text-label font-medium text-slate-500 dark:text-slate-400 leading-snug line-clamp-1">{rec.reason}</p>
        </div>
        <div className="text-right shrink-0 flex flex-col items-end">
            <span className="text-caption font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{(rec.resonance_score * 100).toFixed(0)}%</span>
            <p className="text-label font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">{t('pro_dashboard.analytics.raw_data.reach').slice(0, 4)}</p>
        </div>
    </motion.div>
));

const PostRow = memo(({ post, t, handleRefreshPost, refreshingPost, impact }: { post: any; t: any; handleRefreshPost: (id: number) => void; refreshingPost: number | null; impact: (s: any) => void }) => {
    const isX = post.platform === 'x';
    const PlatformIcon = isX ? () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    ) : Send;
    const platformColor = isX ? 'bg-slate-900 border-white/10' : 'bg-sky-500 border-sky-400/30';

    const score = post.resonance_score || 0;
    const scoreColor = score > 70 ? 'text-emerald-500' : score > 30 ? 'text-orange-500' : 'text-slate-400';

    return (
        <tr className="group relative hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all duration-300 text-xs">
            <td className="pl-4 sm:pl-6 pr-1 sm:pr-3 py-2">
                <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg ${platformColor} border flex items-center justify-center text-white shadow-sm shrink-0`}>
                        <PlatformIcon size={12} className="scale-75 sm:scale-100" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-label sm:text-label font-bold text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[80px] sm:max-w-[140px]">
                            {parseChannelName(post.channel_name) || post.platform}
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="text-label sm:text-label font-bold text-slate-400 uppercase tracking-tighter truncate">
                                {post.platform} • {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            {post.last_check && (
                                <span className="text-label sm:text-label font-bold text-indigo-500/50 uppercase hidden sm:block">
                                    • {t('pro_dashboard.analytics.raw_data.last_sync')} {new Date(post.last_check).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-1 sm:px-3 py-2 text-center">
                <div className="inline-flex flex-col">
                    <span className="text-label sm:text-caption font-bold text-slate-800 dark:text-white tabular-nums leading-none mb-0.5">{post.views.toLocaleString()}</span>
                    <span className="text-label sm:text-label font-bold text-slate-400 uppercase tracking-widest">{t('pro_dashboard.analytics.raw_data.reach')}</span>
                </div>
            </td>
            <td className="px-1 sm:px-3 py-2 text-center">
                <div className="flex flex-col items-center gap-1 sm:gap-1.5">
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="flex items-center gap-0.5">
                            <ThumbsUp size={8} className="text-emerald-500 shrink-0" />
                            <span className="text-label sm:text-label font-bold text-emerald-500 tabular-nums">{post.reactions !== undefined ? post.reactions : post.likes}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <Share2 size={8} className="text-purple-500 shrink-0" />
                            <span className="text-label sm:text-label font-bold text-purple-500 tabular-nums">{post.shares !== undefined ? post.shares : post.reposts}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="hidden sm:block w-12 h-1 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden shrink-0">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((((post.reactions || post.likes) + (post.shares || post.reposts)) / (Math.max(1, post.views))) * 1000, 100)}%` }}
                                className="h-full vibing-blue-animated"
                            />
                        </div>
                        <div className={`px-1 sm:px-1.5 py-0.5 rounded sm:rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-0.5 sm:gap-1 shrink-0 ${scoreColor}`}>
                            <Zap size={6} className={score > 50 ? 'animate-pulse' : ''} />
                            <span className="text-label sm:text-label font-bold tabular-nums">{score}%</span>
                        </div>
                    </div>
                </div>
            </td>
            <td className="pl-1 pr-4 sm:pr-6 py-2 text-right">
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => handleRefreshPost(post.id)}
                        disabled={refreshingPost === post.id}
                        className={`w-6 h-6 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-500 hover:border-indigo-500/30 transition-all flex items-center justify-center shrink-0 ${refreshingPost === post.id ? 'animate-spin text-indigo-500' : ''}`}
                    >
                        <Zap size={10} className="sm:w-3 sm:h-3" />
                    </button>
                    {post.link ? (
                        <a
                            href={post.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => impact('light')}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-white dark:bg-indigo-500/10 border border-slate-200 dark:border-indigo-500/30 text-slate-400 hover:text-indigo-500 hover:shadow-lg transition-all shrink-0"
                        >
                            <Eye size={10} className="sm:w-[14px] sm:h-[14px]" />
                        </a>
                    ) : (
                        <div className="w-6 h-6 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center opacity-40 shrink-0">
                            <X size={10} className="sm:w-3 sm:h-3" />
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
});

export const AnalyticsCabinet = ({ impact }: AnalyticsCabinetProps) => {
    const { t } = useTranslation('pro');
    const { user } = useUser();
    const { navigateTo } = useNavigation();
    const { lowPowerMode } = usePerformance();
    const [stats, setStats] = useState<any>(null);
    const [resonance, setResonance] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshingPost, setRefreshingPost] = useState<number | null>(null);

    const isProPlus = (user?.subscription_plan || "").includes('PLUS');

    const loadData = async (quiet = false) => {
        if (!quiet) setIsLoading(true);
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
            if (!quiet) setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRefreshPost = async (postId: number) => {
        if (refreshingPost) return;
        setRefreshingPost(postId);
        impact('medium');
        try {
            const updatedStats = await proService.refreshPostMetrics(postId);
            setStats(updatedStats);
        } catch (error) {
            console.error('Refresh failed', error);
        } finally {
            setRefreshingPost(null);
            impact('light');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <BrainCircuit size={40} className="text-indigo-500 animate-pulse" />
                <p className="text-label font-bold uppercase tracking-[0.2em] text-indigo-500">{t('pro_dashboard.analytics.decrypting')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            {/* Summary Stats Grid */}
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 transition-all duration-700 ${!isProPlus ? 'blur-md pointer-events-none opacity-50 grayscale' : ''}`}>
                {[
                    { label: t('pro_dashboard.analytics.total_views'), value: stats?.summary?.total_views || 0, icon: Eye, color: 'text-blue-500', trend: stats?.summary?.trends?.views },
                    { label: t('pro_dashboard.analytics.engagement'), value: stats?.summary?.total_reactions || stats?.summary?.total_likes || 0, icon: ThumbsUp, color: 'text-emerald-500', trend: stats?.summary?.trends?.likes },
                    { label: t('pro_dashboard.analytics.viral_reach'), value: stats?.summary?.total_shares || stats?.summary?.total_reposts || 0, icon: Share2, color: 'text-purple-500', trend: stats?.summary?.trends?.reposts },
                    { label: t('pro_dashboard.analytics.success_rate'), value: `${((stats?.summary?.avg_engagement || 0) * 100).toFixed(1)}%`, icon: TrendingUp, color: 'text-orange-500', trend: stats?.summary?.trends?.success }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white/40 dark:bg-white/5 backdrop-blur-3xl p-4 rounded-2xl border border-white/40 dark:border-white/10 shadow-premium-sm relative overflow-hidden group"
                    >
                        <div className={`p-2 rounded-lg bg-slate-100 dark:bg-white/5 w-fit mb-3 transition-transform group-hover:scale-110 duration-500 ${stat.color}`}>
                            <stat.icon size={16} />
                        </div>
                        <p className="text-label font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                        <div className="flex items-end gap-2">
                            <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums leading-none">
                                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                            </p>
                            {stat.trend && (
                                <span className="text-label font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md leading-none mb-0.5 animate-pulse">
                                    {stat.trend}
                                </span>
                            )}
                        </div>

                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <stat.icon size={48} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className={`relative ${!isProPlus ? 'max-h-[500px] overflow-hidden rounded-2xl' : ''}`}>
                <div className={`space-y-6 transition-all duration-700 ${!isProPlus ? 'blur-md pointer-events-none opacity-30 select-none' : ''}`}>
                    <div className="pro-card-extreme bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-3xl relative overflow-hidden group noise-overlay">
                        <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -mr-32 -mt-32 animate-pulse" />

                        <div className="circuit-decor opacity-10" />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-xl shadow-indigo-500/10 border border-indigo-500/10 shrink-0 pulse-ring-indigo">
                                    <BrainCircuit size={24} className="animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-button font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                                        {t('pro_dashboard.analytics.resonance.title')}
                                    </h3>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div className={`w-1.5 h-1.5 rounded-full ${resonance?.resonance_engine_status === 'gathering_data' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'} animate-pulse`} />
                                        <span className={`text-label font-bold ${resonance?.resonance_engine_status === 'gathering_data' ? 'text-amber-500' : 'text-emerald-500'} uppercase tracking-widest leading-none`}>
                                            {resonance?.resonance_engine_status === 'gathering_data' ? t('pro_dashboard.analytics.resonance.gathering_data') : t('pro_dashboard.analytics.resonance.status')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className={`px-4 py-2 rounded-2xl border shrink-0 shadow-sm flex items-center justify-center ${resonance?.resonance_engine_status === 'gathering_data' ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/10' : 'bg-slate-50 dark:bg-indigo-500/5 border-slate-100 dark:border-indigo-500/10'}`}>
                                <span className={`text-label font-bold uppercase tracking-tighter whitespace-nowrap ${resonance?.resonance_engine_status === 'gathering_data' ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                    {resonance?.resonance_engine_status === 'gathering_data' ? t('pro_dashboard.analytics.resonance.needs_more_posts', { count: resonance?.generations_needed || 10 }) : t('pro_dashboard.analytics.resonance.confidence', { percent: resonance?.confidence || 94 })}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {resonance?.resonance_engine_status === 'gathering_data' ? (
                                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl text-center">
                                    <Lock size={24} className="text-slate-400 mb-3" />
                                    <h4 className="text-caption font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-2">{t('pro_dashboard.analytics.resonance.insufficient_data')}</h4>
                                    <p className="text-label font-medium text-slate-500 dark:text-slate-400 leading-snug max-w-[200px] mb-4">
                                        {t('pro_dashboard.analytics.resonance.insufficient_data_desc', { count: resonance?.generations_needed || 10 })}
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
                                    <ResonanceSegment key={i} rec={rec} i={i} t={t} lowPowerMode={lowPowerMode} />
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
                                className={`w-full h-12 text-white rounded-xl font-bold text-label uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${resonance?.resonance_engine_status === 'gathering_data' ? 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-slate-300 shadow-xl' : 'vibing-blue-animated shadow-xl shadow-indigo-500/20'}`}
                            >
                                <Zap size={14} className={resonance?.resonance_engine_status === 'gathering_data' ? '' : 'animate-pulse'} />
                                {resonance?.resonance_engine_status === 'gathering_data' ? t('pro_dashboard.analytics.resonance.goto_studio') : t('pro_dashboard.analytics.resonance.action_btn')}
                            </button>
                            <p className="text-center text-label font-bold text-slate-400 uppercase tracking-widest mt-3 opacity-60">
                                Neural Engine 2.0
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/40 dark:border-white/10 shadow-premium overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white/50 dark:bg-white/2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                                    <BarChart3 size={14} />
                                </div>
                                <h3 className="text-label font-bold text-slate-900 dark:text-white uppercase tracking-widest">{t('pro_dashboard.analytics.raw_data.title')}</h3>
                            </div>

                            <button
                                onClick={() => { impact('medium'); loadData(); }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-label font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 hover:bg-white dark:hover:bg-white/10 hover:text-indigo-500 hover:border-indigo-500/30 transition-all active:scale-95"
                            >
                                {isLoading ? t('pro_dashboard.analytics.raw_data.syncing') : t('pro_dashboard.analytics.raw_data.sync_all')}
                            </button>
                        </div>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-white/5">
                                        <th className="pl-4 sm:pl-6 pr-1 sm:pr-3 py-3 text-label sm:text-label font-bold text-slate-400 uppercase tracking-widest">{t('pro_dashboard.analytics.raw_data.source')}</th>
                                        <th className="px-1 sm:px-3 py-3 text-label sm:text-label font-bold text-slate-400 uppercase tracking-widest text-center">{t('pro_dashboard.analytics.raw_data.reach')}</th>
                                        <th className="px-1 sm:px-3 py-3 text-label sm:text-label font-bold text-slate-400 uppercase tracking-widest text-center">{t('pro_dashboard.analytics.raw_data.engagement')}</th>
                                        <th className="pl-1 pr-4 sm:pr-6 py-3 text-label sm:text-label font-bold text-slate-400 uppercase tracking-widest text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {stats?.posts?.map((post: any, i: number) => (
                                        <PostRow key={post.id || i} post={post} t={t} handleRefreshPost={handleRefreshPost} refreshingPost={refreshingPost} impact={impact} />
                                    ))}
                                    {(!stats?.posts || stats.posts.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Target size={24} className="text-slate-200 dark:text-slate-800" />
                                                    <p className="text-label font-bold text-slate-400 uppercase tracking-widest">{t('pro_dashboard.analytics.raw_data.empty')}</p>
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
                        className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center bg-linear-to-b from-transparent via-white/40 dark:via-slate-900/40 to-white/90 dark:to-slate-950/90 backdrop-blur-[2px] rounded-2xl"
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

                        <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
                            {t('pro_dashboard.analytics.locked_plus.title')}
                        </h3>
                        <p className="text-label font-bold text-slate-500 dark:text-slate-400 max-w-[240px] mb-8 leading-relaxed uppercase tracking-wide">
                            {t('pro_dashboard.analytics.locked_plus.desc')}
                        </p>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                impact('heavy');
                                navigateTo(ROUTES.SUBSCRIPTION);
                            }}
                            className="group relative px-8 py-3.5 rounded-2xl bg-linear-to-r from-purple-600 via-fuchsia-500 to-purple-600 bg-size-[200%_auto] animate-gradient-xy text-white text-label font-bold uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(168,85,247,0.4)] border border-white/20 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                            <div className="relative z-10 flex items-center gap-2">
                                <Sparkles size={14} className="animate-pulse" />
                                {t('pro_dashboard.analytics.locked_plus.upgrade_btn')}
                            </div>
                        </motion.button>

                        <p className="mt-6 text-label font-bold text-slate-400 uppercase tracking-[0.3em] opacity-50">
                            {t('pro_dashboard.analytics.raw_data.access_restricted')}
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

