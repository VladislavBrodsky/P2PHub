import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PintopayCard, CardVariant } from '../components/PintopayCard';
import { Apple, ChevronRight, CheckCircle2, Crown } from 'lucide-react';
import { useHaptic } from '../hooks/useHaptic';
import { useTranslation } from 'react-i18next';
import { CardTabSwitcher } from '../components/Cards/CardTabSwitcher';
import { PremiumModal } from '../components/Cards/PremiumModal';
import { useTMALock } from '../hooks/useTMALock';

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
        window.open('https://t.me/onex ecosystem_bot?start=p_6977c29c66ed9faa401342f3', '_blank');
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
            <div className="px-6 pb-4 pt-4 text-center">
                <h2 className="text-slate-900 dark:text-white text-lg font-bold uppercase tracking-tight whitespace-nowrap">{t('cards.title')}</h2>
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
            <div className="flex-1 px-6 pb-60 flex flex-col items-center">
                {/* 3D Card Visual */}
                <div className="mb-14 w-full max-w-[340px] flex justify-center relative min-h-[220px]">
                    <AnimatePresence initial={true} mode="wait">
                        <motion.div
                            key={selectedTab}
                            initial={{ opacity: 0, scale: 0.95, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95, x: -20 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="w-full flex justify-center absolute inset-0"
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
                    className="w-full max-w-sm space-y-10 text-center"
                >
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                            {currentCard.title}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm px-4 leading-relaxed">
                            {currentCard.description}
                        </p>

                        {/* Terms Accordion - RELOCATED & ENHANCED */}
                        <div className="w-full mt-4 px-4">
                            <button
                                onClick={() => {
                                    setIsTermsOpen(!isTermsOpen);
                                    selection();
                                }}
                                className="w-full py-3 px-4 flex items-center justify-between bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/10 shadow-premium-sm group cursor-pointer hover:border-emerald-500/30 transition-all duration-300"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
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
                                            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 space-y-3.5 border border-slate-100 dark:border-white/5">
                                                {[
                                                    { label: `${currentCard.price} ${t('cards.fees.issue')}` },
                                                    { label: `2.5% ${t('cards.fees.topup')}` },
                                                    { label: `$0.25 ${t('cards.fees.auth')}` }
                                                ].map((term, i) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                                        <span className="text-body font-bold text-slate-900 dark:text-white">
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
                    {/* (Moved Terms Accordion from here to below description) */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 pl-3 pr-4 flex items-center justify-between shadow-premium border border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="relative group overflow-hidden bg-slate-900 dark:bg-white rounded-[0.75rem] px-2.5 py-1.5 flex items-center gap-1.5 shadow-md shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900 opacity-90 shrink-0" />
                                <span className="text-label font-bold text-white dark:text-slate-900 whitespace-nowrap tracking-wider">
                                    {currentCard.bonus}
                                </span>
                            </div>

                            <div className="text-left min-w-0">
                                <p className="text-label font-bold text-slate-900 dark:text-white leading-[1.2] max-w-[180px] wrap-break-word">
                                    {currentCard.bonus} {currentCard.bonusText}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 px-3.5 py-2 rounded-[1rem] border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-2 active:bg-slate-50 dark:active:bg-slate-950 transition-colors">
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
                            className={`w-full h-12 rounded-xl font-bold text-sm shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 transition-transform relative overflow-hidden ${selectedTab === 'platinum'
                                ? 'bg-linear-to-br from-slate-100 via-white to-slate-300 text-slate-900 border border-white/50'
                                : 'bg-slate-900 text-white'
                                }`}
                        >
                            {selectedTab === 'platinum' ? (
                                <>
                                    <motion.div
                                        animate={{ x: ['-150%', '150%'] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                        className="absolute inset-0 bg-linear-to-r from-transparent via-white/80 to-transparent -skew-x-12"
                                    />
                                    <Crown size={18} className="text-amber-500 fill-amber-100 relative z-10" />
                                    <span className="relative z-10">{t('cards.premium_only')}</span>
                                </>
                            ) : (
                                <>
                                    <span>{t('cards.action')}</span>
                                    <div className="w-1 h-1 rounded-full bg-white/20" />
                                    <span className="text-white/80">{currentCard.price}</span>
                                </>
                            )}
                        </motion.button>

                        <p className="mt-4 text-label font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 opacity-60">
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
