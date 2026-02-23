import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic';
import { PartnerDashboard } from '../components/Partner/PartnerDashboard';
import { PartnerAcademy } from '../components/Partner/PartnerAcademy';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export default function CommunityPage() {
    const { t } = useTranslation(['social', 'common', 'academy']);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'academy'>('dashboard');
    const { selection, impact } = useHaptic();

    const handleTabChange = (tab: 'dashboard' | 'academy') => {
        selection();
        impact('light');
        setActiveTab(tab);
    };

    // Reset scroll on sub-tab change
    useEffect(() => {
        const main = document.querySelector('main');
        if (main) main.scrollTop = 0;
    }, [activeTab]);

    // Handle external navigation to Academy
    useEffect(() => {
        const handleNavAcademy = () => setActiveTab('academy');
        window.addEventListener('nav-academy', handleNavAcademy);
        return () => window.removeEventListener('nav-academy', handleNavAcademy);
    }, []);

    return (
        <div className="flex flex-col min-h-screen px-4 pb-12 relative transition-colors duration-300">



            {/* Top Navigation / Switcher */}
            <div className="relative z-20 mb-6 mt-6 flex justify-center">
                <div className="p-1 rounded-3xl bg-slate-100/50 dark:bg-black/20 border border-white/5 backdrop-blur-2xl flex items-center relative gap-1 shadow-inner overflow-hidden">
                    {/* Sliding Background */}
                    <motion.div
                        className="absolute inset-y-1 rounded-2xl bg-white dark:bg-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.1)] dark:shadow-premium border border-white/10 z-0 pointer-events-none"
                        layout={false}
                        initial={false}
                        animate={{
                            x: activeTab === 'dashboard' ? '0%' : '100%',
                            width: 'calc(50% - 4px)'
                        }}
                        style={{
                            left: '4px'
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 450,
                            damping: 35
                        }}
                    />

                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleTabChange('dashboard')}
                        className={cn(
                            "relative z-10 px-4 py-3 text-label font-bold uppercase tracking-wider transition-all w-36 text-center",
                            activeTab === 'dashboard' ? "text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                    >
                        {t('community.tabs.dashboard')}
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleTabChange('academy')}
                        className={cn(
                            "relative z-10 px-4 py-3 text-label font-bold uppercase tracking-wider transition-all w-36 text-center",
                            activeTab === 'academy' ? "text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                    >
                        {t('community.tabs.academy')}
                    </motion.button>
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
}

