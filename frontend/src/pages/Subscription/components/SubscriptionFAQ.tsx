import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { SectionHeader } from '../../../components/ui/SectionHeader';

interface FAQItem {
    icon: any;
    iconColor: string;
    q: string;
    a: string;
}

interface SubscriptionFAQProps {
    faqs: FAQItem[];
    expandedFaq: number | null;
    setExpandedFaq: (idx: number | null) => void;
    selection: () => void;
    t: any;
}

export const SubscriptionFAQ = React.memo(({
    faqs,
    expandedFaq,
    setExpandedFaq,
    selection,
    t
}: SubscriptionFAQProps) => {
    return (
        <section className="mb-10 pt-32">
            <SectionHeader
                badge={t('subscription.faq.teaser_badge')}
                title={<>{t('subscription.faq.header_pre')} <span className="text-blue-600 dark:text-blue-400">{t('subscription.faq.header_highlight')}</span></>}
                className="mb-8"
            />
            <div className="space-y-3">
                {faqs.map((faq, idx) => (
                    <div key={idx} className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/10 rounded-xl overflow-hidden shadow-sm transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
                        <button
                            onClick={() => { selection(); setExpandedFaq(expandedFaq === idx ? null : idx); }}
                            className="w-full p-4 flex items-center justify-between group text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-[1rem] bg-white dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm ${faq.iconColor}`}>
                                    <faq.icon size={16} />
                                </div>
                                <span className="text-label font-bold text-slate-900 dark:text-white uppercase tracking-tight pr-4">{faq.q}</span>
                            </div>
                            <ChevronDown size={14} className={`transition-transform duration-300 shrink-0 ${expandedFaq === idx ? 'rotate-180 text-blue-500' : 'text-slate-400 dark:text-white/30'}`} />
                        </button>
                        <AnimatePresence>
                            {expandedFaq === idx && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <p className="px-5 pb-5 pt-3 text-label text-slate-600 dark:text-white/60 leading-relaxed font-medium border-t border-slate-200/50 dark:border-white/10">{faq.a}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </section>
    );
});

SubscriptionFAQ.displayName = 'SubscriptionFAQ';
