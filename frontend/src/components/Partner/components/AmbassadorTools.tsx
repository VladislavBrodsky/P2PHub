import React from 'react';
import { QrCode, Copy, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AmbassadorToolsProps {
    referralLink: string;
    copied: boolean;
    selection: () => void;
    setIsQrOpen: (open: boolean) => void;
    copyLink: () => void;
}

export const AmbassadorTools: React.FC<AmbassadorToolsProps> = React.memo(({
    referralLink,
    copied,
    selection,
    setIsQrOpen,
    copyLink
}) => {
    const { t } = useTranslation(['social', 'common']);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-slate-900 dark:text-white text-base font-bold">{t('partner_dashboard.ambassador_tools')}</h2>
            </div>

            <div className="space-y-2">
                {/* QR Code Row with Modal Trigger */}
                <div
                    className="group relative rounded-[1.25rem] border border-slate-200 dark:border-white/5 bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl p-4 shadow-sm dark:shadow-premium flex items-center justify-between hover:bg-white dark:hover:bg-slate-800/60 transition-all active:scale-[0.98] cursor-pointer overflow-hidden"
                    onClick={() => { selection(); setIsQrOpen(true); }}
                >
                    <div className="absolute inset-0 bg-linear-to-r from-blue-500/0 via-blue-500/0 to-blue-500/5 dark:to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:scale-110 transition-all duration-300">
                            <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">{t('partner_dashboard.qr_title')}</span>
                            <span className="text-label font-bold text-slate-500 dark:text-slate-400 opacity-80">{t('partner_dashboard.qr_desc')}</span>
                        </div>
                    </div>
                    <div className='w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-full text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-all'>
                        <ExternalLink className="w-4 h-4" />
                    </div>
                </div>

                {/* Referral Link Row */}
                <div className="group relative rounded-[1.25rem] border border-slate-200 dark:border-white/5 bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl p-4 shadow-sm dark:shadow-premium flex items-center justify-between hover:bg-white dark:hover:bg-slate-800/60 transition-all active:scale-[0.98] overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-r from-purple-500/0 via-purple-500/0 to-purple-500/5 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-center gap-4 overflow-hidden relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 group-hover:scale-110 transition-all duration-300 shrink-0">
                            <div className="w-5 h-5 flex items-center justify-center text-base">🔗</div>
                        </div>
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                            <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">{t('partner_dashboard.link_title')}</span>
                            <span className="text-label text-slate-500 dark:text-slate-400 truncate max-w-[180px] font-mono font-medium opacity-60 leading-none py-0.5">{referralLink}</span>
                        </div>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); copyLink(); }}
                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-purple-500 active:scale-90 transition-all bg-slate-100 dark:bg-white/5 hover:bg-purple-500/10 rounded-full relative z-10"
                    >
                        {copied ? (
                            <div className="animate-in zoom-in spin-in-180 duration-300 text-emerald-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                        ) : (
                            <Copy className="w-4 h-4 transition-all" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
});

AmbassadorTools.displayName = 'AmbassadorTools';
