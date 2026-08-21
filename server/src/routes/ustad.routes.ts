import { Router } from 'express';
import { authorizeRoles, protect } from '../middleware/auth';
import { getUstadDashboard } from '../services/dashboard.service';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

router.get('/dashboard', protect, authorizeRoles('admin', 'coordinator', 'ustad'), async (req, res, next) => {
  try {
    const month = typeof req.query.month === 'string' ? req.query.month : undefined;
    sendSuccess(
      res,
      await getUstadDashboard({ id: req.user!.id, role: req.user!.role }, month),
      'Ustad dashboard',
    );
  } catch (error) {
    next(error);
  }
});

export default router;
