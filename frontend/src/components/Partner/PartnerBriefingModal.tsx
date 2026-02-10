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
        <div className="fixed inset-0 z-100 flex items-center justify-center p-3">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
            >
                {/* Header */}
                <div className="p-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-slate-900 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <BookOpen className="w-3.5 h-3.5" />
                        </div>
                        <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white uppercase">
                            {t('referral.brief.title')}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-3 pb-20 space-y-4 scrollbar-hide">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        const colorClass =
                            section.color === 'blue' ? 'text-blue-500 bg-blue-500/10' :
                                section.color === 'purple' ? 'text-purple-500 bg-purple-500/10' :
                                    section.color === 'red' ? 'text-red-500 bg-red-500/10' :
                                        'text-emerald-500 bg-emerald-500/10';

                        return (
                            <div key={section.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1 rounded-lg ${colorClass}`}>
                                            <Icon className="w-3.5 h-3.5" />
                                        </div>
                                        <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-tight uppercase">
                                            {section.title}
                                        </h3>
                                    </div>
                                    {section.badge && (
                                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-500 border border-red-500/20">
                                            {section.badge}
                                        </span>
                                    )}
                                </div>

                                <div className="pl-7">
                                    {section.content && (
                                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                            {section.content}
                                        </p>
                                    )}

                                    {section.steps && (
                                        <div className="space-y-2">
                                            {section.steps.map((step, i) => (
                                                <div key={i} className="flex items-start gap-2.5">
                                                    <div className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-[9px] font-black text-purple-600 dark:text-purple-400">
                                                        {i + 1}
                                                    </div>
                                                    <p className="text-[12px] text-slate-600 dark:text-slate-400 font-medium leading-tight">
                                                        {step}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {section.points && (
                                        <div className="space-y-2.5">
                                            {section.points.map((point, i) => (
                                                <div key={i} className="space-y-0.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1 h-1 rounded-full bg-red-500/50" />
                                                        <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white/80">
                                                            {point.title}
                                                        </h4>
                                                    </div>
                                                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-snug">
                                                        {point.desc}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 backdrop-blur-xl shrink-0">
                    <Button
                        onClick={onClose}
                        className="w-full h-11 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-blue-50 rounded-xl font-black text-xs shadow-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        {t('referral.brief.cta')}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};
