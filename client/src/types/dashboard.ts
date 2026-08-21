export interface DashboardSummary {
  totalStudents: number;
  totalTeachers: number;
  totalLeads: number;
  activeBatches: number;
  studentsChange: number;
  teachersChange: number;
  leadsChange: number;
  batchesChange: number;
}

export interface DashboardAnalytics {
  classesToday: number;
  activeUsers: number;
  activeUsersPercent: number;
  weeklyActiveUsers: Array<{ day: string; users: number }>;
  classActivity: number[];
}

export interface CapacityNotice {
  availableSeats: number;
  utilizationPercent: number;
}

export interface LeadPipeline {
  total: number;
  conversionRate: number;
  stages: Array<{
    key: string;
    label: string;
    count: number;
    color: string;
  }>;
}

export interface AttendanceOverview {
  present: number;
  absent: number;
  rate: number;
  totalRecords: number;
  month: string;
}

export interface UpcomingClass {
  id: string;
  subject: string;
  course: string;
  teacher: string;
  date: string;
  startTime: string;
  endTime: string;
  mode: 'online' | 'onsite' | 'hybrid';
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
}

export interface RecentEnrollment {
  id: string;
  studentName: string;
  avatar?: string;
  course: string;
  enrollmentDate: string;
  status: 'active' | 'pending' | 'completed';
}

export interface FeeOverview {
  expected: number;
  collected: number;
  pending: number;
  overdue: number;
  monthly: Array<{ month: string; collected: number; pending: number }>;
}

export interface SearchResultGroup {
  type: string;
  items: Array<{ id: string; title: string; subtitle: string; href: string }>;
}
