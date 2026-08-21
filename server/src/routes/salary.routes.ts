import { Router } from 'express';
import { authorizeRoles, protect } from '../middleware/auth';
import * as salaryService from '../services/salary.service';
import { listSalariesQuerySchema, salaryDetailQuerySchema } from '../validators/salary.validator';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

router.use(protect, authorizeRoles('admin'));

router.get('/', async (req, res, next) => {
  try {
    const query = listSalariesQuerySchema.parse(req.query);
    const result = await salaryService.listUstadSalaries(query);
    sendSuccess(res, result.rows, 'Salaries retrieved', 200, result.meta);
  } catch (error) {
    next(error);
  }
});

router.get('/:ustadId', async (req, res, next) => {
  try {
    const query = salaryDetailQuerySchema.parse(req.query);
    const detail = await salaryService.getUstadSalaryDetail(req.params.ustadId, query);
    sendSuccess(res, detail, 'Salary detail retrieved');
  } catch (error) {
    next(error);
  }
});

export default router;
