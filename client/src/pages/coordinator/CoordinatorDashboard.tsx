import { useCallback, useEffect, useState } from 'react';
import { BookOpen, ClipboardCheck, Layers, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/ui/StatCard';
import { CapacityNoticeBanner } from '../../components/dashboard/CapacityNoticeBanner';
import { MonthlyAttendanceCard } from '../../components/dashboard/MonthlyAttendanceCard';
import { RecentEnrollmentsCard } from '../../components/dashboard/RecentEnrollmentsCard';
import { QuickActions } from '../../components/dashboard/QuickActions';
import {
  fetchCoordinatorDashboard,
  type AdminDashboardData,
} from '../../services/dashboardApi';
import type { AttendanceOverview, CapacityNotice, RecentEnrollment } from '../../types/dashboard';

export function CoordinatorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (month?: string) => {
    setLoading(true);
    setError(false);
    try {
      setData(await fetchCoordinatorDashboard(month));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const m = data?.metrics;

  return (
    <div className="space-y-5 animate-fade-in">
      <section className="card p-6 sm:p-8">
        <p className="text-sm font-medium text-[#B01828]">Coordinator workspace</p>
        <h1 className="mt-1 text-2xl font-bold text-[#1E2531] sm:text-3xl">
          Assalamu Alaikum, {user?.name}
        </h1>
        <p className="mt-2 text-sm text-[#758188]">
          {data?.message ?? 'Live academy metrics for student operations.'}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active students" value={m?.activeStudents ?? 0} icon={Users} loading={loading} error={error} onRetry={() => void load()} />
        <StatCard label="Active enrollments" value={m?.activeEnrollments ?? 0} icon={BookOpen} loading={loading} error={error} />
        <StatCard label="Active batches" value={m?.activeBatches ?? 0} icon={Layers} loading={loading} error={error} />
        <StatCard label="Lessons completed (7d)" value={m?.lessonsCompletedLast7Days ?? 0} icon={ClipboardCheck} loading={loading} error={error} />
      </div>

      {data?.capacity ? (
        <CapacityNoticeBanner
          data={
            {
              availableSeats: data.capacity.availableSeats,
              utilizationPercent: data.capacity.utilizationPercent,
            } satisfies CapacityNotice
          }
        />
      ) : null}
      <QuickActions />
      <div className="grid gap-4 lg:grid-cols-2">
        <MonthlyAttendanceCard
          data={
            data
              ? ({
                  present: data.attendance.present,
                  absent: data.attendance.absent + data.attendance.late + data.attendance.excused,
                  rate: data.attendance.rate,
                  totalRecords: data.attendance.totalRecords,
                  month: data.attendance.month,
                } satisfies AttendanceOverview)
              : undefined
          }
          loading={loading}
          onMonthChange={(month) => void load(month)}
        />
        <RecentEnrollmentsCard
          data={
            data
              ? (data.recentEnrollments.map((row) => ({
                  id: row.id,
                  studentName: row.studentName,
                  course: row.course,
                  enrollmentDate: row.enrollmentDate,
                  status: (row.status === 'pending' || row.status === 'completed'
                    ? row.status
                    : 'active') as RecentEnrollment['status'],
                })) satisfies RecentEnrollment[])
              : undefined
          }
          loading={loading}
        />
      </div>
    </div>
  );
}

export default CoordinatorDashboard;
