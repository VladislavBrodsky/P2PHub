import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Shield, Star, Flame, Clock, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import { LeagueTier } from './LeagueCard';
import { useUI } from '../../context/UIContext';
import { LeaguePrizes } from './LeaguePrizes';

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

    const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const { setFooterVisible } = useUI();
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number } | null>(null);

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
                    setTimeLeft({ days, hours });
                } else {
                    setTimeLeft(null);
                }
            };

            calculateTimeLeft();
            const timer = setInterval(calculateTimeLeft, 1000 * 60 * 60); // Update every hour

            // Hide Footer
            setFooterVisible(false);

            // Prevent body scrolling - Robust version
            const originalStyle = window.getComputedStyle(document.body).overflow;
            const originalHTMLStyle = window.getComputedStyle(document.documentElement).overflow;
            
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            // Prevent bounce on iOS
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';

            return () => {
                clearInterval(interval);
                clearInterval(timer);
                setFooterVisible(true);
                document.body.style.overflow = originalStyle;
                document.documentElement.style.overflow = originalHTMLStyle;
                document.body.style.position = '';
                document.body.style.width = '';
            };
        }
    }, [isOpen, setFooterVisible]);

    const leagueData = {
        wooden: {
            icon: Shield,
            color: 'from-amber-700 via-amber-800 to-amber-950',
            glow: 'shadow-amber-500/50',
        },
        silver: {
            icon: Trophy,
            color: 'from-slate-400 via-slate-500 to-slate-700',
            glow: 'shadow-slate-400/50',
        },
        metal: {
            icon: Shield,
            color: 'from-zinc-700 via-zinc-800 to-zinc-950',
            glow: 'shadow-zinc-500/50',
        },
        gold: {
            icon: Star,
            color: 'from-amber-400 via-yellow-500 to-orange-600',
            glow: 'shadow-yellow-400/50',
        },
        platinum: {
            icon: Flame,
            color: 'from-[#6366f1] via-[#a855f7] to-[#ec4899]',
            glow: 'shadow-purple-500/50',
        }
    };

    const config = leagueData[currentLeague];
    const Icon = config.icon;

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-9999 flex items-end sm:items-center justify-center pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 dark:bg-slate-950/45 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%', opacity: 0 }}
                        animate={isDesktop ? { scale: 1, opacity: 1 } : { y: 0, opacity: 1 }}
                        exit={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
                        className="relative w-full max-w-[380px] max-h-[85vh] flex flex-col overflow-hidden rounded-[32px] bg-zinc-950 border border-white/10 shadow-2xl"
                    >
                        {/* Dynamic Top Gradient Area */}
                        <div className={`relative h-28 shrink-0 bg-linear-to-br transition-colors duration-500 ${config.color}`}>
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
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 backdrop-blur-md border border-white/10 whitespace-nowrap"
                            >
                                <Clock className="h-3.5 w-3.5 text-white/90" />
                                <span className="text-[10px] font-black uppercase tracking-wider text-white/90">
                                    {timeLeft
                                        ? t('league.rewards_popup.ends_in_format', { days: timeLeft.days, hours: timeLeft.hours, defaultValue: `Ends in ${timeLeft.days}d ${timeLeft.hours}h` })
                                        : t('league.rewards_popup.ending_soon', 'Ending soon!')}
                                </span>
                            </motion.div>
                        </div>

                        {/* Content Area - Scrollable */}
                        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 custom-scrollbar">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="mb-4"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles className="w-4 h-4 text-emerald-500" />
                                    <h2 className="text-[clamp(1.1rem,4vw,1.25rem)] font-black tracking-tight text-white uppercase">
                                        {t('league.rewards_popup.title', 'БОРЬБА ЗА НАГРАДЫ')}
                                    </h2>
                                </div>
                                <p className="text-[11px] font-bold leading-tight text-white/40 uppercase tracking-widest">
                                    {t('league.rewards_popup.subtitle', 'Reach TOP-10 for exclusive prizes')}
                                </p>
                            </motion.div>

                            {/* Prize List Component */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/2 p-1 mb-6 shadow-xl backdrop-blur-2xl"
                            >
                                <LeaguePrizes league={currentLeague} showHeader={false} />
                            </motion.div>

                            {/* Action Button */}
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                onClick={onClose}
                                className={`w-full rounded-2xl bg-linear-to-r ${config.color} py-3.5 px-4 text-[13px] font-black uppercase tracking-widest text-white shadow-lg transition-transform active:scale-[0.98] relative overflow-hidden group`}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                <span className="relative z-10">{t('league.rewards_popup.close', 'ПОНЯТНО')}</span>
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
