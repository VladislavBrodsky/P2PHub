import { Share2, QrCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { memo } from 'react';

interface ReferralWidgetProps {
    onInvite: () => void;
    onShowQR: () => void;
}

export const ReferralWidget = memo(({ onInvite, onShowQR }: ReferralWidgetProps) => {
    const { t } = useTranslation(['social', 'common']);

    return (
        <div className="flex items-center gap-3 w-full lg:m-0 mt-4 mb-6">
            <button
                onClick={onInvite}
                className="flex-1 h-16 rounded-2xl flex items-center justify-start px-4 gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-premium active:scale-[0.98] transition-all relative overflow-hidden group"
            >
                {/* Background Shimmer */}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-blue-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform shrink-0">
                    <Share2 className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex flex-col items-start text-left min-w-0 pr-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none mb-1 truncate w-full">{t('referral.widget.invite')}</span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight truncate w-full">{t('referral.modal.boost_desc').split(' ').slice(0, 3).join(' ')}...</span>
                </div>
            </button>

            <button
                onClick={onShowQR}
                className="w-16 h-16 rounded-2xl flex items-center justify-center bg-btn-secondary-bg border border-btn-secondary-hover text-btn-secondary-text transition-all active:scale-[0.95] hover:bg-btn-secondary-hover shadow-sm"
                aria-label={t('referral.widget.qr_code_label') || 'Show QR Code'}
            >
                <div className="flex flex-col items-center gap-1">
                    <QrCode className="w-5 h-5" />
                    <span className="text-[8px] font-black uppercase tracking-tighter opacity-50">QR</span>
                </div>
            </button>
        </div>
    );
});

