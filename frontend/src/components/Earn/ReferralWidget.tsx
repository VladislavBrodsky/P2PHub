import { Share2, QrCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReferralWidgetProps {
    onInvite: () => void;
    onShowQR: () => void;
}

export const ReferralWidget = ({ onInvite, onShowQR }: ReferralWidgetProps) => {
    const { t } = useTranslation();

    return (
        <div className="mb-8 relative">
            <button
                onClick={onInvite}
                className="w-full h-14 bg-linear-to-r from-blue-600 to-blue-500 rounded-full flex items-center justify-center gap-2 font-black text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-transform relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Share2 className="w-5 h-5 relative z-10" />
                <span className="relative z-10">{t('referral.widget.invite')}</span>
            </button>
            <button
                onClick={onShowQR}
                className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white/80 transition-colors"
            >
                <QrCode className="w-5 h-5" />
            </button>
        </div>
    );
};
