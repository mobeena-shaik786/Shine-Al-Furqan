import axiosInstance from '../api/axiosInstance';

export type InboxNotificationType = 'info' | 'success' | 'warning' | 'alert';

export interface InboxNotificationDto {
  _id: string;
  subject: string;
  message: string;
  type: InboxNotificationType;
  audience: string;
  recipientCount: number;
  createdBy: { _id: string; name: string; email: string };
  createdAt: string;
  read: boolean;
}

export interface InboxMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  unreadCount: number;
}

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function listMyInbox(params?: {
  page?: number;
  limit?: number;
  status?: 'all' | 'unread' | 'read';
  type?: InboxNotificationType;
  search?: string;
}): Promise<{ notifications: InboxNotificationDto[]; meta: InboxMeta }> {
  try {
    const { data } = await axiosInstance.get('/notifications/mine', { params });
    if (!data?.success) throw new Error(data?.message || 'Unable to load notifications');
    return {
      notifications: Array.isArray(data.data) ? data.data : [],
      meta: data.meta || { page: 1, limit: 50, total: 0, totalPages: 1, unreadCount: 0 },
    };
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to load notifications'));
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const { data } = await axiosInstance.get('/notifications/mine/unread-count');
    if (!data?.success) return 0;
    return Number(data.data?.count ?? 0);
  } catch {
    return 0;
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    const { data } = await axiosInstance.post(`/notifications/mine/${id}/read`);
    if (!data?.success) throw new Error(data?.message || 'Unable to mark as read');
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to mark as read'));
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  try {
    const { data } = await axiosInstance.post('/notifications/mine/read-all');
    if (!data?.success) throw new Error(data?.message || 'Unable to mark all as read');
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to mark all as read'));
  }
}
