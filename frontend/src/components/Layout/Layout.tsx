import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Header } from '../Header';
const ProfileDrawer = lazy(() => import('../ProfileDrawer')); // Lazy load
import BottomNav from '../BottomNav';
import { useUI } from '../../context/UIContext';

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
        <div className="selection:bg-blue-500/10 fixed top-0 bottom-0 left-1/2 -translate-x-1/2 flex flex-col h-dvh min-h-dvh w-full max-w-lg overflow-hidden bg-bg-app text-text-primary sm:border-x sm:border-border-glass sm:shadow-premium-xl">


            {/* Staging Ribbon */}
            {isStaging && (
                <div className="fixed top-0 left-0 z-100 w-full bg-yellow-400 text-center text-xs font-bold text-slate-900 shadow-sm py-1">
                    🚧 STAGING ENVIRONMENT 🚧
                </div>
            )}

            {/* Subtle Depth Effects - Consolidate global background orbs here */}
            <div className="pointer-events-none fixed right-[-10%] top-[-20%] z-0 aspect-square w-[80%] rounded-full blur-[120px]" style={{ backgroundColor: 'color-mix(in srgb, var(--color-bg-app) 95%, var(--color-brand-primary) 5%)' }} />
            <div className="pointer-events-none fixed bottom-[-10%] left-[-20%] z-0 aspect-square w-[60%] rounded-full bg-blue-500/5 blur-[100px]" />
            <div className="pointer-events-none fixed top-[40%] left-[-10%] z-0 aspect-square w-[40%] rounded-full bg-indigo-500/5 blur-[120px] dark:opacity-40" />

            {/* Mesh Background Overlay - Constant across pages for unity */}
            <div className="mesh-gradient-dark fixed inset-0 opacity-20 pointer-events-none dark:block hidden z-0" />

            {/* Grainy Texture */}
            <div className="pointer-events-none fixed inset-0 z-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />



            {/* Header - Fixed above the scroll layer */}
            {isHeaderVisible && (
                <div className="relative z-100">
                    <Header onOpenMenu={() => setIsMenuOpen(true)} />
                </div>
            )}

            {/* Main Content Area - THE SCROLL LAYER */}
            <main
                id="main-scroll-root"
                className="flex-1 overflow-x-hidden relative z-10 overflow-y-auto scroll-smooth [-webkit-overflow-scrolling:touch]"
                style={{
                    overscrollBehaviorY: 'none',
                    paddingTop: !isHeaderVisible ? '0px' : (isStaging ? 'calc(var(--header-total-height, 146px) + 40px)' : 'calc(var(--header-total-height, 146px) + 24px)')
                }}
            >
                <div
                    className={`relative mx-auto w-full ${activeTab === 'pro' ? 'max-w-none px-0' : 'max-w-lg px-4'}`}
                    style={{ paddingBottom: 'calc(var(--spacing-safe-bottom, 20px) + 320px)' }}
                >
                    {/* #comment: AnimatePresence removed here because App.tsx handles transition visibility.
                        Maintaining component state is critical for Smooth tab switching. */}
                    <div className="mx-auto w-full">
                        {children}
                    </div>
                </div>
            </main>

            {/* Side Menu / Profile Drawer - Portaled out, lazily loaded */}
            {hasOpened && (
                <Suspense fallback={null}>
                    <ProfileDrawer
                        isOpen={isMenuOpen}
                        onClose={handleCloseMenu}
                        activeTab={activeTab}
                    />
                </Suspense>
            )}

            {/* Integrated Footer Stack */}
            {(isFooterVisible && !isKeyboardOpen) && (
                <div className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 flex-col items-center pointer-events-none pb-safe-bottom">
                    <div className="flex w-full justify-center pb-4 pointer-events-auto">
                        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} prefetchPages={prefetchPages} />
                    </div>
                </div>
            )}
        </div>
    );
};
