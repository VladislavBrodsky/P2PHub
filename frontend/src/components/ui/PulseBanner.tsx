import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, Users, CreditCard, Info } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useTranslation } from 'react-i18next';

interface PulseItem {
    id: number;
    type: 'upgrade' | 'earning' | 'signup' | 'payment' | 'info';
    name: string;
    description: string;
    timestamp: string;
}

export const PulseBanner = () => {
    const { t } = useTranslation();
    const [pulse, setPulse] = useState<PulseItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchPulse = async () => {
            try {
                const res = await apiClient.get('/api/partner/pulse');
                if (res.data && res.data.length > 0) {
                    setPulse(res.data);
                }
            } catch (e) {
                console.warn('Pulse fetch failed', e);
            }
        };

        fetchPulse();
        const interval = setInterval(fetchPulse, 30000); // 30s poll
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (pulse.length > 1) {
            const timer = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % pulse.length);
            }, 6000); // Rotate every 6s
            return () => clearInterval(timer);
        }
    }, [pulse.length]);

    if (pulse.length === 0) return null;

    const item = pulse[currentIndex];

    const getIcon = (type: PulseItem['type']) => {
        switch (type) {
            case 'upgrade': return <Zap className="w-3 h-3 text-amber-500" />;
            case 'earning': return <TrendingUp className="w-3 h-3 text-emerald-500" />;
            case 'signup': return <Users className="w-3 h-3 text-blue-500" />;
            case 'payment': return <CreditCard className="w-3 h-3 text-purple-500" />;
            default: return <Info className="w-3 h-3 text-slate-400" />;
        }
    };

    return (
        <div className="fixed bottom-[calc(var(--spacing-safe-bottom,20px)+80px)] left-0 right-0 z-40 bg-slate-900/50 dark:bg-black/40 backdrop-blur-xl border-t border-b border-white/5 h-8 overflow-hidden flex items-center justify-center pointer-events-none">
            <AnimatePresence mode="wait">
                <motion.div
                    key={item.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="flex items-center gap-2 px-4 whitespace-nowrap"
                >
                    <div className="flex items-center gap-1.5">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/5 border border-white/10">
                            {getIcon(item.type)}
                        </span>
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">
                            {item.name}
                        </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                        {item.description}
                    </span>
                    <span className="text-[8px] font-black text-slate-600 ml-2">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </motion.div>
            </AnimatePresence>

            <div className="absolute right-2 flex gap-1">
                {pulse.map((_, i) => (
                    <div
                        key={i}
                        className={`w-1 h-1 rounded-full transition-all duration-500 ${i === currentIndex ? 'bg-blue-500 w-2' : 'bg-slate-700'}`}
                    />
                ))}
            </div>
        </div>
    );
};
