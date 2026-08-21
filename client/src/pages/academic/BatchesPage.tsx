import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  BookOpen,
  CheckCircle2,
  Download,
  Eye,
  Layers,
  PauseCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { FieldShell, formControlClass } from '../../components/ui/FormField';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import {
  createBatch,
  deleteBatch,
  listBatches,
  listCourses,
  listUstads,
  updateBatch,
  type BatchDto,
  type BatchListMeta,
  type CourseDto,
} from '../../services/academicApi';
import { listUsers, type ManagedUser } from '../../services/usersApi';

const canMutate = (role?: string) => role === 'admin' || role === 'coordinator';

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const WEEKDAY_SHORT: Record<(typeof WEEKDAYS)[number], string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

const HOURS_12 = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'] as const;
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'] as const;

type ScheduleSlot = { day: (typeof WEEKDAYS)[number]; startTime: string; endTime: string };
type TimeParts = { hour: string; minute: string; period: 'AM' | 'PM' };

function to24h({ hour, minute, period }: TimeParts): string {
  let h = Number(hour);
  if (period === 'AM') {
    if (h === 12) h = 0;
  } else if (h !== 12) {
    h += 12;
  }
  return `${String(h).padStart(2, '0')}:${minute}`;
}

function from24h(value: string): TimeParts {
  const [hRaw = '19', mRaw = '00'] = value.split(':');
  let h = Number(hRaw);
  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  const minute = MINUTES.includes(mRaw as (typeof MINUTES)[number])
    ? mRaw
    : MINUTES.reduce((best, cur) =>
        Math.abs(Number(cur) - Number(mRaw)) < Math.abs(Number(best) - Number(mRaw)) ? cur : best,
      );
  return { hour: String(h).padStart(2, '0'), minute, period };
}

function formatSlotLabel(slot: ScheduleSlot) {
  const start = from24h(slot.startTime);
  const end = from24h(slot.endTime);
  return `${WEEKDAY_SHORT[slot.day]} · ${start.hour}:${start.minute} ${start.period} – ${end.hour}:${end.minute} ${end.period}`;
}

const selectClass =
  'rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] px-3 py-2.5 text-sm text-[#1E2531] outline-none transition focus:border-[#E03040] focus:ring-2 focus:ring-[#E03040]/20';

const emptyStats = {
  total: 0,
  active: 0,
  inactive: 0,
  completed: 0,
  fullActive: 0,
  totalStudents: 0,
  totalCapacity: 0,
  utilization: 0,
};

function statusLabel(status: BatchDto['status']) {
  if (status === 'active') return 'Active';
  if (status === 'completed') return 'Completed';
  return 'Inactive';
}

function todayInputValue() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function BatchesPage() {
  const { user } = useAuth();
  const mutate = canMutate(user?.role);
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [meta, setMeta] = useState<BatchListMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    stats: emptyStats,
  });
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState('');
  const [activity, setActivity] = useState<'' | 'active' | 'inactive' | 'completed'>('');
  const [sort, setSort] = useState<'-createdAt' | 'createdAt' | 'name' | '-name'>('-createdAt');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [addOpen, setAddOpen] = useState(false);
  const [editBatch, setEditBatch] = useState<BatchDto | null>(null);

  const stats = meta.stats || emptyStats;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [batchResult, courseResult] = await Promise.all([
        listBatches({
          search: search.trim() || undefined,
          courseId: courseId || undefined,
          activity: activity || undefined,
          sort,
          page,
          limit: pageSize,
        }),
        listCourses({ limit: 100, activity: 'active' }).catch(() =>
          listCourses({ limit: 100 }),
        ),
      ]);
      setBatches(batchResult.batches);
      setMeta(batchResult.meta);
      setCourses(courseResult.courses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load batches');
    } finally {
      setLoading(false);
    }
  }, [search, courseId, activity, sort, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, courseId, activity, sort, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportCsv = () => {
    const rows = [
      ['Batch', 'Course', 'Ustad', 'Coordinator', 'Students', 'Capacity', 'Schedule', 'Status'],
      ...batches.map((b) => [
        b.name,
        b.courseTitle || '',
        (b.ustadNames || []).join('; '),
        b.coordinatorName || '',
        String(b.enrolledCount ?? 0),
        String(b.capacity),
        (b.scheduleSlots || [])
          .map((s) => `${s.day}: ${s.startTime}-${s.endTime}`)
          .join('; ') || b.scheduleNote,
        statusLabel(b.status),
      ]),
    ];
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batches.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Batch Management"
        description="Manage class batches, schedules, and enrollment"
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Total Batches"
          value={stats.total}
          hint={`${stats.active} active`}
          icon={BookOpen}
          tone="warm"
        />
        <StatCard
          label="Active Batches"
          value={stats.active}
          hint={`${stats.fullActive} full`}
          icon={CheckCircle2}
          tone="green"
        />
        <StatCard
          label="Inactive Batches"
          value={stats.inactive}
          hint="Paused / inactive"
          icon={PauseCircle}
          tone="amber"
        />
        <StatCard
          label="Completed Batches"
          value={stats.completed}
          hint="Finished schedule"
          icon={Archive}
          tone="blue"
        />
        <StatCard
          label="Total Students"
          value={stats.totalStudents}
          hint={`Capacity: ${stats.totalCapacity}`}
          icon={Users}
          tone="warm"
        />
        <StatCard
          label="Utilization"
          value={`${stats.utilization}%`}
          hint="Capacity used"
          icon={Layers}
          tone="blue"
        />
      </section>

      <section className="rounded-2xl border border-[#E4DFE5] bg-[#F8F8F8] p-4 shadow-soft sm:p-5">
        <p className="mb-3 text-sm font-semibold text-[#1E2531]">Filters</p>
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className={selectClass}
              aria-label="Select course"
            >
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
            <select
              value={activity}
              onChange={(e) =>
                setActivity(e.target.value as '' | 'active' | 'inactive' | 'completed')
              }
              className={selectClass}
              aria-label="Select status"
            >
              <option value="">Select Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className={selectClass}
              aria-label="Sort by"
            >
              <option value="-createdAt">Newest First</option>
              <option value="createdAt">Oldest First</option>
              <option value="name">Name A–Z</option>
              <option value="-name">Name Z–A</option>
            </select>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className={cn(selectClass, 'w-20')}
              aria-label="Rows per page"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#758188]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search batches..."
                  className="w-full rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#E03040] focus:ring-2 focus:ring-[#E03040]/20"
                />
              </div>
              {mutate ? (
                <>
                  <button
                    type="button"
                    onClick={exportCsv}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] px-4 py-2.5 text-sm font-semibold text-[#1E2531] hover:bg-[#E9EEF0]"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B01828] px-4 py-2.5 text-sm font-semibold text-[#F8F8F8] hover:bg-[#800810]"
                  >
                    <Plus className="h-4 w-4" />
                    Add Batch
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-[#E03040]">{error}</p> : null}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#E4DFE5] bg-[#F8F8F8] shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#E4DFE5] bg-[#E9EEF0]/50 text-xs uppercase tracking-wide text-[#758188]">
              <tr>
                <th className="px-4 py-3">Batch Name</th>
                <th className="px-4 py-3">Course Name</th>
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3">Students</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#758188]">
                    Loading batches…
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#758188]">
                    No batches match your filters.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => {
                  const slots = batch.scheduleSlots || [];
                  const firstSlot = slots[0];
                  const more = Math.max(0, slots.length - 1);
                  const label = statusLabel(batch.status);
                  return (
                    <tr key={batch._id} className="border-b border-[#E4DFE5]/80 last:border-0">
                      <td className="px-4 py-3 font-semibold text-[#1E2531]">{batch.name}</td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/courses/${batch.courseId}`}
                          className="font-medium text-[#B01828] hover:underline"
                        >
                          {batch.courseTitle || '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[#758188]">
                        <p>
                          <span className="font-medium text-[#1E2531]">Ustad:</span>{' '}
                          {(batch.ustadNames || []).join(', ') || '—'}
                        </p>
                        <p className="mt-0.5">
                          <span className="font-medium text-[#1E2531]">Coord:</span>{' '}
                          {batch.coordinatorName || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#1E2531]">
                        {batch.enrolledCount ?? 0}/{batch.capacity}
                      </td>
                      <td className="px-4 py-3 text-[#758188]">
                        {firstSlot ? (
                          <>
                            <p>
                              {firstSlot.day}: {firstSlot.startTime}-{firstSlot.endTime}
                            </p>
                            {more > 0 ? (
                              <p className="mt-0.5 text-xs font-semibold text-[#B01828]">
                                +{more} more
                              </p>
                            ) : null}
                          </>
                        ) : (
                          <p>{batch.scheduleNote || '—'}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            label === 'Active'
                              ? 'bg-[#61E092]/20 text-[#1E2531]'
                              : label === 'Completed'
                                ? 'bg-[#E9EEF0] text-[#1E2531]'
                                : 'bg-[#B77E5E]/15 text-[#B77E5E]',
                          )}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/batches/${batch._id}`}
                            className="rounded-lg p-2 text-[#758188] hover:bg-[#E9EEF0] hover:text-[#1E2531]"
                            aria-label={`View ${batch.name}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {mutate ? (
                            <>
                              <button
                                type="button"
                                className="rounded-lg p-2 text-[#758188] hover:bg-[#E9EEF0] hover:text-[#1E2531]"
                                aria-label={`Edit ${batch.name}`}
                                onClick={() => setEditBatch(batch)}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <Link
                                to={`/batches/${batch._id}`}
                                className="rounded-lg p-2 text-[#758188] hover:bg-[#E9EEF0] hover:text-[#1E2531]"
                                aria-label={`Enroll students in ${batch.name}`}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Link>
                              <button
                                type="button"
                                className="rounded-lg p-2 text-[#758188] hover:bg-[#E03040]/10 hover:text-[#E03040]"
                                aria-label={`Delete ${batch.name}`}
                                onClick={() => {
                                  if (!window.confirm(`Delete batch “${batch.name}”?`)) return;
                                  void deleteBatch(batch._id)
                                    .then(load)
                                    .catch((e) =>
                                      setError(e instanceof Error ? e.message : 'Delete failed'),
                                    );
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E4DFE5] px-4 py-3">
          <p className="text-xs text-[#758188]">
            Showing {meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1} to{' '}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} entries.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-[#E4DFE5] px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#B01828] px-2 text-sm font-semibold text-[#F8F8F8]">
              {meta.page}
            </span>
            <button
              type="button"
              disabled={meta.page >= (meta.totalPages || 1)}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-[#E4DFE5] px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {mutate ? (
        <>
          <BatchFormDrawer
            open={addOpen}
            mode="create"
            courses={courses}
            onClose={() => setAddOpen(false)}
            onSubmit={async (payload) => {
              await createBatch(payload);
              setPage(1);
              await load();
            }}
          />
          <BatchFormDrawer
            open={Boolean(editBatch)}
            mode="edit"
            courses={courses}
            initial={editBatch}
            onClose={() => setEditBatch(null)}
            onSubmit={async (payload) => {
              if (!editBatch) return;
              await updateBatch(editBatch._id, {
                name: payload.name,
                capacity: payload.capacity,
                instructorIds: payload.instructorIds,
                coordinatorId: payload.coordinatorId || null,
                startDate: payload.startDate || null,
                endDate: payload.endDate || null,
                scheduleSlots: payload.scheduleSlots,
                status: payload.status,
              });
              await load();
            }}
          />
        </>
      ) : null}
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
  value: number | string;
  hint: string;
  icon: typeof BookOpen;
  tone: 'green' | 'blue' | 'warm' | 'amber';
}) {
  const toneClass =
    tone === 'green'
      ? 'bg-[#61E092]/15 text-[#1E2531]'
      : tone === 'blue'
        ? 'bg-[#E9EEF0] text-[#B01828]'
        : tone === 'amber'
          ? 'bg-[#B77E5E]/15 text-[#B77E5E]'
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

function BatchFormDrawer({
  open,
  mode,
  courses,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  courses: CourseDto[];
  initial?: BatchDto | null;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    courseId: string;
    capacity: number;
    instructorIds: string[];
    coordinatorId?: string;
    startDate?: string;
    endDate?: string;
    scheduleSlots: ScheduleSlot[];
    status: BatchDto['status'];
  }) => Promise<void>;
}) {
  const [tab, setTab] = useState<'details' | 'schedule'>('details');
  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [capacity, setCapacity] = useState('15');
  const [startDate, setStartDate] = useState(todayInputValue());
  const [endDate, setEndDate] = useState('');
  const [ustadId, setUstadId] = useState('');
  const [coordinatorId, setCoordinatorId] = useState('');
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [draftDays, setDraftDays] = useState<Set<(typeof WEEKDAYS)[number]>>(new Set());
  const [draftStart, setDraftStart] = useState<TimeParts>({ hour: '07', minute: '00', period: 'PM' });
  const [draftEnd, setDraftEnd] = useState<TimeParts>({ hour: '08', minute: '00', period: 'PM' });
  const [ustads, setUstads] = useState<Array<{ _id: string; name: string }>>([]);
  const [coordinators, setCoordinators] = useState<ManagedUser[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTab('details');
    setName(initial?.name || '');
    setCourseId(initial?.courseId || '');
    setCapacity(String(initial?.capacity ?? 15));
    setStartDate(initial?.startDate ? initial.startDate.slice(0, 10) : todayInputValue());
    setEndDate(initial?.endDate ? initial.endDate.slice(0, 10) : '');
    setUstadId(initial?.instructors?.[0] || '');
    setCoordinatorId(initial?.coordinatorId || '');
    setSlots(initial?.scheduleSlots?.length ? (initial.scheduleSlots as ScheduleSlot[]) : []);
    setDraftDays(new Set());
    setDraftStart({ hour: '07', minute: '00', period: 'PM' });
    setDraftEnd({ hour: '08', minute: '00', period: 'PM' });
    setError('');
    setSubmitting(false);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    void Promise.all([
      listUstads().catch(() => []),
      listUsers({ role: 'coordinator', limit: 100, isActive: true }).catch(() => ({
        users: [] as ManagedUser[],
      })),
    ]).then(([u, c]) => {
      setUstads(u);
      setCoordinators(c.users || []);
    });
  }, [open]);

  const title = mode === 'create' ? 'Add Batch' : 'Edit Batch';

  const validateDetails = () => {
    if (!name.trim()) return 'Batch name is required';
    if (!courseId) return 'Course is required';
    const cap = Number(capacity);
    if (!Number.isFinite(cap) || cap < 1) return 'Maximum students must be at least 1';
    if (!startDate) return 'Start date is required';
    if (!ustadId) return 'Ustad is required';
    if (!coordinatorId) return 'Coordinator is required';
    return '';
  };

  const goNext = () => {
    const msg = validateDetails();
    if (msg) {
      setError(msg);
      return;
    }
    setError('');
    setTab('schedule');
  };

  const toggleDay = (day: (typeof WEEKDAYS)[number]) => {
    setDraftDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const selectMonFri = () => {
    setDraftDays(new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']));
  };

  const addScheduleSlots = () => {
    if (!ustadId) {
      setError('Assign an ustad before adding class schedules.');
      return;
    }
    if (draftDays.size === 0) {
      setError('Select at least one day');
      return;
    }
    const startTime = to24h(draftStart);
    const endTime = to24h(draftEnd);
    if (endTime <= startTime) {
      setError('End time must be after start time');
      return;
    }

    setSlots((prev) => {
      const next = [...prev];
      for (const day of WEEKDAYS) {
        if (!draftDays.has(day)) continue;
        const exists = next.some(
          (s) => s.day === day && s.startTime === startTime && s.endTime === endTime,
        );
        if (!exists) next.push({ day, startTime, endTime });
      }
      return next;
    });
    setDraftDays(new Set());
    setError('');
  };

  const submit = async () => {
    const msg = validateDetails();
    if (msg) {
      setError(msg);
      setTab('details');
      return;
    }
    if (slots.length === 0) {
      setError('At least one schedule slot is required before saving this batch.');
      setTab('schedule');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        name: name.trim(),
        courseId,
        capacity: Number(capacity),
        instructorIds: [ustadId],
        coordinatorId,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        scheduleSlots: slots,
        status: initial?.status || 'active',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save batch');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = (
    <div className="mt-3 flex gap-6">
      <button
        type="button"
        onClick={() => setTab('details')}
        className={cn(
          'border-b-2 pb-2.5 text-sm font-semibold transition',
          tab === 'details'
            ? 'border-[#B01828] text-[#1E2531]'
            : 'border-transparent text-[#758188] hover:text-[#1E2531]',
        )}
      >
        Details
      </button>
      <button
        type="button"
        onClick={() => {
          setError('');
          setTab('schedule');
        }}
        className={cn(
          'border-b-2 pb-2.5 text-sm font-semibold transition',
          tab === 'schedule'
            ? 'border-[#B01828] text-[#1E2531]'
            : 'border-transparent text-[#758188] hover:text-[#1E2531]',
        )}
      >
        Class schedule
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      busy={submitting}
      variant="drawer"
      size="lg"
      headerExtra={tabs}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {tab === 'details' ? (
            <>
              <FieldShell label="Batch Name" required>
                {({ id }) => (
                  <input
                    id={id}
                    className={formControlClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Morning Basic Batch"
                  />
                )}
              </FieldShell>

              <div className="grid gap-4 sm:grid-cols-2">
                <FieldShell label="Course" required>
                  {({ id }) => (
                    <select
                      id={id}
                      className={formControlClass}
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      disabled={mode === 'edit'}
                    >
                      <option value="">Select course</option>
                      {courses.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  )}
                </FieldShell>
                <FieldShell label="Maximum Students" required>
                  {({ id }) => (
                    <input
                      id={id}
                      type="number"
                      min={1}
                      max={500}
                      className={formControlClass}
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="e.g., 15"
                    />
                  )}
                </FieldShell>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FieldShell label="Start Date" required>
                  {({ id }) => (
                    <input
                      id={id}
                      type="date"
                      className={formControlClass}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  )}
                </FieldShell>
                <FieldShell label="End Date (optional)">
                  {({ id }) => (
                    <input
                      id={id}
                      type="date"
                      className={formControlClass}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  )}
                </FieldShell>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FieldShell label="Ustad" required>
                  {({ id }) => (
                    <select
                      id={id}
                      className={formControlClass}
                      value={ustadId}
                      onChange={(e) => setUstadId(e.target.value)}
                    >
                      <option value="">Select ustad</option>
                      {ustads.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  )}
                </FieldShell>
                <FieldShell label="Coordinator" required>
                  {({ id }) => (
                    <select
                      id={id}
                      className={formControlClass}
                      value={coordinatorId}
                      onChange={(e) => setCoordinatorId(e.target.value)}
                    >
                      <option value="">Select coordinator</option>
                      {coordinators.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </FieldShell>
              </div>

              <div className="rounded-xl border border-[#E4DFE5] bg-[#E9EEF0]/50 px-4 py-3">
                <p className="text-sm font-semibold text-[#1E2531]">Meeting rooms</p>
                <p className="mt-1 text-sm text-[#758188]">
                  Each scheduled class day gets its own Jitsi link automatically (no batch-wide
                  link to set). Students and staff join from their portals when the class is live
                  or starting soon.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#758188]">
                  Class schedule <span className="text-[#E03040]">*</span>
                </p>
                <p className="mt-1 text-sm text-[#758188]">
                  At least one schedule slot is required before saving this batch.
                </p>
              </div>

              <div className="space-y-4 rounded-2xl border border-[#E4DFE5] bg-[#F8F8F8] p-4">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[#758188]">
                      Days <span className="text-[#E03040]">*</span>
                    </p>
                    <button
                      type="button"
                      onClick={selectMonFri}
                      className="rounded-lg border border-[#E4DFE5] px-2.5 py-1 text-xs font-semibold text-[#B01828] hover:bg-[#E9EEF0]"
                    >
                      Mon–Fri
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {WEEKDAYS.map((day) => {
                      const active = draftDays.has(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={cn(
                            'rounded-xl border px-2 py-2.5 text-sm font-semibold transition',
                            active
                              ? 'border-[#B01828] bg-[#B01828] text-[#F8F8F8]'
                              : 'border-[#E4DFE5] bg-[#F8F8F8] text-[#1E2531] hover:border-[#E03040]/40',
                          )}
                        >
                          {WEEKDAY_SHORT[day]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <TimeRow
                  label="Start time"
                  value={draftStart}
                  onChange={setDraftStart}
                />
                <TimeRow label="End time" value={draftEnd} onChange={setDraftEnd} />

                {!ustadId ? (
                  <div className="rounded-xl border border-[#B77E5E]/40 bg-[#B77E5E]/10 px-3 py-2.5 text-sm text-[#B77E5E]">
                    Assign an ustad before adding class schedules.
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={addScheduleSlots}
                  disabled={!ustadId}
                  className={cn(
                    'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition',
                    ustadId
                      ? 'bg-[#B01828] text-[#F8F8F8] hover:bg-[#800810]'
                      : 'cursor-not-allowed bg-[#E4DFE5] text-[#758188]',
                  )}
                >
                  <Plus className="h-4 w-4" />
                  Add schedule
                </button>
              </div>

              {slots.length > 0 ? (
                <ul className="space-y-2">
                  {slots.map((slot, index) => (
                    <li
                      key={`${slot.day}-${slot.startTime}-${slot.endTime}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[#E4DFE5] px-3 py-2.5"
                    >
                      <span className="text-sm font-medium text-[#1E2531]">
                        {formatSlotLabel(slot)}
                      </span>
                      <button
                        type="button"
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-[#E03040] hover:bg-[#E03040]/10"
                        onClick={() => setSlots((prev) => prev.filter((_, i) => i !== index))}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}

          {error ? <p className="text-sm text-[#E03040]">{error}</p> : null}
        </div>

        <div className="shrink-0 border-t border-[#E4DFE5] px-5 py-4">
          {tab === 'details' ? (
            <button
              type="button"
              onClick={goNext}
              className="w-full rounded-xl bg-[#B01828] py-3 text-sm font-semibold text-[#F8F8F8] hover:bg-[#800810]"
            >
              Next
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTab('details')}
                className="flex-1 rounded-xl border border-[#B01828] py-3 text-sm font-semibold text-[#B01828] hover:bg-[#E9EEF0]"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submit()}
                className="flex-[2] rounded-xl bg-[#B01828] py-3 text-sm font-semibold text-[#F8F8F8] hover:bg-[#800810] disabled:opacity-60"
              >
                {submitting ? 'Saving…' : mode === 'create' ? 'Create Batch' : 'Save Batch'}
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function TimeRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TimeParts;
  onChange: (next: TimeParts) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-[#758188]">
        {label} <span className="text-[#E03040]">*</span>
      </p>
      <div className="grid grid-cols-3 gap-2">
        <select
          className={formControlClass}
          value={value.hour}
          onChange={(e) => onChange({ ...value, hour: e.target.value })}
          aria-label={`${label} hour`}
        >
          <option value="" disabled>
            HH
          </option>
          {HOURS_12.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <select
          className={formControlClass}
          value={value.minute}
          onChange={(e) => onChange({ ...value, minute: e.target.value })}
          aria-label={`${label} minute`}
        >
          <option value="" disabled>
            MM
          </option>
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          className={formControlClass}
          value={value.period}
          onChange={(e) => onChange({ ...value, period: e.target.value as 'AM' | 'PM' })}
          aria-label={`${label} AM/PM`}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}

export default BatchesPage;
