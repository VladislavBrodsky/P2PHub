import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    X,
    Headphones,
    ChevronRight,
    MoreVertical,
    Clock,
    User,
    ShieldCheck
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHaptic } from '../../hooks/useHaptic';
import { apiClient } from '../../api/client';

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

const CATEGORIES = [
    "Pintopay Card Details",
    "Card Issue & Setup",
    "Top-up & Limits",
    "ApplePay / GooglePay",
    "Earnings & Network",
    "Security & Technical"
];

export function SupportChat({ isOpen, onClose }: SupportChatProps) {
    const { t } = useTranslation();
    const { selection, notification } = useHaptic();
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [inputValue, setInputValue] = React.useState('');
    const [isTyping, setIsTyping] = React.useState(false);
    const [showCategories, setShowCategories] = React.useState(true);
    const [sessionClosed, setSessionClosed] = React.useState(false);

    const scrollRef = React.useRef<HTMLDivElement>(null);
    const inactivityTimerRef = React.useRef<any>(null);
    const pingTimerRef = React.useRef<any>(null);

    // Initial message
    React.useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    id: 'welcome',
                    role: 'assistant',
                    content: "Hello! I'm your Pintopay Support Manager. How can I help you today? Please choose a category or type your question below.",
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

    // Inactivity Logic
    const resetInactivityTimer = () => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);

        inactivityTimerRef.current = setTimeout(() => {
            // After 5 minutes of inactivity
            startInactivityPings();
        }, 5 * 60 * 1000);
    };

    const startInactivityPings = () => {
        let count = 0;
        pingTimerRef.current = setInterval(() => {
            count++;
            if (count <= 3) {
                // Ask each minute
                addMessage('assistant', "Are you still here? I'm ready to help you with any questions about Pintopay.");
                notification('warning');
            } else {
                // Close after 3 pings
                handleCloseSession("Session closed due to inactivity.");
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
            console.error("Failed to close session", e);
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

        // Typing effect
        setIsTyping(true);

        // Random delay 3-5 sec
        const delay = Math.floor(Math.random() * 2000) + 3000;

        try {
            const response = await apiClient.post('/api/support/chat', { message: messageText });
            setTimeout(() => {
                addMessage('assistant', response.data.answer);
                setIsTyping(false);
                resetInactivityTimer();
            }, delay);
        } catch (e) {
            setIsTyping(false);
            addMessage('assistant', "I'm sorry, I'm having temporary technical difficulties. Please try again or visit our FAQ.");
        }
    };

    const handleCategoryClick = (category: string) => {
        handleSendMessage(`I want to know about: ${category}`);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-10000 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Chat Window */}
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative flex h-[90vh] w-full max-w-[450px] flex-col overflow-hidden bg-(--color-bg-deep) border-t sm:border border-(--color-border-glass) rounded-t-3xl sm:rounded-3xl shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-(--color-border-glass) bg-white/5 px-4 py-3 backdrop-blur-xl">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-500">
                                        <ShieldCheck className="h-6 w-6" />
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-(--color-bg-deep) bg-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-wider text-(--color-text-primary)">
                                        Support Manager
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest opacity-80">Online</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="rounded-full bg-white/10 p-2 text-white/50 hover:bg-white/20 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
                        >
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-lg ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-(--color-bg-surface)/80 backdrop-blur-sm border border-(--color-border-glass) text-(--color-text-primary) rounded-tl-none'
                                        }`}>
                                        <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                                        <div className={`mt-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest opacity-40 ${msg.role === 'user' ? 'justify-end text-blue-100' : 'justify-start'
                                            }`}>
                                            <Clock className="h-2.5 w-2.5" />
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-(--color-bg-surface)/80 backdrop-blur-sm border border-(--color-border-glass) rounded-2xl rounded-tl-none px-4 py-3 shadow-lg">
                                        <div className="flex gap-1">
                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {showCategories && !isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="pt-2 grid grid-cols-1 gap-2"
                                >
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-(--color-text-secondary) mb-1 ml-1 opacity-60">Suggested Topics</p>
                                    <div className="flex flex-wrap gap-2">
                                        {CATEGORIES.map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => handleCategoryClick(cat)}
                                                className="rounded-xl border border-(--color-border-glass) bg-(--color-bg-surface)/40 px-3 py-2 text-xs font-bold text-(--color-text-primary) hover:bg-blue-500/10 hover:border-blue-500/30 transition-all flex items-center gap-2"
                                            >
                                                <ChevronRight className="h-3 w-3 text-blue-500" />
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="border-t border-(--color-border-glass) bg-white/5 p-4 backdrop-blur-xl">
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        disabled={sessionClosed}
                                        placeholder={sessionClosed ? "Session Closed" : "Ask anything about Pintopay..."}
                                        className="w-full rounded-2xl border border-(--color-border-glass) bg-black/20 px-4 py-3 text-sm text-(--color-text-primary) placeholder:text-(--color-text-secondary)/40 focus:border-blue-500/50 focus:outline-none transition-all disabled:opacity-50"
                                    />
                                </div>
                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={!inputValue.trim() || isTyping || sessionClosed}
                                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:bg-slate-700"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </div>
                            <p className="mt-3 text-center text-[9px] font-bold uppercase tracking-widest text-(--color-text-secondary) opacity-40">
                                Pintopay Support Agent • Powered by Elite Intelligence
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
