import { AcademyCareerStair } from './AcademyCareerStair';
import { Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUI } from '../../context/UIContext';
import { useTranslation, Trans } from 'react-i18next';

export const PartnerAcademy = () => {
    const { isFooterVisible, isKeyboardOpen } = useUI();
    const { t } = useTranslation(['academy', 'common']);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pt-4">
            {/* Academy Elite Header */}
            <div className="relative group overflow-hidden rounded-2xl p-1 shadow-xl">
                <div className="absolute inset-0 branding-liquid-gradient opacity-95 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 vibing-blue-animated opacity-10" />

                <div className="relative z-10 glass-panel-premium rounded-[1.8rem] border-white/20 p-4 overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 blur-[80px] rounded-full animate-pulse" />
                    <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-indigo-500/20 blur-[60px] rounded-full" />

                    <div className="relative z-20 flex flex-col items-center text-center space-y-5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/10 dark:bg-white/10 backdrop-blur-md border border-slate-900/10 dark:border-white/10 text-label font-bold uppercase tracking-[0.15em] text-blue-800 dark:text-white">
                            <Sparkles className="w-3 h-3" />
                            {t('academy.hero_badge')}
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-xl font-bold leading-none tracking-tight text-slate-900 dark:text-white uppercase italic drop-shadow-sm">
                                {t('academy.hero_title_1')} <span className="bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent drop-shadow-md">{t('academy.hero_title_2')}</span>
                            </h2>
                            <p className="text-slate-700 dark:text-slate-300 text-label font-bold leading-relaxed max-w-[260px] mx-auto opacity-90 uppercase tracking-wide drop-shadow-sm">
                                <Trans i18nKey="academy.hero_desc">
                                    Master the step-by-step income system <span className="text-blue-800 dark:text-blue-100 font-bold">$1 per minute</span> with AI.
                                </Trans>
                            </p>
                        </div>

                        <div className="flex items-center gap-4 pt-1">
                            <div className="flex flex-col items-center">
                                <span className="text-label font-bold text-slate-900 dark:text-white">100</span>
                                <span className="text-label font-bold text-slate-600 dark:text-blue-100/60 uppercase tracking-widest">{t('academy.stat_levels')}</span>
                            </div>
                            <div className="w-px h-4 bg-slate-900/10 dark:bg-white/10" />
                            <div className="flex flex-col items-center">
                                <span className="text-label font-bold text-blue-600 dark:text-blue-400">20+</span>
                                <span className="text-label font-bold text-slate-600 dark:text-blue-100/60 uppercase tracking-widest">{t('academy.stat_free')}</span>
                            </div>
                            <div className="w-px h-4 bg-slate-900/10 dark:bg-white/10" />
                            <div className="flex flex-col items-center">
                                <span className="text-label font-bold text-orange-600 dark:text-orange-400">{t('common:navigation.pro')}</span>
                                <span className="text-label font-bold text-slate-600 dark:text-blue-100/60 uppercase tracking-widest">{t('academy.stat_elite')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* The 100-Stage Path Container */}
            <div className="relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-linear-to-b from-blue-500/20 via-slate-200 dark:via-white/5 to-transparent -z-10" />

                <div className="mb-6 flex justify-center px-2">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel-premium overflow-visible! rounded-full p-1 border-white/20 shadow-xl flex items-center justify-between gap-2 bg-white/50 dark:bg-slate-900/40 backdrop-blur-3xl ring-1 ring-white/10 w-fit"
                    >
                        <div className="flex items-center gap-1.5 pl-1">
                            <div className="w-7 h-7 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ring-1 ring-white/30 text-white shrink-0">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <div className="flex items-baseline gap-1.5 overflow-hidden">
                                <span className="text-[8px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest whitespace-nowrap opacity-80">{t('academy.global_ranking')}</span>
                                <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase leading-none tracking-tight whitespace-nowrap">{t('academy.footer_rank')}</span>
                            </div>
                        </div>

                        <div className="px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-500 dark:text-orange-400 text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-[inset_0_1px_8px_rgba(249,115,22,0.1)] mr-0.5 shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                            {t('academy.footer_status')}
                        </div>
                    </motion.div>
                </div>

                <AcademyCareerStair />
            </div>


            {/* Bottom Spacing - significantly reduced to avoid compounding with main Layout padding */}
            <div className="h-6 pointer-events-none" />
        </div>
    );
};
