import React, { useRef, useState } from 'react';
import { m } from 'framer-motion';
import { CreditCard, Smartphone, Zap, Globe, Coins, QrCode, RotateCcw, TrendingUp, History, Landmark, Wallet, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const shiftSteps = [
    {
        id: 0,
        icon: <Coins className="w-6 h-6 text-amber-500" />,
        watermark: <Coins className="w-40 h-40 text-amber-500" fill="currentColor" />,
        color: "from-amber-500/20 via-amber-500/5 to-transparent",
        size: "col-span-1",
        statusColor: "text-amber-500 bg-amber-500/10"
    },
    {
        id: 1,
        icon: <CreditCard className="w-6 h-6 text-blue-500" />,
        watermark: <CreditCard className="w-40 h-40 text-blue-500" fill="currentColor" />,
        color: "from-blue-500/20 via-blue-500/5 to-transparent",
        size: "col-span-1",
        statusColor: "text-blue-500 bg-blue-500/10"
    },
    {
        id: 2,
        icon: <Smartphone className="w-6 h-6 text-purple-500" />,
        watermark: <Smartphone className="w-40 h-40 text-purple-500" fill="currentColor" />,
        color: "from-purple-500/20 via-purple-500/5 to-transparent",
        size: "col-span-2",
        statusColor: "text-purple-500 bg-purple-500/10"
    },
    {
        id: 3,
        icon: <Globe className="w-6 h-6 text-emerald-500" />,
        watermark: <Globe className="w-40 h-40 text-emerald-500" fill="currentColor" />,
        color: "from-emerald-500/20 via-emerald-500/5 to-transparent",
        size: "col-span-2",
        statusColor: "text-emerald-500 bg-emerald-500/10"
    },
    {
        id: 4,
        icon: <QrCode className="w-6 h-6 text-blue-400" />,
        watermark: <Zap className="w-40 h-40 text-blue-500" fill="currentColor" />,
        color: "from-blue-600/30 via-blue-400/5 to-transparent",
        size: "col-span-2",
        featured: true,
        statusColor: "text-white bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
    }
];

export const BentoGrid = () => {
    const { t } = useTranslation(['dashboard', 'common', 'marketing']);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

    const toggleFlip = (index: number) => {
        setFlippedCards(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    // #comment: Custom scroll listener to track the active card in the horizontal carousel.
    // While currently using manual scroll distance math, future iterations should move 
    // to IntersectionObserver for even better main-thread performance on high-density displays.
    const rafRef = useRef<number | null>(null);

    const handleScroll = () => {
        if (!scrollRef.current) return;

        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
            if (!scrollRef.current) return;
            const scrollLeft = scrollRef.current.scrollLeft;
            const width = scrollRef.current.clientWidth;

            // Find all children and their positions to determine the truly active one
            const children = Array.from(scrollRef.current.children) as HTMLElement[];
            if (children.length === 0) return;

            let closestIndex = 0;
            let minDistance = Infinity;
            const centerPoint = scrollLeft + width / 2;

            children.forEach((child, i) => {
                const childCenter = child.offsetLeft + child.offsetWidth / 2;
                const distance = Math.abs(centerPoint - childCenter);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestIndex = i;
                }
            });

            if (closestIndex !== activeIndex) {
                setActiveIndex(closestIndex);
            }
        });
    };

    const getBackIcon = (index: number) => {
        switch (index) {
            case 0: return <History className="w-8 h-8 text-amber-500" />;
            case 1: return <Landmark className="w-8 h-8 text-blue-500" />;
            case 2: return <Wallet className="w-8 h-8 text-purple-500" />;
            case 3: return <ShieldCheck className="w-8 h-8 text-emerald-500" />;
            case 4: return <Globe className="w-8 h-8 text-blue-400" />;
            default: return <TrendingUp className="w-8 h-8 text-emerald-500" />;
        }
    };

    // #comment: Removed internal header logic as BentoGrid is now a pure-layout component. 
    // Hierarchy is now managed by the Dashboard's SectionHeader for better semantic control.
    return (
        <section className="px-0 py-0 flex flex-col overflow-hidden relative">
            {/* Carousel Container */}
            <div className="relative min-h-[520px]">
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex items-center gap-4 overflow-x-auto pt-4 pb-12 snap-x snap-mandatory no-scrollbar px-6 scroll-smooth perspective-1000"
                >
                    {shiftSteps.map((step, index) => (
                        <div
                            key={index}
                            className="relative shrink-0 w-[300px] sm:w-[340px] h-[400px] snap-center cursor-pointer"
                            onClick={() => toggleFlip(index)}
                        >
                            <m.div
                                initial={{ opacity: 0, scale: 0.95, y: 0 }}
                                whileInView={{
                                    opacity: 1,
                                    scale: 1,
                                    y: 0,
                                    transition: {
                                        duration: 0.4,
                                        delay: index * 0.05
                                    }
                                }}
                                viewport={{ once: true }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`w-full h-full relative ${flippedCards[index] ? 'z-50' : 'z-10'}`}
                                style={{ transformStyle: "preserve-3d" }}
                            >
                                {/* FRONT SIDE */}
                                <div
                                    className={`absolute inset-0 left-0 top-0 backface-hidden overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 glass-panel-premium will-change-transform ${step.featured ? 'border-blue-500/30' : ''}`}
                                    style={{
                                        transform: flippedCards[index] ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                        opacity: flippedCards[index] ? 0 : 1,
                                        transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.6s ease-out'
                                    }}
                                >
                                    <div className="absolute inset-0 p-7 h-full w-full">
                                        <div className={`absolute inset-0 bg-linear-to-br ${step.color} opacity-20 group-hover:opacity-40 transition-opacity`} />

                                        <div className="relative z-10 flex flex-col gap-4 h-full">
                                            <div className="flex items-center justify-between -mt-1">
                                                <div className="p-2.5 w-fit rounded-xl bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-sm transition-transform group-hover:scale-110">
                                                    {step.icon}
                                                </div>
                                                <span className={`text-[10px] sm:text-label font-bold px-3 py-1.5 rounded-full ${step.statusColor} tracking-[0.1em] uppercase shadow-sm`}>
                                                    {t(`dashboard:evolution.steps.${step.id}.status`)}
                                                </span>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-label font-bold uppercase tracking-[0.2em] text-text-secondary opacity-60">
                                                    {t(`dashboard:evolution.steps.${step.id}.title`)}
                                                </p>
                                                <h4 className={`text-xl font-bold leading-tight ${step.featured ? 'text-blue-500' : 'text-text-primary'}`}>
                                                    {t(`dashboard:evolution.steps.${step.id}.subtitle`)}
                                                </h4>
                                            </div>

                                            <p className="text-caption font-semibold leading-relaxed text-text-secondary line-clamp-4 grow">
                                                {t(`dashboard:evolution.steps.${step.id}.desc`)}
                                            </p>

                                            <div className="pt-2 flex justify-end opacity-40 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[9px] font-bold text-blue-500 flex items-center gap-1 uppercase tracking-widest">
                                                    {t('common:tap_to_flip')} <RotateCcw size={10} />
                                                </span>
                                            </div>
                                        </div>

                                        <m.div
                                            className="absolute -right-2 -bottom-2 opacity-[0.03] dark:opacity-[0.07] pointer-events-none"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                                        >
                                            {step.watermark}
                                        </m.div>
                                    </div>
                                </div>

                                {/* BACK SIDE */}
                                <div
                                    className={`absolute inset-0 left-0 top-0 backface-hidden overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 glass-panel-premium will-change-transform ${step.featured ? 'border-blue-500/30' : ''}`}
                                    style={{
                                        transform: flippedCards[index] ? 'rotateY(0deg)' : 'rotateY(-180deg)',
                                        opacity: flippedCards[index] ? 1 : 0,
                                        transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.6s ease-out'
                                    }}
                                >
                                    <div className="absolute inset-0 p-7 flex flex-col text-center justify-center items-center h-full w-full">
                                        <div className={`absolute inset-0 bg-linear-to-br ${step.color} opacity-20 group-hover:opacity-40 transition-opacity`} />

                                        <div className="relative z-10 flex flex-col items-center justify-center h-full gap-4">
                                            <div className="p-4 rounded-full bg-white/50 dark:bg-black/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-lg mb-2 text-text-primary">
                                                {getBackIcon(index)}
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <h4 className="text-sm font-bold uppercase text-text-primary tracking-widest leading-tight">
                                                    {t(`dashboard:evolution.steps.${step.id}.back_title`)}
                                                </h4>

                                                <p className="text-caption font-medium text-text-secondary leading-relaxed max-w-[260px] mx-auto">
                                                    {t(`dashboard:evolution.steps.${step.id}.back_desc`)}
                                                </p>
                                            </div>

                                            <button className={`mt-2 px-6 py-2.5 rounded-xl text-label font-bold uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-lg ${index < 3 ? 'bg-error/10 text-error border border-error/20 hover:bg-error/20' : 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700'}`}>
                                                {index < 3 ? t('common.back') : t('marketing:income.cta.join')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </m.div>
                        </div>
                    ))}
                </div>

                {/* Dashboard Indicators - Absolutely positioned for zero-gap */}
                <div className="absolute left-0 right-0 bottom-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/40 dark:bg-black/40 border border-white/10 backdrop-blur-md shadow-sm">
                        {shiftSteps.map((_, i) => (
                            <m.div
                                key={i}
                                initial={false}
                                animate={{
                                    width: i === activeIndex ? 16 : 4,
                                    opacity: i === activeIndex ? 1 : 0.3,
                                    backgroundColor: i === activeIndex ? '#3b82f6' : 'currentColor'
                                }}
                                className="h-1 rounded-full text-slate-400"
                                style={{
                                    boxShadow: i === activeIndex ? '0 0 8px rgba(59, 130, 246, 0.5)' : 'none',
                                    transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)'
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
