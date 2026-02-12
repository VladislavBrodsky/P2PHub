import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useEffect } from 'react';
import { X } from 'lucide-react';

export const NotificationOverlay = () => {
    const { notification, hideNotification } = useNotificationStore();

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                hideNotification();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification, hideNotification]);

    // #comment Handle swipe-down gesture to dismiss notification
    const handleDragEnd = (_event: any, info: any) => {
        // If dragged down more than 50px, dismiss the notification
        if (info.offset.y > 50) {
            hideNotification();
        }
    };

    return (
        <AnimatePresence>
            {notification && (
                <motion.div
                    key={`${notification.title}-${notification.message}`}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 200 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    initial={{ opacity: 0, y: 100, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 100, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className="fixed bottom-0 left-0 right-0 z-10000 flex justify-center pointer-events-none px-4 pb-[calc(env(safe-area-inset-bottom,24px)+110px)]"
                    whileDrag={{ scale: 0.95, opacity: 0.8 }}
                >
                    <div className={`
                        glass-panel-premium rounded-full px-4 py-3 shadow-2xl flex items-center gap-3 max-w-sm w-full pointer-events-auto 
                        backdrop-blur-3xl bg-white/80 dark:bg-slate-900/80 border transition-colors duration-500 touch-pan-y
                        ${notification.type === 'success' ? 'border-blue-500/30' :
                            notification.type === 'warning' ? 'border-emerald-500/30' :
                                'border-amber-500/30'}
                    `}>
                        {notification.icon && (
                            <div className="relative">
                                {/* #comment Accent glow for the icon */}
                                <div className={`absolute inset-0 blur-lg opacity-40 animate-pulse ${notification.type === 'success' ? 'bg-blue-500' :
                                        notification.type === 'warning' ? 'bg-emerald-500' :
                                            'bg-amber-500'
                                    }`} />
                                <div className="relative z-10 shrink-0">
                                    {notification.icon}
                                </div>
                            </div>
                        )}
                        <div className="flex-1 overflow-hidden">
                            <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{notification.title}</h4>
                                <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                    Just Now
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-600 dark:text-slate-300 truncate font-bold">{notification.message}</p>
                        </div>
                        <button
                            onClick={hideNotification}
                            className="p-1 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={14} className="text-slate-400 dark:text-slate-500" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
