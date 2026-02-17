import { motion } from 'framer-motion';
import { Users, Zap, Globe2 } from 'lucide-react';
import { useState, useEffect } from 'react';
// #comment: Removed useEffect as we now use the optimized useVisibilityPolling hook.
import { useTranslation, Trans } from 'react-i18next';
import { apiClient } from '../../api/client';
import { LazyImage } from '../ui/LazyImage';
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
        <div className={`w-full h-full flex items-center justify-center text-[10px] font-black text-white uppercase bg-linear-to-br ${['from-blue-500 to-indigo-600', 'from-purple-500 to-pink-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600'][index % 4]}`}>
            {(partner.first_name?.[0] || partner.username?.[0] || '?')}
        </div>
    );
};

const CountUp = ({ value, duration = 2 }: { value: string; duration?: number }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const target = parseFloat(value.replace(/[^0-9.]/g, ''));
    const suffix = value.replace(/[0-9.]/g, '');

    useEffect(() => {
        let start = 0;
        const totalFrames = duration * 60;
        const increment = target / totalFrames;

        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                setDisplayValue(target);
                clearInterval(timer);
            } else {
                setDisplayValue(start);
            }
        }, 1000 / 60);

        return () => clearInterval(timer);
    }, [target, duration]);

    return <span>{displayValue % 1 === 0 ? displayValue : displayValue.toFixed(1)}{suffix}</span>;
};

export const PartnerStats = ({ onNavigateToEarn }: PartnerStatsProps) => {
    const { t } = useTranslation();
    const [recentPartners, setRecentPartners] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: '12.4k', volume: '$84.2M', countries: '142', lastHourCount: 342 });

    useVisibilityPolling(async () => {
        try {
            const response = await apiClient.get('/api/partner/recent');
            if (response.status === 200 && response.data) {
                const { partners, last_hour_count } = response.data;
                setRecentPartners(partners || []);
                setStats(prev => ({ ...prev, lastHourCount: last_hour_count || prev.lastHourCount }));
            }
        } catch (error) {
            console.error("Failed to fetch recent partners", error);
        }
    }, 5 * 60 * 1000);

    return (
        <section className="px-4 py-8 relative overflow-hidden">
            <div className="grid grid-cols-3 gap-3">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center justify-center p-5 rounded-[2.5rem] bg-linear-to-b from-blue-500/10 to-transparent border border-blue-500/15 shadow-premium text-center space-y-2 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <Users className="w-5 h-5 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                    <span className="text-xl font-black text-slate-900 dark:text-white uppercase leading-none tracking-tighter">
                        <CountUp value={stats.total} />
                    </span>
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none opacity-80">
                        {t('dashboard.stats.global_partners')}
                    </span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center justify-center p-5 rounded-[2.5rem] bg-linear-to-b from-emerald-500/10 to-transparent border border-emerald-500/15 shadow-premium text-center space-y-2 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <Zap className="w-5 h-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    <span className="text-xl font-black text-slate-900 dark:text-white uppercase leading-none tracking-tighter">
                        <CountUp value={stats.volume} />
                    </span>
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none opacity-80">
                        {t('dashboard.stats.volume_shifted')}
                    </span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center justify-center p-5 rounded-[2.5rem] bg-linear-to-b from-purple-500/10 to-transparent border border-purple-500/15 shadow-premium text-center space-y-2 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <Globe2 className="w-5 h-5 text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                    <span className="text-xl font-black text-slate-900 dark:text-white uppercase leading-none tracking-tighter">
                        <CountUp value={stats.countries} />
                    </span>
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none opacity-80">
                        {t('dashboard.stats.countries_active')}
                    </span>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onClick={onNavigateToEarn}
                className="mt-6 p-4 rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-white/5 flex items-center justify-center gap-4 shadow-premium-lg cursor-pointer hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all active:scale-[0.97] relative group overflow-hidden"
            >
                {/* Live Shimmer Indicator */}
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 animate-pulse" />
                <motion.div
                    className="absolute inset-0 bg-linear-to-r from-transparent via-blue-500/5 to-transparent -translate-x-full"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="flex -space-x-2 relative z-10">
                    {recentPartners.length > 0 ? (
                        recentPartners.slice(0, 4).map((partner, i) => (
                            <div key={partner.id || i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-800 flex items-center justify-center overflow-hidden shadow-premium-sm transition-transform hover:scale-110 hover:z-20">
                                <PartnerAvatar partner={partner} index={i} />
                            </div>
                        ))
                    ) : (
                        [1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100/10 dark:bg-white/5 animate-pulse" />
                        ))
                    )}
                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-blue-600 text-white flex items-center justify-center shadow-premium-sm relative z-0">
                        <Zap size={10} className="animate-pulse" />
                    </div>
                </div>
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 relative z-10 leading-tight">
                    <Trans i18nKey="dashboard.stats.recent_join" values={{ count: stats.lastHourCount }}>
                        <span className="text-slate-900 dark:text-white font-black">+{stats.lastHourCount} partners</span> joined the network in the last 60m
                    </Trans>
                </p>
            </motion.div>
        </section>
    );
};
