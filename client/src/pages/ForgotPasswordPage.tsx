import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isAxiosError } from 'axios';
import { useState } from 'react';
import { forgotPassword } from '../services/authApi';
import { AuthSplitLayout } from '../components/auth/AuthSplitLayout';

const schema = z.object({
  email: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().email('Enter a valid email')),
});

type FormValues = z.infer<typeof schema>;

const fieldClass = 'auth-input';

export function ForgotPasswordPage() {
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setApiError(null);
    setApiMessage(null);
    try {
      const message = await forgotPassword(values.email);
      setApiMessage(message);
    } catch (error) {
      if (isAxiosError(error)) {
        setApiError(error.response?.data?.message || 'Unable to send reset instructions');
      } else {
        setApiError('Unable to send reset instructions');
      }
    }
  };

  return (
    <AuthSplitLayout panelEyebrow="Reset your password">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="auth-card space-y-3.5 sm:space-y-4"
        noValidate
      >
        <h2 className="text-lg font-bold text-[#1E2531]">Forgot password</h2>
        <p className="text-sm text-[#758188]">
          Enter your email and we will send reset instructions if an account exists.
        </p>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-semibold text-[#1E2531]">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={fieldClass}
            placeholder="you@example.com"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-xs text-[#E03040]">{errors.email.message}</p>}
        </div>

        {apiMessage && (
          <p
            className="rounded-xl border border-[#61E092]/50 bg-[#E9EEF0] px-3 py-2 text-sm font-medium text-[#1E2531]"
            role="status"
          >
            {apiMessage}
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
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </button>

        <p className="text-center text-sm text-[#758188]">
          Remembered your password?{' '}
          <Link to="/login" className="auth-link">
            Login
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
}
