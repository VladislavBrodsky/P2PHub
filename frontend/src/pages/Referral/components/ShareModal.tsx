import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, ExternalLink, Copy } from 'lucide-react';
import { Trans } from 'react-i18next';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    t: any;
    viralHook: string;
    viralSubtitle: string;
    handleShareTelegram: () => void;
    handleShareViralCard: () => void;
    handleNativeShare: () => void;
    handleCopyLink: () => void;
}

export const ShareModal = ({
    isOpen,
    onClose,
    t,
    viralHook,
    viralSubtitle,
    handleShareTelegram,
    handleShareViralCard,
    handleNativeShare,
    handleCopyLink
}: ShareModalProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center sm:p-4 px-0 py-0">
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                    />
                    <m.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="w-full sm:max-w-sm bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl relative shadow-2xl overflow-hidden flex flex-col max-h-[90vh] pb-[calc(var(--spacing-safe-bottom,20px)+16px)]"
                    >
                        {/* Header / Close */}
                        <div className="absolute top-4 right-4 z-50">
                            <button
                                onClick={onClose}
                                className="w-8 h-8 bg-black/10 dark:bg-white/10 backdrop-blur-md rounded-full text-slate-900 dark:text-white flex items-center justify-center hover:scale-105 transition-transform"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pointer-events-auto overscroll-none" style={{ overscrollBehavior: 'none' }}>
                            {/* Visual Header */}
                            <div className="relative h-40 sm:h-44 shrink-0 overflow-hidden">
                                <div className="absolute inset-0 bg-linear-to-br from-blue-900 via-slate-900 to-cyan-900" />
                                <img
                                    src="/images/v3_referral_promo.jpg"
                                    alt={t('referral.modal.invite_image_alt')}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                                <div className="absolute inset-0 bg-linear-to-b from-transparent to-white dark:to-slate-900 z-10" />
                                <div className="absolute bottom-3 left-5 z-20 right-5">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <span className="px-2 py-0.5 rounded-md bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-label font-bold text-blue-400 uppercase tracking-widest">
                                            {t('referral.modal.limited_tier')}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white tracking-tighter leading-none drop-shadow-sm">
                                        {t('referral.modal.recruit_title')}
                                    </h3>
                                </div>
                            </div>

                            <div className="px-6 pb-6 space-y-5">
                                {/* Viral Hook Card */}
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative z-10">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-2">
                                            {viralHook}
                                        </h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                                            {viralSubtitle}
                                        </p>
                                    </div>
                                </div>

                                {/* Quick Actions Grid */}
                                <div className="grid grid-cols-1 gap-2.5">
                                    <button
                                        onClick={handleShareTelegram}
                                        className="w-full h-11 rounded-xl flex items-center justify-center gap-3 bg-linear-to-r from-[#2AABEE] to-[#229ED9] text-white font-bold text-base shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Send className="w-4 h-4 -rotate-45 mb-0.5" />
                                        <span className="text-sm">{t('referral.modal.share_telegram')}</span>
                                    </button>

                                    <div className="grid grid-cols-2 gap-2">
                                        {(window as any).Telegram?.WebApp && (
                                            <button
                                                onClick={handleShareViralCard}
                                                className="h-10 rounded-xl flex items-center justify-center gap-2 bg-blue-50 dark:bg-slate-800/80 backdrop-blur-md text-blue-600 dark:text-blue-400 font-bold text-caption border border-blue-100 dark:border-white/10 active:scale-[0.98] transition-all shadow-sm"
                                            >
                                                <Sparkles className="w-3.5 h-3.5" />
                                                <span>{t('referral.modal.viral_btn')}</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={handleNativeShare}
                                            className={`h-10 rounded-xl flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-md text-slate-700 dark:text-slate-300 font-bold text-caption border border-slate-200/50 dark:border-white/10 active:scale-[0.98] transition-all shadow-sm ${!(window as any).Telegram?.WebApp ? 'col-span-2' : ''}`}
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            <span>{t('referral.modal.share_more')}</span>
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleCopyLink}
                                        className="h-8 rounded-lg flex items-center justify-center gap-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold text-sm active:scale-95 transition-all"
                                    >
                                        <Copy className="w-4 h-4" />
                                        <span>{t('referral.modal.copy_link')}</span>
                                    </button>
                                </div>

                                {/* Footer Info */}
                                <div className="text-center pb-2">
                                    <p className="text-label text-slate-400 font-medium">
                                        <Trans t={t} i18nKey="referral.modal.boost_desc" ns="social">
                                            Each referral boosts your Viral Network and moves you closer to the <span className="text-slate-900 dark:text-white font-bold">$1 per minute strategy</span>
                                        </Trans>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </m.div>
                </div>
            )}
        </AnimatePresence>
    );
};
