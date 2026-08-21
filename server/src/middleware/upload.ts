import multer from 'multer';
import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { ALLOWED_MIME_TYPES } from '../config/uploads';
import { AppError } from '../utils/AppError';

const memory = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.UPLOAD_MAX_BYTES,
    files: 1,
  },
  fileFilter(_req, file, cb) {
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      cb(new AppError(`File type '${file.mimetype}' is not allowed`, 400));
      return;
    }
    cb(null, true);
  },
});

export const uploadSingleFile = memory.single('file');

/** Map Multer errors to AppError for the central handler. */
export function multerErrorHandler(err: unknown, _req: Request, _res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      next(new AppError(`File exceeds maximum size of ${env.UPLOAD_MAX_BYTES} bytes`, 400));
      return;
    }
    next(new AppError(err.message, 400));
    return;
  }
  next(err);
}
