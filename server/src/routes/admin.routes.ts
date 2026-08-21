import { Router } from 'express';
import { authorizeRoles, protect } from '../middleware/auth';
import { getAdminDashboard } from '../services/dashboard.service';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

router.get('/dashboard', protect, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const month = typeof req.query.month === 'string' ? req.query.month : undefined;
    sendSuccess(res, await getAdminDashboard(month), 'Admin dashboard');
  } catch (error) {
    next(error);
  }
});

export default router;
