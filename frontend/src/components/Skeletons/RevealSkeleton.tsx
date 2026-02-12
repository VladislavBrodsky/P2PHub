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

                {/* Pulsing Core - Consistent with StartupLoader */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0.8 }}
                    animate={{
                        scale: [0.95, 1.05, 0.95],
                        opacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="relative z-10 p-4 rounded-3xl bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl"
                >
                    <img
                        src="/logo.webp"
                        alt="Loading"
                        width="64"
                        height="64"
                        className="w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    />
                </motion.div>

                {/* Text Loading */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
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
