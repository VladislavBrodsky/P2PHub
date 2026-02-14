import { motion } from 'framer-motion';

export const RevealSkeleton = () => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950 z-[60] backdrop-blur-sm">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[500px] max-h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            <div className="relative flex flex-col items-center justify-center">
                {/* Main Abstract Loader */}
                <div className="relative w-20 h-20">
                    {/* Outer Vibing Ring */}
                    <motion.span
                        className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-blue-500 border-r-purple-500"
                        style={{ filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.3))' }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Middle Ring - Slower & Counter-rotating */}
                    <motion.span
                        className="absolute inset-3 rounded-full border-[3px] border-transparent border-b-indigo-400 border-l-cyan-400"
                        style={{ filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.3))' }}
                        animate={{ rotate: -360 }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Inner Breathing Core */}
                    <motion.div
                        className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.7, 1, 0.7]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>

                {/* Optional Minimal Text - "Vibing" Style */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8 overflow-hidden"
                >
                    <motion.div
                        className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-indigo-400 to-purple-400 font-bold text-xs tracking-[0.3em] uppercase"
                        animate={{
                            backgroundPosition: ['0% center', '200% center']
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        style={{ backgroundSize: '200% auto' }}
                    >
                        Loading Hub
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};
