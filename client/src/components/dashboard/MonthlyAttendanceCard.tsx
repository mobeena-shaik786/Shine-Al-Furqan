import { Link } from 'react-router-dom';
import type { AttendanceOverview } from '../../types/dashboard';
import { formatNumber } from '../../lib/utils';
import { CardSkeleton } from '../ui/LoadingSkeleton';

interface MonthlyAttendanceCardProps {
  data?: AttendanceOverview;
  loading?: boolean;
  onMonthChange?: (month: string) => void;
}

export function MonthlyAttendanceCard({
  data,
  loading,
  onMonthChange,
}: MonthlyAttendanceCardProps) {
  if (loading || !data) return <CardSkeleton className="min-h-[280px]" />;

  return (
    <section className="card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-ink">Attendance</h3>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {formatNumber(data.totalRecords)} records this month
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="attendance-month">
            Select month
          </label>
          <input
            id="attendance-month"
            type="month"
            value={data.month}
            onChange={(e) => onMonthChange?.(e.target.value)}
            className="rounded-lg border border-line bg-surface-muted px-2.5 py-1.5 text-xs text-ink"
          />
          <Link
            to="/attendance"
            className="text-xs font-semibold text-[#B91C1C] transition-all duration-200 hover:underline"
          >
            Manage
          </Link>
        </div>
      </div>

      <p className="text-[28px] font-bold leading-none tracking-tight text-ink">
        {data.rate.toFixed(2)}%
      </p>
      <p className="mt-1 text-[13px] text-ink-muted">Attendance rate</p>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-success"
          style={{ width: `${data.rate}%` }}
          role="progressbar"
          aria-valuenow={data.rate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Attendance rate ${data.rate}%`}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-muted p-3">
          <p className="text-[12px] font-medium text-success">Present</p>
          <p className="mt-1 text-xl font-bold text-ink">{formatNumber(data.present)}</p>
        </div>
        <div className="rounded-xl bg-surface-muted p-3">
          <p className="text-[12px] font-medium text-warning">Absent</p>
          <p className="mt-1 text-xl font-bold text-ink">{formatNumber(data.absent)}</p>
        </div>
      </div>
    </section>
  );
}
