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
        <div className="mt-2 mb-4 relative w-full h-12">
            <button
                onClick={onInvite}
                className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black text-white active:scale-95 transition-all relative overflow-hidden group shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] bg-indigo-600 hover:brightness-110 will-change-transform"
            >
                {/* Background Liquid Effect */}
                <div className="absolute inset-0 bg-linear-to-r from-indigo-600 via-blue-500 to-purple-600 bg-size-[200%_100%] animate-vibing-gradient opacity-90" />

                <Share2 className="w-5 h-5 relative z-10 opacity-100 group-hover:rotate-12 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                <span className="relative z-10 text-sm tracking-[0.15em] uppercase font-black drop-shadow-sm">{t('referral.widget.invite')}</span>

                {/* Automated Attention Shimmer */}
                <motion.div
                    animate={{
                        x: ['-100%', '300%'],
                    }}
                    transition={{
                        repeat: Infinity,
                        repeatDelay: 2,
                        duration: 1,
                        ease: "circIn"
                    }}
                    className="absolute inset-0 w-1/4 h-full bg-linear-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] blur-md"
                />
            </button>
            <button
                onClick={onShowQR}
                className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all z-20 active:scale-90 shadow-lg backdrop-blur-xl"
                aria-label={t('referral.widget.qr_code_label') || 'Show QR Code'}
            >
                <QrCode className="w-5 h-5 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" />
            </button>
        </div>
    );
});

