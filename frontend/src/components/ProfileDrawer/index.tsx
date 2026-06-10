import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Wallet,
    Check,
    Copy,
    ChevronRight,
} from 'lucide-react';

import { useHaptic } from '../../hooks/useHaptic';
import { useTonConnectUI, useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import { backButton } from '@telegram-apps/sdk-react';
import { PersonalizationCard } from '../PersonalizationCard';
import { UpgradeButton } from '../ui/UpgradeButton';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { DrawerMenu } from './DrawerMenu';
import { ROUTES } from '../../utils/routes';
import { useNavigation } from '../../hooks/useNavigation';
import { useUser } from '../../context/UserContext';
import { useTMALock } from '../../hooks/useTMALock';

// #comment: ProfileDrawer.tsx - Optimized wrapper for the main application menu.
// This component has been portaled to document.body to ensure it appears above all 
// layout layers and satisfies the Apple-esque depth requirements.

interface ProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    activeTab?: string;
}

export default function ProfileDrawer({ isOpen, onClose, activeTab }: ProfileDrawerProps) {
    const { selection } = useHaptic();
    const { t } = useTranslation('common');
    const { navigateTo } = useNavigation();
    const { user } = useUser();

    const [copied, setCopied] = React.useState(false);
    const [isAnimating, setIsAnimating] = React.useState(false);
    const [disconnectConfirm, setDisconnectConfirm] = React.useState(false);

    // Prevent body scroll and TMA swipes when drawer is open
    useTMALock(isOpen);

    // Back Button handling
    React.useEffect(() => {
        let cleanup: VoidFunction | undefined;

        if (isOpen) {
            try {
                if (backButton.show.isAvailable()) {
                    backButton.show();
                    cleanup = backButton.onClick(() => {
                        onClose();
                    });
                }
            } catch (e) {
                console.warn('Telegram SDK backButton error:', e);
            }
        }

        return () => {
            if (isOpen && activeTab === 'home') {
                try {
                    if (backButton.hide.isAvailable()) backButton.hide();
                } catch (e) { /* ignore */ }
            }
            if (cleanup) cleanup();
        };
    }, [isOpen, onClose, activeTab]);

    // TON Connect
    const [tonConnectUI] = useTonConnectUI();
    const wallet = useTonWallet();
    const friendlyAddress = useTonAddress();

    const formattedAddress = friendlyAddress
        ? `${friendlyAddress.slice(0, 4)}...${friendlyAddress.slice(-4)}`
        : '';

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        selection();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div key="drawer-portal-root" className="fixed inset-0 z-9998 overflow-hidden pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        key="drawer-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, pointerEvents: 'none' }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 dark:bg-slate-950/45 backdrop-blur-md cursor-pointer pointer-events-auto"
                    />

                    {/* Drawer Content Wrapper */}
                    <div className="fixed inset-0 z-10000 pointer-events-none flex justify-center">
                        <motion.div
                            key="drawer-panel"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Main Menu"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%', pointerEvents: 'none' }}
                            onAnimationStart={() => setIsAnimating(true)}
                            onAnimationComplete={() => setIsAnimating(false)}
                            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 1 }}
                            className="pointer-events-auto relative flex h-full w-[85%] max-w-[320px] flex-col gap-0 overflow-hidden bg-bg-app border-r border-border-glass shadow-2xl ml-0 mr-auto overscroll-none"
                            style={{
                                marginLeft: 'max(0px, calc(50% - 32rem / 2))',
                                left: 0,
                                overscrollBehavior: 'none',
                                willChange: 'transform',
                                transform: 'translateZ(0)',
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden'
                            }}
                        >
                            {/* Drawer background - simplified for Android stability */}
                            <div className="absolute inset-0 bg-linear-to-b from-blue-500/5 to-purple-500/5 pointer-events-none z-0" />

                            {/* Drawer Navigation Bar */}
                            <div className="pt-(--back-button-drawer-offset,88px) px-4 pb-1.5 flex items-center justify-between z-20">
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full bg-card-bg border border-card-border text-text-primary shadow-sm active:scale-90 transition-all outline-none"
                                    aria-label="Close menu"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <div className="text-label font-bold uppercase tracking-[0.2em] text-text-secondary">
                                    {t('menu')}
                                </div>
                                <div className="w-9" />
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto px-5 pb-8 flex flex-col gap-3 overscroll-none" style={{ overscrollBehavior: 'none' }}>
                                <div className="mt-4 overflow-visible">
                                    <PersonalizationCard variant="compact" />
                                </div>

                                <DrawerMenu onClose={onClose} selection={selection} />

                                {!user?.is_pro && (
                                    <div className="px-1">
                                        <UpgradeButton
                                            onClick={() => {
                                                onClose();
                                                navigateTo(ROUTES.SUBSCRIPTION);
                                            }}
                                            className="shadow-xl shadow-amber-500/10"
                                        />
                                    </div>
                                )}

                                {disconnectConfirm && (
                                    <div className="w-full rounded-2xl bg-card-bg border border-card-border p-4 flex flex-col gap-3">
                                        <p className="text-sm font-bold text-text-primary text-center">Disconnect wallet?</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setDisconnectConfirm(false)}
                                                className="flex-1 py-2 rounded-xl border border-card-border text-text-secondary text-xs font-bold uppercase active:scale-95 transition-transform"
                                            >Cancel</button>
                                            <button
                                                onClick={() => { tonConnectUI.disconnect(); setDisconnectConfirm(false); }}
                                                className="flex-1 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase active:scale-95 transition-transform"
                                            >Disconnect</button>
                                        </div>
                                    </div>
                                )}

                                <div className="px-1">
                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            selection();
                                            if (wallet) setDisconnectConfirm(true);
                                            else tonConnectUI.openModal();
                                        }}
                                        className={`w-full rounded-full py-1.5 px-3 border transition-all ${wallet
                                            ? 'bg-emerald-500 text-white border-transparent'
                                            : 'bg-btn-secondary-bg backdrop-blur-md text-text-primary border-card-border hover:bg-btn-secondary-hover'}`}
                                        aria-label={wallet ? "Wallet connected" : "Connect wallet"}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1 rounded-lg ${wallet ? 'bg-white/20' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                                                    <Wallet className={`h-3 w-3 ${wallet ? 'text-white' : 'text-brand-blue'}`} />
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-[7px] font-bold uppercase tracking-widest opacity-70">
                                                        {t('wallet')}
                                                    </div>
                                                    <div className="font-bold text-label">
                                                        {wallet ? formattedAddress : t('connect_wallet')}
                                                    </div>
                                                </div>
                                            </div>
                                            {wallet ? (
                                                <div onClick={(e) => { e.stopPropagation(); handleCopy(friendlyAddress); }} className="p-1 rounded-md bg-white/20">
                                                    {copied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                                                </div>
                                            ) : <ChevronRight className="h-3 w-3 opacity-50" />}
                                        </div>
                                    </motion.button>
                                </div>

                                <div className="mt-4 mb-3">
                                    <p className="text-center text-label font-bold uppercase tracking-[0.3em] text-text-secondary opacity-50">
                                        P2PHub v{import.meta.env.VITE_APP_VERSION ?? '2.0.1'} (Stable)
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
