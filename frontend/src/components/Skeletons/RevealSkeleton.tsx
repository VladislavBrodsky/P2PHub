import { motion } from 'framer-motion';

export const RevealSkeleton = () => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-(--color-bg-deep)">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.05, 1]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="relative"
            >
                <img src="/logo.webp" alt="Loading" className="w-16 h-16 opacity-20 grayscale" />
            </motion.div>
        </div>
    );
};
