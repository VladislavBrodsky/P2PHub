import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Wallet,
    Check,
    Copy,
    ChevronRight,
} from 'lucide-react';

import { useHaptic } from '../hooks/useHaptic';
import { useTonConnectUI, useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import { backButton } from '@telegram-apps/sdk-react';
import { PersonalizationCard } from './PersonalizationCard';
import { UpgradeButton } from './ui/UpgradeButton';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { DrawerMenu } from './ProfileDrawer/DrawerMenu';
import { DrawerSettings } from './ProfileDrawer/DrawerSettings';
import { useUser } from '../context/UserContext';

interface ProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    activeTab?: string;
}

export default function ProfileDrawer({ isOpen, onClose, activeTab }: ProfileDrawerProps) {
    const { selection } = useHaptic();
    const { t } = useTranslation();
    const { user } = useUser();

    const [copied, setCopied] = React.useState(false);

    // Scroll Lock & Back Button handling
    React.useEffect(() => {
        let cleanup: VoidFunction | undefined;

        if (isOpen) {
            // Lock background scroll
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;

            // Telegram Back Button interaction
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
            // Success/Safety Cleanup
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';

            // If we're closing and on the home tab, ensure backButton is hidden
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
        <AnimatePresence mode="wait">
            {isOpen && (
                <div key="drawer-portal-root" className="fixed inset-0 z-9998 overflow-hidden pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        key="drawer-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, pointerEvents: 'none' }}
                        transition={{ duration: 0.15 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-(--overlay-bg) backdrop-blur-[2px] cursor-pointer pointer-events-auto"
                    />

                    {/* Drawer Content Wrapper */}
                    <div className="fixed inset-0 z-10000 pointer-events-none flex justify-center">
                        <motion.div
                            key="drawer-panel"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%', pointerEvents: 'none' }}
                            transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
                            className="pointer-events-auto relative flex h-full w-[85%] max-w-[320px] flex-col gap-0 overflow-hidden bg-(--color-bg-app) border-r border-(--color-border-glass) shadow-2xl ml-0 mr-auto"
                            style={{
                                marginLeft: 'max(0px, calc(50% - 32rem / 2))',
                                left: 0
                            }}
                        >
                            <div className="mesh-gradient-dark absolute inset-0 opacity-20 pointer-events-none" />
                            <div className="absolute inset-0 bg-linear-to-b from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

                            {/* Drawer Navigation Bar */}
                            <div className="pt-[calc(env(safe-area-inset-top)+var(--spacing-telegram-header))] px-4 pb-2 flex items-center justify-between z-20">
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full bg-(--card-bg) border border-(--card-border) text-(--color-text-primary) shadow-sm active:scale-90 transition-all"
                                    aria-label="Close menu"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-(--color-text-secondary)">
                                    {t('common.menu')}
                                </div>
                                <div className="w-9" /> {/* Spacer to center title */}
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto px-5 pb-10 flex flex-col gap-4">
                                <div className="mt-0">
                                    <PersonalizationCard variant="compact" />
                                </div>


                                <DrawerMenu onClose={onClose} selection={selection} />

                                {!user?.is_pro && (
                                    <div className="px-1">
                                        <UpgradeButton
                                            onClick={() => {
                                                onClose();
                                                window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'subscription' }));
                                            }}
                                            className="shadow-xl shadow-amber-500/10"
                                        />
                                    </div>
                                )}

                                <div className="px-1">
                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            selection();
                                            if (wallet) tonConnectUI.disconnect();
                                            else tonConnectUI.openModal();
                                        }}
                                        className={`w-full rounded-full py-1.5 px-3 border transition-all ${wallet
                                            ? 'bg-emerald-500 text-white border-transparent'
                                            : 'bg-(--btn-secondary-bg) backdrop-blur-md text-(--color-text-primary) border-(--card-border) hover:bg-(--btn-secondary-hover)'}`}
                                        aria-label={wallet ? "Wallet connected" : "Connect wallet"}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1 rounded-lg ${wallet ? 'bg-white/20' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                                                    <Wallet className={`h-3 w-3 ${wallet ? 'text-white' : 'text-(--color-brand-blue)'}`} />
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-[7px] font-black uppercase tracking-widest opacity-70">
                                                        {t('common.wallet')}
                                                    </div>
                                                    <div className="font-black text-[10px]">
                                                        {wallet ? formattedAddress : t('common.connect_wallet')}
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

                                <DrawerSettings selection={selection} />
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
