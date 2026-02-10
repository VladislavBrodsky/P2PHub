import { motion } from 'framer-motion';
import { Users, Zap, Globe2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { apiClient } from '../../api/client';
import { LazyImage } from '../ui/LazyImage';

interface PartnerStatsProps {
    onNavigateToEarn?: () => void;
}

const PartnerAvatar = ({ partner, index }: { partner: any; index: number }) => {
    const [imgError, setImgError] = useState(false);

    if (partner.photo_url && !imgError) {
        let src = partner.photo_url;
        if (src.startsWith('/')) {
            const baseUrl = apiClient.defaults.baseURL?.replace('/api', '') || '';
            src = `${baseUrl}${src}`;
        }
        return (
            <LazyImage
                src={src}
                alt={partner.first_name}
                className="w-full h-full object-cover"
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

export const PartnerStats = ({ onNavigateToEarn }: PartnerStatsProps) => {
    const { t } = useTranslation();
    const [recentPartners, setRecentPartners] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: '12.4k', volume: '$84.2M', countries: '142', lastHourCount: 342 });

    const fetchRecentPartners = async () => {
        try {
            const response = await apiClient.get('/api/partner/recent');
            if (response.status === 200) {
                const { partners, last_hour_count } = response.data;
                setRecentPartners(partners || []);
                setStats(prev => ({ ...prev, lastHourCount: last_hour_count || prev.lastHourCount }));
            }
        } catch (error) {
            console.error("Failed to fetch recent partners", error);
        }
    };

    useEffect(() => {
        fetchRecentPartners();
        // Refresh every 5 minutes as requested
        const interval = setInterval(fetchRecentPartners, 5 * 60 * 1000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <section className="px-4 py-8">
            <div className="grid grid-cols-3 gap-2">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center justify-center p-4 rounded-[2rem] bg-blue-500/10 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)] text-center space-y-1"
                >
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-lg font-black text-(--color-text-primary) uppercase leading-none">{stats.total}</span>
                    <span className="text-[8px] font-bold text-(--color-text-secondary) uppercase tracking-widest leading-none">
                        {t('dashboard.stats.global_partners')}
                    </span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center justify-center p-4 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)] text-center space-y-1"
                >
                    <Zap className="w-4 h-4 text-emerald-500" />
                    <span className="text-lg font-black text-(--color-text-primary) uppercase leading-none">{stats.volume}</span>
                    <span className="text-[8px] font-bold text-(--color-text-secondary) uppercase tracking-widest leading-none">
                        {t('dashboard.stats.volume_shifted')}
                    </span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center justify-center p-4 rounded-[2rem] bg-purple-500/10 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)] text-center space-y-1"
                >
                    <Globe2 className="w-4 h-4 text-purple-500" />
                    <span className="text-lg font-black text-(--color-text-primary) uppercase leading-none">{stats.countries}</span>
                    <span className="text-[8px] font-bold text-(--color-text-secondary) uppercase tracking-widest leading-none">
                        {t('dashboard.stats.countries_active')}
                    </span>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                onClick={onNavigateToEarn}
                className="mt-4 p-3 rounded-2xl bg-(--color-bg-surface)/60 backdrop-blur-sm border border-(--color-border-glass) flex items-center justify-center gap-3 shadow-premium cursor-pointer hover:bg-(--color-bg-surface)/80 transition-colors active:scale-[0.98]"
            >
                <div className="flex -space-x-2">
                    {recentPartners.length > 0 ? (
                        recentPartners.slice(0, 4).map((partner, i) => (
                            <div key={partner.id || i} className="w-7 h-7 rounded-full border-2 border-(--color-bg-deep) bg-slate-800 flex items-center justify-center overflow-hidden shadow-lg transition-transform hover:scale-110">
                                <PartnerAvatar partner={partner} index={i} />
                            </div>
                        ))
                    ) : (
                        // Skeleton/Fallback when no data yet
                        [1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-7 h-7 rounded-full border-2 border-(--color-bg-deep) bg-slate-100/10 dark:bg-white/5 animate-pulse" />
                        ))
                    )}
                </div>
                <p className="text-[10px] font-bold text-(--color-text-secondary)">
                    <Trans i18nKey="dashboard.stats.recent_join" values={{ count: stats.lastHourCount }}>
                        <span className="text-(--color-text-primary) font-black">+{stats.lastHourCount} new partners</span> joined the movement in the last 5m
                    </Trans>
                </p>
            </motion.div>
        </section>
    );
};
