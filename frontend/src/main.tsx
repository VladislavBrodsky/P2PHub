import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './i18n'; // Initialize i18n
// Telegram SDK initialization is handled in App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 10 * 60 * 1000, // Data is fresh for 10 minutes
            gcTime: 30 * 60 * 1000,   // Cache is kept for 30 minutes
            refetchOnWindowFocus: false, // Prevent background refetching which can cause stutter
            refetchOnMount: false,    // Use cache on mount if not stale
            retry: 1,
        },
    },
})

// Telegram SDK initialization is handled in App.tsx component
// or via the React wrapper. We avoid direct import of '@telegram-apps/sdk'
// here because it is not in package.json, causing a crash.

/*
// Initialize Telegram SDK
try {
    // init() logic removed
} catch (e) {
    console.warn('Telegram SDK init failed:', e)
}
*/

import { ErrorBoundary } from './components/ErrorBoundary'
import { ConfigProvider } from './context/ConfigContext'
import { StartupProgressProvider } from './context/StartupProgressContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
            <StartupProgressProvider>
                <ConfigProvider>
                    <App />
                </ConfigProvider>
            </StartupProgressProvider>
        </QueryClientProvider>
    </ErrorBoundary>,
)
