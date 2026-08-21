import { Response } from 'express';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Request completed successfully',
  statusCode = 200,
  meta?: Record<string, unknown>,
): Response {
  const requestId = res.locals.requestId as string | undefined;
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
    ...(requestId ? { requestId } : {}),
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  errors?: Array<{ field?: string; message: string }>,
  code?: string,
): Response {
  const requestId = res.locals.requestId as string | undefined;
  const resolvedCode =
    code ??
    (statusCode === 400
      ? 'BAD_REQUEST'
      : statusCode === 401
        ? 'UNAUTHORIZED'
        : statusCode === 403
          ? 'FORBIDDEN'
          : statusCode === 404
            ? 'NOT_FOUND'
            : statusCode === 409
              ? 'CONFLICT'
              : statusCode === 429
                ? 'RATE_LIMITED'
                : 'INTERNAL_ERROR');

  return res.status(statusCode).json({
    success: false,
    code: resolvedCode,
    message,
    ...(errors ? { errors } : {}),
    ...(requestId ? { requestId } : {}),
  });
}
