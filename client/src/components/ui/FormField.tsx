import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const controlClass =
  'w-full rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] px-3.5 py-2.5 text-sm text-[#1E2531] outline-none transition placeholder:text-[#758188] focus:border-[#E03040] focus:ring-2 focus:ring-[#E03040]/20';

interface FieldShellProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: (ids: { id: string; describedBy?: string }) => ReactNode;
}

export function FieldShell({ label, required, error, hint, children }: FieldShellProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[#758188]">
        {label}
        {required ? <span className="text-[#E03040]"> *</span> : null}
      </label>
      {children({ id, describedBy })}
      {hint ? (
        <p id={hintId} className="mt-1 text-xs text-[#758188]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-[#E03040]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
};

export function FormInput({ label, required, error, hint, className, ...rest }: TextInputProps) {
  return (
    <FieldShell label={label} required={required} error={error} hint={hint}>
      {({ id, describedBy }) => (
        <input
          id={id}
          className={cn(controlClass, className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

export function FormSelect({
  label,
  required,
  error,
  hint,
  className,
  children,
  ...rest
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <FieldShell label={label} required={required} error={error} hint={hint}>
      {({ id, describedBy }) => (
        <select
          id={id}
          className={cn(controlClass, className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        >
          {children}
        </select>
      )}
    </FieldShell>
  );
}

export function FormTextarea({
  label,
  required,
  error,
  hint,
  className,
  ...rest
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
}) {
  return (
    <FieldShell label={label} required={required} error={error} hint={hint}>
      {({ id, describedBy }) => (
        <textarea
          id={id}
          className={cn(controlClass, className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

export { controlClass as formControlClass };
