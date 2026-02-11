import { motion, AnimatePresence } from 'framer-motion';
// #comment: Removed unused Star and ChevronRight icons from lucide-react to clean up the import list
import { Trophy, Sparkles, X, ShieldCheck, Zap, Gem, CreditCard, Share2 } from 'lucide-react';
// #comment: Removed unused t variable from useTranslation as local benefit texts are used instead
import { useTranslation, Trans } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { useHaptic } from '../../hooks/useHaptic';

interface Level100AchievementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Level100AchievementModal = ({ isOpen, onClose }: Level100AchievementModalProps) => {
    const { t } = useTranslation();
    const { user } = useUser();
    const { impact } = useHaptic();

    const benefits = [
        {
            icon: CreditCard,
            title: t('level100.benefit_1_title'),
            desc: t('level100.benefit_1_desc'),
            color: 'text-slate-400',
            bg: 'bg-slate-400/10'
        },
        {
            icon: Gem,
            title: t('level100.benefit_2_title'),
            desc: t('level100.benefit_2_desc'),
            color: 'text-purple-400',
            bg: 'bg-purple-400/10'
        },
        {
            icon: Zap,
            title: t('level100.benefit_3_title'),
            desc: t('level100.benefit_3_desc'),
            color: 'text-yellow-400',
            bg: 'bg-yellow-400/10'
        },
        {
            icon: ShieldCheck,
            title: t('level100.benefit_4_title'),
            desc: t('level100.benefit_4_desc'),
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10'
        }
    ];

    const handleShare = () => {
        impact('heavy');
        const link = `https://t.me/pintopay_probot?start=${user?.referral_code || ''}`;
        const referralCode = user?.referral_code || '';

        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.switchInlineQuery(referralCode);
        } else if (navigator.share) {
            const text = "I'm climbing to Level 100 in Pintopay! Join my network to unlock Fanocracy benefits together! 🚀";
            navigator.share({ title: 'Join P2PHub', text, url: link });
        } else {
            navigator.clipboard.writeText(link);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center overflow-hidden">
                    {/* Immersive Backdrop */}
                    // #comment: Updated z-index to standard Tailwind 4.0 class for better compatibility
                    // #comment: Updated z-index to standard Tailwind 4.0 class for better compatibility
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
                    />

                    {/* Content Container (Premium UI) */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-lg sm:max-w-md bg-white dark:bg-[#020617] rounded-t-[3rem] sm:rounded-[3rem] p-8 pb-12 sm:pb-8 text-center shadow-[0_-20px_40px_rgba(0,0,0,0.3)] border-t border-slate-200 dark:border-white/10 sm:border"
                    >
                        {/* iPhone 16 Pro Style Indicator */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full sm:hidden" />

                        {/* Animated Background Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-600/20 blur-[80px] rounded-full pointer-events-none" />

                        {/* Header */}
                        <div className="relative mb-6 pt-4">
                            <motion.div
                                animate={{
                                    scale: [1, 1.05, 1],
                                    rotate: [0, 2, -2, 0]
                                }}
                                transition={{ duration: 5, repeat: Infinity }}
                                className="w-20 h-20 bg-linear-to-tr from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/20"
                            >
                                <Trophy className="w-10 h-10 text-white" />
                            </motion.div>

                            <motion.div
                                className="absolute top-0 right-1/3"
                                animate={{ y: [-10, 10, -10], opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <Sparkles className="w-6 h-6 text-yellow-500" />
                            </motion.div>
                        </div>

                        <div className="space-y-4 mb-8 text-left">
                            <div className="text-center">
                                <h2 className="text-[10px] font-black tracking-[0.4em] text-blue-600 dark:text-blue-400 uppercase">
                                    {t('level100.apex_achievement')}
                                </h2>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                                    <Trans i18nKey="level100.fanocracy_title">
                                        LvL 100 <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Fanocracy</span>
                                    </Trans>
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-2 px-4 italic">
                                    {t('level100.fanocracy_quote')}
                                </p>
                            </div>

                            {/* Benefits Grid */}
                            <div className="grid grid-cols-1 gap-3 mt-6">
                                {benefits.map((b, i) => (
                                    <motion.div
                                        key={b.title}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5"
                                    >
                                        <div className={`p-2.5 rounded-xl ${b.bg} ${b.color}`}>
                                            <b.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-black text-slate-900 dark:text-white leading-tight">
                                                {b.title}
                                            </h4>
                                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-500 leading-tight mt-0.5">
                                                {b.desc}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* CTA Section */}
                        <div className="space-y-4">
                            <button
                                onClick={handleShare}
                                className="w-full h-14 rounded-2xl bg-blue-600 active:scale-95 transition-all shadow-[0_10px_30px_-5px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 group"
                            >
                                <span className="text-sm font-black text-white tracking-widest">{t('level100.claim_btn')}</span>
                                <Share2 className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
                            </button>

                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest animate-pulse">
                                {t('level100.limited_slots')}
                            </p>
                        </div>

                        {/* Close button */}
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
