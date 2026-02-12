import { useEffect, useCallback, useRef } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { Zap, Users, Trophy } from 'lucide-react';
import { apiClient } from '../api/client';

export const useRealtimeAlerts = () => {
    const { showNotification } = useNotificationStore();
    const shownIds = useRef<Set<string | number>>(new Set());

    const fetchActivity = useCallback(async () => {
        try {
            const response = await apiClient.get<any[]>('/api/partner/activity');
            const activities = response.data;

            if (activities && activities.length > 0) {
                // Filter out recently shown events
                // We use a unique key composed of ID or a fallback combination
                const candidates = activities.filter((event: any) => {
                    const uniqueKey = (event.id || `${event.type}-${event.first_name}-${event.timestamp}`) as string | number;
                    return !shownIds.current.has(uniqueKey);
                });

                if (candidates.length > 0) {
                    // Pick one random recent event from the candidates
                    const event = candidates[Math.floor(Math.random() * candidates.length)];

                    const uniqueKey = (event.id || `${event.type}-${event.first_name}-${event.timestamp}`) as string | number;
                    shownIds.current.add(uniqueKey);

                    // Optional: trim set if it gets too large (e.g. > 1000)
                    if (shownIds.current.size > 1000) {
                        const it = shownIds.current.values();
                        for (let i = 0; i < 500; i++) {
                            const val = it.next().value;
                            if (val !== undefined) shownIds.current.delete(val);
                        }
                    }

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
