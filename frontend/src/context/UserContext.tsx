import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';

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
            let initDataRaw = '';
            try {
                // Try SDK retrieveLaunchParams first
                const lp = retrieveLaunchParams();
                initDataRaw = lp.initDataRaw || '';
            } catch (e) {
                // Fallback to window.Telegram
                initDataRaw = window.Telegram?.WebApp?.initData || '';
            }

            const PROD_URL = 'https://p2phub-backend-production.up.railway.app';
            const apiUrl = import.meta.env.VITE_API_URL || PROD_URL;
            console.log('[DEBUG] refreshUser: Fetching from:', apiUrl);

            const res = await axios.get(`${apiUrl}/api/partner/me`, {
                headers: {
                    'X-Telegram-Init-Data': initDataRaw
                },
                timeout: 5000 // Add timeout to avoid hanging
            });
            console.log('[DEBUG] refreshUser: Success:', res.data.first_name);
            setUser(res.data);
        } catch (error) {
            console.error('[DEBUG] refreshUser: Failed:', error);
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
            // More aggressive waiting for Telegram environment
            let attempts = 0;
            while (attempts < 5 && !window.Telegram?.WebApp?.initData) {
                console.log('[DEBUG] Waiting for Telegram initData...', attempts);
                await new Promise(r => setTimeout(r, 500));
                attempts++;
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
