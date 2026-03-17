import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, Copy, Download } from 'lucide-react';
import { Trans } from 'react-i18next';
import { getApiUrl } from '../../../utils/api';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    t: any;
    referralLink: string;
    handleCopyLink: () => void;
}

export const QRCodeModal = ({
    isOpen,
    onClose,
    t,
    referralLink,
    handleCopyLink
}: QRCodeModalProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <m.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 relative shadow-2xl"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-slate-50 dark:bg-slate-950 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center space-y-6">
                            <div className="space-y-2 pt-2">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-none tracking-tight">
                                    <Trans t={t} i18nKey="referral.qr.title">
                                        Claim Your <br />
                                        <span className="text-blue-600 uppercase italic">Financial Sovereignty</span>
                                    </Trans>
                                </h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    <Trans t={t} i18nKey="referral.qr.desc">
                                        Earn <span className="text-emerald-500 font-bold">$1/minute</span> for every active partner <br />
                                        Build your empire now
                                    </Trans>
                                </p>
                            </div>

                            <div className="mx-auto w-64 h-64 bg-white p-4 rounded-3xl shadow-[0_0_40px_rgba(59,130,246,0.1)] border border-slate-100 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-linear-to-b from-blue-500/0 via-blue-500/10 to-blue-500/0 w-full h-8 blur-md animate-scan pointer-events-none" />
                                <img
                                    src={`${getApiUrl()}/api/tools/qr?url=${encodeURIComponent(referralLink)}&scale=10`}
                                    alt="Your Referral QR Code"
                                    className="w-full h-full object-contain relative z-10"
                                />
                                <div className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-blue-600 rounded-tl-xl" />
                                <div className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-blue-600 rounded-tr-xl" />
                                <div className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-blue-600 rounded-bl-xl" />
                                <div className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-blue-600 rounded-br-xl" />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    className="flex-1 py-3 bg-slate-900/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-sm text-slate-900 dark:text-white flex items-center justify-center gap-2 active:scale-95 transition-all"
                                    onClick={handleCopyLink}
                                >
                                    <Copy className="w-4 h-4" /> {t('referral.qr.copy')}
                                </button>
                                <button
                                    className="flex-1 py-3 bg-blue-600 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = `${getApiUrl()}/api/tools/qr?url=${encodeURIComponent(referralLink)}&scale=20`;
                                        link.download = 'PartnerCenter_Invite.png';
                                        link.click();
                                    }}
                                >
                                    <Download className="w-4 h-4" /> {t('referral.qr.save')}
                                </button>
                            </div>
                        </div>
                    </m.div>
                </div>
            )}
        </AnimatePresence>
    );
};
