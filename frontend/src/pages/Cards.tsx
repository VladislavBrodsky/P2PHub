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

                    {/* Promo/Bonus Pill - Premium Look */}
                    <div className="bg-white rounded-[2rem] p-3 pl-3 pr-4 flex items-center justify-between shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)] border border-slate-100/60">
                        <div className="flex items-center gap-4">
                            {/* Black Tag Icon with Bonus */}
                            <div className="relative group overflow-hidden bg-[#0F172A] rounded-[0.75rem] px-3 py-2 flex items-center gap-1.5 shadow-md transition-all active:scale-95">
                                <div className="w-1.5 h-1.5 rounded-full bg-white opacity-90 shrink-0" />
                                <span className="text-[11px] font-black text-white whitespace-nowrap tracking-wider">
                                    {currentCard.bonus}
                                </span>
                            </div>

                            <div className="text-left">
                                <p className="text-[11px] font-bold text-slate-800 leading-[1.3] max-w-[140px]">
                                    {currentCard.bonus} {currentCard.bonusText}
                                </p>
                            </div>
                        </div>

                        {/* Pay Pill */}
                        <div className="bg-white px-3.5 py-2 rounded-[1rem] border border-slate-100 shadow-sm flex items-center gap-2 active:bg-slate-50 transition-colors">
                            <Apple size={16} strokeWidth={0} fill="black" />
                            <span className="text-[13px] font-extrabold text-[#0F172A]">Pay</span>
                        </div>
                    </div>

                    {/* Terms Accordion */}
                    <div className="w-full">
                        <button
                            onClick={() => {
                                setIsTermsOpen(!isTermsOpen);
                                selection();
                            }}
                            className="w-full py-4 flex items-center justify-between border-t border-slate-100 group cursor-pointer"
                        >
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-800 transition-colors">
                                Card Issuance Terms
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
                                                { label: `${currentCard.price} issue price` },
                                                { label: '2.5% topup fee' },
                                                { label: '$0.25 authorization fee' }
                                            ].map((term, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                                    <span className="text-sm text-slate-600">
                                                        <strong className="text-slate-900">{term.label}</strong>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Action Button - Integrated into flow */}
                    <div className="pt-2 w-full">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGetCard}
                            className="w-full h-16 bg-[#1C1C1E] text-white rounded-2xl font-black text-lg shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] flex items-center justify-center gap-3 transition-transform"
                        >
                            <span>Issue card</span>
                            <div className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="text-white/80">{currentCard.price}</span>
                        </motion.button>

                        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 opacity-60">
                            Instant Delivery Worldwide
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Extra Spacing at bottom */}
            <div className="h-32 pointer-events-none" />
        </div>
    );
}

