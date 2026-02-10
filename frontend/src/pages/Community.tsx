import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic';
import { ListSkeleton } from '../components/Skeletons/ListSkeleton';
import { PartnerDashboard } from '../components/Partner/PartnerDashboard';
import { PartnerAcademy } from '../components/Partner/PartnerAcademy';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { Info, HelpCircle } from 'lucide-react';
import { PartnerBriefingModal } from '../components/Partner/PartnerBriefingModal';

export default function CommunityPage() {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'academy'>('dashboard');
    const [isBriefingOpen, setIsBriefingOpen] = useState(false);
    const { selection } = useHaptic();

    useEffect(() => {
        setIsLoading(false);
    }, []);

    const handleTabChange = (tab: 'dashboard' | 'academy') => {
        selection();
        setActiveTab(tab);
    };

    if (isLoading) return <div className="p-4"><ListSkeleton /></div>;

    return (
        <div className="flex flex-col min-h-screen px-4 pb-32 relative bg-(--color-bg-deep) transition-colors duration-300 -mt-6">
            {/* Mesh Background Overlay - Dark Mode Only */}
            <div className="mesh-gradient-dark fixed inset-0 opacity-30 pointer-events-none dark:block hidden" />
            <div className="fixed top-20 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none transition-colors duration-500" />
            <div className="fixed bottom-40 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none transition-colors duration-500" />

            {/* Premium Header with Briefing Trigger */}
            <div className="flex items-center justify-center py-4 pb-6 relative z-30 px-1">
                <div className="flex flex-col items-center">
                    <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase">
                        {t('menu.community')}
                    </h1>
                    <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Network Live</span>
                    </div>
                </div>

                <div className="absolute right-1 flex items-center gap-2">
                    <button
                        onClick={() => { selection(); setIsBriefingOpen(true); }}
                        className="p-1.5 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xl text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-all active:scale-95 shadow-sm group"
                    >
                        <Info className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Top Navigation / Switcher */}
            <div className="relative z-20 mb-4 mt-2 flex justify-center">
                <div className="p-1 rounded-2xl bg-slate-100/50 dark:bg-black/20 border border-white/5 backdrop-blur-2xl flex items-center relative gap-1 shadow-inner overflow-hidden">
                    {/* Sliding Background */}
                    <motion.div
                        layoutId="activeTab"
                        className="absolute inset-y-1 rounded-xl bg-white dark:bg-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.1)] dark:shadow-premium border border-white/10"
                        initial={false}
                        animate={{
                            left: activeTab === 'dashboard' ? '4px' : 'calc(50% + 2px)',
                            width: 'calc(50% - 6px)'
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 450,
                            damping: 35
                        }}
                    />

                    <button
                        onClick={() => handleTabChange('dashboard')}
                        className={cn(
                            "relative z-10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all w-28 text-center",
                            activeTab === 'dashboard' ? "text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
                        )}
                    >
                        {t('community.tabs.dashboard')}
                    </button>
                    <button
                        onClick={() => handleTabChange('academy')}
                        className={cn(
                            "relative z-10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all w-28 text-center",
                            activeTab === 'academy' ? "text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
                        )}
                    >
                        {t('community.tabs.academy')}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode='wait'>
                {activeTab === 'dashboard' ? (
                    <motion.div
                        key="dashboard"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <PartnerDashboard />
                    </motion.div>
                ) : (
                    <motion.div
                        key="academy"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <PartnerAcademy />
                    </motion.div>
                )}
            </AnimatePresence>

            <PartnerBriefingModal isOpen={isBriefingOpen} onClose={() => setIsBriefingOpen(false)} />
        </div>
    );
};
