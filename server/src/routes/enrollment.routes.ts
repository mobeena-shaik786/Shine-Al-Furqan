import { Request, Router } from 'express';
import { authorizeRoles, protect } from '../middleware/auth';
import * as academic from '../services/academic.service';
import { sendSuccess } from '../utils/apiResponse';
import {
  createBatchSchema,
  createEnrollmentSchema,
  listBatchesQuerySchema,
  listEnrollmentsQuerySchema,
  updateBatchSchema,
  updateEnrollmentStatusSchema,
} from '../validators/academic.validator';

const actor = (req: Request): academic.AcademicActor => ({
  id: req.user!.id,
  role: req.user!.role,
});

export const enrollmentRouter = Router();
enrollmentRouter.use(protect);

enrollmentRouter.post('/', authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try {
    sendSuccess(
      res,
      await academic.createEnrollment(actor(req), createEnrollmentSchema.parse(req.body)),
      'Enrollment created',
      201,
    );
  } catch (error) {
    next(error);
  }
});

enrollmentRouter.get('/', authorizeRoles('admin', 'coordinator', 'student'), async (req, res, next) => {
  try {
    const query = listEnrollmentsQuerySchema.parse(req.query);
    const result = await academic.listEnrollments(actor(req), query);
    sendSuccess(res, result.enrollments, 'Enrollments retrieved', 200, result.meta);
  } catch (error) {
    next(error);
  }
});

enrollmentRouter.get('/me', authorizeRoles('student'), async (req, res, next) => {
  try {
    const result = await academic.listEnrollments(actor(req), listEnrollmentsQuerySchema.parse(req.query));
    sendSuccess(res, result.enrollments, 'Enrollments retrieved', 200, result.meta);
  } catch (error) {
    next(error);
  }
});

enrollmentRouter.patch('/:id/status', authorizeRoles('admin', 'coordinator', 'student'), async (req, res, next) => {
  try {
    sendSuccess(
      res,
      await academic.updateEnrollmentStatus(
        actor(req),
        req.params.id,
        updateEnrollmentStatusSchema.parse(req.body).status,
      ),
      'Enrollment status updated',
    );
  } catch (error) {
    next(error);
  }
});

export const batchRouter = Router();
batchRouter.use(protect);

batchRouter.get('/', authorizeRoles('admin', 'coordinator', 'ustad'), async (req, res, next) => {
  try {
    const result = await academic.listBatches(actor(req), listBatchesQuerySchema.parse(req.query));
    sendSuccess(res, result.batches, 'Batches retrieved', 200, result.meta);
  } catch (error) {
    next(error);
  }
});

batchRouter.post('/', authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try {
    sendSuccess(
      res,
      academic.toBatchDto(await academic.createBatch(createBatchSchema.parse(req.body), req.user!.id)),
      'Batch created',
      201,
    );
  } catch (error) {
    next(error);
  }
});

batchRouter.get('/:id', authorizeRoles('admin', 'coordinator', 'ustad'), async (req, res, next) => {
  try {
    sendSuccess(res, await academic.getBatch(actor(req), req.params.id), 'Batch retrieved');
  } catch (error) {
    next(error);
  }
});

batchRouter.patch('/:id', authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try {
    sendSuccess(
      res,
      await academic.updateBatch(actor(req), req.params.id, updateBatchSchema.parse(req.body)),
      'Batch updated',
    );
  } catch (error) {
    next(error);
  }
});

batchRouter.delete('/:id', authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try {
    await academic.deleteBatch(actor(req), req.params.id);
    sendSuccess(res, null, 'Batch deleted');
  } catch (error) {
    next(error);
  }
});
