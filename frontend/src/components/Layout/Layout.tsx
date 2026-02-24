import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { Header } from '../Header';
const ProfileDrawer = lazy(() => import('../ProfileDrawer')); // Lazy load
import BottomNav from '../BottomNav';
import { useUI } from '../../context/UIContext';
import { cn } from '../../lib/utils';

// #comment: Layout.tsx - Central structural wrapper for the application.
// This version uses a fixed inset container with a transparent main scroll layer.
// Updated to support standard Tailwind v4 color tokens and persistent tab state.

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    prefetchPages?: Record<string, () => Promise<any>>;
}

export const Layout = ({ children, activeTab, setActiveTab, prefetchPages }: LayoutProps) => {
    const { isHeaderVisible, isFooterVisible, isKeyboardOpen } = useUI();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [hasOpened, setHasOpened] = useState(false);

    useEffect(() => {
        if (isMenuOpen && !hasOpened) {
            setHasOpened(true);
        }
    }, [isMenuOpen, hasOpened]);

    // Scroll Reset on Tab Change
    useEffect(() => {
        if (!isMenuOpen) {
            const mainElement = document.querySelector('main');
            if (mainElement) {
                mainElement.scrollTop = 0;
            }
        }
    }, [isMenuOpen, activeTab]);

    const isStaging = import.meta.env.VITE_APP_ENV === 'staging';

    useEffect(() => {
        const handleNav = (e: any) => {
            if (e.detail) setActiveTab(e.detail);
        };
        window.addEventListener('nav-tab', handleNav);
        return () => window.removeEventListener('nav-tab', handleNav);
    }, [setActiveTab]);

    const handleCloseMenu = useCallback(() => setIsMenuOpen(false), []);

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-start bg-transparent selection:bg-blue-500/10 overflow-hidden">
            {/* Main Content Hub - Precisely centered Max-W container */}
            <div className="relative flex flex-col h-full w-full max-w-lg bg-transparent sm:border-x sm:border-border-glass sm:shadow-premium-xl overflow-hidden">
                {/* Staging Ribbon */}
                {isStaging && (
                    <div className="fixed top-0 left-0 z-200 w-full bg-yellow-400 text-center text-xs font-bold text-slate-900 shadow-sm py-1">
                        🚧 STAGING ENVIRONMENT 🚧
                    </div>
                )}


                {/* 1. Header (Fixed relative to viewport within main container) */}
                {isHeaderVisible && (
                    <Header onOpenMenu={() => setIsMenuOpen(true)} />
                )}

                {/* 2. Main content area (Scrollable) */}
                <main
                    id="main-scroll-root"
                    className="flex-1 overflow-x-hidden relative z-10 overflow-y-auto scroll-smooth [-webkit-overflow-scrolling:touch] no-scrollbar"
                    style={{
                        overscrollBehaviorY: 'none',
                        paddingTop: !isHeaderVisible ? '0px' : (activeTab === 'pro' || activeTab === 'partner') ? '138px' : 'var(--header-total-height, 160px)',
                        paddingBottom: 'calc(var(--bottom-nav-height, 80px) + var(--spacing-safe-bottom, 24px) + 20px)'
                    }}
                >
                    <div className={`relative mx-auto w-full ${activeTab === 'pro' ? 'max-w-none px-0' : 'max-w-lg px-4'}`}>
                        <div className="mx-auto w-full">
                            {children}
                        </div>
                    </div>
                </main>

                {/* 3. Navigation Bar (Pinned to bottom) */}
                {(isFooterVisible && !isKeyboardOpen) && (
                    <div className="fixed bottom-0 left-0 right-0 z-120 flex w-full flex-col items-center pointer-events-none">
                        <div className="w-full max-w-lg flex justify-center pb-safe-bottom" style={{ paddingBottom: 'var(--spacing-safe-bottom, 24px)' }}>
                            <div className="flex w-full justify-center pb-4 pointer-events-auto">
                                <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} prefetchPages={prefetchPages} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Side Menu / Profile Drawer */}
                {hasOpened && (
                    <Suspense fallback={null}>
                        <ProfileDrawer
                            isOpen={isMenuOpen}
                            onClose={handleCloseMenu}
                            activeTab={activeTab}
                        />
                    </Suspense>
                )}
            </div>
        </div>
    );
};
