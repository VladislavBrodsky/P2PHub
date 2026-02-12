import { useEffect, useCallback } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { Zap, Users, Trophy } from 'lucide-react';
import { apiClient } from '../api/client';

export const useRealtimeAlerts = () => {
    const { showNotification } = useNotificationStore();

    const fetchActivity = useCallback(async () => {
        try {
            const response = await apiClient.get<any[]>('/api/partner/activity');
            const activities = response.data;

            if (activities && activities.length > 0) {
                // Pick one random recent event from the last 20
                const event = activities[Math.floor(Math.random() * activities.length)];

                // Avoid notifying about same event twice if possible (simple deduplication could be added)
                let message = '';
                let title = 'Network Activity';
                let icon = <Zap size={18} className="text-amber-500" />;

                switch (event.type) {
                    case 'REFERRAL_L1':
                    case 'REFERRAL_DEEP':
                        message = `${event.first_name} just joined the partner network!`;
                        title = 'New Partner';
                        icon = <Users size={18} className="text-blue-500" />;
                        break;
                    case 'TASK':
                        message = `${event.first_name} completed a reward task!`;
                        title = 'Task Glory';
                        icon = <Trophy size={18} className="text-emerald-500" />;
                        break;
                    case 'LEVEL_UP':
                        message = `${event.first_name} reached a new Level!`;
                        title = 'Level Up';
                        icon = <Zap size={18} className="text-yellow-500" />;
                        break;
                    default:
                        // Fallback generic message
                        message = `${event.first_name} is active in the network`;
                }

                showNotification({
                    title,
                    message,
                    icon,
                    type: 'info'
                });
            }
        } catch (error) {
            console.error('Failed to fetch network activity:', error);
        }
    }, [showNotification]);

    useEffect(() => {
        // Initial fetch
        fetchActivity();

        // Moderate interval to keep the app feeling alive without being overbearing
        const interval = setInterval(fetchActivity, 25000);

        return () => clearInterval(interval);
    }, [fetchActivity]);
};
