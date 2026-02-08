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

export default function Dashboard() {
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

    return (
        <motion.div
            className="flex w-full flex-col gap-0 pb-32 px-0 min-h-[100dvh] transition-colors duration-500 relative"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* Dark Mode Specific Background Textures */}
            <div className="fixed inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-1000">
                <div className="absolute inset-0 mesh-gradient-dark" />
                <div className="absolute top-0 left-0 w-full h-[50vh] bg-linear-to-b from-blue-500/5 to-transparent" />
            </div>

            {/* 1. Hero Section - Seamless Integration */}
            <motion.div variants={item} className="px-4 space-y-4 pt-4">
                <div className="relative overflow-visible">
                    <CommunityOrbit />
                </div>

                <div className="text-center space-y-8 px-2">
                    <div className="space-y-4">
                        <motion.div
                            className="inline-block rounded-full border border-blue-500/30 bg-blue-500/5 backdrop-blur-sm px-4 py-1.5"
                            animate={{
                                boxShadow: ["0 0 0px rgba(59, 130, 246, 0)", "0 0 15px rgba(59, 130, 246, 0.4)", "0 0 0px rgba(59, 130, 246, 0)"],
                                borderColor: ["rgba(59, 130, 246, 0.3)", "rgba(59, 130, 246, 0.8)", "rgba(59, 130, 246, 0.3)"]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">
                                The Financial Reset
                            </p>
                        </motion.div>
                        <h1 className="text-4xl font-extrabold tracking-tighter text-text-primary leading-[1.1]">
                            The World is Shifting.<br />
                            <motion.span
                                className="inline-block mt-1"
                                style={{
                                    background: 'linear-gradient(to right, #3B82F6, #FFFFFF, #3B82F6)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundSize: '200% auto',
                                    fontWeight: 900
                                }}
                                animate={{
                                    backgroundPosition: ['0% center', '200% center'],
                                    filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)'],
                                }}
                                transition={{
                                    backgroundPosition: {
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "linear"
                                    },
                                    filter: {
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }
                                }}
                            >
                                Own the Future.
                            </motion.span>
                        </h1>
                    </div>

                    {/* Ticker Section */}
                    <motion.div variants={item} className="-rotate-1 py-4 scale-[1.05]">
                        <Ticker />
                    </motion.div>

                    <div className="space-y-6">
                        <p className="text-text-secondary mx-auto max-w-[340px] text-xs font-semibold leading-relaxed opacity-80 px-4">
                            Traditional finance is slow, closed, and failing. <strong className="text-text-primary font-black">Pintopay</strong> is the bridge to a borderless era where you earn from the flow of global money.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* 2. Viral Proof - Partner Stats */}
            <motion.div variants={item}>
                <PartnerStats />
            </motion.div>

            {/* 3. The Evolution - Bento Grid */}
            <motion.div variants={item}>
                <BentoGrid />
            </motion.div>

            {/* 4. The Opportunity - Income Potential */}
            <motion.div variants={item}>
                <IncomePotential />
            </motion.div>

            {/* 5. Intelligence Hub - Blog Carousel */}
            <motion.div variants={item}>
                <BlogCarousel />
            </motion.div>

            {/* 6. Final CTA */}
            <motion.div variants={item} className="px-6 text-center py-12 space-y-6">
                <div className="p-2 px-6 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] w-fit mx-auto border border-blue-500/20 shadow-lg">
                    Movement Active: 142 Countries
                </div>
                <h4 className="text-2xl font-black tracking-tight text-text-primary">
                    Ready to build your <br />
                    global infrastructure?
                </h4>
                <p className="text-xs font-bold text-text-secondary max-w-[240px] mx-auto leading-relaxed">
                    Join the elite network of partners reclaiming financial sovereignty.
                </p>
            </motion.div>

        </motion.div >
    );
}
