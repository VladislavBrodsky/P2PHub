import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CardVariant } from '../PintopayCard';

interface CardTabSwitcherProps {
    selectedTab: CardVariant;
    onSelect: (tab: CardVariant) => void;
}

export function CardTabSwitcher({ selectedTab, onSelect }: CardTabSwitcherProps) {
    const { t } = useTranslation();

    return (
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
                        onClick={() => onSelect(tab)}
                        className={`relative z-10 flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors duration-200 ${selectedTab === tab ? 'text-(--color-text-primary)' : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
                            }`}
                    >
                        {t(`cards.tabs.${tab}`)}
                    </button>
                ))}
            </div>
        </div>
    );
}
