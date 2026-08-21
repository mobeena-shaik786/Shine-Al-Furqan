import { Router } from 'express';
import { protect } from '../middleware/auth';
import * as notificationService from '../services/notification.service';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';

const router = Router();

router.use(protect);

router.get('/mine', async (req, res, next) => {
  try {
    const query = notificationService.listInboxQuerySchema.parse(req.query);
    const result = await notificationService.listMyNotifications(
      req.user!.id,
      req.user!.role,
      query,
    );
    sendSuccess(res, result.notifications, 'Notifications retrieved', 200, result.meta);
  } catch (error) {
    next(error);
  }
});

router.get('/mine/unread-count', async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user!.id, req.user!.role);
    sendSuccess(res, { count }, 'Unread count retrieved');
  } catch (error) {
    next(error);
  }
});

router.post('/mine/read-all', async (req, res, next) => {
  try {
    const result = await notificationService.markAllNotificationsRead(
      req.user!.id,
      req.user!.role,
    );
    sendSuccess(res, result, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
});

router.post('/mine/:id/read', async (req, res, next) => {
  try {
    const result = await notificationService.markNotificationRead(req.user!.id, req.params.id);
    if (!result) throw new AppError('Notification not found', 404);
    sendSuccess(res, result, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
});

export default router;
