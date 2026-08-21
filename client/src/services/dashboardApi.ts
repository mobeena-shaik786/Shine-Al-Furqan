import axiosInstance from '../api/axiosInstance';

export interface DashboardAttendance {
  present: number;
  absent: number;
  late: number;
  excused: number;
  totalRecords: number;
  rate: number;
  month: string;
}

export interface DashboardCapacity {
  totalSeats: number;
  usedSeats: number;
  availableSeats: number;
  utilizationPercent: number;
  batchCount: number;
}

export interface DashboardRecentEnrollment {
  id: string;
  studentName: string;
  course: string;
  enrollmentDate: string;
  status: string;
}

export interface AdminDashboardData {
  role: 'admin' | 'coordinator';
  title: string;
  message: string;
  metrics: {
    activeStudents: number;
    activeUstads: number;
    activeCoordinators: number;
    publishedCourses: number;
    activeBatches: number;
    activeEnrollments: number;
    quizAttemptsLast7Days: number;
    lessonsCompletedLast7Days: number;
  };
  capacity: DashboardCapacity;
  attendance: DashboardAttendance;
  recentEnrollments: DashboardRecentEnrollment[];
}

export interface UstadDashboardData {
  role: 'ustad';
  title: string;
  message: string;
  metrics: {
    assignedCourses: number;
    publishedAssignedCourses: number;
    assignedBatches: number;
    assignedStudents: number;
    activeEnrollments: number;
    quizAttemptsLast7Days: number;
    lessonsCompletedLast7Days: number;
  };
  capacity: DashboardCapacity;
  attendance: DashboardAttendance;
  recentEnrollments: DashboardRecentEnrollment[];
  courses: Array<{ _id: string; title: string; status: string }>;
}

export interface StudentDashboardData {
  role: 'student';
  title: string;
  message: string;
  metrics: {
    activeEnrollments: number;
    quizAttemptsTotal: number;
    averageProgressPercent: number;
  };
  courses: Array<{
    enrollmentId: string;
    courseId: string;
    title: string;
    code: string;
    status: string;
    progressPercent: number;
    enrolledAt: string;
  }>;
  resumeCourse: {
    courseId: string;
    title: string;
    progressPercent: number;
  } | null;
  recentAttendance: Array<{ status: string; sessionDate?: string }>;
}

export async function fetchAdminDashboard(month?: string): Promise<AdminDashboardData> {
  const { data } = await axiosInstance.get('/admin/dashboard', { params: { month } });
  if (!data?.success) throw new Error(data?.message || 'Unable to load dashboard');
  return data.data;
}

export async function fetchCoordinatorDashboard(month?: string): Promise<AdminDashboardData> {
  const { data } = await axiosInstance.get('/coordinator/dashboard', { params: { month } });
  if (!data?.success) throw new Error(data?.message || 'Unable to load dashboard');
  return data.data;
}

export async function fetchUstadDashboard(month?: string): Promise<UstadDashboardData> {
  const { data } = await axiosInstance.get('/ustad/dashboard', { params: { month } });
  if (!data?.success) throw new Error(data?.message || 'Unable to load dashboard');
  return data.data;
}

export async function fetchStudentDashboard(): Promise<StudentDashboardData> {
  const { data } = await axiosInstance.get('/student/dashboard');
  if (!data?.success) throw new Error(data?.message || 'Unable to load dashboard');
  return data.data;
}
