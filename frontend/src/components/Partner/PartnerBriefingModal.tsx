import { motion } from 'framer-motion';
import { X, Shield, Target, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { Button } from '../ui/Button';

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
                        3: <span className="text-blue-600 dark:text-blue-400 font-bold italic" />
                    }}
                />
            ),
            color: 'blue'
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
            color: 'purple'
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
            badge: t('referral.brief.antibot_active')
        },
        {
            id: 'motivation',
            icon: Sparkles,
            title: t('referral.brief.motivation_title'),
            content: t('referral.brief.motivation_desc'),
            color: 'emerald'
        }
    ];

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
                {/* Header */}
                <div className="relative p-5 pb-6 bg-white dark:bg-slate-900 z-10 shrink-0">
                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                                    {t('referral.brief.title')}
                                </h2>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
                                    Official Partner Guide
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors active:scale-95"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-5 space-y-4 scrollbar-hide bg-slate-50/50 dark:bg-black/20">
                    {sections.map((section, index) => {
                        const Icon = section.icon;
                        const isRed = section.color === 'red';
                        const colorClass =
                            section.color === 'blue' ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 ring-blue-500/20' :
                                section.color === 'purple' ? 'text-purple-600 dark:text-purple-400 bg-purple-500/10 ring-purple-500/20' :
                                    section.color === 'red' ? 'text-red-600 dark:text-red-400 bg-red-500/10 ring-red-500/20' :
                                        'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 ring-emerald-500/20';

                        return (
                            <motion.div
                                key={section.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`group relative p-4 rounded-2xl border ${isRed
                                    ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200/50 dark:border-red-500/20'
                                    : 'bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/5'
                                    } shadow-sm hover:shadow-md transition-all duration-300`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg ring-1 ${colorClass}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <h3 className={`text-sm font-black tracking-tight uppercase ${isRed ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'
                                            }`}>
                                            {section.title}
                                        </h3>
                                    </div>
                                    {section.badge && (
                                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-[9px] font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                                                {section.badge}
                                            </span>
                                        </span>
                                    )}
                                </div>

                                <div className="pl-[3.25rem]">
                                    {section.content && (
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                            {section.content}
                                        </p>
                                    )}

                                    {section.steps && (
                                        <div className="space-y-3 relative">
                                            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-purple-200 dark:bg-purple-500/20" />
                                            {section.steps.map((step, i) => (
                                                <div key={i} className="relative flex items-start gap-4">
                                                    <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 ring-2 ring-purple-500/20 text-[10px] font-black text-purple-600 dark:text-purple-400 shadow-sm">
                                                        {i + 1}
                                                    </div>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-normal pt-0.5">
                                                        {step}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {section.points && (
                                        <div className="space-y-3">
                                            {section.points.map((point, i) => (
                                                <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-red-100 dark:border-red-500/10">
                                                    <div className="mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full bg-red-500" />
                                                    <div className="space-y-0.5">
                                                        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white/90">
                                                            {point.title}
                                                        </h4>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                                            {point.desc}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 shrink-0 relative z-20 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)]">
                    <Button
                        onClick={onClose}
                        className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 rounded-xl font-black text-sm shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                    >
                        <CheckCircle2 className="w-5 h-5 transition-transform group-hover:scale-110" />
                        <span>{t('referral.brief.cta')}</span>
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};
