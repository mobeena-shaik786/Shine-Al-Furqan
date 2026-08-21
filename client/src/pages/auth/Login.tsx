import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useAuth } from '../../context/AuthContext';
import { AuthSplitLayout } from '../../components/auth/AuthSplitLayout';

const schema = z.object({
  email: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(1, 'Email is required').email('Enter a valid email')),
  password: z
    .string()
    .transform((v) => v.replace(/[\r\n]+/g, '').trim())
    .pipe(
      z
        .string()
        .min(1, 'Password is required')
        .min(8, 'Password must contain at least 8 characters'),
    ),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

const fieldClass = 'auth-input';

export function Login() {
  const { login, isAuthenticated, loading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      remember: true,
    },
  });

  if (!loading && isAuthenticated && user) {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    return <Navigate to={from || `/${user.role}/dashboard`} replace />;
  }

  const onSubmit = async (values: FormValues) => {
    setApiError(null);
    setSuccessMessage(null);
    try {
      const email = values.email.trim();
      const password = values.password.replace(/[\r\n]+/g, '').trim();
      const result = await login(email, password, values.remember);
      setSuccessMessage('Login successful');
      navigate(result.redirectTo, { replace: true });
    } catch (error) {
      if (isAxiosError(error)) {
        setApiError(error.response?.data?.message || 'Invalid email or password');
      } else if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError('Invalid email or password');
      }
    }
  };

  return (
    <AuthSplitLayout panelEyebrow="Sign in with your email and password">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="auth-card space-y-5"
        noValidate
      >
        {successMessage && (
          <p
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-[#1E293B]"
            role="status"
          >
            {successMessage}
          </p>
        )}
        {apiError && (
          <p
            className="rounded-xl border border-[#B91C1C]/20 bg-[#B91C1C]/5 px-3 py-2.5 text-sm font-medium text-[#B91C1C]"
            role="alert"
          >
            {apiError}
          </p>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-[#1E293B]">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={fieldClass}
            placeholder="you@example.com"
            {...register('email', { onChange: () => setApiError(null) })}
            onPaste={(e) => {
              e.preventDefault();
              const text = e.clipboardData.getData('text').replace(/[\r\n]+/g, '').trim();
              setValue('email', text, { shouldValidate: true, shouldDirty: true });
              setApiError(null);
            }}
          />
          {errors.email && <p className="mt-1.5 text-xs text-[#B91C1C]">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-[#1E293B]">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`${fieldClass} pr-12`}
              placeholder="••••••••"
              {...register('password', { onChange: () => setApiError(null) })}
              onPaste={(e) => {
                e.preventDefault();
                const text = e.clipboardData.getData('text').replace(/[\r\n]+/g, '').trim();
                setValue('password', text, { shouldValidate: true, shouldDirty: true });
                setApiError(null);
              }}
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-[#B91C1C]">{errors.password.message}</p>
          )}
        </div>

        <div className="flex flex-row items-center justify-between gap-3 text-sm">
          <label className="inline-flex cursor-pointer items-center gap-2 font-medium text-[#64748B]">
            <input
              type="checkbox"
              className="auth-checkbox"
              {...register('remember')}
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="auth-link">
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={isSubmitting} className="auth-submit">
          {isSubmitting ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </AuthSplitLayout>
  );
}

export default Login;
