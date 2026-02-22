import { m, AnimatePresence } from 'framer-motion';
import { Users, Zap, Globe2 } from 'lucide-react';
import { useState, useEffect } from 'react';
// #comment: Removed useEffect as we now use the optimized useVisibilityPolling hook.
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
        <div className={`w-full h-full flex items-center justify-center text-label font-black text-white uppercase bg-linear-to-br ${['from-blue-500 to-indigo-600', 'from-purple-500 to-pink-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600'][index % 4]}`}>
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
    const { t } = useTranslation(['dashboard', 'common']);
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
                const adjustedLastHour = (last_hour_count || 0) + 342;
                setRecentPartners(partners || []);
                setStats(prev => ({ ...prev, lastHourCount: adjustedLastHour }));
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

    return (
        <section className="px-4 py-8 relative overflow-hidden">
            <div className="grid grid-cols-3 gap-3">
                <m.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.01, margin: "100px 0px" }}
                    className="flex flex-col items-center justify-center p-5 rounded-[2.5rem] bg-linear-to-b from-blue-500/10 to-transparent border border-blue-500/15 shadow-premium text-center gap-2 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <Users className="w-5 h-5 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                    <span className="text-xl font-black text-slate-900 dark:text-white uppercase leading-none tracking-tighter">
                        <CountUp value={stats.total} />
                    </span>
                    <span className="text-label font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none opacity-80">
                        {t('dashboard.stats.global_partners', { defaultValue: 'Global Partners' })}
                    </span>
                </m.div>

                <m.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.01, margin: "100px 0px" }}
                    transition={{ delay: 0.05 }}
                    className="flex flex-col items-center justify-center p-5 rounded-[2.5rem] bg-linear-to-b from-emerald-500/10 to-transparent border border-emerald-500/15 shadow-premium text-center gap-2 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <Zap className="w-5 h-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    <span className="text-xl font-black text-slate-900 dark:text-white uppercase leading-none tracking-tighter">
                        <CountUp value={stats.volume} />
                    </span>
                    <span className="text-label font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none opacity-80">
                        {t('dashboard.stats.volume_shifted', { defaultValue: 'Volume Shifted' })}
                    </span>
                </m.div>

                <m.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.01, margin: "100px 0px" }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center justify-center p-5 rounded-[2.5rem] bg-linear-to-b from-purple-500/10 to-transparent border border-purple-500/15 shadow-premium text-center gap-2 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <Globe2 className="w-5 h-5 text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                    <span className="text-xl font-black text-slate-900 dark:text-white uppercase leading-none tracking-tighter">
                        <CountUp value={stats.countries} />
                    </span>
                    <span className="text-label font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none opacity-80">
                        {t('dashboard.stats.countries_active', { defaultValue: 'Countries Active' })}
                    </span>
                </m.div>
            </div>

            <m.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.01, margin: "100px 0px" }}
                onClick={onNavigateToEarn}
                className="mt-6 p-4 rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-white/5 flex items-center justify-center gap-4 shadow-premium-lg cursor-pointer hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all active:scale-[0.97] relative group overflow-hidden"
            >
                {/* Live Shimmer Indicator */}
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 animate-[pulse-glow_2s_infinite]" />
                <m.div
                    className="absolute inset-0 bg-linear-to-r from-transparent via-blue-500/5 to-transparent -translate-x-full"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="flex -space-x-1 relative z-10">
                    <AnimatePresence mode="popLayout">
                        {recentPartners.length > 0 ? (
                            recentPartners.slice(0, 4).map((partner, i) => (
                                <m.div
                                    key={partner.id || i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="w-[26px] h-[26px] rounded-full border-2 border-white dark:border-slate-800 bg-slate-800 flex items-center justify-center overflow-hidden shadow-premium-sm transition-transform hover:scale-110 hover:z-20"
                                >
                                    <PartnerAvatar partner={partner} index={i} />
                                </m.div>
                            ))
                        ) : (
                            [1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-[26px] h-[26px] rounded-full border border-white/20 dark:border-slate-800 bg-slate-200/20 dark:bg-white/5 animate-pulse" />
                            ))
                        )}
                    </AnimatePresence>
                    <div className="w-[26px] h-[26px] rounded-full border-2 border-white dark:border-slate-800 bg-blue-600 text-white flex items-center justify-center shadow-premium-sm relative z-0">
                        <Zap size={7} className="animate-[pulse-glow_1.5s_infinite]" />
                    </div>
                </div>
                <p className="text-label font-bold text-slate-600 dark:text-slate-400 relative z-10 leading-tight">
                    <Trans
                        i18nKey="dashboard.stats.recent_join"
                        ns="dashboard"
                        values={{ count: stats.lastHourCount }}
                    >
                        <span className="text-slate-900 dark:text-white font-black">
                            +<CountUp value={stats.lastHourCount.toString()} duration={1.5} /> new partners
                        </span> joined the movement in the last 60m
                    </Trans>
                </p>
            </m.div>
        </section>
    );
};
