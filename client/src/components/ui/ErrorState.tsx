import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message = 'Something went wrong while loading data.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-danger/20 bg-danger/5 px-6 py-10 text-center',
        className,
      )}
    >
      <AlertTriangle className="mb-3 h-8 w-8 text-danger" aria-hidden />
      <p className="text-sm font-medium text-ink">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-primary mt-4">
          <RefreshCw className="h-4 w-4" aria-hidden />
          Retry
        </button>
      )}
    </div>
  );
}
