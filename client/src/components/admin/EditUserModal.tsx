import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { ManagedUser } from '../../services/usersApi';
import { cn } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { FieldShell, formControlClass } from '../ui/FormField';

export interface EditUserPayload {
  name: string;
  email: string;
  password?: string;
}

interface EditUserModalProps {
  open: boolean;
  user: ManagedUser | null;
  onClose: () => void;
  onSubmit: (payload: EditUserPayload) => Promise<void>;
}

const PASSWORD_HINT =
  'Leave blank to keep current password. New passwords need 8+ chars with a letter and number.';

function passwordOk(value: string) {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /[0-9]/.test(value);
}

export function EditUserModal({ open, user, onClose, onSubmit }: EditUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!open || !user) return;
    setName(user.name);
    setEmail(user.email);
    setPassword('');
    setShowPassword(false);
    setErrors({});
    setFormError('');
    setSubmitting(false);
  }, [open, user]);

  if (!open || !user) return null;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Name is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email';
    if (password.trim() && !passwordOk(password.trim())) {
      next.password = 'Password must be at least 8 characters and include a letter and number';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        ...(password.trim() ? { password: password.trim() } : {}),
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to update user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title="Edit user" onClose={onClose} busy={submitting}>
      <div className="space-y-4">
        <FieldShell label="Full name" required error={errors.name}>
          {({ id, describedBy }) => (
            <input
              id={id}
              className={formControlClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={describedBy}
            />
          )}
        </FieldShell>
        <FieldShell label="Email" required error={errors.email}>
          {({ id, describedBy }) => (
            <input
              id={id}
              type="email"
              className={formControlClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={describedBy}
            />
          )}
        </FieldShell>
        <FieldShell label="New password" error={errors.password} hint={PASSWORD_HINT}>
          {({ id, describedBy }) => (
            <div className="relative">
              <input
                id={id}
                type={showPassword ? 'text' : 'password'}
                className={cn(formControlClass, 'pr-11')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={describedBy}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-3 text-[#758188]"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          )}
        </FieldShell>
        {formError ? (
          <p className="text-sm text-[#E03040]" role="alert">
            {formError}
          </p>
        ) : null}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-xl border border-[#E4DFE5] px-4 py-3 text-sm font-semibold text-[#1E2531]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={submitting}
            className="flex-1 rounded-xl bg-[#B01828] px-4 py-3 text-sm font-semibold text-[#F8F8F8] hover:bg-[#800810] disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default EditUserModal;
