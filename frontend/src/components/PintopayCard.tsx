import * as React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Wifi } from 'lucide-react';

export type CardVariant = 'virtual' | 'physical' | 'platinum';

interface PintopayCardProps {
    variant?: CardVariant;
}

export const PintopayCard = ({
    variant = 'virtual',
}: PintopayCardProps) => {
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
        virtual: 'bg-gradient-to-br from-blue-600 to-blue-800',
        physical: 'bg-black', // Sleek matte black
        platinum: 'bg-gradient-to-br from-slate-200 via-white to-slate-300',
    };

    return (
        <div
            className="perspective-1000 aspect-[1.58/1] w-full cursor-pointer max-w-[320px]"
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchEnd={handleMouseLeave}
        >
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                }}
                className={`group relative h-full w-full overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 ${cardStyles[variant]}`}
            >
                {/* Global Grain Texture */}
                <div className="absolute inset-0 z-0 opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                {/* Variant Specific Overlays */}
                {variant === 'platinum' && (
                    <>
                        <div className="absolute inset-0 z-1 card-shine opacity-60 mix-blend-soft-light" />
                        <div className="absolute inset-0 z-1 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-80" />
                        <div className="absolute -inset-1 z-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-xl" />
                    </>
                )}

                {variant === 'physical' && (
                    <div className="absolute inset-0 z-1 bg-gradient-to-b from-white/10 to-transparent" />
                )}

                <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/10 to-transparent mix-blend-overlay" />

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

                {/* Shimmer Effect for Non-Platinum */}
                {variant !== 'platinum' && (
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_2s_infinite]" />
                )}
            </motion.div>
        </div>
    );
};
