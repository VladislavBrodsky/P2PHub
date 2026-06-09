import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Send, Sparkles, Loader2 } from 'lucide-react';
import { useHaptic } from '../hooks/useHaptic';
import { useTMALock } from '../hooks/useTMALock';
import { apiClient } from '../api/client';

import { socialLogos } from '../pages/Pro/utils/socialLogos';
import { shareToTelegram, shareUniversal } from '../utils/shareUtils';

interface ShareSheetProps {
    isOpen: boolean;
    onClose: () => void;
    referralCode: string;
}

export const ShareSheet = ({ isOpen, onClose, referralCode }: ShareSheetProps) => {
    const { selection, notification } = useHaptic();
    const [copied, setCopied] = React.useState(false);
    const [isSharing, setIsSharing] = React.useState(false);
    const [isClient, setIsClient] = React.useState(false);
    const [isDesktop, setIsDesktop] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
        const checkBreakpoint = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };
        checkBreakpoint();
        window.addEventListener('resize', checkBreakpoint);
        return () => window.removeEventListener('resize', checkBreakpoint);
    }, []);

    useTMALock(isOpen);

    // Dynamic referral link based on bot username (can be passed as prop or env)
    // For now assuming the standard bot link structure
    const referralLink = `https://t.me/pintopay_probot?start=${referralCode || 'ref_dev'}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            notification('success');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error('Failed to copy', e);
        }
    };

    const handleShare = async (platform?: 'telegram' | 'whatsapp' | 'x') => {
        selection();
        const text = "Join me on Pintopay and start earning passive income! 🚀";

        switch (platform) {
            case 'telegram':
                if (window.Telegram?.WebApp) {
                    // Try 2-tap share (Prepared Inline Message)
                    if ((window.Telegram.WebApp as any).sharePreparedInlineMessage) {
                        setIsSharing(true);
                        try {
                            const res = await apiClient.post('/api/partner/prepared-share');
                            if (res.data?.id) {
                                (window.Telegram.WebApp as any).sharePreparedInlineMessage(res.data.id);
                                setIsSharing(false);
                                return;
                            }
                        } catch (err) {
                            console.error('Failed to get prepared share id:', err);
                        } finally {
                            setIsSharing(false);
                        }
                    }
                    // Fallback to switch inline query
                    window.Telegram.WebApp.switchInlineQuery(referralCode || '');
                } else {
                    shareToTelegram(text, referralLink);
                }
                break;
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + referralLink)}`, '_blank');
                break;
            case 'x':
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, '_blank');
                break;
            default:
                await shareUniversal({
                    title: 'Join Pintopay',
                    text: text,
                    url: referralLink
                });
        }
    };

    if (!isClient) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-9999 flex items-end lg:items-center justify-center lg:p-4">
                    <motion.div
                        key="share-sheet-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        key="share-sheet-content"
                        initial={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%' }}
                        animate={isDesktop ? { scale: 1, opacity: 1 } : { y: 0 }}
                        exit={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%' }}
                        transition={isDesktop ? { duration: 0.2, ease: 'easeOut' } : { type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className={
                            isDesktop
                                ? "relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl z-9999 p-6 shadow-2xl border border-white/10"
                                : "relative w-full bg-white dark:bg-slate-900 rounded-t-3xl z-9999 p-6 pb-12 shadow-2xl border-t border-white/10 overscroll-none"
                        }
                        style={isDesktop ? undefined : { overscrollBehavior: 'none' }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Invite Friends</h3>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Link Preview */}
                        <div className="bg-slate-50 dark:bg-black/20 p-4 rounded-2xl mb-6 flex items-center justify-between border border-slate-200 dark:border-white/5">
                            <div className="truncate flex-1 mr-4">
                                <div className="text-label uppercase font-bold text-slate-400 mb-1">Your Link</div>
                                <div className="text-sm font-mono text-slate-900 dark:text-white truncate">{referralLink}</div>
                            </div>
                            <button
                                onClick={handleCopy}
                                className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                            >
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Premium Share Card Button */}
                        <button
                            onClick={() => handleShare('telegram')}
                            className="w-full h-14 mb-6 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-blue-500/20 border border-white/20 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <Sparkles className="w-5 h-5 text-amber-300" />
                            <span className="font-bold text-sm uppercase tracking-wider">Send Premium Viral Card</span>
                        </button>

                        {/* Share Grid */}
                        <div className="grid grid-cols-4 gap-4">
                            <button
                                onClick={() => handleShare('telegram')}
                                disabled={isSharing}
                                className="flex flex-col items-center gap-2 group disabled:opacity-50"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 dark:bg-sky-500/5 flex items-center justify-center group-active:scale-95 transition-transform relative overflow-hidden">
                                    {isSharing ? (
                                        <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
                                    ) : (
                                        <img src={socialLogos.telegram} alt="Telegram" className="w-8 h-8 object-contain" />
                                    )}
                                </div>
                                <span className="text-xs font-bold uppercase tracking-tighter text-slate-500 dark:text-slate-400">Telegram</span>
                            </button>

                            <button onClick={() => handleShare('whatsapp')} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/5 flex items-center justify-center group-active:scale-95 transition-transform overflow-hidden">
                                    <img src={socialLogos.whatsapp} alt="WhatsApp" className="w-8 h-8 object-contain" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-tighter text-slate-500 dark:text-slate-400">WhatsApp</span>
                            </button>

                            <button onClick={() => handleShare('x')} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center group-active:scale-95 transition-transform overflow-hidden">
                                    <img src={socialLogos.x} alt="X" className="w-6 h-6 object-contain dark:invert" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-tighter text-slate-500 dark:text-slate-400">X</span>
                            </button>

                            <button onClick={() => handleShare()} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center group-active:scale-95 transition-transform">
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400/60" />)}
                                    </div>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-tighter text-slate-500 dark:text-slate-400">More</span>
                            </button>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
