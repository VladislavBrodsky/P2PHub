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

    return (
        <AnimatePresence>
            {notification && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 20, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="fixed top-0 left-0 right-0 z-100 flex justify-center pointer-events-none px-4"
                >
                    <div className="glass-panel-premium rounded-full px-4 py-3 shadow-xl flex items-center gap-3 max-w-sm w-full pointer-events-auto backdrop-blur-xl bg-slate-900/80 border-slate-700/50">
                        {notification.icon && (
                            <div className="shrink-0 text-emerald-400">
                                {notification.icon}
                            </div>
                        )}
                        <div className="flex-1 overflow-hidden">
                            <h4 className="text-xs font-bold text-white truncate">{notification.title}</h4>
                            <p className="text-[10px] text-slate-300 truncate">{notification.message}</p>
                        </div>
                        <button
                            onClick={hideNotification}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={14} className="text-slate-400" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
