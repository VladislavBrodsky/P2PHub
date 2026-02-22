// #comment: Dashboard.tsx - Main entry point for the Partner Network interface.
// Refactored to use optimized 'm' component from framer-motion and lazy-loaded namespaces for i18n.
// Spacing has been restored to the "Great" version while maintaining performance improvements.
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
    const heroTitle1 = useMemo(() => t(`dashboard.hero_rotation.${rotationIndex}.title_1`, { defaultValue: "Everything You Know" }), [rotationIndex, t]);
    const heroTitle2 = useMemo(() => t(`dashboard.hero_rotation.${rotationIndex}.title_2`, { defaultValue: "About Money Is a Lie" }), [rotationIndex, t]);

    const isProPlus = (user?.subscription_plan || "").includes('PLUS');

    return (
        <m.div
            className="flex w-full flex-col px-0 min-h-dvh transition-colors duration-500 relative gap-12 pb-20"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* #comment: Ambient Background Glow for PRO users. */}
            {user?.is_pro && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-blue-500/5 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-1/4 right-0 w-1/3 h-1/3 bg-indigo-500/5 blur-[100px] rounded-full animate-pulse" />
                </div>
            )}

            {/* #comment: 1. Hero Section - Spacious & Centered Layout. */}
            <m.div variants={item} className="flex flex-col items-center pt-2">
                <div className="relative overflow-visible mx-auto h-[380px] sm:h-[440px] flex items-center justify-center shrink-0">
                    <CommunityOrbit />
                </div>

                <div className="text-center px-4 flex flex-col items-center mt-6 relative z-20">
                    <div className="flex items-center gap-3 mb-8">
                        {user?.is_pro ? (
                            <m.button
                                onClick={() => setActiveTab?.('pro')}
                                className={`inline-flex items-center justify-center rounded-full border px-6 py-2 active:scale-95 transition-all outline-none ${isProPlus ? 'border-yellow-400/50 vibing-yellow-animated shadow-[0_0_25px_rgba(255,215,0,0.4)] hover:brightness-110' : 'border-blue-400/30 bg-[#0066FF]/10 vibing-blue-animated shadow-[0_0_20px_rgba(0,102,255,0.3)] hover:bg-[#0066FF]/20'}`}
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <p className={`text-label font-black uppercase tracking-[0.2em] ${isProPlus ? 'text-[#0a1000] drop-shadow-sm' : 'text-white'}`}>
                                    {t('dashboard.open_pro_dashboard')}
                                </p>
                            </m.button>
                        ) : (
                            <m.div
                                className="inline-block rounded-full border border-blue-400/30 vibing-blue-animated px-6 py-2 shadow-[0_0_20px_rgba(0,102,255,0.3)]"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <p className="text-label font-black uppercase tracking-[0.2em] text-white">
                                    {t('dashboard.hero_badge')}
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
                                <span className="text-label font-black uppercase tracking-widest">Admin</span>
                            </m.button>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        <h1 className="text-display font-black tracking-tighter text-text-primary leading-tight text-center max-w-[280px] mx-auto">
                            {heroTitle1}
                        </h1>
                        <m.div
                            className="text-display font-black tracking-tighter leading-tight text-center max-w-[300px] vibing-crystal-text mx-auto"
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

            {/* #comment: 2. Viral Proof - Partner Stats. */}
            <m.div variants={item} className="mt-4">
                <PartnerStats onNavigateToEarn={() => setActiveTab?.('earn')} />
            </m.div>

            {/* #comment: 3. The Evolution - Bento Grid. */}
            <m.div variants={item} className="flex flex-col gap-8">
                <div className="px-4">
                    <SectionHeader
                        badge={t('evolution.badge')}
                        title={t('evolution.title')}
                        description={t('evolution.desc')}
                    />
                </div>
                <Suspense fallback={<div className="h-64 animate-pulse bg-bg-surface/10 rounded-3xl mx-4 border border-border-glass" />}>
                    <BentoGrid />
                </Suspense>
            </m.div>

            {/* #comment: 4. The Opportunity - Income Potential. */}
            <m.div variants={item} className="w-full">
                <Suspense fallback={<div className="h-80 animate-pulse bg-bg-surface/10 rounded-3xl mx-4 border border-border-glass" />}>
                    <IncomePotential onNavigateToPartner={() => setActiveTab?.('subscription')} />
                </Suspense>
            </m.div>

            {/* #comment: 5. Intelligence Hub - Blog Carousel. */}
            <m.div variants={item} className="w-full">
                <Suspense fallback={<div className="h-64 animate-pulse bg-bg-surface/10 rounded-3xl mx-4 border border-border-glass" />}>
                    <BlogCarousel />
                </Suspense>
            </m.div>

            {/* #comment: 6. Final CTA - Clear conversion point. */}
            <m.div variants={item} className="px-6 text-center py-12 space-y-6">
                <div className="p-2 px-6 rounded-full bg-blue-500/10 text-blue-500 text-label font-black uppercase tracking-[0.3em] w-fit mx-auto border border-blue-500/20 shadow-lg">
                    {t('dashboard.movement_active')}
                </div>
                <h4 className="text-display font-black tracking-tight text-text-primary whitespace-pre-line leading-tight">
                    {t('dashboard.cta_title')}
                </h4>
                <p className="text-body text-text-secondary max-w-[280px] mx-auto leading-relaxed font-medium">
                    {t('dashboard.cta_desc')}
                </p>
            </m.div>

            {/* #comment: Semantic description. */}
            <m.div variants={item} className="px-8 pt-4 pb-12">
                <p className="text-text-secondary text-center text-label font-bold leading-relaxed opacity-60 uppercase tracking-widest">
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
