import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PintopayCard, CardVariant } from '../components/PintopayCard';
import { Apple, ChevronRight, CheckCircle2, Crown } from 'lucide-react';
import { useHaptic } from '../hooks/useHaptic';
import { useTranslation } from 'react-i18next';
import { CardTabSwitcher } from '../components/Cards/CardTabSwitcher';
import { PremiumModal } from '../components/Cards/PremiumModal';
import { useTMALock } from '../hooks/useTMALock';
import { SectionHeader } from '../components/ui/SectionHeader';

interface CardsPageProps {
    setActiveTab?: (tab: string) => void;
}

export default function CardsPage({ setActiveTab }: CardsPageProps) {
    const { t } = useTranslation(['cards', 'common']);
    const [selectedTab, setSelectedTab] = useState<CardVariant>('virtual');
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const { selection, notification } = useHaptic();

    // Prevent body scroll and TMA swipes when premium modal is open
    useTMALock(isPremiumModalOpen);

    const handleGetCard = () => {
        selection();
        if (selectedTab === 'platinum') {
            setIsPremiumModalOpen(true);
            notification('warning');
            return;
        }
        window.open('https://t.me/pintopaybot?start=p_6977c29c66ed9faa401342f3', '_blank');
    };

    const handleUpgradeSelect = () => {
        selection();
        setIsPremiumModalOpen(false);
        if (setActiveTab) {
            setActiveTab('subscription');
        }
    };

    const cardData = {
        virtual: {
            title: t('cards.virtual.title'),
            description: t('cards.virtual.desc'),
            price: '$35',
            bonus: '+$10',
            bonusText: t('cards.virtual.bonus_text'),
        },
        physical: {
            title: t('cards.physical.title'),
            description: t('cards.physical.desc'),
            price: '$129',
            bonus: 'Free',
            bonusText: t('cards.physical.bonus_text'),
        },
        platinum: {
            title: t('cards.platinum.title'),
            description: t('cards.platinum.desc'),
            price: '$199',
            bonus: 'VIP',
            bonusText: t('cards.platinum.bonus_text'),
        }
    };

    const currentCard = cardData[selectedTab];

    return (
        <div className="flex flex-col relative min-h-dvh">
            {/* Header */}
            <div className="pt-8 pb-2">
                <SectionHeader
                    badge={t('common:navigation.cards')}
                    title={t('cards.title')}
                />
            </div>

            {/* Switcher Component */}
            <CardTabSwitcher
                selectedTab={selectedTab}
                onSelect={(tab) => {
                    setSelectedTab(tab);
                    selection();
                }}
            />

            {/* Card Display Area */}
            <div className="flex-1 px-6 pb-60 flex flex-col lg:grid lg:grid-cols-2 lg:gap-16 lg:max-w-5xl lg:mx-auto lg:items-center lg:pb-12 w-full lg:pt-8">
                {/* 3D Card Visual with Dynamic Glowing Aura */}
                <div className="mb-14 lg:mb-0 w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[420px] mx-auto aspect-[1.586/1] relative group/card-wrapper">
                    {/* Glowing blur overlay matching the card variant */}
                    <div className={`absolute inset-0 m-auto w-[70%] h-[60%] rounded-full blur-[60px] sm:blur-[80px] opacity-25 dark:opacity-40 transition-all duration-700 pointer-events-none
                        ${selectedTab === 'virtual' ? 'bg-blue-500 shadow-[0_0_120px_rgba(59,130,246,0.8)]' :
                          selectedTab === 'physical' ? 'bg-slate-500 shadow-[0_0_120px_rgba(100,116,139,0.8)]' :
                          'bg-amber-500 shadow-[0_0_120px_rgba(245,158,11,0.8)]'}
                    `} />

                    <AnimatePresence initial={true} mode="wait">
                        <motion.div
                            key={selectedTab}
                            initial={{ opacity: 0, scale: 0.95, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95, x: -20 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="w-full h-full absolute inset-0"
                        >
                            <PintopayCard variant={selectedTab} />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Card Info */}
                <motion.div
                    key={`${selectedTab}-info`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="w-full max-w-sm lg:max-w-none space-y-8 text-center lg:text-left"
                >
                    <div className="space-y-3">
                        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight text-center lg:text-left">
                            {currentCard.title}
                        </h3>
                        <p className="text-text-secondary font-medium text-sm lg:text-base px-4 lg:px-0 leading-relaxed text-center lg:text-left opacity-90">
                            {currentCard.description}
                        </p>

                        {/* Terms Accordion - RELOCATED & ENHANCED */}
                        <div className="w-full mt-4 px-4 lg:px-0">
                            <button
                                onClick={() => {
                                    setIsTermsOpen(!isTermsOpen);
                                    selection();
                                }}
                                className="w-full py-3.5 px-5 flex items-center justify-between bg-white/60 dark:bg-slate-900/30 hover:bg-white/80 dark:hover:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/10 shadow-premium-sm group cursor-pointer hover:border-emerald-500/35 transition-all duration-300 backdrop-blur-md"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-sm font-bold text-slate-900 dark:text-white tracking-wider">
                                        {t('cards.terms')}
                                    </span>
                                </div>
                                <motion.div
                                    animate={{ rotate: isTermsOpen ? 90 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                </motion.div>
                            </button>

                            <AnimatePresence>
                                {isTermsOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-4 pb-2 space-y-4 text-left">
                                            <div className="bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl p-5 space-y-3.5 border border-slate-100 dark:border-white/5 backdrop-blur-md">
                                                {[
                                                    { label: `${currentCard.price} ${t('cards.fees.issue')}` },
                                                    { label: `2.5% ${t('cards.fees.topup')}` },
                                                    { label: `$0.25 ${t('cards.fees.auth')}` }
                                                ].map((term, i) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                            {term.label}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Promo/Bonus Pill */}
                    <div className="bg-white/60 dark:bg-slate-900/30 rounded-2xl p-3.5 pl-4 pr-5 flex items-center justify-between shadow-premium border border-slate-200/80 dark:border-white/10 backdrop-blur-md hover:border-blue-500/10 transition-colors duration-300">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="relative group overflow-hidden bg-slate-900 dark:bg-white rounded-[0.75rem] px-2.5 py-1.5 flex items-center gap-1.5 shadow-md shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900 opacity-90 shrink-0 animate-pulse" />
                                <span className="text-[10px] font-extrabold text-white dark:text-slate-900 whitespace-nowrap tracking-wider uppercase">
                                    {currentCard.bonus}
                                </span>
                            </div>

                            <div className="text-left min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white leading-[1.2] max-w-[180px] wrap-break-word">
                                    {currentCard.bonus} {currentCard.bonusText}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 px-3.5 py-2 rounded-[1rem] border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-2 active:bg-slate-50 dark:active:bg-slate-950 transition-colors cursor-pointer">
                            <Apple size={16} strokeWidth={0} className="fill-slate-900 dark:fill-white" />
                            <span className="text-caption font-bold text-slate-900 dark:text-white">Pay</span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2 w-full">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGetCard}
                            className={`w-full h-12.5 rounded-full font-extrabold text-xs uppercase tracking-[0.2em] shadow-[0_12px_25px_-5px_rgba(0,102,255,0.25)] flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden active:scale-95 ${selectedTab === 'platinum'
                                ? 'bg-linear-to-br from-amber-400 via-yellow-300 to-amber-500 text-black border border-yellow-400/50 shadow-yellow-500/10 hover:brightness-110'
                                : 'vibing-blue-animated shadow-blue-500/30 hover:brightness-110 text-white'
                                }`}
                        >
                            {selectedTab === 'platinum' ? (
                                <>
                                    <motion.div
                                        animate={{ x: ['-150%', '150%'] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                        className="absolute inset-0 bg-linear-to-r from-transparent via-white/80 to-transparent -skew-x-12"
                                    />
                                    <Crown size={16} className="text-black fill-black/20 relative z-10" />
                                    <span className="relative z-10 text-black font-extrabold">{t('cards.premium_only')}</span>
                                </>
                            ) : (
                                <>
                                    <span>{t('cards.action')}</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                    <span className="text-white/90 font-extrabold">{currentCard.price}</span>
                                </>
                            )}
                        </motion.button>

                        <p className="mt-4 text-label font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 opacity-60 text-center w-full">
                            {t('cards.instant_delivery')}
                        </p>
                    </div>
                </motion.div>
            </div>

            <PremiumModal
                isOpen={isPremiumModalOpen}
                onClose={() => setIsPremiumModalOpen(false)}
                onUpgrade={handleUpgradeSelect}
            />
        </div>
    );
}
