import { Pencil } from 'lucide-react';
import { getRoleLabel, splitName, type UserRole } from '../../types/auth';
import type { ManagedUser } from '../../services/usersApi';
import { cn } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { UserAvatar } from '../ui/UserAvatar';

interface ViewUserModalProps {
  open: boolean;
  user: ManagedUser | null;
  managedRole: UserRole;
  onClose: () => void;
  onEdit: () => void;
}

const ROLE_TITLE: Record<UserRole, string> = {
  admin: 'Admin',
  coordinator: 'Coordinator',
  ustad: 'Ustad',
  student: 'Student',
};

function formatShortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function displayOrNa(value?: string | null) {
  const v = (value || '').trim();
  return v || 'N/A';
}

export function ViewUserModal({
  open,
  user,
  managedRole,
  onClose,
  onEdit,
}: ViewUserModalProps) {
  if (!open || !user) return null;

  const roleTitle = ROLE_TITLE[managedRole];
  const { firstName, lastName } = splitName(user.name);

  return (
    <Modal open={open} title={`View ${roleTitle}`} onClose={onClose} variant="drawer">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <div className="flex items-start gap-3">
            <UserAvatar
              firstName={firstName}
              lastName={lastName}
              size="lg"
              className="!h-14 !w-14 shrink-0 bg-[#61E092]/25 text-lg text-[#1E2531]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-[#1E2531]">{user.name}</p>
                  <p className="mt-0.5 truncate text-sm text-[#758188]">{user.email}</p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    user.isActive
                      ? 'bg-[#61E092]/25 text-[#1E2531]'
                      : 'bg-[#E9EEF0] text-[#758188]',
                  )}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DetailTile label="Mobile" value={displayOrNa(user.phone)} />
            <DetailTile label="Alternative Number" value={displayOrNa(user.alternatePhone)} />
            <DetailTile label="Role" value={getRoleLabel(user.role)} />
            <DetailTile label="Work Location" value={displayOrNa(user.workLocation)} />
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#758188]">
              Account
            </p>
            <div className="overflow-hidden rounded-xl border border-[#E4DFE5] bg-[#F8F8F8]">
              <AccountRow
                title="Created"
                subtitle="Account created on"
                value={formatShortDate(user.createdAt)}
              />
              <AccountRow
                title="Last Updated"
                subtitle="Profile last modified"
                value={formatShortDate(user.updatedAt)}
                last
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#E4DFE5] bg-white px-5 py-4">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#B01828] px-4 py-3 text-sm font-semibold text-[#B01828] hover:bg-[#E9EEF0]"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Edit {roleTitle}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#F8F8F8] px-3.5 py-3">
      <p className="text-xs text-[#758188]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[#1E2531]">{value}</p>
    </div>
  );
}

function AccountRow({
  title,
  subtitle,
  value,
  last,
}: {
  title: string;
  subtitle: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-3.5',
        !last && 'border-b border-[#E4DFE5]',
      )}
    >
      <div>
        <p className="text-sm font-semibold text-[#1E2531]">{title}</p>
        <p className="text-xs text-[#758188]">{subtitle}</p>
      </div>
      <p className="shrink-0 text-sm font-semibold text-[#1E2531]">{value}</p>
    </div>
  );
}

export default ViewUserModal;
