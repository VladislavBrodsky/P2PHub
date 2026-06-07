import * as React from 'react';
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings,
    Users,
    HelpCircle,
    Headphones,
    ChevronRight,
    MessageCircle,
    Newspaper,
    Zap,
    Shield,
    Monitor,
    Copy,
    Check,
    LogOut
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { blogService } from '../../services/blogService';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { useUI } from '../../context/UIContext';
import { ROUTES } from '../../utils/routes';
import { useNavigation } from '../../hooks/useNavigation';
import { DrawerSettings } from './DrawerSettings';
import { getSafeLaunchParams, isTMA } from '../../utils/tma';

// Items that navigate away to a specific app tab on click
const NAV_TABS: Record<string, string> = {
    blog: ROUTES.BLOG,
    pro: ROUTES.PRO,
    admin: ROUTES.ADMIN,
    faq: ROUTES.FAQ,
};

interface DrawerMenuProps {
    onClose: () => void;
    selection: () => void;
}

export function DrawerMenu({ onClose, selection }: DrawerMenuProps) {
    const { t, i18n } = useTranslation('common');
    const { navigateTo } = useNavigation();
    const { user, logout } = useUser();
    const { setSupportOpen } = useUI();
    const [expandedItem, setExpandedItem] = React.useState<string | null>(null);
    const [expandedNestedItem, setExpandedNestedItem] = React.useState<string | null>(null);
    const [isCopied, setIsCopied] = React.useState(false);

    const handleCopyDesktopLink = async () => {
        const lp = getSafeLaunchParams();
        if (!lp?.initDataRaw) {
            alert('Error: Session launch data not found.');
            return;
        }
        const encodedData = encodeURIComponent(lp.initDataRaw);
        const link = `${window.location.origin}/#tgWebAppData=${encodedData}`;
        
        try {
            await navigator.clipboard.writeText(link);
            setIsCopied(true);
            selection();
            setTimeout(() => setIsCopied(false), 3000);
        } catch (err) {
            console.error('Clipboard write failed, trying fallback:', err);
            const textarea = document.createElement('textarea');
            textarea.value = link;
            textarea.style.position = 'fixed';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                setIsCopied(true);
                selection();
                setTimeout(() => setIsCopied(false), 3000);
            } catch (fallbackErr) {
                alert('Please manually copy this link: ' + link);
            }
            document.body.removeChild(textarea);
        }
    };

    const toggleSection = (id: string, isNested: boolean = false) => {
        selection();
        if (isNested) {
            setExpandedNestedItem(expandedNestedItem === id ? null : id);
        } else {
            setExpandedItem(expandedItem === id ? null : id);
        }
    };

    const renderSectionContent = (id: string) => {
        switch (id) {
            case 'desktop':
                return (
                    <div className="pt-2 space-y-2">
                        <p className="text-xs text-text-secondary leading-relaxed">
                            {t('desktop_link_instructions')}
                        </p>
                        <button
                            onClick={handleCopyDesktopLink}
                            className="w-full py-3 rounded-xl bg-btn-primary-bg text-btn-primary-text hover:bg-btn-primary-hover text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
                        >
                            {isCopied ? (
                                <>
                                    <Check className="h-4 w-4 text-emerald-400 animate-pulse" />
                                    {t('copied')}
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4" />
                                    {t('copy_link')}
                                </>
                            )}
                        </button>
                    </div>
                );
            case 'settings':
                return (
                    <div className="pt-2">
                        <DrawerSettings selection={selection} />
                    </div>
                );
            case 'community':
                return (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                        <a
                            href="https://t.me/pintopaygrowth"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card-bg hover:bg-blue-500/10 transition-colors border border-card-border"
                        >
                            <MessageCircle className="h-5 w-5 text-[#0088cc]" />
                            <span className="text-label font-bold uppercase text-text-primary">{t('navigation.channel')}</span>
                        </a>
                        <a
                            href="https://t.me/pintopayworld"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card-bg hover:bg-blue-500/10 transition-colors border border-card-border"
                        >
                            <Users className="h-5 w-5 text-[#0088cc]" />
                            <span className="text-label font-bold uppercase text-text-primary">{t('navigation.chat')}</span>
                        </a>
                    </div>
                );
            case 'faq':
                return (
                    <div className="space-y-3 pt-[calc(var(--spacing-safe-top,0px)+138px)] max-h-[400px] overflow-y-auto">
                        {!user?.is_pro && (
                            <div className="relative group overflow-hidden rounded-xl p-3 border-2 border-blue-500/30 bg-linear-to-br from-blue-500/10 to-indigo-600/10 backdrop-blur-sm">
                                <div className="absolute inset-0 bg-linear-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-orange-500 animate-pulse" />
                                        <span className="text-xs font-bold text-text-primary uppercase tracking-wider">{t('faq.pro_promo.badge')}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-text-primary leading-tight">
                                        {t('faq.pro_promo.title')}
                                    </h4>
                                    <p className="text-label font-medium text-text-secondary leading-relaxed">
                                        {t('faq.pro_promo.desc')}
                                    </p>
                                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                                        {(t('faq.pro_promo.features', { returnObjects: true }) as string[]).map((feat, i) => (
                                            <div key={i} className="flex items-center gap-1">
                                                <div className="w-1 h-1 rounded-full bg-blue-500" />
                                                <span className="text-[9px] font-bold text-text-primary opacity-80">{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => {
                                            onClose();
                                            navigateTo(ROUTES.PRO);
                                        }}
                                        className="w-full mt-2 py-2 rounded-lg bg-linear-to-r from-blue-500 to-indigo-600 text-white text-label font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
                                        {t('faq.pro_promo.cta')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {(t('faq.questions', { returnObjects: true }) as Array<{ q: string; a: string }>).map((item, i) => (
                            <div key={i} className="rounded-lg bg-card-bg border border-card-border overflow-hidden shadow-sm">
                                <button
                                    onClick={() => toggleSection(`faq-${i}`, true)}
                                    className="w-full p-2.5 flex justify-between items-start gap-2 text-left active:bg-blue-500/5 transition-colors">
                                    <span className="text-xs font-bold text-text-primary flex-1">{item.q}</span>
                                    <motion.div
                                        animate={{ rotate: expandedNestedItem === `faq-${i}` ? 90 : 0 }}
                                        transition={{ duration: 0.1 }}
                                    >
                                        <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                    </motion.div>
                                </button>
                                <AnimatePresence>
                                    {expandedNestedItem === `faq-${i}` && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="px-2.5 pb-2.5 text-label font-medium text-text-secondary leading-relaxed border-t border-card-border pt-2">
                                                {item.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                );
            case 'support':
                return (
                    <div className="pt-2 text-center text-text-primary">
                        <p className="text-xs text-text-secondary mb-3">Our support team is available 24/7.</p>
                        <button
                            onClick={() => {
                                onClose();
                                setSupportOpen(true);
                            }}
                            className="w-full py-4 rounded-xl bg-btn-primary-bg text-btn-primary-text hover:bg-btn-primary-hover text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-blue-500/10"
                        >
                            <Headphones className="h-4 w-4" />
                            {t('navigation.support')}
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    const isAdmin = user?.is_admin || (user?.username && ['uslincoln', 'uslincon'].includes(user.username.toLowerCase()));

    const menuItems = useMemo(() => [
        ...(isAdmin ? [{ id: 'admin', icon: <Shield />, label: t('navigation.admin_panel') }] : []),
        ...(user?.is_pro ? [{ id: 'pro', icon: <Zap />, label: t('navigation.pro_panel') }] : []),
        ...(isTMA() ? [{ id: 'desktop', icon: <Monitor />, label: t('navigation.connect_desktop', 'Connect Desktop') }] : []),
        { id: 'settings', icon: <Settings />, label: t('navigation.settings') },
        { id: 'blog', icon: <Newspaper />, label: t('navigation.blog') },
        { id: 'community', icon: <Users />, label: t('navigation.community') },
        { id: 'faq', icon: <HelpCircle />, label: t('navigation.faq') },
        { id: 'support', icon: <Headphones />, label: t('navigation.support') },
        ...(!isTMA() ? [{ id: 'logout', icon: <LogOut className="text-red-500/70" />, label: t('navigation.logout', 'Log Out') }] : []),
    ], [isAdmin, user?.is_pro, t]);

    return (
        <div className="flex flex-1 flex-col gap-1.5">
            {menuItems.map((item) => {
                const isProItem = item.id === 'pro';

                return (
                    <div
                        key={item.id}
                        className={`rounded-2xl overflow-hidden shadow-sm group relative transition-all duration-300 ${isProItem
                            ? 'bg-linear-to-r from-amber-500 via-yellow-500 to-orange-600 border-none'
                            : 'bg-card-bg backdrop-blur-sm border border-card-border'
                            }`}
                    >

                        <button
                            onClick={() => {
                                selection();
                                if (item.id === 'logout') {
                                    onClose();
                                    logout();
                                } else if (NAV_TABS[item.id]) {
                                    onClose();
                                    navigateTo(NAV_TABS[item.id]);
                                } else {
                                    toggleSection(item.id);
                                }
                            }}
                            className={`w-full flex items-center justify-between p-2.5 transition-colors relative z-10 ${isProItem
                                ? 'bg-transparent text-black dark:text-black active:bg-white/10'
                                : 'bg-transparent active:bg-brand-blue/5'
                                }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className={`p-1.5 rounded-xl transition-all duration-300 ${isProItem
                                    ? 'bg-black/10 dark:bg-black/20 border border-black/10 dark:border-black/30 text-black group-hover:scale-110 group-hover:rotate-12 shadow-md shadow-black/5'
                                    : 'bg-card-bg border border-card-border text-text-secondary group-hover:text-text-primary'
                                    }`}>
                                    {React.cloneElement(item.icon as React.ReactElement, {
                                        className: `h-4 w-4 ${isProItem ? 'animate-pulse' : ''}`
                                    })}
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className={`text-sm font-bold group-hover:translate-x-0.5 transition-transform ${isProItem ? 'text-black dark:text-black' : 'text-text-primary'
                                        }`}>
                                        {item.label}
                                    </span>
                                </div>
                            </div>
                            <motion.div
                                animate={{ rotate: expandedItem === item.id ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronRight className={`h-4 w-4 ${isProItem ? 'text-black/70 dark:text-black/70' : 'text-text-secondary'}`} />
                            </motion.div>
                        </button>

                        {isProItem && (
                            <div className="absolute right-10 top-1/2 -translate-y-1/2">
                                <div className="h-1 w-1 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse" />
                            </div>
                        )}

                        <AnimatePresence>
                            {expandedItem === item.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className={`px-4 pb-4 border-t ${isProItem ? 'border-white/10' : 'border-card-border'}`}>
                                        {renderSectionContent(item.id)}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}
