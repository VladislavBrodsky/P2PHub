import { motion } from 'framer-motion';
import { CommunityOrbit } from '../components/Marketing/CommunityOrbit';
import { Ticker } from '../components/Marketing/Ticker';
import { BentoGrid } from '../components/Marketing/BentoGrid';
import { BlogCarousel } from '../components/Marketing/BlogCarousel';
import { IncomePotential } from '../components/Marketing/IncomePotential';
import { PartnerStats } from '../components/Marketing/PartnerStats';
import { useHaptic } from '../hooks/useHaptic';
import { Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { getRank, getXPProgress } from '../utils/ranking';
import { useTranslation, Trans } from 'react-i18next';
import { Footer } from '../components/Layout/Footer';

interface DashboardProps {
    setActiveTab?: (tab: string) => void;
}

export default function Dashboard({ setActiveTab }: DashboardProps) {
    const { t } = useTranslation();
    const { selection } = useHaptic();
    const { user, isLoading: isUserLoading } = useUser();

    const stats = user || {
        balance: 0,
        level: 1,
        xp: 0
    };

    const currentRank = getRank(stats.level || 1);
    const xpProgress = getXPProgress(stats.level || 1, stats.xp || 0);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
    };

    // Calculate rotation index (0, 1, or 2) based on current day
    const rotationIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % 3;
    const heroTitle1 = t(`dashboard.hero_rotation.${rotationIndex}.title_1`, { defaultValue: "Slow Money Is Dead" });
    const heroTitle2 = t(`dashboard.hero_rotation.${rotationIndex}.title_2`, { defaultValue: "Welcome to Web3 Finance" });

    return (
        <motion.div
            className="flex w-full flex-col pb-32 px-0 min-h-dvh transition-colors duration-500 relative"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* 1. Hero Section - Spacious & Centered Layout */}
            <motion.div variants={item} className="px-4 space-y-12">
                {/* Orbit Container */}
                <div className="relative overflow-visible -mx-4 h-[400px] -mt-10 flex items-center justify-center">
                    <CommunityOrbit />
                </div>

                {/* Sub-Hero Text Section */}
                <div className="text-center space-y-10 px-2 flex flex-col items-center">
                    {/* Badge */}
                    <motion.div
                        className="inline-block rounded-full border border-blue-200/50 bg-blue-50 px-6 py-2 shadow-sm"
                        animate={{
                            scale: [1, 1.02, 1],
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600">
                            {t('dashboard.hero_badge', { defaultValue: 'PARTNER NETWORK 2.0' })}
                        </p>
                    </motion.div>

                    {/* Main Titles */}
                    <div className="space-y-4">
                        <h1 className="text-[44px] font-extrabold tracking-tighter text-slate-900 dark:text-white leading-[0.95] flex flex-col items-center">
                            <span>Slow Money Is</span>
                            <span>Dead</span>
                        </h1>
                        <motion.div
                            className="text-[42px] font-extrabold tracking-tighter leading-[0.95] flex flex-col items-center"
                            style={{
                                background: 'linear-gradient(to right, #3B82F6, #60A5FA, #3B82F6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundSize: '200% auto',
                            }}
                            animate={{
                                backgroundPosition: ['0% center', '200% center'],
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        >
                            <span>Welcome to Web3</span>
                            <span>Finance</span>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* 2. Viral Proof - Partner Stats */}
            <motion.div variants={item} className="mt-8">
                <PartnerStats onNavigateToEarn={() => setActiveTab?.('earn')} />
            </motion.div>

            {/* 3. The Evolution - Bento Grid */}
            <motion.div variants={item}>
                <BentoGrid />
            </motion.div>

            {/* 4. The Opportunity - Income Potential */}
            <motion.div variants={item}>
                <IncomePotential onNavigateToPartner={() => setActiveTab?.('partner')} />
            </motion.div>

            {/* 5. Intelligence Hub - Blog Carousel */}
            <motion.div variants={item}>
                <BlogCarousel />
            </motion.div>

            {/* 6. Final CTA */}
            <motion.div variants={item} className="px-6 text-center py-12 space-y-6">
                <div className="p-2 px-6 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] w-fit mx-auto border border-blue-500/20 shadow-lg">
                    {t('dashboard.movement_active')}
                </div>
                <h4 className="text-2xl font-black tracking-tight text-text-primary whitespace-pre-line">
                    {t('dashboard.cta_title')}
                </h4>
                <p className="text-xs font-bold text-text-secondary max-w-[240px] mx-auto leading-relaxed">
                    {t('dashboard.cta_desc')}
                </p>
            </motion.div>

            {/* Description Text - Moved to Bottom per Image */}
            <motion.div variants={item} className="px-8 pb-12">
                <p className="text-text-secondary text-center text-[10px] font-bold leading-relaxed opacity-60 uppercase tracking-widest">
                    <Trans i18nKey="dashboard.hero_desc">
                        Traditional finance is slow, closed, and failing.
                    </Trans>
                </p>
            </motion.div>

            {/* 7. Footer - Legal & Disclaimer */}
            <Footer />

        </motion.div >
    );
}
