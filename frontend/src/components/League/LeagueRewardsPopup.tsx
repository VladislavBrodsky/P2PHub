import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Shield, Star, Flame, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import type { LeagueTier } from './LeagueCard';

interface LeagueRewardsPopupProps {
    isOpen: boolean;
    onClose: () => void;
    currentLeague: LeagueTier;
}

export const LeagueRewardsPopup: React.FC<LeagueRewardsPopupProps> = ({
    isOpen,
    onClose,
    currentLeague,
}) => {
    const { t } = useTranslation(['social']);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Trigger confetti blast on open
            const duration = 3000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
            }, 250);

            // Setup FOMO timer (e.g., end of month)
            const calculateTimeLeft = () => {
                const now = new Date();
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                const difference = endOfMonth.getTime() - now.getTime();

                if (difference > 0) {
                    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                    setTimeLeft(`${days}d ${hours}h`);
                } else {
                    setTimeLeft('Ending soon!');
                }
            };

            calculateTimeLeft();
            const timer = setInterval(calculateTimeLeft, 1000 * 60 * 60); // Update every hour

            // Prevent body scrolling
            document.body.style.overflow = 'hidden';

            return () => {
                clearInterval(interval);
                clearInterval(timer);
                document.body.style.overflow = 'unset';
            };
        }
    }, [isOpen]);

    const leagueData = {
        wooden: {
            icon: Shield,
            color: 'from-amber-700 via-amber-800 to-amber-950',
            glow: 'shadow-amber-500/50',
            title: t('league.rewards_popup.wooden.title'),
            desc: t('league.rewards_popup.wooden.desc'),
            prizes: t('league.rewards_popup.wooden.prizes'),
        },
        silver: {
            icon: Trophy,
            color: 'from-slate-400 via-slate-500 to-slate-700',
            glow: 'shadow-slate-400/50',
            title: t('league.rewards_popup.silver.title'),
            desc: t('league.rewards_popup.silver.desc'),
            prizes: t('league.rewards_popup.silver.prizes'),
        },
        metal: {
            icon: Shield,
            color: 'from-zinc-700 via-zinc-800 to-zinc-950',
            glow: 'shadow-zinc-500/50',
            title: t('league.rewards_popup.metal.title'),
            desc: t('league.rewards_popup.metal.desc'),
            prizes: t('league.rewards_popup.metal.prizes'),
        },
        gold: {
            icon: Star,
            color: 'from-amber-400 via-yellow-500 to-orange-600',
            glow: 'shadow-yellow-400/50',
            title: t('league.rewards_popup.gold.title'),
            desc: t('league.rewards_popup.gold.desc'),
            prizes: t('league.rewards_popup.gold.prizes'),
        },
        platinum: {
            icon: Flame,
            color: 'from-[#6366f1] via-[#a855f7] to-[#ec4899]',
            glow: 'shadow-purple-500/50',
            title: t('league.rewards_popup.platinum.title'),
            desc: t('league.rewards_popup.platinum.desc'),
            prizes: t('league.rewards_popup.platinum.prizes'),
        }
    };

    const config = leagueData[currentLeague];
    const Icon = config.icon;

    // Formatting prizes to handle newlines from translation
    const formatPrizes = (prizesString: string) => {
        return prizesString.split('\n').map((prize, idx) => {
            const separatorIndex = prize.indexOf(':');
            const bold = separatorIndex !== -1 ? prize.substring(0, separatorIndex) : prize;
            const rest = separatorIndex !== -1 ? prize.substring(separatorIndex + 1).trim() : '';

            return (
                <div key={idx} className="flex items-center gap-3 bg-black/40 rounded-[14px] p-2.5 border border-white/5 hover:border-white/10 hover:bg-white/[0.02] transition-colors relative overflow-hidden group">
                    <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                    <div className={`flex shrink-0 items-center justify-center w-8 h-8 rounded-[10px] bg-linear-to-br ${config.color} shadow-md shadow-black/40 relative`}>
                        <div className="absolute inset-0 bg-white/20 rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity" />
                        {idx === 0 ? <Trophy className="w-4 h-4 text-white drop-shadow-md" /> : <Star className="w-4 h-4 text-white drop-shadow-md" />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="text-[13px] leading-tight">
                            <span className="font-extrabold text-white tracking-wide inline-block mr-1.5">{bold}:</span>
                            <span className="text-white/75 font-medium inline-block">{rest}</span>
                        </div>
                    </div>
                </div>
            );
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
                        className="relative w-full max-w-sm overflow-hidden rounded-[32px] bg-zinc-900 border border-white/10 shadow-y-2xl"
                    >
                        {/* Dynamic Top Gradient Area */}
                        <div className={`relative h-40 bg-linear-to-br transition-colors duration-500 ${config.color}`}>
                            {/* Glossy Overlay */}
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.2),transparent_70%)] mix-blend-overlay" />

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white/80 backdrop-blur-md transition-colors hover:bg-black/40 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            {/* Floating Icon */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1, type: "spring" }}
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                            >
                                <div className={`flex h-16 w-16 items-center justify-center rounded-[20px] bg-white/20 backdrop-blur-xl shadow-2xl border border-white/30 rotate-3`}>
                                    <Icon className="h-8 w-8 text-white drop-shadow-md" />
                                </div>
                            </motion.div>

                            {/* Deadline Badge */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 backdrop-blur-md border border-white/10"
                            >
                                <Clock className="h-3.5 w-3.5 text-white/90" />
                                <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                                    Ends in {timeLeft}
                                </span>
                            </motion.div>
                        </div>

                        {/* Content Area */}
                        <div className="p-5">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h2 className="text-[20px] font-black tracking-tight text-white mb-0.5">
                                    {t('league.rewards_popup.title')}
                                </h2>
                                <p className="text-[14px] font-medium leading-relaxed text-white/60 mb-4">
                                    {t('league.rewards_popup.subtitle')}
                                </p>
                            </motion.div>

                            {/* Tier Specific Message Box */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className={`relative overflow-hidden rounded-[24px] border border-white/10 bg-white/5 p-4 mb-5 shadow-2xl backdrop-blur-xl`}
                            >
                                <div className={`absolute top-0 left-0 w-1.5 h-full bg-linear-to-b ${config.color}`} />
                                <div className={`absolute -right-12 -top-12 w-32 h-32 bg-linear-to-br ${config.color} opacity-20 blur-[30px] rounded-full pointer-events-none`} />

                                <div className="relative z-10 pl-1.5">
                                    <h3 className="text-[17px] font-black text-white tracking-wide mb-1 drop-shadow-sm">
                                        {config.title}
                                    </h3>
                                    <p className="text-[13.5px] text-white/70 leading-relaxed mb-4 font-medium sm:max-w-[95%]">
                                        {config.desc}
                                    </p>

                                    <div className="flex flex-col gap-2">
                                        {formatPrizes(config.prizes)}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Action Button */}
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                onClick={onClose}
                                className={`w-full rounded-2xl bg-linear-to-r ${config.color} py-3.5 px-4 text-[15px] font-bold text-white shadow-lg transition-transform active:scale-[0.98] relative overflow-hidden group`}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                <span className="relative z-10">{t('league.rewards_popup.close')}</span>
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
