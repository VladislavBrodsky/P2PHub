import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
    id: number;
    telegram_id: string;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
    balance: number;
    level: number;
    referral_code: string;
}

interface UserContextType {
    user: User | null;
    isLoading: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = async () => {
        try {
            // In a real TMA environment, this header would be populated
            // For local dev, we might need a fallback or mock
            const initData = window.Telegram?.WebApp?.initData || '';
            const res = await axios.get('http://localhost:8000/api/partner/me', {
                headers: {
                    'X-Telegram-Init-Data': initData
                }
            });
            setUser(res.data);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            // Fallback mock for local development if backend fails or initData is missing
            if (!user) {
                setUser({
                    id: 0,
                    telegram_id: '0',
                    username: 'partner_dev',
                    first_name: 'Partner',
                    last_name: 'Dev',
                    photo_url: null,
                    balance: 0,
                    level: 1,
                    referral_code: 'P2P-DEV'
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, isLoading, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
