import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Confetti } from '../ui/Confetti';

interface LevelUpModalProps {
    isOpen: boolean;
    level: number;
    onClose: () => void;
}

export const LevelUpModal = ({ isOpen, level, onClose }: LevelUpModalProps) => {
    const { t } = useTranslation();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-6 sm:p-12 overflow-hidden">
                    <Confetti />

                    {/* Immersive Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    />

                    {/* Content Container */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 100 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="relative w-full max-w-sm bg-white dark:bg-[#020617] rounded-[3rem] p-8 text-center shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-white/10"
                    >
                        {/* Background Accents */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-400/20 blur-[60px] rounded-full pointer-events-none" />

                        {/* Header Icons */}
                        <div className="relative mb-8 pt-4">
                            <motion.div
                                animate={{
                                    rotate: [0, -10, 10, -10, 0],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Trophy className="w-24 h-24 text-yellow-500 mx-auto drop-shadow-[0_0_20px_rgba(234,179,8,0.4)]" />
                            </motion.div>

                            <motion.div
                                className="absolute top-4 right-1/4"
                                animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Sparkles className="w-8 h-8 text-yellow-300" />
                            </motion.div>

                            <motion.div
                                className="absolute bottom-4 left-1/4"
                                animate={{ scale: [1, 1.3, 1], rotate: 45 }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <Star className="w-6 h-6 text-orange-400 fill-orange-400" />
                            </motion.div>
                        </div>

                        {/* Text Content */}
                        <div className="space-y-4 mb-10">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h2 className="text-[12px] font-black tracking-[0.4em] text-yellow-600 dark:text-yellow-500 uppercase">
                                    {t('referral.levelup.title')}
                                </h2>
                                <h3 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mt-2">
                                    {t('referral.levelup.rank')} <span className="text-yellow-500">{level}</span>
                                </h3>
                            </motion.div>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-slate-600 dark:text-slate-400 font-bold leading-relaxed max-w-[200px] mx-auto"
                            >
                                {t('referral.levelup.reached', { level: level })}
                            </motion.p>
                        </div>

                        {/* Action Button */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            onClick={onClose}
                            className="w-full py-5 rounded-2xl bg-yellow-500 active:scale-95 transition-transform shadow-[0_10px_20px_-5px_rgba(234,179,8,0.4)]"
                        >
                            <span className="text-lg font-black text-white tracking-tight">{t('referral.levelup.awesome')}</span>
                        </motion.button>

                        {/* Close button (top right) */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
