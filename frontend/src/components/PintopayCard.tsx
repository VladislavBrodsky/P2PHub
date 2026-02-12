import { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type CardVariant = 'virtual' | 'physical' | 'platinum';

interface PintopayCardProps {
    variant?: CardVariant;
}

export const PintopayCard = ({
    variant = 'virtual',
}: PintopayCardProps) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const { t } = useTranslation();

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg']);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg']);

    const handleMouseMove = (
        e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
    ) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if ('clientX' in e) {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        } else {
            return;
        }

        const width = rect.width;
        const height = rect.height;
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const cardStyles = {
        virtual: 'bg-linear-to-br from-blue-600 to-blue-800',
        physical: 'bg-black', // Sleek matte black
        platinum: 'bg-linear-to-br from-slate-200 via-white to-slate-300',
    };

    // Reset flip when variant changes
    useEffect(() => {
        setIsFlipped(false);
    }, [variant]);

    return (
        <div
            className="perspective-1000 aspect-[1.58/1] w-full cursor-pointer max-w-[320px]"
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchEnd={handleMouseLeave}
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                }}
                className="relative h-full w-full transition-all duration-300"
            >
                <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="w-full h-full relative"
                >
                    {/* FRONT SIDE */}
                    <div
                        className={`absolute inset-0 backface-hidden overflow-hidden rounded-2xl shadow-2xl ${cardStyles[variant]}`}
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        {/* Global Grain Texture */}
                        <div className="absolute inset-0 z-0 opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                        {/* Variant Specific Overlays */}
                        {variant === 'platinum' && (
                            <>
                                <div className="absolute inset-0 z-1 card-shine opacity-60 mix-blend-soft-light" />
                                <div className="absolute inset-0 z-1 bg-linear-to-tr from-transparent via-white/40 to-transparent opacity-80" />
                                <div className="absolute -inset-1 z-0 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-xl" />
                            </>
                        )}

                        {variant === 'physical' && (
                            <div className="absolute inset-0 z-1 bg-linear-to-b from-white/10 to-transparent" />
                        )}

                        <div className="absolute inset-0 z-0 bg-linear-to-br from-white/10 to-transparent mix-blend-overlay" />

                        {/* Contactless Icon */}
                        <div className="absolute top-6 left-6 z-20 opacity-80">
                            <Wifi className={`h-8 w-8 rotate-90 ${variant === 'platinum' ? 'text-slate-800' : 'text-white'}`} strokeWidth={2} />
                        </div>

                        {/* Logo Text */}
                        <div className="absolute bottom-6 left-6 z-20 transition-transform duration-300 group-hover:scale-110 drop-shadow-xl">
                            <span className={`text-xl font-black tracking-tighter ${variant === 'platinum' ? 'text-slate-900' : 'text-white'}`}>
                                Pintopay
                            </span>
                        </div>

                        {/* Platinum Badge */}
                        {variant === 'platinum' && (
                            <div className="absolute top-6 right-6 z-20">
                                <div className="bg-slate-900/5 backdrop-blur-md border border-slate-900/10 rounded-full px-3 py-1 shadow-sm">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                                        Platinum
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Mastercard Logo */}
                        <div className="absolute bottom-6 right-6 z-20 flex items-center justify-center opacity-90 transition-opacity group-hover:opacity-100">
                            <svg width="34" height="22" viewBox="0 0 34 22" fill="none">
                                <circle cx="11" cy="11" r="11" fill="#EB001B" />
                                <circle cx="23" cy="11" r="11" fill="#F79E1B" fillOpacity="0.9" />
                                <path d="M17 3.17C15.15 4.9 14.07 7.32 14.07 10C14.07 12.68 15.15 15.1 17 16.83C18.85 15.1 19.93 12.68 19.93 10C19.93 7.32 18.85 4.9 17 3.17Z" fill="#FF5F00" />
                            </svg>
                        </div>

                        {/* Tap Hint */}
                        <div className="absolute bottom-1/2 translate-y-1/2 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-black/20 backdrop-blur-md rounded-full p-2">
                                <RotateCcwIcon size={16} className="text-white" />
                            </div>
                        </div>

                        {/* Shimmer Effect for Non-Platinum */}
                        {variant !== 'platinum' && (
                            <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_2s_infinite]" />
                        )}
                    </div>

                    {/* BACK SIDE */}
                    <div
                        className={`absolute inset-0 backface-hidden overflow-hidden rounded-2xl shadow-2xl p-6 flex flex-col justify-center items-center text-center ${cardStyles[variant]}`}
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        {/* Global Grain Texture - Inherited */}
                        <div className="absolute inset-0 z-0 opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                        {/* Dark Overlay for Readability - slightly heavier for text contrast */}
                        <div className="absolute inset-0 z-0 bg-black/40 mix-blend-multiply" />

                        {variant === 'platinum' && (
                            <div className="absolute inset-0 z-0 bg-linear-to-tr from-transparent via-white/20 to-transparent opacity-40" />
                        )}

                        <div className="relative z-10 w-full h-full flex flex-col justify-center">
                            <h3 className={`text-lg font-black uppercase tracking-tight mb-3 ${variant === 'platinum' ? 'text-slate-900' : 'text-white'}`}>
                                {t(`cards.${variant}.back_title`)}
                            </h3>
                            <p className={`text-xs font-medium leading-relaxed ${variant === 'platinum' ? 'text-slate-800' : 'text-white/90'}`}>
                                {t(`cards.${variant}.back_desc`)}
                            </p>
                        </div>

                        {/* Magnetic Strip Visual */}
                        <div className="absolute top-6 left-0 right-0 h-10 bg-black/80 z-1" />

                        {/* CVV/Security Code Visual */}
                        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center z-10">
                            <div className="h-6 w-10 bg-white/20 rounded-sm border border-white/10" />
                            <span className={`text-[10px] font-mono tracking-widest opacity-80 ${variant === 'platinum' ? 'text-slate-900' : 'text-white'}`}>000 / CVV</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

// Icon helper
const RotateCcwIcon = ({ size, className }: { size: number; className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
    </svg>
);
