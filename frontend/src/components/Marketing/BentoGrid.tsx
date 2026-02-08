import { motion } from 'framer-motion';
import { CreditCard, Smartphone, Zap, Globe, Coins, QrCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const shiftSteps = [
    {
        id: 0,
        icon: <Coins className="w-6 h-6 text-amber-500" />,
        color: "from-amber-500/10 via-transparent to-transparent",
        size: "col-span-1",
        statusColor: "text-amber-500 bg-amber-500/10"
    },
    {
        id: 1,
        icon: <CreditCard className="w-6 h-6 text-blue-500" />,
        color: "from-blue-500/10 via-transparent to-transparent",
        size: "col-span-1",
        statusColor: "text-blue-500 bg-blue-500/10"
    },
    {
        id: 2,
        icon: <Smartphone className="w-6 h-6 text-purple-500" />,
        color: "from-purple-500/10 via-transparent to-transparent",
        size: "col-span-2",
        statusColor: "text-purple-500 bg-purple-500/10"
    },
    {
        id: 3,
        icon: <Globe className="w-6 h-6 text-emerald-500" />,
        color: "from-emerald-500/10 via-transparent to-transparent",
        size: "col-span-2",
        statusColor: "text-emerald-500 bg-emerald-500/10"
    },
    {
        id: 4,
        icon: <QrCode className="w-6 h-6 text-blue-400" />,
        color: "from-blue-600/30 via-blue-400/5 to-transparent",
        size: "col-span-2",
        featured: true,
        statusColor: "text-white bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
    }
];

export const BentoGrid = () => {
    const { t } = useTranslation();

    return (
        <section className="px-4 py-8 space-y-8">
            <div className="space-y-3">
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
                <p className="text-sm text-(--color-text-secondary) font-medium max-w-[280px]">
                    {t('evolution.desc')}
                </p>
            </div>

            {/* Carousel Container */}
            <div className="relative">
                <div className="flex gap-4 overflow-x-auto pb-8 snap-x snap-mandatory no-scrollbar px-4 -mx-4 md:mx-0 md:px-0">
                    {shiftSteps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative group flex-shrink-0 w-[85vw] md:w-[400px] snap-center overflow-hidden rounded-[2.5rem] border border-(--color-border-glass) p-6 glass-panel-premium transition-all duration-300 ${step.featured ? 'border-blue-500/30' : ''}`}
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

                                <p className="text-xs font-semibold leading-relaxed text-(--color-text-secondary) opacity-80 flex-grow">
                                    {t(`evolution.steps.${step.id}.desc`)}
                                </p>
                            </div>

                            {step.featured && (
                                <motion.div
                                    className="absolute -right-2 -bottom-2 opacity-5 pointer-events-none"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                                >
                                    <Zap className="w-40 h-40 text-blue-500" fill="currentColor" />
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Progress Slider */}
                <div className="mt-8 px-4">
                    <div className="h-1.5 w-full max-w-xs mx-auto bg-slate-900/5 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: '20%' }} // Placeholder for scroll progress logic if needed, but simple layout for now.
                            animate={{
                                x: [0, 100, 0],
                                width: ['20%', '20%', '20%']
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 3,
                                ease: "easeInOut"
                            }}
                        />
                    </div>
                    <p className="text-center text-[10px] font-bold text-brand-muted mt-2 uppercase tracking-widest opacity-60">
                        Swipe to Explore
                    </p>
                </div>
            </div>
        </section>
    );
};
