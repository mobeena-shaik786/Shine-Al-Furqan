import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Error as MongooseError } from 'mongoose';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/apiResponse';
import { env } from '../config/env';

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, 'Resource not found', 404, undefined, 'NOT_FOUND');
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors, err.code);
    return;
  }

  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 'Validation failed', 400, errors, 'VALIDATION_ERROR');
    return;
  }

  if (err instanceof MongooseError.CastError) {
    sendError(res, 'Invalid identifier', 400, undefined, 'INVALID_ID');
    return;
  }

  // Multer / generic errors with status
  const anyErr = err as { statusCode?: number; status?: number; message?: string; code?: string };
  if (typeof anyErr?.statusCode === 'number' || typeof anyErr?.status === 'number') {
    const status = anyErr.statusCode ?? anyErr.status ?? 500;
    sendError(res, anyErr.message || 'Request failed', status, undefined, anyErr.code);
    return;
  }

  console.error('Unhandled error:', {
    requestId: res.locals.requestId,
    message: (err as Error)?.message,
    name: (err as Error)?.name,
  });
  const message =
    env.NODE_ENV === 'production' ? 'Internal server error' : (err as Error)?.message || 'Error';
  sendError(res, message, 500, undefined, 'INTERNAL_ERROR');
}
