// #comment: Dashboard.tsx - Main entry point for the Partner Network interface.
// Restored to the stable "Great" version from commit 2349372a.
// Uses optimized 'm' components for performance while maintaining the spacious vertical hierarchy and premium crystal text effects.
import { ShieldCheck } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useMemo, lazy, Suspense } from 'react';
import { m } from 'framer-motion';
import { useTranslation, Trans } from 'react-i18next';

// Components
import { CommunityOrbit } from '../components/Marketing/CommunityOrbit';
import { PartnerStats } from '../components/Marketing/PartnerStats';
import { SectionHeader } from '../components/ui/SectionHeader';

// Lazy Loaded Sections
const BentoGrid = lazy(() => import('../components/Marketing/BentoGrid').then(m => ({ default: m.BentoGrid })));
const BlogCarousel = lazy(() => import('../components/Marketing/BlogCarousel').then(m => ({ default: m.BlogCarousel })));
const IncomePotential = lazy(() => import('../components/Marketing/IncomePotential').then(m => ({ default: m.IncomePotential })));
const Footer = lazy(() => import('../components/Layout/Footer').then(m => ({ default: m.Footer })));

interface DashboardProps {
    setActiveTab?: (tab: string) => void;
}

export default function Dashboard({ setActiveTab }: DashboardProps) {
    const { t } = useTranslation(['dashboard', 'common']);
    const { user } = useUser();

    // #comment: Animation Variants for coordinated entry of dashboard elements.
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
    };

    // #comment: Dynamic Hero Rotation - Switches content based on the day to keep the UI fresh.
    const rotationIndex = useMemo(() => Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % 3, []);
    const heroTitle1 = useMemo(() => t(`dashboard.hero_rotation.${rotationIndex}.title_1`, {
        defaultValue: "Everything You Know"
    }), [rotationIndex, t]);
    const heroTitle2 = useMemo(() => t(`dashboard.hero_rotation.${rotationIndex}.title_2`, {
        defaultValue: "About Money Is a Lie"
    }), [rotationIndex, t]);

    const isProPlus = (user?.subscription_plan || "").includes('PLUS');

    return (
        <m.div
            className="flex w-full flex-col pb-safe-bottom px-0 min-h-dvh transition-colors duration-500 relative"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* #comment: 1. Hero Section - The Central "Hub" Experience.
                Restored the original spacing hierarchy that the user liked. */}
            <m.div variants={item} className="px-4">
                {/* Orbit Container - Fixed height to ensure stability */}
                <div className="relative overflow-visible -mx-4 h-[400px] mt-2 flex items-center justify-center">
                    <CommunityOrbit />
                </div>

                {/* Sub-Hero Text Section - Coordinated spacing for readability */}
                <div className="text-center space-y-10 px-2 flex flex-col items-center -mt-8 relative z-20">
                    {/* Badge & Admin Entry */}
                    <div className="flex items-center gap-3">
                        {user?.is_pro ? (
                            <m.button
                                onClick={() => setActiveTab?.('pro')}
                                className={`inline-flex items-center justify-center rounded-full border px-6 py-2 active:scale-95 transition-all outline-none ${isProPlus ? 'border-yellow-400/50 vibing-yellow-animated shadow-[0_0_25px_rgba(255,215,0,0.4)] hover:brightness-110' : 'border-blue-400/30 bg-[#0066FF]/10 vibing-blue-animated shadow-[0_0_20px_rgba(0,102,255,0.3)] hover:bg-[#0066FF]/20'}`}
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isProPlus ? 'text-[#0a1000] drop-shadow-sm' : 'text-white'}`}>
                                    {t('dashboard.open_pro_dashboard', { defaultValue: 'OPEN PRO+ DASHBOARD' })}
                                </p>
                            </m.button>
                        ) : (
                            <m.div
                                className="inline-block rounded-full border border-blue-400/30 vibing-blue-animated px-6 py-2 shadow-[0_0_20px_rgba(0,102,255,0.3)]"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                                    {t('dashboard.hero_badge', { defaultValue: 'PARTNER NETWORK 2.0' })}
                                </p>
                            </m.div>
                        )}

                        {user?.is_admin && user?.username !== 'uslincoln' && (
                            <m.button
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                onClick={() => setActiveTab?.('admin')}
                                className="p-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl border border-white/10 flex items-center gap-2 px-4 transition-transform active:scale-90"
                            >
                                <ShieldCheck size={14} className="text-blue-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Admin</span>
                            </m.button>
                        )}
                    </div>

                    {/* Main Titles - Ultra-premium typography */}
                    <div className="space-y-4">
                        <h1 className="text-[38px] font-extrabold tracking-tighter text-slate-900 dark:text-white leading-[0.9] text-center max-w-[280px] mx-auto">
                            {heroTitle1}
                        </h1>
                        <m.div
                            className="text-[36px] font-extrabold tracking-tighter leading-[0.9] text-center max-w-[300px] vibing-crystal-text mx-auto"
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
                        </m.div>
                    </div>
                </div>
            </m.div>

            {/* #comment: 2. Viral Proof - Partner Stats.
                Displays live community activity to drive FOMO and social proof. */}
            <m.div variants={item} className="mt-4">
                <PartnerStats onNavigateToEarn={() => setActiveTab?.('earn')} />
            </m.div>

            {/* #comment: 3. The Evolution - Bento Grid.
                Showcases the project roadmap through an interactive horizontal grid. */}
            <m.div variants={item} className="space-y-6">
                <SectionHeader
                    badge={t('evolution.badge')}
                    title={t('evolution.title')}
                    description={t('evolution.desc')}
                />
                <Suspense fallback={<div className="h-64 animate-pulse bg-slate-200/10 rounded-3xl mx-4" />}>
                    <BentoGrid />
                </Suspense>
            </m.div>

            {/* #comment: 4. The Opportunity - Income Potential.
                Interactive calculator/graph showcasing potential earnings. */}
            <m.div variants={item}>
                <Suspense fallback={<div className="h-80 animate-pulse bg-slate-200/10 rounded-3xl mx-4" />}>
                    <IncomePotential onNavigateToPartner={() => setActiveTab?.('subscription')} />
                </Suspense>
            </m.div>

            {/* #comment: 5. Intelligence Hub - Blog Carousel.
                Latest updates and articles to keep partners informed. */}
            <m.div variants={item}>
                <Suspense fallback={<div className="h-64 animate-pulse bg-slate-200/10 rounded-3xl mx-4" />}>
                    <BlogCarousel />
                </Suspense>
            </m.div>

            {/* #comment: 6. Final CTA - Clear conversion point for users. */}
            <m.div variants={item} className="px-6 text-center py-12 space-y-6">
                <div className="p-2 px-6 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] w-fit mx-auto border border-blue-500/20 shadow-lg">
                    {t('dashboard.movement_active')}
                </div>
                <h4 className="text-2xl font-black tracking-tight text-text-primary whitespace-pre-line">
                    {t('dashboard.cta_title')}
                </h4>
                <p className="text-xs font-bold text-text-secondary max-w-[240px] mx-auto leading-relaxed">
                    {t('dashboard.cta_desc')}
                </p>
            </m.div>

            {/* #comment: Semantic description for SEO and context. */}
            <m.div variants={item} className="px-8 pb-12">
                <p className="text-text-secondary text-center text-[10px] font-bold leading-relaxed opacity-60 uppercase tracking-widest">
                    <Trans i18nKey="dashboard.hero_desc">
                        Traditional finance is slow, closed, and failing. <span className="text-blue-500 font-bold">Pintopay</span> is the bridge to a borderless era where you earn from the flow of world money.
                    </Trans>
                </p>
            </m.div>

            {/* 7. Footer */}
            <Suspense fallback={null}>
                <Footer />
            </Suspense>
        </m.div>
    );
}
