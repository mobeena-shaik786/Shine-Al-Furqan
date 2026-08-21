import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authorizeRoles, protect } from '../middleware/auth';
import { multerErrorHandler, uploadSingleFile } from '../middleware/upload';
import { requireObjectIds } from '../middleware/validateObjectId';
import * as resources from '../services/resource.service';
import { sendSuccess } from '../utils/apiResponse';

const actor = (req: { user?: { id: string; role: string } }) => ({
  id: req.user!.id,
  role: req.user!.role as 'admin' | 'coordinator' | 'ustad' | 'student',
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many uploads, try again later' },
});

/** Nested under /api/lessons */
export const lessonResourceRouter = Router({ mergeParams: true });

lessonResourceRouter.get(
  '/:lessonId/resources',
  protect,
  authorizeRoles('admin', 'coordinator', 'ustad', 'student'),
  requireObjectIds('lessonId'),
  async (req, res, next) => {
    try {
      sendSuccess(
        res,
        await resources.listLessonResources(actor(req), req.params.lessonId),
        'Lesson resources',
      );
    } catch (error) {
      next(error);
    }
  },
);

lessonResourceRouter.post(
  '/:lessonId/resources',
  protect,
  authorizeRoles('admin', 'coordinator', 'ustad'),
  requireObjectIds('lessonId'),
  uploadLimiter,
  (req, res, next) => {
    uploadSingleFile(req, res, (err) => {
      if (err) {
        multerErrorHandler(err, req, res, next);
        return;
      }
      next();
    });
  },
  async (req, res, next) => {
    try {
      const data = await resources.uploadLessonResource(actor(req), req.params.lessonId, req.file);
      sendSuccess(res, data, 'Resource uploaded', 201);
    } catch (error) {
      next(error);
    }
  },
);

/** Top-level /api/resources */
const resourceRouter = Router();

resourceRouter.get(
  '/:id',
  protect,
  authorizeRoles('admin', 'coordinator', 'ustad', 'student'),
  requireObjectIds('id'),
  async (req, res, next) => {
    try {
      sendSuccess(res, await resources.getResourceMeta(actor(req), req.params.id), 'Resource');
    } catch (error) {
      next(error);
    }
  },
);

resourceRouter.get(
  '/:id/download',
  protect,
  authorizeRoles('admin', 'coordinator', 'ustad', 'student'),
  requireObjectIds('id'),
  async (req, res, next) => {
    try {
      const file = await resources.openResourceDownload(actor(req), req.params.id);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Length', String(file.sizeBytes));
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${file.filename.replace(/"/g, '')}"`,
      );
      res.setHeader('X-Content-Type-Options', 'nosniff');
      file.stream.pipe(res);
    } catch (error) {
      next(error);
    }
  },
);

resourceRouter.delete(
  '/:id',
  protect,
  authorizeRoles('admin', 'coordinator', 'ustad'),
  requireObjectIds('id'),
  async (req, res, next) => {
    try {
      sendSuccess(res, await resources.deleteResource(actor(req), req.params.id), 'Resource deleted');
    } catch (error) {
      next(error);
    }
  },
);

export default resourceRouter;
