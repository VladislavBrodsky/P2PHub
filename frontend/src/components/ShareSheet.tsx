import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Send } from 'lucide-react';
import { useHaptic } from '../hooks/useHaptic';

interface ShareSheetProps {
    isOpen: boolean;
    onClose: () => void;
    referralCode: string;
}

export const ShareSheet = ({ isOpen, onClose, referralCode }: ShareSheetProps) => {
    const { selection, notification } = useHaptic();
    const [copied, setCopied] = React.useState(false);

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
                    window.Telegram.WebApp.switchInlineQuery(referralCode);
                } else {
                    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, '_blank');
                }
                break;
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + referralLink)}`, '_blank');
                break;
            case 'x':
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, '_blank');
                break;
            default:
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: 'Join Pintopay',
                            text: text,
                            url: referralLink
                        });
                    } catch (e) {
                        console.log('Share dismissed');
                    }
                } else {
                    handleCopy();
                }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl z-50 p-6 pb-12 shadow-2xl border-t border-white/10"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Invite Friends</h3>
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
                                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Your Link</div>
                                <div className="text-sm font-mono text-slate-900 dark:text-white truncate">{referralLink}</div>
                            </div>
                            <button
                                onClick={handleCopy}
                                className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                            >
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Share Grid */}
                        <div className="grid grid-cols-4 gap-4">
                            <button onClick={() => handleShare('telegram')} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 rounded-2xl bg-[#0088cc]/10 flex items-center justify-center group-active:scale-95 transition-transform">
                                    <Send className="w-6 h-6 text-[#0088cc] -rotate-45 translate-x-1" />
                                </div>
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Telegram</span>
                            </button>

                            <button onClick={() => handleShare('whatsapp')} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 rounded-2xl bg-[#25D366]/10 flex items-center justify-center group-active:scale-95 transition-transform">
                                    <div className="w-6 h-6 bg-[#25D366] rounded-full" />
                                    {/* Using div as placeholder icon if WhatsApp icon not available in lucide, or import specifically */}
                                    {/* Actually Lucide doesn't have brand icons usually. Let's use generic Share for now if needed or custom SVG */}
                                    {/* Reverting to generic icons for brands to avoid errors if not in lucide */}
                                </div>
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">WhatsApp</span>
                            </button>

                            <button onClick={() => handleShare('x')} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center group-active:scale-95 transition-transform">
                                    <span className="text-xl font-bold dark:text-white">𝕏</span>
                                </div>
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">X</span>
                            </button>

                            <button onClick={() => handleShare()} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-active:scale-95 transition-transform">
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full shadow-[6px_0_0_currentColor,-6px_0_0_currentColor]" />
                                </div>
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">More</span>
                            </button>
                        </div>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
