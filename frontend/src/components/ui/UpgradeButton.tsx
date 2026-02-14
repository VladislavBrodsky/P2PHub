import { motion } from 'framer-motion';
import { Crown, CheckCircle2, Sparkles } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';
// import { useNavigate } from 'react-router-dom'; // Removed unused import

interface UpgradeButtonProps {
    onClick?: () => void;
    className?: string;
    showPrice?: boolean;
}

export const UpgradeButton = ({ onClick, className = '', showPrice = true }: UpgradeButtonProps) => {
    const { t } = useTranslation();
    const { user } = useUser();
    const isPro = user?.is_pro;

    const handleClick = () => {
        if (onClick) onClick();
    };

    if (isPro) {
        return (
            <div className={`relative overflow-hidden group rounded-full bg-linear-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-[0.5px] ${className}`}>
                <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />
                <div className="relative flex items-center justify-center gap-2 py-1.5 px-4">
                    <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest whitespace-nowrap">{t('common.pro_active')}</span>
                    <div className="bg-emerald-500/20 p-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            className={`relative w-full group overflow-hidden rounded-full p-[1px] ${className}`}
        >
            {/* Animated Border Gradient */}
            <div className="absolute inset-0 bg-linear-to-r from-amber-400 via-white/80 to-orange-500 animate-[liquid_3s_linear_infinite]"
                style={{ backgroundSize: '200% 100%' }} />

            {/* Inner Content */}
            <div className="relative h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-between px-4 py-3 group-hover:bg-slate-900/5 dark:group-hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-amber-400 blur-md opacity-40 animate-pulse" />
                        <Crown className="w-5 h-5 text-amber-400 fill-amber-400/20 relative z-10" />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                            {t('common.upgrade_pro')}
                            <Sparkles className="w-3 h-3 text-yellow-200 animate-pulse" />
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{t('common.unlock_rewards')}</span>
                    </div>
                </div>

                {showPrice && (
                    <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1 border border-white/5">
                        <span className="text-xs font-bold text-amber-400">$39</span>
                    </div>
                )}
            </div>
        </motion.button>
    );
};
