import { useCallback, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Eye,
  Pencil,
  Plus,
  Search,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { UserAvatar } from '../../components/ui/UserAvatar';
import {
  EditUserModal,
  type EditUserPayload,
} from '../../components/admin/EditUserModal';
import { ViewUserModal } from '../../components/admin/ViewUserModal';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { splitName, type UserRole } from '../../types/auth';
import {
  createUser,
  listUsers,
  updateUser,
  updateUserStatus,
  type AddUserCorePayload,
  type ManagedUser,
  type UsersListMeta,
} from '../../services/usersApi';
import { listBatches, type BatchDto } from '../../services/academicApi';

const LANGUAGE_OPTIONS = ['English', 'Urdu', 'Hindi', 'Tamil'] as const;

interface AddModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: AddUserCorePayload) => Promise<void>;
}

interface UserRoleManagementPageProps {
  managedRole: UserRole;
  title: string;
  description: string;
  addLabel: string;
  AddModal: ComponentType<AddModalProps>;
}

const emptyMeta: UsersListMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  stats: { total: 0, active: 0, inactive: 0, male: 0, female: 0 },
};

export function UserRoleManagementPage({
  managedRole,
  title,
  description,
  addLabel,
  AddModal,
}: UserRoleManagementPageProps) {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [meta, setMeta] = useState<UsersListMeta>(emptyMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'created'>('name');
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [viewUser, setViewUser] = useState<ManagedUser | null>(null);
  const [editUser, setEditUser] = useState<ManagedUser | null>(null);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listUsers({
        role: managedRole,
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        sort: sortBy,
        isActive: statusFilter === '' ? undefined : statusFilter === 'active',
        gender:
          genderFilter === 'male' || genderFilter === 'female'
            ? genderFilter
            : undefined,
        language: managedRole === 'student' ? languageFilter || undefined : undefined,
        batchId: managedRole === 'student' ? batchFilter || undefined : undefined,
      });
      setUsers(result.users);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load users');
      setUsers([]);
      setMeta(emptyMeta);
    } finally {
      setLoading(false);
    }
  }, [
    batchFilter,
    genderFilter,
    languageFilter,
    managedRole,
    page,
    pageSize,
    search,
    sortBy,
    statusFilter,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (managedRole !== 'student') {
      setBatches([]);
      return;
    }
    void listBatches({ page: 1, limit: 100, sort: 'name' })
      .then((result) => setBatches(result.batches))
      .catch(() => setBatches([]));
  }, [managedRole]);

  const handleAdd = async (payload: AddUserCorePayload) => {
    await createUser({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: managedRole,
      ...(payload.gender ? { gender: payload.gender } : {}),
      ...(payload.languages?.length ? { languages: payload.languages } : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
      ...(payload.alternatePhone !== undefined
        ? { alternatePhone: payload.alternatePhone }
        : {}),
      ...(payload.workLocation !== undefined ? { workLocation: payload.workLocation } : {}),
    });
    setPage(1);
    await load();
  };

  const handleEdit = async (payload: EditUserPayload) => {
    if (!editUser) return;
    await updateUser(editUser._id, payload);
    await load();
  };

  const handleToggleActive = async (row: ManagedUser) => {
    setActionError('');
    if (me?._id === row._id && row.isActive) {
      setActionError('You cannot deactivate your own account.');
      return;
    }
    const next = !row.isActive;
    const label = next ? 'activate' : 'deactivate';
    if (!window.confirm(`${label[0].toUpperCase()}${label.slice(1)} ${row.name}?`)) return;
    try {
      await updateUserStatus(row._id, next);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : `Unable to ${label} user`);
    }
  };

  const handleExport = async () => {
    setActionError('');
    try {
      const result = await listUsers({
        role: managedRole,
        page: 1,
        limit: 100,
        search: search.trim() || undefined,
        sort: sortBy,
        isActive: statusFilter === '' ? undefined : statusFilter === 'active',
        gender:
          genderFilter === 'male' || genderFilter === 'female'
            ? genderFilter
            : undefined,
        language: managedRole === 'student' ? languageFilter || undefined : undefined,
        batchId: managedRole === 'student' ? batchFilter || undefined : undefined,
      });
      const header = ['Name', 'Email', 'Role', 'Status', 'Created'];
      const lines = result.users.map((row) =>
        [
          row.name,
          row.email,
          row.role,
          row.isActive ? 'Active' : 'Inactive',
          new Date(row.createdAt).toISOString().slice(0, 10),
        ]
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(','),
      );
      const csv = [header.join(','), ...lines].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${managedRole}-users-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to export users');
    }
  };

  const selectClass =
    'rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] px-3 py-2.5 text-sm text-[#1E2531] outline-none transition focus:border-[#E03040] focus:ring-2 focus:ring-[#E03040]/20';

  const showingFrom = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const showingTo = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title={title} description={description} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total" value={meta.stats.total} hint={`All ${managedRole}s`} tone="blue" />
        <SummaryCard label="Active" value={meta.stats.active} hint="Currently active" tone="green" />
        <SummaryCard
          label="Male"
          value={meta.stats.male ?? 0}
          hint="Male accounts"
          tone="blue"
        />
        <SummaryCard
          label="Female"
          value={meta.stats.female ?? 0}
          hint="Female accounts"
          tone="slate"
        />
      </div>

      <section className="card overflow-hidden">
        <div className="space-y-4 border-b border-[#E9EEF0] p-4 sm:p-5">
          <h2 className="text-sm font-bold text-[#1E2531]">Filters</h2>
          <div
            className={cn(
              'grid gap-3',
              managedRole === 'student' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-3',
            )}
          >
            <select
              className={selectClass}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Select status"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              className={selectClass}
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Select gender"
            >
              <option value="">Select genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            {managedRole === 'student' ? (
              <>
                <select
                  className={selectClass}
                  value={languageFilter}
                  onChange={(e) => {
                    setLanguageFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Select language"
                >
                  <option value="">Select language</option>
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
                <select
                  className={selectClass}
                  value={batchFilter}
                  onChange={(e) => {
                    setBatchFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Select batch"
                >
                  <option value="">Select batch</option>
                  {batches.map((batch) => (
                    <option key={batch._id} value={batch._id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
            <select
              className={selectClass}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              aria-label="Sort by"
            >
              <option value="name">Sort by name</option>
              <option value="email">Sort by email</option>
              <option value="created">Sort by created</option>
            </select>
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
                  placeholder="Search name or email…"
                  className="w-full rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] py-2.5 pl-10 pr-3 text-sm text-[#1E2531] outline-none transition placeholder:text-[#758188] focus:border-[#E03040] focus:ring-2 focus:ring-[#E03040]/20"
                />
              </div>
              <button
                type="button"
                onClick={() => void handleExport()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#B01828] bg-[#F8F8F8] px-4 py-2.5 text-sm font-semibold text-[#B01828] transition hover:bg-[#B01828]/10"
              >
                <Download className="h-4 w-4" aria-hidden />
                Export
              </button>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B01828] px-4 py-2.5 text-sm font-semibold text-[#F8F8F8] shadow-soft transition hover:bg-[#800810]"
              >
                <Plus className="h-4 w-4" aria-hidden />
                {addLabel}
              </button>
            </div>
          </div>
          {actionError ? <p className="text-sm text-[#E03040]">{actionError}</p> : null}
          {error ? <p className="text-sm text-[#E03040]">{error}</p> : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#E9EEF0] bg-[#F8F8F8]/80 text-xs font-semibold uppercase tracking-wide text-[#758188]">
                <th className="px-4 py-3 sm:px-5">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right sm:px-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-[#758188]">
                    Loading users…
                  </td>
                </tr>
              ) : (
                users.map((row) => {
                  const { firstName, lastName } = splitName(row.name);
                  return (
                    <tr
                      key={row._id}
                      className="border-b border-[#E9EEF0] last:border-0 hover:bg-[#F8F8F8]/60"
                    >
                      <td className="px-4 py-3.5 sm:px-5">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            firstName={firstName}
                            lastName={lastName}
                            size="sm"
                            className="bg-[#E9EEF0] text-[#B01828]"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[#1E2531]">{row.name}</p>
                            <p className="truncate text-xs text-[#758188]">{row.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 capitalize text-[#1E2531]">{row.role}</td>
                      <td className="px-4 py-3.5">
                        <StatusBadge active={row.isActive} />
                      </td>
                      <td className="px-4 py-3.5 text-[#758188]">
                        {new Date(row.createdAt).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-4 py-3.5 sm:px-5">
                        <div className="flex items-center justify-end gap-1">
                          <IconAction
                            label={`View ${row.name}`}
                            icon={Eye}
                            onClick={() => setViewUser(row)}
                          />
                          <IconAction
                            label={`Edit ${row.name}`}
                            icon={Pencil}
                            onClick={() => setEditUser(row)}
                          />
                          <IconAction
                            label={row.isActive ? `Deactivate ${row.name}` : `Activate ${row.name}`}
                            icon={row.isActive ? UserX : UserCheck}
                            danger={row.isActive}
                            onClick={() => void handleToggleActive(row)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              {!loading && users.length === 0 && !error ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-[#758188]">
                    No users match your filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#E9EEF0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm text-[#758188]">
            Showing {showingFrom} to {showingTo} of {meta.total} entries
          </p>
          <div className="flex items-center gap-1">
            <PageBtn label="First page" disabled={meta.page <= 1} onClick={() => setPage(1)}>
              <ChevronsLeft className="h-4 w-4" />
            </PageBtn>
            <PageBtn
              label="Previous page"
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </PageBtn>
            <button
              type="button"
              className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-[#B01828] px-3 text-sm font-semibold text-[#F8F8F8]"
              aria-current="page"
            >
              {meta.page}
            </button>
            <PageBtn
              label="Next page"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </PageBtn>
            <PageBtn
              label="Last page"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage(meta.totalPages)}
            >
              <ChevronsRight className="h-4 w-4" />
            </PageBtn>
          </div>
        </div>
      </section>

      <AddModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAdd} />
      <ViewUserModal
        open={Boolean(viewUser)}
        user={viewUser}
        managedRole={managedRole}
        onClose={() => setViewUser(null)}
        onEdit={() => {
          if (!viewUser) return;
          setEditUser(viewUser);
          setViewUser(null);
        }}
      />
      <EditUserModal
        open={Boolean(editUser)}
        user={editUser}
        onClose={() => setEditUser(null)}
        onSubmit={handleEdit}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone: 'blue' | 'green' | 'slate';
}) {
  const tones = {
    blue: 'bg-[#E9EEF0] text-[#B01828]',
    green: 'bg-[#E9EEF0] text-[#61E092]',
    slate: 'bg-[#E9EEF0] text-[#758188]',
  };
  return (
    <article className="card flex items-start justify-between p-5">
      <div>
        <p className="text-sm font-medium text-[#758188]">{label}</p>
        <p className="mt-1 text-3xl font-bold text-[#1E2531]">{value}</p>
        <p className="mt-1 text-xs text-[#758188]">{hint}</p>
      </div>
      <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', tones[tone])}>
        <Users className="h-5 w-5" aria-hidden />
      </div>
    </article>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
        active ? 'bg-[#E9EEF0] text-[#61E092]' : 'bg-[#E9EEF0] text-[#758188]',
      )}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function IconAction({
  label,
  icon: Icon,
  danger,
  onClick,
}: {
  label: string;
  icon: typeof Pencil;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'rounded-lg p-2 transition',
        danger
          ? 'text-[#758188] hover:bg-[#E9EEF0] hover:text-[#E03040]'
          : 'text-[#758188] hover:bg-[#E9EEF0] hover:text-[#B01828]',
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}

function PageBtn({
  children,
  label,
  disabled,
  onClick,
}: {
  children: ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E4DFE5] text-[#758188] transition hover:bg-[#F8F8F8] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export default UserRoleManagementPage;
