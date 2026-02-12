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
                className="w-full h-14 rounded-full flex items-center justify-center gap-2.5 font-black text-white active:scale-95 transition-all relative overflow-hidden group shadow-[0_8px_20px_-5px_rgba(37,99,235,0.5)] bg-blue-600 hover:bg-blue-500 px-16 will-change-transform"
            >
                {/* Background Liquid Effect */}
                <div className="absolute inset-0 bg-linear-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_100%] animate-shimmer opacity-80" />

                <Share2 className="w-5 h-5 relative z-10 opacity-90 group-hover:rotate-12 transition-transform duration-300" />
                <span className="relative z-10 text-[13px] tracking-[0.1em] uppercase">{t('referral.widget.invite')}</span>

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
                    className="absolute inset-0 w-1/3 h-full bg-linear-to-r from-transparent via-white/25 to-transparent skew-x-[-25deg] blur-sm"
                />
            </button>
            <button
                onClick={onShowQR}
                className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white/90 transition-all z-20 active:scale-90 shadow-sm backdrop-blur-sm"
            >
                <QrCode className="w-5 h-5" />
            </button>
        </div>
    );
};

