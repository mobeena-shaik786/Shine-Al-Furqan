import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { FeeOverview } from '../../types/dashboard';
import { formatCurrency } from '../../lib/utils';
import { CardSkeleton } from '../ui/LoadingSkeleton';

interface FeeOverviewCardProps {
  data?: FeeOverview;
  loading?: boolean;
}

export function FeeOverviewCard({ data, loading }: FeeOverviewCardProps) {
  if (loading || !data) return <CardSkeleton className="min-h-[320px]" />;

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Fee Overview</h3>
        <Link to="/fees" className="text-xs font-semibold text-primary hover:underline">
          Manage fees
        </Link>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Expected', value: data.expected, tone: 'text-ink' },
          { label: 'Collected', value: data.collected, tone: 'text-primary' },
          { label: 'Pending', value: data.pending, tone: 'text-secondary' },
          { label: 'Overdue', value: data.overdue, tone: 'text-accent' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-surface-page p-3">
            <p className="text-xs text-ink-muted">{item.label}</p>
            <p className={`mt-1 text-lg font-bold ${item.tone}`}>
              {formatCurrency(item.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4DFE5" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} width={48} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ borderRadius: 12, border: '1px solid #E4DFE5', fontSize: 12 }}
            />
            <Bar dataKey="collected" fill="#E03040" radius={[6, 6, 0, 0]} name="Collected" />
            <Bar dataKey="pending" fill="#B77E5E" radius={[6, 6, 0, 0]} name="Pending" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
