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
    Shield
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { useUI } from '../../context/UIContext';

interface DrawerMenuProps {
    onClose: () => void;
    selection: () => void;
}

export function DrawerMenu({ onClose, selection }: DrawerMenuProps) {
    const { t } = useTranslation();
    const { user } = useUser();
    const { setSupportOpen } = useUI();
    const [expandedItem, setExpandedItem] = React.useState<string | null>(null);

    const toggleSection = (id: string) => {
        selection();
        setExpandedItem(expandedItem === id ? null : id);
    };

    const renderSectionContent = (id: string) => {
        switch (id) {
            case 'settings':
                return (
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-(--color-bg-app)/50">
                            <div className="flex items-center gap-2">
                                <Bell className="h-3.5 w-3.5 text-(--color-text-secondary)" />
                                <span className="text-xs font-bold text-(--color-text-primary)">{t('menu.notifications')}</span>
                            </div>
                            <div className="h-4 w-7 rounded-full bg-(--color-success) relative">
                                <div className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow-sm" />
                            </div>
                        </div>
                    </div>
                );
            case 'community':
                return (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                        <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-(--color-bg-app)/50 hover:bg-(--color-brand-blue)/10 transition-colors border border-(--color-brand-border)">
                            <MessageCircle className="h-5 w-5 text-[#0088cc]" />
                            <span className="text-[10px] font-black uppercase text-(--color-text-primary)">{t('menu.channel')}</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-(--color-bg-app)/50 hover:bg-(--color-brand-blue)/10 transition-colors border border-(--color-brand-border)">
                            <Users className="h-5 w-5 text-[#0088cc]" />
                            <span className="text-[10px] font-black uppercase text-(--color-text-primary)">{t('menu.chat')}</span>
                        </button>
                    </div>
                );
            case 'faq':
                return (
                    <div className="space-y-2 pt-2">
                        {[t('faq.withdraw'), t('faq.level'), t('faq.limits')].map((q, i) => (
                            <div key={i} className="p-2 rounded-lg bg-(--color-bg-app)/50 text-xs font-medium text-(--color-text-secondary) flex justify-between items-center group active:bg-(--color-brand-blue)/10 transition-colors">
                                {q}
                                <ChevronRight className="h-3 w-3 opacity-50 text-(--color-text-primary)" />
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
                            className="w-full py-4 rounded-xl bg-(--color-text-primary) text-(--color-bg-surface) text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-blue-500/10"
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
        ...(isAdmin ? [{ id: 'admin', icon: <Shield />, label: 'Admin Panel' }] : []),
        ...(user?.is_pro ? [{ id: 'pro', icon: <Zap />, label: 'PRO Command Center' }] : []),
        { id: 'settings', icon: <Settings />, label: t('menu.settings') },
        { id: 'blog', icon: <Newspaper />, label: t('menu.blog') },
        { id: 'community', icon: <Users />, label: t('menu.community') },
        { id: 'faq', icon: <HelpCircle />, label: t('menu.faq') },
        { id: 'support', icon: <Headphones />, label: t('menu.support') },
    ];

    return (
        <div className="flex flex-1 flex-col gap-2">
            {menuItems.map((item) => (
                <div key={item.id} className="rounded-2xl bg-(--color-bg-surface)/60 backdrop-blur-sm border border-(--color-border-glass) overflow-hidden shadow-sm group">
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
                        className="w-full flex items-center justify-between p-3 bg-transparent active:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl bg-(--color-bg-app)/50 border border-(--color-border-glass) text-(--color-text-secondary) group-hover:text-(--color-text-primary) transition-colors`}>
                                {React.cloneElement(item.icon as React.ReactElement, { className: "h-4 w-4" })}
                            </div>
                            <span className="text-sm font-bold text-(--color-text-primary) group-hover:translate-x-0.5 transition-transform">{item.label}</span>
                        </div>
                        <motion.div
                            animate={{ rotate: expandedItem === item.id ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                        </motion.div>
                    </button>
                    <AnimatePresence>
                        {expandedItem === item.id && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="px-4 pb-4 border-t border-slate-50">
                                    {renderSectionContent(item.id)}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    );
}
