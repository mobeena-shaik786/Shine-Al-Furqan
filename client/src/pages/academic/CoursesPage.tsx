import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Download,
  Eye,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { FieldShell, formControlClass } from '../../components/ui/FormField';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import {
  createCourse,
  deleteCourse,
  listCourses,
  listTopics,
  updateCourse,
  type CourseDto,
  type CourseListMeta,
  type TopicDto,
} from '../../services/academicApi';

const canMutate = (role?: string) => role === 'admin' || role === 'coordinator';

const emptyStats = { total: 0, active: 0, inactive: 0, totalTopics: 0 };

const selectClass =
  'rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] px-3 py-2.5 text-sm text-[#1E2531] outline-none transition focus:border-[#E03040] focus:ring-2 focus:ring-[#E03040]/20';

function isActiveStatus(status: CourseDto['status']) {
  return status === 'published';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function CoursesPage() {
  const { user } = useAuth();
  const mutate = canMutate(user?.role);
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [meta, setMeta] = useState<CourseListMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    stats: emptyStats,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activity, setActivity] = useState<'' | 'active' | 'inactive'>('');
  const [sort, setSort] = useState<'-createdAt' | 'createdAt' | 'title' | '-title'>('-createdAt');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<CourseDto | null>(null);

  const stats = meta.stats || emptyStats;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listCourses({
        search: search.trim() || undefined,
        activity: activity || undefined,
        sort,
        page,
        limit: pageSize,
      });
      setCourses(result.courses);
      setMeta(result.meta);
      setSelected((prev) => prev.filter((id) => result.courses.some((c) => c._id === id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load courses');
    } finally {
      setLoading(false);
    }
  }, [search, activity, sort, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, activity, sort, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const allSelected = courses.length > 0 && selected.length === courses.length;

  const exportCsv = () => {
    const rows = [
      ['Course', 'Description', 'Topics', 'Status', 'Created'],
      ...courses.map((c) => [
        c.title,
        c.description.replace(/\n/g, ' '),
        String(c.topicCount ?? c.topics?.length ?? 0),
        isActiveStatus(c.status) ? 'Active' : 'Inactive',
        formatDate(c.createdAt),
      ]),
    ];
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'courses.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Course Master"
        description={
          user?.role === 'student'
            ? 'Your enrolled courses and learning progress'
            : 'Manage courses and their topics'
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Courses" value={stats.total} hint="All courses" icon={BookOpen} tone="warm" />
        <StatCard label="Active Courses" value={stats.active} hint="Currently active" icon={CheckCircle2} tone="green" />
        <StatCard label="Total Topics" value={stats.totalTopics} hint="Across courses" icon={Layers} tone="blue" />
        <StatCard label="Inactive Courses" value={stats.inactive} hint="Currently inactive" icon={XCircle} tone="red" />
      </section>

      <section className="rounded-2xl border border-[#E4DFE5] bg-[#F8F8F8] p-4 shadow-soft sm:p-5">
        <p className="mb-3 text-sm font-semibold text-[#1E2531]">Filters</p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:max-w-md">
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value as '' | 'active' | 'inactive')}
              className={selectClass}
              aria-label="Select status"
            >
              <option value="">Select Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className={selectClass}
              aria-label="Sort by"
            >
              <option value="-createdAt">Newest first</option>
              <option value="createdAt">Oldest first</option>
              <option value="title">Name A–Z</option>
              <option value="-title">Name Z–A</option>
            </select>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#758188]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or description.."
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
                  Add Course
                </button>
              </>
            ) : null}
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-[#E03040]">{error}</p> : null}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#E4DFE5] bg-[#F8F8F8] shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#E4DFE5] bg-[#E9EEF0]/50 text-xs uppercase tracking-wide text-[#758188]">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() =>
                      setSelected(allSelected ? [] : courses.map((c) => c._id))
                    }
                    aria-label="Select all courses"
                  />
                </th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Topics</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#758188]">
                    Loading courses…
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#758188]">
                    {user?.role === 'student'
                      ? 'You are not enrolled in any courses yet.'
                      : 'No courses match your filters.'}
                  </td>
                </tr>
              ) : (
                courses.map((course) => {
                  const active = isActiveStatus(course.status);
                  return (
                    <tr key={course._id} className="border-b border-[#E4DFE5]/80 last:border-0">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(course._id)}
                          onChange={() =>
                            setSelected((prev) =>
                              prev.includes(course._id)
                                ? prev.filter((id) => id !== course._id)
                                : [...prev, course._id],
                            )
                          }
                          aria-label={`Select ${course.title}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#1E2531]">{course.title}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-[#758188]">
                          {course.description || 'No description'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-[#1E2531]">
                        {course.topicCount ?? course.topics?.length ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            active
                              ? 'bg-[#61E092]/20 text-[#1E2531]'
                              : 'bg-[#E9EEF0] text-[#758188]',
                          )}
                        >
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#758188]">{formatDate(course.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/courses/${course._id}`}
                            className="rounded-lg p-2 text-[#758188] hover:bg-[#E9EEF0] hover:text-[#1E2531]"
                            aria-label={`View ${course.title}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {mutate ? (
                            <>
                              <button
                                type="button"
                                className="rounded-lg p-2 text-[#758188] hover:bg-[#E9EEF0] hover:text-[#1E2531]"
                                aria-label={`Edit ${course.title}`}
                                onClick={() => setEditCourse(course)}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="rounded-lg p-2 text-[#758188] hover:bg-[#E03040]/10 hover:text-[#E03040]"
                                aria-label={`Delete ${course.title}`}
                                onClick={() => {
                                  if (!window.confirm(`Delete course “${course.title}”?`)) return;
                                  void deleteCourse(course._id)
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
            Showing{' '}
            {meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1} to{' '}
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
          <CourseFormDrawer
            open={addOpen}
            title="Add Course"
            submitLabel="Create Course"
            onClose={() => setAddOpen(false)}
            onSubmit={async (payload) => {
              await createCourse({
                title: payload.title,
                description: payload.description,
                topicIds: payload.topicIds,
                status: 'published',
              });
              setPage(1);
              await load();
            }}
          />
          <CourseFormDrawer
            open={Boolean(editCourse)}
            title="Edit Course"
            submitLabel="Save Course"
            initial={editCourse}
            onClose={() => setEditCourse(null)}
            onSubmit={async (payload) => {
              if (!editCourse) return;
              await updateCourse(editCourse._id, {
                title: payload.title,
                description: payload.description,
                topicIds: payload.topicIds,
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
  value: number;
  hint: string;
  icon: typeof BookOpen;
  tone: 'green' | 'blue' | 'warm' | 'red';
}) {
  const toneClass =
    tone === 'green'
      ? 'bg-[#61E092]/15 text-[#1E2531]'
      : tone === 'blue'
        ? 'bg-[#E9EEF0] text-[#B01828]'
        : tone === 'warm'
          ? 'bg-[#B77E5E]/15 text-[#B77E5E]'
          : 'bg-[#E03040]/10 text-[#E03040]';
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

function CourseFormDrawer({
  open,
  title,
  submitLabel,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  submitLabel: string;
  initial?: CourseDto | null;
  onClose: () => void;
  onSubmit: (payload: { title: string; description: string; topicIds: string[] }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [topics, setTopics] = useState<TopicDto[]>([]);
  const [topicSearch, setTopicSearch] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.title || '');
    setDescription(initial?.description || '');
    setTopicIds(initial?.topics || []);
    setTopicSearch('');
    setError('');
    setSubmitting(false);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    setLoadingTopics(true);
    void listTopics({ activeOnly: true })
      .then(setTopics)
      .catch(() => setTopics([]))
      .finally(() => setLoadingTopics(false));
  }, [open]);

  const filteredTopics = useMemo(() => {
    const q = topicSearch.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter(
      (t) =>
        t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
    );
  }, [topics, topicSearch]);

  const submit = async () => {
    if (!name.trim()) {
      setError('Course name is required');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (topicIds.length === 0) {
      setError('Select at least one topic');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        title: name.trim(),
        description: description.trim(),
        topicIds,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save course');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title={title} onClose={onClose} busy={submitting} variant="drawer">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <FieldShell label="Course Name" required>
            {({ id }) => (
              <input
                id={id}
                className={formControlClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter course name..."
              />
            )}
          </FieldShell>

          <FieldShell label="Description" required>
            {({ id }) => (
              <textarea
                id={id}
                rows={4}
                className={formControlClass}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter course description..."
              />
            )}
          </FieldShell>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[#758188]">
              Topics <span className="text-[#E03040]">*</span>
            </p>
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#758188]" />
              <input
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                placeholder="Search topics..."
                className="w-full rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#E03040] focus:ring-2 focus:ring-[#E03040]/20"
              />
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-[#E4DFE5] p-2 scrollbar-thin">
              {loadingTopics ? (
                <p className="px-2 py-4 text-sm text-[#758188]">Loading topics…</p>
              ) : filteredTopics.length === 0 ? (
                <p className="px-2 py-4 text-sm text-[#758188]">No topics found.</p>
              ) : (
                filteredTopics.map((topic) => {
                  const checked = topicIds.includes(topic._id);
                  return (
                    <label
                      key={topic._id}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] px-3 py-3 hover:border-[#E03040]/40"
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={checked}
                        onChange={() =>
                          setTopicIds((prev) =>
                            checked ? prev.filter((id) => id !== topic._id) : [...prev, topic._id],
                          )
                        }
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#1E2531]">{topic.title}</span>
                        <span className="mt-0.5 block line-clamp-2 text-xs text-[#758188]">
                          {topic.description || 'No description'}
                        </span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {error ? <p className="text-sm text-[#E03040]">{error}</p> : null}
        </div>

        <div className="shrink-0 border-t border-[#E4DFE5] px-5 py-4">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit()}
            className="w-full rounded-xl bg-[#B01828] py-3 text-sm font-semibold text-[#F8F8F8] hover:bg-[#800810] disabled:opacity-60"
          >
            {submitting ? 'Saving…' : submitLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default CoursesPage;
