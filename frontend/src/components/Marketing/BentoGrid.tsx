import { motion } from 'framer-motion';
import { CreditCard, Smartphone, Zap, Globe, Coins, QrCode } from 'lucide-react';

const shiftSteps = [
    {
        title: "Primitive Era",
        subtitle: "Traditional Cash",
        description: "Physical, slow, and restricted by borders. Prone to inflation and theft.",
        icon: <Coins className="w-6 h-6 text-amber-500" />,
        color: "from-amber-500/10 via-transparent to-transparent",
        size: "col-span-1",
        status: "OBSOLETE",
        statusColor: "text-amber-500 bg-amber-500/10"
    },
    {
        title: "The Friction Gap",
        subtitle: "TradFi & Cards",
        description: "Hidden fees and 3-5 day delays. You don't own your money.",
        icon: <CreditCard className="w-6 h-6 text-blue-500" />,
        color: "from-blue-500/10 via-transparent to-transparent",
        size: "col-span-1",
        status: "VULNERABLE",
        statusColor: "text-blue-500 bg-blue-500/10"
    },
    {
        title: "The Digital Proxy",
        subtitle: "Mobile Wallets",
        description: "Apple/Google Pay. Convenient, but still tied to failing legacy rails.",
        icon: <Smartphone className="w-6 h-6 text-purple-500" />,
        color: "from-purple-500/10 via-transparent to-transparent",
        size: "col-span-2",
        status: "STABLE",
        statusColor: "text-purple-500 bg-purple-500/10"
    },
    {
        title: "The Financial Reset",
        subtitle: "Crypto & Web3",
        description: "True ownership and 24/7 global liquidity. The bridge to freedom.",
        icon: <Globe className="w-6 h-6 text-emerald-500" />,
        color: "from-emerald-500/10 via-transparent to-transparent",
        size: "col-span-2",
        status: "FREEDOM",
        statusColor: "text-emerald-500 bg-emerald-500/10"
    },
    {
        title: "ELITE VELOCITY",
        subtitle: "Pintopay QR",
        description: "Instant, global, P2P settlements at $1/minute velocity. The ultimate infrastructure.",
        icon: <QrCode className="w-6 h-6 text-blue-400" />,
        color: "from-blue-600/30 via-blue-400/5 to-transparent",
        size: "col-span-2",
        featured: true,
        status: "ELITE",
        statusColor: "text-white bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
    }
];

export const BentoGrid = () => {
    return (
        <section className="px-4 py-8 space-y-8">
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <motion.div
                        className="w-2 h-2 rounded-full bg-blue-500"
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Live Evolution</span>
                </div>
                <h3 className="text-3xl font-black tracking-tight text-text-primary leading-[1.1]">
                    The Great <br />
                    Financial Shift
                </h3>
                <p className="text-sm text-text-secondary font-medium max-w-[280px]">
                    The world is upgrading. Move from physical limits to digital light velocity.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {shiftSteps.map((step, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className={`relative group overflow-hidden rounded-[2.5rem] border border-border-glass p-6 glass-panel ${step.size} ${step.featured ? 'border-blue-500/50 bg-blue-500/2' : ''}`}
                    >
                        <div className={`absolute inset-0 bg-linear-to-br ${step.color} opacity-30 group-hover:opacity-60 transition-opacity`} />

                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="p-3 w-fit rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-lg">
                                    {step.icon}
                                </div>
                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${step.statusColor} tracking-widest`}>
                                    {step.status}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-60">
                                    {step.title}
                                </p>
                                <h4 className={`text-xl font-black leading-tight ${step.featured ? 'text-blue-500' : 'text-text-primary'}`}>
                                    {step.subtitle}
                                </h4>
                            </div>

                            <p className="text-xs font-semibold leading-relaxed text-text-secondary opacity-80">
                                {step.description}
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
        </section>
    );
};
