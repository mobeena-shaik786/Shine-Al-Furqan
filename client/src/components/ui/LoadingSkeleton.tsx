import { cn } from '../../lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  rows?: number;
}

export function LoadingSkeleton({ className, rows = 1 }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)} aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded-lg bg-line"
          style={{ width: `${85 - i * 10}%` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('card p-4', className)} aria-busy="true">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-line" />
        <div className="min-w-0 flex-1">
          <div className="mb-2 h-3 w-24 animate-pulse rounded bg-line" />
          <div className="h-7 w-16 animate-pulse rounded bg-line" />
        </div>
      </div>
    </div>
  );
}
