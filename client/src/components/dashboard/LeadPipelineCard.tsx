import { Link } from 'react-router-dom';
import type { LeadPipeline } from '../../types/dashboard';
import { formatNumber } from '../../lib/utils';
import { CardSkeleton } from '../ui/LoadingSkeleton';

interface LeadPipelineCardProps {
  data?: LeadPipeline;
  loading?: boolean;
}

export function LeadPipelineCard({ data, loading }: LeadPipelineCardProps) {
  if (loading || !data) return <CardSkeleton className="min-h-[280px]" />;

  const max = Math.max(...data.stages.map((s) => s.count));

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink">Lead Pipeline</h3>
          <p className="text-xs text-ink-muted">
            {formatNumber(data.total)} total · {data.conversionRate}% conversion
          </p>
        </div>
        <Link to="/leads" className="text-xs font-semibold text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="space-y-4">
        {data.stages.map((stage) => (
          <div key={stage.key}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span
                className="font-medium text-ink"
                title={`${stage.label} leads currently in this stage`}
              >
                {stage.label}
              </span>
              <span className="font-bold text-ink" title={`${stage.count} leads`}>
                {formatNumber(stage.count)}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(stage.count / max) * 100}%`,
                  backgroundColor: stage.color,
                }}
                title={`${stage.label}: ${stage.count}`}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
