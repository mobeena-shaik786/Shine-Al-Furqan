import type { LucideIcon } from 'lucide-react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { cn, formatNumber } from '../../lib/utils';
import { CardSkeleton } from './LoadingSkeleton';
import { ErrorState } from './ErrorState';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  change?: number;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  change,
  loading,
  error,
  onRetry,
  className,
}: StatCardProps) {
  if (loading) return <CardSkeleton className={className} />;
  if (error) return <ErrorState className={className} onRetry={onRetry} message="Failed to load" />;

  const positive = (change ?? 0) > 0;
  const negative = (change ?? 0) < 0;
  const flat = (change ?? 0) === 0;

  return (
    <article className={cn('card dash-lift p-4', className)}>
      <div className="flex items-start gap-3">
        <div className="dash-icon">
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-medium text-ink-muted">{label}</p>
            {typeof change === 'number' && (
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  positive && 'bg-success/10 text-success',
                  negative && 'bg-danger/10 text-danger',
                  flat && 'bg-surface-muted text-ink-muted',
                )}
              >
                {positive ? (
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                ) : negative ? (
                  <TrendingDown className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Minus className="h-3.5 w-3.5" aria-hidden />
                )}
                {Math.abs(change)}%
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[28px] font-bold leading-none tracking-tight text-ink">
            {formatNumber(value)}
          </p>
        </div>
      </div>
    </article>
  );
}
