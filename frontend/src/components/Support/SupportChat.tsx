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
    CreditCard,
    Settings2,
    Activity,
    Smartphone,
    TrendingUp
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
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
    }, [resetInactivityTimer, t, isOpen, messages.length]);

    const handleSendMessage = React.useCallback(async (text_val?: string) => {
        const messageText = text_val || inputValue;
        if (!messageText.trim() || isTyping || sessionClosed) return;

        selection();
        addMessage('user', messageText);
        setInputValue('');
        setShowCategories(false);
        setIsTyping(true);

        const delay = Math.floor(Math.random() * 400) + 400;

        const localKB: Record<string, { en: string; ru: string }> = {
            "card_details": {
                en: "To issue a card: Go to the 'Cards' tab, select Virtual or Physical, and click 'Issue Card'. Virtual cards are instant. We accept USDT (TRC20) and TON for issuance and top-ups. Apple Pay and Google Pay are supported immediately!",
                ru: "Для получения карты: Перейдите во вкладку «Карты», выберите Виртуальную или Физическую и нажмите «Выпустить карту». Виртуальные карты выпускаются мгновенно. Мы принимаем USDT (TRC20) и TON для выпуска и пополнения. Apple Pay и Google Pay поддерживаются сразу!"
            },
            "issue_setup": {
                en: "For activation: Ensure your KYC level is appropriate for the card type. Verification typically takes 5-10 minutes. If you experience issues with 3DS, make sure your internet connection is stable.",
                ru: "Для активации: Убедитесь, что ваш уровень KYC соответствует типу карты. Верификация обычно занимает 5-10 минут. Если возникли проблемы с 3DS, проверьте стабильность интернет-соединения."
            },
            "topup_limits": {
                en: "Daily top-up limits start at $5,000 for verified users and go up to $50,000 for Level 2 partners. We use TRC20 for the fastest liquidity and lowest fees.",
                ru: "Дневные лимиты на пополнение начинаются от $5,000 для верифицированных пользователей и доходят до $50,000 для партнеров 2-го уровня. Мы используем TRC20 для максимальной скорости и низких комиссий."
            },
            "apple_google": {
                en: "Absolutely! Pintopay Virtual Cards are fully compatible with Apple Pay and Google Pay. Just add your card details to your mobile wallet app and use it at any NFC-enabled terminal worldwide.",
                ru: "Конечно! Виртуальные карты Pintopay полностью совместимы с Apple Pay и Google Pay. Просто добавьте данные карты в приложение кошелька на телефоне и используйте её в любом терминале с поддержкой NFC."
            },
            "earnings": {
                en: "Our network strategy is simple: Share your link, earn on issuance fees (up to 30%), and receive lifetime transaction rewards (up to 0.5%). Build a network of 5,000 partners to reach our $1/minute milestone!",
                ru: "Наша сетевая стратегия проста: делитесь ссылкой, зарабатывайте на комиссиях за выпуск (до 30%) и получайте пожизненные вознаграждения за транзакции (до 0,5%). Постройте сеть из 5 000 партнеров, чтобы достичь цели $1 в минуту!"
            },
            "security": {
                en: "Pintopay uses banking-grade 3DS security and encrypted asset storage. If your card is lost, you can Freeze it instantly in the app. Pintopay will never ask for your private keys or passwords.",
                ru: "Pintopay использует банковскую защиту 3DS и зашифрованное хранение активов. Если карта потеряна, вы можете мгновенно заморозить её в приложении. Pintopay никогда не запрашивает ваши приватные ключи или пароли."
            },
            "trading": {
                en: "Our P2P Trading Hub is protected by a 24/7 Escrow system. If you encounter an issue during a trade, simply click the 'Dispute' button and a human moderator will join within minutes to resolve the situation.",
                ru: "Наш P2P-хаб защищен системой Escrow, работающей 24/7. Если у вас возникла проблема во время сделки, просто нажмите кнопку «Апелляция», и наш модератор подключится в течение нескольких минут для решения вопроса."
            },
            "vip": {
                en: "PRO members at Level 5+ get direct access to our Priority Executive Line. Your inquiries are handled by our top-tier neural agents and senior human supervisors with sub-5 minute response times.",
                ru: "Партнеры уровня 5+ с PRO-статусом получают прямой доступ к Приоритетной Линии. Ваши запросы обрабатываются лучшими ИИ-агентами и старшими менеджерами с временем ответа менее 5 минут."
            }
        };

        const currentLang = i18n.language.startsWith('ru') ? 'ru' : 'en';

        try {
            // Contextual Auto-Intelligence
            const lowerMsg = messageText.toLowerCase();

            // If it's a category click or exact question
            const categoryMatch = Object.keys(localKB).find(k =>
                t(`support.categories.${k}`).toLowerCase().trim() === messageText.toLowerCase().trim()
            );

            if (categoryMatch) {
                setTimeout(() => {
                    addMessage('assistant', localKB[categoryMatch][currentLang]);
                    setIsTyping(false);
                    resetInactivityTimer();
                }, delay + 800);
                return;
            }

            const response = await apiClient.post('/api/support/chat', { message: messageText });
            setTimeout(() => {
                addMessage('assistant', response.data.answer);
                setIsTyping(false);
                resetInactivityTimer();
            }, delay);
        } catch (e) {
            setIsTyping(false);
            console.error("Chat error:", e);

            // Intelligent Fallback Logic if backend fails
            const lowerMsg = messageText.toLowerCase();
            const fallbackKey = Object.keys(localKB).find(k => lowerMsg.includes(k.replace('_', '')))
                || (lowerMsg.includes('card') || lowerMsg.includes('карт') ? 'card_details' : null)
                || (lowerMsg.includes('earn') || lowerMsg.includes('доход') ? 'earnings' : null);

            if (fallbackKey && localKB[fallbackKey]) {
                addMessage('assistant', localKB[fallbackKey][currentLang]);
            } else {
                addMessage('assistant', t('support.error_technical'));
            }
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
                        className="relative flex h-full sm:h-[85dvh] w-full max-w-[440px] flex-col overflow-hidden bg-white dark:bg-slate-950 sm:rounded-[32px] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.5)] safe-pt border-x border-t sm:border border-slate-200 dark:border-white/5"
                        style={{
                            height: '100dvh',
                            maxHeight: '100dvh'
                        }}
                    >
                        {/* Premium Header */}
                        <div className="relative shrink-0 z-20">
                            {/* Mesh Gradient Background for Header */}
                            <div className="absolute inset-0 mesh-gradient-dark opacity-30" />
                            <div className="relative border-b border-slate-200 dark:border-white/10 px-4 py-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl">
                                {/* Inset for Telegram Header (dots/close) */}
                                <div className="pt-10 sm:pt-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="relative shrink-0">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-linear-to-br from-blue-500/20 to-indigo-600/20 text-blue-500 border border-blue-500/30 shadow-[0_4px_12px_-4px_rgba(59,130,246,0.3)]">
                                                    <ShieldCheck className="h-6 w-6" />
                                                </div>
                                                <motion.div
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-950 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-900 dark:text-white">
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
                                            className="rounded-xl bg-slate-900/5 dark:bg-white/5 p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-900/10 dark:hover:bg-white/10 transition-all active:scale-90 border border-slate-200 dark:border-white/10"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* User Meta Line - "Elite Console Style" */}
                                    <div className="mt-4 flex items-center gap-3 rounded-xl bg-black/20 dark:bg-white/5 px-3 py-2 border border-slate-200 dark:border-white/10 shadow-inner">
                                        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-500/10 border border-blue-500/20">
                                            <Terminal className="h-3 w-3 text-blue-400 opacity-70" />
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 truncate">
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
                            className="flex-1 overflow-y-auto px-4 py-4 space-y-6 custom-scrollbar hide-scrollbar overscroll-contain relative"
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
                                    <div className={`relative max-w-[90%] rounded-2xl px-4 py-3 shadow-xl ${msg.role === 'user'
                                        ? 'vibing-blue-animated text-white rounded-tr-none border border-white/10'
                                        : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-tl-none shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)]'
                                        }`}>

                                        {/* Assistant Message Glow */}
                                        {msg.role === 'assistant' && (
                                            <div className="absolute -inset-0.5 rounded-[inherit] bg-linear-to-br from-blue-500/10 to-indigo-500/10 opacity-50 blur-sm -z-10" />
                                        )}

                                        <p className="text-[14px] leading-relaxed font-medium">
                                            {renderMessageContent(msg.content)}
                                        </p>
                                        <div className={`mt-1.5 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest opacity-30 ${msg.role === 'user' ? 'justify-end text-blue-50' : 'text-slate-500 dark:text-slate-400'
                                            }`}>
                                            <Clock className="h-2.5 w-2.5" />
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex justify-start">
                                    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl rounded-tl-none px-5 py-4 shadow-lg">
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
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-px flex-1 bg-linear-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 opacity-60">
                                            {t('support.suggested_topics')}
                                        </p>
                                        <div className="h-px flex-1 bg-linear-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.keys(t('support.categories', { returnObjects: true }) as any).map((key, i) => {
                                            const icons: Record<string, any> = {
                                                card_details: CreditCard,
                                                issue_setup: Settings2,
                                                topup_limits: Activity,
                                                apple_google: Smartphone,
                                                earnings: TrendingUp,
                                                security: ShieldCheck
                                            };
                                            const Icon = icons[key] || Cpu;

                                            return (
                                                <motion.button
                                                    key={key}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.4 + (i * 0.05) }}
                                                    onClick={() => handleCategoryClick(key)}
                                                    className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-3 text-left hover:border-blue-500/40 hover:bg-blue-500/5 transition-all active:scale-[0.96] shadow-sm"
                                                >
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-all">
                                                        <Icon className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-xs font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
                                                        {t(`support.categories.${key}`)}
                                                    </span>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="relative border-t border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 p-4 pt-4 pb-6 backdrop-blur-3xl shrink-0 safe-pb">
                            {/* Glass background overlay */}
                            <div className="absolute inset-0 mesh-gradient-dark opacity-5 pointer-events-none" />

                            <div className="relative flex items-center gap-2">
                                <div className="relative flex-1 group">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        disabled={sessionClosed}
                                        placeholder={sessionClosed ? t('support.session_closed') : t('support.input_placeholder')}
                                        className="w-full rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 pr-10 pl-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500/50 focus:border-blue-500/40 focus:bg-white dark:focus:bg-white/10 focus:outline-none transition-all disabled:opacity-50 shadow-inner"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none opacity-20 group-focus-within:opacity-40 transition-opacity">
                                        <div className="h-3 w-px bg-slate-400 dark:bg-slate-500 mx-0.5" />
                                        <Terminal className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={!inputValue.trim() || isTyping || sessionClosed}
                                    className="flex h-[46px] w-[46px] items-center justify-center rounded-xl vibing-blue-animated text-white shadow-lg active:scale-90 transition-all disabled:opacity-30 disabled:shadow-none shrink-0"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="mt-4 flex flex-col items-center gap-1.5 opacity-20 select-none">
                                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                                    {t('support.powered_by')}
                                </p>
                                <div className="h-[2px] w-6 rounded-full bg-linear-to-r from-blue-500/50 to-indigo-500/50" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
