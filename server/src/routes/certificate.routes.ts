import { Request, Router } from 'express';
import { authorizeRoles, protect } from '../middleware/auth';
import * as certificateService from '../services/certificate.service';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

const actor = (req: Request): certificateService.AcademicActor => ({
  id: req.user!.id,
  role: req.user!.role,
});

router.use(protect);

router.get('/batches/completed', authorizeRoles('admin', 'coordinator', 'ustad'), async (_req, res, next) => {
  try {
    const batches = await certificateService.listCompletedBatches();
    sendSuccess(res, batches, 'Completed batches retrieved');
  } catch (error) {
    next(error);
  }
});

router.get('/', authorizeRoles('admin', 'coordinator', 'ustad', 'student'), async (req, res, next) => {
  try {
    const query = certificateService.listCertificatesQuerySchema.parse(req.query);
    const result = await certificateService.listIssuedCertificates(actor(req), query);
    sendSuccess(res, result.certificates, 'Certificates retrieved', 200, result.meta);
  } catch (error) {
    next(error);
  }
});

router.get('/eligible', authorizeRoles('admin', 'coordinator', 'ustad'), async (req, res, next) => {
  try {
    const query = certificateService.listEligibleQuerySchema.parse(req.query);
    const result = await certificateService.listEligibleStudents(actor(req), query);
    sendSuccess(res, result.students, 'Eligible students retrieved', 200, result.meta);
  } catch (error) {
    next(error);
  }
});

router.post('/issue', authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try {
    const created = await certificateService.issueCertificates(actor(req), req.body);
    sendSuccess(res, created, 'Certificates issued', 201);
  } catch (error) {
    next(error);
  }
});

export default router;
