import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PintopayCard, CardVariant } from '../components/PintopayCard';
import { Apple, ChevronRight, CheckCircle2, Crown, X, ArrowRight } from 'lucide-react';
import { useHaptic } from '../hooks/useHaptic';
import { useTranslation } from 'react-i18next';

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

            {/* Switcher */}
            <div className="px-6 mb-8 flex justify-center">
                <div className="bg-(--color-brand-border)/30 p-1 rounded-xl flex gap-1 w-full max-w-sm relative">
                    {/* Active Indicator Background */}
                    <div className="absolute inset-1 flex pointer-events-none" aria-hidden="true">
                        <motion.div
                            className="absolute inset-y-0 bg-(--color-bg-surface) rounded-lg shadow-sm z-0"
                            layout={false}
                            initial={false}
                            animate={{
                                x: selectedTab === 'virtual' ? '0%' : selectedTab === 'physical' ? '100%' : '200%',
                            }}
                            style={{
                                width: '33.33%',
                                left: 0
                            }}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    </div>

                    {(['virtual', 'physical', 'platinum'] as CardVariant[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setSelectedTab(tab);
                                selection();
                            }}
                            className={`relative z-10 flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors duration-200 ${selectedTab === tab ? 'text-(--color-text-primary)' : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
                                }`}
                        >
                            {t(`cards.tabs.${tab}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Card Display Area */}
            <div className="flex-1 px-6 pb-48 flex flex-col items-center">
                {/* 3D Card Visual */}
                <div className="mb-8 w-full max-w-[320px] flex justify-center relative min-h-[220px]">
                    <AnimatePresence initial={true} mode="wait">
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
                        <h3 className="text-2xl font-bold text-(--color-text-primary) leading-tight">
                            {currentCard.title}
                        </h3>
                        <p className="text-(--color-text-secondary) font-medium text-sm px-4 leading-relaxed">
                            {currentCard.description}
                        </p>
                    </div>

                    {/* Promo/Bonus Pill - Premium Look & Theme Aware */}
                    <div className="bg-(--color-bg-surface) rounded-[2rem] p-3 pl-3 pr-4 flex items-center justify-between shadow-premium border border-(--color-border-glass)">
                        <div className="flex items-center gap-4">
                            {/* Premium Icon Badge with Theme-Aware Background */}
                            <div className="relative group overflow-hidden bg-(--color-text-primary) rounded-[0.75rem] px-3 py-2 flex items-center gap-1.5 shadow-md transition-all active:scale-95">
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

                        {/* Pay Pill */}
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
                            className={`w-full h-16 rounded-2xl font-black text-lg shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] flex items-center justify-center gap-3 transition-transform relative overflow-hidden ${selectedTab === 'platinum'
                                ? 'bg-linear-to-br from-slate-100 via-white to-slate-300 text-slate-900 border border-white/50'
                                : 'bg-slate-900 text-white'
                                }`
                            }
                        >
                            {selectedTab === 'platinum' ? (
                                <>
                                    {/* Crystal Shimmer Effect */}
                                    <motion.div
                                        animate={{ x: ['-150%', '150%'] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                        className="absolute inset-0 bg-linear-to-r from-transparent via-white/80 to-transparent -skew-x-12"
                                    />
                                    <Crown size={22} className="text-amber-500 fill-amber-100 relative z-10" />
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

            {/* Extra Spacing at bottom */}
            <div className="h-32 pointer-events-none" />

            {/* Premium Modal */}
            <AnimatePresence>
                {isPremiumModalOpen && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsPremiumModalOpen(false)}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm rounded-[2.5rem] bg-white border border-slate-100 p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] overflow-hidden"
                        >
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60" />
                            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-60" />

                            <button
                                onClick={() => setIsPremiumModalOpen(false)}
                                className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-50 transition-colors"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>

                            <div className="relative flex flex-col items-center text-center">
                                {/* Premium Icon Badge */}
                                <div className="mb-6 relative">
                                    <div className="h-20 w-20 rounded-[2rem] bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                        <Crown size={40} className="text-white fill-white/20" />
                                    </div>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                        className="absolute -inset-2 border-2 border-dashed border-indigo-200 rounded-full opacity-50"
                                    />
                                </div>

                                <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                                    {t('cards.modal.title')}
                                </h2>

                                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8 px-2">
                                    {t('cards.modal.desc')}
                                </p>

                                {/* Instruction List */}
                                <div className="w-full space-y-3 mb-8 text-left">
                                    {(t('cards.modal.steps', { returnObjects: true }) as string[]).map((step, i) => (
                                        <div key={step} className="flex items-center gap-3 p-3 rounded-2xl bg-(--color-bg-app)/50 border border-(--color-border-glass)">
                                            <div className="h-6 w-6 rounded-lg bg-(--color-bg-surface) shadow-sm flex items-center justify-center text-[10px] font-black text-indigo-500 border border-(--color-border-glass)">
                                                {i + 1}
                                            </div>
                                            <span className="text-xs font-bold text-(--color-text-secondary)">{step}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    onClick={handleUpgradeSelect}
                                    className="w-full h-16 rounded-2xl bg-indigo-600 text-white font-black text-lg shadow-[0_15px_30px_-5px_rgba(79,70,229,0.3)] hover:bg-indigo-700 flex items-center justify-center gap-2 group"
                                >
                                    <span>{t('cards.modal.upgrade')}</span>
                                    <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                                </Button>

                                <button
                                    onClick={() => setIsPremiumModalOpen(false)}
                                    className="mt-4 text-[11px] font-black uppercase tracking-widest text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors"
                                >
                                    {t('cards.modal.later')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Subcomponent for uniformity (or import if shared)
function Button({ children, className, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`transition-all active:scale-[0.98] ${className}`}
        >
            {children}
        </button>
    );
}

