import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Smartphone, Zap, Globe, Coins, QrCode } from 'lucide-react';
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

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const width = scrollRef.current.clientWidth;
        const scrollLeft = scrollRef.current.scrollLeft;
        const index = Math.round(scrollLeft / (width * 0.85)); // 0.85 is the card width factor
        const clampedIndex = Math.max(0, Math.min(index, shiftSteps.length - 1));
        if (clampedIndex !== activeIndex) setActiveIndex(clampedIndex);
    };

    return (
        <section className="px-4 py-8 space-y-8">
            <div className="space-y-3 flex flex-col items-center text-center">
                <div className="flex items-center gap-2">
                    <motion.div
                        className="w-2 h-2 rounded-full bg-blue-500"
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">{t('evolution.badge')}</span>
                </div>
                <h3 className="text-3xl font-black tracking-tight text-(--color-text-primary) leading-[1.1] whitespace-pre-line">
                    {t('evolution.title')}
                </h3>
                <p className="text-sm text-(--color-text-secondary) font-medium max-w-[280px] mx-auto">
                    {t('evolution.desc')}
                </p>
            </div>

            {/* Carousel Container */}
            <div className="relative">
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex gap-4 overflow-x-auto pb-8 snap-x snap-mandatory no-scrollbar px-4 -mx-4 md:mx-0 md:px-0"
                >
                    {shiftSteps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative group shrink-0 w-[85vw] md:w-[400px] snap-center overflow-hidden rounded-[2.5rem] border border-(--color-border-glass) p-6 glass-panel-premium transition-all duration-300 ${step.featured ? 'border-blue-500/30' : ''}`}
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
                            </div>

                            <motion.div
                                className="absolute -right-2 -bottom-2 opacity-5 pointer-events-none"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                            >
                                {step.watermark}
                            </motion.div>
                        </motion.div>
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
                                className="h-1 rounded-full transition-all duration-300"
                                style={{
                                    boxShadow: i === activeIndex ? '0 0 8px rgba(59, 130, 246, 0.5)' : 'none'
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
