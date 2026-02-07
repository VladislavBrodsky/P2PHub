import { motion } from 'framer-motion';
import { CommunityOrbit } from '../components/Marketing/CommunityOrbit';
import { Ticker } from '../components/Marketing/Ticker';
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
            className="flex w-full flex-col gap-8 pb-32 px-0 min-h-[100dvh]"
            variants={container}
            initial="hidden"
            animate="show"
        >

            {/* 1. Hero Section - Seamless Integration */}
            <motion.div variants={item} className="px-4 space-y-4">
                <div className="relative overflow-visible">
                    <CommunityOrbit />
                </div>

                <div className="text-center space-y-8 px-2">
                    <div className="space-y-2">
                        <motion.div
                            className="inline-block mb-2 rounded-full border border-blue-500/30 bg-blue-500/5 backdrop-blur-sm px-4 py-1.5"
                            animate={{
                                boxShadow: ["0 0 0px rgba(59, 130, 246, 0)", "0 0 15px rgba(59, 130, 246, 0.4)", "0 0 0px rgba(59, 130, 246, 0)"],
                                borderColor: ["rgba(59, 130, 246, 0.3)", "rgba(59, 130, 246, 0.8)", "rgba(59, 130, 246, 0.3)"]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-brand-blue)]">
                                Our Mission
                            </p>
                        </motion.div>
                        <h1 className="text-4xl font-extrabold tracking-tighter text-[var(--color-text-primary)] leading-[1.1]">
                            Together,<br />
                            Let's Build a Brand<br />
                            <motion.span
                                className="inline-block"
                                style={{
                                    background: 'linear-gradient(to right, #3B82F6, #8B5CF6, #3B82F6)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundSize: '200% auto'
                                }}
                                animate={{
                                    backgroundPosition: ['0% center', '200% center'],
                                    scale: [1, 1.05, 1],
                                }}
                                transition={{
                                    backgroundPosition: {
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "linear"
                                    },
                                    scale: {
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }
                                }}
                            >
                                That Truly Connects
                            </motion.span>
                        </h1>
                    </div>

                    {/* Ticker moved here with padding */}
                    <motion.div variants={item} className="-rotate-1 py-8 scale-[1.05]">
                        <Ticker />
                    </motion.div>

                    <div className="space-y-6">
                        <div className="space-y-1 px-4">
                            <h2 className="text-xl font-black text-[var(--color-text-secondary)] tracking-tight leading-tight max-w-[320px] mx-auto">
                                Join the Global Financial Shift and <br />
                                <motion.span
                                    className="inline-block uppercase tracking-[0.15em] mt-2 font-black text-2xl"
                                    style={{
                                        background: 'linear-gradient(to right, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundSize: '200% auto'
                                    }}
                                    animate={{
                                        backgroundPosition: ['0% center', '200% center']
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "linear"
                                    }}
                                >
                                    Digital Gold Rush
                                </motion.span>
                            </h2>
                        </div>

                        <p className="text-[var(--color-text-secondary)] mx-auto max-w-[340px] text-xs font-medium leading-relaxed opacity-80 px-4">
                            The global market is shifting. Traditional finance is slow, closed, and filled with friction. <strong className="text-[var(--color-text-primary)] font-bold">Pintopay</strong> is the bridge to a borderless era. We're not just building an app; we're launching a movement.
                        </p>
                    </div>
                </div>
            </motion.div>


        </motion.div>
    );
}

