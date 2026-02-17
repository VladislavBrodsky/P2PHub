import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings,
    Users,
    HelpCircle,
    Headphones,
    ChevronRight,
    Bell,
    MessageCircle,
    Newspaper,
    Zap,
    Shield,
    Globe
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { useUI } from '../../context/UIContext';

interface DrawerMenuProps {
    onClose: () => void;
    selection: () => void;
}

export function DrawerMenu({ onClose, selection }: DrawerMenuProps) {
    const { t, i18n } = useTranslation();
    const { user } = useUser();
    const { setSupportOpen } = useUI();
    const [expandedItem, setExpandedItem] = React.useState<string | null>(null);

    const toggleSection = (id: string) => {
        selection();
        setExpandedItem(expandedItem === id ? null : id);
    };

    const toggleLanguage = async () => {
        const newLang = i18n.language.startsWith('ru') ? 'en' : 'ru';
        await i18n.changeLanguage(newLang);
        try {
            await apiClient.post('/api/partner/language', { language_code: newLang });
        } catch (e) {
            console.error('Failed to sync language', e);
        }
    };

    const renderSectionContent = (id: string) => {
        switch (id) {
            case 'settings':
                return (
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-(--card-bg) border border-(--card-border)">
                            <div className="flex items-center gap-2">
                                <Bell className="h-3.5 w-3.5 text-(--color-text-secondary)" />
                                <span className="text-xs font-bold text-(--color-text-primary)">{t('menu.notifications')}</span>
                            </div>
                            <div className="h-4 w-7 rounded-full bg-emerald-500 relative">
                                <div className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow-sm" />
                            </div>
                        </div>
                        <button
                            onClick={toggleLanguage}
                            className="w-full flex items-center justify-between p-2 rounded-lg bg-(--card-bg) border border-(--card-border) active:scale-95 transition-transform"
                        >
                            <div className="flex items-center gap-2">
                                <Globe className="h-3.5 w-3.5 text-(--color-text-secondary)" />
                                <span className="text-xs font-bold text-(--color-text-primary)">{t('common.language')}</span>
                            </div>
                            <span className="text-xs font-medium text-(--color-text-secondary)">
                                {i18n.language.startsWith('ru') ? 'Русский' : 'English'}
                            </span>
                        </button>
                    </div>
                );
            case 'community':
                return (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                        <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-(--card-bg) hover:bg-blue-500/10 transition-colors border border-(--card-border)">
                            <MessageCircle className="h-5 w-5 text-[#0088cc]" />
                            <span className="text-[10px] font-black uppercase text-(--color-text-primary)">{t('menu.channel')}</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-(--card-bg) hover:bg-blue-500/10 transition-colors border border-(--card-border)">
                            <Users className="h-5 w-5 text-[#0088cc]" />
                            <span className="text-[10px] font-black uppercase text-(--color-text-primary)">{t('menu.chat')}</span>
                        </button>
                    </div>
                );
            case 'faq':
                return (
                    <div className="space-y-3 pt-2 max-h-[400px] overflow-y-auto">
                        {/* PRO Subscription Promo */}
                        {!user?.is_pro && (
                            <div className="relative group overflow-hidden rounded-xl p-3 border-2 border-blue-500/30 bg-linear-to-br from-blue-500/10 to-indigo-600/10 backdrop-blur-sm">
                                <div className="absolute inset-0 bg-linear-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-orange-500 animate-pulse" />
                                        <span className="text-xs font-black text-(--color-text-primary) uppercase tracking-wider">{t('faq.pro_promo.badge')}</span>
                                    </div>
                                    <h4 className="text-sm font-black text-(--color-text-primary) leading-tight">
                                        {t('faq.pro_promo.title')}
                                    </h4>
                                    <p className="text-[10px] font-medium text-(--color-text-secondary) leading-relaxed">
                                        {t('faq.pro_promo.desc')}
                                    </p>
                                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                                        {(t('faq.pro_promo.features', { returnObjects: true }) as string[]).map((feat, i) => (
                                            <div key={i} className="flex items-center gap-1">
                                                <div className="w-1 h-1 rounded-full bg-blue-500" />
                                                <span className="text-[9px] font-bold text-(--color-text-primary) opacity-80">{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => {
                                            onClose();
                                            window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'pro' }));
                                        }}
                                        className="w-full mt-2 py-2 rounded-lg bg-linear-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
                                        {t('faq.pro_promo.cta')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* FAQ Items */}
                        {(t('faq.questions', { returnObjects: true }) as Array<{ q: string; a: string }>).map((item, i) => (
                            <div key={i} className="rounded-lg bg-(--card-bg) border border-(--card-border) overflow-hidden shadow-sm">
                                <button
                                    onClick={() => toggleSection(`faq-${i}`)}
                                    className="w-full p-2.5 flex justify-between items-start gap-2 text-left active:bg-blue-500/5 transition-colors">
                                    <span className="text-xs font-bold text-(--color-text-primary) flex-1">{item.q}</span>
                                    <motion.div
                                        animate={{ rotate: expandedItem === `faq-${i}` ? 90 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                    </motion.div>
                                </button>
                                <AnimatePresence>
                                    {expandedItem === `faq-${i}` && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="px-2.5 pb-2.5 text-[10px] font-medium text-(--color-text-secondary) leading-relaxed border-t border-(--card-border) pt-2">
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
                    <div className="pt-2 text-center text-(--color-text-primary)">
                        <p className="text-xs text-(--color-text-secondary) mb-3">Our support team is available 24/7.</p>
                        <button
                            onClick={() => {
                                onClose();
                                setSupportOpen(true);
                            }}
                            className="w-full py-4 rounded-xl bg-(--btn-primary-bg) text-(--btn-primary-text) hover:bg-(--btn-primary-hover) text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-blue-500/10"
                        >
                            <Headphones className="h-4 w-4" />
                            {t('menu.support')}
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    const isAdmin = user?.username === 'uslincoln' || user?.username === 'uslincon' || user?.is_admin;

    const menuItems = [
        ...(isAdmin ? [{ id: 'admin', icon: <Shield />, label: t('menu.admin_panel') }] : []),
        ...(user?.is_pro ? [{ id: 'pro', icon: <Zap />, label: t('menu.pro_panel') }] : []),
        { id: 'settings', icon: <Settings />, label: t('menu.settings') },
        { id: 'blog', icon: <Newspaper />, label: t('menu.blog') },
        { id: 'community', icon: <Users />, label: t('menu.community') },
        { id: 'faq', icon: <HelpCircle />, label: t('menu.faq') },
        { id: 'support', icon: <Headphones />, label: t('menu.support') },
    ];

    return (
        <div className="flex flex-1 flex-col gap-2">
            {menuItems.map((item) => {
                const isProItem = item.id === 'pro';

                return (
                    <div
                        key={item.id}
                        className={`rounded-2xl overflow-hidden shadow-sm group relative transition-all duration-300 ${isProItem
                            ? 'bg-linear-to-r from-amber-500 via-yellow-500 to-orange-600 border-none animate-[vibing-gradient_10s_infinite_linear] bg-size-[300%_300%]'
                            : 'bg-(--card-bg) backdrop-blur-sm border border-(--card-border)'
                            }`}
                    >
                        {/* Premium Liquid/Glow Overlay for Pro */}
                        {isProItem && (
                            <>
                                <div className="absolute inset-0 opacity-40">
                                    <div className="absolute -inset-full animate-[liquid_20s_infinite_linear] bg-linear-to-r from-transparent via-white/40 to-transparent rotate-12" />
                                </div>
                                <div className="absolute inset-0 opacity-30">
                                    <div className="absolute -inset-full animate-[liquid_15s_infinite_linear_reverse] bg-linear-to-tr from-transparent via-amber-200/40 to-transparent -rotate-12" />
                                </div>
                            </>
                        )}

                        <button
                            onClick={() => {
                                if (item.id === 'blog') {
                                    onClose();
                                    window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'blog' }));
                                } else if (item.id === 'pro') {
                                    onClose();
                                    window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'pro' }));
                                } else if (item.id === 'admin') {
                                    onClose();
                                    window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'admin' }));
                                } else {
                                    toggleSection(item.id);
                                }
                            }}
                            className={`w-full flex items-center justify-between p-3 transition-colors relative z-10 ${isProItem
                                ? 'bg-transparent text-black dark:text-black active:bg-white/10'
                                : 'bg-transparent active:bg-(--color-brand-blue)/5'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl transition-all duration-300 ${isProItem
                                    ? 'bg-black/10 dark:bg-white/30 border border-black/10 dark:border-white/40 text-black dark:text-white group-hover:scale-110 group-hover:rotate-12 shadow-lg shadow-white/10'
                                    : 'bg-(--card-bg) border border-(--card-border) text-(--color-text-secondary) group-hover:text-(--color-text-primary)'
                                    }`}>
                                    {React.cloneElement(item.icon as React.ReactElement, {
                                        className: `h-4 w-4 ${isProItem ? 'animate-pulse' : ''}`
                                    })}
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className={`text-sm font-bold group-hover:translate-x-0.5 transition-transform ${isProItem ? 'text-black dark:text-black' : 'text-(--color-text-primary)'
                                        }`}>
                                        {item.label}
                                    </span>
                                    {isProItem && (
                                        <span className="text-[9px] font-black uppercase tracking-widest text-black/60 dark:text-black/60 -mt-0.5">
                                            {t('common.pro_active')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <motion.div
                                animate={{ rotate: expandedItem === item.id ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronRight className={`h-4 w-4 ${isProItem ? 'text-black/70 dark:text-black/70' : 'text-(--color-text-secondary)'}`} />
                            </motion.div>
                        </button>

                        {/* Pro badge/glow */}
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
                                    <div className={`px-4 pb-4 border-t ${isProItem ? 'border-white/10' : 'border-(--card-border)'}`}>
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
