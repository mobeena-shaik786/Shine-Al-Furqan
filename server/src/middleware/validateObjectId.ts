import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { AppError } from '../utils/AppError';

/** Validate named route params are Mongo ObjectIds → 400 INVALID_ID. */
export function requireObjectIds(...paramNames: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    for (const name of paramNames) {
      const value = req.params[name];
      if (value !== undefined && !Types.ObjectId.isValid(value)) {
        next(new AppError(`Invalid id for '${name}'`, 400, undefined, true, 'INVALID_ID'));
        return;
      }
    }
    next();
  };
}
