import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Smartphone, Zap, Globe, Coins, QrCode, RotateCcw, AlertTriangle, Lock, TrendingUp, Infinity as IconInfinity } from 'lucide-react';
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
    const { t } = useTranslation();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

    const toggleFlip = (index: number) => {
        setFlippedCards(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handleScroll = () => {
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
    };

    return (
        <section className="px-4 py-8 space-y-8 overflow-hidden">
            <div className="space-y-3 flex flex-col items-center text-center">
                <div className="flex items-center gap-2">
                    <motion.div
                        className="w-2 h-2 rounded-full bg-blue-500"
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">{t('evolution.badge')}</span>
                </div>
                <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl font-black tracking-tight text-(--color-text-primary) leading-[1.1] whitespace-pre-line"
                >
                    {t('evolution.title')}
                </motion.h3>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-sm text-(--color-text-secondary) font-medium max-w-[280px] mx-auto"
                >
                    {t('evolution.desc')}
                </motion.p>
            </div>

            {/* Carousel Container */}
            <div className="relative">
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex gap-4 overflow-x-auto pb-8 snap-x snap-mandatory no-scrollbar px-4 -mx-4 md:mx-0 md:px-0 scroll-smooth"
                >
                    {shiftSteps.map((step, index) => (
                        <div
                            key={index}
                            className={`relative group shrink-0 w-[85vw] md:w-[400px] h-[300px] snap-center perspective-1000 cursor-pointer`}
                            onClick={() => toggleFlip(index)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true, margin: "-10%" }}
                                transition={{
                                    duration: 0.4,
                                    delay: index * 0.05,
                                    ease: [0.23, 1, 0.32, 1]
                                }}
                                animate={{ rotateY: flippedCards[index] ? 180 : 0 }}
                                style={{ transformStyle: "preserve-3d" }}
                                className={`w-full h-full relative duration-500`}
                            >
                                {/* FRONT SIDE */}
                                <div
                                    className={`absolute inset-0 backface-hidden overflow-hidden rounded-[2.5rem] border border-(--color-border-glass) p-6 glass-panel-premium transition-colors duration-300 ${step.featured ? 'border-blue-500/30' : ''}`}
                                    style={{ transform: 'rotateY(0deg)' }}
                                >
                                    <div className={`absolute inset-0 bg-linear-to-br ${step.color} opacity-40 group-hover:opacity-60 transition-opacity`} />

                                    <div className="relative z-10 space-y-4 h-full flex flex-col">
                                        <div className="flex items-center justify-between">
                                            <div className="p-3 w-fit rounded-2xl bg-(--color-bg-app)/50 dark:bg-black/40 backdrop-blur-xl border border-(--color-border-glass) shadow-lg transition-transform group-hover:scale-110">
                                                {step.icon}
                                            </div>
                                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${step.statusColor} tracking-widest`}>
                                                {t(`evolution.steps.${step.id}.status`)}
                                            </span>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-(--color-text-secondary) opacity-60">
                                                {t(`evolution.steps.${step.id}.title`)}
                                            </p>
                                            <h4 className={`text-xl font-black leading-tight ${step.featured ? 'text-blue-500' : 'text-(--color-text-primary)'}`}>
                                                {t(`evolution.steps.${step.id}.subtitle`)}
                                            </h4>
                                        </div>

                                        <p className="text-xs font-semibold leading-relaxed text-(--color-text-secondary) opacity-80 grow">
                                            {t(`evolution.steps.${step.id}.desc`)}
                                        </p>

                                        <div className="pt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[9px] font-black text-blue-500 flex items-center gap-1">
                                                TAP TO FLIP <RotateCcw size={10} />
                                            </span>
                                        </div>
                                    </div>

                                    <motion.div
                                        className="absolute -right-2 -bottom-2 opacity-5 pointer-events-none"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                                    >
                                        {step.watermark}
                                    </motion.div>
                                </div>

                                {/* BACK SIDE */}
                                <div
                                    className={`absolute inset-0 backface-hidden overflow-hidden rounded-[2.5rem] border border-(--color-border-glass) p-6 glass-panel-premium flex flex-col text-center justify-center items-center shadow-2xl transition-colors duration-300 ${step.featured ? 'border-blue-500/30' : ''}`}
                                    style={{ transform: 'rotateY(180deg)' }}
                                >
                                    <div className={`absolute inset-0 bg-linear-to-br ${step.color} opacity-40 group-hover:opacity-60 transition-opacity`} />

                                    <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-4">
                                        {/* Alert Icon based on step */}
                                        <div className="p-4 rounded-full bg-(--color-bg-app)/50 dark:bg-black/40 backdrop-blur-xl border border-(--color-border-glass) shadow-lg mb-2">
                                            {index < 2 ? (
                                                <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
                                            ) : index === 2 ? (
                                                <Lock className="w-8 h-8 text-amber-500" />
                                            ) : (
                                                <TrendingUp className="w-8 h-8 text-emerald-500" />
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="text-sm font-black uppercase text-(--color-text-primary) tracking-widest leading-tight">
                                                {t(`evolution.steps.${step.id}.back_title`)}
                                            </h4>

                                            <p className="text-[11px] font-medium text-(--color-text-secondary) leading-relaxed opacity-90 max-w-[260px] mx-auto">
                                                {t(`evolution.steps.${step.id}.back_desc`)}
                                            </p>
                                        </div>

                                        <button className={`mt-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-lg ${index < 3 ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' : 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600'}`}>
                                            {index < 3 ? t('common.back') : t('income.cta.join')}
                                        </button>
                                    </div>

                                    <motion.div
                                        className="absolute -left-10 -top-10 opacity-5 pointer-events-none"
                                        animate={{ rotate: -360 }}
                                        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                                    >
                                        {step.watermark}
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>

                {/* Premium Pagination Indicator */}
                <div className="flex flex-col items-center gap-4 mt-2">
                    {/* Compact Pagination Dots */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/5 dark:bg-white/5 border border-white/5 backdrop-blur-md shadow-inner">
                        {shiftSteps.map((_, i) => (
                            <motion.div
                                key={i}
                                initial={false}
                                animate={{
                                    width: i === activeIndex ? 16 : 4,
                                    opacity: i === activeIndex ? 1 : 0.3,
                                    backgroundColor: i === activeIndex ? '#3b82f6' : '#94a3b8'
                                }}
                                className="h-1 rounded-full"
                                style={{
                                    boxShadow: i === activeIndex ? '0 0 8px rgba(59, 130, 246, 0.5)' : 'none',
                                    transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)'
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
