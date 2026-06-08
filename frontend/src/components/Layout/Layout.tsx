import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { Header } from '../Header';
const ProfileDrawer = lazy(() => import('../ProfileDrawer')); // Lazy load
import BottomNav from '../BottomNav';
import { useUI } from '../../context/UIContext';
import { Home, CreditCard, Users, Zap, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// #comment: Layout.tsx - Central structural wrapper for the application.
// Mobile (< lg): Phone-column layout with bottom tab bar (Telegram Mini App style).
// Desktop (≥ lg): Full-width layout with a premium fixed left sidebar navigation.

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    prefetchPages?: Record<string, () => Promise<any>>;
}

// ─── Desktop Sidebar Nav ─────────────────────────────────────────────────────
function SidebarNav({
    activeTab,
    setActiveTab,
    prefetchPages,
}: {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    prefetchPages?: Record<string, () => Promise<any>>;
}) {
    const { t } = useTranslation('common');

    const prefetch = (tab: string) => {
        if (prefetchPages?.[tab]) prefetchPages[tab]();
    };

    const navItems = [
        { id: 'home',    icon: Home,       label: t('navigation.home') },
        { id: 'cards',   icon: CreditCard, label: t('navigation.cards') },
        { id: 'partner', icon: Users,      label: t('navigation.partner') },
        { id: 'league',  icon: Trophy,     label: t('navigation.league') },
        { id: 'earn',    icon: Zap,        label: t('navigation.earn') },
    ];

    return (
        <nav className="hidden lg:flex flex-col gap-1 fixed left-0 top-0 bottom-0 w-[72px] xl:w-56 z-50 border-r border-white/5 bg-[#030712]/80 backdrop-blur-xl pt-24 pb-6 px-3">
            {/* Logo mark at top */}
            <div className="hidden xl:flex items-center gap-3 px-2 mb-6">
                <img src="/logo.png?v=2" alt="Pintopay" className="w-8 h-8 object-contain rounded-lg shrink-0" />
                <span className="text-xs font-black uppercase tracking-widest vibing-crystal-text">Pintopay</span>
            </div>
            <div className="flex xl:hidden items-center justify-center mb-6">
                <img src="/logo.png?v=2" alt="Pintopay" className="w-8 h-8 object-contain rounded-lg" />
            </div>

            {navItems.map(({ id, icon: Icon, label }) => {
                const isActive = activeTab === id;
                return (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        onMouseEnter={() => prefetch(id)}
                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer w-full
                            ${isActive
                                ? 'vibing-blue-animated text-white shadow-md shadow-blue-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Icon className="w-[18px] h-[18px] shrink-0" />
                        <span className="hidden xl:block text-[11px] font-extrabold uppercase tracking-widest whitespace-nowrap">{label}</span>
                    </button>
                );
            })}
        </nav>
    );
}

// ─── Layout Shell ─────────────────────────────────────────────────────────────
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
        <div className="fixed inset-0 flex flex-col items-center justify-start bg-transparent premium-desktop-layout selection:bg-blue-500/10 overflow-hidden">
            {/* ── Desktop sidebar (hidden on mobile) ── */}
            <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} prefetchPages={prefetchPages} />

            {/* ── Main Content Hub ── */}
            {/* Mobile: centered max-w-lg phone column | Desktop: full-width shifted right of sidebar */}
            <div className={`relative flex flex-col h-full w-full overflow-hidden transition-all
                max-w-lg
                lg:max-w-none lg:pl-[72px] xl:pl-56
            `}>
                {/* Staging Ribbon */}
                {isStaging && (
                    <div className="fixed top-0 left-0 z-200 w-full bg-yellow-400 text-center text-xs font-bold text-slate-900 shadow-sm py-1">
                        🚧 STAGING ENVIRONMENT 🚧
                    </div>
                )}

                {/* 1. Header */}
                {isHeaderVisible && (
                    <Header onOpenMenu={() => setIsMenuOpen(true)} />
                )}

                {/* 2. Main content area (Scrollable) */}
                <main
                    id="main-scroll-root"
                    className="flex-1 overflow-x-hidden relative z-10 overflow-y-auto scroll-smooth [-webkit-overflow-scrolling:touch] no-scrollbar pb-[calc(var(--bottom-nav-height,4.375rem)+var(--spacing-safe-bottom,1.5rem)+1.25rem)] lg:pb-8"
                    style={{
                        overscrollBehaviorY: 'none',
                        paddingTop: !isHeaderVisible ? '0px' : 'var(--dynamic-header-offset, var(--header-total-offset, 8.625rem))'
                    }}
                >
                    <div className={`relative mx-auto w-full ${activeTab === 'pro' ? 'max-w-none px-0' : 'max-w-lg lg:max-w-none lg:px-8 xl:px-12 px-4'}`}>
                        <div className="mx-auto w-full">
                            {children}
                        </div>
                    </div>
                </main>

                {/* 3. Bottom Navigation Bar (mobile only — hidden on desktop) */}
                {(isFooterVisible && !isKeyboardOpen) && (
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-120 flex w-full flex-col items-center pointer-events-none">
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
