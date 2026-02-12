import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Target, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { Button } from '../ui/Button';
import { createPortal } from 'react-dom';

interface PartnerBriefingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PartnerBriefingModal = ({ isOpen, onClose }: PartnerBriefingModalProps) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    const sections = [
        {
            id: 'mission',
            icon: Target,
            title: t('referral.brief.goal_title'),
            content: (
                <Trans
                    i18nKey="referral.brief.goal_desc"
                    components={{
                        1: <span className="text-slate-900 dark:text-white font-black" />,
                        3: <span className="text-blue-500 dark:text-blue-400 font-bold italic" />
                    }}
                />
            ),
            color: 'blue',
            glow: 'rgba(59, 130, 246, 0.15)'
        },
        {
            id: 'manual',
            icon: BookOpen,
            title: t('referral.brief.manual_title'),
            steps: [
                t('referral.brief.manual_step_1'),
                t('referral.brief.manual_step_2'),
                t('referral.brief.manual_step_3')
            ],
            color: 'purple',
            glow: 'rgba(168, 85, 247, 0.15)'
        },
        {
            id: 'rules',
            icon: Shield,
            title: t('referral.brief.rules_title'),
            points: [
                {
                    title: t('referral.brief.rule_1_title'),
                    desc: t('referral.brief.rule_1_desc')
                },
                {
                    title: t('referral.brief.rule_2_title'),
                    desc: t('referral.brief.rule_2_desc')
                }
            ],
            color: 'red',
            badge: t('referral.brief.antibot_active'),
            glow: 'rgba(239, 68, 68, 0.1)'
        },
        {
            id: 'motivation',
            icon: Sparkles,
            title: t('referral.brief.motivation_title'),
            content: t('referral.brief.motivation_desc'),
            color: 'emerald',
            glow: 'rgba(16, 185, 129, 0.15)'
        }
    ];

    return createPortal(
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            {/* Backdrop with enhanced blur */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-lg bg-white/95 dark:bg-slate-900/95 rounded-[2.5rem] border border-white/20 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-2xl"
            >
                {/* Background Decoration Glows */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] pointer-events-none" />

                {/* Header */}
                <div className="relative p-6 pb-4 bg-white/50 dark:bg-slate-900/50 z-10 shrink-0">
                    <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 shadow-blue-500/10 shadow-lg">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                                    {t('referral.brief.title')}
                                </h2>
                                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mt-1.5 opacity-70">
                                    {t('referral.brief.guide')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-all active:scale-95"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-5 space-y-4 scrollbar-hide flex-1 relative z-10">
                    <AnimatePresence>
                        {sections.map((section, index) => {
                            const Icon = section.icon;
                            const isRed = section.color === 'red';
                            const colors = {
                                blue: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
                                purple: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
                                red: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20',
                                emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            };

                            return (
                                <motion.div
                                    key={section.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 + index * 0.1, type: 'spring', damping: 20 }}
                                    className={`group relative p-4 rounded-2xl border transition-all duration-300 ${isRed
                                        ? 'bg-red-50/50 dark:bg-red-950/20 border-red-500/30 dark:border-red-500/20 shadow-red-500/5 shadow-inner'
                                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-slate-800/60'
                                        }`}
                                    style={{
                                        boxShadow: `0 0 20px -10px ${section.glow}`
                                    }}
                                >
                                    {/* Section Header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg border shadow-sm transition-transform group-hover:scale-110 ${colors[section.color as keyof typeof colors]}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <h3 className={`text-[11px] font-black tracking-widest uppercase ${isRed ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'
                                                }`}>
                                                {section.title}
                                            </h3>
                                        </div>
                                        {section.badge && (
                                            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/20 backdrop-blur-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                <span className="text-[9px] font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                                                    {section.badge}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Section Content */}
                                    <div className="pl-11 pr-2">
                                        {section.content && (
                                            <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                                                {section.content}
                                            </p>
                                        )}

                                        {section.steps && (
                                            <div className="space-y-3 pt-1">
                                                {section.steps.map((step, i) => (
                                                    <div key={i} className="group/step relative flex items-start gap-4">
                                                        <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-purple-500/30 text-[10px] font-black text-purple-600 dark:text-purple-400 shadow-sm transition-transform group-hover/step:translate-x-1">
                                                            0{i + 1}
                                                        </div>
                                                        <p className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-normal pt-1 transition-colors group-hover/step:text-slate-900 dark:group-hover/step:text-white">
                                                            {step}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {section.points && (
                                            <div className="space-y-2.5 pt-1">
                                                {section.points.map((point, i) => (
                                                    <div key={i} className="relative p-3 rounded-xl bg-white/40 dark:bg-black/20 border border-red-500/10 group-hover:border-red-500/20 transition-all overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500/20" />
                                                        <div className="flex gap-2.5 items-start">
                                                            <div className="mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full bg-red-500" />
                                                            <div className="space-y-0.5">
                                                                <h4 className="text-[10px] font-black uppercase tracking-wider text-red-700 dark:text-red-400 leading-tight">
                                                                    {point.title}
                                                                </h4>
                                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold leading-normal italic opacity-80">
                                                                    {point.desc}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Footer CTA */}
                <div className="p-6 pt-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5 shrink-0 relative z-20">
                    <Button
                        onClick={onClose}
                        className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-blue-50 rounded-[1.25rem] font-black text-sm shadow-2xl hover:scale-[1.01] active:scale-[0.98] transition-all relative overflow-hidden group"
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 dark:via-blue-500/20 to-transparent -translate-x-full group-hover:animate-shimmer-slide pointer-events-none" />

                        <div className="flex items-center justify-center gap-3 relative z-10 tracking-widest uppercase">
                            <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform text-blue-500" />
                            <span>{t('referral.brief.cta')}</span>
                        </div>
                    </Button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};
