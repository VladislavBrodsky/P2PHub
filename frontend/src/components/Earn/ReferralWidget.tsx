import { Share2, QrCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface ReferralWidgetProps {
    onInvite: () => void;
    onShowQR: () => void;
}

export const ReferralWidget = ({ onInvite, onShowQR }: ReferralWidgetProps) => {
    const { t } = useTranslation(['social', 'common']);

    return (
        <div className="mt-2 mb-4 relative w-full h-12">
            <button
                onClick={onInvite}
                className="w-full h-12 rounded-2xl flex items-center justify-center gap-2.5 font-black text-white active:scale-95 transition-all relative overflow-hidden group shadow-premium bg-brand-blue hover:brightness-110 will-change-transform"
            >
                {/* Background Liquid Effect */}
                <div className="absolute inset-0 bg-linear-to-r from-brand-blue via-indigo-600 to-brand-blue bg-size-[200%_100%] animate-shimmer opacity-80" />

                <Share2 className="w-5 h-5 relative z-10 opacity-90 group-hover:rotate-12 transition-transform duration-300" />
                <span className="relative z-10 text-caption tracking-widest uppercase font-black">{t('referral.widget.invite')}</span>

                {/* Automated Attention Shimmer */}
                <motion.div
                    animate={{
                        x: ['-100%', '200%'],
                    }}
                    transition={{
                        repeat: Infinity,
                        repeatDelay: 3.5,
                        duration: 1.2,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-0 w-1/3 h-full bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] blur-sm"
                />
            </button>
            <button
                onClick={onShowQR}
                className="absolute right-1 top-1 bottom-1 aspect-square flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 rounded-[14px] text-white/90 transition-all z-20 active:scale-90 shadow-sm backdrop-blur-sm"
                aria-label={t('referral.widget.qr_code_label') || 'Show QR Code'}
            >
                <QrCode className="w-4 h-4" />
            </button>
        </div>
    );
};

