import { Router } from 'express';
import { authorizeRoles, protect } from '../middleware/auth';
import { getCoordinatorDashboard } from '../services/dashboard.service';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

router.get('/dashboard', protect, authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try {
    const month = typeof req.query.month === 'string' ? req.query.month : undefined;
    sendSuccess(res, await getCoordinatorDashboard(month), 'Coordinator dashboard');
  } catch (error) {
    next(error);
  }
});

export default router;
