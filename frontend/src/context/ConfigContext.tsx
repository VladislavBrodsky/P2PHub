import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface PublicConfig {
    ton_manifest_url: string;
    payment_mode: string;
    admin_ton_address: string;
    admin_usdt_address: string;
    is_debug: boolean;
}

interface ConfigContextType {
    config: PublicConfig | null;
    isLoading: boolean;
    error: any;
}

const ConfigContext = createContext<ConfigContextType>({
    config: null,
    isLoading: true,
    error: null,
});

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<PublicConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await apiClient.get('/api/config/public');
                setConfig(response.data);
                setIsLoading(false);
            } catch (err) {
                console.error('[Config] Failed to fetch config:', err);
                setError(err);
                // Fallback to defaults to prevent app crash
                setConfig({
                    ton_manifest_url: "https://p2phub-frontend-production.up.railway.app/tonconnect-manifest.json",
                    payment_mode: "ton_api",
                    admin_ton_address: "UQD_n02bdxQxFztKTXpWBaFDxo713qIuETyefIeK7wiUB0DN",
                    admin_usdt_address: "TFp4oZV3fUkMgxiZV9d5SkJTHrA7NYoHCM",
                    is_debug: false
                });
                setIsLoading(false);
            }
        };

        fetchConfig();
    }, []);

    return (
        <ConfigContext.Provider value={{ config, isLoading, error }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => useContext(ConfigContext);
