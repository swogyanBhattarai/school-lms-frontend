import api from "@/lib/api";
import type { NotificationResponse } from "@/types/lms";

export const getUnreadNotifications = async (): Promise<NotificationResponse[]> => {
  const response = await api.get<NotificationResponse[]>("/api/notification/unread");
  return response.data;
};
