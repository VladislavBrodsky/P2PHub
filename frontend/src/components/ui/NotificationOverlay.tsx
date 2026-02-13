import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useUI } from '../../context/UIContext';

export const NotificationOverlay = () => {
    const { notification, hideNotification } = useNotificationStore();
    const { isNotificationsVisible } = useUI();

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
            {notification && isNotificationsVisible && (
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
                    className="fixed bottom-0 left-0 right-0 z-10000 flex justify-center pointer-events-none px-4 pb-[calc(env(safe-area-inset-bottom,24px)+145px)]"
                    whileDrag={{ scale: 0.95, opacity: 0.8 }}
                >
                    <div className={`
                        glass-panel-premium rounded-full px-4 py-3 shadow-2xl flex items-center gap-3 max-w-sm w-full pointer-events-auto 
                        backdrop-blur-3xl bg-white/80 dark:bg-slate-900/80 border transition-colors duration-500 touch-pan-y
                        ${notification.type === 'success' ? 'border-blue-500/20' :
                            notification.type === 'warning' ? 'border-emerald-500/20' :
                                'border-amber-500/20'}
                    `}>
                        {notification.icon && (
                            <div className="relative z-10 shrink-0">
                                {notification.icon}
                            </div>
                        )}
                        <div className="flex-1 overflow-hidden">
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate tracking-tight">{notification.title}</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-medium mt-0.5">{notification.message}</p>
                        </div>
                        <button
                            onClick={hideNotification}
                            className="p-1 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={14} className="text-slate-400 dark:text-slate-500" />
                        </button>
                    </div>
                </motion.div>
            )
            }
        </AnimatePresence >
    );
};
