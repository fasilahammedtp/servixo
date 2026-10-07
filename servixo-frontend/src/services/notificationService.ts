import { api } from "./api";
import { AppNotification } from "../types";

export const getNotifications = async (): Promise<AppNotification[]> => {
  const response = await api.get<{ notifications: AppNotification[] }>("/notifications");
  return response.data.notifications;
};

export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get<{ unreadCount: number }>("/notifications/unread-count");
  return response.data.unreadCount;
};

export const markNotificationRead = async (id: string): Promise<AppNotification> => {
  const response = await api.patch<{ notification: AppNotification }>(`/notifications/${id}/read`);
  return response.data.notification;
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await api.patch("/notifications/mark-all-read");
};

