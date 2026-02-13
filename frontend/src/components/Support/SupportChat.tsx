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
    ChevronRight
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
    const { user } = useUser();
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [inputValue, setInputValue] = React.useState('');
    const [isTyping, setIsTyping] = React.useState(false);
    const [showCategories, setShowCategories] = React.useState(true);
    const [sessionClosed, setSessionClosed] = React.useState(false);

    const scrollRef = React.useRef<HTMLDivElement>(null);
    const inactivityTimerRef = React.useRef<any>(null);
    const pingTimerRef = React.useRef<any>(null);

    // Initialize and sync session
    React.useEffect(() => {
        const initSession = async () => {
            if (!isOpen) return;

            try {
                // Fetch status to check if there's an active session
                const response = await apiClient.get('/api/support/status');
                const isActive = response.data.is_active;

                if (messages.length === 0) {
                    setMessages([
                        {
                            id: 'welcome',
                            role: 'assistant',
                            content: t('support.welcome'),
                            timestamp: new Date()
                        }
                    ]);
                }
                resetInactivityTimer();
                // Only show categories if it's a NEW session (not active in backend)
                setShowCategories(!isActive);
                setSessionClosed(false);
            } catch (e) {
                console.error("Failed to init support session", e);
            }
        };

        if (isOpen) {
            initSession();
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

        // 5 minutes total inactivity closure: 4m wait + 1m warning
        inactivityTimerRef.current = setTimeout(() => {
            startInactivityPings();
        }, 4 * 60 * 1000);
    };

    const startInactivityPings = () => {
        let count = 0;
        pingTimerRef.current = setInterval(() => {
            count++;
            if (count === 1) {
                addMessage('assistant', t('support.still_here'));
                notification('warning');
            } else if (count >= 2) {
                handleCloseSession(t('support.session_closed'));
            }
        }, 30 * 1000); // 30s * 2 = 1min warning
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
                <div className="fixed inset-0 z-10000 flex items-end sm:items-center justify-center p-0 sm:p-4 touch-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm sm:backdrop-blur-md"
                    />

                    {/* Chat Window */}
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                        className="relative flex h-full sm:h-[90dvh] w-full max-w-[480px] flex-col overflow-hidden bg-(--color-bg-deep) sm:rounded-3xl shadow-2xl safe-pt safe-pb"
                        style={{
                            // Account for Telegram Header/Footer
                            height: '100dvh',
                            maxHeight: '100dvh'
                        }}
                    >
                        {/* Premium Header */}
                        <div className="relative border-b border-(--color-border-glass) px-4 py-4 shrink-0 bg-(--color-bg-surface)/80 backdrop-blur-xl z-20">
                            {/* Inset for Telegram Header (dots/close) */}
                            <div className="pt-[calc(env(safe-area-inset-top,0px)+12px)] sm:pt-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="relative shrink-0">
                                            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500/20 to-indigo-500/20 text-blue-500 border border-blue-500/30">
                                                <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7" />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border-2 border-(--color-bg-deep) bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-(--color-text-primary)">
                                                    {t('support.manager')}
                                                </h3>
                                                {(user?.level || 0) >= 5 && (
                                                    <span className="hidden xs:flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-blue-500 border border-blue-500/20">
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
                                    <button
                                        onClick={onClose}
                                        className="rounded-xl bg-(--color-text-primary)/5 p-2.5 text-(--color-text-secondary) hover:bg-(--color-text-primary)/10 transition-all active:scale-95"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* User Meta Line */}
                                <div className="mt-3 flex items-center gap-2 rounded-lg bg-(--color-text-primary)/5 px-2 py-1.5 border border-(--color-border-glass)">
                                    <Terminal className="h-3 w-3 text-(--color-text-secondary) opacity-30" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-(--color-text-secondary) opacity-60">
                                        {t('support.user_context', { name: user?.first_name || 'PARTNER', level: user?.level || 1 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide overscroll-contain"
                        >
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`relative max-w-[85%] rounded-2xl px-4 py-3 shadow-lg ${msg.role === 'user'
                                        ? 'bg-linear-to-br from-blue-600 to-blue-700 text-white rounded-tr-none border border-blue-500/20'
                                        : 'bg-(--color-bg-surface) border border-(--color-border-glass) text-(--color-text-primary) rounded-tl-none'
                                        }`}>
                                        <p className="text-[13px] leading-relaxed">
                                            {msg.content}
                                        </p>
                                        <div className={`mt-1.5 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest opacity-40 ${msg.role === 'user' ? 'justify-end text-blue-100' : 'text-(--color-text-secondary)'
                                            }`}>
                                            <Clock className="h-2.5 w-2.5" />
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                    <div className="bg-(--color-bg-surface) border border-(--color-border-glass) rounded-2xl rounded-tl-none px-4 py-3 shadow-lg">
                                        <div className="flex gap-1">
                                            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {showCategories && !isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="h-px flex-1 bg-(--color-border-glass)" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-(--color-text-secondary) opacity-40">
                                            {t('support.suggested_topics')}
                                        </p>
                                        <div className="h-px flex-1 bg-(--color-border-glass)" />
                                    </div>
                                    <div className="grid gap-2">
                                        {Object.keys(t('support.categories', { returnObjects: true }) as any).map((key) => (
                                            <button
                                                key={key}
                                                onClick={() => handleCategoryClick(key)}
                                                className="group flex items-center justify-between rounded-xl border border-(--color-border-glass) bg-(--color-bg-surface) p-3 text-xs font-bold text-(--color-text-primary) hover:border-blue-500/40 transition-all active:scale-[0.98] shadow-sm"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-(--color-bg-deep) text-(--color-text-secondary) group-hover:text-blue-500 transition-colors">
                                                        <Cpu className="h-4 w-4" />
                                                    </div>
                                                    {t(`support.categories.${key}`)}
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-(--color-text-secondary) opacity-30 group-hover:translate-x-1" />
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="border-t border-(--color-border-glass) bg-(--color-bg-surface)/80 p-4 pt-4 backdrop-blur-2xl shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        disabled={sessionClosed}
                                        placeholder={sessionClosed ? t('support.session_closed') : t('support.input_placeholder')}
                                        className="w-full rounded-2xl border border-(--color-border-glass) bg-(--color-bg-deep) px-4 py-3.5 text-sm text-(--color-text-primary) placeholder:text-(--color-text-secondary)/40 focus:border-blue-500/50 focus:outline-none transition-all disabled:opacity-50"
                                    />
                                    <Terminal className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-(--color-text-secondary) opacity-20" />
                                </div>
                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={!inputValue.trim() || isTyping || sessionClosed}
                                    className="flex h-[48px] w-[48px] items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-30"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Final Bottom Space for Telegram Gestures */}
                            <div className="h-[env(safe-area-inset-bottom,0px)] sm:h-2 mt-4" />

                            <div className="flex flex-col items-center gap-1 opacity-20">
                                <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-(--color-text-secondary)">
                                    {t('support.powered_by')}
                                </p>
                                <div className="h-0.5 w-6 rounded-full bg-blue-500" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
