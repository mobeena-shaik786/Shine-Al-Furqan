import axiosInstance from '../api/axiosInstance';
import type { UserRole } from '../types/auth';

export type CourseStatus = 'draft' | 'published' | 'archived';
export type LessonStatus = 'draft' | 'published';
export type LessonType = 'text' | 'video' | 'pdf' | 'quiz' | 'live' | 'other';
export type BatchStatus = 'planned' | 'active' | 'completed' | 'cancelled';
export type EnrollmentStatus = 'active' | 'completed' | 'dropped' | 'pending';

export interface CourseDto {
  _id: string;
  title: string;
  code: string;
  description: string;
  category: string;
  thumbnailUrl?: string;
  status: CourseStatus;
  topics: string[];
  topicCount: number;
  instructors: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  progressPercent?: number;
}

export interface TopicDto {
  _id: string;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  stats?: {
    total: number;
    active: number;
    inactive: number;
    totalTopics: number;
  };
}

export interface ModuleDto {
  _id: string;
  courseId: string;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface LessonDto {
  _id: string;
  courseId: string;
  moduleId: string;
  title: string;
  lessonType: LessonType;
  content: string;
  resourceUrl?: string;
  order: number;
  durationMinutes?: number;
  status: LessonStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BatchDto {
  _id: string;
  name: string;
  courseId: string;
  courseTitle?: string;
  instructors: string[];
  ustadNames?: string[];
  coordinatorId?: string;
  coordinatorName?: string;
  capacity: number;
  enrolledCount?: number;
  startDate?: string;
  endDate?: string;
  scheduleNote: string;
  scheduleSlots: Array<{ day: string; startTime: string; endTime: string }>;
  status: BatchStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  stats?: {
    total: number;
    active: number;
    inactive: number;
    completed: number;
    fullActive: number;
    totalStudents: number;
    totalCapacity: number;
    utilization: number;
  };
}

export interface EnrollmentDto {
  _id: string;
  studentId: string;
  courseId: string;
  batchId?: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt?: string;
  createdBy: string;
}

export interface CourseProgressDto {
  completedCount: number;
  totalPublishedLessons: number;
  percent: number;
  lessons: Record<string, { completed: boolean; lastAccessedAt: string }>;
}

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function listCourses(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: CourseStatus;
  activity?: 'active' | 'inactive';
  category?: string;
  sort?: 'title' | '-title' | 'createdAt' | '-createdAt';
}): Promise<{
  courses: CourseDto[];
  meta: CourseListMeta;
}> {
  const { data } = await axiosInstance.get('/courses', { params });
  if (!data?.success) throw new Error(data?.message || 'Unable to load courses');
  return { courses: data.data, meta: data.meta };
}

export async function getCourse(id: string): Promise<CourseDto> {
  const { data } = await axiosInstance.get(`/courses/${id}`);
  if (!data?.success) throw new Error(data?.message || 'Unable to load course');
  return data.data;
}

export async function createCourse(input: {
  title: string;
  code?: string;
  description?: string;
  category?: string;
  instructorIds?: string[];
  topicIds?: string[];
  status?: CourseStatus;
}): Promise<CourseDto> {
  try {
    const { data } = await axiosInstance.post('/courses', input);
    if (!data?.success) throw new Error(data?.message || 'Unable to create course');
    return data.data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to create course'));
  }
}

export async function updateCourse(
  id: string,
  input: Partial<{
    title: string;
    description: string;
    category: string;
    instructorIds: string[];
    topicIds: string[];
  }>,
): Promise<CourseDto> {
  try {
    const { data } = await axiosInstance.patch(`/courses/${id}`, input);
    if (!data?.success) throw new Error(data?.message || 'Unable to update course');
    return data.data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to update course'));
  }
}

export async function deleteCourse(id: string): Promise<void> {
  try {
    const { data } = await axiosInstance.delete(`/courses/${id}`);
    if (!data?.success) throw new Error(data?.message || 'Unable to delete course');
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to delete course'));
  }
}

export async function listTopics(params?: {
  search?: string;
  activeOnly?: boolean;
  activity?: 'active' | 'inactive';
}): Promise<TopicDto[]> {
  try {
    const { data } = await axiosInstance.get('/topics', {
      params: {
        search: params?.search,
        activeOnly: params?.activeOnly ? 'true' : undefined,
        activity: params?.activity,
      },
    });
    if (!data?.success) throw new Error(data?.message || 'Unable to load topics');
    return Array.isArray(data.data) ? data.data : [];
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to load topics'));
  }
}

export async function createTopic(input: {
  title: string;
  description?: string;
  isActive?: boolean;
}): Promise<TopicDto> {
  try {
    const { data } = await axiosInstance.post('/topics', input);
    if (!data?.success) throw new Error(data?.message || 'Unable to create topic');
    return data.data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to create topic'));
  }
}

export async function updateTopic(
  id: string,
  input: Partial<{ title: string; description: string; isActive: boolean }>,
): Promise<TopicDto> {
  try {
    const { data } = await axiosInstance.patch(`/topics/${id}`, input);
    if (!data?.success) throw new Error(data?.message || 'Unable to update topic');
    return data.data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to update topic'));
  }
}

export async function deleteTopic(id: string): Promise<void> {
  try {
    const { data } = await axiosInstance.delete(`/topics/${id}`);
    if (!data?.success) throw new Error(data?.message || 'Unable to delete topic');
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to delete topic'));
  }
}

export async function updateCourseStatus(id: string, status: CourseStatus): Promise<CourseDto> {
  try {
    const { data } = await axiosInstance.patch(`/courses/${id}/status`, { status });
    if (!data?.success) throw new Error(data?.message || 'Unable to update status');
    return data.data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to update status'));
  }
}

export async function listModules(courseId: string): Promise<ModuleDto[]> {
  const { data } = await axiosInstance.get(`/courses/${courseId}/modules`);
  if (!data?.success) throw new Error(data?.message || 'Unable to load modules');
  return data.data;
}

export async function createModule(courseId: string, input: { title: string; order: number }): Promise<ModuleDto> {
  try {
    const { data } = await axiosInstance.post(`/courses/${courseId}/modules`, input);
    if (!data?.success) throw new Error(data?.message || 'Unable to create module');
    return data.data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to create module'));
  }
}

export async function deleteModule(id: string): Promise<void> {
  try {
    const { data } = await axiosInstance.delete(`/modules/${id}`);
    if (!data?.success) throw new Error(data?.message || 'Unable to delete module');
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to delete module'));
  }
}

export async function listLessons(courseId: string): Promise<LessonDto[]> {
  const { data } = await axiosInstance.get(`/courses/${courseId}/lessons`);
  if (!data?.success) throw new Error(data?.message || 'Unable to load lessons');
  return data.data;
}

export async function createLesson(
  moduleId: string,
  input: {
    title: string;
    order: number;
    lessonType?: LessonType;
    content?: string;
    resourceUrl?: string;
    status?: LessonStatus;
  },
): Promise<LessonDto> {
  try {
    const { data } = await axiosInstance.post(`/modules/${moduleId}/lessons`, input);
    if (!data?.success) throw new Error(data?.message || 'Unable to create lesson');
    return data.data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to create lesson'));
  }
}

export async function updateLesson(
  id: string,
  input: Partial<{
    title: string;
    content: string;
    resourceUrl: string;
    status: LessonStatus;
    order: number;
    lessonType: LessonType;
  }>,
): Promise<LessonDto> {
  try {
    const { data } = await axiosInstance.patch(`/lessons/${id}`, input);
    if (!data?.success) throw new Error(data?.message || 'Unable to update lesson');
    return data.data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to update lesson'));
  }
}

export async function deleteLesson(id: string): Promise<void> {
  try {
    const { data } = await axiosInstance.delete(`/lessons/${id}`);
    if (!data?.success) throw new Error(data?.message || 'Unable to delete lesson');
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to delete lesson'));
  }
}

export async function listBatches(params?: {
  page?: number;
  limit?: number;
  courseId?: string;
  status?: BatchStatus;
  activity?: 'active' | 'inactive' | 'completed';
  search?: string;
  sort?: '-createdAt' | 'createdAt' | 'name' | '-name';
}): Promise<{ batches: BatchDto[]; meta: BatchListMeta }> {
  const { data } = await axiosInstance.get('/batches', { params });
  if (!data?.success) throw new Error(data?.message || 'Unable to load batches');
  return {
    batches: Array.isArray(data.data) ? data.data : [],
    meta: data.meta || { page: 1, limit: 50, total: 0, totalPages: 1 },
  };
}

export async function createBatch(input: {
  name: string;
  courseId: string;
  capacity?: number;
  instructorIds?: string[];
  coordinatorId?: string;
  startDate?: string;
  endDate?: string;
  scheduleNote?: string;
  scheduleSlots?: Array<{ day: string; startTime: string; endTime: string }>;
  status?: BatchStatus;
}): Promise<BatchDto> {
  try {
    const { data } = await axiosInstance.post('/batches', input);
    if (!data?.success) throw new Error(data?.message || 'Unable to create batch');
    return data.data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to create batch'));
  }
}

export async function updateBatch(
  id: string,
  input: Partial<{
    name: string;
    capacity: number;
    instructorIds: string[];
    coordinatorId: string | null;
    startDate: string | null;
    endDate: string | null;
    scheduleNote: string;
    scheduleSlots: Array<{ day: string; startTime: string; endTime: string }>;
    status: BatchStatus;
  }>,
): Promise<BatchDto> {
  try {
    const { data } = await axiosInstance.patch(`/batches/${id}`, input);
    if (!data?.success) throw new Error(data?.message || 'Unable to update batch');
    return data.data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to update batch'));
  }
}

export async function deleteBatch(id: string): Promise<void> {
  try {
    const { data } = await axiosInstance.delete(`/batches/${id}`);
    if (!data?.success) throw new Error(data?.message || 'Unable to delete batch');
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to delete batch'));
  }
}

export async function listEnrollments(params?: {
  courseId?: string;
  studentId?: string;
}): Promise<EnrollmentDto[]> {
  const { data } = await axiosInstance.get('/enrollments', { params });
  if (!data?.success) throw new Error(data?.message || 'Unable to load enrollments');
  return data.data;
}

export async function createEnrollment(input: {
  studentId: string;
  courseId: string;
  batchId?: string;
}): Promise<EnrollmentDto> {
  try {
    const { data } = await axiosInstance.post('/enrollments', input);
    if (!data?.success) throw new Error(data?.message || 'Unable to enroll student');
    return data.data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to enroll student'));
  }
}

export async function getCourseProgress(courseId: string): Promise<CourseProgressDto> {
  const { data } = await axiosInstance.get(`/courses/${courseId}/progress`);
  if (!data?.success) throw new Error(data?.message || 'Unable to load progress');
  return data.data;
}

export async function updateLessonProgress(
  lessonId: string,
  completed: boolean,
): Promise<{ lessonId: string; completed: boolean }> {
  try {
    const { data } = await axiosInstance.post(`/lessons/${lessonId}/progress`, { completed });
    if (!data?.success) throw new Error(data?.message || 'Unable to update progress');
    return data.data;
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Unable to update progress'));
  }
}

export async function listUstads(): Promise<Array<{ _id: string; name: string; email: string; role: UserRole }>> {
  const { data } = await axiosInstance.get('/users', { params: { role: 'ustad', limit: 100 } });
  if (!data?.success) throw new Error(data?.message || 'Unable to load ustads');
  return data.data;
}

export async function listStudents(): Promise<Array<{ _id: string; name: string; email: string }>> {
  const { data } = await axiosInstance.get('/users', { params: { role: 'student', limit: 100, isActive: 'true' } });
  if (!data?.success) throw new Error(data?.message || 'Unable to load students');
  return data.data;
}
