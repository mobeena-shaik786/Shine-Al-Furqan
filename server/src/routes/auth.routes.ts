import { NextFunction, Request, Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect } from '../middleware/auth';
import * as authService from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse';
import {
  REFRESH_COOKIE_NAME,
  clearRefreshCookie,
  setRefreshCookie,
} from '../utils/authTokens';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '../validators/auth.validator';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
});

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many reset requests. Please try again later.' },
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset attempts. Please try again later.' },
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many refresh attempts. Please try again later.' },
});

const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password change attempts. Please try again later.' },
});

router.post('/login', loginLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = loginSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await authService.loginUser(input);
    setRefreshCookie(res, refreshToken);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      user,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', refreshLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    const { accessToken, refreshToken, user } = await authService.refreshSession(raw);
    setRefreshCookie(res, refreshToken);
    sendSuccess(res, { accessToken, user }, 'Token refreshed');
  } catch (error) {
    clearRefreshCookie(res);
    next(error);
  }
});

router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    await authService.logoutUser(raw);
    clearRefreshCookie(res);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    clearRefreshCookie(res);
    next(error);
  }
});

router.get('/me', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getCurrentUser(req.user!.id);
    sendSuccess(res, user, 'Current user retrieved');
  } catch (error) {
    next(error);
  }
});

router.patch('/me', protect, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateProfileSchema.parse(req.body);
    const user = await authService.updateProfile(req.user!.id, input);
    sendSuccess(res, user, 'Profile updated');
  } catch (error) {
    next(error);
  }
});

router.post(
  '/forgot-password',
  forgotLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = forgotPasswordSchema.parse(req.body);
      const result = await authService.forgotPassword(input);
      sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  },
);

router.post('/reset-password', resetLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(input);
    sendSuccess(res, null, 'Password has been reset. You can sign in.');
  } catch (error) {
    next(error);
  }
});

router.post(
  '/change-password',
  protect,
  changePasswordLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = changePasswordSchema.parse(req.body);
      await authService.changePassword(req.user!.id, input);
      sendSuccess(res, null, 'Password updated successfully');
    } catch (error) {
      next(error);
    }
  },
);

export default router;
