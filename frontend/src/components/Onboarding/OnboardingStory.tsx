import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Zap, Target, Shield, Rocket } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { useHaptic } from '../../hooks/useHaptic';
import { useTMALock } from '../../hooks/useTMALock';
import { SystemLink } from './SystemLink';

interface OnboardingStoryProps {
    onComplete: () => void;
}

const STORIES_LIST = [
    { key: '0', icon: <Zap className="w-12 h-12 text-yellow-400" />, color: 'from-blue-600 to-indigo-600' },
    { key: '1', icon: <Target className="w-12 h-12 text-emerald-400" />, color: 'from-emerald-600 to-teal-600' },
    { key: '2', icon: <Shield className="w-12 h-12 text-blue-400" />, color: 'from-indigo-600 to-purple-600' },
    { key: '3', icon: <Rocket className="w-12 h-12 text-rose-400" />, color: 'from-rose-600 to-pink-600' }
];

export const OnboardingStory = ({ onComplete }: OnboardingStoryProps) => {
    const { t } = useTranslation('common');
    const [index, setIndex] = useState(() => {
        try {
            const saved = sessionStorage.getItem('p2p_onboarding_step');
            return saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            console.warn('[Onboarding] SessionStorage access failed:', e);
            return 0;
        }
    });

    const [showSystemLink, setShowSystemLink] = useState(() => index === 0);
    const { selection, notification } = useHaptic();

    useTMALock(true);

    const next = () => {
        selection();
        if (index < STORIES_LIST.length - 1) {
            const nextIndex = index + 1;
            setIndex(nextIndex);
            try {
                sessionStorage.setItem('p2p_onboarding_step', nextIndex.toString());
            } catch (e) {
                console.warn('[Onboarding] Failed to save progress:', e);
            }
        } else {
            notification('success');
            try {
                sessionStorage.removeItem('p2p_onboarding_step');
            } catch (e) {
                // Ignore
            }
            onComplete();
        }
    };

    const currentStory = STORIES_LIST[index];

    return (
        <AnimatePresence mode="wait">
            {showSystemLink ? (
                <SystemLink key="system-link" onComplete={() => setShowSystemLink(false)} />
            ) : (
                <motion.div
                    key="onboarding-main"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
                    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                    className="fixed inset-0 z-200 overflow-hidden bg-slate-950 overscroll-none"
                    style={{ overscrollBehavior: 'none' }}
                >
                    {/* Smooth Dynamic Background */}
                    <motion.div
                        className={`absolute inset-0 bg-linear-to-br transition-colors duration-1000 ${currentStory.color}`}
                        initial={false}
                        animate={{ opacity: 1 }}
                    >
                        <div className="absolute inset-0 bg-black/20 pointer-events-none" />

                        {/* Progress Bar - Top Sticky */}
                        <div className="absolute left-6 right-6 flex gap-1.5 z-30" style={{ top: 'calc(env(safe-area-inset-top) + 2rem)' }}>
                            {STORIES_LIST.map((_, i) => (
                                <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: i < index ? '100%' : i === index ? '100%' : '0%' }}
                                        transition={{ duration: i === index ? 5 : 0, ease: 'linear' }}
                                        onAnimationComplete={() => i === index && next()}
                                        className="h-full progress-bar-liquid bg-linear-to-r from-emerald-400 to-emerald-500"
                                    />
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={onComplete}
                            className="absolute right-6 z-30 p-2 rounded-full bg-white/10 backdrop-blur-md text-white/70 hover:text-white active:scale-90 transition-all"
                            style={{ top: 'calc(env(safe-area-inset-top) + 3.5rem)' }}
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>

                        {/* Animated Content Layer */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                className="absolute inset-0 flex flex-col items-center justify-center p-8 pt-[calc(env(safe-area-inset-top)+6rem)] pb-[calc(env(safe-area-inset-bottom)+8rem)] will-change-[transform,filter,opacity]"
                            >
                                <div className="relative z-10 text-center space-y-8 max-w-sm w-full h-full flex flex-col justify-center">
                                    <motion.div
                                        initial={{ scale: 0.8, rotate: -10 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        className="w-24 h-24 bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 flex items-center justify-center mx-auto shadow-2xl shadow-black/20"
                                    >
                                        {currentStory.icon}
                                    </motion.div>

                                    <div className="space-y-4">
                                        <h2 className="text-4xl font-black text-white tracking-tighter">
                                            {t(`onboarding.stories.${index}.title`)}
                                        </h2>
                                        <p className="text-lg text-white/80 font-bold leading-relaxed px-4">
                                            {t(`onboarding.stories.${index}.desc`)}
                                        </p>

                                        {index === STORIES_LIST.length - 1 && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.3 }}
                                                className="pt-4 space-y-3"
                                            >
                                                <div className="h-px bg-white/10 w-12 mx-auto" />
                                                <p className="text-label text-white/40 font-medium leading-relaxed uppercase tracking-widest px-4">
                                                    <Trans i18nKey="onboarding.terms">
                                                        By tapping get started, you confirm that you have read and agree to our{' '}
                                                        <span className="text-white/60 underline decoration-white/20 underline-offset-2 cursor-pointer hover:text-white transition-colors">Terms of Service</span>,{' '}
                                                        <span className="text-white/60 underline decoration-white/20 underline-offset-2 cursor-pointer hover:text-white transition-colors">Cookie Policy</span> and consent to our{' '}
                                                        <span className="text-white/60 underline decoration-white/20 underline-offset-2 cursor-pointer hover:text-white transition-colors">Marketing Activities</span>.
                                                    </Trans>
                                                </p>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Bottom Action Area */}
                        <div className="absolute left-6 right-6 z-30" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}>
                            <button
                                onClick={next}
                                className="group w-full h-16 rounded-2xl bg-white text-slate-900 font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-2xl shadow-black/20 relative overflow-hidden"
                            >
                                <div className="relative z-10 flex items-center gap-2">
                                    {index === STORIES_LIST.length - 1 ? t('onboarding.get_started') : t('onboarding.next')}
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                                <motion.div
                                    className="absolute inset-0 bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
