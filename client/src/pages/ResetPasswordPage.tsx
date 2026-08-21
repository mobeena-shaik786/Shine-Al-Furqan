import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isAxiosError } from 'axios';
import { useState } from 'react';
import { resetPassword } from '../services/authApi';
import { AuthSplitLayout } from '../components/auth/AuthSplitLayout';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Za-z]/, 'Password must include a letter')
      .regex(/[0-9]/, 'Password must include a number'),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

const fieldClass = 'auth-input';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setApiError(null);
    if (!token) {
      setApiError('Reset token is missing. Use the link from your reset email.');
      return;
    }
    try {
      await resetPassword(token, values.password);
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (error) {
      if (isAxiosError(error)) {
        setApiError(error.response?.data?.message || 'Unable to reset password');
      } else {
        setApiError('Unable to reset password');
      }
    }
  };

  return (
    <AuthSplitLayout panelEyebrow="Choose a new password">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="auth-card space-y-3.5 sm:space-y-4"
        noValidate
      >
        <h2 className="text-lg font-bold text-[#1E2531]">Reset password</h2>
        {!token && (
          <p
            className="rounded-xl border border-[#E03040]/45 bg-[#E9EEF0] px-3 py-2 text-sm font-medium text-[#E03040]"
            role="alert"
          >
            Missing reset token. Open the full link from your reset instructions.
          </p>
        )}

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-semibold text-[#1E2531]">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className={fieldClass}
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-[#E03040]">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1 block text-sm font-semibold text-[#1E2531]"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={fieldClass}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-[#E03040]">{errors.confirmPassword.message}</p>
          )}
        </div>

        {isSubmitSuccessful && !apiError && (
          <p
            className="rounded-xl border border-[#61E092]/50 bg-[#E9EEF0] px-3 py-2 text-sm font-medium text-[#1E2531]"
            role="status"
          >
            Password updated. Redirecting to sign in…
          </p>
        )}
        {apiError && (
          <p
            className="rounded-xl border border-[#E03040]/45 bg-[#E9EEF0] px-3 py-2 text-sm font-medium text-[#E03040]"
            role="alert"
          >
            {apiError}
          </p>
        )}

        <button
          type="submit"
          className="auth-submit"
          disabled={isSubmitting || !token}
        >
          {isSubmitting ? 'Saving...' : 'Update password'}
        </button>

        <p className="text-center text-sm text-[#758188]">
          <Link to="/login" className="auth-link">
            Back to login
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
}
