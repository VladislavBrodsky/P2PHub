import { m } from 'framer-motion';
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
    const { t } = useTranslation(['common', 'marketing']);
    const { user } = useUser();
    const isPro = user?.is_pro;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClick) onClick();
    };

    if (isPro) {
        return null;
    }

    return (
        <m.button
            whileHover={{ scale: 1.01, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            className={`relative w-full group overflow-hidden rounded-[1.5rem] p-[1.5px] shadow-2xl transition-all duration-500 ${className}`}
        >
            {/* ── Liquid Animated Border ── */}
            <div
                className="absolute inset-x-[-20%] inset-y-[-50%] bg-[conic-gradient(from_0deg,transparent_0%,#fbbf24_25%,transparent_50%,#fbbf24_75%,transparent_100%)] animate-[spin_4s_linear_infinite] opacity-60 group-hover:opacity-100 transition-opacity duration-500"
            />

            {/* ── Main Carbon Glass Body ── */}
            <div className="relative h-full w-full bg-[#0d1117]/95 dark:bg-[#030712]/98 backdrop-blur-2xl rounded-[1.4rem] overflow-hidden">

                {/* Ambient Glows */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-colors" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-orange-600/10 blur-2xl pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between pl-4 pr-3 py-3">

                    {/* Left Section: Icon & Text */}
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Premium Crown Badge */}
                        <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-500">
                            <div className="absolute inset-0 bg-amber-400 blur-xl opacity-20 animate-pulse" />
                            <div className="relative w-9 h-9 rounded-xl bg-linear-to-br from-amber-300 via-amber-500 to-orange-600 flex items-center justify-center shadow-[0_6px_15px_-4px_rgba(245,158,11,0.4)] border border-white/20">
                                <Crown size={18} className="text-white fill-white/10 drop-shadow-md" />
                            </div>
                        </div>

                        {/* Text Container */}
                        <div className="flex flex-col items-start gap-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-[12px] font-black text-white uppercase tracking-widest leading-none drop-shadow-sm whitespace-nowrap">
                                    {t('common.upgrade_pro')}
                                </h3>
                                <Sparkles size={10} className="text-amber-300 animate-pulse shrink-0" />
                            </div>
                            <p className="text-[8px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">
                                {t('common.unlock_rewards')}
                            </p>
                        </div>
                    </div>

                    {/* Right Section: Price Badge */}
                    {showPrice && (
                        <div className="relative group/price shrink-0 ml-2">
                            <div className="absolute inset-0 bg-amber-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative bg-white/5 dark:bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/10 flex items-center justify-center shadow-inner transition-colors">
                                <span className="text-[13px] font-black text-amber-400 tracking-tighter drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]">
                                    $39
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
            </div>
        </m.button>
    );
};

