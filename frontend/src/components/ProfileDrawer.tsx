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
} from 'lucide-react';
import { useHaptic } from '../hooks/useHaptic';

interface ProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
    const { selection } = useHaptic();

    // Mock data/state
    const user = { first_name: 'Partner', photo_url: null, username: 'partner' };
    const stats = { level: 1, rank: 'Beginner' };
    const connected = false;
    const address = '';
    const [theme, setTheme] = React.useState('system');

    React.useEffect(() => {
        if (isOpen) {
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            if (scrollBarWidth > 0) {
                document.body.style.paddingRight = `${scrollBarWidth}px`;
            }
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

    const menuItems = [
        { id: 'settings', icon: <Settings className="h-4 w-4" />, label: 'Settings' },
        { id: 'community', icon: <Users className="h-4 w-4" />, label: 'Community' },
        { id: 'faq', icon: <HelpCircle className="h-4 w-4" />, label: 'FAQ' },
        { id: 'support', icon: <Headphones className="h-4 w-4" />, label: 'Support' },
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
                    />

                    {/* Drawer Content Wrapper for Centering */}
                    <div className="fixed inset-0 z-[101] pointer-events-none flex justify-center">
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.8 }}
                            className="pointer-events-auto relative flex h-full w-[85%] max-w-[320px] flex-col gap-4 overflow-y-auto bg-[var(--color-bg-app)] p-5 pt-[max(1.5rem,calc(env(safe-area-inset-top)+32px))] shadow-[20px_0_60px_rgba(0,0,0,0.1)] ml-0 mr-auto will-change-transform"
                            style={{
                                marginLeft: 'max(0px, calc(50% - 32rem / 2))',
                                left: 0
                            }}
                        >
                            {/* User Profile Header */}
                            <div className="flex flex-col items-center gap-3 px-2">
                                <div className="group relative">
                                    <div className="relative h-16 w-16 overflow-hidden rounded-2xl border-4 border-[var(--color-brand-bg)] shadow-lg transition-transform active:scale-95">
                                        <img
                                            src={user.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                            alt="Avatar"
                                            className="h-full w-full bg-[var(--color-brand-bg)] object-cover"
                                        />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 rounded-md border border-[var(--color-brand-bg)] bg-[var(--color-brand-dark)] px-1 py-0.5 text-[8px] font-black text-[var(--color-brand-bg)]">
                                        LVL {stats.level}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-base font-bold leading-tight text-[var(--color-text-primary)]">
                                        {user.first_name}
                                    </h3>
                                    <div
                                        className="mt-1 inline-flex items-center gap-1 rounded bg-[var(--color-brand-dark)] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-[var(--color-brand-bg)] shadow-sm"
                                    >
                                        <Trophy className="h-2.5 w-2.5" />
                                        {stats.rank} Partner
                                    </div>
                                </div>
                            </div>

                            {/* Wallet Integration */}
                            <div className="px-1">
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => selection()}
                                    className={`flex w-full items-center justify-between rounded-lg border p-2.5 shadow-sm transition-all ${connected
                                        ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                                        : 'bg-[var(--color-brand-dark)] border-transparent text-[var(--color-brand-bg)]'
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className={`rounded-md p-1 ${connected ? 'bg-white' : 'bg-white/10'}`}>
                                            <Wallet
                                                className={`h-3.5 w-3.5 ${connected ? 'text-emerald-500' : 'text-white'}`}
                                            />
                                        </div>
                                        <div className="text-left leading-tight">
                                            <div
                                                className={`text-[9px] font-black uppercase tracking-widest ${connected ? 'text-emerald-600/80' : 'text-white/60'}`}
                                            >
                                                {connected ? 'Connected' : 'TON Wallet'}
                                            </div>
                                            <div className="max-w-[140px] truncate text-[11px] font-bold">
                                                {connected ? address : 'Connect Wallet'}
                                            </div>
                                        </div>
                                    </div>
                                    {!connected && <ChevronRight className="h-3.5 w-3.5 text-white/60" />}
                                </motion.button>
                            </div>

                            {/* Menu Items */}
                            <div className="flex flex-1 flex-col gap-1.5">
                                {menuItems.map((item, i) => (
                                    <motion.button
                                        key={item.id}
                                        onClick={() => {
                                            selection();
                                            onClose();
                                        }}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                            delay: 0.2 + i * 0.04,
                                            duration: 0.4,
                                            ease: [0.22, 1, 0.36, 1]
                                        }}
                                        className="group glass-panel flex items-center justify-between rounded-lg p-2.5 shadow-sm transition-all hover:bg-[var(--color-bg-glass)] active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-2.5 text-[var(--color-text-primary)]">
                                            <div className="text-[var(--color-text-secondary)] p-1 transition-colors group-hover:text-[var(--color-text-primary)]">
                                                {React.cloneElement(item.icon, { className: "h-3.5 w-3.5" })}
                                            </div>
                                            <span className="text-xs font-bold tracking-tight">{item.label}</span>
                                        </div>
                                        <ChevronRight className="h-3.5 w-3.5 text-[var(--color-text-secondary)] transition-all group-hover:translate-x-1" />
                                    </motion.button>
                                ))}
                            </div>

                            {/* Theme Selector */}
                            <div className="mt-auto space-y-3">
                                <div className="flex items-center justify-between gap-1 rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-bg-glass)] p-1">
                                    {[
                                        { id: 'system', icon: Monitor, label: 'System' },
                                        { id: 'light', icon: Sun, label: 'Light' },
                                        { id: 'dark', icon: Moon, label: 'Dark' },
                                    ].map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => {
                                                setTheme(option.id);
                                                selection();
                                            }}
                                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 transition-all ${theme === option.id
                                                ? 'bg-[var(--color-brand-bg)] text-[var(--color-text-primary)] shadow-sm ring-1 ring-[var(--color-brand-border)]'
                                                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                                                }`}
                                        >
                                            <option.icon className="h-3.5 w-3.5" />
                                            <span className="text-[10px] font-bold">{option.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <p className="text-center text-[8px] font-black uppercase tracking-[0.4em] text-slate-300">
                                    P2PHub v1.0.0
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
