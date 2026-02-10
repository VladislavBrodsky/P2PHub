import { Share2, QrCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReferralWidgetProps {
    onInvite: () => void;
    onShowQR: () => void;
}

export const ReferralWidget = ({ onInvite, onShowQR }: ReferralWidgetProps) => {
    const { t } = useTranslation();

    return (
        <div className="mt-5 mb-6 relative w-full">
            <button
                onClick={onInvite}
                className="w-full h-12 rounded-full flex items-center justify-center gap-2 font-black text-white active:scale-95 transition-all relative overflow-hidden group shadow-xl liquid-blue-premium pl-14 pr-14"
            >
                <Share2 className="w-5 h-5 relative z-10 opacity-90" />
                <span className="relative z-10 text-base tracking-tight">{t('referral.widget.invite')}</span>

                {/* Subtle Glass Shimmer overlay */}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
            <button
                onClick={onShowQR}
                className="absolute right-1 top-1 bottom-1 aspect-square flex items-center justify-center bg-black/10 hover:bg-black/20 rounded-full text-white/80 transition-all z-20 active:scale-90"
            >
                <QrCode className="w-5 h-5" />
            </button>
        </div>
    );
};
