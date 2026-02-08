import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './i18n'; // Initialize i18n
// import { init, miniApp, viewport } from '@telegram-apps/sdk'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
            gcTime: 10 * 60 * 1000,   // Cache is kept for 10 minutes
            refetchOnWindowFocus: false, // Prevent background refetching which can cause stutter
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

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </React.StrictMode>,
)
