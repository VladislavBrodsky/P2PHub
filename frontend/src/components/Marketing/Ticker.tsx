import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export const Ticker = () => {
    const { t } = useTranslation();
    const tickerItems = t('dashboard.ticker', { returnObjects: true }) as string[];

    // Create a long repeated array for smooth infinite scroll
    const items = [...tickerItems, "•", ...tickerItems, "•", ...tickerItems, "•"];

    return (
        <div className="relative flex w-full overflow-hidden border-y border-(--color-brand-border) bg-(--color-brand-bg) py-3 backdrop-blur-sm">
            <div className="absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-(--color-bg-app) to-transparent" />
            <div className="absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-(--color-bg-app) to-transparent" />

            <motion.div
                className="flex whitespace-nowrap"
                animate={{ x: [0, -1000] }}
                transition={{
                    repeat: Infinity,
                    ease: "linear",
                    duration: 30,
                }}
            >
                {items.map((item, index) => (
                    <span
                        key={index}
                        className="mx-4 text-xs font-black tracking-widest text-(--color-text-primary) opacity-80"
                    >
                        {item}
                    </span>
                ))}
            </motion.div>
        </div>
    );
};
