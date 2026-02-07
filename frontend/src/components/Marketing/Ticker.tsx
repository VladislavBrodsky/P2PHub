import { motion } from 'framer-motion';

const TICKER_ITEMS = [
    "EARN PINTOPAY TOKENS",
    "•",
    "GLOBAL PAYMENTS",
    "•",
    "INSTANT WITHDRAWALS",
    "•",
    "BECOME A PARTNER",
    "•",
    "EARN PINTOPAY TOKENS",
    "•",
    "GLOBAL PAYMENTS",
    "•",
    "INSTANT WITHDRAWALS",
    "•",
    "BECOME A PARTNER",
    "•",
];

export const Ticker = () => {
    return (
        <div className="relative flex w-full overflow-hidden border-y border-[var(--color-brand-border)] bg-[var(--color-brand-bg)] py-3 backdrop-blur-sm">
            <div className="absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[var(--color-bg-app)] to-transparent" />
            <div className="absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[var(--color-bg-app)] to-transparent" />

            <motion.div
                className="flex whitespace-nowrap"
                animate={{ x: [0, -1000] }}
                transition={{
                    repeat: Infinity,
                    ease: "linear",
                    duration: 20,
                }}
            >
                {TICKER_ITEMS.map((item, index) => (
                    <span
                        key={index}
                        className="mx-4 text-xs font-black tracking-widest text-[var(--color-text-primary)] opacity-80"
                    >
                        {item}
                    </span>
                ))}
            </motion.div>
        </div>
    );
};
