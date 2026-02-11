import { useEffect } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const useRealtimeAlerts = () => {
    const { showNotification } = useNotificationStore();
    // #comment: Removed unused 't' variable from useTranslation to address linting warnings
    useTranslation();

    useEffect(() => {
        // Mock Real-time Events
        const interval = setInterval(() => {
            const randomEvent = Math.random() > 0.7; // 30% chance every interval
            if (randomEvent) {
                const names = ['Alex', 'Maria', 'John', 'Satoshi', 'Vitalik', 'CZ'];
                const actions = ['joined_network', 'earned_commission', 'leveled_up'];

                const name = names[Math.floor(Math.random() * names.length)];
                const action = actions[Math.floor(Math.random() * actions.length)];

                let message = '';
                let title = 'Network Activity';

                switch (action) {
                    case 'joined_network':
                        message = `${name} just joined the partner network!`;
                        break;
                    case 'earned_commission':
                        message = `${name} earned $${(Math.random() * 50).toFixed(2)} commission`;
                        title = '💰 New Earnings';
                        break;
                    case 'leveled_up':
                        message = `${name} reached Level ${Math.floor(Math.random() * 5) + 1}!`;
                        title = '🚀 Level Up';
                        break;
                }

                showNotification({
                    title,
                    message,
                    icon: <Zap size={18} className="text-amber-500 dark:text-yellow-400" />,
                    type: 'info'
                });
            }
        }, 15000); // Check every 15 seconds

        return () => clearInterval(interval);
    }, [showNotification]);
};
