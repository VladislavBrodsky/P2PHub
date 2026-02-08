import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings,
    Users,
    HelpCircle,
    Headphones,
    ChevronRight,
    Trophy,
    Wallet,
    Sun,
    Moon,
    Globe,
    Bell,
    MessageCircle,
    Copy,
    Check,
    X, // Added Close icon
    ArrowLeft
} from 'lucide-react';
import { useHaptic } from '../hooks/useHaptic';
import { useUser } from '../context/UserContext';
import { useTonConnectUI, useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import { PersonalizationCard } from './PersonalizationCard';
import { useTheme } from '../context/ThemeContext';

interface ProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
    const { selection } = useHaptic();
    const { user } = useUser();

    const { theme, setTheme } = useTheme();
    const [expandedItem, setExpandedItem] = React.useState<string | null>(null);
    const [copied, setCopied] = React.useState(false);

    // Mock stats
    const stats = {
        level: user?.level || 1,
        rank: user?.level ? (user.level > 10 ? 'Elite' : 'Beginner') : 'Beginner'
    };

    // TON Connect
    const [tonConnectUI] = useTonConnectUI();
    const wallet = useTonWallet();
    const friendlyAddress = useTonAddress();

    // Format address for display (e.g. UQ...93d2)
    const formattedAddress = friendlyAddress
        ? `${friendlyAddress.slice(0, 4)}...${friendlyAddress.slice(-4)}`
        : '';

    // Prevent body scroll when open
    React.useEffect(() => {
        if (isOpen) {
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;
            selection();
        } else {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
        };
    }, [isOpen]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        selection();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleSection = (id: string) => {
        selection();
        setExpandedItem(expandedItem === id ? null : id);
    };

    const renderSectionContent = (id: string) => {
        switch (id) {
            case 'settings':
                return (
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-bg-app)]/50">
                            <div className="flex items-center gap-2">
                                <Globe className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                                <span className="text-xs font-bold text-[var(--color-text-primary)]">Language</span>
                            </div>
                            <span className="text-[10px] font-black uppercase text-[var(--color-text-secondary)]">English</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-bg-app)]/50">
                            <div className="flex items-center gap-2">
                                <Bell className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                                <span className="text-xs font-bold text-[var(--color-text-primary)]">Notifications</span>
                            </div>
                            <div className="h-4 w-7 rounded-full bg-[var(--color-success)] relative">
                                <div className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow-sm" />
                            </div>
                        </div>
                    </div>
                );
            case 'community':
                return (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                        <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[var(--color-bg-app)]/50 hover:bg-[var(--color-brand-blue)]/10 transition-colors border border-[var(--color-brand-border)]">
                            <MessageCircle className="h-5 w-5 text-[#0088cc]" />
                            <span className="text-[10px] font-black uppercase text-[var(--color-text-primary)]">Channel</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[var(--color-bg-app)]/50 hover:bg-[var(--color-brand-blue)]/10 transition-colors border border-[var(--color-brand-border)]">
                            <Users className="h-5 w-5 text-[#0088cc]" />
                            <span className="text-[10px] font-black uppercase text-[var(--color-text-primary)]">Chat</span>
                        </button>
                    </div>
                );
            case 'faq':
                return (
                    <div className="space-y-2 pt-2">
                        {['How to withdraw?', 'What is Partner Level?', 'Card limits'].map((q, i) => (
                            <div key={i} className="p-2 rounded-lg bg-[var(--color-bg-app)]/50 text-xs font-medium text-[var(--color-text-secondary)] flex justify-between items-center group active:bg-[var(--color-brand-blue)]/10 transition-colors">
                                {q}
                                <ChevronRight className="h-3 w-3 opacity-50 text-[var(--color-text-primary)]" />
                            </div>
                        ))}
                    </div>
                );
            case 'support':
                return (
                    <div className="pt-2 text-center">
                        <p className="text-xs text-[var(--color-text-secondary)] mb-3">Our support team is available 24/7 to help you with any issues.</p>
                        <button className="w-full py-3 rounded-xl bg-[var(--color-text-primary)] text-[var(--color-bg-surface)] text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                            <Headphones className="h-3.5 w-3.5" />
                            Contact Support
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    const menuItems = [
        { id: 'settings', icon: <Settings />, label: 'Settings' },
        { id: 'community', icon: <Users />, label: 'Community' },
        { id: 'faq', icon: <HelpCircle />, label: 'FAQ' },
        { id: 'support', icon: <Headphones />, label: 'Support' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px]"
                        style={{ willChange: 'opacity' }}
                    />

                    {/* Drawer Content */}
                    <div className="fixed inset-0 z-[101] pointer-events-none flex justify-center">
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'tween', ease: 'circOut', duration: 0.3 }} // Optimized animation
                            className="pointer-events-auto relative flex h-full w-[85%] max-w-[320px] flex-col gap-0 overflow-hidden bg-(--color-bg-deep) border-r border-(--color-border-glass) pt-[env(safe-area-inset-top)] shadow-[20px_0_60px_rgba(0,0,0,0.5)] ml-0 mr-auto"
                            style={{
                                marginLeft: 'max(0px, calc(50% - 32rem / 2))',
                                left: 0,
                                willChange: 'transform' // GPU hint
                            }}
                        >
                            {/* Mesh Background Overlay */}
                            <div className="mesh-gradient-dark absolute inset-0 opacity-40 pointer-events-none" />
                            <div className="absolute inset-0 bg-linear-to-b from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                            {/* Header / Back Button Area */}
                            <div
                                className="flex h-14 items-center px-4 shrink-0"
                                style={{
                                    marginTop: 'calc(var(--spacing-telegram-header) + 8px)'
                                }}
                            >
                                <button
                                    onClick={onClose}
                                    className="group -ml-1 rounded-2xl transition-all hover:bg-white/5 active:scale-95 pointer-events-auto"
                                >
                                    <div className="flex items-center gap-2 rounded-2xl border border-(--color-border-glass) bg-(--color-bg-surface)/80 backdrop-blur-md px-3 py-1.5 shadow-premium">
                                        <ArrowLeft className="text-[var(--color-text-primary)] h-5 w-5 transition-transform group-hover:-translate-x-1" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-primary)] pr-0.5">
                                            Back
                                        </span>
                                    </div>
                                </button>
                            </div>

                            {/* Close Button (Legacy X) - Optional to keep, but user asked for Back button in Menu position */}
                            {/* <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-[var(--color-text-secondary)]"
                            >
                                <X className="h-5 w-5" />
                            </button> */}

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto px-5 pb-10 flex flex-col gap-5">
                                {/* User Profile Header - Standardized */}
                                <div className="mt-4">
                                    <PersonalizationCard variant="compact" />
                                </div>

                                {/* Menu Sections */}
                                <div className="flex flex-1 flex-col gap-2">
                                    {menuItems.map((item) => (
                                        <div key={item.id} className="rounded-2xl bg-(--color-bg-surface)/60 backdrop-blur-sm border border-(--color-border-glass) overflow-hidden shadow-sm group">
                                            <button
                                                onClick={() => toggleSection(item.id)}
                                                className="w-full flex items-center justify-between p-4 bg-transparent active:bg-white/5 transition-colors"
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

                                {/* Wallet Integration */}
                                <div className="px-1 mt-auto">
                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            selection();
                                            if (wallet) {
                                                tonConnectUI.disconnect();
                                            } else {
                                                tonConnectUI.openModal();
                                            }
                                        }}
                                        className={`relative overflow-hidden w-full rounded-2xl p-4 shadow-premium transition-all border ${wallet
                                            ? 'bg-emerald-500 text-white border-transparent'
                                            : 'bg-(--color-bg-surface)/80 backdrop-blur-md text-(--color-text-primary) border-(--color-border-glass)'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className={`rounded-xl p-2 ${wallet ? 'bg-white/20' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                                                    <Wallet className={`h-5 w-5 ${wallet ? 'text-white' : 'text-blue-500'}`} />
                                                </div>
                                                <div className="text-left">
                                                    <div className={`text-[10px] font-black uppercase tracking-widest ${wallet ? 'text-emerald-100' : 'text-[var(--color-text-secondary)]'}`}>
                                                        Wallet
                                                    </div>
                                                    <div className="font-bold text-sm">
                                                        {wallet ? formattedAddress : 'Connect Wallet'}
                                                    </div>
                                                </div>
                                            </div>
                                            {wallet ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleCopy(formattedAddress); }}
                                                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                                                >
                                                    {copied ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4 text-white" />}
                                                </button>
                                            ) : (
                                                <ChevronRight className="h-4 w-4 opacity-50" />
                                            )}
                                        </div>
                                    </motion.button>
                                </div>

                                {/* Theme Selector */}
                                <div className="mt-auto space-y-4 pt-4">
                                    <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-(--color-bg-surface)/80 backdrop-blur-md border border-(--color-border-glass) relative overflow-hidden">
                                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
                                        {[
                                            { id: 'light' as const, icon: Sun, label: 'Light', activeColor: 'rgba(251,191,36,0.1)', iconColor: '#FBBF24' },
                                            { id: 'dark' as const, icon: Moon, label: 'Dark', activeColor: 'rgba(59,130,246,0.1)', iconColor: '#3B82F6' },
                                        ].map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => { setTheme(option.id); selection(); }}
                                                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 transition-all relative z-10 ${theme === option.id
                                                    ? 'bg-white/10 dark:bg-white/5 border border-white/10 shadow-lg text-(--color-text-primary) overflow-hidden'
                                                    : 'text-[var(--color-text-secondary)] hover:bg-white/5'
                                                    }`}
                                            >
                                                {theme === option.id && (
                                                    <motion.div
                                                        layoutId="theme-glow"
                                                        className="absolute inset-0 bg-white/5 blur-md"
                                                        style={{ backgroundColor: option.activeColor }}
                                                    />
                                                )}
                                                <option.icon className="h-3.5 w-3.5 relative z-10" style={{ color: theme === option.id ? option.iconColor : undefined }} />
                                                <span className="text-[10px] font-black uppercase tracking-widest relative z-10">{option.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-text-secondary)] opacity-50">
                                        P2PHub v1.0.0
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
