import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptic } from '../hooks/useHaptic';
import { ListSkeleton } from '../components/Skeletons/ListSkeleton';
import { PartnerDashboard } from '../components/Partner/PartnerDashboard';
import { PartnerAcademy } from '../components/Partner/PartnerAcademy';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
// #comment: Removed unused HelpCircle icon from lucide-react to clean up the import list
import { BookOpen } from 'lucide-react';
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


            {/* Premium Briefing Trigger - Static Card */}
            <div className="pt-4 -mb-2 relative z-30">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => { selection(); setIsBriefingOpen(true); }}
                    className="group relative overflow-hidden rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 shadow-sm backdrop-blur-xl cursor-pointer hover:bg-white dark:hover:bg-white/10 transition-all active:scale-[0.98]"
                >
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-r from-transparent via-blue-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white leading-none">
                                {t('referral.brief.title')}
                            </h3>
                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
                                Official Partner Guide
                                <div className="w-1 h-1 rounded-full bg-blue-500/50" />
                                <span className="opacity-60 italic">Read Briefing</span>
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Top Navigation / Switcher */}
            <div className="relative z-20 mb-4 mt-2 flex justify-center">
                <div className="p-1 rounded-2xl bg-slate-100/50 dark:bg-black/20 border border-white/5 backdrop-blur-2xl flex items-center relative gap-1 shadow-inner overflow-hidden">
                    {/* Sliding Background */}
                    <motion.div
                        className="absolute inset-y-1 rounded-xl bg-white dark:bg-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.1)] dark:shadow-premium border border-white/10 z-0"
                        layout={false}
                        initial={false}
                        animate={{
                            x: activeTab === 'dashboard' ? '0%' : '100.5%',
                            width: 'calc(50% - 6px)'
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
}

