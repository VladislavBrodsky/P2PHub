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
import { ThrottledSuspense } from '../components/ui/ThrottledSuspense';

// Lazy Loaded Sections
const BentoGrid = lazy(() => import('../components/Marketing/BentoGrid').then(m => ({ default: m.BentoGrid })));
const BlogCarousel = lazy(() => import('../components/Marketing/BlogCarousel').then(m => ({ default: m.BlogCarousel })));
const IncomePotential = lazy(() => import('../components/Marketing/IncomePotential').then(m => ({ default: m.IncomePotential })));
const Footer = lazy(() => import('../components/Layout/Footer').then(m => ({ default: m.Footer })));

// #comment: Skeleton Loaders to prevent layout shifts during lazy loading.
const SkeletonCard = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-white/5 ${className}`} />
);

const BentoSkeleton = () => (
    <div className="flex gap-4 overflow-hidden px-6 h-[410px] items-start">
        <SkeletonCard className="shrink-0 w-[280px] sm:w-[320px] h-[360px]" />
        <SkeletonCard className="shrink-0 w-[280px] sm:w-[320px] h-[360px]" />
        <SkeletonCard className="shrink-0 w-[280px] sm:w-[320px] h-[360px]" />
    </div>
);

const IncomeSkeleton = () => (
    <div className="mx-4 p-5 md:p-8 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 min-h-[1116px] flex flex-col gap-8 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" />
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
        <div className="h-48 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="space-y-4">
            <div className="h-24 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-24 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
    </div>
);

const BlogSkeleton = () => (
    <div className="mx-4 p-6 rounded-3xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 h-[466px] flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="flex gap-4 overflow-hidden">
            <SkeletonCard className="shrink-0 w-[240px] h-[300px]" />
            <SkeletonCard className="shrink-0 w-[240px] h-[300px]" />
        </div>
    </div>
);

interface DashboardProps {
    setActiveTab?: (tab: string) => void;
}

export default function Dashboard({ setActiveTab }: DashboardProps) {
    const { t } = useTranslation(['dashboard', 'common', 'marketing', 'social']);
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
    const heroTitle1 = useMemo(() => t(`dashboard:hero_rotation.${rotationIndex}.title_1`, { defaultValue: t('Everything You Know') }), [rotationIndex, t]);
    const heroTitle2 = useMemo(() => t(`dashboard:hero_rotation.${rotationIndex}.title_2`, { defaultValue: t('About Money Is a Lie') }), [rotationIndex, t]);

    const isProPlus = (user?.subscription_plan || "").includes('PLUS');

    return (
        <m.div
            className="flex w-full flex-col px-0 min-h-dvh transition-colors duration-500 relative gap-10 pb-24"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* #comment: Background Glows removed for Unified Background Continuity. */}
            {user?.is_pro && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_40%,rgba(59,130,246,0.05),transparent_70%)]" />
                </div>
            )}

            {/* #comment: 1. Hero Section - Spacious & Centered Layout with adjusted padding for Modal views. */}
            <m.div variants={item} className="flex flex-col items-center pt-8 sm:pt-16 w-full">
                <div className="relative overflow-visible mx-auto min-h-[320px] sm:min-h-[400px] flex items-center justify-center shrink-0 w-full">
                    <CommunityOrbit />
                </div>

                <div className="text-center px-6 flex flex-col items-center mt-8 relative z-20">
                    <div className="flex items-center gap-3 mb-10">
                        {user?.is_pro ? (
                            <m.button
                                onClick={() => setActiveTab?.('pro')}
                                className={`inline-flex items-center justify-center rounded-full border px-5 py-2.5 active:scale-95 transition-all outline-none relative overflow-hidden group shadow-2xl ${isProPlus ? 'border-yellow-400/50 vibing-yellow-animated shadow-yellow-500/40' : 'border-blue-400/40 bg-blue-600/10 vibing-blue-animated shadow-blue-500/30'}`}
                                animate={{ scale: [1, 1.03, 1] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer-slide" />
                                <p className={`text-[11px] font-black uppercase tracking-[0.2em] relative z-10 ${isProPlus ? 'text-[#0a1000] drop-shadow-sm' : 'text-white'}`}>
                                    {t('dashboard:open_pro_dashboard')}
                                </p>
                            </m.button>
                        ) : (
                            <m.button
                                onClick={() => setActiveTab?.('subscription')}
                                className="inline-flex items-center justify-center rounded-full border border-blue-400/40 vibing-blue-animated px-7 py-3 shadow-[0_0_30px_rgba(0,102,255,0.4)] cursor-pointer active:scale-95 transition-all outline-none hover:brightness-110 relative overflow-hidden group"
                                animate={{ scale: [1, 1.03, 1] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer-slide" />
                                <p className="text-xs font-black uppercase tracking-[0.25em] text-white relative z-10">
                                    {t('dashboard:hero_badge')}
                                </p>
                            </m.button>
                        )}

                        {user?.is_admin && user?.username !== 'uslincoln' && (
                            <m.button
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                onClick={() => setActiveTab?.('admin')}
                                className="p-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl border border-white/10 flex items-center gap-2 px-5 transition-transform active:scale-90"
                            >
                                <ShieldCheck size={14} className="text-blue-500" />
                                <span className="text-label font-bold uppercase tracking-widest">{t('common:admin')}</span>
                            </m.button>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 sm:gap-5 mt-2">
                        <h1 className="text-[36px] sm:text-[46px] font-black tracking-tighter text-text-primary leading-[1.05] text-center max-w-[360px] sm:max-w-[420px] mx-auto drop-shadow-sm">
                            {heroTitle1}
                        </h1>
                        <m.div
                            className="text-[36px] sm:text-[46px] font-black tracking-tighter leading-tight text-center max-w-[360px] sm:max-w-[420px] vibing-crystal-text mx-auto drop-shadow-md"
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
            <m.div variants={item} className="mt-4 w-full">
                <PartnerStats onNavigateToEarn={() => setActiveTab?.('earn')} />
            </m.div>

            {/* #comment: 3. The Evolution - Bento Grid. */}
            <div className="flex flex-col gap-4 w-full relative z-10">
                <div className="w-full">
                    <SectionHeader
                        badge={t('dashboard:evolution.badge')}
                        title={t('dashboard:evolution.title')}
                        description={t('dashboard:evolution.desc')}
                    />
                </div>
                <Suspense fallback={<BentoSkeleton />}>
                    <BentoGrid />
                </Suspense>
            </div>

            {/* #comment: 4. The Opportunity - Income Potential. */}
            <m.div variants={item} className="w-full">
                <Suspense fallback={<IncomeSkeleton />}>
                    <IncomePotential onNavigateToPartner={() => setActiveTab?.('subscription')} />
                </Suspense>
            </m.div>

            {/* #comment: 5. Intelligence Hub - Blog Carousel. */}
            <m.div variants={item} className="w-full">
                <Suspense fallback={<BlogSkeleton />}>
                    <BlogCarousel />
                </Suspense>
            </m.div>

            {/* #comment: 6. Final CTA - Clear conversion point. */}
            <m.div variants={item} className="w-full flex flex-col items-center text-center py-12 gap-8">
                <div className="p-2 px-6 rounded-full bg-blue-500/10 text-blue-500 text-label font-bold uppercase tracking-[0.3em] w-fit border border-blue-500/20 shadow-lg">
                    {t('dashboard:movement_active')}
                </div>
                <h4 className="text-display font-bold tracking-tight text-text-primary whitespace-pre-line leading-tight">
                    {t('dashboard:cta_title')}
                </h4>
                <p className="text-body text-text-secondary max-w-[280px] leading-relaxed font-medium">
                    {t('dashboard:cta_desc')}
                </p>
            </m.div>

            {/* #comment: Semantic description. */}
            <m.div variants={item} className="px-8 pt-4 pb-12">
                <p className="text-text-secondary text-center text-label font-bold leading-relaxed opacity-60 uppercase tracking-widest">
                    <Trans i18nKey="dashboard:hero_desc">
                        Traditional finance is slow, closed, and failing. <span className="text-blue-500 font-bold">Partner Center</span> is the bridge to a borderless era where you earn from the flow of world money.
                    </Trans>
                </p>
            </m.div>

            {/* 7. Footer */}
            <Suspense fallback={<div className="h-20" />}>
                <Footer />
            </Suspense>
        </m.div>
    );
}
