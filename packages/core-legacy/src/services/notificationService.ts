import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface INotificationItem {
  id: string;
  value: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationServiceState {
  notifications: INotificationItem[];
  addNotification: (item: INotificationItem) => void;
  removeNotification: (id: string) => void;
  clear: () => void;
}

export const useNotificationService = create<NotificationServiceState>()(
  immer((set) => ({
    notifications: [],
    addNotification: (item) =>
      set((state) => {
        state.notifications.push(item);
      }),
    removeNotification: (id) =>
      set((state) => {
        state.notifications = state.notifications.filter((n) => n.id !== id);
      }),
    clear: () =>
      set((state) => {
        state.notifications = [];
      }),
  }))
);


