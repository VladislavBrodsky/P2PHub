import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Zap, Target, Shield, Rocket } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptic } from '../../hooks/useHaptic';

interface OnboardingStoryProps {
    onComplete: () => void;
}

const STORIES = [
    {
        title: 'The Velocity Era',
        desc: "Traditional finance is slow and restricted. We're building a bridge to borderless, instant P2P wealth.",
        icon: <Zap className="w-12 h-12 text-yellow-400" />,
        color: 'from-blue-600 to-indigo-600'
    },
    {
        title: 'The $1 Strategy',
        desc: "Unlock the secret to high-velocity settlements. Every minute counts in the new digital economy.",
        icon: <Target className="w-12 h-12 text-emerald-400" />,
        color: 'from-emerald-600 to-teal-600'
    },
    {
        title: 'Network Sovereignty',
        desc: "Build a multi-level matrix. Your network is your net worth, 5 levels deep in true sovereignty.",
        icon: <Shield className="w-12 h-12 text-blue-400" />,
        color: 'from-indigo-600 to-purple-600'
    },
    {
        title: 'Launch Readiness',
        desc: "Your journey starts now. Expand the perimeter, earn XP, and reach the Physical Platinum Tier.",
        icon: <Rocket className="w-12 h-12 text-rose-400" />,
        color: 'from-rose-600 to-pink-600'
    }
];

export const OnboardingStory = ({ onComplete }: OnboardingStoryProps) => {
    const [index, setIndex] = useState(0);
    const { t } = useTranslation();
    const { selection, notification } = useHaptic();

    const next = () => {
        selection();
        if (index < STORIES.length - 1) {
            setIndex(index + 1);
        } else {
            notification('success');
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-200 bg-black">
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`relative w-full h-full flex flex-col items-center justify-center p-8 bg-linear-to-br ${STORIES[index].color}`}
                >
                    {/* Progress Bar */}
                    <div className="absolute top-12 left-6 right-6 flex gap-1.5 z-10">
                        {STORIES.map((_, i) => (
                            <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: i < index ? '100%' : i === index ? '100%' : '0%' }}
                                    transition={{ duration: i === index ? 5 : 0, ease: 'linear' }}
                                    onAnimationComplete={() => i === index && next()}
                                    className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                />
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={onComplete}
                        className="absolute top-20 right-6 z-20 p-2 rounded-full bg-white/10 backdrop-blur-md text-white/70 hover:text-white"
                    >
                        <X size={20} />
                    </button>

                    <div className="relative z-10 text-center space-y-8 max-w-sm">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="w-24 h-24 bg-white/10 backdrop-blur-2xl rounded-[2rem] border border-white/20 flex items-center justify-center mx-auto shadow-2xl shadow-black/20"
                        >
                            {STORIES[index].icon}
                        </motion.div>

                        <div className="space-y-4">
                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-4xl font-black text-white tracking-tighter"
                            >
                                {STORIES[index].title}
                            </motion.h2>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-lg text-white/80 font-bold leading-relaxed"
                            >
                                {STORIES[index].desc}
                            </motion.p>
                        </div>
                    </div>

                    <div className="absolute bottom-12 left-6 right-6">
                        <button
                            onClick={next}
                            className="w-full h-16 rounded-2xl bg-white text-slate-900 font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-2xl shadow-black/20"
                        >
                            {index === STORIES.length - 1 ? 'GET STARTED' : 'NEXT'}
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
