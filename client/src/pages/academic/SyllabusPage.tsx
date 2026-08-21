import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookMarked,
  CheckCircle2,
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
  createTopic,
  deleteTopic,
  listTopics,
  updateTopic,
  type TopicDto,
} from '../../services/academicApi';

const canMutate = (role?: string) => role === 'admin' || role === 'coordinator';

const selectClass =
  'rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] px-3 py-2.5 text-sm text-[#1E2531] outline-none transition focus:border-[#E03040] focus:ring-2 focus:ring-[#E03040]/20';

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function SyllabusPage() {
  const { user } = useAuth();
  const mutate = canMutate(user?.role);
  const [topics, setTopics] = useState<TopicDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activity, setActivity] = useState<'' | 'active' | 'inactive'>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [addOpen, setAddOpen] = useState(false);
  const [editTopic, setEditTopic] = useState<TopicDto | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listTopics({
        search: search.trim() || undefined,
        activity: activity || undefined,
      });
      setTopics(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load syllabus');
    } finally {
      setLoading(false);
    }
  }, [search, activity]);

  useEffect(() => {
    setPage(1);
  }, [search, activity, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const total = topics.length;
    const active = topics.filter((t) => t.isActive).length;
    return { total, active, inactive: total - active };
  }, [topics]);

  const totalPages = Math.max(1, Math.ceil(topics.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = topics.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Syllabus"
        description="Manage syllabus topics linked to courses"
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total Topics" value={stats.total} hint="Syllabus catalog" icon={BookMarked} tone="warm" />
        <StatCard label="Active" value={stats.active} hint="Available for courses" icon={CheckCircle2} tone="green" />
        <StatCard label="Inactive" value={stats.inactive} hint="Hidden from selection" icon={XCircle} tone="red" />
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
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className={cn(selectClass, 'w-full sm:w-28')}
              aria-label="Rows per page"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B01828] px-4 py-2.5 text-sm font-semibold text-[#F8F8F8] hover:bg-[#800810]"
              >
                <Plus className="h-4 w-4" />
                Add Topic
              </button>
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
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[#758188]">
                    Loading syllabus…
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[#758188]">
                    No syllabus topics match your filters.
                  </td>
                </tr>
              ) : (
                pageItems.map((topic) => (
                  <tr key={topic._id} className="border-b border-[#E4DFE5]/80 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#1E2531]">{topic.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-[#758188]">
                        {topic.description || 'No description'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          topic.isActive
                            ? 'bg-[#61E092]/20 text-[#1E2531]'
                            : 'bg-[#E9EEF0] text-[#758188]',
                        )}
                      >
                        {topic.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#758188]">{formatDate(topic.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {mutate ? (
                          <>
                            <button
                              type="button"
                              className="rounded-lg p-2 text-[#758188] hover:bg-[#E9EEF0] hover:text-[#1E2531]"
                              aria-label={`Edit ${topic.title}`}
                              onClick={() => setEditTopic(topic)}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="rounded-lg p-2 text-[#758188] hover:bg-[#E03040]/10 hover:text-[#E03040]"
                              aria-label={`Delete ${topic.title}`}
                              onClick={() => {
                                if (!window.confirm(`Delete syllabus topic “${topic.title}”?`)) return;
                                void deleteTopic(topic._id)
                                  .then(load)
                                  .catch((e) =>
                                    setError(e instanceof Error ? e.message : 'Delete failed'),
                                  );
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-[#758188]">View only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E4DFE5] px-4 py-3">
          <p className="text-xs text-[#758188]">
            Showing{' '}
            {topics.length === 0 ? 0 : (pageSafe - 1) * pageSize + 1} to{' '}
            {Math.min(pageSafe * pageSize, topics.length)} of {topics.length} entries.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pageSafe <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-[#E4DFE5] px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#B01828] px-2 text-sm font-semibold text-[#F8F8F8]">
              {pageSafe}
            </span>
            <button
              type="button"
              disabled={pageSafe >= totalPages}
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
          <TopicFormDrawer
            open={addOpen}
            title="Add Topic"
            submitLabel="Create Topic"
            onClose={() => setAddOpen(false)}
            onSubmit={async (payload) => {
              await createTopic(payload);
              await load();
            }}
          />
          <TopicFormDrawer
            open={Boolean(editTopic)}
            title="Edit Topic"
            submitLabel="Save Topic"
            initial={editTopic}
            onClose={() => setEditTopic(null)}
            onSubmit={async (payload) => {
              if (!editTopic) return;
              await updateTopic(editTopic._id, payload);
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
  icon: typeof BookMarked;
  tone: 'green' | 'warm' | 'red';
}) {
  const toneClass =
    tone === 'green'
      ? 'bg-[#61E092]/15 text-[#1E2531]'
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

function TopicFormDrawer({
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
  initial?: TopicDto | null;
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    description: string;
    isActive: boolean;
  }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.title || '');
    setDescription(initial?.description || '');
    setIsActive(initial?.isActive ?? true);
    setError('');
    setSubmitting(false);
  }, [open, initial]);

  const submit = async () => {
    if (!name.trim()) {
      setError('Topic name is required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        title: name.trim(),
        description: description.trim(),
        isActive,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save topic');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title={title} onClose={onClose} busy={submitting} variant="drawer">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <FieldShell label="Topic Name" required>
            {({ id }) => (
              <input
                id={id}
                className={formControlClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter topic name..."
              />
            )}
          </FieldShell>

          <FieldShell label="Description">
            {({ id }) => (
              <textarea
                id={id}
                rows={5}
                className={formControlClass}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter syllabus description..."
              />
            )}
          </FieldShell>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E4DFE5] px-3 py-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span className="text-sm font-semibold text-[#1E2531]">Active (available for courses)</span>
          </label>

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

export default SyllabusPage;
