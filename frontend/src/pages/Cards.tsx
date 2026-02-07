import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PintopayCard, CardVariant } from '../components/PintopayCard';
import { Apple, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useHaptic } from '../hooks/useHaptic';

export default function CardsPage() {
    const [selectedTab, setSelectedTab] = useState<CardVariant>('virtual');
    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const { selection } = useHaptic();

    const handleGetCard = () => {
        selection();
        window.open('https://t.me/pintopaybot?start=p_6977c29c66ed9faa401342f3', '_blank');
    };

    const cardData = {
        virtual: {
            title: 'Mastercard Virtual USD',
            description: 'Pay contactless in-store or online in 180+ countries',
            price: '$35',
            bonus: '+$10',
            bonusText: 'on your balance after card activation',
        },
        physical: {
            title: 'Mastercard Physical',
            description: 'Premium soft-touch PVC card with worldwide delivery',
            price: '$85',
            bonus: 'Free',
            bonusText: 'Standard Shipping included',
        },
        platinum: {
            title: 'Platinum Metal',
            description: 'Solid metal construction with concierge service',
            price: '$199',
            bonus: 'VIP',
            bonusText: 'Access to premium lounges',
        }
    };

    const currentCard = cardData[selectedTab];

    return (
        <div className="flex flex-col h-full relative min-h-screen">
            {/* Header */}
            <div className="px-6 pb-6 text-center">
                <h2 className="text-[var(--color-text-primary)] text-lg font-bold">Choose Card</h2>
            </div>

            {/* Switcher */}
            <div className="px-6 mb-8 flex justify-center">
                <div className="bg-[var(--color-brand-border)]/30 p-1 rounded-xl flex gap-1 w-full max-w-sm relative">
                    {/* Active Indicator Background */}
                    <div className="absolute inset-1 flex pointer-events-none" aria-hidden="true">
                        <motion.div
                            className="bg-[var(--color-bg-surface)] rounded-lg shadow-sm w-1/3 h-full"
                            layoutId="activeTabIndicator"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            style={{
                                left: selectedTab === 'virtual' ? '0%' : selectedTab === 'physical' ? '33.33%' : '66.66%',
                                position: 'absolute',
                                width: '33.33%'
                            }}
                        />
                    </div>

                    {(['virtual', 'physical', 'platinum'] as CardVariant[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setSelectedTab(tab);
                                selection();
                            }}
                            className={`relative z-10 flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors duration-200 ${selectedTab === tab ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Card Display Area */}
            <div className="flex-1 px-6 pb-48 flex flex-col items-center">
                {/* 3D Card Visual */}
                <div className="mb-8 w-full max-w-[320px] flex justify-center relative min-h-[200px]">
                    <AnimatePresence initial={false} mode="wait">
                        <motion.div
                            key={selectedTab}
                            initial={{ opacity: 0, scale: 0.95, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95, x: -20 }}
                            transition={{
                                duration: 0.3,
                                ease: "easeInOut"
                            }}
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
                        <h3 className="text-2xl font-bold text-[var(--color-text-primary)] leading-tight">
                            {currentCard.title}
                        </h3>
                        <p className="text-[var(--color-text-secondary)] font-medium text-sm px-4 leading-relaxed">
                            {currentCard.description}
                        </p>
                    </div>

                    {/* Promo/Bonus Pill */}
                    <div className="bg-[var(--color-bg-surface)] rounded-2xl p-4 flex items-center justify-between shadow-sm border border-[var(--color-brand-border)]">
                        <div className="flex items-center gap-3">
                            <div className="bg-[var(--color-brand-dark)] text-[var(--color-bg-surface)] text-xs font-bold px-2.5 py-1.5 rounded-full whitespace-nowrap">
                                {currentCard.bonus}
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-semibold text-[var(--color-text-secondary)] leading-tight">
                                    {currentCard.bonusText}
                                </p>
                            </div>
                        </div>
                        <div className="bg-[var(--color-bg-app)] px-3 py-2 rounded-lg border border-[var(--color-brand-border)] shadow-sm">
                            <span className="flex items-center gap-1.5">
                                <Apple size={16} strokeWidth={0} fill="currentColor" className="text-[var(--color-text-primary)]" />
                                <span className="text-sm font-semibold text-[var(--color-text-primary)]">Pay</span>
                            </span>
                        </div>
                    </div>

                    {/* Terms Accordion */}
                    <div className="w-full">
                        <button
                            onClick={() => {
                                setIsTermsOpen(!isTermsOpen);
                                selection();
                            }}
                            className="w-full py-4 flex items-center justify-between border-t border-[var(--color-brand-border)] group cursor-pointer"
                        >
                            <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider group-hover:text-[var(--color-text-primary)] transition-colors">
                                Card Issuance Terms
                            </span>
                            <motion.div
                                animate={{ rotate: isTermsOpen ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronRight size={16} className="text-[var(--color-text-secondary)] opacity-30 group-hover:opacity-100 transition-colors" />
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
                                    <div className="pb-4 space-y-6 text-left">
                                        <div className="space-y-3">
                                            {[
                                                { label: `${currentCard.price} issue price` },
                                                { label: '2.5% topup fee' },
                                                { label: '$0.25 authorization fee' }
                                            ].map((term, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <CheckCircle2 size={18} className="text-[var(--color-brand-primary)] shrink-0" />
                                                    <span className="text-sm text-[var(--color-text-secondary)]">
                                                        <strong className="text-[var(--color-text-primary)]">{term.label}</strong>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </motion.div>
            </div>

            {/* Sticky Bottom Action Button */}
            <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+120px)] left-0 right-0 p-6 bg-gradient-to-t from-[var(--color-bg-app)] via-[var(--color-bg-app)] to-transparent z-40">
                <div className="max-w-md mx-auto">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGetCard}
                        className="w-full py-4 bg-[var(--color-action-black)] text-white rounded-lg font-bold text-lg shadow-xl shadow-[var(--color-action-black)]/10 flex items-center justify-center gap-2"
                    >
                        <span>Issue card</span>
                        <span className="text-[var(--color-bg-surface)]/30">•</span>
                        <span>{currentCard.price}</span>
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

