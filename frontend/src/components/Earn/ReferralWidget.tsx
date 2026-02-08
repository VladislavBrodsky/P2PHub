import { Share2, QrCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReferralWidgetProps {
    onInvite: () => void;
    onShowQR: () => void;
}

export const ReferralWidget = ({ onInvite, onShowQR }: ReferralWidgetProps) => {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-2 gap-3 mb-8">
            <button
                onClick={onInvite}
                className="h-14 bg-linear-to-r from-blue-600 to-blue-500 rounded-xl flex items-center justify-center gap-2 font-black text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
            >
                <Share2 className="w-5 h-5" />
                {t('referral.widget.invite')}
            </button>
            <button
                onClick={onShowQR}
                className="h-14 glass-panel hover:bg-white/5 rounded-xl flex items-center justify-center gap-2 font-bold text-(--color-text-primary) active:scale-95 transition-all"
            >
                <QrCode className="w-5 h-5 opacity-60" />
                {t('referral.widget.qr')}
            </button>
        </div>
    );
};
