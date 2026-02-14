/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
// #comment: Added missing import for useStartupProgress to track initialization progress in the config context
import { useStartupProgress } from './StartupProgressContext';

interface PublicConfig {
    ton_manifest_url: string;
    payment_mode: string;
    admin_ton_address: string;
    admin_usdt_address: string;
    is_debug: boolean;
    sentry_dsn?: string;
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

    const { updateProgress } = useStartupProgress();

    useEffect(() => {
        const fetchConfig = async () => {
            updateProgress(20, 'Loading Configuration...');
            try {
                // Use a shorter timeout specifically for the public config to fail fast
                const response = await apiClient.get('/api/config/public', { timeout: 5000 });
                setConfig(response.data);
                updateProgress(40, 'Config Synced');
                setIsLoading(false);
            } catch (err) {
                console.error('[Config] Failed to fetch config, using fallbacks:', err);
                setError(err);
                // Fallback to defaults to prevent app crash
                setConfig({
                    ton_manifest_url: "https://p2phub-frontend-production.up.railway.app/tonconnect-manifest.json",
                    payment_mode: "ton_api",
                    admin_ton_address: "UQD_n02bdxQxFztKTXpWBaFDxo713qIuETyefIeK7wiUB0DN",
                    admin_usdt_address: "TFp4oZV3fUkMgxiZV9d5SkJTHrA7NYoHCM",
                    is_debug: false
                });
                updateProgress(40, 'Using Offline Config');
                setIsLoading(false);
            }
        };

        fetchConfig();
    }, [updateProgress]);

    const contextValue = React.useMemo(() => ({
        config,
        isLoading,
        error
    }), [config, isLoading, error]);

    return (
        <ConfigContext.Provider value={contextValue}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => useContext(ConfigContext);
