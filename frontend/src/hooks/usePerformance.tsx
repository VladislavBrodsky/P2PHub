import { useState, useEffect, createContext, useContext } from 'react';

const PerformanceContext = createContext<{ tick: number }>({ tick: 0 });

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => (t + 1) % 1000000); // Circular tick
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <PerformanceContext.Provider value={{ tick }}>
            {children}
        </PerformanceContext.Provider>
    );
};

export const useSystemClock = () => {
    const context = useContext(PerformanceContext);
    if (!context) {
        throw new Error('useSystemClock must be used within a PerformanceProvider');
    }
    return context.tick;
};
