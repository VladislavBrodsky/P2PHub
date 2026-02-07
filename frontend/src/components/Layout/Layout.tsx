import { useState, useEffect } from 'react';
import { Header } from '../Header';
import ProfileDrawer from '../ProfileDrawer';
import BottomNav from '../BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { backButton } from '@telegram-apps/sdk-react';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const Layout = ({ children, activeTab, setActiveTab }: LayoutProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Handle Back Button for Drawer
    useEffect(() => {
        let cleanup: VoidFunction | undefined;
        try {
            if (isMenuOpen) {
                backButton.show();
                cleanup = backButton.onClick(() => setIsMenuOpen(false));
            } else if (activeTab === 'home') {
                backButton.hide();
            }
        } catch (e) {
            // Ignore SDK errors in non-Telegram environment
            console.warn('BackButton not available:', e);
        }
        return () => {
            if (cleanup) cleanup();
        };
    }, [isMenuOpen, activeTab]);

    const isStaging = import.meta.env.VITE_APP_ENV === 'staging';

    return (
        <div className="selection:bg-brand-blue/10 relative min-h-dvh overflow-x-hidden bg-[var(--color-bg-app)] text-[var(--color-text-primary)]">
            {/* Staging Ribbon */}
            {isStaging && (
                <div className="fixed top-0 left-0 z-[100] w-full bg-yellow-400 text-center text-xs font-bold text-slate-900 shadow-sm py-1">
                    🚧 STAGING ENVIRONMENT 🚧
                </div>
            )}

            {/* Subtle Depth Effects - Full Width */}
            <div className="pointer-events-none fixed right-[-10%] top-[-20%] z-0 aspect-square w-[80%] rounded-full bg-slate-100/50 blur-[120px] dark:bg-slate-900/20" />
            <div className="pointer-events-none fixed bottom-[-10%] left-[-20%] z-0 aspect-square w-[60%] rounded-full bg-emerald-500/5 blur-[100px] dark:bg-emerald-500/10" />

            {/* Grainy Texture for Premium Feel - Full Width */}
            <div className="pointer-events-none fixed inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />

            {/* Centered Mobile Container */}
            <div className="relative mx-auto w-full max-w-lg">
                {/* Header */}
                <div className={`relative z-50 ${isStaging ? 'mt-6' : ''}`}>
                    <Header onOpenMenu={() => setIsMenuOpen(true)} />
                </div>

                {/* Side Menu / Profile Drawer */}
                <ProfileDrawer
                    isOpen={isMenuOpen}
                    onClose={() => setIsMenuOpen(false)}
                />

                {/* Main Content Area */}
                <main
                    className={`safe-pb relative z-10 px-4 ${isStaging ? 'staging-offset' : 'content-main-padding'}`}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mx-auto w-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>

                {/* Integrated Footer Stack */}
                <div className="pb-safe-bottom fixed bottom-0 left-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 flex-col items-center pointer-events-none">
                    <div className="flex w-full justify-center pb-4 pointer-events-auto">
                        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
                    </div>
                </div>
            </div>
        </div>
    );
};
