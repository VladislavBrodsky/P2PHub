import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { Header } from '../Header';
const ProfileDrawer = lazy(() => import('../ProfileDrawer')); // Lazy load
import BottomNav from '../BottomNav';
import { useUI } from '../../context/UIContext';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    prefetchPages?: Record<string, () => Promise<any>>;
}

export const Layout = ({ children, activeTab, setActiveTab, prefetchPages }: LayoutProps) => {
    const { isHeaderVisible, isFooterVisible } = useUI();
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
        <div className="selection:bg-blue-500/10 fixed inset-0 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
            {/* Staging Ribbon */}
            {isStaging && (
                <div className="fixed top-0 left-0 z-100 w-full bg-yellow-400 text-center text-xs font-bold text-slate-900 shadow-sm py-1">
                    🚧 STAGING ENVIRONMENT 🚧
                </div>
            )}

            {/* Subtle Depth Effects - Background remain fixed */}
            <div className="pointer-events-none fixed right-[-10%] top-[-20%] z-0 aspect-square w-[80%] rounded-full bg-slate-100/50 blur-[120px] dark:bg-slate-900/20" />
            <div className="pointer-events-none fixed bottom-[-10%] left-[-20%] z-0 aspect-square w-[60%] rounded-full bg-emerald-500/5 blur-[100px] dark:bg-emerald-500/10" />

            {/* Grainy Texture */}
            <div className="pointer-events-none fixed inset-0 z-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />

            {/* Header - Fixed at top, outside the scroll layer */}
            {isHeaderVisible && (
                <div className="relative z-100">
                    <Header onOpenMenu={() => setIsMenuOpen(true)} />
                </div>
            )}

            {/* Main Content Area - THE SCROLL LAYER */}
            <main
                className={`flex-1 overflow-x-hidden relative z-10 
                    ${activeTab === 'pro' ? 'overflow-hidden' : 'overflow-y-auto scroll-smooth [-webkit-overflow-scrolling:touch]'}
                    ${!isHeaderVisible ? '' : (isStaging ? 'staging-offset' : 'content-main-padding')}`}
            >
                <div className={`relative mx-auto w-full ${activeTab === 'pro' ? 'h-full max-w-none px-0' : 'max-w-lg px-4 safe-pb'}`}>
                    <div className={`mx-auto w-full ${activeTab === 'pro' ? 'h-full' : ''}`}>
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
            {isFooterVisible && (
                <div className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 flex-col items-center pointer-events-none pb-safe-bottom">
                    <div className="flex w-full justify-center pb-4 pointer-events-auto">
                        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} prefetchPages={prefetchPages} />
                    </div>
                </div>
            )}
        </div>
    );
};
