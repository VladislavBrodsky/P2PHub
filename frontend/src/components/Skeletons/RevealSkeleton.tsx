import { motion } from 'framer-motion';

export const RevealSkeleton = () => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-(--color-bg-deep) z-50">
            <div className="relative">
                {/* Rotating Glow */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-8 bg-linear-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-2xl opacity-60"
                />

                {/* Pulsing Core */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{
                        scale: [0.9, 1.1, 0.9],
                        opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="relative z-10 p-4 rounded-3xl bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl"
                >
                    <img src="/logo.webp" alt="Loading" className="w-16 h-16 grayscale opacity-80" />
                </motion.div>

                {/* Text Loading */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
                >
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">
                        Loading Hub...
                    </span>
                </motion.div>
            </div>
        </div>
    );
};
