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

                    // #comment: Wrapped switch cases with const declarations in curly braces to fix ESLint "Unexpected lexical declaration in case block" error
                    // This creates a proper block scope for each case and prevents variable hoisting issues
                    switch (event.type) {
                        case 'REFERRAL_L1':
                        case 'REFERRAL_DEEP': {
                            const referralMessages = [
                                `${event.first_name} just joined the partner network!`,
                                `🔥 ${event.first_name} is building their empire!`,
                                `💰 ${event.first_name} just unlocked passive income!`,
                                `⚡ ${event.first_name} joined the movement!`,
                                `🚀 ${event.first_name} is getting ahead - are you?`,
                                `💎 ${event.first_name} claimed their spot!`,
                                `${event.first_name} just started earning - don't miss out!`
                            ];
                            const referralTitles = [
                                'New Partner 🎉',
                                'Network Growing 📈',
                                'Someone Just Joined 🔥',
                                'Movement Alert 🚨',
                                'Partner Joined ⚡'
                            ];
                            const randomVariant = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
                            message = randomVariant(referralMessages);
                            title = randomVariant(referralTitles);
                            icon = <Users size={18} className="text-blue-500" />;
                            break;
                        }
                        case 'TASK': {
                            const taskMessages = [
                                `${event.first_name} just claimed rewards!`,
                                `⚡ ${event.first_name} is crushing tasks!`,
                                `💰 ${event.first_name} earned big - your turn!`,
                                `🎯 ${event.first_name} completed a mission!`,
                                `🔥 ${event.first_name} just got paid!`,
                                `${event.first_name} is stacking rewards!`
                            ];
                            const taskTitles = [
                                'Reward Claimed 💰',
                                'Task Crushed 🎯',
                                'Mission Complete ⚡',
                                'Someone Earned 🔥',
                                'Rewards Unlocked 💎'
                            ];
                            const randomVariant = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
                            message = randomVariant(taskMessages);
                            title = randomVariant(taskTitles);
                            icon = <Trophy size={18} className="text-emerald-500" />;
                            break;
                        }
                        case 'LEVEL_UP': {
                            const levelMessages = [
                                `🚀 ${event.first_name} just leveled up!`,
                                `📈 ${event.first_name} is climbing fast - keep up!`,
                                `⚡ ${event.first_name} reached a new milestone!`,
                                `🔥 ${event.first_name} is on fire!`,
                                `💪 ${event.first_name} leveled up - don't fall behind!`,
                                `${event.first_name} unlocked new rewards!`
                            ];
                            const levelTitles = [
                                'Level Up 🚀',
                                'New Milestone 📈',
                                'Rank Advanced ⚡',
                                'Progress Alert 🔥',
                                'Achievement Unlocked 🏆'
                            ];
                            const randomVariant = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
                            message = randomVariant(levelMessages);
                            title = randomVariant(levelTitles);
                            icon = <Zap size={18} className="text-yellow-500" />;
                            break;
                        }
                        default:
                            // Fallback generic message with FOMO
                            message = `🌟 ${event.first_name} is actively earning!`;
                            title = 'Network Active 🔥';
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
