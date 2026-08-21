import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Download,
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  UserPlus,
  UserX,
  Users,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { Modal } from '../../components/ui/Modal';
import { FieldShell, formControlClass } from '../../components/ui/FormField';
import { cn } from '../../lib/utils';
import { splitName } from '../../types/auth';
import {
  createLead,
  deleteLead,
  listLeads,
  updateLead,
  type LeadDto,
  type LeadGender,
  type LeadListMeta,
  type LeadPayload,
  type LeadSource,
  type LeadStatus,
} from '../../services/leadsApi';

const emptyMeta: LeadListMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  stats: {
    total: 0,
    new: 0,
    follow_up: 0,
    interested: 0,
    enrolled: 0,
    not_interested: 0,
    interestedAndEnrolled: 0,
  },
};

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'New',
  follow_up: 'Follow Up',
  interested: 'Interested',
  enrolled: 'Enrolled',
  not_interested: 'Not Interested',
};

const SOURCE_LABEL: Record<LeadSource, string> = {
  whatsapp: 'WhatsApp',
  website: 'Website',
  referral: 'Referral',
  walk_in: 'Walk-in',
  social: 'Social',
  other: 'Other',
};

const selectClass =
  'rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] px-3 py-2.5 text-sm text-[#1E2531] outline-none transition focus:border-[#E03040] focus:ring-2 focus:ring-[#E03040]/20';

function statusBadgeClass(status: LeadStatus) {
  switch (status) {
    case 'enrolled':
      return 'bg-[#61E092]/20 text-[#1E2531]';
    case 'new':
      return 'bg-[#E9EEF0] text-[#B01828]';
    case 'follow_up':
      return 'bg-[#B77E5E]/15 text-[#B77E5E]';
    case 'interested':
      return 'bg-[#61E092]/15 text-[#1E2531]';
    case 'not_interested':
      return 'bg-[#E03040]/10 text-[#E03040]';
    default:
      return 'bg-[#E9EEF0] text-[#758188]';
  }
}

export function LeadManagementPage() {
  const [leads, setLeads] = useState<LeadDto[]>([]);
  const [meta, setMeta] = useState<LeadListMeta>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [gender, setGender] = useState('');
  const [source, setSource] = useState('');
  const [language, setLanguage] = useState('');
  const [assignment, setAssignment] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editLead, setEditLead] = useState<LeadDto | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listLeads({
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        status: (status || undefined) as LeadStatus | undefined,
        gender: (gender || undefined) as LeadGender | undefined,
        source: (source || undefined) as LeadSource | undefined,
        language: language.trim() || undefined,
        assignment: assignment.trim() || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setLeads(result.leads);
      setMeta(result.meta);
      setSelected([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load leads');
      setLeads([]);
      setMeta(emptyMeta);
    } finally {
      setLoading(false);
    }
  }, [assignment, from, gender, language, page, pageSize, search, source, status, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const allSelected = leads.length > 0 && selected.length === leads.length;

  const toggleAll = () => {
    setSelected(allSelected ? [] : leads.map((l) => l._id));
  };

  const handleExport = () => {
    const header = ['Name', 'Phone', 'Gender', 'Source', 'Status', 'Assignment', 'Created'];
    const lines = leads.map((row) =>
      [
        row.name,
        row.phone,
        row.gender || '',
        row.source,
        row.status,
        row.assignment,
        row.createdAt.slice(0, 10),
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(','),
    );
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (lead: LeadDto) => {
    if (!window.confirm(`Delete lead ${lead.name}?`)) return;
    try {
      await deleteLead(lead._id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete lead');
    }
  };

  const stats = useMemo(
    () => [
      {
        label: 'Total Leads',
        value: meta.stats.total,
        hint: 'All leads',
        icon: Users,
        tone: 'green' as const,
      },
      {
        label: 'New Leads',
        value: meta.stats.new,
        hint: 'Awaiting contact',
        icon: UserPlus,
        tone: 'blue' as const,
      },
      {
        label: 'Follow Up',
        value: meta.stats.follow_up,
        hint: 'Needs follow-up',
        icon: Clock3,
        tone: 'warm' as const,
      },
      {
        label: 'Interested & Enrolled',
        value: meta.stats.interestedAndEnrolled,
        hint: 'Ready to enroll / converted',
        icon: TrendingUp,
        tone: 'green' as const,
      },
      {
        label: 'Not Interested',
        value: meta.stats.not_interested,
        hint: 'Declined / closed',
        icon: UserX,
        tone: 'red' as const,
      },
    ],
    [meta.stats],
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Lead Management"
        description="Manage and track all your leads"
        actions={
          <>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] px-3 py-2 text-sm font-semibold text-[#1E2531] hover:bg-[#E9EEF0]"
              onClick={() => {
                setStatus('follow_up');
                setPage(1);
              }}
            >
              <Clock3 className="h-4 w-4" aria-hidden />
              Follow-ups
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-[#B01828] px-3 py-2 text-sm font-semibold text-[#F8F8F8] hover:bg-[#800810]"
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              Overview
            </button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="space-y-4 border-b border-[#E9EEF0] p-4 sm:p-5">
          <h2 className="text-sm font-bold text-[#1E2531]">Filters</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select
              className={selectClass}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              aria-label="Select status"
            >
              <option value="">Select Status</option>
              {(Object.keys(STATUS_LABEL) as LeadStatus[]).map((key) => (
                <option key={key} value={key}>
                  {STATUS_LABEL[key]}
                </option>
              ))}
            </select>
            <select
              className={selectClass}
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                setPage(1);
              }}
              aria-label="Select gender"
            >
              <option value="">Select Gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="prefer_not">Prefer not to say</option>
            </select>
            <select
              className={selectClass}
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setPage(1);
              }}
              aria-label="Select source"
            >
              <option value="">Select Source</option>
              {(Object.keys(SOURCE_LABEL) as LeadSource[]).map((key) => (
                <option key={key} value={key}>
                  {SOURCE_LABEL[key]}
                </option>
              ))}
            </select>
            <select
              className={selectClass}
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setPage(1);
              }}
              aria-label="Select language"
            >
              <option value="">Select Language</option>
              <option value="English">English</option>
              <option value="Urdu">Urdu</option>
              <option value="Hindi">Hindi</option>
              <option value="Tamil">Tamil</option>
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <select
              className={selectClass}
              value={assignment}
              onChange={(e) => {
                setAssignment(e.target.value);
                setPage(1);
              }}
              aria-label="Select assignment"
            >
              <option value="">Select Assignment</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
            <input
              type="date"
              className={selectClass}
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              aria-label="From date"
            />
            <input
              type="date"
              className={selectClass}
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              aria-label="To date"
            />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <select
              className={cn(selectClass, 'w-20')}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Entries per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              <div className="relative w-full sm:w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#758188]" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search name, email, phone…"
                  className="w-full rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] py-2.5 pl-10 pr-3 text-sm text-[#1E2531] outline-none transition placeholder:text-[#758188] focus:border-[#E03040] focus:ring-2 focus:ring-[#E03040]/20"
                />
              </div>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#B01828] bg-[#F8F8F8] px-4 py-2.5 text-sm font-semibold text-[#B01828] hover:bg-[#B01828]/10"
              >
                <Download className="h-4 w-4" aria-hidden />
                Export
              </button>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B01828] px-4 py-2.5 text-sm font-semibold text-[#F8F8F8] shadow-soft hover:bg-[#800810]"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add Lead
              </button>
            </div>
          </div>
          {error ? <p className="text-sm text-[#E03040]">{error}</p> : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#E9EEF0] bg-[#F8F8F8]/80 text-xs font-semibold uppercase tracking-wide text-[#758188]">
                <th className="px-4 py-3 sm:px-5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all leads"
                  />
                </th>
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assignment</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right sm:px-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-sm text-[#758188]">
                    Loading leads…
                  </td>
                </tr>
              ) : (
                leads.map((row) => {
                  const { firstName, lastName } = splitName(row.name);
                  return (
                    <tr
                      key={row._id}
                      className="border-b border-[#E9EEF0] last:border-0 hover:bg-[#F8F8F8]/60"
                    >
                      <td className="px-4 py-3.5 sm:px-5">
                        <input
                          type="checkbox"
                          checked={selected.includes(row._id)}
                          onChange={() =>
                            setSelected((prev) =>
                              prev.includes(row._id)
                                ? prev.filter((id) => id !== row._id)
                                : [...prev, row._id],
                            )
                          }
                          aria-label={`Select ${row.name}`}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            firstName={firstName}
                            lastName={lastName}
                            size="sm"
                            className="bg-[#E9EEF0] text-[#B01828]"
                          />
                          <p className="font-semibold text-[#1E2531]">{row.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[#1E2531]">{row.phone}</td>
                      <td className="px-4 py-3.5 capitalize text-[#1E2531]">
                        {row.gender ? row.gender.replace('_', ' ') : '—'}
                      </td>
                      <td className="px-4 py-3.5 capitalize text-[#1E2531]">
                        {SOURCE_LABEL[row.source]}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                            statusBadgeClass(row.status),
                          )}
                        >
                          {row.status === 'enrolled' ? (
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                          ) : null}
                          {STATUS_LABEL[row.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#1E2531]">{row.assignment || '—'}</td>
                      <td className="px-4 py-3.5 text-[#758188]">
                        {new Date(row.createdAt).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-4 py-3.5 sm:px-5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="rounded-lg p-2 text-[#758188] hover:bg-[#E9EEF0] hover:text-[#B01828]"
                            aria-label={`Edit ${row.name}`}
                            onClick={() => setEditLead(row)}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg p-2 text-[#758188] hover:bg-[#E03040]/10 hover:text-[#E03040]"
                            aria-label={`Delete ${row.name}`}
                            onClick={() => void handleDelete(row)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              {!loading && leads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-sm text-[#758188]">
                    No leads match your filters. Click Add Lead to create one.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#E9EEF0] px-4 py-3 sm:px-5">
          <p className="text-sm text-[#758188]">
            Page {meta.page} of {meta.totalPages} · {meta.total} total
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-[#E4DFE5] px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              className="rounded-lg border border-[#E4DFE5] px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <LeadFormModal
        open={addOpen}
        title="Add Lead"
        onClose={() => setAddOpen(false)}
        onSubmit={async (payload) => {
          await createLead(payload);
          setPage(1);
          await load();
        }}
      />
      <LeadFormModal
        open={Boolean(editLead)}
        title="Edit Lead"
        initial={editLead}
        onClose={() => setEditLead(null)}
        onSubmit={async (payload) => {
          if (!editLead) return;
          await updateLead(editLead._id, payload);
          await load();
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
  value: number;
  hint: string;
  icon: typeof Users;
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

function LeadFormModal({
  open,
  title,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  initial?: LeadDto | null;
  onClose: () => void;
  onSubmit: (payload: LeadPayload) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<LeadGender | ''>('');
  const [source, setSource] = useState<LeadSource>('whatsapp');
  const [status, setStatus] = useState<LeadStatus>('new');
  const [language, setLanguage] = useState('');
  const [assignment, setAssignment] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name || '');
    setPhone(initial?.phone || '');
    setEmail(initial?.email || '');
    setGender(initial?.gender || '');
    setSource(initial?.source || 'whatsapp');
    setStatus(initial?.status || 'new');
    setLanguage(initial?.language || '');
    setAssignment(initial?.assignment || '');
    setNotes(initial?.notes || '');
    setError('');
    setSubmitting(false);
  }, [open, initial]);

  const submit = async () => {
    if (!name.trim() || !phone.trim()) {
      setError('Name and phone are required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        gender: gender || undefined,
        source,
        status,
        language: language.trim() || undefined,
        assignment: assignment.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save lead');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title={title} onClose={onClose} busy={submitting} variant="drawer">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <FieldShell label="Full Name" required>
            {({ id }) => (
              <input
                id={id}
                className={formControlClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Lead name"
              />
            )}
          </FieldShell>
          <FieldShell label="Phone" required>
            {({ id }) => (
              <input
                id={id}
                className={formControlClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
              />
            )}
          </FieldShell>
          <FieldShell label="Email">
            {({ id }) => (
              <input
                id={id}
                type="email"
                className={formControlClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
          </FieldShell>
          <FieldShell label="Gender">
            {({ id }) => (
              <select
                id={id}
                className={formControlClass}
                value={gender}
                onChange={(e) => setGender(e.target.value as LeadGender | '')}
              >
                <option value="">Select Gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="prefer_not">Prefer not to say</option>
              </select>
            )}
          </FieldShell>
          <FieldShell label="Source">
            {({ id }) => (
              <select
                id={id}
                className={formControlClass}
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
              >
                {(Object.keys(SOURCE_LABEL) as LeadSource[]).map((key) => (
                  <option key={key} value={key}>
                    {SOURCE_LABEL[key]}
                  </option>
                ))}
              </select>
            )}
          </FieldShell>
          <FieldShell label="Status">
            {({ id }) => (
              <select
                id={id}
                className={formControlClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus)}
              >
                {(Object.keys(STATUS_LABEL) as LeadStatus[]).map((key) => (
                  <option key={key} value={key}>
                    {STATUS_LABEL[key]}
                  </option>
                ))}
              </select>
            )}
          </FieldShell>
          <FieldShell label="Language">
            {({ id }) => (
              <select
                id={id}
                className={formControlClass}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="">Select Language</option>
                <option value="English">English</option>
                <option value="Urdu">Urdu</option>
                <option value="Hindi">Hindi</option>
                <option value="Tamil">Tamil</option>
              </select>
            )}
          </FieldShell>
          <FieldShell label="Assignment">
            {({ id }) => (
              <input
                id={id}
                className={formControlClass}
                value={assignment}
                onChange={(e) => setAssignment(e.target.value)}
                placeholder="Assigned coordinator / staff"
              />
            )}
          </FieldShell>
          <FieldShell label="Notes">
            {({ id }) => (
              <textarea
                id={id}
                className={formControlClass}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            )}
          </FieldShell>
          {error ? (
            <p className="text-sm text-[#E03040]" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="border-t border-[#E4DFE5] px-5 py-4">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit()}
            className="w-full rounded-lg bg-[#B01828] px-4 py-3 text-sm font-semibold text-[#F8F8F8] hover:bg-[#800810] disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Submit'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default LeadManagementPage;
