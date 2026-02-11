import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';

interface UIContextType {
    isHeaderVisible: boolean;
    setHeaderVisible: (visible: boolean) => void;
    isFooterVisible: boolean;
    setFooterVisible: (visible: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isHeaderVisible, setHeaderVisible] = useState(true);
    const [isFooterVisible, setFooterVisible] = useState(true);

    const value = useMemo(() => ({
        isHeaderVisible,
        setHeaderVisible,
        isFooterVisible,
        setFooterVisible,
    }), [isHeaderVisible, isFooterVisible]);

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
