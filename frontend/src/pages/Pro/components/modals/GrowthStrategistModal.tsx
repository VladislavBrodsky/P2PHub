import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Zap, Loader2, Sparkles, Target, TrendingUp } from 'lucide-react';
import { apiClient } from '../../../../api/client';
import { useTranslation } from 'react-i18next';
import { renderMarkdown } from '../../utils/renderMarkdown';
import { useTMALock } from '../../../../hooks/useTMALock';

interface GrowthStrategistModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const GrowthStrategistModal = ({ isOpen, onClose }: GrowthStrategistModalProps) => {
    const { t, i18n } = useTranslation('pro');
    
    useTMALock(isOpen);

    const [isGenerating, setIsGenerating] = useState(false);
    const [advice, setAdvice] = useState<string | null>(null);

    const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setAdvice(null);
        try {
            const res = await apiClient.post('/api/pro/growth-advice', {
                language: i18n.language === 'ru' ? 'Russian' : 'English'
            });
            setAdvice(res.data.advice);
        } catch (e: any) {
            console.error('Growth advice fetch failed', e);
        } finally {
            setIsGenerating(false);
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%', opacity: 0 }}
                        animate={isDesktop ? { scale: 1, opacity: 1 } : { y: 0, opacity: 1 }}
                        exit={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%', opacity: 0 }}
                        transition={isDesktop ? { duration: 0.2, ease: "easeOut" } : { type: 'spring', damping: 30, stiffness: 250 }}
                        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-blue-500 to-pink-500" />

                        <div className="p-6 sm:p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shadow-premium-sm">
                                        <Brain size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                                            {t('growth_strategist.title')}
                                        </h2>
                                        <p className="text-label font-bold text-slate-500 uppercase tracking-widest leading-none">
                                            {t('growth_strategist.version')}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            {!advice && !isGenerating && (
                                <div className="space-y-6">
                                    <div className="p-5 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="mt-1 w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                                <Target size={16} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-1">{t('growth_strategist.analysis_title')}</h3>
                                                <p className="text-caption font-medium text-slate-500 dark:text-slate-400">
                                                    {t('growth_strategist.analysis_desc')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1 w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                                <TrendingUp size={16} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-1">{t('growth_strategist.hacks_title')}</h3>
                                                <p className="text-caption font-medium text-slate-500 dark:text-slate-400">
                                                    {t('growth_strategist.hacks_desc')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                                        <Zap size={14} className="text-amber-500" />
                                        <span className="text-label font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                                            {t('growth_strategist.cost', { count: 5 })}
                                        </span>
                                    </div>

                                    <button
                                        onClick={handleGenerate}
                                        className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-label uppercase tracking-widest flex items-center justify-center gap-3 shadow-premium active:scale-95 transition-all"
                                    >
                                        {t('growth_strategist.btn_initiate')}
                                        <Sparkles size={16} className="text-blue-500" />
                                    </button>
                                </div>
                            )}

                            {isGenerating && (
                                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                                    <div className="relative">
                                        <Loader2 size={48} className="text-blue-500 animate-spin" />
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="absolute inset-0 bg-blue-500 blur-2xl rounded-full"
                                        />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{t('growth_strategist.synthesizing')}</p>
                                        <p className="text-label font-bold text-slate-500 uppercase tracking-widest mt-1">{t('growth_strategist.accessing_data')}</p>
                                    </div>
                                </div>
                            )}

                            {advice && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="prose dark:prose-invert max-w-none">
                                        <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed p-6 bg-slate-50 dark:bg-black/30 rounded-2xl border border-slate-100 dark:border-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
                                            {renderMarkdown(advice)}
                                        </div>
                                    </div>

                                    <button
                                        onClick={onClose}
                                        className="w-full h-12 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white rounded-xl font-bold text-label uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all border border-slate-200 dark:border-white/10"
                                    >
                                        {t('growth_strategist.btn_execute')}
                                        <TrendingUp size={14} />
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
