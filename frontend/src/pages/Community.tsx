import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic';
import { ListSkeleton } from '../components/Skeletons/ListSkeleton';
import { PartnerDashboard } from '../components/Partner/PartnerDashboard';
import { PartnerAcademy } from '../components/Partner/PartnerAcademy';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export default function CommunityPage() {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'academy'>('dashboard');
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
        <div className="flex flex-col min-h-screen px-4 pb-32 relative overflow-hidden bg-(--color-bg-deep) transition-colors duration-300">
            {/* Mesh Background Overlay - Dark Mode Only */}
            <div className="mesh-gradient-dark fixed inset-0 opacity-30 pointer-events-none dark:block hidden" />
            <div className="fixed top-20 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="fixed bottom-40 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Top Navigation / Switcher */}
            <div className="relative z-20 mb-3 flex justify-center mt-[-24px]">
                <div className="p-1 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/5 backdrop-blur-xl flex items-center relative gap-1 shadow-sm">
                    {/* Sliding Background */}
                    <motion.div
                        layoutId="activeTab"
                        className="absolute inset-y-1 rounded-xl bg-slate-900 dark:bg-slate-800 shadow-lg"
                        initial={false}
                        animate={{
                            left: activeTab === 'dashboard' ? '4px' : '50%',
                            width: 'calc(50% - 4px)'
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30
                        }}
                    />

                    <button
                        onClick={() => handleTabChange('dashboard')}
                        className={cn(
                            "relative z-10 px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors w-28 text-center",
                            activeTab === 'dashboard' ? "text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        {t('community.tabs.dashboard')}
                    </button>
                    <button
                        onClick={() => handleTabChange('academy')}
                        className={cn(
                            "relative z-10 px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors w-28 text-center",
                            activeTab === 'academy' ? "text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
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
        </div>
    );
};
