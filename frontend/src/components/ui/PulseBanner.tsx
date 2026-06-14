import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, Users, CreditCard, Info } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useUI } from '../../context/UIContext';

// #comment: PulseBanner — Rewritten to fix text/dots overlap and broken layout.
// Key fixes:
//   1. Removed whitespace-nowrap — text now truncates cleanly
//   2. Dots moved INSIDE the content row, never overlap text
//   3. Max 5 dots shown; rest hidden to avoid overflow
//   4. Desktop: positioned above bottom nav correctly
//   5. Content uses flexbox with proper min-w-0 + overflow:hidden chain

interface PulseItem {
    id: number;
    type: 'upgrade' | 'earning' | 'signup' | 'payment' | 'info';
    name: string;
    description: string;
    timestamp: string;
}

const TYPE_CONFIG = {
    upgrade:  { icon: Zap,        color: 'text-amber-400',   dot: 'bg-amber-400'  },
    earning:  { icon: TrendingUp, color: 'text-emerald-400', dot: 'bg-emerald-400'},
    signup:   { icon: Users,      color: 'text-blue-400',    dot: 'bg-blue-400'   },
    payment:  { icon: CreditCard, color: 'text-purple-400',  dot: 'bg-purple-400' },
    info:     { icon: Info,       color: 'text-slate-400',   dot: 'bg-slate-500'  },
} as const;

export const PulseBanner = () => {
    const { isFooterVisible, isKeyboardOpen } = useUI();
    const [pulse, setPulse] = useState<PulseItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const fetchPulse = async () => {
            try {
                const res = await apiClient.get('/api/partner/pulse');
                if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                    setPulse(res.data);
                }
            } catch (e) {
                console.warn('Pulse fetch failed', e);
            }
        };
        fetchPulse();
        const interval = setInterval(fetchPulse, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (pulse.length <= 1) return;
        timerRef.current = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % pulse.length);
        }, 6000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [pulse.length]);

    // Only show on mobile when footer is visible and keyboard is closed
    if (pulse.length === 0 || !isFooterVisible || isKeyboardOpen) return null;

    const item = pulse[currentIndex];
    const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.info;
    const Icon = config.icon;

    // Format time cleanly
    let timeStr = '';
    try {
        timeStr = new Date(item.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        timeStr = '';
    }

    // Limit visible dots to max 5
    const maxDots = 5;
    const totalDots = Math.min(pulse.length, maxDots);

    return (
        // Mobile-only — desktop has no bottom nav so this banner makes no sense there
        <div className="lg:hidden fixed bottom-[calc(var(--spacing-safe-bottom,20px)+104px)] left-0 right-0 z-40 flex justify-center pointer-events-none px-4">
            <AnimatePresence mode="wait">
                <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="w-full max-w-[min(420px,100%)] flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-950/80 dark:bg-black/70 backdrop-blur-2xl border border-white/8 shadow-[0_4px_24px_rgba(0,0,0,0.4)] overflow-hidden"
                >
                    {/* Icon pill */}
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full bg-white/8 border border-white/10 shrink-0 ${config.color}`}>
                        <Icon className="w-3 h-3" />
                    </span>

                    {/* Name */}
                    <span className="text-[11px] font-bold text-white tracking-wide shrink-0 max-w-[90px] truncate">
                        {item.name}
                    </span>

                    {/* Separator dot */}
                    <span className="w-1 h-1 rounded-full bg-white/20 shrink-0" />

                    {/* Description — truncates, never overflows */}
                    <span className="text-[11px] font-medium text-slate-300/80 truncate min-w-0 flex-1">
                        {item.description}
                    </span>

                    {/* Timestamp — always visible, never overlaps */}
                    {timeStr && (
                        <span className="text-[9px] font-bold text-slate-600 shrink-0 ml-1">
                            {timeStr}
                        </span>
                    )}

                    {/* Pagination dots — max 5, always at the end */}
                    {totalDots > 1 && (
                        <div className="flex items-center gap-[3px] shrink-0 ml-1">
                            {Array.from({ length: totalDots }).map((_, i) => (
                                <span
                                    key={i}
                                    className={`block rounded-full transition-all duration-400 ${
                                        i === (currentIndex % maxDots)
                                            ? `w-3 h-1 ${config.dot}`
                                            : 'w-1 h-1 bg-white/20'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
