import { motion } from 'framer-motion';
// #comment: Removed unused Star and CheckCircle2 icons from lucide-react
// #comment: Removed unused Crown icon from lucide-react to clean up the import list
import { Trophy, Zap, Users } from 'lucide-react';
import { getRank, getXPProgress, getRankGradient } from '../../utils/ranking';
import { useUser } from '../../context/UserContext';
// #comment: Removed unused Trans import from react-i18next
import { useTranslation } from 'react-i18next';

// #comment: Removed unused onUpgrade prop to simplify component interface and clean up code
export const EarnHeader = () => {
    const { t } = useTranslation();
    const { user } = useUser();

    // Fallback or use real user data
    const level = user?.level || 1;
    const xp = user?.xp || 0;
    const rank = getRank(level);
    const progress = getXPProgress(level, xp);

    return (
        <section className="mb-0 relative overflow-hidden rounded-[2rem] glass-panel border border-white/10 p-1 shadow-2xl z-30 transform-gpu">
            {/* Immersive Mesh Background */}
            <div className="absolute inset-0 bg-linear-to-br from-blue-600/10 via-purple-600/5 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-4 bg-white/2 backdrop-blur-3xl rounded-[1.9rem] p-5 border border-white/5">

                <div className="flex items-center justify-between w-full gap-4 pt-2">
                    {/* Level Circle - Compact */}
                    <div className="relative flex flex-col items-center justify-center shrink-0">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full -rotate-90 scale-95">
                                <defs>
                                    <linearGradient id="crystalGradientHeader" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#94A3B8" />
                                        <stop offset="50%" stopColor="#F1F5F9" />
                                        <stop offset="100%" stopColor="#94A3B8" />
                                    </linearGradient>
                                </defs>
                                <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                                <motion.circle
                                    cx="48" cy="48" r="42" fill="none"
                                    stroke="url(#crystalGradientHeader)"
                                    strokeWidth="6"
                                    strokeDasharray="264"
                                    strokeDashoffset={264 - (264 * progress.percent) / 100}
                                    strokeLinecap="round"
                                    initial={{ strokeDashoffset: 264 }}
                                    animate={{ strokeDashoffset: 264 - (264 * progress.percent) / 100 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                            </svg>
                            <div className="relative z-10 flex flex-col items-center justify-center">
                                <span className="text-[8px] font-black text-text-secondary uppercase tracking-widest">{t('earn_header.level')}</span>
                                <span className="text-3xl font-black text-text-primary leading-none">{level}</span>
                            </div>
                        </div>

                        {/* Rank Badge - Compact */}
                        <div className={`mt-2 px-3 py-1 rounded-full border border-white/20 shadow-lg backdrop-blur-xl z-20 bg-linear-to-r text-white ${getRankGradient(level)}`}>
                            <div className="flex items-center gap-1">
                                <Trophy className="w-2.5 h-2.5" />
                                <span className="text-[8px] font-black uppercase tracking-widest">
                                    {t(`ranks.${rank.name}`)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats and Progress - Right Column */}
                    <div className="flex-1 flex flex-col justify-center space-y-3">
                        {/* XP Stats */}
                        <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between items-baseline">
                                <span className="text-[8px] font-black text-text-secondary uppercase tracking-widest">{t('earn_header.xp_progress')}</span>
                                <span className="text-[10px] font-black text-text-primary italic">{progress.current} / {progress.total} XP</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200/30 dark:bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress.percent}%` }}
                                    transition={{ duration: 1.5, ease: "backOut" }}
                                    className={`h-full rounded-full bg-linear-to-r ${getRankGradient(level)} shadow-[0_0_10px_rgba(59,130,246,0.3)]`}
                                />
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-2 flex flex-col items-start gap-0.5">
                                <div className="flex items-center gap-1">
                                    <Users className="w-2.5 h-2.5 text-yellow-400" />
                                    <span className="text-[7px] font-black text-text-secondary uppercase tracking-widest">{t('earn_header.partners')}</span>
                                </div>
                                <span className="text-sm font-black text-text-primary">{user?.total_network_size || 0}</span>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-2 flex flex-col items-start gap-0.5">
                                <div className="flex items-center gap-1">
                                    <Zap className="w-2.5 h-2.5 text-emerald-400" />
                                    <span className="text-[7px] font-black text-text-secondary uppercase tracking-widest">{t('earn_header.total_xp')}</span>
                                </div>
                                <span className="text-sm font-black text-text-primary">{xp}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
