import { motion } from 'framer-motion';

const AVATARS = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop"
];

const CRYPTO_ICONS = [
    { name: 'BTC', color: '#F7931A' },
    { name: 'ETH', color: '#627EEA' },
    { name: 'USDT', color: '#26A17B' }
];

// Crypto SVG Icons
const CryptoIcon = ({ name, color }: { name: string; color: string }) => {
    if (name === 'BTC') {
        return (
            <svg viewBox="0 0 32 32" className="h-full w-full">
                <circle cx="16" cy="16" r="16" fill={color} />
                <path d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z" fill="white" />
            </svg>
        );
    }
    if (name === 'ETH') {
        return (
            <svg viewBox="0 0 32 32" className="h-full w-full">
                <circle cx="16" cy="16" r="16" fill={color} />
                <path d="M16.498 4v8.87l7.497 3.35z" fill="white" fillOpacity="0.6" />
                <path d="M16.498 4L9 16.22l7.498-3.35z" fill="white" />
                <path d="M16.498 21.968v6.027L24 17.616z" fill="white" fillOpacity="0.6" />
                <path d="M16.498 27.995v-6.028L9 17.616z" fill="white" />
                <path d="M16.498 20.573l7.497-4.353-7.497-3.348z" fill="white" fillOpacity="0.2" />
                <path d="M9 16.22l7.498 4.353v-7.701z" fill="white" fillOpacity="0.6" />
            </svg>
        );
    }
    // USDT
    return (
        <svg viewBox="0 0 32 32" className="h-full w-full">
            <circle cx="16" cy="16" r="16" fill={color} />
            <path d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117" fill="white" />
        </svg>
    );
};

export const CommunityOrbit = () => {
    const orbitItems = [
        ...AVATARS.map(src => ({ type: 'avatar' as const, src })),
        ...CRYPTO_ICONS.map(crypto => ({ type: 'crypto' as const, ...crypto }))
    ];

    return (
        <div className="relative flex h-[380px] w-full items-center justify-center overflow-hidden">
            {/* Background Orbiting Rings */}
            <div className="absolute h-[240px] w-[240px] rounded-full border border-slate-100 opacity-30 dark:border-white/5" />
            <div className="absolute h-[190px] w-[190px] rounded-full border border-slate-100 opacity-50 dark:border-white/10" />
            <div className="absolute h-[120px] w-[120px] rounded-full border border-slate-100 opacity-80 dark:border-white/10" />

            {/* Central Logo */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                    scale: 1,
                    opacity: 1
                }}
                transition={{
                    duration: 0.8,
                    ease: "easeOut"
                }}
                className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-2xl shadow-blue-500/40"
            >
                <motion.img
                    animate={{
                        scale: [1, 1.05, 1, 1.03, 1],
                    }}
                    transition={{
                        duration: 1.8, // 33 BPM ≈ 1.8s per beat
                        repeat: Infinity,
                        repeatType: "loop",
                        times: [0, 0.2, 0.4, 0.6, 1],
                        ease: "easeInOut"
                    }}
                    src="/logo.png"
                    alt="Pintopay Logo"
                    className="relative z-10 w-12 h-12 object-contain brightness-0 invert"
                />

                {/* Heartbeat Pulse Ripples */}
                <motion.div
                    animate={{
                        scale: [1, 1.4],
                        opacity: [0.3, 0]
                    }}
                    transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeOut"
                    }}
                    className="absolute inset-0 rounded-full bg-blue-400"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.8],
                        opacity: [0.15, 0]
                    }}
                    transition={{
                        duration: 1.8,
                        delay: 0.2,
                        repeat: Infinity,
                        ease: "easeOut"
                    }}
                    className="absolute inset-0 rounded-full bg-blue-300"
                />
            </motion.div>

            {/* Orbiting Avatars & Crypto Icons */}
            {orbitItems.map((item, i) => (
                <OrbitingItem key={i} item={item} index={i} total={orbitItems.length} />
            ))}
        </div>
    );
};

type OrbitItem =
    | { type: 'avatar'; src: string }
    | { type: 'crypto'; name: string; color: string };

const OrbitingItem = ({ item, index, total }: { item: OrbitItem; index: number; total: number }) => {
    const radius = 95;
    const duration = 25;
    const startAngle = (index / total) * 360;

    return (
        <motion.div
            animate={{
                rotate: [startAngle, startAngle + 360],
            }}
            transition={{
                duration,
                repeat: Infinity,
                ease: "linear",
            }}
            className="absolute flex items-center justify-center"
            style={{
                width: radius * 2,
                height: radius * 2,
                transformOrigin: "center center",
            }}
        >
            <motion.div
                animate={{
                    rotate: [-(startAngle), -(startAngle + 360)],
                }}
                transition={{
                    duration,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute right-0"
                style={{
                    width: 50,
                    height: 50,
                    x: "50%",
                }}
            >
                {item.type === 'avatar' ? (
                    <div className="h-11 w-11 overflow-hidden rounded-full border-2 border-white bg-slate-100 shadow-lg dark:border-slate-800">
                        <img src={item.src} alt="Member" className="h-full w-full object-cover" />
                    </div>
                ) : (
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="h-11 w-11 rounded-full border-2 border-white shadow-lg dark:border-slate-800"
                    >
                        <CryptoIcon name={item.name} color={item.color} />
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
};
