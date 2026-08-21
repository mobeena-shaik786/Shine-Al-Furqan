import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { DashboardAnalytics } from '../../types/dashboard';
import { formatNumber } from '../../lib/utils';
import { CardSkeleton } from '../ui/LoadingSkeleton';

interface AnalyticsCardsProps {
  data?: DashboardAnalytics;
  loading?: boolean;
}

export function AnalyticsCards({ data, loading }: AnalyticsCardsProps) {
  if (loading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <article className="card p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-[#758188]">Classes Today</p>
            <p className="mt-1 text-3xl font-bold text-[#1E2531]">
              {formatNumber(data.classesToday)}
            </p>
            <p className="mt-1 text-xs text-[#758188]">Scheduled sessions</p>
          </div>
          <Link
            to="/classes"
            className="rounded-lg p-2 text-[#758188] hover:bg-[#F8F8F8] hover:text-[#E03040]"
            aria-label="View class schedule"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#758188]">
          Today&apos;s class activity
        </p>
        <div className="flex h-16 items-end gap-1.5" aria-hidden>
          {data.classActivity.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md bg-gradient-to-t from-[#B01828] to-[#E03040]"
              style={{ height: `${(v / Math.max(...data.classActivity)) * 100}%` }}
            />
          ))}
        </div>
      </article>

      <article className="card p-5">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-[#758188]">Active Users</p>
            <p className="mt-1 text-3xl font-bold text-[#1E2531]">
              {formatNumber(data.activeUsers)}
            </p>
            <p className="mt-1 text-xs text-[#E03040]">
              {data.activeUsersPercent}% of total users
            </p>
          </div>
        </div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#758188]">
          Weekly active-user trend
        </p>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.weeklyActiveUsers}>
              <defs>
                <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E03040" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#E03040" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #E4DFE5',
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#E03040"
                strokeWidth={2}
                fill="url(#usersFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </article>
    </div>
  );
}
