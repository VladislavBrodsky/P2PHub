import { useState, useEffect, lazy, Suspense, useCallback, useRef, useMemo } from 'react';
import { Header } from '../Header';
const ProfileDrawer = lazy(() => import('../ProfileDrawer')); // Lazy load
import BottomNav from '../BottomNav';
import { useUI } from '../../context/UIContext';
import {
    Home, CreditCard, Users, Zap, Trophy,
    Settings, LogOut, Wallet, HelpCircle, Headphones,
    Newspaper, Shield, ChevronUp, ChevronRight, User, Check, Copy, Crown, Sun, Moon, Bell, BellOff
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
import { PersonalizationCard } from '../PersonalizationCard';

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
        { id: 'blog',    icon: Newspaper,  label: t('navigation.blog') },
        { id: 'faq',     icon: HelpCircle, label: t('navigation.faq') },
        { id: 'support', icon: Headphones, label: t('navigation.support') },
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
                        <div key={id} className="w-full">
                            {id === 'blog' && (
                                <div className="my-2 border-t border-white/5 w-full" />
                            )}
                            <button
                                onClick={() => {
                                    if (id === 'support') {
                                        setSupportOpen(true);
                                    } else {
                                        setActiveTab(id);
                                    }
                                }}
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
                        </div>
                    );
                })}
            </div>

            {/* Profile Button at Bottom */}
            <div className="relative mt-auto pt-4 border-t border-white/5 flex flex-col">
                {/* User Level & XP Badge (Always visible on expanded desktop sidebar) */}
                <div className="hidden xl:flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-1.5 shadow-sm mb-3">
                    <div className="flex items-center gap-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-blue-400">{t('lvl')}</span>
                        <span className="text-xs font-bold text-text-primary">{user?.level ?? 1}</span>
                        {user?.is_pro && (
                            <Crown className="size-3 text-amber-500 fill-amber-500/20" />
                        )}
                    </div>
                    <div className="h-3 w-px bg-white/10" />
                    <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-text-primary">
                            {Math.floor(user?.xp ?? 0).toLocaleString()}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">{t('xp')}</span>
                    </div>
                </div>

                <button
                    ref={profileRef}
                    onClick={() => setIsDropdownOpen(prev => !prev)}
                    className="flex items-center gap-3 w-full p-2 rounded-xl text-left hover:bg-white/5 transition-all duration-200 cursor-pointer outline-none focus:outline-none"
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
                            {user?.first_name ? user.first_name.split('|')[0].trim() : 'Partner'}
                        </span>
                        <span className="text-[10px] font-semibold tracking-wide uppercase text-slate-400">
                            {isProPlus ? 'PRO+' : isPro ? 'PRO' : 'Partner'}
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
                            initial={{ opacity: 0, scale: 0.95, x: -10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95, x: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-0 left-[76px] xl:left-[232px] w-80 rounded-3xl border border-white/10 dark:border-white/10 bg-[#070b19]/95 dark:bg-[#070b19]/95 backdrop-blur-2xl shadow-premium-xl shadow-blue-500/5 p-5 flex flex-col gap-4 text-text-primary z-120 focus:outline-none"
                            style={{ pointerEvents: 'auto' }}
                        >
                            {/* User Profile Card (Imported from Mobile Menu) */}
                            <PersonalizationCard variant="compact" className="!pt-0" />

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
                                        className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 px-3 bg-blue-500 hover:bg-blue-600 text-white font-black text-sm uppercase tracking-[0.2em] transition-all duration-200 active:scale-95 shadow-md shadow-blue-500/30"
                                    >
                                        <Wallet className="h-4 w-4 shrink-0" />
                                        <span>CONNECT</span>
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
                            <div className="flex flex-col gap-1.5 border-t border-white/5 pt-3">
                                {/* Admin Portal */}
                                {(user?.is_admin || (user?.username && ['uslincoln', 'uslincon'].includes(user.username.toLowerCase()))) && (
                                    <button
                                        onClick={() => { navigateTo(ROUTES.ADMIN); setIsDropdownOpen(false); }}
                                        className="flex items-center justify-between p-2 rounded-xl border border-white/5 bg-slate-950/20 hover:bg-white/5 text-slate-300 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1 rounded-lg bg-white/5 border border-white/5 text-slate-400 group-hover:text-text-primary transition-colors">
                                                <Shield className="w-3.5 h-3.5" />
                                            </div>
                                            <span>{t('navigation.admin_panel')}</span>
                                        </div>
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                )}

                                {/* PRO Panel (Mobile Gradient style) */}
                                {user?.is_pro && (
                                    <button
                                        onClick={() => { navigateTo(ROUTES.PRO); setIsDropdownOpen(false); }}
                                        className="group relative flex items-center justify-between p-2 rounded-xl bg-linear-to-r from-amber-500 via-yellow-500 to-orange-600 border-none text-black font-extrabold text-[11px] uppercase tracking-wider transition-all duration-200 hover:brightness-105 active:scale-98 shadow-md shadow-amber-500/20 cursor-pointer animate-pulse-glow"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1 rounded-lg bg-black/10 dark:bg-black/20 border border-black/10 dark:border-black/30 text-black group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                                                <Zap className="w-3.5 h-3.5 animate-pulse fill-black/20" />
                                            </div>
                                            <span>{t('navigation.pro_panel')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse" />
                                            <ChevronRight className="w-3.5 h-3.5 text-black/70" />
                                        </div>
                                    </button>
                                )}

                                {/* Blog */}
                                <button
                                    onClick={() => { navigateTo(ROUTES.BLOG); setIsDropdownOpen(false); }}
                                    className="flex items-center justify-between p-2 rounded-xl border border-white/5 bg-slate-950/20 hover:bg-white/5 text-slate-300 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1 rounded-lg bg-white/5 border border-white/5 text-slate-400 group-hover:text-text-primary transition-colors">
                                            <Newspaper className="w-3.5 h-3.5" />
                                        </div>
                                        <span>{t('navigation.blog')}</span>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                                </button>

                                {/* FAQ */}
                                <button
                                    onClick={() => { navigateTo(ROUTES.FAQ); setIsDropdownOpen(false); }}
                                    className="flex items-center justify-between p-2 rounded-xl border border-white/5 bg-slate-950/20 hover:bg-white/5 text-slate-300 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1 rounded-lg bg-white/5 border border-white/5 text-slate-400 group-hover:text-text-primary transition-colors">
                                            <HelpCircle className="w-3.5 h-3.5" />
                                        </div>
                                        <span>{t('navigation.faq')}</span>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                                </button>

                                {/* Support */}
                                <button
                                    onClick={() => { setSupportOpen(true); setIsDropdownOpen(false); }}
                                    className="flex items-center justify-between p-2 rounded-xl border border-white/5 bg-slate-950/20 hover:bg-white/5 text-slate-300 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1 rounded-lg bg-white/5 border border-white/5 text-slate-400 group-hover:text-text-primary transition-colors">
                                            <Headphones className="w-3.5 h-3.5" />
                                        </div>
                                        <span>{t('navigation.support')}</span>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                                </button>

                                {/* Log Out */}
                                <button
                                    onClick={() => { logout(); setIsDropdownOpen(false); }}
                                    className="flex items-center justify-between p-2 rounded-xl border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer group mt-1"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                                            <LogOut className="w-3.5 h-3.5" />
                                        </div>
                                        <span>{t('navigation.logout', 'Log Out')}</span>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-red-400/70 group-hover:translate-x-0.5 transition-transform" />
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
