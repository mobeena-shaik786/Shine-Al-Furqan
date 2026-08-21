import { useCallback, useEffect, useState } from 'react';
import { BookOpen, ClipboardCheck, GraduationCap, Layers, Users } from 'lucide-react';
import { WelcomeBanner } from '../components/dashboard/WelcomeBanner';
import { CapacityNoticeBanner } from '../components/dashboard/CapacityNoticeBanner';
import { QuickActions } from '../components/dashboard/QuickActions';
import { MonthlyAttendanceCard } from '../components/dashboard/MonthlyAttendanceCard';
import { RecentEnrollmentsCard } from '../components/dashboard/RecentEnrollmentsCard';
import { StatCard } from '../components/ui/StatCard';
import {
  fetchAdminDashboard,
  type AdminDashboardData,
} from '../services/dashboardApi';
import type { AttendanceOverview, CapacityNotice, RecentEnrollment } from '../types/dashboard';

function toAttendanceOverview(data: AdminDashboardData['attendance']): AttendanceOverview {
  return {
    present: data.present,
    absent: data.absent + data.late + data.excused,
    rate: data.rate,
    totalRecords: data.totalRecords,
    month: data.month,
  };
}

function toCapacity(data: AdminDashboardData['capacity']): CapacityNotice {
  return {
    availableSeats: data.availableSeats,
    utilizationPercent: data.utilizationPercent,
  };
}

function toRecent(rows: AdminDashboardData['recentEnrollments']): RecentEnrollment[] {
  return rows.map((row) => ({
    id: row.id,
    studentName: row.studentName,
    course: row.course,
    enrollmentDate: row.enrollmentDate,
    status: (row.status === 'pending' || row.status === 'completed' ? row.status : 'active') as
      | 'active'
      | 'pending'
      | 'completed',
  }));
}

export function DashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (month?: string) => {
    setLoading(true);
    setError(false);
    try {
      setData(await fetchAdminDashboard(month));
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const m = data?.metrics;

  return (
    <div className="space-y-6 animate-fade-in">
      <WelcomeBanner />
      {data ? (
        <p className="text-sm text-ink-muted">{data.message}</p>
      ) : null}

      <section>
        <h3 className="mb-3 text-base font-semibold text-ink">Overview</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active students"
            value={m?.activeStudents ?? 0}
            icon={Users}
            loading={loading}
            error={error}
            onRetry={() => void load()}
          />
          <StatCard
            label="Active ustads"
            value={m?.activeUstads ?? 0}
            icon={GraduationCap}
            loading={loading}
            error={error}
            onRetry={() => void load()}
          />
          <StatCard
            label="Published courses"
            value={m?.publishedCourses ?? 0}
            icon={BookOpen}
            loading={loading}
            error={error}
            onRetry={() => void load()}
          />
          <StatCard
            label="Active batches"
            value={m?.activeBatches ?? 0}
            icon={Layers}
            loading={loading}
            error={error}
            onRetry={() => void load()}
          />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active enrollments"
          value={m?.activeEnrollments ?? 0}
          icon={Users}
          loading={loading}
          error={error}
        />
        <StatCard
          label="Quiz attempts (7d)"
          value={m?.quizAttemptsLast7Days ?? 0}
          icon={ClipboardCheck}
          loading={loading}
          error={error}
        />
        <StatCard
          label="Lessons completed (7d)"
          value={m?.lessonsCompletedLast7Days ?? 0}
          icon={BookOpen}
          loading={loading}
          error={error}
        />
        <StatCard
          label="Active coordinators"
          value={m?.activeCoordinators ?? 0}
          icon={Users}
          loading={loading}
          error={error}
        />
      </div>

      {data?.capacity ? <CapacityNoticeBanner data={toCapacity(data.capacity)} /> : null}

      <section>
        <h3 className="mb-3 text-base font-semibold text-ink">Quick actions</h3>
        <QuickActions />
      </section>

      <section>
        <h3 className="mb-3 text-base font-semibold text-ink">Analytics</h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <MonthlyAttendanceCard
            data={data ? toAttendanceOverview(data.attendance) : undefined}
            loading={loading}
            onMonthChange={(month) => void load(month)}
          />
          <RecentEnrollmentsCard
            data={data ? toRecent(data.recentEnrollments) : undefined}
            loading={loading}
          />
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
