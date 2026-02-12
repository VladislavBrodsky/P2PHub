import { Share2, QrCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface ReferralWidgetProps {
    onInvite: () => void;
    onShowQR: () => void;
}

export const ReferralWidget = ({ onInvite, onShowQR }: ReferralWidgetProps) => {
    const { t } = useTranslation();

    return (
        <div className="mt-2 mb-8 relative w-full h-14">
            <button
                onClick={onInvite}
                className="w-full h-14 rounded-full flex items-center justify-center gap-3 font-black text-white active:scale-95 transition-all relative overflow-hidden group shadow-xl liquid-blue-premium px-16 will-change-transform"
            >
                <Share2 className="w-5 h-5 relative z-10 opacity-90" />
                <span className="relative z-10 text-base tracking-tight uppercase">{t('referral.widget.invite')}</span>

                {/* Automated Attention Shimmer */}
                <motion.div
                    animate={{
                        x: ['-100%', '200%'],
                    }}
                    transition={{
                        repeat: Infinity,
                        repeatDelay: 3,
                        duration: 1.5,
                        ease: "linear"
                    }}
                    className="absolute inset-0 w-1/2 h-full bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
                />
            </button>
            <button
                onClick={onShowQR}
                className="absolute right-1 top-1 bottom-1 aspect-square flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white/90 transition-all z-20 active:scale-90 shadow-sm"
            >
                <QrCode className="w-5 h-5" />
            </button>
        </div>
    );
};

