// #comment: Removed unused useHaptic import from Dashboard.tsx to address linting warnings
import { ShieldCheck } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useMemo } from 'react';
import { motion } from 'framer-motion';


import { CommunityOrbit } from '../components/Marketing/CommunityOrbit';
import { PartnerStats } from '../components/Marketing/PartnerStats';
import { lazy, Suspense } from 'react';

const BentoGrid = lazy(() => import('../components/Marketing/BentoGrid').then(m => ({ default: m.BentoGrid })));
const BlogCarousel = lazy(() => import('../components/Marketing/BlogCarousel').then(m => ({ default: m.BlogCarousel })));
const IncomePotential = lazy(() => import('../components/Marketing/IncomePotential').then(m => ({ default: m.IncomePotential })));
const Footer = lazy(() => import('../components/Layout/Footer').then(m => ({ default: m.Footer })));
import { useTranslation, Trans } from 'react-i18next';
import { RevealSkeleton } from '../components/Skeletons/RevealSkeleton';
// #comment: Standardized section headers for better SEO and semantic control.
import { SectionHeader } from '../components/ui/SectionHeader';

interface DashboardProps {
    setActiveTab?: (tab: string) => void;
}

export default function Dashboard({ setActiveTab }: DashboardProps) {
    const { t } = useTranslation();
    const { user } = useUser();

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
    const rotationIndex = useMemo(() => Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % 3, []);
    const heroTitle1 = useMemo(() => t(`dashboard.hero_rotation.${rotationIndex}.title_1`, { defaultValue: "Everything You Know" }), [rotationIndex, t]);
    const heroTitle2 = useMemo(() => t(`dashboard.hero_rotation.${rotationIndex}.title_2`, { defaultValue: "About Money Is a Lie" }), [rotationIndex, t]);

    return (
        <motion.div
            className="flex w-full flex-col pb-safe-bottom px-0 min-h-dvh transition-colors duration-500 relative bg-(--color-bg-app)"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* Ambient Background Glow for PRO */}
            {user?.is_pro && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-blue-500/5 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-1/4 right-0 w-1/3 h-1/3 bg-indigo-500/5 blur-[100px] rounded-full animate-pulse" />
                </div>
            )}
            {/* 1. Hero Section - Spacious & Centered Layout */}
            <motion.div variants={item} className="px-4 space-y-12">
                {/* Orbit Container */}
                <div className="relative overflow-visible -mx-4 h-[400px] mt-2 flex items-center justify-center">
                    <CommunityOrbit />
                </div>

                {/* Sub-Hero Text Section */}
                <div className="text-center space-y-10 px-2 flex flex-col items-center">
                    {/* Badge & Admin Entry */}
                    <div className="flex items-center gap-3">
                        <motion.div
                            className="inline-block rounded-full border border-blue-400/30 vibing-blue-animated px-6 py-2 shadow-[0_0_20px_rgba(0,102,255,0.3)]"
                            animate={{
                                scale: [1, 1.05, 1],
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                                {t('dashboard.hero_badge', { defaultValue: 'PARTNER NETWORK 2.0' })}
                            </p>
                        </motion.div>

                        {user?.is_admin && user?.username !== 'uslincoln' && (
                            <motion.button
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                onClick={() => setActiveTab?.('admin')}
                                className="p-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl border border-white/10 flex items-center gap-2 px-4 transition-transform active:scale-90"
                            >
                                <ShieldCheck size={14} className="text-blue-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Admin</span>
                            </motion.button>
                        )}
                    </div>


                    {/* Main Titles */}
                    <div className="space-y-4">
                        <h1 className="text-[38px] font-extrabold tracking-tighter text-slate-900 dark:text-white leading-[0.9] text-center max-w-[280px]">
                            {heroTitle1}
                        </h1>
                        <motion.div
                            className="text-[36px] font-extrabold tracking-tighter leading-[0.9] text-center max-w-[300px] vibing-crystal-text"
                            animate={{
                                scale: [1, 1.03, 1],
                                rotate: [-0.3, 0.3, -0.3],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            {heroTitle2}
                        </motion.div>
                    </div>
                </div>
            </motion.div>



            {/* 2. Viral Proof - Partner Stats */}
            <motion.div variants={item} className="mt-4">
                <PartnerStats onNavigateToEarn={() => setActiveTab?.('earn')} />
            </motion.div>

            {/* #comment: Phase 1 & 2 - Using SectionHeader for proper H2 semantic hierarchy and SEO performance. */}
            {/* 3. The Evolution - Bento Grid */}
            <motion.div variants={item} className="space-y-6">
                <SectionHeader
                    badge={t('evolution.badge')}
                    title={t('evolution.title')}
                    description={t('evolution.desc')}
                />
                <Suspense fallback={<RevealSkeleton />}>
                    <BentoGrid />
                </Suspense>
            </motion.div>

            {/* 4. The Opportunity - Income Potential */}
            <motion.div variants={item}>
                <Suspense fallback={<RevealSkeleton />}>
                    <IncomePotential onNavigateToPartner={() => setActiveTab?.('partner')} />
                </Suspense>
            </motion.div>

            {/* #comment: Refactored sectioning to ensure clear structural separation between user value (Income) and educational content (Blog). */}
            {/* 5. Intelligence Hub - Blog Carousel */}
            <motion.div variants={item}>
                <Suspense fallback={<RevealSkeleton />}>
                    <BlogCarousel />
                </Suspense>
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
            <Suspense fallback={null}>
                <Footer />
            </Suspense>

        </motion.div >
    );
}
