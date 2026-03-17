import React, { useState, useEffect, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { useSystemClock } from '../../../hooks/usePerformance';

/**
 * FomoTimer - A visual urgency timer that ticks down slightly every second.
 */
export const FomoTimer = React.memo(() => {
    const tick = useSystemClock();
    const [deadLine, setDeadLine] = useState({ h: 5, m: 22, s: 41 });

    useEffect(() => {
        setDeadLine(prev => {
            let { h, m, s } = prev;
            s--;
            if (s < 0) { s = 59; m--; }
            if (m < 0) { m = 59; h--; }
            if (h < 0) { h = 23; }
            return { h, m, s };
        });
    }, [tick]);

    return (
        <div className="flex items-center gap-1.5 shrink-0">
            {[deadLine.h, deadLine.m, deadLine.s].map((val, i) => (
                <React.Fragment key={i}>
                    <div className="bg-black/90 text-yellow-400 rounded-lg px-2 py-1 text-[clamp(0.6rem,2vw,0.75rem)] font-black min-w-[32px] text-center shadow-lg border border-yellow-400/20 tabular-nums">
                        {val.toString().padStart(2, '0')}
                    </div>
                    {i < 2 && <span className="text-[clamp(0.6rem,2vw,0.75rem)] font-black text-black/40 animate-pulse">:</span>}
                </React.Fragment>
            ))}
        </div>
    );
});

FomoTimer.displayName = 'FomoTimer';

interface PaymentSessionTimerProps {
    expiresAt?: string;
    onExpire: () => void;
}

/**
 * PaymentSessionTimer - Tracks the remaining time for a payment session.
 */
export const PaymentSessionTimer = React.memo(({ expiresAt, onExpire }: PaymentSessionTimerProps) => {
    const tick = useSystemClock();
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        if (!expiresAt) { setTimeLeft(null); return; }
        const expires = new Date(expiresAt).getTime();
        const now = new Date().getTime();
        const diff = Math.max(0, Math.floor((expires - now) / 1000));
        setTimeLeft(diff);
        if (diff === 0) {
            onExpire();
        }
    }, [expiresAt, onExpire, tick]);

    const formattedTime = useMemo(() => {
        if (timeLeft === null) return null;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, [timeLeft]);

    if (!formattedTime) return null;

    return (
        <div className="flex items-center gap-2 bg-blue-600/10 dark:bg-blue-500/5 px-3 py-1 rounded-full border border-blue-500/20 shadow-sm">
            <Clock size={12} className="text-blue-600 dark:text-blue-400 animate-pulse" />
            <span className="text-caption font-black font-mono text-blue-600 dark:text-blue-400 tabular-nums">{formattedTime}</span>
        </div>
    );
});

PaymentSessionTimer.displayName = 'PaymentSessionTimer';

// --- RE-ADDED STICKY HEADER COMPONENT ---
export const StickyFomoHeader = React.memo(({ t }: { t: any }) => (
    <div className="mb-6 mt-2 px-1 sticky top-[80px] z-40">
        <div className="rounded-xl overflow-hidden px-4 py-3 bg-yellow-400 dark:bg-yellow-500 border-2 border-yellow-300 dark:border-yellow-400/50 flex flex-row items-center justify-between gap-4 relative group shadow-[0_20px_40px_-10px_rgba(234,179,8,0.3)]">
            <div className="absolute inset-0 bg-linear-to-r from-yellow-400 via-white/20 to-yellow-500 opacity-50" />
            <div className="scanning-glow absolute inset-0 opacity-10 pointer-events-none" />

            <div className="relative z-10 flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-black/10 flex items-center justify-center text-black shrink-0">
                    <Clock size={16} strokeWidth={3} className="animate-pulse" />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-[clamp(0.45rem,1.5vw,0.55rem)] font-medium text-black/60 uppercase tracking-[0.2em] leading-none mb-1">{t('pro:subscription.pro_active.lifetime_access')}</span>
                    <span className="text-[clamp(0.55rem,2vw,0.7rem)] font-bold text-black uppercase tracking-widest leading-none">{t('marketing:income.math.cta_urgency', 'OFFER CLOSING')}</span>
                </div>
            </div>

            <FomoTimer />
        </div>
    </div>
));

StickyFomoHeader.displayName = 'StickyFomoHeader';
