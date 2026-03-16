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
        <div className="mt-4 mb-6 flex items-center gap-3">
            <button
                onClick={onInvite}
                className="flex-1 h-16 rounded-2xl flex items-center justify-center gap-4 bg-slate-900 border border-white/10 shadow-xl active:scale-[0.98] transition-all relative overflow-hidden group"
            >
                {/* Background Shimmer */}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                    <Share2 className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex flex-col items-start">
                    <span className="text-xs font-black text-white uppercase tracking-widest leading-none mb-1">{t('referral.widget.invite')}</span>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-tight">{t('referral.modal.boost_desc').split(' ').slice(0, 3).join(' ')}...</span>
                </div>
            </button>

            <button
                onClick={onShowQR}
                className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white transition-all active:scale-[0.95] hover:bg-white/10 shadow-sm"
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

