import { api } from "@/lib/api-client";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type NotificationPriority = "Low" | "Medium" | "High" | "Critical";
export type NotificationType =
  | "Info"
  | "Success"
  | "Warning"
  | "Error"
  | "Assignment"
  | "Approval"
  | "Reminder"
  | "Security"
  | "Project"
  | "Finance"
  | "Support"
  | "HRMS"
  | "System";

export type NotificationRecord = {
  id: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  notification_type_label: NotificationType;
  priority: NotificationPriority;
  priority_label: NotificationPriority;
  action_url: string;
  target_module: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  is_broadcast: boolean;
  expires_at: string | null;
  is_read: boolean;
  read_at: string | null;
  is_active: boolean;
  created_at: string;
  created_at_label: string;
  updated_at: string;
};

export type NotificationOverview = {
  total_notifications: number;
  unread_notifications: number;
  critical_notifications: number;
  system_notifications: number;
  queued_jobs: number;
};

export type NotificationPayload = {
  title: string;
  message: string;
  notification_type: NotificationType;
  priority: NotificationPriority;
  action_url?: string;
  target_module?: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  is_broadcast?: boolean;
  expires_at?: string | null;
  recipient_id?: number | null;
};

function toQuery(params?: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function listNotificationOverview() {
  const response = await api.get<ApiResponse<NotificationOverview>>("/notifications/overview/");
  return response.data;
}

export async function listNotifications(params?: { search?: string; status?: "read" | "unread"; notification_type?: string; priority?: string; target_module?: string }) {
  const response = await api.get<ApiResponse<NotificationRecord[]>>(`/notifications/notifications/${toQuery(params)}`);
  return response.data;
}

export async function createNotification(payload: NotificationPayload) {
  const response = await api.post<ApiResponse<NotificationRecord>>("/notifications/notifications/", payload);
  return response.data;
}

export async function updateNotification(notificationId: string, payload: Partial<NotificationPayload>) {
  const response = await api.patch<ApiResponse<NotificationRecord>>(`/notifications/notifications/${notificationId}/`, payload);
  return response.data;
}

export async function markNotificationRead(notificationId: string) {
  const response = await api.post<ApiResponse<{ is_read: boolean }>>(`/notifications/notifications/${notificationId}/read/`, {});
  return response.data;
}

export async function markNotificationUnread(notificationId: string) {
  const response = await api.delete<ApiResponse<{ is_read: boolean }>>(`/notifications/notifications/${notificationId}/read/`);
  return response.data;
}
