import { useEffect, useCallback, useRef } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import { Zap, Users, Trophy } from 'lucide-react';
import { apiClient } from '../api/client';
import { generateNotificationMessage } from '../utils/notificationGenerator';

export const useRealtimeAlerts = () => {
    const { showNotification } = useNotificationStore();
    const shownIds = useRef<Set<string | number>>(new Set());

    const fetchActivity = useCallback(async () => {
        try {
            const response = await apiClient.get<any[]>('/api/partner/activity');
            const activities = response.data;

            if (activities && activities.length > 0) {
                // #comment Filter out recently shown events to prevent repetition glitches
                const candidates = activities.filter((event: any) => {
                    const uniqueKey = (event.id || `${event.type}-${event.first_name}-${event.timestamp}`) as string | number;
                    return !shownIds.current.has(uniqueKey);
                });

                if (candidates.length > 0) {
                    // Pick one random recent event from the candidates
                    const event = candidates[Math.floor(Math.random() * candidates.length)];

                    const uniqueKey = (event.id || `${event.type}-${event.first_name}-${event.timestamp}`) as string | number;
                    shownIds.current.add(uniqueKey);

                    // Optional: trim set if it gets too large
                    if (shownIds.current.size > 1000) {
                        const it = shownIds.current.values();
                        for (let i = 0; i < 500; i++) {
                            const val = it.next().value;
                            if (val !== undefined) shownIds.current.delete(val);
                        }
                    }

                    // #comment Generate one of 10,000+ viral FOMO variations
                    let genType: 'REFERRAL' | 'TASK' | 'LEVEL_UP' = 'REFERRAL';
                    if (event.type === 'TASK') genType = 'TASK';
                    else if (event.type === 'LEVEL_UP') genType = 'LEVEL_UP';

                    const { message, title } = generateNotificationMessage(genType, event.first_name);

                    // Map icon based on type
                    let icon = <Zap size={18} className="text-amber-500" />;
                    let nType: 'success' | 'info' | 'warning' = 'info';

                    if (event.type === 'REFERRAL_L1' || event.type === 'REFERRAL_DEEP') {
                        icon = <Users size={18} className="text-blue-500" />;
                        nType = 'success';
                    } else if (event.type === 'TASK') {
                        icon = <Trophy size={18} className="text-emerald-500" />;
                        nType = 'warning';
                    } else if (event.type === 'LEVEL_UP') {
                        icon = <Zap size={18} className="text-yellow-500" />;
                        nType = 'info';
                    }

                    showNotification({
                        title,
                        message,
                        icon,
                        type: nType
                    });
                }
            }
        } catch (error) {
            console.error('Failed to fetch network activity:', error);
        }
    }, [showNotification]);

    useEffect(() => {
        fetchActivity();
        const interval = setInterval(fetchActivity, 213000);
        return () => clearInterval(interval);
    }, [fetchActivity]);
};
