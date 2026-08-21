import { Link } from 'react-router-dom';
import { ExternalLink, Video } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { UpcomingClass } from '../../types/dashboard';
import { StatusBadge } from '../ui/StatusBadge';
import { CardSkeleton } from '../ui/LoadingSkeleton';
import { EmptyState } from '../ui/EmptyState';

interface UpcomingClassesCardProps {
  data?: UpcomingClass[];
  loading?: boolean;
}

export function UpcomingClassesCard({ data, loading }: UpcomingClassesCardProps) {
  if (loading) return <CardSkeleton className="min-h-[320px]" />;
  if (!data?.length) return <EmptyState title="No upcoming classes" />;

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h3 className="text-sm font-semibold text-ink">Upcoming Classes</h3>
        <Link to="/classes" className="text-xs font-semibold text-primary hover:underline">
          View schedule
        </Link>
      </div>
      <ul className="divide-y divide-line">
        {data.map((session) => (
          <li key={session.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{session.subject}</p>
              <p className="truncate text-xs text-ink-muted">
                {session.course} · {session.teacher}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {format(parseISO(session.date), 'EEE, MMM d')} · {session.startTime}–{session.endTime}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={session.mode} />
              <StatusBadge status={session.status} />
              <Link
                to={`/classes`}
                className="btn-ghost"
                aria-label={`View ${session.subject}`}
              >
                {session.mode === 'online' ? (
                  <Video className="h-4 w-4" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                {session.mode === 'online' ? 'Join' : 'View'}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
