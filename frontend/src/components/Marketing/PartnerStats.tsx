import { motion } from 'framer-motion';
import { Users, Zap, Globe2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';

const PROD_URL = 'https://p2phub-backend-production.up.railway.app';
const DEV_URL = 'http://localhost:8000';
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? DEV_URL : PROD_URL);

interface PartnerStatsProps {
    onNavigateToEarn?: () => void;
}

export const PartnerStats = ({ onNavigateToEarn }: PartnerStatsProps) => {
    const { t } = useTranslation();
    const [recentPartners, setRecentPartners] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: '12.4k', volume: '$84.2M', countries: '142', lastHourCount: 342 });

    const fetchRecentPartners = async () => {
        try {
            const response = await fetch(`${API_URL}/api/partner/recent`);
            if (response.ok) {
                const data = await response.json();
                setRecentPartners(data);
                // Dynamically update the count (just for visual flair, we can round it if data is small)
                setStats(prev => ({ ...prev, lastHourCount: Math.max(data.length, prev.lastHourCount) }));
            }
        } catch (error) {
            console.error("Failed to fetch recent partners", error);
        }
    };

    useEffect(() => {
        fetchRecentPartners();
        // Refresh every 60 minutes as requested
        const interval = setInterval(fetchRecentPartners, 60 * 60 * 1000);
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
                            <div key={partner.id || i} className="w-7 h-7 rounded-full border-2 border-(--color-bg-deep) bg-slate-800 flex items-center justify-center overflow-hidden shadow-lg">
                                {partner.photo_url ? (
                                    <img src={partner.photo_url} alt={partner.first_name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[10px] font-black text-white uppercase">
                                        {(partner.first_name?.[0] || 'P')}
                                    </span>
                                )}
                            </div>
                        ))
                    ) : (
                        [1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-(--color-bg-deep) bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))
                    )}
                </div>
                <p className="text-[10px] font-bold text-(--color-text-secondary)">
                    <Trans i18nKey="dashboard.stats.recent_join" values={{ count: stats.lastHourCount }}>
                        <span className="text-(--color-text-primary) font-black">+{stats.lastHourCount} new partners</span> joined the movement in the last 60m
                    </Trans>
                </p>
            </motion.div>
        </section>
    );
};
