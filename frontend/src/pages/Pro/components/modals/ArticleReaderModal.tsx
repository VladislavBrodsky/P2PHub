import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { renderMarkdown } from '../../utils/renderMarkdown';


interface ArticleReaderModalProps {
    selectedArticle: any;
    setSelectedArticle: (article: any) => void;
    selection: () => void;
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
    selectedArticle,
    setSelectedArticle,
    selection
}) => {
    const { t } = useTranslation('pro');

    return (
        <AnimatePresence>
            {selectedArticle && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl"
                    onClick={() => setSelectedArticle(null)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg glass-panel-premium rounded-[2.5rem] border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-slate-900 shadow-2xl noise-overlay"
                    >
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-indigo-500/10 rounded-full text-label font-bold text-indigo-500 uppercase tracking-widest">{selectedArticle.category}</span>
                                        <span className="text-label font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('academy.read_time', { time: selectedArticle.readTime })}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{selectedArticle.title}</h3>
                                </div>
                                <button
                                    onClick={() => setSelectedArticle(null)}
                                    className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                >
                                    <X size={18} className="text-slate-900 dark:text-white" />
                                </button>
                            </div>
                            <div className="prose prose-sm dark:prose-invert max-h-[60vh] overflow-y-auto no-scrollbar">
                                <div>
                                    {renderMarkdown(selectedArticle.content)}
                                </div>
                            </div>
                            <button
                                onClick={() => { selection(); setSelectedArticle(null); }}
                                className="w-full h-14 vibing-blue-animated rounded-2xl font-bold text-white text-label uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                            >
                                {t('academy.understand_btn')}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
