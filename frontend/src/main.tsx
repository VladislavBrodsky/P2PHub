import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './i18n'; // Initialize i18n
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ConfigProvider, useConfig } from './context/ConfigContext'
import { StartupProgressProvider } from './context/StartupProgressContext'
import { ThemeProvider } from './context/ThemeContext'
import { UserProvider } from './context/UserContext'
import { TonConnectUIProvider } from '@tonconnect/ui-react';

// #comment: Performance Optimization - Deferred Sentry Loading
// Initializing Sentry and its heavy integrations (Replay, Tracing) 
// after the main hydration to avoid blocking the main thread during startup.
const initSentry = async (dsn: string, isDebug: boolean) => {
    const Sentry = await import("@sentry/react");
    Sentry.init({
        dsn,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
            }),
        ],
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        environment: isDebug ? 'development' : 'production',
    });
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 10 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            retry: 1,
        },
    },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
            <StartupProgressProvider>
                <ConfigProvider>
                    <AppContextProviders>
                        <ThemeProvider>
                            <UserProvider>
                                <App />
                            </UserProvider>
                        </ThemeProvider>
                    </AppContextProviders>
                </ConfigProvider>
            </StartupProgressProvider>
        </QueryClientProvider>
    </ErrorBoundary>,
)

export function AppContextProviders({ children }: { children: React.ReactNode }) {
    const { config } = useConfig();
    const manifestUrl = config?.ton_manifest_url || "https://p2phub-frontend-production.up.railway.app/tonconnect-manifest.json";

    React.useEffect(() => {
        const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || config?.sentry_dsn;
        if (SENTRY_DSN) {
            // Delay Sentry initialization by 3 seconds to ensure hydration and first paint are complete
            const timer = setTimeout(() => {
                initSentry(SENTRY_DSN, !!config?.is_debug);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [config]);

    return (
        <TonConnectUIProvider manifestUrl={manifestUrl}>
            {children}
        </TonConnectUIProvider>
    );
}
