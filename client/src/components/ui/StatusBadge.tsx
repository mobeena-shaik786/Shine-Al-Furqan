import { cn } from '../../lib/utils';

const variants: Record<string, string> = {
  active: 'bg-success/15 text-success',
  pending: 'bg-warning/15 text-warning',
  completed: 'bg-success/15 text-success',
  scheduled: 'bg-primary/10 text-primary',
  live: 'bg-accent/10 text-accent',
  cancelled: 'bg-danger/10 text-danger',
  online: 'bg-success/15 text-success',
  onsite: 'bg-surface-muted text-ink',
  hybrid: 'bg-surface-muted text-ink-muted',
  overdue: 'bg-danger/10 text-danger',
  paid: 'bg-success/15 text-success',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = status.toLowerCase();
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
        variants[key] ?? 'bg-surface-muted text-ink-muted',
        className,
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
