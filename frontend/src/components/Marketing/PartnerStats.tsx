import { m, AnimatePresence } from 'framer-motion';
import { Users, Zap, Globe2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { apiClient } from '../../api/client';
import { useVisibilityPolling } from '../../hooks/useVisibilityPolling';
import { getApiUrl } from '../../utils/api';

interface PartnerStatsProps {
    onNavigateToEarn?: () => void;
}

const PartnerAvatar = ({ partner, index }: { partner: any; index: number }) => {
    const [imgError, setImgError] = useState(false);

    // Handle both new (photo_file_id) and old (photo_url) for backwards compatibility
    if ((partner.photo_file_id || partner.photo_url) && !imgError) {
        const photoUrl = partner.photo_file_id
            ? `${getApiUrl()}/api/partner/photo/${partner.photo_file_id}`
            : partner.photo_url;

        return (
            <img
                src={photoUrl}
                alt={partner.first_name || ''}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={() => setImgError(true)}
            />
        );
    }

    return (
        <div className={`w-full h-full flex items-center justify-center text-label font-bold text-white uppercase bg-linear-to-br ${['from-blue-500 to-indigo-600', 'from-purple-500 to-pink-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600'][index % 4]}`}>
            {(partner.first_name?.[0] || partner.username?.[0] || '?')}
        </div>
    );
};

const CountUp = ({ value, duration = 2 }: { value: string; duration?: number }) => {
    const [displayValue, setDisplayValue] = useState(0);

    // Extract prefix (non-numeric at start), target number, and suffix (non-numeric at end)
    const match = value.match(/^([^0-9.]*)([0-9.]+)(.*)$/);
    const prefix = match ? match[1] : '';
    const target = match ? parseFloat(match[2]) : 0;
    const suffix = match ? match[3] : '';

    useEffect(() => {
        const startTime = performance.now();
        const durationMs = duration * 1000;

        const update = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / durationMs, 1);

            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = easeProgress * target;

            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                setDisplayValue(target);
            }
        };

        requestAnimationFrame(update);
    }, [target, duration]);

    // Format display value: handle decimals if the target had them
    const formattedNum = target % 1 === 0
        ? Math.floor(displayValue).toString()
        : displayValue.toFixed(1);

    return <span>{prefix}{formattedNum}{suffix}</span>;
};

export const PartnerStats = ({ onNavigateToEarn }: PartnerStatsProps) => {
    const { t } = useTranslation(['dashboard', 'common', 'marketing', 'social']);
    const [recentPartners, setRecentPartners] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: '5.0K+', volume: '$0', countries: '142', lastHourCount: 342 });

    // Initial load and polling for stats
    useVisibilityPolling(async () => {
        try {
            // Parallel fetch for recent partners and global stats
            const [recentRes, statsRes] = await Promise.all([
                apiClient.get('/api/partner/recent'),
                apiClient.get('/api/partner/stats/public')
            ]);

            if (recentRes.status === 200 && recentRes.data) {
                const { partners, last_hour_count } = recentRes.data;
                const baseCount = last_hour_count || 0;
                // Ensure count is between 333 and 582
                const adjustedLastHour = 333 + (baseCount % (582 - 333 + 1));
                setRecentPartners(partners || []);
                setStats(prev => ({
                    ...prev,
                    lastHourCount: prev.lastHourCount === 342 ? adjustedLastHour : Math.max(prev.lastHourCount, adjustedLastHour)
                }));
            }

            if (statsRes.status === 200 && statsRes.data) {
                const { total_partners, volume_usdt, countries } = statsRes.data;
                const adjustedTotal = (total_partners || 0) + 5000;

                // Format values for display (e.g., 12400 -> 12.4K+)
                const formatCount = (val: number) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M+`;
                    if (val >= 1000) return `${(val / 1000).toFixed(1)}K+`;
                    return `${val}+`;
                };

                const formatVolume = (val: number) => {
                    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
                    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
                    return `$${val}`;
                };

                setStats(prev => ({
                    ...prev,
                    total: formatCount(adjustedTotal),
                    volume: formatVolume(volume_usdt),
                    countries: countries.toString()
                }));
            }
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        }
    }, 5 * 60 * 1000);

    // Simulate real-time growth for the LIVE feel
    useEffect(() => {
        let timeoutId: number;

        const scheduleNextIncrement = () => {
            // Random interval between 4 and 10 seconds
            const nextInterval = Math.floor(Math.random() * 6000) + 4000;
            timeoutId = window.setTimeout(() => {
                setStats(prev => ({ ...prev, lastHourCount: prev.lastHourCount + 1 }));
                scheduleNextIncrement();
            }, nextInterval);
        };

        scheduleNextIncrement();

        return () => window.clearTimeout(timeoutId);
    }, []);


    return (
        <section className="px-4 py-8 relative w-full max-w-2xl mx-auto">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <m.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="glass-panel-premium flex flex-col items-center justify-center p-2 py-5 sm:p-5 sm:py-7 rounded-2xl text-center gap-2 relative overflow-hidden group transition-all hover:scale-[1.02] duration-500 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)]"
                >
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-1 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]">
                        <Users className="w-5 h-5 text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.4)]" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase leading-none tracking-tighter drop-shadow-sm">
                        <CountUp value={stats.total} />
                    </span>
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] leading-tight opacity-70 min-h-[24px] sm:min-h-0 flex items-center">
                        {t('dashboard:stats.global_partners')}
                    </span>
                </m.div>

                <m.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 }}
                    className="glass-panel-premium flex flex-col items-center justify-center p-2 py-5 sm:p-5 sm:py-7 rounded-2xl text-center gap-2 relative overflow-hidden group transition-all hover:scale-[1.02] duration-500 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)]"
                >
                    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-1 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]">
                        <Zap className="w-5 h-5 text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase leading-none tracking-tighter drop-shadow-sm">
                        <CountUp value={stats.volume} />
                    </span>
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] leading-tight opacity-70 min-h-[24px] sm:min-h-0 flex items-center">
                        {t('dashboard:stats.volume_shifted')}
                    </span>
                </m.div>

                <m.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="glass-panel-premium flex flex-col items-center justify-center p-2 py-5 sm:p-5 sm:py-7 rounded-2xl text-center gap-2 relative overflow-hidden group transition-all hover:scale-[1.02] duration-500 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)]"
                >
                    <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-1 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]">
                        <Globe2 className="w-5 h-5 text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase leading-none tracking-tighter drop-shadow-sm">
                        <CountUp value={stats.countries} />
                    </span>
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] leading-tight opacity-70 min-h-[24px] sm:min-h-0 flex items-center">
                        {t('dashboard:stats.countries_active')}
                    </span>
                </m.div>
            </div>

            <m.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onClick={onNavigateToEarn}
                className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 flex flex-row items-center justify-center gap-4 sm:gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] cursor-pointer hover:bg-white/80 dark:hover:bg-slate-900/80 transition-all active:scale-[0.98] relative group overflow-hidden w-full px-5"
            >
                {/* Viral Background Glow */}
                <m.div
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -inset-20 bg-radial from-blue-500/10 via-transparent to-transparent pointer-events-none"
                />

                {/* Live Indicator */}
                <m.div
                    animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.9, 1, 0.9]
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/25 backdrop-blur-md z-20 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                >
                    <div className="relative flex h-2 w-2">
                        <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                        <div className="relative rounded-full h-full w-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-red-500 leading-none">LIVE</span>
                </m.div>

                <div className="flex -space-x-2.5 shrink-0 relative z-10">
                    <AnimatePresence mode="popLayout">
                        {recentPartners.length > 0 ? (
                            recentPartners.slice(0, 3).map((partner, i) => (
                                <m.div
                                    key={partner.id || i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] rounded-full border-2 border-white dark:border-slate-800 bg-slate-800 flex items-center justify-center overflow-hidden shadow-premium-sm transition-transform hover:scale-110 relative z-10"
                                >
                                    <PartnerAvatar partner={partner} index={i} />
                                </m.div>
                            ))
                        ) : (
                            [1, 2, 3].map((i) => (
                                <div key={i} className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] rounded-full border-2 border-white dark:border-slate-800 bg-slate-200/20 dark:bg-white/5 animate-pulse" />
                            ))
                        )}
                    </AnimatePresence>
                    <div className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] rounded-full border-2 border-white dark:border-white/10 bg-blue-600 text-white flex items-center justify-center shadow-premium-sm relative z-0">
                        <Zap size={10} className="animate-[pulse-glow_1.5s_infinite]" />
                    </div>
                </div>

                <div className="flex-1 min-w-0 relative z-10 pr-20">
                    <p className="text-label sm:text-caption font-semibold text-slate-600 dark:text-slate-300 leading-snug">
                        <Trans
                            i18nKey="stats.recent_join"
                            ns="dashboard"
                            values={{ count: stats.lastHourCount }}
                        >
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 font-bold">
                                +<CountUp value={stats.lastHourCount.toString()} duration={1.5} /> new partners
                            </span> joined Partner Center in the past 60 minutes
                        </Trans>
                    </p>
                </div>

                <m.div
                    className="absolute inset-0 bg-linear-to-r from-transparent via-blue-500/5 to-transparent -translate-x-full pointer-events-none"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
            </m.div>
        </section>
    );
};
