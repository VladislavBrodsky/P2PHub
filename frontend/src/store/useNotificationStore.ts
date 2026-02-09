import { create } from 'zustand';
import { ReactNode } from 'react';

interface NotificationState {
    notification: {
        title: string;
        message: string;
        icon?: ReactNode;
        type?: 'success' | 'info' | 'warning';
    } | null;
    showNotification: (notification: NotificationState['notification']) => void;
    hideNotification: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notification: null,
    showNotification: (notification) => set({ notification }),
    hideNotification: () => set({ notification: null }),
}));
