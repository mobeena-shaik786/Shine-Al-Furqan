import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isAxiosError } from 'axios';
import {
  Briefcase,
  CalendarDays,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Shield,
  UserRound,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { UserAvatar } from '../components/ui/UserAvatar';
import { Modal } from '../components/ui/Modal';
import { FieldShell, formControlClass } from '../components/ui/FormField';
import { useAuth } from '../context/AuthContext';
import { getRoleLabel, splitName, type AuthUser } from '../types/auth';
import { changePassword, fetchMyProfile, updateMyProfile } from '../services/authApi';
import { cn } from '../lib/utils';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Za-z]/, 'Password must include a letter')
      .regex(/[0-9]/, 'Password must include a number'),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Full name is required').max(120),
  phone: z.string().trim().max(40).optional(),
  alternatePhone: z.string().trim().max(40).optional(),
  workLocation: z.string().trim().max(200).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

function formatLongDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function displayValue(value?: string | null) {
  const v = (value || '').trim();
  return v || '—';
}

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<AuthUser | null>(user);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    void fetchMyProfile()
      .then((raw) => {
        setProfile({
          _id: String(raw._id ?? ''),
          name: String(raw.name ?? ''),
          email: String(raw.email ?? ''),
          role: raw.role as AuthUser['role'],
          phone: String(raw.phone ?? ''),
          alternatePhone: String(raw.alternatePhone ?? ''),
          workLocation: String(raw.workLocation ?? ''),
          isActive: raw.isActive !== false,
          lastLogin: raw.lastLogin ? String(raw.lastLogin) : undefined,
          createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
          updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
        });
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : 'Unable to load profile'));
  }, []);

  const active = profile || user;
  if (!active) {
    return <p className="text-sm text-[#758188]">Loading profile…</p>;
  }

  const { firstName, lastName } = splitName(active.name);
  const roleLabel = getRoleLabel(active.role);
  const description =
    active.role === 'admin'
      ? 'Manage your administrator account and security settings. Updates apply to your sign-in profile for this portal.'
      : `Manage your ${roleLabel.toLowerCase()} account and security settings. Updates apply to your sign-in profile for this portal.`;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E03040]/10 text-[#B01828]">
          <UserRound className="h-5 w-5" aria-hidden />
        </span>
        <PageHeader title="Profile" description={description} className="mb-0" />
      </div>

      {loadError ? <p className="text-sm text-[#E03040]">{loadError}</p> : null}

      <section className="rounded-2xl border border-[#E4DFE5] bg-white p-5 shadow-soft sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-bold text-[#1E2531]">Account information</h2>
          <p className="mt-1 text-sm text-[#758188]">
            Official directory record for your {roleLabel.toLowerCase()} account.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="flex flex-col items-center rounded-2xl border border-[#E4DFE5] bg-[#F8F8F8] p-5 text-center">
            <UserAvatar
              firstName={firstName}
              lastName={lastName}
              size="lg"
              className="!h-24 !w-24 !text-2xl"
            />
            <p className="mt-4 text-lg font-bold text-[#1E2531]">{active.name}</p>
            <span className="mt-2 inline-flex rounded-full bg-[#61E092]/20 px-3 py-1 text-xs font-semibold text-[#1E2531]">
              {roleLabel}
            </span>
            <div className="mt-5 flex w-full flex-col gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#B01828] px-3 py-2.5 text-sm font-semibold text-[#B01828] hover:bg-[#E9EEF0]"
              >
                <Pencil className="h-4 w-4" />
                Edit profile
              </button>
              <button
                type="button"
                onClick={() => setPasswordOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#B01828] px-3 py-2.5 text-sm font-semibold text-[#B01828] hover:bg-[#E9EEF0]"
              >
                <KeyRound className="h-4 w-4" />
                Change password
              </button>
            </div>
          </aside>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoField icon={UserRound} label="Full Name" value={active.name} />
            <InfoField icon={Mail} label="Email" value={active.email} />
            <InfoField icon={Phone} label="Mobile" value={displayValue(active.phone)} />
            <InfoField
              icon={Phone}
              label="Alternative Number"
              value={displayValue(active.alternatePhone)}
            />
            <InfoField
              icon={MapPin}
              label="Work Location"
              value={displayValue(active.workLocation)}
            />
            <InfoField icon={Shield} label="Role" value={roleLabel} />
            <InfoField icon={CalendarDays} label="Created" value={formatLongDate(active.createdAt)} />
            <InfoField
              icon={Briefcase}
              label="Last Updated"
              value={formatLongDate(active.updatedAt)}
            />
          </div>
        </div>
      </section>

      <EditProfileModal
        open={editOpen}
        profile={active}
        onClose={() => setEditOpen(false)}
        onSaved={async () => {
          const next = await refreshUser();
          if (next) setProfile(next);
          setEditOpen(false);
        }}
      />

      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}

function InfoField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-lg bg-[#E9EEF0] p-2 text-[#B01828]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#758188]">{label}</p>
          <p className="mt-1 truncate text-sm font-semibold text-[#1E2531]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function EditProfileModal({
  open,
  profile,
  onClose,
  onSaved,
}: {
  open: boolean;
  profile: AuthUser;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name,
      phone: profile.phone || '',
      alternatePhone: profile.alternatePhone || '',
      workLocation: profile.workLocation || '',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: profile.name,
      phone: profile.phone || '',
      alternatePhone: profile.alternatePhone || '',
      workLocation: profile.workLocation || '',
    });
    setError('');
  }, [open, profile, reset]);

  return (
    <Modal open={open} title="Edit profile" onClose={onClose} busy={isSubmitting} variant="drawer">
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={handleSubmit(async (values) => {
          setError('');
          try {
            await updateMyProfile({
              name: values.name.trim(),
              phone: values.phone?.trim() || '',
              alternatePhone: values.alternatePhone?.trim() || '',
              workLocation: values.workLocation?.trim() || '',
            });
            await onSaved();
          } catch (err) {
            if (isAxiosError(err)) {
              setError(err.response?.data?.message || 'Unable to update profile');
            } else if (err instanceof Error) {
              setError(err.message);
            } else {
              setError('Unable to update profile');
            }
          }
        })}
        noValidate
      >
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <FieldShell label="Full Name" required error={errors.name?.message}>
            {({ id }) => <input id={id} className={formControlClass} {...register('name')} />}
          </FieldShell>
          <FieldShell label="Mobile" error={errors.phone?.message}>
            {({ id }) => (
              <input
                id={id}
                className={formControlClass}
                placeholder="+91 …"
                {...register('phone')}
              />
            )}
          </FieldShell>
          <FieldShell label="Alternative Number" error={errors.alternatePhone?.message}>
            {({ id }) => (
              <input id={id} className={formControlClass} {...register('alternatePhone')} />
            )}
          </FieldShell>
          <FieldShell label="Work Location" error={errors.workLocation?.message}>
            {({ id }) => (
              <input id={id} className={formControlClass} {...register('workLocation')} />
            )}
          </FieldShell>
          {error ? (
            <p className="text-sm text-[#E03040]" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 border-t border-[#E4DFE5] px-5 py-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#B01828] py-3 text-sm font-semibold text-[#F8F8F8] hover:bg-[#800810] disabled:opacity-60"
          >
            {isSubmitting ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    if (!open) return;
    reset();
    setApiError(null);
    setApiSuccess(null);
  }, [open, reset]);

  return (
    <Modal open={open} title="Change password" onClose={onClose} busy={isSubmitting} variant="drawer">
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={handleSubmit(async (values) => {
          setApiError(null);
          setApiSuccess(null);
          try {
            await changePassword(values.currentPassword, values.newPassword);
            setApiSuccess('Password updated successfully.');
            reset();
          } catch (error) {
            if (isAxiosError(error)) {
              setApiError(error.response?.data?.message || 'Unable to change password');
            } else if (error instanceof Error) {
              setApiError(error.message);
            } else {
              setApiError('Unable to change password');
            }
          }
        })}
        noValidate
      >
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <p className="text-sm text-[#758188]">
            Use at least 8 characters with a letter and a number. Other sessions will be signed out.
          </p>
          <FieldShell label="Current password" required error={errors.currentPassword?.message}>
            {({ id }) => (
              <input
                id={id}
                type="password"
                autoComplete="current-password"
                className={formControlClass}
                {...register('currentPassword')}
              />
            )}
          </FieldShell>
          <FieldShell label="New password" required error={errors.newPassword?.message}>
            {({ id }) => (
              <input
                id={id}
                type="password"
                autoComplete="new-password"
                className={formControlClass}
                {...register('newPassword')}
              />
            )}
          </FieldShell>
          <FieldShell label="Confirm new password" required error={errors.confirmPassword?.message}>
            {({ id }) => (
              <input
                id={id}
                type="password"
                autoComplete="new-password"
                className={formControlClass}
                {...register('confirmPassword')}
              />
            )}
          </FieldShell>
          {apiSuccess ? (
            <p className="text-sm text-[#61E092]" role="status">
              {apiSuccess}
            </p>
          ) : null}
          {apiError ? (
            <p className="text-sm text-[#E03040]" role="alert">
              {apiError}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 border-t border-[#E4DFE5] px-5 py-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'w-full rounded-xl bg-[#B01828] py-3 text-sm font-semibold text-[#F8F8F8] hover:bg-[#800810] disabled:opacity-60',
            )}
          >
            {isSubmitting ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ProfilePage;
