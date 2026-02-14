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


    // Scroll to bottom
    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // State-only functions or those with minimal dependencies
    const handleCloseSession = React.useCallback(async (reason?: string) => {
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

        if (reason) {
            const newMessage: Message = {
                id: Math.random().toString(36).substring(2, 11),
                role: 'assistant',
                content: reason,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, newMessage]);
        }

        try {
            await apiClient.post('/api/support/close');
            setSessionClosed(true);
            setTimeout(onClose, 3000);
        } catch (e) {
            onClose();
        }
    }, [onClose]);

    // Use a ref for resetInactivityTimer to resolve circular dependency with addMessage
    const resetTimerRef = React.useRef<() => void>(() => { });

    const addMessage = React.useCallback((role: 'user' | 'assistant', content: string) => {
        const newMessage: Message = {
            id: Math.random().toString(36).substring(2, 11),
            role,
            content,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
        if (role === 'user') {
            resetTimerRef.current();
        }
    }, []);

    const startInactivityPings = React.useCallback(() => {
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
    }, [addMessage, handleCloseSession, notification, t]);

    const resetInactivityTimer = React.useCallback(() => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);

        // 5 minutes total inactivity closure: 4m wait + 1m warning
        inactivityTimerRef.current = setTimeout(() => {
            startInactivityPings();
        }, 4 * 60 * 1000);
    }, [startInactivityPings]);

    // Sync the ref
    React.useEffect(() => {
        resetTimerRef.current = resetInactivityTimer;
    }, [resetInactivityTimer]);

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
    }, [isOpen, messages.length, resetInactivityTimer, t]);

    const handleSendMessage = React.useCallback(async (text_val?: string) => {
        const messageText = text_val || inputValue;
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
    }, [addMessage, inputValue, isTyping, resetInactivityTimer, selection, sessionClosed, t]);

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
                        className="relative flex h-full sm:h-[90dvh] w-full max-w-[480px] flex-col overflow-hidden bg-(--color-bg-deep) sm:rounded-[32px] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.5)] safe-pt safe-pb border-x border-t sm:border border-(--color-border-glass)"
                        style={{
                            height: '100dvh',
                            maxHeight: '100dvh'
                        }}
                    >
                        {/* Premium Header */}
                        <div className="relative shrink-0 z-20">
                            {/* Mesh Gradient Background for Header */}
                            <div className="absolute inset-0 mesh-gradient-dark opacity-40" />
                            <div className="relative border-b border-(--color-border-glass) px-5 py-4 bg-(--color-bg-surface)/40 backdrop-blur-2xl">
                                {/* Inset for Telegram Header (dots/close) */}
                                <div className="pt-[calc(env(safe-area-inset-top,0px)+12px)] sm:pt-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="relative shrink-0">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-linear-to-br from-blue-500/20 to-indigo-600/20 text-blue-500 border border-blue-500/30 shadow-[0_8px_20px_-4px_rgba(59,130,246,0.3)]">
                                                    <ShieldCheck className="h-7 w-7" />
                                                </div>
                                                <motion.div
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-(--color-bg-deep) bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-black uppercase tracking-[0.15em] text-(--color-text-primary)">
                                                        {t('support.manager')}
                                                    </h3>
                                                    {(user?.level || 0) >= 5 && (
                                                        <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-blue-500 border border-blue-500/20 shadow-sm">
                                                            <BadgeCheck className="h-2.5 w-2.5" />
                                                            {t('support.priority_badge')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 pt-0.5 mt-0.5">
                                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[10px] font-black text-emerald-500/90 uppercase tracking-[0.25em]">{t('support.online')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="rounded-2xl bg-(--color-text-primary)/5 p-3 text-(--color-text-secondary) hover:bg-(--color-text-primary)/10 transition-all active:scale-90 border border-(--color-border-glass)"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {/* User Meta Line - "Elite Console Style" */}
                                    <div className="mt-4 flex items-center gap-3 rounded-xl bg-black/20 dark:bg-white/5 px-3 py-2 border border-(--color-border-glass) shadow-inner">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-500/10 border border-blue-500/20">
                                            <Terminal className="h-3 w-3 text-blue-400 opacity-70" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-(--color-text-secondary) truncate">
                                            {t('support.user_context', { name: user?.first_name || 'PARTNER', level: user?.level || 1 })}
                                        </span>
                                        <div className="ml-auto flex items-center gap-1">
                                            <Zap className="h-2.5 w-2.5 text-amber-400" />
                                            <span className="text-[8px] font-black text-amber-400/80 uppercase">{user?.balance?.toFixed(2) || '0.00'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto px-5 py-6 space-y-8 custom-scrollbar hide-scrollbar overscroll-contain relative"
                        >
                            {/* Subtle background element */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-linear-to-b from-blue-500/5 to-transparent pointer-events-none" />

                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`relative max-w-[88%] rounded-3xl px-5 py-4 shadow-2xl ${msg.role === 'user'
                                        ? 'vibing-blue-animated text-white rounded-tr-none border border-white/10'
                                        : 'bg-(--color-bg-surface)/60 backdrop-blur-md border border-(--color-border-glass) text-(--color-text-primary) rounded-tl-none shadow-[0_8px_32px_-8px_rgba(0,0,0,0.15)]'
                                        }`}>

                                        {/* Assistant Message Glow */}
                                        {msg.role === 'assistant' && (
                                            <div className="absolute -inset-0.5 rounded-[inherit] bg-linear-to-br from-blue-500/10 to-indigo-500/10 opacity-50 blur-sm -z-10" />
                                        )}

                                        <p className="text-[14px] leading-relaxed font-medium">
                                            {msg.content}
                                        </p>
                                        <div className={`mt-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] opacity-40 ${msg.role === 'user' ? 'justify-end text-blue-50' : 'text-(--color-text-secondary)'
                                            }`}>
                                            <Clock className="h-3 w-3" />
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex justify-start">
                                    <div className="bg-(--color-bg-surface)/40 backdrop-blur-md border border-(--color-border-glass) rounded-2xl rounded-tl-none px-5 py-4 shadow-lg">
                                        <div className="flex gap-1.5 px-1">
                                            {[0, 0.2, 0.4].map((delay) => (
                                                <motion.span
                                                    key={delay}
                                                    animate={{
                                                        y: [0, -5, 0],
                                                        opacity: [0.3, 1, 0.3],
                                                        scale: [1, 1.2, 1]
                                                    }}
                                                    transition={{
                                                        repeat: Infinity,
                                                        duration: 1.2,
                                                        delay
                                                    }}
                                                    className="h-2 w-2 rounded-full bg-blue-500"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {showCategories && !isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="pt-4"
                                >
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="h-px flex-1 bg-linear-to-r from-transparent via-(--color-border-glass) to-transparent" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-(--color-text-secondary) opacity-50">
                                            {t('support.suggested_topics')}
                                        </p>
                                        <div className="h-px flex-1 bg-linear-to-r from-transparent via-(--color-border-glass) to-transparent" />
                                    </div>
                                    <div className="grid gap-3">
                                        {Object.keys(t('support.categories', { returnObjects: true }) as any).map((key, i) => (
                                            <motion.button
                                                key={key}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.5 + (i * 0.1) }}
                                                onClick={() => handleCategoryClick(key)}
                                                className="group flex items-center justify-between rounded-2xl border border-(--color-border-glass) bg-(--color-bg-surface)/40 backdrop-blur-md p-4 text-sm font-bold text-(--color-text-primary) hover:border-blue-500/40 hover:bg-blue-500/5 transition-all active:scale-[0.98] shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)]"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-bg-deep) text-(--color-text-secondary) group-hover:text-blue-500 group-hover:bg-blue-500/10 border border-(--color-border-glass) transition-all">
                                                        <Cpu className="h-5 w-5" />
                                                    </div>
                                                    <span className="tracking-tight">{t(`support.categories.${key}`)}</span>
                                                </div>
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-(--color-bg-deep) opacity-0 group-hover:opacity-100 transition-all">
                                                    <ChevronRight className="h-4 w-4 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="relative border-t border-(--color-border-glass) bg-(--color-bg-surface)/60 p-5 pt-5 pb-8 backdrop-blur-3xl shrink-0">
                            {/* Glass background overlay */}
                            <div className="absolute inset-0 mesh-gradient-dark opacity-10 pointer-events-none" />

                            <div className="relative flex items-center gap-3">
                                <div className="relative flex-1 group">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        disabled={sessionClosed}
                                        placeholder={sessionClosed ? t('support.session_closed') : t('support.input_placeholder')}
                                        className="w-full rounded-[20px] border border-(--color-border-glass) bg-black/10 dark:bg-white/5 pr-12 pl-5 py-4 text-sm font-medium text-(--color-text-primary) placeholder:text-(--color-text-secondary)/30 focus:border-blue-500/40 focus:bg-black/20 dark:focus:bg-white/10 focus:outline-none transition-all disabled:opacity-50 shadow-inner"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none opacity-20 group-focus-within:opacity-40 transition-opacity">
                                        <div className="h-4 w-px bg-(--color-text-secondary) mx-1" />
                                        <Terminal className="h-4 w-4 text-(--color-text-secondary)" />
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={!inputValue.trim() || isTyping || sessionClosed}
                                    className="flex h-[54px] w-[54px] items-center justify-center rounded-[20px] vibing-blue-animated text-white shadow-[0_12px_24px_-8px_rgba(59,130,246,0.6)] active:scale-90 transition-all disabled:opacity-30 disabled:shadow-none shrink-0"
                                >
                                    <Send className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="mt-5 flex flex-col items-center gap-2 opacity-30 select-none">
                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-(--color-text-secondary)">
                                    {t('support.powered_by')}
                                </p>
                                <div className="h-[3px] w-8 rounded-full bg-linear-to-r from-blue-500/50 to-indigo-500/50" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
