import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  GraduationCap,
  Minus,
  Plus,
  UserRound,
  Users,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import {
  createAttendanceSession,
  getAttendanceOverview,
  getAttendanceSession,
  listMyAttendance,
  saveAttendanceRecords,
  type AttendanceOverview,
  type AttendanceOverviewClass,
  type AttendanceSessionDto,
  type AttendanceStatus,
  type MyAttendanceRow,
} from '../../services/attendanceApi';
import { listBatches, listEnrollments, listStudents, type BatchDto } from '../../services/academicApi';

type StaffTab = 'overview' | 'ustad' | 'student' | 'coordinator';

function todayInputValue() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

function attendanceTone(percent: number) {
  if (percent >= 80) return 'text-[#61E092]';
  if (percent >= 50) return 'text-[#D4A017]';
  return 'text-[#E03040]';
}

export function AttendancePage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const canMark = user?.role === 'admin' || user?.role === 'coordinator' || user?.role === 'ustad';

  if (isStudent) return <StudentAttendanceView />;
  if (canMark) return <StaffAttendanceView />;
  return <p className="text-sm text-[#758188]">Attendance is not available for your role.</p>;
}

function StudentAttendanceView() {
  const [rows, setRows] = useState<MyAttendanceRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listMyAttendance()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Unable to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="My attendance" description="Your recorded attendance by session date" />
      {error ? <p className="text-sm text-[#E03040]">{error}</p> : null}
      <section className="overflow-hidden rounded-2xl border border-[#E4DFE5] bg-[#F8F8F8] shadow-soft">
        {loading ? (
          <p className="p-5 text-sm text-[#758188]">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-5 text-sm text-[#758188]">No attendance records yet.</p>
        ) : (
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#E4DFE5] bg-[#B01828] text-xs uppercase tracking-wide text-[#F8F8F8]">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.record._id} className="border-b border-[#E4DFE5]/80">
                  <td className="px-4 py-3 font-medium text-[#1E2531]">{row.sessionDate}</td>
                  <td className="px-4 py-3 capitalize text-[#758188]">{row.record.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function StaffAttendanceView() {
  const [tab, setTab] = useState<StaffTab>('overview');
  const [date, setDate] = useState(todayInputValue);
  const [batchId, setBatchId] = useState('');
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [overview, setOverview] = useState<AttendanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeClass, setActiveClass] = useState<AttendanceOverviewClass | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ov, batchResult] = await Promise.all([
        getAttendanceOverview({ date, batchId: batchId || undefined }),
        listBatches({ limit: 100 }),
      ]);
      setOverview(ov);
      setBatches(batchResult.batches);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load attendance');
    } finally {
      setLoading(false);
    }
  }, [date, batchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = overview?.stats || {
    totalClasses: 0,
    conducted: 0,
    cancelled: 0,
    successRate: 0,
    avgStudentAttendance: 0,
  };

  const classes = overview?.classes || [];

  const ustadRows = useMemo(() => {
    const map = new Map<
      string,
      { name: string; classes: number; present: number; avgAttendance: number }
    >();
    for (const row of classes) {
      const key = row.ustadName;
      const cur = map.get(key) || { name: key, classes: 0, present: 0, avgAttendance: 0 };
      cur.classes += 1;
      if (row.ustadPresent) cur.present += 1;
      cur.avgAttendance += row.attendancePercent;
      map.set(key, cur);
    }
    return [...map.values()].map((r) => ({
      ...r,
      avgAttendance: r.classes > 0 ? Math.round(r.avgAttendance / r.classes) : 0,
    }));
  }, [classes]);

  const exportCsv = () => {
    const rows = [
      ['Date & Time', 'Batch', 'Course', 'Ustad', 'Hours', 'Present', 'Total', 'Attendance %', 'Status'],
      ...classes.map((c) => [
        formatDateTime(c.occurredAt),
        c.batchName,
        c.courseTitle,
        c.ustadName,
        c.hoursLabel,
        String(c.presentCount),
        String(c.totalStudents),
        String(c.attendancePercent),
        c.status,
      ]),
    ];
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          title="Attendance Management"
          description="Track and manage Ustad and Student attendance"
          className="mb-0"
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative inline-flex items-center">
            <CalendarDays className="pointer-events-none absolute left-3 h-4 w-4 text-[#758188]" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-[#E4DFE5] bg-white py-2.5 pl-9 pr-3 text-sm text-[#1E2531] outline-none focus:border-[#E03040] focus:ring-2 focus:ring-[#E03040]/20"
              aria-label="Attendance date"
            />
          </label>
          <select
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="rounded-xl border border-[#E4DFE5] bg-white px-3 py-2.5 text-sm text-[#1E2531] outline-none focus:border-[#E03040] focus:ring-2 focus:ring-[#E03040]/20"
            aria-label="Filter batches"
          >
            <option value="">All batches</option>
            {batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabPill
          active={tab === 'overview'}
          icon={CalendarDays}
          label="Overview"
          onClick={() => setTab('overview')}
        />
        <TabPill
          active={tab === 'ustad'}
          icon={UserRound}
          label="Ustad"
          onClick={() => setTab('ustad')}
        />
        <TabPill
          active={tab === 'student'}
          icon={GraduationCap}
          label="Student"
          onClick={() => setTab('student')}
        />
        <TabPill
          active={tab === 'coordinator'}
          icon={Users}
          label="Coordinator"
          badge="SOON"
          onClick={() => setTab('coordinator')}
        />
      </div>

      <div className="rounded-xl border border-[#E4DFE5] bg-[#E9EEF0]/70 px-4 py-3 text-sm text-[#758188]">
        Attendance sources: Present may come from student Join in the portal, or from an ustad
        marking manually. Open a session&apos;s details to see the source badge on each student.
      </div>

      {error ? <p className="text-sm text-[#E03040]">{error}</p> : null}

      {tab === 'overview' || tab === 'student' ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Classes"
              value={stats.totalClasses}
              hint="Today"
              icon={CalendarDays}
              tone="green"
            />
            <StatCard
              label="Conducted"
              value={stats.conducted}
              hint={`${stats.successRate}% success rate`}
              icon={CheckCircle2}
              tone="green"
            />
            <StatCard
              label="Cancelled"
              value={stats.cancelled}
              hint="Due to absences"
              icon={XCircle}
              tone="red"
            />
            <StatCard
              label="Avg Student Attendance"
              value={`${stats.avgStudentAttendance}%`}
              hint="Across all classes"
              icon={Users}
              tone="neutral"
            />
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#E4DFE5] bg-white shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4DFE5] px-4 py-3.5 sm:px-5">
              <h2 className="text-base font-bold text-[#1E2531]">Class attendance records</h2>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#B01828] px-3 py-2 text-sm font-semibold text-[#B01828] hover:bg-[#B01828]/5"
                >
                  <Plus className="h-4 w-4" />
                  New session
                </button>
                <button
                  type="button"
                  onClick={exportCsv}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E4DFE5] bg-white px-3 py-2 text-sm font-semibold text-[#1E2531] hover:bg-[#F8F8F8]"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#B01828] text-xs font-semibold uppercase tracking-wide text-[#F8F8F8]">
                  <tr>
                    <th className="px-4 py-3.5">Date & Time</th>
                    <th className="px-4 py-3.5">Batch</th>
                    <th className="px-4 py-3.5">Ustad</th>
                    <th className="px-4 py-3.5">Hours</th>
                    <th className="px-4 py-3.5">Student Attendance</th>
                    <th className="px-4 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-[#758188]">
                        Loading attendance…
                      </td>
                    </tr>
                  ) : classes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-[#758188]">
                        No class attendance records for this date.
                      </td>
                    </tr>
                  ) : (
                    classes.map((row) => (
                      <tr
                        key={row._id}
                        className="border-b border-[#E9EEF0] bg-white last:border-0 hover:bg-[#F8F8F8]/80"
                      >
                        <td className="whitespace-nowrap px-4 py-3.5 text-[#1E2531]">
                          {formatDateTime(row.occurredAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-[#1E2531]">{row.batchName}</p>
                          <p className="text-xs text-[#758188]">{row.courseTitle}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-[#1E2531]">{row.ustadName}</p>
                          <p
                            className={cn(
                              'mt-0.5 inline-flex items-center gap-1 text-xs font-semibold',
                              row.ustadPresent ? 'text-[#61E092]' : 'text-[#E03040]',
                            )}
                          >
                            {row.ustadPresent ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5" />
                            )}
                            {row.ustadPresent ? 'Present' : 'Absent'}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-[#758188]">
                          <p>{row.hoursLabel}</p>
                          <p className="text-xs">{row.hoursPercent}% completed</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-[#1E2531]">
                            {row.presentCount}/{row.totalStudents} students
                          </p>
                          <p
                            className={cn(
                              'text-xs font-semibold',
                              attendanceTone(row.attendancePercent),
                            )}
                          >
                            {row.attendancePercent}% attendance
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4DFE5] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E2531] hover:bg-[#F8F8F8]"
                            onClick={() => {
                              setActiveClass(row);
                              setDetailOpen(true);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      {tab === 'ustad' ? (
        <section className="overflow-hidden rounded-2xl border border-[#E4DFE5] bg-white shadow-soft">
          <div className="border-b border-[#E4DFE5] px-4 py-3.5 sm:px-5">
            <h2 className="text-base font-bold text-[#1E2531]">Ustad attendance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#B01828] text-xs uppercase tracking-wide text-[#F8F8F8]">
                <tr>
                  <th className="px-4 py-3">Ustad</th>
                  <th className="px-4 py-3">Classes</th>
                  <th className="px-4 py-3">Present</th>
                  <th className="px-4 py-3">Avg student attendance</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-[#758188]">
                      Loading…
                    </td>
                  </tr>
                ) : ustadRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-[#758188]">
                      No ustad attendance for this date.
                    </td>
                  </tr>
                ) : (
                  ustadRows.map((row) => (
                    <tr key={row.name} className="border-b border-[#E4DFE5]/80">
                      <td className="px-4 py-3 font-semibold text-[#1E2531]">{row.name}</td>
                      <td className="px-4 py-3 text-[#758188]">{row.classes}</td>
                      <td className="px-4 py-3 text-[#758188]">
                        {row.present}/{row.classes}
                      </td>
                      <td className={cn('px-4 py-3 font-semibold', attendanceTone(row.avgAttendance))}>
                        {row.avgAttendance}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === 'coordinator' ? (
        <section className="rounded-2xl border border-[#E4DFE5] bg-[#F8F8F8] px-6 py-16 text-center shadow-soft">
          <Users className="mx-auto h-12 w-12 text-[#E4DFE5]" />
          <p className="mt-4 text-sm font-semibold text-[#1E2531]">Coordinator attendance</p>
          <p className="mt-1 text-sm text-[#758188]">Coming soon.</p>
        </section>
      ) : null}

      <SessionDetailDrawer
        open={detailOpen}
        classRow={activeClass}
        onClose={() => {
          setDetailOpen(false);
          setActiveClass(null);
        }}
        onSaved={() => void load()}
      />

      <CreateSessionModal
        open={createOpen}
        batches={batches}
        defaultDate={date}
        onClose={() => setCreateOpen(false)}
        onCreated={async () => {
          setCreateOpen(false);
          await load();
        }}
      />
    </div>
  );
}

function TabPill({
  active,
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
        active
          ? 'bg-[#B01828] text-[#F8F8F8] shadow-soft'
          : 'bg-transparent text-[#758188] hover:bg-[#E9EEF0] hover:text-[#1E2531]',
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
      {badge ? (
        <span className="rounded-md bg-[#E9EEF0] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#758188]">
          {badge}
        </span>
      ) : null}
    </button>
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
  icon: typeof CalendarDays;
  tone: 'green' | 'red' | 'neutral';
}) {
  const toneClass =
    tone === 'green'
      ? 'bg-[#61E092]/15 text-[#61E092]'
      : tone === 'red'
        ? 'bg-[#E03040]/10 text-[#E03040]'
        : 'bg-[#E9EEF0] text-[#758188]';
  return (
    <article className="rounded-2xl border border-[#E4DFE5] bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#758188]">{label}</p>
          <p className="mt-1 text-3xl font-bold text-[#1E2531]">{value}</p>
          <p className="mt-1 text-xs text-[#758188]">{hint}</p>
        </div>
        <span className={cn('rounded-xl p-2.5', toneClass)}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
    </article>
  );
}

function CreateSessionModal({
  open,
  batches,
  defaultDate,
  onClose,
  onCreated,
}: {
  open: boolean;
  batches: BatchDto[];
  defaultDate: string;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [batchId, setBatchId] = useState('');
  const [sessionDate, setSessionDate] = useState(defaultDate);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBatchId(batches[0]?._id || '');
    setSessionDate(defaultDate);
    setError('');
    setBusy(false);
  }, [open, batches, defaultDate]);

  return (
    <Modal open={open} title="New attendance session" onClose={onClose} busy={busy}>
      <div className="space-y-4 p-5">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-[#758188]">Batch</span>
          <select
            className={inputClass}
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
          >
            {batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-[#758188]">Date</span>
          <input
            type="date"
            className={inputClass}
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-[#E03040]">{error}</p> : null}
        <button
          type="button"
          disabled={!batchId || busy}
          className="w-full rounded-xl bg-[#B01828] py-3 text-sm font-semibold text-[#F8F8F8] hover:bg-[#800810] disabled:opacity-50"
          onClick={() => {
            setBusy(true);
            setError('');
            void createAttendanceSession({ batchId, sessionDate })
              .then(onCreated)
              .catch((e) => setError(e instanceof Error ? e.message : 'Create failed'))
              .finally(() => setBusy(false));
          }}
        >
          {busy ? 'Creating…' : 'Create session'}
        </button>
      </div>
    </Modal>
  );
}

function SessionDetailDrawer({
  open,
  classRow,
  onClose,
  onSaved,
}: {
  open: boolean;
  classRow: AttendanceOverviewClass | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [session, setSession] = useState<AttendanceSessionDto | null>(null);
  const [students, setStudents] = useState<Array<{ _id: string; name: string; email: string }>>([]);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [sources, setSources] = useState<Record<string, 'join' | 'manual' | null>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!classRow) return;
    setLoading(true);
    setError('');
    try {
      const [detail, allStudents, enrollments] = await Promise.all([
        getAttendanceSession(classRow._id),
        listStudents(),
        listEnrollments({ courseId: classRow.courseId }),
      ]);
      setSession(detail);
      const ids = enrollments
        .filter((e) => e.status === 'active')
        .filter((e) => !e.batchId || e.batchId === classRow.batchId)
        .map((e) => e.studentId);
      const roster = allStudents
        .filter((s) => ids.includes(s._id))
        .sort((a, b) => a.name.localeCompare(b.name));
      setStudents(roster);
      const nextMarks: Record<string, AttendanceStatus> = {};
      const nextSources: Record<string, 'join' | 'manual' | null> = {};
      for (const sid of ids) {
        nextMarks[sid] = 'absent';
        nextSources[sid] = null;
      }
      for (const rec of detail.records ?? []) {
        nextMarks[rec.studentId] = rec.status;
        nextSources[rec.studentId] =
          rec.markedBy && rec.markedBy === rec.studentId ? 'join' : 'manual';
      }
      setMarks(nextMarks);
      setSources(nextSources);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to open session');
    } finally {
      setLoading(false);
    }
  }, [classRow]);

  useEffect(() => {
    if (!open || !classRow) return;
    void loadDetail();
  }, [open, classRow, loadDetail]);

  const presentCount = students.filter((s) => {
    const st = marks[s._id];
    return st === 'present' || st === 'late';
  }).length;
  const totalStudents = students.length || classRow?.totalStudents || 0;
  const attendancePercent =
    totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
  const planned = classRow?.plannedHours ?? session?.plannedHours ?? 2;
  const completed =
    classRow?.status === 'cancelled'
      ? 0
      : (classRow?.completedHours ?? session?.completedHours ?? planned);
  const hoursPercent = planned > 0 ? Math.round((completed / planned) * 100) : 0;

  const setStudentStatus = async (studentId: string, status: AttendanceStatus) => {
    if (!session) return;
    const previous = marks[studentId];
    const nextMarks = { ...marks, [studentId]: status };
    setMarks(nextMarks);
    setSources((prev) => ({ ...prev, [studentId]: 'manual' }));
    setBusy(true);
    setError('');
    try {
      await saveAttendanceRecords(
        session._id,
        students.map((s) => ({
          studentId: s._id,
          status: nextMarks[s._id] ?? 'absent',
        })),
      );
      onSaved();
    } catch (e) {
      setMarks((prev) => ({ ...prev, [studentId]: previous }));
      setError(e instanceof Error ? e.message : 'Unable to update attendance');
    } finally {
      setBusy(false);
    }
  };

  const dateLabel = classRow
    ? new Date(classRow.occurredAt).toLocaleDateString('en-US')
    : '—';
  const timeLabel = classRow
    ? new Date(classRow.occurredAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
    : '—';

  return (
    <Modal open={open} title="Attendance details" onClose={onClose} busy={busy} variant="drawer">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {error ? <p className="text-sm text-[#E03040]">{error}</p> : null}

          {classRow ? (
            <div className="grid grid-cols-2 gap-4 border-b border-[#E4DFE5] pb-4">
              <div>
                <p className="text-xs text-[#758188]">Date &amp; Time</p>
                <p className="mt-1 text-sm font-bold text-[#1E2531]">{dateLabel}</p>
                <p className="text-xs text-[#758188]">{timeLabel}</p>
              </div>
              <div>
                <p className="text-xs text-[#758188]">Batch</p>
                <p className="mt-1 text-sm font-bold text-[#1E2531]">{classRow.batchName}</p>
                <p className="text-xs text-[#758188]">{classRow.courseTitle}</p>
              </div>
            </div>
          ) : null}

          <div className="border-b border-[#E4DFE5] pb-4">
            <p className="mb-2 text-sm font-semibold text-[#758188]">Ustad Attendance</p>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-[#E9EEF0]/70 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-[#1E2531]">{classRow?.ustadName || '—'}</p>
                <p
                  className={cn(
                    'mt-1 inline-flex items-center gap-1 text-xs font-semibold',
                    classRow?.ustadPresent ? 'text-[#61E092]' : 'text-[#E03040]',
                  )}
                >
                  {classRow?.ustadPresent ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {classRow?.ustadPresent ? 'Present' : 'Absent'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#1E2531]">
                  {completed}/{planned} hours
                </p>
                <p className="text-xs text-[#758188]">{hoursPercent}% completed</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-[#758188]">
              Student Attendance ({presentCount}/{totalStudents})
            </p>
            <p className="mt-1 text-xs text-[#758188]">
              Source shows how present was recorded (Join click vs ustad manual).
            </p>

            <div className="mt-3 space-y-2">
              {loading ? (
                <p className="py-8 text-center text-sm text-[#758188]">Loading students…</p>
              ) : students.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#758188]">
                  No enrolled students for this batch.
                </p>
              ) : (
                students.map((s) => {
                  const status = marks[s._id] ?? 'absent';
                  const isPresent = status === 'present' || status === 'late';
                  const source = sources[s._id];
                  return (
                    <div
                      key={s._id}
                      className="flex items-center gap-3 rounded-xl bg-[#E9EEF0]/60 px-3 py-3"
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                          isPresent ? 'bg-[#61E092]/20 text-[#61E092]' : 'bg-[#E03040]/15 text-[#E03040]',
                        )}
                      >
                        {isPresent ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#1E2531]">{s.name}</p>
                        <p
                          className={cn(
                            'text-xs font-semibold',
                            isPresent ? 'text-[#61E092]' : 'text-[#E03040]',
                          )}
                        >
                          {isPresent ? 'Present' : 'Absent'}
                          {isPresent && source ? (
                            <span className="ml-2 font-normal text-[#758188]">
                              · {source === 'join' ? 'Join click' : 'Ustad manual'}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      {isPresent ? (
                        <button
                          type="button"
                          disabled={busy}
                          aria-label={`Mark ${s.name} absent`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E4DFE5] bg-white text-[#758188] hover:border-[#E03040] hover:text-[#E03040] disabled:opacity-50"
                          onClick={() => void setStudentStatus(s._id, 'absent')}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          aria-label={`Mark ${s.name} present`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E4DFE5] bg-white text-[#758188] hover:border-[#61E092] hover:text-[#61E092] disabled:opacity-50"
                          onClick={() => void setStudentStatus(s._id, 'present')}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#E4DFE5] bg-[#F8F8F8] px-5 py-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-[#61E092]/15 px-3 py-3 text-center">
              <p className="text-lg font-bold text-[#2F9E5F]">{attendancePercent}%</p>
              <p className="mt-0.5 text-[11px] font-medium text-[#758188]">Student Attendance</p>
            </div>
            <div className="rounded-xl bg-[#3B82F6]/10 px-3 py-3 text-center">
              <p className="text-lg font-bold text-[#2563EB]">{completed}h</p>
              <p className="mt-0.5 text-[11px] font-medium text-[#758188]">Hours Conducted</p>
            </div>
            <div className="rounded-xl bg-[#8B5CF6]/10 px-3 py-3 text-center">
              <p className="text-lg font-bold text-[#7C3AED]">{presentCount}</p>
              <p className="mt-0.5 text-[11px] font-medium text-[#758188]">Students Present</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

const inputClass =
  'w-full rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] px-3 py-2.5 text-sm outline-none focus:border-[#E03040]';

export default AttendancePage;
