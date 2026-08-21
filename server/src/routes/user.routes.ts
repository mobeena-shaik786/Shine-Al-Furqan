import { NextFunction, Request, Response, Router } from 'express';
import { authorizeRoles, protect } from '../middleware/auth';
import { requireObjectIds } from '../middleware/validateObjectId';
import * as userService from '../services/user.service';
import { sendSuccess } from '../utils/apiResponse';
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  updateUserStatusSchema,
} from '../validators/user.validator';

const router = Router();

function actorFromReq(req: Request) {
  return { id: req.user!.id, role: req.user!.role };
}

router.use(protect, authorizeRoles('admin', 'coordinator'));

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listUsersQuerySchema.parse(req.query);
    const result = await userService.listUsers(actorFromReq(req), query);
    sendSuccess(res, result.users, 'Users retrieved', 200, result.meta);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireObjectIds('id'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getUserById(actorFromReq(req), req.params.id);
    sendSuccess(res, user, 'User retrieved');
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createUserSchema.parse(req.body);
    const user = await userService.createUser(actorFromReq(req), input);
    sendSuccess(res, user, 'User created', 201);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', requireObjectIds('id'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateUserSchema.parse(req.body);
    const user = await userService.updateUser(actorFromReq(req), req.params.id, input);
    sendSuccess(res, user, 'User updated');
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', requireObjectIds('id'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updateUserStatusSchema.parse(req.body);
    const user = await userService.updateUserStatus(actorFromReq(req), req.params.id, input);
    sendSuccess(res, user, input.isActive ? 'User activated' : 'User deactivated');
  } catch (error) {
    next(error);
  }
});

export default router;
