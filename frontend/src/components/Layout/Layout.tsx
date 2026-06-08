import { useState, useEffect, lazy, Suspense, useCallback, useRef, useMemo } from 'react';
import { Header } from '../Header';
const ProfileDrawer = lazy(() => import('../ProfileDrawer')); // Lazy load
import BottomNav from '../BottomNav';
import { useUI } from '../../context/UIContext';
import {
    Home, CreditCard, Users, Zap, Trophy,
    Settings, LogOut, Wallet, HelpCircle, Headphones,
    Newspaper, Shield, ChevronUp, User, Check, Copy, Crown, Sun, Moon, Bell, BellOff
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { useTonConnectUI, useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import { AnimatePresence, motion } from 'framer-motion';
import { apiClient } from '../../api/client';
import { getXPProgress, getRankGradient, getRankTextColor } from '../../utils/ranking';
import { useNavigation } from '../../hooks/useNavigation';
import { ROUTES } from '../../utils/routes';
import { getSafeLaunchParams, isTMA } from '../../utils/tma';
import { getApiUrl } from '../../utils/api';

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
    const { t, i18n } = useTranslation('common');
    const { user, logout } = useUser();
    const { theme, setTheme } = useTheme();
    const [tonConnectUI] = useTonConnectUI();
    const wallet = useTonWallet();
    const friendlyAddress = useTonAddress();
    const { setSupportOpen } = useUI();
    const { navigateTo } = useNavigation();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLButtonElement>(null);
    const [copied, setCopied] = useState(false);
    const [disconnectConfirm, setDisconnectConfirm] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                profileRef.current && !profileRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const plan = (user?.subscription_plan || '').toLowerCase();
    const isProPlus = user?.is_pro_plus || plan.includes('plus');
    const isPro = user?.is_pro || plan.includes('pro');

    const tgPhotoUrl = useMemo(() => {
        try {
            const lp = getSafeLaunchParams();
            return (lp.initData as any)?.user?.photoUrl || null;
        } catch {
            return null;
        }
    }, []);

    const avatarSrc = useMemo(() => {
        if (tgPhotoUrl) return tgPhotoUrl;
        if (user?.photo_file_id) {
            const baseUrl = getApiUrl().replace(/\/$/, '');
            return `${baseUrl}/api/partner/photo/${user.photo_file_id}`;
        }
        if (user?.photo_url) return user.photo_url;
        return null;
    }, [tgPhotoUrl, user?.photo_file_id, user?.photo_url]);

    const formattedAddress = friendlyAddress
        ? `${friendlyAddress.slice(0, 4)}...${friendlyAddress.slice(-4)}`
        : '';

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLanguageChange = async (lang: string) => {
        try {
            const { blogService } = await import('../../services/blogService');
            blogService.clearCache();
        } catch (e) {
            console.warn(e);
        }
        i18n.changeLanguage(lang);
        try {
            await apiClient.post('/api/partner/language', { language_code: lang });
        } catch (error) {
            console.warn('Failed to sync language to backend:', error);
        }
    };

    return (
        <nav className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[72px] xl:w-56 z-50 border-r border-white/5 bg-[#030712]/80 backdrop-blur-xl pt-24 pb-6 px-3">
            {/* Logo mark at top */}
            <div className="hidden xl:flex items-center gap-3 px-2 mb-6">
                <img src="/logo.png?v=2" alt="Pintopay" className="w-8 h-8 object-contain rounded-lg shrink-0" />
                <span className="text-xs font-black uppercase tracking-widest vibing-crystal-text">Pintopay</span>
            </div>
            <div className="flex xl:hidden items-center justify-center mb-6">
                <img src="/logo.png?v=2" alt="Pintopay" className="w-8 h-8 object-contain rounded-lg" />
            </div>

            {/* Nav Menu Items */}
            <div className="flex flex-col gap-1">
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
            </div>

            {/* Profile Button at Bottom */}
            <div className="relative mt-auto pt-4 border-t border-white/5 flex flex-col">
                {/* User Level & XP Pill Badge (Always visible on expanded desktop sidebar) */}
                <div className="hidden xl:flex items-center justify-between gap-2 rounded-2xl border border-border-glass bg-slate-950/40 px-3.5 py-2 shadow-inner mb-3">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">{t('lvl')}</span>
                        <span className="text-sm font-black text-text-primary leading-none">{user?.level ?? 1}</span>
                        {user?.is_pro && (
                            <Crown className="size-4 text-amber-500 fill-amber-500/20" />
                        )}
                    </div>
                    <div className="h-4 w-px bg-border-glass" />
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-text-primary leading-none">
                            {Math.floor(user?.xp ?? 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">{t('xp')}</span>
                    </div>
                </div>

                <button
                    ref={profileRef}
                    onClick={() => setIsDropdownOpen(prev => !prev)}
                    className="flex items-center gap-3 w-full p-2 rounded-xl text-left hover:bg-white/5 transition-all duration-200 cursor-pointer"
                >
                    {/* Avatar Container */}
                    <div className="relative shrink-0 mx-auto xl:mx-0">
                        <div className={`
                            w-10 h-10 rounded-xl overflow-hidden border relative z-10 bg-bg-app flex items-center justify-center
                            ${isProPlus ? 'border-cyan-400/60 ring-2 ring-blue-500/20' : isPro ? 'border-amber-400/60 ring-1 ring-amber-500/10' : 'border-border-glass'}
                        `}>
                            {avatarSrc ? (
                                <img
                                    src={avatarSrc}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-5 h-5 text-slate-400" />
                            )}
                        </div>
                        
                        {/* Tiny Level Badge overlay for collapsed mode */}
                        <div className="xl:hidden absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-lg bg-blue-500 text-white shadow-premium ring-2 ring-bg-app z-20">
                            <span className="text-[9px] font-bold">{user?.level || 1}</span>
                        </div>
                    </div>

                    {/* User details (Visible only in expanded mode) */}
                    <div className="hidden xl:flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-bold text-text-primary truncate">
                            {user?.first_name || 'Partner'}
                        </span>
                        <span className={`text-[10px] font-semibold tracking-wide uppercase ${getRankTextColor(user?.level || 1)}`}>
                            LVL {user?.level || 1}
                        </span>
                    </div>

                    {/* Chevron (Visible only in expanded mode) */}
                    <ChevronUp className="hidden xl:block w-4 h-4 text-slate-400 shrink-0 ml-auto" />
                </button>

                {/* Settings Popover Dropdown */}
                <AnimatePresence>
                    {isDropdownOpen && (
                        <motion.div
                            ref={dropdownRef}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-14 left-0 xl:left-52 w-80 rounded-3xl border border-border-glass bg-bg-glass backdrop-blur-xl shadow-premium-lg p-5 flex flex-col gap-4 text-text-primary z-120"
                            style={{ pointerEvents: 'auto' }}
                        >
                            {/* User Header */}
                            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                                <div className={`
                                    w-12 h-12 rounded-xl overflow-hidden border relative bg-bg-app flex items-center justify-center shrink-0
                                    ${isProPlus ? 'border-cyan-400/60 ring-2 ring-blue-500/20' : isPro ? 'border-amber-400/60 ring-1 ring-amber-500/10' : 'border-border-glass'}
                                `}>
                                    {avatarSrc ? (
                                        <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-6 h-6 text-slate-400" />
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-black text-text-primary truncate">
                                        {user?.first_name} {user?.last_name}
                                    </span>
                                    <span className="text-[10px] font-bold text-text-secondary">
                                        {isProPlus ? 'PRO+ Subscriber' : isPro ? 'PRO Subscriber' : 'Standard Partner'}
                                    </span>
                                </div>
                            </div>

                            {/* User Level & XP Pill Badge */}
                            <div className="flex items-center justify-between gap-2 rounded-2xl border border-border-glass bg-slate-950/40 px-3.5 py-2 shadow-inner">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">{t('lvl')}</span>
                                    <span className="text-sm font-black text-text-primary leading-none">{user?.level ?? 1}</span>
                                    {user?.is_pro && (
                                        <Crown className="size-4 text-amber-500 fill-amber-500/20" />
                                    )}
                                </div>
                                <div className="h-4 w-px bg-border-glass" />
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-black text-text-primary leading-none">
                                        {Math.floor(user?.xp ?? 0).toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">{t('xp')}</span>
                                </div>
                            </div>

                            {/* XP Progress Bar */}
                            {(() => {
                                const stats = user || { level: 1, xp: 0 };
                                const xpProgress = getXPProgress(stats.level || 1, stats.xp || 0);
                                return (
                                    <div className="w-full space-y-1 bg-slate-950/20 p-2.5 rounded-2xl border border-white/5">
                                        <div className="flex justify-between items-baseline px-0.5 text-[9px] font-bold text-text-secondary uppercase tracking-wider">
                                            <span>{xpProgress.current.toLocaleString()} / {xpProgress.total.toLocaleString()} XP</span>
                                            <span>{Math.round(xpProgress.percent)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-900/10 dark:bg-white/5 rounded-full overflow-hidden p-0.5 border border-black/5 dark:border-white/5 relative">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${xpProgress.percent}%` }}
                                                transition={{ duration: 1, ease: 'circOut' }}
                                                className={`h-full rounded-full progress-bar-liquid bg-linear-to-r ${getRankGradient(stats.level || 1)}`}
                                            />
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* TON Connect Wallet */}
                            <div className="w-full">
                                {wallet ? (
                                    <div className="flex items-center justify-between p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 rounded-lg bg-emerald-500/20">
                                                <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-[7px] font-bold uppercase tracking-widest text-emerald-400">
                                                    {t('wallet')}
                                                </div>
                                                <div className="font-bold text-xs text-text-primary">
                                                    {formattedAddress}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleCopy(friendlyAddress)}
                                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                                                title="Copy Address"
                                            >
                                                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (disconnectConfirm) {
                                                        tonConnectUI.disconnect();
                                                        setDisconnectConfirm(false);
                                                    } else {
                                                        setDisconnectConfirm(true);
                                                    }
                                                }}
                                                className={`p-1.5 rounded-lg text-xs font-bold uppercase transition-all duration-200
                                                    ${disconnectConfirm
                                                        ? 'bg-red-500 text-white hover:bg-red-600 px-2'
                                                        : 'bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-slate-300'}`}
                                            >
                                                {disconnectConfirm ? 'Confirm' : 'Disconnect'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => tonConnectUI.openModal()}
                                        className="w-full flex items-center justify-center gap-2 rounded-2xl py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-md shadow-blue-500/10"
                                    >
                                        <Wallet className="h-3.5 w-3.5" />
                                        {t('connect_wallet')}
                                    </button>
                                )}
                            </div>

                            {/* Preferences Selector */}
                            <div className="grid grid-cols-2 gap-2">
                                {/* Language Selector */}
                                <div className="flex items-center justify-between p-1 rounded-xl bg-slate-950/20 border border-white/5">
                                    {[
                                        { id: 'en', flag: '🇺🇸' },
                                        { id: 'ru', flag: '🇷🇺' }
                                    ].map((option) => {
                                        const isActive = i18n.language.startsWith(option.id);
                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => handleLanguageChange(option.id)}
                                                className={`flex-1 flex items-center justify-center py-1 rounded-lg text-xs font-bold transition-all
                                                    ${isActive ? 'bg-white/10 text-text-primary shadow-sm' : 'text-slate-400 hover:text-text-primary'}`}
                                            >
                                                <span className="text-sm mr-1">{option.flag}</span>
                                                <span className="uppercase text-[9px] tracking-wider">{option.id}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Theme Selector */}
                                <div className="flex items-center justify-between p-1 rounded-xl bg-slate-950/20 border border-white/5">
                                    {[
                                        { id: 'light' as const, icon: Sun },
                                        { id: 'dark' as const, icon: Moon }
                                    ].map((option) => {
                                        const isActive = theme === option.id;
                                        const Icon = option.icon;
                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => setTheme(option.id)}
                                                className={`flex-1 flex items-center justify-center py-1 rounded-lg text-xs font-bold transition-all
                                                    ${isActive ? 'bg-white/10 text-text-primary shadow-sm' : 'text-slate-400 hover:text-text-primary'}`}
                                            >
                                                <Icon className="w-3.5 h-3.5" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Action Menu List */}
                            <div className="flex flex-col gap-1 border-t border-white/5 pt-3">
                                {/* Admin Portal */}
                                {(user?.is_admin || (user?.username && ['uslincoln', 'uslincon'].includes(user.username.toLowerCase()))) && (
                                    <button
                                        onClick={() => { navigateTo(ROUTES.ADMIN); setIsDropdownOpen(false); }}
                                        className="flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-blue-500/5 hover:text-blue-400 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                        <Shield className="w-4 h-4" />
                                        {t('navigation.admin_panel')}
                                    </button>
                                )}

                                {/* PRO Panel */}
                                {user?.is_pro && (
                                    <button
                                        onClick={() => { navigateTo(ROUTES.PRO); setIsDropdownOpen(false); }}
                                        className="flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-amber-500/5 hover:text-amber-400 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                        <Zap className="w-4 h-4 text-amber-500" />
                                        {t('navigation.pro_panel')}
                                    </button>
                                )}

                                {/* Blog */}
                                <button
                                    onClick={() => { navigateTo(ROUTES.BLOG); setIsDropdownOpen(false); }}
                                    className="flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-white/5 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                    <Newspaper className="w-4 h-4" />
                                    {t('navigation.blog')}
                                </button>

                                {/* FAQ */}
                                <button
                                    onClick={() => { navigateTo(ROUTES.FAQ); setIsDropdownOpen(false); }}
                                    className="flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-white/5 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                    <HelpCircle className="w-4 h-4" />
                                    {t('navigation.faq')}
                                </button>

                                {/* Support */}
                                <button
                                    onClick={() => { setSupportOpen(true); setIsDropdownOpen(false); }}
                                    className="flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-white/5 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                    <Headphones className="w-4 h-4" />
                                    {t('navigation.support')}
                                </button>

                                {/* Log Out */}
                                <button
                                    onClick={() => { logout(); setIsDropdownOpen(false); }}
                                    className="flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-red-500/5 text-red-400 font-bold text-xs uppercase tracking-wider transition-colors mt-2 cursor-pointer"
                                >
                                    <LogOut className="w-4 h-4" />
                                    {t('navigation.logout')}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
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
                        paddingTop: !isHeaderVisible ? '0px' : 'var(--main-content-pt, var(--dynamic-header-offset, var(--header-total-offset, 8.625rem)))'
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
