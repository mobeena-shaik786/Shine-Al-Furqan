import { axiosInstance, getStoredToken } from '../api/axiosInstance';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface LearningResourceDto {
  _id: string;
  courseId: string;
  lessonId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  status: 'active' | 'deleted';
  createdAt: string;
  downloadPath: string;
}

export async function listLessonResources(lessonId: string): Promise<LearningResourceDto[]> {
  const { data } = await axiosInstance.get(`/lessons/${lessonId}/resources`);
  if (!data?.success) throw new Error(data?.message || 'Unable to list resources');
  return data.data;
}

export async function uploadLessonResource(
  lessonId: string,
  file: File,
): Promise<LearningResourceDto> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await axiosInstance.post(`/lessons/${lessonId}/resources`, form);
  if (!data?.success) throw new Error(data?.message || 'Upload failed');
  return data.data;
}

export async function deleteLearningResource(resourceId: string): Promise<void> {
  const { data } = await axiosInstance.delete(`/resources/${resourceId}`);
  if (!data?.success) throw new Error(data?.message || 'Delete failed');
}

/** Authenticated download via blob (Bearer header). */
export async function downloadLearningResource(
  resource: LearningResourceDto,
): Promise<void> {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE_URL}/resources/${resource._id}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Download failed');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = resource.originalFilename;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
