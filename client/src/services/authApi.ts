import axiosInstance from '../api/axiosInstance';

export async function forgotPassword(email: string): Promise<string> {
  const { data } = await axiosInstance.post('/auth/forgot-password', { email });
  return String(data?.message ?? 'If an account exists for that email, password reset instructions have been sent.');
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const { data } = await axiosInstance.post('/auth/reset-password', { token, password });
  if (!data?.success) {
    throw new Error(data?.message || 'Unable to reset password');
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const { data } = await axiosInstance.post('/auth/change-password', {
    currentPassword,
    newPassword,
  });
  if (!data?.success) {
    throw new Error(data?.message || 'Unable to change password');
  }
}

export async function updateMyProfile(input: {
  name?: string;
  phone?: string;
  alternatePhone?: string;
  workLocation?: string;
}): Promise<Record<string, unknown>> {
  const { data } = await axiosInstance.patch('/auth/me', input);
  if (!data?.success) {
    throw new Error(data?.message || 'Unable to update profile');
  }
  return data.data as Record<string, unknown>;
}

export async function fetchMyProfile(): Promise<Record<string, unknown>> {
  const { data } = await axiosInstance.get('/auth/me');
  if (!data?.success) {
    throw new Error(data?.message || 'Unable to load profile');
  }
  return data.data as Record<string, unknown>;
}
