import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    X,
    Clock,
    ShieldCheck,
    Cpu,
    BadgeCheck,
    Terminal,
    Zap,
    ChevronRight,
    MessageSquare
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptic } from '../../hooks/useHaptic';
import { apiClient } from '../../api/client';
import { useUser } from '../../context/UserContext';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface SupportChatProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SupportChat({ isOpen, onClose }: SupportChatProps) {
    const { t } = useTranslation();
    const { selection, notification } = useHaptic();
    // #comment: Accessing user context to provide a personalized "Executive" experience with real-time level/name data
    const { user } = useUser();
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [inputValue, setInputValue] = React.useState('');
    const [isTyping, setIsTyping] = React.useState(false);
    const [showCategories, setShowCategories] = React.useState(true);
    const [sessionClosed, setSessionClosed] = React.useState(false);

    const scrollRef = React.useRef<HTMLDivElement>(null);
    // #comment: Strategic inactivity tracking to maintain Pintopay's "Always Online" elite service standards
    const inactivityTimerRef = React.useRef<any>(null);
    const pingTimerRef = React.useRef<any>(null);

    // Initial message
    React.useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    id: 'welcome',
                    role: 'assistant',
                    content: t('support.welcome'),
                    timestamp: new Date()
                }
            ]);
            resetInactivityTimer();
        }
    }, [isOpen]);

    // Scroll to bottom
    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const resetInactivityTimer = () => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);

        inactivityTimerRef.current = setTimeout(() => {
            startInactivityPings();
        }, 5 * 60 * 1000);
    };

    const startInactivityPings = () => {
        let count = 0;
        pingTimerRef.current = setInterval(() => {
            count++;
            if (count <= 3) {
                addMessage('assistant', t('support.still_here'));
                notification('warning');
            } else {
                handleCloseSession(t('support.session_closed'));
            }
        }, 60 * 1000);
    };

    const handleCloseSession = async (reason?: string) => {
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

        if (reason) {
            addMessage('assistant', reason);
        }

        try {
            await apiClient.post('/api/support/close');
            setSessionClosed(true);
            setTimeout(onClose, 3000);
        } catch (e) {
            onClose();
        }
    };

    const addMessage = (role: 'user' | 'assistant', content: string) => {
        const newMessage: Message = {
            id: Math.random().toString(36).substr(2, 9),
            role,
            content,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
        if (role === 'user') {
            resetInactivityTimer();
        }
    };

    const handleSendMessage = async (text?: string) => {
        const messageText = text || inputValue;
        if (!messageText.trim() || isTyping || sessionClosed) return;

        selection();
        addMessage('user', messageText);
        setInputValue('');
        setShowCategories(false);
        setIsTyping(true);

        // #comment: Hyper-snappy response delay (0.4s-0.8s) for an elite reactive feel.
        // We moved from 2.5s down to sub-second to match GPT-4o-Mini backend speed.
        const delay = Math.floor(Math.random() * 400) + 400;

        try {
            const response = await apiClient.post('/api/support/chat', { message: messageText });
            setTimeout(() => {
                addMessage('assistant', response.data.answer);
                setIsTyping(false);
                resetInactivityTimer();
            }, delay);
        } catch (e) {
            setIsTyping(false);
            addMessage('assistant', t('support.error_technical'));
        }
    };

    const handleCategoryClick = (categoryKey: string) => {
        handleSendMessage(t(`support.categories.${categoryKey}`));
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-10000 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Chat Window */}
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        // #comment: Specialized spring transition for a "fluid/tactile" feel typical of premium iOS/Android apps
                        transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                        className="relative flex h-[92dvh] w-full max-w-[480px] flex-col overflow-hidden bg-(--color-bg-deep) border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                    >
                        {/* #comment: High-end glassmorphism header with animated flares to signal "Premium Support" status */}
                        {/* Premium Header */}
                        <div className="relative overflow-hidden border-b border-white/10 px-4 py-4 shrink-0">
                            {/* Animated background flare */}
                            <div className="absolute -top-10 -right-10 h-32 w-32 bg-blue-500/10 blur-3xl animate-pulse" />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                            <ShieldCheck className="h-7 w-7" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-(--color-bg-deep) bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-(--color-text-primary)">
                                                {t('support.manager')}
                                            </h3>
                                            {(user?.level || 0) >= 5 && (
                                                <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-blue-400 border border-blue-500/20">
                                                    <BadgeCheck className="h-2.5 w-2.5" />
                                                    {t('support.priority_badge')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 pt-0.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] opacity-80">{t('support.online')}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={onClose} className="group rounded-xl bg-white/5 p-2.5 text-white/30 hover:bg-white/10 hover:text-white/80 transition-all active:scale-95">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* User Context Line */}
                            <div className="mt-3 flex items-center gap-2 rounded-lg bg-black/20 px-2 py-1.5 border border-white/5">
                                <Terminal className="h-3 w-3 text-white/20" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
                                    {t('support.user_context', { name: user?.first_name || 'PARTNER', level: user?.level || 1 })}
                                </span>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth scrollbar-hide"
                        >
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={msg.id}
                                    // #comment: Staggered entrance for messages to simulate natural conversation flow and visual elegance
                                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.3, delay: idx === messages.length - 1 ? 0 : idx * 0.05 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`relative max-w-[88%] rounded-2xl px-4 py-3.5 shadow-xl ${msg.role === 'user'
                                        ? 'bg-linear-to-br from-blue-600 to-blue-700 text-white rounded-tr-none border border-blue-500/50'
                                        : 'bg-white/5 backdrop-blur-xl border border-white/10 text-(--color-text-primary) rounded-tl-none shadow-black/20'
                                        }`}>

                                        <p className="text-[13px] font-medium leading-relaxed tracking-wide">
                                            {msg.content}
                                        </p>

                                        <div className={`mt-2 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'justify-end text-blue-200/60' : 'justify-start text-white/20'
                                            }`}>
                                            <Clock className="h-2.5 w-2.5" />
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>

                                        {msg.role === 'assistant' && idx === 0 && (
                                            <Zap className="absolute -top-1 -left-1 h-3 w-3 text-blue-500/40" />
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl rounded-tl-none px-4 py-4 shadow-xl">
                                        <div className="flex gap-1.5">
                                            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="h-1.5 w-1.5 rounded-full bg-blue-500/80" />
                                            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-blue-500/80" />
                                            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-blue-500/80" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {showCategories && !isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="pt-2"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="h-px flex-1 bg-white/5" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">{t('support.suggested_topics')}</p>
                                        <div className="h-px flex-1 bg-white/5" />
                                    </div>
                                    <div className="grid grid-cols-1 gap-2.5">
                                        {Object.keys(t('support.categories', { returnObjects: true }) as any).map((key, i) => (
                                            <motion.button
                                                key={key}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.5 + (i * 0.05) }}
                                                onClick={() => handleCategoryClick(key)}
                                                className="group relative flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-xs font-bold text-white/70 hover:bg-blue-600/10 hover:border-blue-500/30 hover:text-white transition-all active:scale-[0.98]"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-6 w-6 flex items-center justify-center rounded-lg bg-white/5 group-hover:bg-blue-500/20 text-white/20 group-hover:text-blue-400 transition-colors">
                                                        <Cpu className="h-3.5 w-3.5" />
                                                    </div>
                                                    {t(`support.categories.${key}`)}
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-white/10 group-hover:text-blue-500/50 group-hover:translate-x-1 transition-all" />
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Tactical Input Area */}
                        <div className="border-t border-white/10 bg-black/40 p-4 pb-6 backdrop-blur-2xl shrink-0 safe-pb">
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        disabled={sessionClosed}
                                        placeholder={sessionClosed ? t('support.session_closed') : t('support.input_placeholder')}
                                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-[13px] text-white placeholder:text-white/20 focus:border-blue-500/40 focus:bg-white/10 focus:outline-none transition-all disabled:opacity-50 shadow-inner"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center text-white/10">
                                        <Terminal className="h-3.5 w-3.5" />
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={!inputValue.trim() || isTyping || sessionClosed}
                                    className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)] hover:bg-blue-500 active:scale-90 transition-all disabled:opacity-30 disabled:grayscale"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="mt-4 flex flex-col items-center gap-1">
                                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">
                                    {t('support.powered_by')}
                                </p>
                                <div className="h-0.5 w-8 rounded-full bg-blue-500/20" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
