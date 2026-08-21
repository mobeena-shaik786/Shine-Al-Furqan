import axiosInstance from '../api/axiosInstance';

export type NotificationAudience = 'all' | 'admin' | 'coordinator' | 'ustad' | 'student';
export type NotificationType = 'info' | 'success' | 'warning' | 'alert';

export interface SystemSettingsDto {
  salary: {
    basePay: number;
    incentiveRate: number;
    defaultMode: 'unique' | 'fixed';
  };
  liveClass: {
    enabled: boolean;
    jitsiDomain: string;
    roomPrefix: string;
  };
  updatedAt: string;
}

export interface AppNotificationDto {
  _id: string;
  subject: string;
  message: string;
  type: NotificationType;
  audience: NotificationAudience;
  recipientCount: number;
  createdBy: { _id: string; name: string; email: string };
  createdAt: string;
}

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function getSettings(): Promise<SystemSettingsDto> {
  try {
    const { data } = await axiosInstance.get('/settings');
    if (!data?.success) throw new Error(data?.message || 'Unable to load settings');
    return data.data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to load settings'));
  }
}

export async function updateSettings(
  input: Partial<{
    salary: Partial<SystemSettingsDto['salary']>;
    liveClass: Partial<SystemSettingsDto['liveClass']>;
  }>,
): Promise<SystemSettingsDto> {
  try {
    const { data } = await axiosInstance.patch('/settings', input);
    if (!data?.success) throw new Error(data?.message || 'Unable to update settings');
    return data.data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to update settings'));
  }
}

export async function listNotificationHistory(params?: {
  page?: number;
  limit?: number;
}): Promise<{
  notifications: AppNotificationDto[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}> {
  try {
    const { data } = await axiosInstance.get('/settings/notifications', { params });
    if (!data?.success) throw new Error(data?.message || 'Unable to load history');
    return { notifications: data.data, meta: data.meta };
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to load history'));
  }
}

export async function sendNotification(input: {
  audience: NotificationAudience;
  type: NotificationType;
  subject: string;
  message: string;
}): Promise<AppNotificationDto> {
  try {
    const { data } = await axiosInstance.post('/settings/notifications', input);
    if (!data?.success) throw new Error(data?.message || 'Unable to send notification');
    return data.data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to send notification'));
  }
}
