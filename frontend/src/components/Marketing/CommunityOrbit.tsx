import { motion } from 'framer-motion';
import { Globe, TrendingUp } from 'lucide-react';

const AVATARS = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&fm=webp",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&fm=webp",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&fm=webp",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&fm=webp",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&fm=webp"
];

const CRYPTO_ICONS = [
    { name: 'BTC', color: '#F7931A', gradientStart: '#FF9900', gradientEnd: '#F7931A' },
    { name: 'ETH', color: '#627EEA', gradientStart: '#7CA0FF', gradientEnd: '#5570F1' },
    { name: 'USDT', color: '#26A17B', gradientStart: '#53D3AC', gradientEnd: '#219672' },
    { name: 'TON', color: '#0098EA', gradientStart: '#0098EA', gradientEnd: '#00C2FF' }
];


// Crypto SVG Icons
const CryptoIcon = ({ name }: { name: string }) => {
    if (name === 'BTC') {
        return (
            <svg viewBox="0 0 32 32" className="h-full w-full drop-shadow-md">
                <path d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z" fill="white" />
            </svg>
        );
    }
    if (name === 'TON') {
        return (
            <svg viewBox="0 0 56 56" className="h-full w-full drop-shadow-md">
                <path d="M37.6,15.6H18.4c-3.5,0-5.7,3.8-4,6.9l11.8,20.5c0.8,1.3,2.7,1.3,3.5,0l11.8-20.5 C43.3,19.4,41.1,15.6,37.6,15.6L37.6,15.6z M26.3,36.8l-2.6-5l-6.2-11.1c-0.4-0.7,0.1-1.6,1-1.6h7.8L26.3,36.8L26.3,36.8z M38.5,20.7l-6.2,11.1l-2.6,5V19.1h7.8C38.4,19.1,38.9,20,38.5,20.7z" fill="white" />
            </svg>
        );
    }
    if (name === 'ETH') {
        return (
            <svg viewBox="0 0 32 32" className="h-full w-full drop-shadow-md">
                <path d="M16.498 4v8.87l7.497 3.35z" fill="white" fillOpacity="0.8" />
                <path d="M16.498 4L9 16.22l7.498-3.35z" fill="white" />
                <path d="M16.498 21.968v6.027L24 17.616z" fill="white" fillOpacity="0.8" />
                <path d="M16.498 27.995v-6.028L9 17.616z" fill="white" />
                <path d="M16.498 20.573l7.497-4.353-7.497-3.348z" fill="white" fillOpacity="0.4" />
                <path d="M9 16.22l7.498 4.353v-7.701z" fill="white" fillOpacity="0.8" />
            </svg>
        );
    }
    // USDT
    return (
        <svg viewBox="0 0 32 32" className="h-full w-full drop-shadow-md">
            <path d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117" fill="white" />
        </svg>
    );
};

export const CommunityOrbit = () => {
    // Interleave avatars and crypto icons - EXACTLY 8 ITEMS
    const orbitItems = [
        { type: 'avatar' as const, src: AVATARS[0] },
        { type: 'crypto' as const, ...CRYPTO_ICONS[0] }, // BTC
        { type: 'avatar' as const, src: AVATARS[1] },
        { type: 'crypto' as const, ...CRYPTO_ICONS[1] }, // ETH
        { type: 'avatar' as const, src: AVATARS[2] },
        { type: 'crypto' as const, ...CRYPTO_ICONS[2] }, // USDT
        { type: 'avatar' as const, src: AVATARS[3] },
        { type: 'crypto' as const, ...CRYPTO_ICONS[3] }, // TON
    ];

    return (
        <div className="relative flex h-[420px] w-full items-center justify-center overflow-visible">
            {/* Background Particles/Stars */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={`star-${i}`}
                    className="absolute h-1 w-1 rounded-full bg-blue-400/30"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        willChange: 'transform, opacity'
                    }}
                    animate={{
                        opacity: [0.2, 0.8, 0.2],
                        scale: [1, 1.5, 1],
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        ease: "linear",
                        delay: Math.random() * 2,
                    }}
                />
            ))}

            {/* Dynamic Orbit Rings */}
            <div className="absolute h-[340px] w-[340px] rounded-full border border-slate-200/20 opacity-20 dark:border-white/5" />

            {/* Middle Ring */}
            <div className="absolute h-[260px] w-[260px] rounded-full border border-slate-200/30 opacity-40 dark:border-white/10" />

            {/* Inner Rotating Dashed Ring */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute h-[180px] w-[180px] rounded-full border border-dashed border-blue-500/20 opacity-60"
                style={{ willChange: 'transform' }}
            />

            {/* Central Logic */}
            <CentralLogo />


            {/* Orbiting Avatars & Crypto Icons */}
            {orbitItems.map((item, i) => (
                <OrbitingItem key={i} item={item} index={i} total={orbitItems.length} />
            ))}
        </div>
    );
};


const CentralLogo = () => (
    <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-700 shadow-[0_0_50px_rgba(59,130,246,0.5)]"
        style={{ willChange: 'transform' }}
    >
        {/* Fractal Profits Emergence */}
        <FractalProfits />

        {/* Glow effect behind logo */}
        <div className="absolute inset-0 z-0 rounded-full bg-blue-500 blur-3xl opacity-40 animate-pulse" />

        {/* Inner glow ring */}
        <div className="absolute inset-0 z-10 rounded-full border border-white/30" />

        <motion.img
            animate={{
                scale: [1, 1.08, 1],
                filter: ["brightness(1) blur(0px)", "brightness(1.2) blur(0.5px)", "brightness(1) blur(0px)"]
            }}
            transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
            }}
            src="/logo.png"
            alt="Pintopay Logo"
            className="relative z-20 w-14 h-14 object-contain brightness-0 invert"
        />

        {/* Shockwave Ripples */}
        {[0, 1].map((i) => (
            <motion.div
                key={i}
                animate={{
                    scale: [1, 2.5],
                    opacity: [0.5, 0],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: i * 2,
                    ease: "easeOut"
                }}
                className="absolute inset-0 z-0 rounded-full border border-blue-400/30"
                style={{ willChange: 'transform, opacity' }}
            />
        ))}
    </motion.div>
);

const FractalProfits = () => {
    return (
        <div className="absolute inset-0 pointer-events-none z-0">
            {[...Array(6)].map((_, i) => {
                const direction = i % 2 === 0 ? 1 : -1; // 1 for down, -1 for up
                return (
                    <motion.div
                        key={i}
                        initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                        animate={{
                            scale: [0, 1.2, 1.5],
                            opacity: [0, 0.8, 0],
                            x: (i - 2.5) * 60,
                            y: (100 + Math.random() * 60) * direction // Bidirectional: Top and Bottom
                        }}
                        transition={{
                            duration: 7, // Slow and attractive
                            repeat: Infinity,
                            delay: i * 1.2,
                            ease: "easeOut"
                        }}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 whitespace-nowrap"
                    >
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                            <CryptoIcon name="USDT" />
                        </div>
                        <span className="text-[12px] font-black text-emerald-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                            +${Math.floor(Math.random() * 33) + 1}.00
                        </span>
                    </motion.div>
                );
            })}
        </div>
    );
};

type OrbitItem =
    | { type: 'avatar'; src: string }
    | { type: 'crypto'; name: string; color: string; gradientStart?: string; gradientEnd?: string };

const OrbitingItem = ({ item, index, total }: { item: OrbitItem; index: number; total: number }) => {
    const radius = 140; // Balanced radius
    const duration = 50;
    const angle = (index / total) * 360;

    return (
        <motion.div
            className="absolute"
            style={{
                width: 60,
                height: 60,
                willChange: 'transform'
            }}
            animate={{
                // Explicit orbital math for perfect centering
                x: [
                    Math.cos((angle) * (Math.PI / 180)) * radius,
                    Math.cos((angle + 360) * (Math.PI / 180)) * radius
                ],
                y: [
                    Math.sin((angle) * (Math.PI / 180)) * radius,
                    Math.sin((angle + 360) * (Math.PI / 180)) * radius
                ],
            }}
            transition={{
                duration,
                repeat: Infinity,
                ease: "linear"
            }}
        >
            {/* Float & Breathing Animation Layer */}
            <motion.div
                animate={{
                    y: [-4, 4, -4],
                    scale: [1, 1.05, 1]
                }}
                transition={{
                    duration: 4 + Math.random() * 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.5
                }}
                className="h-full w-full"
            >
                {item.type === 'avatar' ? (
                    <div className="group relative h-full w-full cursor-pointer">
                        {/* Soft Outer Glow */}
                        <div className="absolute -inset-2 rounded-full bg-white/20 blur-xl opacity-0 transition-opacity group-hover:opacity-100 dark:bg-blue-400/20" />

                        {/* Main Container */}
                        <div
                            className="relative h-full w-full overflow-hidden rounded-full border-2 border-white/80 bg-white/40 backdrop-blur-md shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:border-blue-400 dark:border-white/20 dark:bg-white/10"
                            style={{
                                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)'
                            }}
                        >
                            <img src={item.src} alt="Member" className="h-full w-full object-cover" />
                            {/* Reflection Overlay */}
                            <div className="absolute inset-0 bg-linear-to-tr from-white/20 to-transparent opacity-60" />
                        </div>
                    </div>
                ) : (
                    <div className="group relative h-full w-full cursor-pointer">
                        {/* Dynamic Colored Glow */}
                        <div
                            className="absolute -inset-4 rounded-full blur-2xl opacity-40 transition-opacity group-hover:opacity-80"
                            style={{ backgroundColor: item.color }}
                        />

                        {/* Token Container */}
                        <div
                            className="relative flex h-full w-full items-center justify-center rounded-full border-2 border-white/80 shadow-2xl transition-all duration-500 group-hover:scale-110 dark:border-white/20"
                            style={{
                                background: `linear-gradient(135deg, ${item.gradientStart || item.color}, ${item.gradientEnd || item.color})`,
                                boxShadow: `0 10px 30px -10px ${item.color}80`
                            }}
                        >
                            {/* Glass Shine */}
                            <div className="absolute inset-0 rounded-full bg-linear-to-tr from-white/30 to-transparent opacity-50" />

                            {/* Inner Ring */}
                            <div className="absolute inset-1 rounded-full border border-white/20" />

                            <div className="relative z-10 h-7 w-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                <CryptoIcon name={item.name} />
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};
