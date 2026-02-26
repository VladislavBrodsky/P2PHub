import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, PartyPopper } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { useHaptic } from '../hooks/useHaptic';

export const StripeReturnPage = () => {
    const { setHeaderVisible, setFooterVisible, setNotificationsVisible } = useUI();
    const { notification } = useHaptic();

    useEffect(() => {
        setHeaderVisible(false);
        setFooterVisible(false);
        setNotificationsVisible(false);

        // Trigger a success haptic
        notification('success');

        return () => {
            // Restore visibility in case they somehow navigate away within the same window
            setHeaderVisible(true);
            setFooterVisible(true);
            setNotificationsVisible(true);
        };
    }, [setHeaderVisible, setFooterVisible, setNotificationsVisible, notification]);

    return (
        <div className="fixed inset-0 min-h-dvh w-full bg-white dark:bg-bg-app flex flex-col items-center justify-center p-6 text-center z-9999">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                }}
                className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6"
            >
                <CheckCircle2 size={48} className="text-emerald-500" />
            </motion.div>

            <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-slate-900 dark:text-white mb-3"
            >
                Payment Successful!
            </motion.h1>

            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-slate-500 dark:text-slate-400 max-w-sm mb-8"
            >
                Your subscription has been activated. You can now close this window to return to the app.
            </motion.p>

            <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                onClick={() => {
                    // Try to close the native window if possible
                    window.close();
                    if (window.Telegram?.WebApp && 'close' in window.Telegram.WebApp) {
                        (window.Telegram.WebApp as any).close();
                    }
                }}
                className="bg-emerald-500 text-white font-bold py-4 px-8 rounded-xl flex items-center gap-2 active:scale-95 transition-transform shadow-lg shadow-emerald-500/30"
            >
                <PartyPopper size={20} />
                <span>Return to App</span>
            </motion.button>
        </div>
    );
};
