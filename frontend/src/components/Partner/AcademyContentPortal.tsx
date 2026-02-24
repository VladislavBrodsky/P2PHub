import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Zap, CheckCircle2, ArrowRight, Lock, Lightbulb, Wand2, Share2, Target, ArrowLeft, Users } from 'lucide-react';
import { AcademyStage } from '../../data/academyData';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { useUI } from '../../context/UIContext';
import { useTMALock } from '../../hooks/useTMALock';
import { renderMarkdown, renderInline, sanitizeAIGeneratedText } from '../../utils/renderMarkdown';

interface AcademyContentPortalProps {
    stage: AcademyStage;
    onClose: () => void;
    onComplete: (id: number) => void;
    isLocked: boolean;
}

export const AcademyContentPortal: React.FC<AcademyContentPortalProps> = ({ stage, onClose, onComplete, isLocked }) => {
    const { t } = useTranslation(['academy', 'common']);
    const { user } = useUser();
    const { setHeaderVisible, setFooterVisible, setNotificationsVisible } = useUI();
    const [missionAccomplished, setMissionAccomplished] = React.useState(false);

    useTMALock(true);
    const [scrolledProgress, setScrolledProgress] = React.useState(0);
    const contentRef = React.useRef<HTMLDivElement>(null);

    const getStageContent = (id: number) => {
        return {
            titleKey: `academy_content.stage_${id}_title`,
            params: {}
        };
    };

    const { titleKey, params } = getStageContent(stage.id);
    const title = t(titleKey, { ...params, defaultValue: stage.title });
    const category = t(`academy_categories.${stage.category}`, stage.category);

    // Prevent body scroll and hide global UI elements when portal is open
    React.useEffect(() => {
        setHeaderVisible(false);
        setFooterVisible(false);
        setNotificationsVisible(false);

        const main = document.querySelector('main');
        const originalOverflow = main ? main.style.overflow : '';
        if (main) {
            main.style.overflow = 'hidden';
            main.style.height = '100dvh'; // Lock height to prevent TMA rubber-banding
        }

        return () => {
            setHeaderVisible(true);
            setFooterVisible(true);
            setNotificationsVisible(true);
            if (main) {
                main.style.overflow = originalOverflow;
                main.style.height = '';
            }
        };
    }, [setHeaderVisible, setFooterVisible, setNotificationsVisible]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const element = e.currentTarget;
        const scrollPercent = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
        setScrolledProgress(scrollPercent);
    };

    const handleShareSecret = () => {
        const secret = t(`academy_content.stage_${stage.id}_lesson_secret`);
        const sanitizedSecret = sanitizeAIGeneratedText(secret);
        const text = `🔥 P2P Secret from Academy Stage ${stage.id}:\n\n"${sanitizedSecret}"\n\nJoin the elite floor with me: https://t.me/pintopay_bot?start=r_${user?.id}`;

        if (navigator.share) {
            navigator.share({
                title: 'P2P Viral Secret',
                text: text,
            }).catch(() => { });
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(text);
            alert(t('common:copied_to_clipboard'));
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-0 sm:p-4">
            {/* Backdrop - Blocks background interaction */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/90 backdrop-blur-3xl touch-none"
            />

            {/* Modal Content - Allowed to receive touch events */}
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 32, stiffness: 350 }}
                className="relative w-full sm:max-w-lg bg-white dark:bg-[#030712] sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200 dark:border-white/10 flex flex-col"
                style={{
                    height: '100dvh',
                    maxHeight: '100dvh',
                    overscrollBehavior: 'none',
                }}
            >
                {/* Fixed Header Bar - Premium Glassmorphism with Safe Area support */}
                <div className="sticky top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 pb-4 pt-[calc(var(--spacing-safe-top,32px)+3rem)] bg-white/80 dark:bg-black/40 backdrop-blur-3xl border-b border-slate-200 dark:border-white/5 shrink-0">

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="pointer-events-auto p-2 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 text-slate-900 dark:text-white hover:scale-105 active:scale-90 transition-all shadow-md flex items-center gap-2 group z-50"
                    >
                        <X className="w-4 h-4" />
                        <span className="text-label font-bold uppercase tracking-widest pr-1 hidden sm:block">{t('common:close')}</span>
                    </button>

                    {/* Stage Badge - Centered specifically for better hierarchy */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                        <span className="text-label font-bold text-blue-500 uppercase tracking-[0.2em] leading-none mb-1">{t('academy.academy_label')}</span>
                        <h3 className="text-label font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('academy.stage_title', { stage: stage.id })}</h3>
                    </div>

                    {/* Stats Badge */}
                    <div className="pointer-events-auto flex items-center gap-1.5 p-1 pr-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm z-50">
                        <div className="px-2 py-1 rounded-lg bg-blue-500 border border-blue-400 shadow-lg flex items-center justify-center">
                            <span className="text-xs font-bold text-white leading-none">{user?.level || 1}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-label font-bold text-slate-900 dark:text-white leading-none">{Math.floor(user?.xp || 0)}</span>
                            <span className="text-label font-bold text-green-500 uppercase tracking-widest">{t('common:xp')}</span>
                        </div>
                    </div>

                    {/* Scroll Progress Bar - Subtle at the bottom of header */}
                    <div className="absolute bottom-0 left-0 h-[2px] bg-blue-500/20 w-full overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${scrolledProgress}%` }}
                            transition={{ duration: 0.1 }}
                        />
                    </div>
                </div>

                {/* Content Area (Scrollable) — uses flex-1 to fill remaining space */}
                <div
                    ref={contentRef}
                    onScroll={handleScroll}
                    className="flex-1 min-h-0 custom-scrollbar"
                    style={{
                        overflowY: 'scroll',
                        overflowX: 'hidden',
                        WebkitOverflowScrolling: 'touch',
                        overscrollBehavior: 'contain',
                        // Extra bottom padding: safe-area + fixed bottom bar (~90px) + breathing room
                        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 120px)',
                    }}
                >

                    <div className="p-5 pt-8 space-y-7">
                        {isLocked ? (
                            /* PRO Lock View */
                            <div className="flex flex-col items-center text-center space-y-8 py-12">
                                <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border-2 border-dashed border-amber-500/30 flex items-center justify-center">
                                    <Lock className="w-10 h-10 text-amber-500" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                                        {stage.id === 20 ? t('academy.locked.stage_20_lock_title') : t('academy.stage_locked')}
                                    </h2>
                                    <p className="text-caption text-slate-500 dark:text-slate-400 font-medium max-w-[280px] leading-relaxed">
                                        {stage.id === 20 ? t('academy.locked.stage_20_lock_desc') : t('academy.lock_desc')}
                                    </p>
                                </div>

                                <div className="w-full p-6 rounded-2xl bg-linear-to-br from-amber-500/10 to-transparent border border-amber-500/20 space-y-5">
                                    <div className="flex items-center gap-3">
                                        <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                                        <span className="text-label font-bold text-amber-500 uppercase tracking-widest">{t('academy.pro_benefits')}</span>
                                    </div>
                                    <ul className="space-y-2 text-left">
                                        {Array.isArray(t('academy.pro_items', { returnObjects: true })) && (t('academy.pro_items', { returnObjects: true }) as string[]).map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-label font-bold text-slate-700 dark:text-slate-300">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button
                                    onClick={() => {
                                        onClose();
                                        window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'subscription' }));
                                    }}
                                    className="w-full py-5 rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 text-white font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <span>{t('academy.upgrade_now')}</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        ) : (

                            /* Lesson Content View */
                            <div className="space-y-10">
                                {/* Viral Network Core - Dynamic Hero Section */}
                                <div className="relative h-56 rounded-2xl -mx-1 shrink-0 bg-[#030712] border border-white/5 shadow-2xl group/core">
                                    <div className="absolute inset-0 rounded-2xl overflow-hidden">
                                        {/* Atmospheric Plasma Glows */}
                                        <motion.div
                                            className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                        />
                                        <motion.div
                                            className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"
                                            animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.15, 0.1] }}
                                            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                                        />

                                        {/* Scanline Effect */}
                                        <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.03]"
                                            style={{
                                                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 4px)',
                                                backgroundSize: '100% 4px'
                                            }}
                                        />

                                        {/* Energy Particles - Multi-colored & varying speeds */}
                                        {[...Array(12)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                className={`absolute w-${i % 2 === 0 ? '1' : '1.5'} h-${i % 2 === 0 ? '1' : '1.5'} ${i % 3 === 0 ? 'bg-blue-400' : i % 3 === 1 ? 'bg-indigo-400' : 'bg-cyan-400'} rounded-full blur-[1px]`}
                                                initial={{
                                                    x: Math.random() * 400,
                                                    y: Math.random() * 200,
                                                    opacity: 0
                                                }}
                                                animate={{
                                                    y: [null, -100 - Math.random() * 100],
                                                    x: [null, (Math.random() - 0.5) * 50 + (i % 2 === 0 ? 20 : -20)],
                                                    opacity: [0, 0.7, 0],
                                                    scale: [1, 1.5, 0.5]
                                                }}
                                                transition={{
                                                    duration: 2 + Math.random() * 4,
                                                    repeat: Infinity,
                                                    ease: "easeOut",
                                                    delay: Math.random() * 5
                                                }}
                                            />
                                        ))}

                                        {/* Dot Grid Background */}
                                        <div className="absolute inset-0 opacity-15"
                                            style={{
                                                backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)',
                                                backgroundSize: '16px 16px'
                                            }}
                                        />

                                        {/* Neural & Energy SVG Layer */}
                                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
                                            {/* Neural Connectivity Lines */}
                                            <motion.path
                                                d="M 120 100 L 200 100"
                                                stroke="url(#neural-gradient)"
                                                strokeWidth="0.5"
                                                strokeDasharray="4 4"
                                                fill="none"
                                                animate={{ strokeDashoffset: [0, -20] }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                className="opacity-20"
                                            />
                                            <motion.path
                                                d="M 280 100 L 200 100"
                                                stroke="url(#neural-gradient)"
                                                strokeWidth="0.5"
                                                strokeDasharray="4 4"
                                                fill="none"
                                                animate={{ strokeDashoffset: [0, 20] }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                className="opacity-20"
                                            />

                                            {/* Dynamic Glow Curves */}
                                            <motion.path
                                                d="M -50 150 Q 100 50 250 150 T 450 100"
                                                fill="none"
                                                stroke="url(#blue-gradient)"
                                                strokeWidth="2"
                                                initial={{ pathLength: 0, opacity: 0 }}
                                                animate={{ pathLength: 1, opacity: 1 }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                                className="opacity-30"
                                            />
                                            <motion.path
                                                d="M -50 100 Q 150 180 300 80 T 450 150"
                                                fill="none"
                                                stroke="url(#purple-gradient)"
                                                strokeWidth="1.5"
                                                initial={{ pathLength: 0, opacity: 0 }}
                                                animate={{ pathLength: 1, opacity: 1 }}
                                                transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1 }}
                                                className="opacity-30"
                                            />

                                            {/* Shooting Energy Path Particles */}
                                            <motion.circle r="2" fill="#60A5FA" filter="blur(2px)">
                                                <animateMotion
                                                    path="M -50 150 Q 100 50 250 150 T 450 100"
                                                    dur="3s"
                                                    repeatCount="indefinite"
                                                />
                                            </motion.circle>
                                            <motion.circle r="1.5" fill="#A855F7" filter="blur(2px)">
                                                <animateMotion
                                                    path="M -50 100 Q 150 180 300 80 T 450 150"
                                                    dur="4s"
                                                    repeatCount="indefinite"
                                                    begin="1s"
                                                />
                                            </motion.circle>

                                            {/* Multi-Ring Energy Orbits - Staggered & Pulsing */}
                                            <motion.circle
                                                cx="200"
                                                cy="100"
                                                r="68"
                                                stroke="white"
                                                strokeWidth="0.5"
                                                fill="none"
                                                strokeDasharray="4 60"
                                                animate={{
                                                    rotate: 360,
                                                    scale: [1, 1.02, 1]
                                                }}
                                                transition={{
                                                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                                                    scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                                                }}
                                                className="opacity-40"
                                            />
                                            <motion.circle
                                                cx="200"
                                                cy="100"
                                                r="74"
                                                stroke="#3b82f6"
                                                strokeWidth="1"
                                                fill="none"
                                                strokeDasharray="10 200"
                                                animate={{
                                                    rotate: -360,
                                                    opacity: [0.3, 0.7, 0.3]
                                                }}
                                                transition={{
                                                    rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                                                    opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                                                }}
                                                className="opacity-60"
                                            />
                                            <motion.circle
                                                cx="200"
                                                cy="100"
                                                r="82"
                                                stroke="url(#blue-gradient)"
                                                strokeWidth="0.5"
                                                fill="none"
                                                animate={{
                                                    scale: [1, 1.08, 1],
                                                    opacity: [0.1, 0.4, 0.1],
                                                    strokeWidth: [0.5, 1.5, 0.5]
                                                }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                            />

                                            <defs>
                                                <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
                                                    <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
                                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                                </linearGradient>
                                                <linearGradient id="purple-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
                                                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
                                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                                                </linearGradient>
                                                <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
                                                    <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
                                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </div>

                                    {/* Central Avatar Container */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="relative">
                                            {/* Pulsing Outer Glow */}
                                            <motion.div
                                                className="absolute -inset-4 rounded-full bg-blue-500/20 blur-2xl"
                                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                                transition={{ duration: 3, repeat: Infinity }}
                                            />

                                            {/* Avatar Frame with Rhythmic Pulse */}
                                            <motion.div
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="relative w-28 h-28 rounded-2xl p-1 bg-linear-to-br from-blue-500 via-indigo-500 to-cyan-400 shadow-[0_0_50px_rgba(59,130,246,0.5)] animate-rhythmic-pulse"
                                            >
                                                <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-900 border border-white/30 backdrop-blur-md">
                                                    <img
                                                        src={user?.photo_url || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop"}
                                                        alt="Partner"
                                                        className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                                                    />
                                                </div>
                                            </motion.div>

                                            {/* Floating Nodes */}
                                            <motion.div
                                                className="absolute -left-12 top-4 px-3 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-md border border-emerald-400 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] z-20 group/node overflow-hidden"
                                                initial={{ scale: 0, opacity: 0, x: -20 }}
                                                animate={{
                                                    scale: 1,
                                                    opacity: 1,
                                                    y: [0, -10, 0],
                                                    x: [0, 6, 0]
                                                }}
                                                transition={{
                                                    scale: { duration: 0.5, delay: 0.2 },
                                                    opacity: { duration: 0.5, delay: 0.2 },
                                                    y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                                                    x: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                                                }}
                                            >
                                                {/* Orb Glow */}
                                                <div className="absolute inset-0 bg-radial from-white/20 to-transparent pointer-events-none" />
                                                <div className="p-1 rounded-full bg-white/20 relative z-10">
                                                    <Users className="w-3 h-3 text-white" />
                                                </div>
                                                <span className="text-[10px] font-black text-white tracking-wider relative z-10">+$8.64</span>
                                            </motion.div>

                                            <motion.div
                                                className="absolute -right-10 bottom-6 w-10 h-10 rounded-full bg-indigo-500/90 backdrop-blur-md border border-indigo-400 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] z-20 group/node overflow-hidden"
                                                initial={{ scale: 0, opacity: 0, x: 20 }}
                                                animate={{
                                                    scale: 1,
                                                    opacity: 1,
                                                    y: [0, 12, 0],
                                                    x: [0, -8, 0]
                                                }}
                                                transition={{
                                                    scale: { duration: 0.5, delay: 0.4 },
                                                    opacity: { duration: 0.5, delay: 0.4 },
                                                    y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
                                                    x: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
                                                }}
                                            >
                                                {/* Orb Glow */}
                                                <div className="absolute inset-0 bg-radial from-white/20 to-transparent pointer-events-none" />
                                                <Zap className="w-4 h-4 text-white fill-white relative z-10" />
                                            </motion.div>
                                        </div>
                                    </div>

                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full px-8">
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className="w-full bg-white border-2 border-blue-500/20 rounded-2xl py-3 px-4 shadow-[0_0_50px_rgba(255,255,255,0.4)] flex items-center justify-center relative overflow-hidden group/badge animate-vibe-shift"
                                        >
                                            {/* High-Energy Fusion Pulse Border */}
                                            <div className="absolute inset-0 bg-linear-to-r from-blue-500/20 via-indigo-500/20 to-cyan-500/20 opacity-0 group-hover/badge:opacity-100 transition-opacity duration-500" />

                                            {/* Shimmer Overlay */}
                                            <motion.div
                                                className="absolute inset-0 bg-linear-to-r from-transparent via-blue-500/10 to-transparent"
                                                animate={{ x: ['-200%', '200%'] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                            />

                                            <span className="text-sm font-black text-slate-900 dark:text-slate-900 uppercase tracking-[0.4em] whitespace-nowrap relative z-10 drop-shadow-sm">
                                                Viral Network Core
                                            </span>
                                        </motion.div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-label font-bold text-blue-500 uppercase tracking-widest">
                                            {t('academy.mastery', { stage: stage.id })}
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-label font-bold text-slate-500 uppercase tracking-widest">
                                            {category}
                                        </div>
                                        {stage.duration && (
                                            <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-label font-bold text-blue-500 uppercase tracking-widest">
                                                {stage.duration.replace('min', t('academy.unit_min', 'min'))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Main Article Content */}
                                <div className="space-y-7 text-slate-600 dark:text-slate-400 text-body leading-relaxed font-medium">
                                    <div className="text-body text-slate-900 dark:text-white font-bold leading-snug">
                                        {renderInline(t(`academy_content.stage_${stage.id}_lesson_intro`, { defaultValue: t('academy.elite_training') }))}
                                    </div>

                                    <div className="p-5 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 space-y-3 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl -mr-8 -mt-8" />
                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-500 font-bold text-label uppercase tracking-widest">
                                                <Lightbulb className="w-4 h-4" />
                                                {t(`academy_content.stage_${stage.id}_lesson_secret_title`, { defaultValue: t('academy.profit_secret') })}
                                            </div>
                                            <button
                                                onClick={handleShareSecret}
                                                className="p-1.5 rounded-lg bg-white dark:bg-white/5 border border-blue-200 dark:border-white/10 text-blue-500 hover:scale-110 active:scale-95 transition-all shadow-sm"
                                            >
                                                <Share2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <p className="text-caption italic leading-relaxed text-slate-700 dark:text-slate-200 relative z-10 font-bold">
                                            &ldquo;{renderInline(t(`academy_content.stage_${stage.id}_lesson_secret`, { defaultValue: t('academy.profit_quote') }))}&rdquo;
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Main body with full markdown support */}
                                        <div className="text-body leading-relaxed text-slate-600 dark:text-slate-400">
                                            {renderMarkdown(t(`academy_content.stage_${stage.id}_lesson_body`, { defaultValue: t('academy.growth_hacker') }))}
                                        </div>

                                        {/* AI Expert Section */}
                                        {(stage.category === 'ai' || (stage.id >= 5 && stage.id <= 10) || t(`academy_content.stage_${stage.id}_lesson_ai_expert`, { defaultValue: '' })) && (
                                            <div className="p-5 rounded-xl bg-linear-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 space-y-3">
                                                <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400 font-bold text-label uppercase tracking-widest">
                                                    <Wand2 className="w-4 h-4" />
                                                    {t('academy.ai_expert')}
                                                </div>
                                                <div className="text-caption leading-relaxed font-medium">
                                                    {renderMarkdown(t(`academy_content.stage_${stage.id}_lesson_ai_expert`, { defaultValue: t('academy.ai_desc') }))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Viral Rule / Marketing Trick Section */}
                                        {t(`academy_content.stage_${stage.id}_lesson_viral_rule`, { defaultValue: '' }) && (
                                            <div className="p-5 rounded-xl bg-linear-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20 space-y-3">
                                                <div className="flex items-center gap-2.5 text-pink-600 dark:text-pink-400 font-bold text-label uppercase tracking-widest">
                                                    <Zap className="w-4 h-4" />
                                                    {t('academy.viral_psychology')}
                                                </div>
                                                <p className="text-caption leading-relaxed font-bold italic text-slate-800 dark:text-slate-200">
                                                    &ldquo;{renderInline(t(`academy_content.stage_${stage.id}_lesson_viral_rule`))}&rdquo;
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="opacity-90 pt-4 border-t border-slate-100 dark:border-white/5 text-caption">
                                        {renderMarkdown(t(`academy_content.stage_${stage.id}_lesson_outro`, { defaultValue: t('academy.build_empire') }))}
                                    </div>

                                    {/* Action Mission - High Impact Commitment */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        className="p-6 rounded-2xl bg-slate-900 dark:bg-white/5 border border-slate-800 dark:border-white/10 space-y-5 relative overflow-hidden group/mission"
                                    >
                                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/mission:translate-x-full transition-transform duration-1000 pointer-events-none" />
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                                <Target className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-caption font-bold text-white uppercase tracking-wider">{t('academy.your_mission')}</h4>
                                        </div>

                                        <div
                                            onClick={() => setMissionAccomplished(!missionAccomplished)}
                                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 ${missionAccomplished
                                                ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                                                : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                                }`}
                                        >
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${missionAccomplished ? 'bg-blue-500 border-blue-500 rotate-0 scale-110 shadow-lg shadow-blue-500/20' : 'border-white/20 rotate-45 group-hover:rotate-0 group-hover:border-white/40'
                                                }`}>
                                                {missionAccomplished ? <CheckCircle2 className="w-4 h-4 text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                                            </div>
                                            <span className="text-caption font-bold leading-tight">
                                                {renderInline(t(`academy_content.stage_${stage.id}_lesson_mission`, { defaultValue: t('academy.apply_knowledge') }))}
                                            </span>
                                        </div>

                                        <p className="text-label text-slate-500 font-bold uppercase tracking-widest text-center pt-2">
                                            {missionAccomplished ? t('academy.mission_ready') : t('academy.mission_pending')}
                                        </p>
                                    </motion.div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 px-4 pt-4 bg-linear-to-t from-white via-white/98 to-transparent dark:from-[#030712] dark:via-[#030712]/98 z-20 flex gap-3"
                    style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)' }}
                >
                    <button
                        onClick={onClose}
                        className="w-14 h-auto rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 flex items-center justify-center active:scale-90 transition-all hover:bg-slate-200 dark:hover:bg-white/10"
                        aria-label={t('common:close')}
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>

                    {!isLocked ? (
                        <button
                            onClick={() => missionAccomplished && onComplete(stage.id)}
                            disabled={!missionAccomplished}
                            className={`flex-1 py-5 rounded-2xl font-bold text-sm uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-4 border touch-manipulation relative overflow-hidden ${missionAccomplished
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-95 brightness-110'
                                : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10 opacity-50 grayscale cursor-not-allowed shadow-none'
                                }`}
                        >
                            {missionAccomplished && (
                                <motion.div
                                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent"
                                    animate={{ x: ['100%', '-100%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                />
                            )}
                            <CheckCircle2 className={`w-5 h-5 transition-transform ${missionAccomplished ? 'scale-110' : 'scale-100'}`} />
                            {t('academy.complete_stage', { stage: stage.id })}
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                onClose();
                                window.dispatchEvent(new CustomEvent('nav-tab', { detail: 'subscription' }));
                            }}
                            className="flex-1 py-5 rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 text-white font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                        >
                            <span>{t('academy.upgrade_now')}</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>
            </motion.div>
        </div>,
        document.body
    );

};
