import React, { createContext, useContext, useState, useCallback } from 'react';

interface StartupProgressContextType {
    progress: number;
    status: string;
    updateProgress: (value: number, status?: string) => void;
    isComplete: boolean;
    complete: () => void;
}

const StartupProgressContext = createContext<StartupProgressContextType | undefined>(undefined);

export const StartupProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [progress, setProgress] = useState(10);
    const [status, setStatus] = useState('Starting P2P Hub...');
    const [isComplete, setIsComplete] = useState(false);

    const updateProgress = useCallback((value: number, newStatus?: string) => {
        setProgress(prev => Math.max(prev, value));
        if (newStatus) setStatus(newStatus);
    }, []);

    const complete = useCallback(() => {
        setProgress(100);
        setStatus('Ready!');
        // Keep the loader for a short moment so the user sees the 100% completion
        setTimeout(() => setIsComplete(true), 800);
    }, []);

    return (
        <StartupProgressContext.Provider value={{ progress, status, updateProgress, isComplete, complete }}>
            {children}
        </StartupProgressContext.Provider>
    );
};

export const useStartupProgress = () => {
    const context = useContext(StartupProgressContext);
    if (!context) {
        // Fallback for components outside provider
        return {
            progress: 100,
            status: '',
            updateProgress: () => { },
            isComplete: true,
            complete: () => { }
        };
    }
    return context;
};
