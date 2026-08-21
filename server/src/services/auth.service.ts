import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { IUser, User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { PasswordResetToken } from '../models/PasswordResetToken';
import { AppError } from '../utils/AppError';
import {
  generateOpaqueToken,
  hashToken,
  parseDurationToMs,
} from '../utils/authTokens';
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from '../validators/auth.validator';
import { sendMail } from './mail';
import { buildPasswordResetEmail } from './mail/templates';

const FORGOT_PASSWORD_MESSAGE =
  'If an account exists for that email, password reset instructions have been sent.';

export function signAccessToken(user: IUser): string {
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
      email: user.email,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );
}

export function toSafeUser(user: IUser) {
  return {
    _id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    alternatePhone: user.alternatePhone || '',
    workLocation: user.workLocation || '',
    isActive: user.isActive,
    lastLogin: user.lastLogin?.toISOString(),
    createdAt: user.createdAt?.toISOString?.() ?? undefined,
    updatedAt: user.updatedAt?.toISOString?.() ?? undefined,
  };
}

async function issueRefreshToken(userId: string): Promise<string> {
  const raw = generateOpaqueToken();
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN));

  await RefreshToken.create({
    user: userId,
    tokenHash,
    expiresAt,
  });

  return raw;
}

export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  await RefreshToken.updateMany(
    { user: userId, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } },
  );
}

export async function loginUser(input: LoginInput) {
  const email = input.email.toLowerCase().trim();
  const password = input.password.replace(/[\r\n]+/g, '').trim();
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account is inactive. Please contact the administrator.', 401);
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const refreshToken = await issueRefreshToken(String(user._id));

  return {
    accessToken: signAccessToken(user),
    refreshToken,
    user: toSafeUser(user),
  };
}

export async function refreshSession(rawRefresh: string | undefined) {
  if (!rawRefresh) {
    throw new AppError('Refresh token required', 401);
  }

  const tokenHash = hashToken(rawRefresh);
  const existing = await RefreshToken.findOne({ tokenHash });

  if (!existing || existing.revokedAt || existing.expiresAt.getTime() < Date.now()) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await User.findById(existing.user);
  if (!user || !user.isActive) {
    existing.revokedAt = new Date();
    await existing.save();
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const newRaw = await issueRefreshToken(String(user._id));
  existing.revokedAt = new Date();
  existing.replacedByToken = hashToken(newRaw);
  await existing.save();

  return {
    accessToken: signAccessToken(user),
    refreshToken: newRaw,
    user: toSafeUser(user),
  };
}

export async function logoutUser(rawRefresh: string | undefined): Promise<void> {
  if (!rawRefresh) return;

  const tokenHash = hashToken(rawRefresh);
  const existing = await RefreshToken.findOne({ tokenHash });
  if (existing && !existing.revokedAt) {
    existing.revokedAt = new Date();
    await existing.save();
  }
}

export async function getCurrentUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  if (!user.isActive) {
    throw new AppError('Your account is inactive. Please contact the administrator.', 401);
  }
  return toSafeUser(user);
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<{ message: string }> {
  const email = input.email.toLowerCase().trim();
  const user = await User.findOne({ email });

  if (user && user.isActive) {
    await PasswordResetToken.updateMany(
      { user: user._id, usedAt: { $exists: false } },
      { $set: { usedAt: new Date() } },
    );

    const raw = generateOpaqueToken();
    const tokenHash = hashToken(raw);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await PasswordResetToken.create({
      user: user._id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${raw}`;
    const content = buildPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });

    try {
      await sendMail({
        to: user.email,
        subject: content.subject,
        text: content.text,
        html: content.html,
      });
    } catch (err) {
      // Do not leak existence or token; log failure without the URL.
      console.error('Password reset email failed', {
        email: user.email,
        error: err instanceof Error ? err.message : 'unknown',
      });
    }
  }

  return { message: FORGOT_PASSWORD_MESSAGE };
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const tokenHash = hashToken(input.token);
  const record = await PasswordResetToken.findOne({ tokenHash });

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const user = await User.findById(record.user).select('+password');
  if (!user || !user.isActive) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  user.password = input.password;
  await user.save();

  record.usedAt = new Date();
  await record.save();

  await revokeAllRefreshTokensForUser(String(user._id));
}

export async function changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const valid = await user.comparePassword(input.currentPassword);
  if (!valid) {
    throw new AppError('Current password is incorrect', 400);
  }

  if (input.currentPassword === input.newPassword) {
    throw new AppError('New password must be different from the current password', 400);
  }

  user.password = input.newPassword;
  await user.save();

  await revokeAllRefreshTokensForUser(userId);
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  if (!user.isActive) {
    throw new AppError('Your account is inactive. Please contact the administrator.', 401);
  }

  if (input.name !== undefined) user.name = input.name;
  if (input.phone !== undefined) user.phone = input.phone;
  if (input.alternatePhone !== undefined) user.alternatePhone = input.alternatePhone;
  if (input.workLocation !== undefined) user.workLocation = input.workLocation;

  await user.save();
  return toSafeUser(user);
}

/** Test helper: create a raw reset token for an email (does not log). */
export async function createPasswordResetTokenForTests(email: string): Promise<string> {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw new AppError('User not found', 404);

  const raw = generateOpaqueToken();
  await PasswordResetToken.create({
    user: user._id,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  return raw;
}
