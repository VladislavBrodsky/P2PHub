import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic';
import { ListSkeleton } from '../components/Skeletons/ListSkeleton';
import { PartnerDashboard } from '../components/Partner/PartnerDashboard';
import { PartnerAcademy } from '../components/Partner/PartnerAcademy';
import { cn } from '../lib/utils'; // Assuming generic utils are here, or remove if not

export default function CommunityPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'academy'>('dashboard');
    const { selection } = useHaptic();

    useEffect(() => {
        // Simulate initial data load
        setTimeout(() => setIsLoading(false), 800);
    }, []);

    const handleTabChange = (tab: 'dashboard' | 'academy') => {
        selection();
        setActiveTab(tab);
    };

    if (isLoading) return <div className="p-4"><ListSkeleton /></div>;

    return (
        <div className="flex flex-col min-h-[100vh] px-4 pt-safe-top pb-32 relative overflow-hidden bg-[var(--color-bg-deep)] transition-colors duration-300">
            {/* Mesh Background Overlay - Dark Mode Only */}
            <div className="mesh-gradient-dark absolute inset-0 opacity-30 pointer-events-none fixed dark:block hidden" />
            <div className="absolute top-20 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none fixed" />
            <div className="absolute bottom-40 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none fixed" />

            {/* Top Navigation / Switcher */}
            <div className="relative z-20 mb-3 flex justify-center">
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
                        className={cn(
                            "relative z-10 px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors w-28 text-center",
                            activeTab === 'dashboard' ? "text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => handleTabChange('academy')}
                        className={cn(
                            "relative z-10 px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors w-28 text-center",
                            activeTab === 'academy' ? "text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        Academy
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
