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
        <div className="relative z-10 flex items-center gap-1 font-mono shrink-0 bg-black/5 p-1 rounded-lg">
            {[deadLine.h, deadLine.m, deadLine.s].map((val, i) => (
                <React.Fragment key={i}>
                    <div className="bg-black text-yellow-400 rounded-md px-1.5 py-0.5 text-label font-bold min-w-[28px] text-center shadow-lg">
                        {val.toString().padStart(2, '0')}
                    </div>
                    {i < 2 && <span className="text-label font-bold text-black/80 animate-pulse">:</span>}
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
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-white/10">
            <Clock size={10} className="text-blue-600 dark:text-blue-400" />
            <span className="text-label font-bold font-mono text-blue-600 dark:text-blue-400">{formattedTime}</span>
        </div>
    );
});

PaymentSessionTimer.displayName = 'PaymentSessionTimer';
// --- RE-ADDED STICKY HEADER COMPONENT ---
export const StickyFomoHeader = React.memo(({ t }: { t: any }) => (
    <div className="mb-4 mt-1 px-1 sticky top-[72px] z-40">
        <div className="rounded-xl overflow-hidden px-2.5 py-1.5 bg-yellow-400/90 backdrop-blur-md border border-yellow-500/30 flex flex-row items-center justify-between gap-2 relative group shadow-lg">
            <div className="absolute inset-0 bg-linear-to-r from-yellow-400 via-yellow-300 to-yellow-500 opacity-100" />
            <div className="scanning-glow absolute inset-0 opacity-20 pointer-events-none" />

            <div className="relative z-10 flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-black/10 flex items-center justify-center text-black shrink-0">
                    <Clock size={12} className="animate-pulse" />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-[8px] font-bold text-black/60 uppercase tracking-widest leading-none truncate">{t('pro:subscription.pro_active.lifetime_access')}</span>
                    <span className="text-[10px] font-black text-black uppercase tracking-tighter leading-normal truncate">{t('marketing:income.math.cta_urgency', 'OFFER CLOSING')}</span>
                </div>
            </div>

            <FomoTimer />
        </div>
    </div>
));

StickyFomoHeader.displayName = 'StickyFomoHeader';
