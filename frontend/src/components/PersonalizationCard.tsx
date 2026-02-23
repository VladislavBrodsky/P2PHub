import * as React from 'react';
import { motion } from 'framer-motion';
import { Crown, User } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';
import { getRank, getXPProgress, getRankGradient } from '../utils/ranking';
import { ProPlusBadge } from './ui/ProPlusBadge';

interface PersonalizationCardProps {
    className?: string;
    variant?: 'default' | 'compact';
}

export function PersonalizationCard({ className, variant = 'default' }: PersonalizationCardProps) {
    const { t } = useTranslation(['common']);
    const { user, isLoading: isUserLoading } = useUser();
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const [imgError, setImgError] = React.useState(false);

    const stats = user || {
        balance: 0,
        level: 1,
        xp: 0
    };

    const isProPlus = user?.is_pro_plus || (user?.subscription_plan || '').toLowerCase().includes('plus');
    const xpProgress = getXPProgress(stats.level || 1, stats.xp || 0);

    return (
        <div className={`relative overflow-visible pt-4 ${className}`}>
            {/* Premium Background Glow */}
            {/* Premium Background Glow - Disabled for compact variant to avoid glitches in menu */}
            {variant !== 'compact' && (
                <div className={`absolute top-1/2 left-10 -translate-y-1/2 w-48 h-32 ${isProPlus ? 'bg-blue-400/30 shadow-[0_0_100px_rgba(34,211,238,0.4)]' : 'bg-brand-blue/10'} blur-[60px] rounded-full -z-10 transition-all duration-1000`} />
            )}

            {/* Vibing Purple Crown for PRO Users - Outside container to avoid clipping */}
            {user?.is_pro && (
                <motion.div
                    initial={{ rotate: -15, y: 0 }}
                    animate={{
                        rotate: [-15, 15, -15],
                        y: [-2, 2, -2],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    // Adjusted positioning to be top-left of the profile picture
                    className={`absolute ${variant === 'compact' ? 'top-[30px] left-[18px]' : 'top-[34px] left-[14px]'} z-50 drop-shadow-[0_4px_12px_rgba(168,85,247,0.5)] ${isProPlus ? 'brightness-125' : ''}`}
                >
                    <Crown
                        size={variant === 'compact' ? 24 : 30}
                        className="text-fuchsia-500 fill-fuchsia-500/10"
                        strokeWidth={2.5}
                    />
                </motion.div>
            )}

            {/* #comment: Separated shadow and background from overflow container to prevent shadow clipping */}
            <div className={`
                relative rounded-[2.5rem] bg-bg-glass backdrop-blur-xl border border-border-glass group
                ${variant === 'compact' ? 'gap-4 outline-none' : 'shadow-premium-lg'}
                ${isProPlus ? 'ring-2 ring-blue-400/20' : ''}
            `}>
                <div className="flex items-center gap-5 p-3.5 rounded-[inherit] overflow-hidden">
                    {/* PRO+ Vibing Animated Border - Disabled for compact variant to fix glitches */}
                    {isProPlus && variant !== 'compact' && (
                        <motion.div
                            animate={{
                                opacity: [0.3, 0.7, 0.3],
                                scale: [1, 1.05, 1]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute inset-0 bg-linear-to-tr from-blue-500/20 via-transparent to-cyan-400/20 pointer-events-none"
                        />
                    )}

                    {/* Left: Avatar & Rank Badge Column */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                        <div className="relative">


                            <motion.div
                                whileHover={variant === 'compact' ? {} : { scale: 1.05, rotate: 2 }}
                                className={`
                                ${variant === 'compact' ? 'h-14 w-14 rounded-2xl' : 'h-16 w-16 rounded-xl'} 
                                overflow-hidden border-2 shadow-premium transition-all duration-300 relative will-change-transform z-10
                                ${isProPlus ? 'border-cyan-400/60 ring-2 ring-blue-500/30' : 'border-border-glass'}
                                bg-bg-app 
                            `}
                            >
                                {/* Skeleton/Placeholder while loading */}
                                {(isUserLoading || (user?.photo_url && !imageLoaded)) && (
                                    <div className="absolute inset-0 bg-btn-secondary-bg flex items-center justify-center">
                                        <div className="absolute inset-0 bg-linear-to-tr from-blue-500/10 to-transparent animate-pulse"></div>
                                        <User size={variant === 'compact' ? 24 : 32} className="text-text-secondary opacity-40" />
                                    </div>
                                )}

                                {user?.photo_url && !imgError ? (
                                    <img
                                        src={user.photo_url}
                                        alt={`${user.first_name || t('partner_fallback')}'s avatar`}
                                        className={`h-full w-full object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${isProPlus ? 'scale-110' : ''}`}
                                        onLoad={() => setImageLoaded(true)}
                                        loading="eager"
                                        fetchPriority="high"
                                        decoding="async"
                                        width={variant === 'compact' ? 56 : 64}
                                        height={variant === 'compact' ? 56 : 64}
                                        onError={() => setImgError(true)}
                                        style={{
                                            imageRendering: '-webkit-optimize-contrast',
                                            transform: 'translateZ(0)', // Force GPU acceleration
                                        }}
                                    />
                                ) : !isUserLoading && (
                                    <div className="h-full w-full flex items-center justify-center bg-btn-secondary-bg text-text-secondary">
                                        <User size={variant === 'compact' ? 24 : 32} />
                                    </div>
                                )}
                            </motion.div>

                            {!isProPlus && (
                                <div className={`absolute -bottom-1 -right-1 flex ${variant === 'compact' ? 'h-5 w-5' : 'h-6 w-6'} items-center justify-center rounded-lg bg-blue-500 text-white shadow-premium ring-2 ring-bg-app z-20`}>
                                    <span className="text-label font-bold">{user?.level || 1}</span>
                                </div>
                            )}

                            {isProPlus && (
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-40 transform">
                                    <ProPlusBadge size="sm" className="shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Stats Vertical Stack */}
                    <div className="flex flex-col items-start gap-1 flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 w-full">
                            {(() => {
                                const firstName = user?.first_name || t('partner_fallback');
                                const lastName = user?.last_name || '';
                                const fullName = `${firstName} ${lastName}`.trim();
                                const displayName = fullName.length > 20 ? firstName : fullName;

                                return (
                                    <h2 className={`${variant === 'compact' ? 'text-base' : 'text-lg'} font-bold tracking-tight text-text-primary whitespace-nowrap`}>
                                        {t('hi')}, {displayName}!
                                    </h2>
                                );
                            })()}
                        </div>

                        {/* XP Progress Bar - Horizontal Fit */}
                        <div className="w-full space-y-1">
                            <div className="flex justify-between items-baseline px-0.5 gap-2">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.05, 1],
                                        filter: ['drop-shadow(0 0 0px transparent)', 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.4))', 'drop-shadow(0 0 0px transparent)']
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="flex items-baseline gap-1 whitespace-nowrap"
                                >
                                    <span className="text-label font-bold text-blue-600 dark:text-blue-400 tracking-tight uppercase shrink-0">{t('total')}:</span>
                                    <span className="text-label font-bold text-blue-500 dark:text-blue-300">{Math.floor(stats.xp).toLocaleString()} {t('xp')}</span>
                                </motion.div>
                                <span className="text-label font-bold text-text-primary whitespace-nowrap flex items-baseline gap-1">
                                    <span>{xpProgress.current.toLocaleString()}</span>
                                    <span className="text-text-secondary font-medium">/</span>
                                    <span>{xpProgress.total.toLocaleString()}</span>
                                    <span className="text-label text-text-secondary uppercase ml-0.5 shrink-0">{t('next_lvl')}</span>
                                </span>
                            </div>
                            <div className="h-3 w-full bg-slate-900/10 dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-black/5 dark:border-white/5 shadow-inner relative">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${xpProgress.percent}%` }}
                                    transition={{ duration: 1.5, ease: 'circOut' }}
                                    className={`h-full rounded-full progress-bar-liquid bg-linear-to-r ${getRankGradient(stats.level || 1)}`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
