import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, CheckCircle2, Sparkles, X, Rocket, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { Confetti } from '../ui/Confetti';
import { useHaptic } from '../../hooks/useHaptic';

interface ProWelcomeCardProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProWelcomeCard = ({ isOpen, onClose }: ProWelcomeCardProps) => {
    const { notification } = useHaptic();

    React.useEffect(() => {
        if (isOpen) {
            notification('success');
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        onClick={onClose}
                    />

                    <Confetti />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="relative w-full max-w-sm bg-linear-to-b from-slate-900 via-slate-900 to-blue-900 rounded-[2.5rem] border border-blue-500/30 p-6 shadow-[0_0_50px_rgba(59,130,246,0.2)] overflow-hidden"
                    >
                        {/* Animated Background Gradients */}
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                            <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle,rgba(59,130,246,0.15)_0%,transparent_70%)] animate-pulse" />
                        </div>

                        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                            {/* Pro Icon with Glow */}
                            <div className="relative">
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-20 h-20 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl relative z-10"
                                >
                                    <Crown className="w-10 h-10 text-white" />
                                </motion.div>
                                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-40 animate-pulse" />
                            </div>

                            <div className="space-y-2">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="flex items-center justify-center gap-2 text-blue-400 font-black text-xs uppercase tracking-[0.3em]"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    Account Upgraded
                                    <Sparkles className="w-3 h-3" />
                                </motion.div>
                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-3xl font-black text-white leading-tight"
                                >
                                    You are PRO Now!
                                </motion.h2>
                            </div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="grid grid-cols-1 gap-2 w-full"
                            >
                                <BenefitItem
                                    icon={<Zap className="w-4 h-4" />}
                                    text="5X Points Multiplier"
                                    desc="Earn faster on every action"
                                />
                                <BenefitItem
                                    icon={<Rocket className="w-4 h-4" />}
                                    text="Priority Withdrawals"
                                    desc="Instant commission processing"
                                />
                                <BenefitItem
                                    icon={<Crown className="w-4 h-4" />}
                                    text="Elite Badge"
                                    desc="Show off your status"
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="w-full pt-4"
                            >
                                <Button
                                    variant="primary"
                                    className="w-full h-12 rounded-xl bg-white text-blue-900 font-black text-base shadow-xl active:scale-95 transition-all"
                                    onClick={onClose}
                                >
                                    GET STARTED
                                </Button>
                            </motion.div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const BenefitItem = ({ icon, text, desc }: { icon: React.ReactNode, text: string, desc: string }) => (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-left">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            {icon}
        </div>
        <div className="flex flex-col">
            <span className="text-sm font-bold text-white leading-none">{text}</span>
            <span className="text-[10px] text-slate-400 mt-1 font-medium">{desc}</span>
        </div>
    </div>
);
