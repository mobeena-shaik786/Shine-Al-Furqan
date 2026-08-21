import { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  IndianRupee,
  Search,
  UserRound,
  Users,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { cn } from '../../lib/utils';
import { splitName } from '../../types/auth';
import {
  getSalaryDetail,
  listSalaries,
  type SalaryMode,
  type UstadSalaryDetail,
  type UstadSalaryRow,
} from '../../services/salariesApi';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatInr(value: number) {
  const rounded = Math.round(value * 10) / 10;
  const hasDecimal = !Number.isInteger(rounded);
  return `₹${rounded.toLocaleString('en-IN', {
    minimumFractionDigits: hasDecimal ? 1 : 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatRatio(value: number) {
  return value.toLocaleString('en-IN', { maximumFractionDigits: 4 });
}

function batchPreview(batches: UstadSalaryRow['batches']) {
  if (batches.length === 0) return 'No batches';
  const names = batches.map((b) => b.name);
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
}

export function SalaryManagementPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [mode, setMode] = useState<SalaryMode>('unique');
  const [roleTab, setRoleTab] = useState<'ustad' | 'coordinator'>('ustad');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<UstadSalaryRow[]>([]);
  const [stats, setStats] = useState({
    totalSalary: 0,
    ustadCount: 0,
    totalPresent: 0,
    classDays: 0,
    activeBatches: 0,
  });
  const [basePay, setBasePay] = useState(2000);
  const [incentiveRate, setIncentiveRate] = useState(150);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<UstadSalaryDetail | null>(null);
  const [detailError, setDetailError] = useState('');

  const shiftMonth = (delta: number) => {
    const d = new Date(Date.UTC(year, month - 1 + delta, 1));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth() + 1);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listSalaries({
        year,
        month,
        mode,
        search: search.trim() || undefined,
      });
      setRows(result.rows);
      setStats(result.meta.stats);
      setBasePay(result.meta.basePay);
      setIncentiveRate(result.meta.incentiveRate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load salaries');
    } finally {
      setLoading(false);
    }
  }, [year, month, mode, search]);

  useEffect(() => {
    if (roleTab !== 'ustad') return;
    void load();
  }, [load, roleTab]);

  const openDetail = async (ustadId: string) => {
    setDetailOpen(true);
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      const data = await getSalaryDetail(ustadId, { year, month, mode });
      setDetail(data);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Unable to load detail');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          title="Salary Management"
          description="Auto-calculated salaries based on attendance and assignments"
        />
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] p-1">
            <button
              type="button"
              onClick={() => setMode('unique')}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-semibold transition',
                mode === 'unique'
                  ? 'bg-[#B01828] text-[#F8F8F8]'
                  : 'text-[#758188] hover:text-[#1E2531]',
              )}
            >
              Unique days
            </button>
            <button
              type="button"
              onClick={() => setMode('fixed')}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-semibold transition',
                mode === 'fixed'
                  ? 'bg-[#B01828] text-[#F8F8F8]'
                  : 'text-[#758188] hover:text-[#1E2531]',
              )}
            >
              Fixed days
            </button>
          </div>
          <div className="inline-flex items-center gap-1 rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] px-2 py-1.5">
            <button
              type="button"
              aria-label="Previous month"
              className="rounded-lg p-1.5 text-[#758188] hover:bg-[#E9EEF0] hover:text-[#1E2531]"
              onClick={() => shiftMonth(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[120px] text-center text-sm font-semibold text-[#1E2531]">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button
              type="button"
              aria-label="Next month"
              className="rounded-lg p-1.5 text-[#758188] hover:bg-[#E9EEF0] hover:text-[#1E2531]"
              onClick={() => shiftMonth(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="inline-flex rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] p-1">
        <button
          type="button"
          onClick={() => setRoleTab('ustad')}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold',
            roleTab === 'ustad'
              ? 'bg-[#B01828] text-[#F8F8F8]'
              : 'text-[#758188] hover:text-[#1E2531]',
          )}
        >
          <UserRound className="h-4 w-4" />
          Ustad
        </button>
        <button
          type="button"
          onClick={() => setRoleTab('coordinator')}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold',
            roleTab === 'coordinator'
              ? 'bg-[#B01828] text-[#F8F8F8]'
              : 'text-[#758188] hover:text-[#1E2531]',
          )}
        >
          <UserRound className="h-4 w-4" />
          Coordinator
          <span className="rounded-md bg-[#B77E5E]/25 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#B77E5E]">
            Soon
          </span>
        </button>
      </div>

      {roleTab === 'coordinator' ? (
        <section className="rounded-2xl border border-[#E4DFE5] bg-[#F8F8F8] p-8 text-center shadow-soft">
          <p className="text-lg font-semibold text-[#1E2531]">Coordinator salaries</p>
          <p className="mt-2 text-sm text-[#758188]">
            Coordinator payroll is coming soon. Use the Ustad tab for attendance-based salary
            calculations.
          </p>
        </section>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Salary"
              value={formatInr(stats.totalSalary)}
              hint={`${stats.ustadCount} Ustads`}
              icon={IndianRupee}
              tone="green"
            />
            <StatCard
              label="Total Present"
              value={String(stats.totalPresent)}
              hint="Student present days"
              icon={Users}
              tone="green"
            />
            <StatCard
              label="Class Days"
              value={String(stats.classDays)}
              hint={
                mode === 'unique'
                  ? 'Sum of unique teaching days'
                  : 'Sum of fixed calendar days'
              }
              icon={CalendarDays}
              tone="warm"
            />
            <StatCard
              label="Active Batches"
              value={String(stats.activeBatches)}
              hint="Assigned this month"
              icon={BookOpen}
              tone="blue"
            />
          </section>

          <section className="rounded-2xl border border-[#E4DFE5] bg-[#F8F8F8] p-4 shadow-soft sm:p-5">
            <h2 className="text-base font-bold text-[#B01828]">Salary formula</h2>
            <p className="mt-2 text-sm text-[#1E2531]">
              Class days = {mode === 'unique' ? 'unique attendance dates (default)' : 'fixed calendar days'}.
              Total present ÷ class days = ratio. Incentive = ratio × ₹{incentiveRate}. Total = ₹
              {basePay.toLocaleString('en-IN')} base + incentive.
            </p>
            <p className="mt-2 text-xs text-[#758188]">
              Present days come from student attendance (Join click or manual mark). Late/absent are
              excluded. Formula is unchanged when switching months.
            </p>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#E4DFE5] bg-[#F8F8F8] shadow-soft">
            <div className="flex flex-col gap-3 border-b border-[#E4DFE5] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-bold text-[#1E2531]">Ustad salaries</h2>
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#758188]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search ustads or batches..."
                  className="w-full rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#E03040] focus:ring-2 focus:ring-[#E03040]/20"
                />
              </div>
            </div>

            {error ? <p className="px-4 py-3 text-sm text-[#E03040]">{error}</p> : null}

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[#E4DFE5] bg-[#E9EEF0]/50 text-xs uppercase tracking-wide text-[#758188]">
                  <tr>
                    <th className="px-4 py-3">Ustad</th>
                    <th className="px-4 py-3">Batches</th>
                    <th className="px-4 py-3">Attendance</th>
                    <th className="px-4 py-3">Salary</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[#758188]">
                        Loading salaries…
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[#758188]">
                        No ustads found for this period.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const { firstName, lastName } = splitName(row.name);
                      return (
                        <tr key={row.ustadId} className="border-b border-[#E4DFE5]/80 last:border-0">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <UserAvatar firstName={firstName} lastName={lastName} size="sm" />
                              <div>
                                <p className="font-semibold text-[#1E2531]">{row.name}</p>
                                <p className="text-xs text-[#758188]">{row.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-[#1E2531]">
                              {row.batchCount} batch(es)
                            </p>
                            <p className="text-xs text-[#758188]">{row.studentTotal} students</p>
                            <p className="mt-0.5 text-xs text-[#758188]">{batchPreview(row.batches)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-[#1E2531]">{row.totalPresent} present</p>
                            <p className="text-xs text-[#758188]">
                              {row.usedDays} used · unique {row.uniqueDays} · fixed {row.fixedDays}
                            </p>
                            <p className="mt-0.5 text-xs font-semibold text-[#61E092]">
                              Ratio {formatRatio(row.ratio)}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-base font-bold text-[#1E2531]">{formatInr(row.total)}</p>
                            <p className="text-xs text-[#758188]">Base {formatInr(row.basePay)}</p>
                            <p className="text-xs font-semibold text-[#61E092]">
                              +{formatInr(row.incentive)}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              className="rounded-lg p-2 text-[#758188] hover:bg-[#E9EEF0] hover:text-[#1E2531]"
                              aria-label={`View salary for ${row.name}`}
                              onClick={() => void openDetail(row.ustadId)}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <SalaryDetailDrawer
        open={detailOpen}
        loading={detailLoading}
        error={detailError}
        detail={detail}
        onClose={() => {
          setDetailOpen(false);
          setDetail(null);
          setDetailError('');
        }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Users;
  tone: 'green' | 'blue' | 'warm';
}) {
  const toneClass =
    tone === 'green'
      ? 'bg-[#61E092]/15 text-[#1E2531]'
      : tone === 'blue'
        ? 'bg-[#E9EEF0] text-[#B01828]'
        : 'bg-[#B77E5E]/15 text-[#B77E5E]';
  return (
    <div className="rounded-2xl border border-[#E4DFE5] bg-[#F8F8F8] p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#758188]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[#1E2531]">{value}</p>
          <p className="mt-1 text-xs text-[#758188]">{hint}</p>
        </div>
        <span className={cn('rounded-xl p-2.5', toneClass)}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
    </div>
  );
}

function SalaryDetailDrawer({
  open,
  loading,
  error,
  detail,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  error: string;
  detail: UstadSalaryDetail | null;
  onClose: () => void;
}) {
  const { firstName, lastName } = splitName(detail?.name || 'U');
  const period =
    detail != null ? `${MONTH_NAMES[detail.month - 1]} ${detail.year}` : '';

  return (
    <Modal open={open} title="Salary details" onClose={onClose} variant="drawer" size="lg">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {loading ? <p className="text-sm text-[#758188]">Loading details…</p> : null}
        {error ? <p className="text-sm text-[#E03040]">{error}</p> : null}
        {detail ? (
          <>
            <div className="flex items-start gap-3">
              <UserAvatar firstName={firstName} lastName={lastName} size="lg" />
              <div>
                <p className="text-lg font-bold text-[#1E2531]">{detail.name}</p>
                <p className="text-sm text-[#758188]">{detail.email}</p>
                <p className="mt-1 text-sm text-[#1E2531]">{period}</p>
                <p className="mt-0.5 text-sm font-semibold text-[#61E092]">
                  Mode: {detail.mode === 'unique' ? 'Unique attendance days' : 'Fixed calendar days'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <MiniMetric label="Total present" value={String(detail.totalPresent)} hint="Present only" />
              <MiniMetric
                label="Used for ratio"
                value={String(detail.usedDays)}
                hint={detail.mode === 'unique' ? 'Unique attendance days' : 'Fixed calendar days'}
              />
              <MiniMetric label="Unique days" value={String(detail.uniqueDays)} hint="From attendance" />
              <MiniMetric label="Fixed days" value={String(detail.fixedDays)} hint="Calendar table" />
            </div>

            <div className="rounded-xl border border-[#E4DFE5] bg-[#E9EEF0]/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#758188]">Ratio</p>
              <p className="mt-1 text-2xl font-bold text-[#1E2531]">{formatRatio(detail.ratio)}</p>
              <p className="mt-1 text-xs text-[#758188]">Present ÷ used days</p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#758188]">
                Assigned batches
              </p>
              <div className="space-y-2">
                {detail.batches.length === 0 ? (
                  <p className="text-sm text-[#758188]">No batches assigned.</p>
                ) : (
                  detail.batches.map((batch) => (
                    <div
                      key={batch._id}
                      className="flex items-center gap-3 rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] px-3 py-3"
                    >
                      <span className="rounded-lg bg-[#E9EEF0] p-2 text-[#B01828]">
                        <BookOpen className="h-4 w-4" />
                      </span>
                      <p className="flex-1 text-sm font-semibold text-[#1E2531]">{batch.name}</p>
                      <p className="text-xs text-[#758188]">
                        {batch.studentCount} students · {batch.classCount} classes
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#758188]">
                Salary breakdown
              </p>
              <div className="overflow-hidden rounded-xl border border-[#E4DFE5]">
                <div className="flex items-center justify-between border-b border-[#E4DFE5] bg-[#F8F8F8] px-4 py-3 text-sm">
                  <span className="text-[#1E2531]">Base pay</span>
                  <span className="font-semibold text-[#1E2531]">{formatInr(detail.basePay)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-[#E4DFE5] bg-[#F8F8F8] px-4 py-3 text-sm">
                  <span className="text-[#1E2531]">
                    Incentive ({formatRatio(detail.ratio)} × ₹{detail.incentiveRate})
                  </span>
                  <span className="font-semibold text-[#61E092]">+{formatInr(detail.incentive)}</span>
                </div>
                <div className="flex items-center justify-between bg-[#61E092]/10 px-4 py-3 text-sm">
                  <span className="font-bold text-[#1E2531]">Total salary</span>
                  <span className="text-base font-bold text-[#61E092]">{formatInr(detail.total)}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#758188]">
                How it&apos;s calculated
              </p>
              <ol className="list-decimal space-y-2 rounded-xl border border-[#E4DFE5] bg-[#E9EEF0]/50 px-5 py-4 text-sm text-[#1E2531]">
                {detail.calculation.steps.map((step) => (
                  <li key={step} className="pl-1">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}

function MiniMetric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-[#E4DFE5] bg-[#E9EEF0]/50 px-3 py-3">
      <p className="text-xs text-[#758188]">{label}</p>
      <p className="mt-1 text-xl font-bold text-[#1E2531]">{value}</p>
      <p className="mt-0.5 text-[11px] text-[#758188]">{hint}</p>
    </div>
  );
}

export default SalaryManagementPage;
