/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';

interface UIContextType {
    isHeaderVisible: boolean;
    setHeaderVisible: (visible: boolean) => void;
    isFooterVisible: boolean;
    setFooterVisible: (visible: boolean) => void;
    isNotificationsVisible: boolean;
    setNotificationsVisible: (visible: boolean) => void;
    isSupportOpen: boolean;
    setSupportOpen: (open: boolean) => void;
    isKeyboardOpen: boolean;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isHeaderVisible, setHeaderVisible] = useState(true);
    const [isFooterVisible, setFooterVisible] = useState(true);
    const [isNotificationsVisible, setNotificationsVisible] = useState(true);
    const [isSupportOpen, setSupportOpen] = useState(false);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    React.useEffect(() => {
        const handleResize = () => {
            if (window.visualViewport) {
                const diff = window.innerHeight - window.visualViewport.height;
                // Threshold of 160px is safer for modern mobile keyboards
                setIsKeyboardOpen(diff > 160);
            } else {
                // Fallback for browsers without visualViewport
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                if (isMobile) {
                    setIsKeyboardOpen(window.innerHeight < 500); // Simple height-based heuristic
                }
            }
        };

        window.visualViewport?.addEventListener('resize', handleResize);
        window.addEventListener('resize', handleResize);

        return () => {
            window.visualViewport?.removeEventListener('resize', handleResize);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const value = useMemo(() => ({
        isHeaderVisible,
        setHeaderVisible,
        isFooterVisible,
        setFooterVisible,
        isNotificationsVisible,
        setNotificationsVisible,
        isSupportOpen,
        setSupportOpen,
        isKeyboardOpen,
    }), [isHeaderVisible, isFooterVisible, isNotificationsVisible, isSupportOpen, isKeyboardOpen]);

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
