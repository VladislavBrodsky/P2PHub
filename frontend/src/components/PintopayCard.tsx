import { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useUser } from '../context/UserContext';

export type CardVariant = 'virtual' | 'physical' | 'platinum';

interface PintopayCardProps {
    variant?: CardVariant;
}

export const PintopayCard = ({
    variant = 'virtual',
}: PintopayCardProps) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [copied, setCopied] = useState(false);
    const { t, i18n } = useTranslation(['cards', 'common']);
    const { user } = useUser();

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['12deg', '-12deg']);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-12deg', '12deg']);

    // Radial specular glare that tracks the user cursor coordinates
    const glareBg = useTransform(
        [mouseXSpring, mouseYSpring],
        ([latestX, latestY]) => {
            const pctX = (Number(latestX) + 0.5) * 100;
            const pctY = (Number(latestY) + 0.5) * 100;
            return `radial-gradient(circle at ${pctX}% ${pctY}%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 45%)`;
        }
    );

    // Holographic security sticker shifting color dynamically on mouse hover tilt
    const holoBg = useTransform(
        [mouseXSpring, mouseYSpring],
        ([latestX, latestY]) => {
            const angle = (Number(latestX) * 90) + 135;
            const shiftX = (Number(latestX) + 0.5) * 20;
            const shiftY = (Number(latestY) + 0.5) * 20;
            return `linear-gradient(${angle}deg, #00f2fe ${shiftX}%, #4facfe ${30 + shiftY}%, #f093fb ${60 + shiftX}%, #f5576c 100%)`;
        }
    );

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

    const getCardNumber = () => {
        if (variant === 'platinum') return '5111 9900 8888 7777';
        if (variant === 'physical') return '5412 8804 1234 5678';
        return '5412 7502 9812 3456';
    };

    const getCvv = () => {
        if (variant === 'platinum') return '988';
        if (variant === 'physical') return '321';
        return '456';
    };

    const handleCopyNumber = (e: React.MouseEvent) => {
        e.stopPropagation(); // Stop card from flipping
        navigator.clipboard.writeText(getCardNumber().replace(/\s/g, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const cardStyles = {
        virtual: 'bg-linear-to-br from-blue-700 via-blue-600 to-indigo-900 border-blue-500/25',
        physical: 'bg-linear-to-br from-slate-900 via-zinc-950 to-neutral-900 border-zinc-800',
        platinum: 'bg-linear-to-br from-slate-200 via-white to-slate-300 border-slate-300',
    };

    // Reset flip when variant changes
    useEffect(() => {
        setIsFlipped(false);
    }, [variant]);

    return (
        <div
            className="perspective-1000 w-full h-full cursor-pointer relative group"
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
                    {variant === 'platinum' && (
                        <div className="absolute -inset-4 z-0 bg-linear-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-2xl opacity-60 rounded-full" />
                    )}

                    <div
                        className={`absolute inset-0 backface-hidden overflow-hidden rounded-3xl shadow-2xl ${cardStyles[variant]} border will-change-transform flex flex-col justify-between p-6 select-none`}
                        style={{ backfaceVisibility: 'hidden', transform: 'translateZ(1px)' }}
                    >
                        {/* Global Premium Grain Texture */}
                        <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

                        {/* Interactive Specular Glare/Reflection Layer */}
                        <motion.div
                            style={{ background: glareBg }}
                            className="absolute inset-0 z-30 pointer-events-none mix-blend-overlay rounded-3xl"
                        />

                        {/* Custom Card Vector Overlays */}
                        {variant === 'virtual' && (
                            <svg className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                                        <path d="M 24 0 L 0 0 0 24" fill="none" stroke="white" strokeWidth="0.5"/>
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid)" />
                                <path d="M-20,60 L180,140 L340,30 L600,170" fill="none" stroke="white" strokeWidth="1.5" />
                            </svg>
                        )}

                        {variant === 'physical' && (
                            <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="100%" cy="100%" r="85%" fill="none" stroke="white" strokeWidth="1" strokeDasharray="3 6" />
                                <circle cx="100%" cy="100%" r="65%" fill="none" stroke="white" strokeWidth="1" />
                                <circle cx="100%" cy="100%" r="45%" fill="none" stroke="white" strokeWidth="1" strokeDasharray="10 10" />
                            </svg>
                        )}

                        {variant === 'platinum' && (
                            <div className="absolute inset-0 opacity-[0.12] pointer-events-none z-0"
                                 style={{
                                     backgroundImage: `repeating-linear-gradient(90deg, rgba(0,0,0,0.01) 0px, rgba(0,0,0,0.01) 1px, transparent 1px, transparent 3px)`
                                 }}
                            />
                        )}

                        {/* Top Row: Pintopay Logo + Card Network Category */}
                        <div className="flex justify-between items-start z-20 w-full relative">
                            <span className={`text-xl font-bold tracking-tighter transition-transform duration-300 group-hover:scale-[1.02]
                                ${variant === 'platinum' ? 'text-slate-900' : 'text-white'}`}>
                                Pintopay
                            </span>
                            
                            <span className={`text-[9px] font-extrabold uppercase tracking-[0.25em] opacity-75
                                ${variant === 'platinum' ? 'text-slate-800' : 'text-white'}`}>
                                {variant === 'platinum' ? t('cards.tabs.platinum') : variant === 'physical' ? t('cards.tabs.physical') : t('cards.tabs.virtual')}
                            </span>
                        </div>

                        {/* Middle Row: Detailed EMV Chip & Contactless wave */}
                        <div className="flex items-center gap-3.5 z-20 w-full relative">
                            {/* Realistic EMV Smart Chip */}
                            <div className={`w-11 h-8.5 rounded-[6px] relative p-0.5 overflow-hidden border shadow-md shrink-0 
                                ${variant === 'platinum' 
                                  ? 'from-slate-200 via-slate-100 to-slate-400 border-slate-350 shadow-slate-900/10 bg-linear-to-br' 
                                  : 'from-yellow-300 via-amber-100 to-yellow-500 border-amber-500/40 shadow-amber-950/20 bg-linear-to-br'}`}
                            >
                                {/* Conductive division grids */}
                                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0.5 opacity-40">
                                    <div className={`border-r border-b ${variant === 'platinum' ? 'border-slate-500/40' : 'border-amber-700/40'}`} />
                                    <div className={`border-r border-b ${variant === 'platinum' ? 'border-slate-500/40' : 'border-amber-700/40'}`} />
                                    <div className={`border-b ${variant === 'platinum' ? 'border-slate-500/40' : 'border-amber-700/40'}`} />
                                    <div className={`border-r border-b ${variant === 'platinum' ? 'border-slate-500/40' : 'border-amber-700/40'}`} />
                                    <div className={`border-r border-b ${variant === 'platinum' ? 'border-slate-500/40' : 'border-amber-700/40'}`} />
                                    <div className={`border-b ${variant === 'platinum' ? 'border-slate-500/40' : 'border-amber-700/40'}`} />
                                    <div className={`border-r ${variant === 'platinum' ? 'border-slate-500/40' : 'border-amber-700/40'}`} />
                                    <div className={`border-r ${variant === 'platinum' ? 'border-slate-500/40' : 'border-amber-700/40'}`} />
                                    <div className="bg-transparent" />
                                </div>
                                {/* Center contact pad */}
                                <div className={`absolute top-[28%] left-[28%] w-[44%] h-[44%] rounded-sm border 
                                    ${variant === 'platinum' ? 'bg-slate-100/90 border-slate-350' : 'bg-yellow-50/90 border-amber-350'}`} 
                                />
                            </div>

                            {/* Contactless Wave symbol */}
                            <ContactlessWave className={`h-4.5 w-4.5 ${variant === 'platinum' ? 'text-slate-800' : 'text-white'} opacity-65`} />
                        </div>

                        {/* Card Number Container (Click to Copy) */}
                        <div className="z-20 w-full relative -mt-1">
                            <div 
                                onClick={handleCopyNumber}
                                className="inline-flex items-center gap-2.5 group/num cursor-copy py-1 rounded-lg transition-colors select-none"
                                title="Click to copy card number"
                            >
                                <span className={`font-mono text-sm sm:text-[15px] md:text-[16px] tracking-[0.2em] font-bold transition-colors duration-200 group-hover/num:text-blue-500 dark:group-hover/num:text-blue-400
                                    ${variant === 'platinum' ? 'text-slate-800' : 'text-white'}`}>
                                    {getCardNumber()}
                                </span>
                                
                                <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm border transition-opacity duration-200 opacity-0 group-hover/num:opacity-100 whitespace-nowrap
                                    ${variant === 'platinum' 
                                      ? 'text-slate-700 bg-slate-900/5 border-slate-900/10' 
                                      : 'text-white/80 bg-white/10 border-white/10'}`}
                                >
                                    {copied ? t('common:copied', 'Copied') : t('common:copy', 'Copy')}
                                </span>
                            </div>
                        </div>

                        {/* Expiration Date & User Details Row */}
                        <div className="flex justify-between items-end z-20 w-full relative">
                            {/* Cardholder Name & Exp Date */}
                            <div className="flex flex-col text-left gap-1.5">
                                {/* Expiration Date */}
                                <div className="flex items-center gap-2">
                                    <span className={`text-[6px] uppercase tracking-wider font-extrabold opacity-60 leading-none
                                        ${variant === 'platinum' ? 'text-slate-600' : 'text-white/60'}`}>
                                        Valid<br/>Thru
                                    </span>
                                    <span className={`font-mono text-[10px] tracking-widest font-semibold
                                        ${variant === 'platinum' ? 'text-slate-800' : 'text-white'}`}>
                                        12/31
                                    </span>
                                </div>

                                {/* Owner Name */}
                                <div className="flex flex-col">
                                    <span className={`text-[10px] font-mono tracking-widest uppercase font-bold leading-none mb-0.5
                                        ${variant === 'platinum' ? 'text-slate-850' : 'text-white'}`}>
                                        {user?.first_name ? user.first_name.split('|')[0].trim() : 'PARTNER MEMBER'}
                                    </span>
                                    <span className={`text-[7px] font-bold tracking-[0.15em] uppercase opacity-55 block
                                        ${variant === 'platinum' ? 'text-slate-500' : 'text-white/60'}`}>
                                        {variant === 'platinum' ? 'Ecosystem Architect' : 'Network Member'}
                                    </span>
                                </div>
                            </div>

                            {/* Mastercard Branding & Hologram */}
                            <div className="flex items-center gap-3 shrink-0">
                                {/* Holographic security sticker */}
                                <motion.div
                                    style={{ background: holoBg }}
                                    className="w-8 h-6 rounded-md border border-white/25 shadow-xs mix-blend-screen opacity-70 cursor-help"
                                />

                                {/* Mastercard dual globes */}
                                <div className="opacity-95 shrink-0">
                                    <svg width="34" height="22" viewBox="0 0 34 22" fill="none">
                                        <circle cx="11" cy="11" r="11" fill="#EB001B" />
                                        <circle cx="23" cy="11" r="11" fill="#F79E1B" fillOpacity="0.9" />
                                        <path d="M17 3.17C15.15 4.9 14.07 7.32 14.07 10C14.07 12.68 15.15 15.1 17 16.83C18.85 15.1 19.93 12.68 19.93 10C19.93 7.32 18.85 4.9 17 3.17Z" fill="#FF5F00" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Tap Flip Icon Hint */}
                        <div className="absolute bottom-1/2 translate-y-1/2 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-black/20 backdrop-blur-md rounded-full p-2">
                                <RotateCcwIcon size={16} className="text-white" />
                            </div>
                        </div>
                    </div>

                    {/* BACK SIDE */}
                    <div
                        className={`absolute inset-0 backface-hidden overflow-hidden rounded-3xl shadow-2xl pt-16 px-6 pb-6 flex flex-col justify-between ${cardStyles[variant]} border`}
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg) translateZ(1px)' }}
                    >
                        {/* Global Premium Grain Texture */}
                        <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

                        {/* Dark Overlay for visual contrast */}
                        {variant !== 'platinum' && (
                            <div className="absolute inset-0 z-0 bg-black/30 mix-blend-multiply pointer-events-none" />
                        )}

                        {/* Magnetic Strip Visual */}
                        <div className={`absolute top-6 left-0 right-0 h-10 z-10 flex items-center justify-center ${variant === 'platinum' ? 'bg-black/90' : 'bg-black/95'}`}>
                            <span className="text-white/80 font-bold tracking-widest uppercase text-[9px] drop-shadow-md">
                                {t(`cards.${variant}.back_title`)}
                            </span>
                        </div>

                        {/* Signature Strip Visual */}
                        <div 
                            className="absolute top-[48%] left-6 right-6 h-8.5 bg-slate-50/95 dark:bg-white/95 flex items-center justify-between px-3.5 border-y border-slate-350/45 select-none overflow-hidden rounded-[4px]"
                            style={{
                                backgroundImage: `repeating-linear-gradient(45deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 2px, transparent 2px, transparent 10px)`
                            }}
                        >
                            {/* Mock Signature script */}
                            <span className="text-[10px] font-sans italic text-slate-500/80 font-semibold tracking-wide">
                                {user?.first_name ? user.first_name.split('|')[0].trim() : 'Pintopay Member'}
                            </span>
                            {/* CVV printed code */}
                            <span className="text-xs font-mono font-bold text-slate-900 tracking-wider">
                                {getCvv()}
                            </span>
                        </div>

                        {/* Spacer for structure */}
                        <div className="h-16" />

                        {/* Card Info and Bank Disclaimer */}
                        <div className="relative z-10 w-full flex flex-col gap-2.5 text-left pt-2">
                            <p className={`text-[8px] font-medium leading-relaxed max-w-[85%] ${variant === 'platinum' ? 'text-slate-800 font-semibold' : 'text-white/80'}`}>
                                {t(`cards.${variant}.back_desc`)}
                            </p>
                            
                            <div className="flex justify-between items-end border-t border-white/10 pt-2 w-full">
                                <span className={`text-[5px] uppercase tracking-wider opacity-40 max-w-[200px] leading-tight
                                    ${variant === 'platinum' ? 'text-slate-900' : 'text-white'}`}>
                                    This card is issued by Pintopay pursuant to license by Mastercard. Use is subject to the cardholder agreement.
                                </span>
                                
                                <div className="opacity-60 shrink-0">
                                    <svg width="24" height="15" viewBox="0 0 34 22" fill="none">
                                        <circle cx="11" cy="11" r="11" fill="#EB001B" />
                                        <circle cx="23" cy="11" r="11" fill="#F79E1B" fillOpacity="0.9" />
                                        <path d="M17 3.17C15.15 4.9 14.07 7.32 14.07 10C14.07 12.68 15.15 15.1 17 16.83C18.85 15.1 19.93 12.68 19.93 10C19.93 7.32 18.85 4.9 17 3.17Z" fill="#FF5F00" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

// SVG Contactless Wave symbol
const ContactlessWave = ({ className, size = 18 }: { className?: string; size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M3.5 16.5a6 6 0 0 1 0-9" />
        <path d="M7 20a11 11 0 0 1 0-16" />
        <path d="M10.5 23.5a16 16 0 0 1 0-23" />
    </svg>
);

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

