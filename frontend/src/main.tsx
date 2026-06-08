import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initializeI18n } from './i18n'; // Initialize i18n
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ConfigProvider, useConfig } from './context/ConfigContext'
import { StartupProgressProvider } from './context/StartupProgressContext'
import { ThemeProvider } from './context/ThemeContext'
import { UserProvider } from './context/UserContext'
import { PerformanceProvider } from './hooks/usePerformance'
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

if (typeof window !== 'undefined' && (window as any).__APP_STARTUP__) {
    (window as any).__APP_STARTUP__.script_started = true;
}

console.log('[DEBUG] main.tsx: Startup execution beginning');

const startApp = async () => {
    try {
        const rootElement = document.getElementById('root');
        if (!rootElement) {
            throw new Error('Root element #root not found in document');
        }

        // i18n self-initializes at module load (i18n.ts:106) — do NOT await here.
        // Blocking on i18n before mounting React delays the loader appearing by 1-3s.
        // Critical namespaces are loaded asynchronously in the background.
        console.log('[DEBUG] main.tsx: Root element found, mounting React tree');

        ReactDOM.createRoot(rootElement).render(
            <ErrorBoundary>
                <QueryClientProvider client={queryClient}>
                    <StartupProgressProvider>
                        <ConfigProvider>
                            <PerformanceProvider>
                                <AppContextProviders>
                                    <ThemeProvider>
                                        <UserProvider>
                                            <App />
                                        </UserProvider>
                                    </ThemeProvider>
                                </AppContextProviders>
                            </PerformanceProvider>
                        </ConfigProvider>
                    </StartupProgressProvider>
                </QueryClientProvider>
            </ErrorBoundary>
        );

        if (typeof window !== 'undefined' && (window as any).__APP_STARTUP__) {
            (window as any).__APP_STARTUP__.react_rendered = true;
        }

        console.log('[DEBUG] main.tsx: ReactDOM.render called successfully');
    } catch (e) {
        console.error('[FATAL] main.tsx: Failed to initialize application:', e);
        // Attempt fallback UI if React mount fails completely
        const root = document.getElementById('root');
        if (root) {
            root.innerHTML = `<div style="padding: 20px; color: white; background: #0c0f1d; height: 100vh; font-family: sans-serif;">
                <h2 style="color: #ef4444;">System Error</h2>
                <p>P2P Hub failed to initialize. Please try reloading the app.</p>
                <button onclick="window.location.reload()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 8px;">Reload</button>
                <pre style="margin-top: 20px; font-size: 11px; opacity: 0.5;">${String(e)}</pre>
            </div>`;
        }
    }
};

startApp();

export function AppContextProviders({ children }: { children: React.ReactNode }) {
    const { config } = useConfig();
    const manifestUrl = config?.ton_manifest_url || "https://pintopay.life/tonconnect-manifest.json";

    React.useEffect(() => {
        const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || config?.sentry_dsn;
        if (SENTRY_DSN) {
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
