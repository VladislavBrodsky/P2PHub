import { motion } from 'framer-motion';
import { Crown, CheckCircle2, Sparkles } from 'lucide-react';
import { useUser } from '../../context/UserContext';
// import { useNavigate } from 'react-router-dom'; // Removed unused import

interface UpgradeButtonProps {
    onClick?: () => void;
    className?: string;
    showPrice?: boolean;
}

export const UpgradeButton = ({ onClick, className = '', showPrice = true }: UpgradeButtonProps) => {
    const { user } = useUser();
    const isPro = user?.is_pro;

    const handleClick = () => {
        if (onClick) onClick();
    };

    if (isPro) {
        return (
            <div className={`relative overflow-hidden group rounded-xl bg-linear-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-1 ${className}`}>
                <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />
                <div className="relative flex items-center justify-center gap-2 py-2.5 px-4">
                    <Crown className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                    <span className="text-xs font-black text-amber-500 uppercase tracking-widest">PRO Active</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
            </div>
        );
    }

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            className={`relative w-full group overflow-hidden rounded-xl p-px ${className}`}
        >
            {/* Animated Border Gradient */}
            <div className="absolute inset-0 bg-linear-to-r from-amber-400 via-yellow-200 to-orange-500 animate-shimmer"
                style={{ backgroundSize: '200% 200%' }} />

            {/* Inner Content */}
            <div className="relative h-full bg-slate-900 rounded-[0.7rem] flex items-center justify-between px-4 py-3 group-hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-amber-400 blur-md opacity-40 animate-pulse" />
                        <Crown className="w-5 h-5 text-amber-400 fill-amber-400/20 relative z-10" />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                            Upgrade to PRO
                            <Sparkles className="w-3 h-3 text-yellow-200 animate-pulse" />
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">Unlock 2x Rewards & Perks</span>
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
