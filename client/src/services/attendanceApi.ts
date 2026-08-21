import axiosInstance from '../api/axiosInstance';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceSessionDto {
  _id: string;
  batchId: string;
  courseId: string;
  sessionDate: string;
  note?: string;
  status?: 'conducted' | 'cancelled';
  plannedHours?: number;
  completedHours?: number;
  ustadPresent?: boolean;
  createdBy: string;
  createdAt?: string;
  records?: Array<{
    _id: string;
    studentId: string;
    status: AttendanceStatus;
    markedBy: string;
  }>;
}

export interface AttendanceOverviewClass {
  _id: string;
  batchId: string;
  courseId: string;
  sessionDate: string;
  status: 'conducted' | 'cancelled';
  batchName: string;
  courseTitle: string;
  ustadName: string;
  ustadPresent: boolean;
  presentCount: number;
  totalStudents: number;
  attendancePercent: number;
  hoursLabel: string;
  hoursPercent: number;
  occurredAt: string;
  plannedHours: number;
  completedHours: number;
}

export interface AttendanceOverview {
  stats: {
    totalClasses: number;
    conducted: number;
    cancelled: number;
    successRate: number;
    avgStudentAttendance: number;
  };
  classes: AttendanceOverviewClass[];
}

export interface MyAttendanceRow {
  _id: string;
  batchId: string;
  courseId: string;
  sessionDate: string;
  note?: string;
  record: { _id: string; status: AttendanceStatus; markedBy: string };
}

function apiError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function getAttendanceOverview(params: {
  date: string;
  batchId?: string;
}): Promise<AttendanceOverview> {
  try {
    const { data } = await axiosInstance.get('/attendance/overview', { params });
    if (!data?.success) throw new Error(data?.message || 'Unable to load overview');
    return data.data;
  } catch (err) {
    throw new Error(apiError(err, 'Unable to load overview'));
  }
}

export async function listAttendanceSessions(params?: {
  batchId?: string;
  courseId?: string;
  date?: string;
}): Promise<AttendanceSessionDto[]> {
  const { data } = await axiosInstance.get('/attendance/sessions', { params });
  if (!data?.success) throw new Error(data?.message || 'Unable to load sessions');
  return data.data;
}

export async function createAttendanceSession(input: {
  batchId: string;
  sessionDate: string;
  note?: string;
}): Promise<AttendanceSessionDto> {
  try {
    const { data } = await axiosInstance.post('/attendance/sessions', input);
    if (!data?.success) throw new Error(data?.message || 'Unable to create session');
    return data.data;
  } catch (err) {
    throw new Error(apiError(err, 'Unable to create session'));
  }
}

export async function getAttendanceSession(id: string): Promise<AttendanceSessionDto> {
  const { data } = await axiosInstance.get(`/attendance/sessions/${id}`);
  if (!data?.success) throw new Error(data?.message || 'Unable to load session');
  return data.data;
}

export async function saveAttendanceRecords(
  sessionId: string,
  records: Array<{ studentId: string; status: AttendanceStatus }>,
): Promise<AttendanceSessionDto> {
  try {
    const { data } = await axiosInstance.put(`/attendance/sessions/${sessionId}/records`, {
      records,
    });
    if (!data?.success) throw new Error(data?.message || 'Unable to save attendance');
    return data.data;
  } catch (err) {
    throw new Error(apiError(err, 'Unable to save attendance'));
  }
}

export async function listMyAttendance(): Promise<MyAttendanceRow[]> {
  const { data } = await axiosInstance.get('/attendance/me');
  if (!data?.success) throw new Error(data?.message || 'Unable to load attendance');
  return data.data;
}
