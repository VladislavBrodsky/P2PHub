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
    isDebugOpen: boolean;
    setDebugOpen: (open: boolean) => void;
    isKeyboardOpen: boolean;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isHeaderVisible, setHeaderVisible] = useState(true);
    const [isFooterVisible, setFooterVisible] = useState(true);
    const [isNotificationsVisible, setNotificationsVisible] = useState(true);
    const [isSupportOpen, setSupportOpen] = useState(false);
    const [isDebugOpen, setDebugOpen] = useState(false);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    React.useEffect(() => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const root = document.documentElement;

        if (isIOS) {
            // Hardcoded values that perfect the iPhone EXPERIENCE (as per user feedback)
            root.style.setProperty('--dynamic-safe-top', '32px');
            root.style.setProperty('--dynamic-header-offset', '136px');
            root.style.setProperty('--dynamic-header-padding', '106px');
        } else {
            // Dynamic values that fix the "too low" bug on Android/Desktop
            // We use a smaller base margin for Android because they don't have the same safe area overhead as iOS
            root.style.setProperty('--dynamic-safe-top', 'var(--tg-content-safe-area-inset-top, 0px)');
            root.style.setProperty('--dynamic-header-offset', 'calc(var(--tg-content-safe-area-inset-top, 0px) + 94px)');
            root.style.setProperty('--dynamic-header-padding', 'calc(var(--tg-content-safe-area-inset-top, 0px) + 62px)');
        }

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
        isDebugOpen,
        setDebugOpen,
        isKeyboardOpen,
    }), [isHeaderVisible, isFooterVisible, isNotificationsVisible, isSupportOpen, isDebugOpen, isKeyboardOpen]);

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
