import { useState, useEffect, createContext, useContext } from 'react';

const PerformanceContext = createContext<{
    tick: number;
    lowPowerMode: boolean;
    setLowPowerMode: (val: boolean) => void;
}>({
    tick: 0,
    lowPowerMode: false,
    setLowPowerMode: () => { }
});

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tick, setTick] = useState(0);
    const [lowPowerMode, setLowPowerMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
        return false;
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => (t + 1) % 1000000); // Circular tick
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Also auto-enable low power mode if the system preference changes
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handleChange = (e: MediaQueryListEvent) => setLowPowerMode(e.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return (
        <PerformanceContext.Provider value={{ tick, lowPowerMode, setLowPowerMode }}>
            {children}
        </PerformanceContext.Provider>
    );
};

export const usePerformance = () => {
    const context = useContext(PerformanceContext);
    if (!context) {
        throw new Error('usePerformance must be used within a PerformanceProvider');
    }
    return context;
};

export const useSystemClock = () => {
    return usePerformance().tick;
};
