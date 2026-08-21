import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import type { RecentEnrollment } from '../../types/dashboard';
import { UserAvatar } from '../ui/UserAvatar';
import { StatusBadge } from '../ui/StatusBadge';
import { CardSkeleton } from '../ui/LoadingSkeleton';
import { EmptyState } from '../ui/EmptyState';

interface RecentEnrollmentsCardProps {
  data?: RecentEnrollment[];
  loading?: boolean;
}

export function RecentEnrollmentsCard({ data, loading }: RecentEnrollmentsCardProps) {
  if (loading) return <CardSkeleton className="min-h-[320px]" />;
  if (!data?.length) return <EmptyState title="No recent enrollments" />;

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="text-base font-semibold text-ink">Enrollment overview</h3>
        <Link
          to="/students"
          className="text-xs font-semibold text-[#B91C1C] transition-all duration-200 hover:underline"
        >
          View all
        </Link>
      </div>
      <ul className="divide-y divide-line border-t border-line">
        {data.map((item) => {
          const [first, ...rest] = item.studentName.split(' ');
          return (
            <li
              key={item.id}
              className="flex items-center gap-3 px-5 py-3 transition-all duration-200 hover:bg-surface-muted"
            >
              <UserAvatar firstName={first} lastName={rest.join(' ')} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{item.studentName}</p>
                <p className="truncate text-[13px] text-ink-muted">
                  {item.course} · {format(parseISO(item.enrollmentDate), 'MMM d, yyyy')}
                </p>
              </div>
              <StatusBadge status={item.status} />
              <Link
                to={`/students/${item.id}`}
                className="text-xs font-semibold text-[#B91C1C] transition-all duration-200 hover:underline"
              >
                View
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
