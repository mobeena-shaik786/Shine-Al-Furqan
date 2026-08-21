import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { IUser, User, UserRole } from '../models/User';
import { AppError } from '../utils/AppError';

export interface AuthUserPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

interface JwtPayload {
  sub: string;
  role: UserRole;
  email: string;
}

/** Verify Bearer JWT, load active user, attach to req.user */
export async function protect(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      next(new AppError('Authentication required', 401));
      return;
    }

    const token = header.slice(7);
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      next(new AppError('Invalid or expired access token', 401));
      return;
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      next(new AppError('Invalid or expired access token', 401));
      return;
    }

    if (!user.isActive) {
      next(new AppError('Your account is inactive. Please contact the administrator.', 401));
      return;
    }

    req.user = toAuthPayload(user);
    next();
  } catch (error) {
    next(error);
  }
}

/** Allow only listed roles (reads role from Mongo-backed req.user) */
export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError('You do not have permission to perform this action', 403));
      return;
    }
    next();
  };
}

export function toAuthPayload(user: IUser): AuthUserPayload {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
}

/** @deprecated Use protect */
export const authenticate = protect;
/** @deprecated Use authorizeRoles */
export const authorize = authorizeRoles;
