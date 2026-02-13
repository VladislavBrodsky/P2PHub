import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PintopayCard, CardVariant } from '../components/PintopayCard';
import { Apple, ChevronRight, CheckCircle2, Crown } from 'lucide-react';
import { useHaptic } from '../hooks/useHaptic';
import { useTranslation } from 'react-i18next';
import { CardTabSwitcher } from '../components/Cards/CardTabSwitcher';
import { PremiumModal } from '../components/Cards/PremiumModal';

interface CardsPageProps {
    setActiveTab?: (tab: string) => void;
}

export default function CardsPage({ setActiveTab }: CardsPageProps) {
    const { t } = useTranslation();
    const [selectedTab, setSelectedTab] = useState<CardVariant>('virtual');
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const { selection, notification } = useHaptic();

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
            setActiveTab('earn');
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
            price: '$85',
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
            <div className="px-6 pb-6 text-center">
                <h2 className="text-(--color-text-primary) text-lg font-bold">{t('cards.title')}</h2>
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
            <div className="flex-1 px-6 pb-48 flex flex-col items-center">
                {/* 3D Card Visual */}
                <div className="mb-8 w-full max-w-[340px] flex justify-center relative min-h-[220px]">
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
                    className="w-full max-w-sm space-y-6 text-center"
                >
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-(--color-text-primary) leading-tight">
                            {currentCard.title}
                        </h3>
                        <p className="text-(--color-text-secondary) font-medium text-sm px-4 leading-relaxed">
                            {currentCard.description}
                        </p>
                    </div>

                    {/* Promo/Bonus Pill */}
                    <div className="bg-(--color-bg-surface) rounded-[2rem] p-3 pl-3 pr-4 flex items-center justify-between shadow-premium border border-(--color-border-glass)">
                        <div className="flex items-center gap-4">
                            <div className="relative group overflow-hidden bg-(--color-text-primary) rounded-[0.75rem] px-3 py-2 flex items-center gap-1.5 shadow-md">
                                <div className="w-1.5 h-1.5 rounded-full bg-(--color-bg-surface) opacity-90 shrink-0" />
                                <span className="text-[11px] font-black text-(--color-bg-surface) whitespace-nowrap tracking-wider">
                                    {currentCard.bonus}
                                </span>
                            </div>

                            <div className="text-left">
                                <p className="text-[11px] font-bold text-(--color-text-primary) leading-[1.3] max-w-[140px]">
                                    {currentCard.bonus} {currentCard.bonusText}
                                </p>
                            </div>
                        </div>

                        <div className="bg-(--color-bg-surface) px-3.5 py-2 rounded-[1rem] border border-(--color-border-glass) shadow-sm flex items-center gap-2 active:bg-(--color-bg-app) transition-colors">
                            <Apple size={16} strokeWidth={0} className="fill-(--color-text-primary)" />
                            <span className="text-[13px] font-extrabold text-(--color-text-primary)">Pay</span>
                        </div>
                    </div>

                    {/* Terms Accordion */}
                    <div className="w-full">
                        <button
                            onClick={() => {
                                setIsTermsOpen(!isTermsOpen);
                                selection();
                            }}
                            className="w-full py-4 flex items-center justify-between border-t border-(--color-brand-border) group cursor-pointer"
                        >
                            <span className="text-xs font-bold text-(--color-text-secondary) uppercase tracking-wider group-hover:text-(--color-text-primary) transition-colors">
                                {t('cards.terms')}
                            </span>
                            <motion.div
                                animate={{ rotate: isTermsOpen ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronRight size={16} className="text-slate-400 opacity-30 group-hover:opacity-100 transition-colors" />
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
                                    <div className="pb-6 space-y-6 text-left">
                                        <div className="space-y-3">
                                            {[
                                                { label: `${currentCard.price} ${t('cards.fees.issue')}` },
                                                { label: `2.5% ${t('cards.fees.topup')}` },
                                                { label: `$0.25 ${t('cards.fees.auth')}` }
                                            ].map((term, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                                    <span className="text-sm text-(--color-text-secondary)">
                                                        <strong className="text-(--color-text-primary)">{term.label}</strong>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
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

                        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-(--color-text-secondary) opacity-60">
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
