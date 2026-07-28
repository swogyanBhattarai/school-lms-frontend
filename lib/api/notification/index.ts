import api from "@/lib/api";
import type { NotificationResponse } from "@/types/lms";

export const getUnreadNotifications = async (): Promise<NotificationResponse[]> => {
  const response = await api.get<NotificationResponse[]>("/api/notification/unread");
  return response.data;
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const response = await api.get<number>("/api/notification/unread-count");
  return response.data;
};

export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  await api.put(`/api/notification/${notificationId}/read`);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.put("/api/notification/read-all");
};
