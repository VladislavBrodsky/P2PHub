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
    Monitor,
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

interface ProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
    const { selection } = useHaptic();
    const { user } = useUser();

    // State
    const [theme, setTheme] = React.useState('system');
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
                        <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-bg-app)]">
                            <div className="flex items-center gap-2">
                                <Globe className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                                <span className="text-xs font-bold text-[var(--color-text-primary)]">Language</span>
                            </div>
                            <span className="text-[10px] font-black uppercase text-[var(--color-text-secondary)]">English</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-bg-app)]">
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
                        <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[var(--color-bg-app)] hover:bg-[var(--color-brand-blue)]/5 transition-colors border border-[var(--color-brand-border)]">
                            <MessageCircle className="h-5 w-5 text-[#0088cc]" />
                            <span className="text-[10px] font-black uppercase">Channel</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[var(--color-bg-app)] hover:bg-[var(--color-brand-blue)]/5 transition-colors border border-[var(--color-brand-border)]">
                            <Users className="h-5 w-5 text-[#0088cc]" />
                            <span className="text-[10px] font-black uppercase">Chat</span>
                        </button>
                    </div>
                );
            case 'faq':
                return (
                    <div className="space-y-2 pt-2">
                        {['How to withdraw?', 'What is Partner Level?', 'Card limits'].map((q, i) => (
                            <div key={i} className="p-2 rounded-lg bg-[var(--color-bg-app)] text-xs font-medium text-[var(--color-text-secondary)] flex justify-between items-center">
                                {q}
                                <ChevronRight className="h-3 w-3 opacity-50" />
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
                            className="pointer-events-auto relative flex h-full w-[85%] max-w-[320px] flex-col gap-0 overflow-hidden bg-[var(--color-bg-app)] pt-[env(safe-area-inset-top)] shadow-[20px_0_60px_rgba(0,0,0,0.1)] ml-0 mr-auto"
                            style={{
                                marginLeft: 'max(0px, calc(50% - 32rem / 2))',
                                left: 0,
                                willChange: 'transform' // GPU hint
                            }}
                        >
                            {/* Header / Back Button Area */}
                            <div
                                className="flex h-14 items-center px-4 shrink-0"
                                style={{
                                    marginTop: 'calc(var(--spacing-telegram-header) + 8px)'
                                }}
                            >
                                <button
                                    onClick={onClose}
                                    className="group -ml-1 rounded-2xl transition-all hover:bg-slate-100/50 active:scale-95 pointer-events-auto"
                                >
                                    <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-brand-border)] bg-white px-3 py-1.5 shadow-sm">
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
                            <div className="flex-1 overflow-y-auto px-6 pb-10 flex flex-col gap-5">
                                {/* User Profile Header */}
                                <div className="flex flex-col items-center gap-4 px-2 mt-4">
                                    <div className="group relative">
                                        <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-xl bg-white">
                                            <img
                                                src={user?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'partner'}`}
                                                alt="Avatar"
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-text-primary)] ring-4 ring-[var(--color-bg-app)]">
                                            <span className="text-[10px] font-black text-[var(--color-bg-surface)]">
                                                {stats.level}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-center space-y-1">
                                        <h3 className="text-lg font-black tracking-tight text-[var(--color-text-primary)]">
                                            {user?.first_name || 'Partner'} {user?.last_name || ''}
                                        </h3>
                                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] shadow-sm border border-[var(--color-brand-border)]">
                                            <Trophy className="h-3 w-3 text-amber-500" />
                                            {stats.rank}
                                        </div>
                                    </div>
                                </div>

                                {/* Menu Sections */}
                                <div className="flex flex-1 flex-col gap-2">
                                    {menuItems.map((item) => (
                                        <div key={item.id} className="rounded-2xl bg-white border border-[var(--color-brand-border)] overflow-hidden shadow-sm">
                                            <button
                                                onClick={() => toggleSection(item.id)}
                                                className="w-full flex items-center justify-between p-4 bg-white active:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-xl bg-slate-50 text-slate-600`}>
                                                        {React.cloneElement(item.icon as React.ReactElement, { className: "h-4 w-4" })}
                                                    </div>
                                                    <span className="text-sm font-bold text-[var(--color-text-primary)]">{item.label}</span>
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
                                        className={`relative overflow-hidden w-full rounded-2xl p-4 shadow-sm transition-all border ${wallet
                                            ? 'bg-emerald-500 text-white border-transparent'
                                            : 'bg-white text-[var(--color-text-primary)] border-[var(--color-brand-border)]'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className={`rounded-xl p-2 ${wallet ? 'bg-white/20' : 'bg-slate-100'}`}>
                                                    <Wallet className={`h-5 w-5 ${wallet ? 'text-white' : 'text-slate-600'}`} />
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
                                    <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-white border border-[var(--color-brand-border)]">
                                        {[
                                            { id: 'system', icon: Monitor, label: 'System' },
                                            { id: 'light', icon: Sun, label: 'Light' },
                                            { id: 'dark', icon: Moon, label: 'Dark' },
                                        ].map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => { setTheme(option.id); selection(); }}
                                                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 transition-all ${theme === option.id
                                                    ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-surface)] shadow-md'
                                                    : 'text-[var(--color-text-secondary)] hover:bg-slate-50'
                                                    }`}
                                            >
                                                <option.icon className="h-3.5 w-3.5" />
                                                <span className="text-[10px] font-bold">{option.label}</span>
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
