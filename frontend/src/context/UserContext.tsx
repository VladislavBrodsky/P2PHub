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
    xp: number;
    referral_code: string;
    referrals: any[]; // Extended for Earn Hub
}

interface UserContextType {
    user: User | null;
    isLoading: boolean;
    refreshUser: () => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const updateUser = (updates: Partial<User>) => {
        setUser(prev => prev ? { ...prev, ...updates } : null);
    };

    const refreshUser = async () => {
        let tgUser: any = null;
        try {
            // Use SDK to get initData more reliably
            const lp = retrieveLaunchParams();
            tgUser = lp.initData?.user;
            const initDataRaw = lp.initDataRaw || '';

            const PROD_URL = 'https://p2phub-backend-production.up.railway.app';
            const apiUrl = import.meta.env.VITE_API_URL || PROD_URL;
            console.log('[DEBUG] refreshUser: Fetching from:', apiUrl);

            const res = await axios.get(`${apiUrl}/api/partner/me`, {
                headers: {
                    'X-Telegram-Init-Data': initDataRaw
                },
                timeout: 5000
            });

            const userData = res.data;

            // Enrich with Telegram SDK data if backend is missing details
            if (tgUser) {
                if (!userData.photo_url && tgUser.photoUrl) userData.photo_url = tgUser.photoUrl;
                if (!userData.first_name && tgUser.firstName) userData.first_name = tgUser.firstName;
                if (!userData.last_name && tgUser.lastName) userData.last_name = tgUser.lastName;
            }

            console.log('[DEBUG] refreshUser: Success:', userData.first_name);
            setUser(userData);
        } catch (error) {
            console.error('[DEBUG] refreshUser: Failed:', error);
            // Fallback mock for local development if backend fails or initData is missing
            // Fallback: If backend fails, use Telegram SDK data for UI personalization (Optimistic UI)
            if (tgUser) {
                console.log('[DEBUG] refreshUser: Backend failed, using Telegram SDK data for UI');
                setUser({
                    id: tgUser.id,
                    telegram_id: String(tgUser.id),
                    username: tgUser.username || null,
                    first_name: tgUser.firstName,
                    last_name: tgUser.lastName || null,
                    photo_url: tgUser.photoUrl || null,
                    balance: 0, // Default for offline/unverified state
                    level: 1,
                    xp: 0,
                    referral_code: 'UNVERIFIED',
                    referrals: []
                });
            } else if (!user) {
                // Only use "Partner Dev" if NO Telegram data is available (e.g. browser testing)
                setUser({
                    id: 0,
                    telegram_id: '0',
                    username: 'partner',
                    first_name: 'Partner',
                    last_name: 'Dev',
                    photo_url: null,
                    balance: 0,
                    level: 1,
                    xp: 0,
                    referral_code: 'P2P-DEV',
                    referrals: []
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            // Fast path for local development
            if (import.meta.env.DEV && !window.Telegram?.WebApp?.initData) {
                console.log('[DEBUG] Dev mode detected, mocking user immediately');
                setUser({
                    id: 999,
                    telegram_id: '123456789',
                    username: 'dev_partner',
                    first_name: 'Dev',
                    last_name: 'User',
                    photo_url: null,
                    balance: 5000,
                    level: 5,
                    xp: 150,
                    referral_code: 'DEV-TEST',
                    referrals: [] // Mock referrals
                });
                setIsLoading(false);
                return;
            }

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
        <UserContext.Provider value={{ user, isLoading, refreshUser, updateUser }}>
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
