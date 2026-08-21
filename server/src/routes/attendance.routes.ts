import { Request, Router } from 'express';
import { authorizeRoles, protect } from '../middleware/auth';
import * as attendance from '../services/attendance.service';
import { sendSuccess } from '../utils/apiResponse';
import {
  createSessionSchema,
  listMyAttendanceSchema,
  listSessionsSchema,
  overviewQuerySchema,
  upsertRecordsSchema,
} from '../validators/attendance.validator';
import type { AcademicActor } from '../services/academic.service';

const router = Router();
const actor = (req: Request): AcademicActor => ({ id: req.user!.id, role: req.user!.role });

router.use(protect);

router.get('/overview', authorizeRoles('admin', 'coordinator', 'ustad'), async (req, res, next) => {
  try {
    const result = await attendance.getOverview(actor(req), overviewQuerySchema.parse(req.query));
    sendSuccess(res, result, 'Attendance overview retrieved');
  } catch (error) {
    next(error);
  }
});

router.post('/sessions', authorizeRoles('admin', 'coordinator', 'ustad'), async (req, res, next) => {
  try {
    sendSuccess(
      res,
      await attendance.createSession(actor(req), createSessionSchema.parse(req.body)),
      'Attendance session created',
      201,
    );
  } catch (error) {
    next(error);
  }
});

router.get('/sessions', authorizeRoles('admin', 'coordinator', 'ustad'), async (req, res, next) => {
  try {
    const result = await attendance.listSessions(actor(req), listSessionsSchema.parse(req.query));
    sendSuccess(res, result.sessions, 'Attendance sessions retrieved', 200, result.meta);
  } catch (error) {
    next(error);
  }
});

router.get('/sessions/:id', async (req, res, next) => {
  try {
    sendSuccess(
      res,
      await attendance.getSessionWithRecords(actor(req), req.params.id),
      'Attendance session retrieved',
    );
  } catch (error) {
    next(error);
  }
});

router.put('/sessions/:id/records', authorizeRoles('admin', 'coordinator', 'ustad'), async (req, res, next) => {
  try {
    sendSuccess(
      res,
      await attendance.upsertRecords(
        actor(req),
        req.params.id,
        upsertRecordsSchema.parse(req.body).records,
      ),
      'Attendance records saved',
    );
  } catch (error) {
    next(error);
  }
});

router.get('/me', authorizeRoles('student'), async (req, res, next) => {
  try {
    const result = await attendance.listMyAttendance(
      req.user!.id,
      listMyAttendanceSchema.parse(req.query),
    );
    sendSuccess(res, result.items, 'Attendance retrieved', 200, result.meta);
  } catch (error) {
    next(error);
  }
});

export default router;
