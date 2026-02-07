import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
// import { init, miniApp, viewport } from '@telegram-apps/sdk'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

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
