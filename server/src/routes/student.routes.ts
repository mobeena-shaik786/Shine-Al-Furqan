import { Router } from 'express';
import { authorizeRoles, protect } from '../middleware/auth';
import { getStudentDashboard } from '../services/dashboard.service';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

router.get('/dashboard', protect, authorizeRoles('student'), async (req, res, next) => {
  try {
    sendSuccess(
      res,
      await getStudentDashboard({ id: req.user!.id, role: req.user!.role }),
      'Student dashboard',
    );
  } catch (error) {
    next(error);
  }
});

export default router;
