import React from 'react';
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
                {isExplorerOpen && (
                    <div className="fixed inset-0 z-1000 flex items-stretch justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsExplorerOpen(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                            className="w-full max-w-lg mx-auto relative z-10 flex flex-col"
                        >
                            <NetworkExplorer onClose={() => setIsExplorerOpen(false)} initialTotalCount={totalNetworkSize} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* QR Code Modal */}
            {isQrOpen && (
                <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsQrOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-xs space-y-4 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="text-center space-y-1">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('partner_dashboard.qr_modal_title')}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{t('partner_dashboard.qr_modal_desc')}</p>
                        </div>

                        <div className="aspect-square bg-white rounded-2xl p-4 flex items-center justify-center border border-slate-100 dark:border-white/5 shadow-inner">
                            {qrImageUrl ? (
                                <img src={qrImageUrl} alt="My QR Code" className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                            ) : (
                                <div className="animate-pulse w-full h-full bg-slate-200 rounded-xl" />
                            )}
                        </div>

                        <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 text-center">
                            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 break-all">{referralLink}</p>
                        </div>

                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => setIsQrOpen(false)}
                        >
                            {t('close')}
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
});

DashboardModals.displayName = 'DashboardModals';
