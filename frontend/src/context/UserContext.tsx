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
            // Use SDK to get initData more reliably
            let initData = '';
            try {
                const { initDataRaw } = window.Telegram?.WebApp ? { initDataRaw: window.Telegram.WebApp.initData } : { initDataRaw: '' };
                initData = initDataRaw || '';
            } catch (e) {
                console.error('Failed to get launch params:', e);
            }

            const apiUrl = import.meta.env.VITE_API_URL || 'https://p2phub-production.up.railway.app' || 'http://localhost:8000';
            console.log('Fetching user from:', `${apiUrl}/api/partner/me`);

            const res = await axios.get(`${apiUrl}/api/partner/me`, {
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
        const init = async () => {
            // Wait for Telegram to be ready if it's not yet
            if (!window.Telegram?.WebApp?.initData) {
                await new Promise(r => setTimeout(r, 500));
            }
            refreshUser();
        };
        init();
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
