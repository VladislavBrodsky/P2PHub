import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HelpCircle, Search, ChevronRight, MessageCircle,
    Shield, Zap, CreditCard, Users, Star, ArrowLeft,
    Newspaper, BookOpen, Clock, Sparkles, Crown, Smartphone
} from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { useHaptic } from '../hooks/useHaptic';
import { ROUTES } from '../utils/routes';
import { useNavigation } from '../hooks/useNavigation';
import { useUI } from '../context/UIContext';
import { useTabActive } from '../components/ui/TabPanel';

interface FAQItem {
    q: string;
    a: string;
    category: string;
    icon: React.ReactNode;
    readTime: string;
}

const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, i) => {
        // Handle bold and italic
        const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        return (
            <React.Fragment key={i}>
                {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className="text-text-primary font-bold">{part.slice(2, -2)}</strong>;
                    }
                    if (part.startsWith('*') && part.endsWith('*')) {
                        return <span key={j} className="italic opacity-80">{part.slice(1, -1)}</span>;
                    }
                    return part;
                })}
                {i < text.split('\n').length - 1 && <br />}
            </React.Fragment>
        );
    });
};

export default function FAQPage() {
    const { t } = useTranslation('common');
    const { selection, notification } = useHaptic();
    const { navigateTo } = useNavigation();
    const { setSupportOpen } = useUI();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedFaq, setSelectedFaq] = useState<number | null>(null);
    const isActive = useTabActive();
    const { setHeaderVisible, setFooterVisible, setNotificationsVisible } = useUI();

    // UI Controls
    useEffect(() => {
        if (isActive) {
            setHeaderVisible(false);
            setFooterVisible(false);
            setNotificationsVisible(false);
        } else {
            setHeaderVisible(true);
            setFooterVisible(true);
            setNotificationsVisible(true);
        }
        return () => {
            setHeaderVisible(true);
            setFooterVisible(true);
            setNotificationsVisible(true);
        };
    }, [isActive, setHeaderVisible, setFooterVisible, setNotificationsVisible]);

    // Listen for faq-search events dispatched by the task system
    React.useEffect(() => {
        const handleFaqSearch = (e: CustomEvent) => {
            const query = e.detail === 'home' ? 'Home Screen' : e.detail;
            setSearchQuery(query);
            // Auto-expand the first matching result after a short delay
            setTimeout(() => {
                setSelectedFaq(0);
            }, 300);
        };
        window.addEventListener('faq-search', handleFaqSearch as EventListener);
        return () => window.removeEventListener('faq-search', handleFaqSearch as EventListener);
    }, []);

    const categories = [
        { id: 'all', label: t('faq.categories.all', 'All'), icon: <Newspaper size={14} /> },
        { id: 'general', label: t('faq.categories.general', 'General'), icon: <HelpCircle size={14} /> },
        { id: 'rewards', label: t('faq.categories.rewards', 'Rewards'), icon: <Star size={14} /> },
        { id: 'pro', label: t('faq.categories.pro', 'PRO'), icon: <Zap size={14} /> },
        { id: 'cards', label: t('faq.categories.cards', 'Cards'), icon: <CreditCard size={14} /> },
        { id: 'security', label: t('faq.categories.security', 'Security'), icon: <Shield size={14} /> }
    ];

    const faqItems: FAQItem[] = useMemo(() => [
        {
            q: t('faq.questions.0.q'),
            a: t('faq.questions.0.a'),
            category: 'general',
            icon: <Users className="text-blue-500" />,
            readTime: '2 min'
        },
        {
            q: t('faq.questions.1.q'),
            a: t('faq.questions.1.a'),
            category: 'rewards',
            icon: <Star className="text-amber-500" />,
            readTime: '3 min'
        },
        {
            q: t('faq.questions.2.q'),
            a: t('faq.questions.2.a'),
            category: 'cards',
            icon: <CreditCard className="text-emerald-500" />,
            readTime: '2 min'
        },
        {
            q: t('faq.questions.3.q'),
            a: t('faq.questions.3.a'),
            category: 'rewards',
            icon: <Users className="text-indigo-500" />,
            readTime: '4 min'
        },
        {
            q: t('faq.questions.4.q'),
            a: t('faq.questions.4.a'),
            category: 'pro',
            icon: <Zap className="text-fuchsia-500" />,
            readTime: '3 min'
        },
        {
            q: t('faq.questions.5.q'),
            a: t('faq.questions.5.a'),
            category: 'rewards',
            icon: <Star className="text-orange-500" />,
            readTime: '2 min'
        },
        {
            q: t('faq.questions.6.q'),
            a: t('faq.questions.6.a'),
            category: 'general',
            icon: <MessageCircle className="text-teal-500" />,
            readTime: '1 min'
        },
        {
            q: t('faq.questions.7.q'),
            a: t('faq.questions.7.a'),
            category: 'general',
            icon: <BookOpen className="text-blue-600" />,
            readTime: '5 min'
        },
        {
            q: t('faq.questions.8.q'),
            a: t('faq.questions.8.a'),
            category: 'pro',
            icon: <Sparkles className="text-purple-500" />,
            readTime: '4 min'
        },
        {
            q: t('faq.questions.9.q'),
            a: t('faq.questions.9.a'),
            category: 'security',
            icon: <Shield className="text-slate-500" />,
            readTime: '2 min'
        },
        {
            q: t('faq.questions.10.q'),
            a: t('faq.questions.10.a'),
            category: 'pro',
            icon: <Crown className="text-amber-500" />,
            readTime: '2 min'
        },
        {
            q: t('faq.questions.11.q'),
            a: t('faq.questions.11.a'),
            category: 'rewards',
            icon: <Star className="text-yellow-500" />,
            readTime: '3 min'
        },
        {
            q: t('faq.questions.12.q'),
            a: t('faq.questions.12.a'),
            category: 'pro',
            icon: <Sparkles className="text-purple-500" />,
            readTime: '1 min'
        },
        {
            q: t('faq.questions.13.q'),
            a: t('faq.questions.13.a'),
            category: 'general',
            icon: <Smartphone className="text-blue-500" />,
            readTime: '2 min'
        }
    ], [t]);

    const filteredFaqs = faqItems.filter(item => {
        const matchesSearch = item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.a.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex flex-col min-h-screen pb-32 bg-bg-app animate-in fade-in duration-500 overflow-x-hidden">
            {/* Premium Header */}
            <div className="relative pt-(--spacing-safe-top,0px) mt-(--back-button-top-offset,48px) pb-16 px-6">
                {/* Removed background glow */}

                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => { selection(); navigateTo(ROUTES.HOME); }}
                        className="p-2.5 rounded-xl bg-card-bg border border-card-border text-text-primary active:scale-95 transition-all backdrop-blur-md shadow-xl"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <span className="text-label font-bold uppercase tracking-[0.2em] text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 backdrop-blur-sm">
                        {t('faq.knowledge_base')}
                    </span>
                </div>

                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-bold text-text-primary tracking-tighter leading-none mb-4 uppercase"
                >
                    <Trans t={t} i18nKey="faq.header_title" components={{ 0: <span className="text-blue-500" /> }} />
                </motion.h1>
                <p className="text-text-secondary font-medium text-xs max-w-[280px] leading-relaxed opacity-70">
                    {t('faq.header_desc')}
                </p>
            </div>

            {/* Search Bar */}
            <div className="px-6 -mt-10 mb-8 relative z-20">
                <div className="relative group">
                    <div className="absolute inset-0 bg-blue-500/20 blur-2xl group-focus-within:opacity-100 opacity-0 transition-opacity duration-500" />
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-blue-500/50 group-focus-within:text-blue-500 transition-colors z-10">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder={t('faq.search_placeholder', 'Search for answers...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-16 pl-12 pr-4 bg-card-bg border-2 border-card-border focus:border-blue-500/30 rounded-2xl text-sm font-bold shadow-2xl backdrop-blur-xl transition-all placeholder:text-text-secondary/40 relative z-0"
                    />
                </div>
            </div>

            {/* Category Chips */}
            <div className="flex gap-2 overflow-x-auto px-6 pb-2 no-scrollbar mb-8">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => { selection(); setSelectedCategory(cat.id); }}
                        className={`flex items-center gap-2 px-4 h-10 rounded-full whitespace-nowrap text-label font-bold uppercase tracking-widest transition-all ${selectedCategory === cat.id
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 px-6'
                            : 'bg-card-bg border border-card-border text-text-secondary'
                            }`}
                    >
                        {cat.icon}
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* FAQ List as Cards (Articles) */}
            <div className="px-6 space-y-4">
                {filteredFaqs.length > 0 ? (
                    filteredFaqs.map((faq, idx) => {
                        const originalIndex = faqItems.indexOf(faq);
                        return (
                            <motion.div
                                key={originalIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group"
                            >
                                <button
                                    onClick={() => { selection(); setSelectedFaq(selectedFaq === originalIndex ? null : originalIndex); }}
                                    className={`w-full text-left p-5 rounded-2xl bg-card-bg border border-card-border transition-all duration-300 relative overflow-hidden active:scale-[0.98] ${selectedFaq === originalIndex ? 'ring-2 ring-blue-500/30 border-blue-500/20 shadow-xl' : 'hover:border-blue-500/30'
                                        }`}
                                >
                                    <div className="flex items-start gap-4 h-full">
                                        <div className="w-12 h-12 rounded-xl bg-bg-secondary flex items-center justify-center shrink-0 shadow-inner">
                                            {faq.icon}
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <div className="flex items-center gap-2 mb-2 font-mono text-[8px] font-bold uppercase tracking-widest text-blue-500/60">
                                                <Clock size={10} />
                                                {faq.readTime} • {categories.find(c => c.id === faq.category)?.label || faq.category}
                                            </div>
                                            <h3 className="text-sm font-bold text-text-primary leading-snug group-hover:text-blue-500 transition-colors">
                                                {faq.q}
                                            </h3>
                                        </div>
                                        <div className="pt-4">
                                            <motion.div
                                                animate={{ rotate: selectedFaq === originalIndex ? 90 : 0 }}
                                                className="text-text-secondary"
                                            >
                                                <ChevronRight size={18} />
                                            </motion.div>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {selectedFaq === originalIndex && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-5 pt-5 border-t border-card-border">
                                                    <p className="text-xs font-medium text-text-secondary leading-relaxed">
                                                        {renderFormattedText(faq.a)}
                                                    </p>
                                                    <div className="mt-4 flex gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); notification('success'); }}
                                                            className="text-[9px] font-bold uppercase tracking-widest text-blue-500 flex items-center gap-1 p-2 bg-blue-500/5 rounded-lg border border-blue-500/10 active:scale-95 transition-all"
                                                        >
                                                            {t('faq.helpful')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>
                            </motion.div>
                        );
                    })
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="text-center py-20"
                    >
                        <motion.div
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4"
                        >
                            <Search size={24} className="text-slate-400" />
                        </motion.div>
                        <h3 className="text-sm font-bold text-text-primary uppercase mb-1">{t('faq.no_results')}</h3>
                        <p className="text-xs text-text-secondary">{t('faq.no_results_desc')}</p>
                    </motion.div>
                )}
            </div>

            {/* Need More Help Footer */}
            <div className="mt-12 px-6">
                <div className="p-8 rounded-3xl bg-linear-to-br from-blue-600 to-blue-800 text-white relative overflow-hidden shadow-2xl shadow-blue-500/30">
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 blur-3xl rounded-full" />
                    <h2 className="text-2xl font-bold mb-2 uppercase tracking-tighter italic">
                        <Trans t={t} i18nKey="faq.still_have_questions" components={{ 0: <span className="text-white/60" /> }} />
                    </h2>
                    <p className="text-white/70 text-xs font-medium mb-6 leading-relaxed">
                        {t('faq.still_have_questions_desc')}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => { selection(); setSupportOpen(true); }}
                            className="flex-1 h-12 bg-white text-blue-600 rounded-xl font-bold text-label uppercase tracking-widest active:scale-95 transition-all"
                        >
                            {t('faq.support_btn')}
                        </button>
                        <button
                            onClick={() => { selection(); window.open('https://t.me/+_T1pC14aVVYxYzJi', '_blank'); }}
                            className="flex-1 h-12 bg-white/10 text-white border border-white/20 rounded-xl font-bold text-label uppercase tracking-widest active:scale-95 transition-all backdrop-blur-sm"
                        >
                            {t('faq.community_btn')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
