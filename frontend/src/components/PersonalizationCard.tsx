import * as React from 'react';
import { motion } from 'framer-motion';
import { Crown, User } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';
import { getRank, getXPProgress, getRankGradient, getRankTextColor } from '../utils/ranking';
import { ProPlusBadge, ProBadge } from './ui/ProPlusBadge';
import { getSafeLaunchParams } from '../utils/tma';

interface PersonalizationCardProps {
    className?: string;
    variant?: 'default' | 'compact';
}

export function PersonalizationCard({ className, variant = 'default' }: PersonalizationCardProps) {
    const { t, i18n } = useTranslation(['common']);
    const { user, isLoading: isUserLoading } = useUser();
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const [imgError, setImgError] = React.useState(false);

    // 3-tier avatar fallback strategy:
    // 1. Telegram SDK photoUrl (always fresh, best for instant display)
    // 2. Backend proxy via photo_file_id (cached WebP, robust)
    // 3. Stored photo_url from DB
    const tgPhotoUrl = React.useMemo(() => {
        try {
            const lp = getSafeLaunchParams();
            return (lp.initData as any)?.user?.photoUrl || null;
        } catch {
            return null;
        }
    }, []);

    const avatarSrc = React.useMemo(() => {
        if (tgPhotoUrl) return tgPhotoUrl;
        if (user?.photo_file_id) return `/api/partner/photo/${user.photo_file_id}`;
        if (user?.photo_url) return user.photo_url;
        return null;
    }, [tgPhotoUrl, user?.photo_file_id, user?.photo_url]);

    const stats = user || {
        balance: 0,
        level: 1,
        xp: 0
    };

    const plan = (user?.subscription_plan || '').toLowerCase();
    const isProPlus = user?.is_pro_plus || plan.includes('plus');
    const isPro = user?.is_pro || plan.includes('pro');
    const xpProgress = getXPProgress(stats.level || 1, stats.xp || 0);

    const formatXP = (num: number) => {
        const lang = i18n.language || 'en';
        if (num >= 1000) {
            return (num / 1000).toLocaleString(lang, { maximumFractionDigits: 1 }) + 'K';
        }
        return num.toLocaleString(lang);
    };

    return (
        <div className={`relative overflow-visible pt-4 ${className}`}>
            {/* Premium Background Glow */}
            {/* Removed background glow */}


            {/* #comment: Separated shadow and background from overflow container to prevent shadow clipping */}
            <div className={`
                relative rounded-3xl border border-border-glass group overflow-visible
                ${variant === 'compact' ? 'gap-4 outline-none' : 'shadow-premium-lg'}
                ${isProPlus ? 'ring-2 ring-blue-400/20' : isPro ? 'ring-2 ring-amber-400/10' : ''}
            `}>
                {/* #comment: Background layer with blur - separated to prevent clipping of children that exceed bounds (e.g. the crown) */}
                <div className="absolute inset-0 rounded-[inherit] bg-bg-glass backdrop-blur-xl pointer-events-none z-0" />

                <div className={`flex items-center ${variant === 'compact' ? 'gap-3.5 p-2.5' : 'gap-5 p-3.5'} rounded-[inherit] relative z-10 overflow-visible`}>
                    {/* PRO+ Vibing Animated Border - Disabled for compact variant to fix glitches */}
                    {isProPlus && variant !== 'compact' && (
                        <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
                            <div
                                className="absolute inset-0 bg-linear-to-tr from-blue-500/20 via-transparent to-cyan-400/20 animate-pulse-subtle"
                            />
                        </div>
                    )}

                    {/* Left: Avatar & Rank Badge Column */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                        <div className="relative">
                            {user?.is_pro && (
                                <div
                                    className={`absolute ${variant === 'compact' ? '-top-4 left-1/2 -translate-x-1/2' : '-top-5 left-1/2 -translate-x-1/2'} z-50 drop-shadow-[0_4px_12px_rgba(168,85,247,0.4)] ${isProPlus ? 'brightness-110' : ''} animate-float-subtle`}
                                >
                                    <Crown
                                        size={variant === 'compact' ? 18 : 26}
                                        className={`${isProPlus ? 'text-purple-500 fill-purple-500/20' : 'text-yellow-400 fill-yellow-400/20'}`}
                                        strokeWidth={2.5}
                                    />
                                </div>
                            )}


                            <motion.div
                                whileHover={variant === 'compact' ? {} : { scale: 1.05, rotate: 2 }}
                                className={`
                                ${variant === 'compact' ? 'h-12 w-12 rounded-xl' : 'h-16 w-16 rounded-xl'} 
                                overflow-hidden border-2 shadow-premium transition-all duration-300 relative will-change-transform z-10
                                ${isProPlus ? 'border-cyan-400/60 ring-2 ring-blue-500/30' : isPro ? 'border-amber-400/60 ring-1 ring-amber-500/20' : 'border-border-glass'}
                                bg-bg-app 
                            `}
                            >
                                {/* Skeleton while loading */}
                                {(isUserLoading || (avatarSrc && !imageLoaded && !imgError)) && (
                                    <div className="absolute inset-0 bg-btn-secondary-bg flex items-center justify-center">
                                        <div className="absolute inset-0 bg-linear-to-tr from-blue-500/10 to-transparent animate-pulse"></div>
                                        <User size={variant === 'compact' ? 24 : 32} className="text-text-secondary opacity-40" />
                                    </div>
                                )}

                                {avatarSrc && !imgError ? (
                                    <img
                                        src={avatarSrc}
                                        alt={`${user?.first_name || t('partner_fallback')}'s avatar`}
                                        className={`h-full w-full object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${isProPlus || isPro ? 'scale-110' : ''}`}
                                        onLoad={() => setImageLoaded(true)}
                                        loading="eager"
                                        fetchPriority="high"
                                        decoding="async"
                                        width={variant === 'compact' ? 56 : 64}
                                        height={variant === 'compact' ? 56 : 64}
                                        onError={() => setImgError(true)}
                                        style={{
                                            imageRendering: '-webkit-optimize-contrast',
                                            transform: 'translateZ(0)',
                                        }}
                                    />
                                ) : !isUserLoading && (
                                    <div className="h-full w-full flex items-center justify-center bg-btn-secondary-bg text-text-secondary">
                                        <User size={variant === 'compact' ? 24 : 32} />
                                    </div>
                                )}
                            </motion.div>

                            {!(isProPlus || isPro) && (
                                <div className={`absolute -bottom-1 -right-1 flex ${variant === 'compact' ? 'h-5 w-5' : 'h-6 w-6'} items-center justify-center rounded-lg bg-blue-500 text-white shadow-premium ring-2 ring-bg-app z-20`}>
                                    <span className="text-label font-bold">{user?.level || 1}</span>
                                </div>
                            )}

                            {(isProPlus || isPro) && (
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-40 transform">
                                    <ProBadge
                                        variant={isProPlus ? 'pro-plus' : 'pro'}
                                        size="sm"
                                        className={isProPlus ? "shadow-[0_0_15px_rgba(34,211,238,0.5)]" : "shadow-[0_0_12px_rgba(251,191,36,0.4)]"}
                                    />
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
                                    <h2 className={`${variant === 'compact' ? 'text-sm' : 'text-lg'} font-bold tracking-tight text-text-primary whitespace-nowrap`}>
                                        {t('hi')}, {displayName}!
                                    </h2>
                                );
                            })()}
                        </div>

                        {/* XP Progress Bar - Horizontal Fit */}
                        <div className="w-full space-y-1">
                            <div className="flex justify-between items-baseline px-0.5 gap-2">
                                <div
                                    className="flex items-baseline gap-1 whitespace-nowrap"
                                >
                                    <span className={`text-label font-bold ${getRankTextColor(stats.level || 1)} tracking-tight uppercase shrink-0`}>{t('total')}:</span>
                                    <span className={`text-label font-bold ${getRankTextColor(stats.level || 1)}`}>{formatXP(Math.floor(stats.xp))} {t('xp')}</span>
                                </div>
                                <span className="text-label font-bold text-text-primary whitespace-nowrap flex items-baseline gap-1">
                                    <span>{formatXP(xpProgress.current)}</span>
                                    <span className="text-text-secondary font-medium">/</span>
                                    <span>{formatXP(xpProgress.total)}</span>
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
