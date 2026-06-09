import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PartnerBriefingModal } from '../PartnerBriefingModal';
import { ProWelcomeCard } from '../ProWelcomeCard';
import { FinanceStatsModal } from '../FinanceStatsModal';
import { NetworkExplorer } from '../NetworkExplorer';
import { Button } from '../../ui/Button';
import { useTranslation } from 'react-i18next';

interface DashboardModalsProps {
    isBriefingOpen: boolean;
    setIsBriefingOpen: (open: boolean) => void;
    isProWelcomeOpen: boolean;
    handleCloseProWelcome: () => void;
    isFinanceOpen: boolean;
    setIsFinanceOpen: (open: boolean) => void;
    isExplorerOpen: boolean;
    setIsExplorerOpen: (open: boolean) => void;
    isQrOpen: boolean;
    setIsQrOpen: (open: boolean) => void;
    totalNetworkSize: number;
    qrImageUrl: string;
    referralLink: string;
}

export const DashboardModals: React.FC<DashboardModalsProps> = React.memo(({
    isBriefingOpen,
    setIsBriefingOpen,
    isProWelcomeOpen,
    handleCloseProWelcome,
    isFinanceOpen,
    setIsFinanceOpen,
    isExplorerOpen,
    setIsExplorerOpen,
    isQrOpen,
    setIsQrOpen,
    totalNetworkSize,
    qrImageUrl,
    referralLink
}) => {
    const { t } = useTranslation(['social', 'common']);

    const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isClient = typeof document !== 'undefined';

    return (
        <>
            <PartnerBriefingModal isOpen={isBriefingOpen} onClose={() => setIsBriefingOpen(false)} />
            <ProWelcomeCard isOpen={isProWelcomeOpen} onClose={handleCloseProWelcome} />

            <AnimatePresence>
                {isFinanceOpen && (
                    <FinanceStatsModal isOpen={isFinanceOpen} onClose={() => setIsFinanceOpen(false)} />
                )}
            </AnimatePresence>

            {/* Network Explorer Overlay */}
            <AnimatePresence>
                {(isExplorerOpen && isClient) && createPortal(
                    <div className="fixed inset-0 z-9999 flex items-stretch lg:items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsExplorerOpen(false)}
                        />
                        <motion.div
                            initial={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%', opacity: 0 }}
                            animate={isDesktop ? { scale: 1, opacity: 1 } : { y: 0, opacity: 1 }}
                            exit={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                            className="w-full max-w-lg mx-auto relative z-10 flex flex-col lg:max-h-[85vh] lg:rounded-3xl lg:overflow-hidden lg:my-8"
                        >
                            <NetworkExplorer onClose={() => setIsExplorerOpen(false)} initialTotalCount={totalNetworkSize} />
                        </motion.div>
                    </div>,
                    document.body
                )}
            </AnimatePresence>

            {/* QR Code Modal */}
            <AnimatePresence>
                {(isQrOpen && isClient) && createPortal(
                    <div key="qr-modal-root" className="fixed inset-0 z-9999 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsQrOpen(false)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={isDesktop ? { scale: 0.95, opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
                            animate={isDesktop ? { scale: 1, opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                            exit={isDesktop ? { scale: 0.95, opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
                            className="relative z-10 w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-white/10 overflow-hidden"
                            style={{ 
                                transform: 'translateZ(0)',
                                backfaceVisibility: 'hidden'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="text-center space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                        {t('partner_dashboard.qr_modal_title')}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider opacity-80">
                                        {t('partner_dashboard.qr_modal_desc')}
                                    </p>
                                </div>

                                <div className="aspect-square bg-white rounded-2xl p-4 flex items-center justify-center border border-slate-100 dark:border-white/5 shadow-inner">
                                    {qrImageUrl ? (
                                        <img src={qrImageUrl} alt="My QR Code" className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                                    ) : (
                                        <div className="animate-pulse w-full h-full bg-slate-200 rounded-xl" />
                                    )}
                                </div>

                                <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 text-center">
                                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 break-all opacity-70">
                                        {referralLink}
                                    </p>
                                </div>

                                <Button
                                    variant="secondary"
                                    className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold uppercase tracking-widest text-xs"
                                    onClick={() => setIsQrOpen(false)}
                                >
                                    {t('close')}
                                </Button>
                            </div>
                        </motion.div>
                    </div>,
                    document.body
                )}
            </AnimatePresence>
        </>
    );
});

DashboardModals.displayName = 'DashboardModals';
