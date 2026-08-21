import { Router } from 'express';
import { authorizeRoles, protect } from '../middleware/auth';
import * as settingsService from '../services/settings.service';
import * as notificationService from '../services/notification.service';
import {
  listNotificationsQuerySchema,
  sendNotificationSchema,
  updateSettingsSchema,
} from '../validators/settings.validator';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

router.use(protect);

router.get('/', authorizeRoles('admin'), async (_req, res, next) => {
  try {
    sendSuccess(res, await settingsService.getSettings(), 'Settings retrieved');
  } catch (error) {
    next(error);
  }
});

router.patch('/', authorizeRoles('admin'), async (req, res, next) => {
  try {
    const input = updateSettingsSchema.parse(req.body);
    sendSuccess(res, await settingsService.updateSettings(input), 'Settings updated');
  } catch (error) {
    next(error);
  }
});

router.get('/notifications', authorizeRoles('admin'), async (req, res, next) => {
  try {
    const query = listNotificationsQuerySchema.parse(req.query);
    const result = await notificationService.listNotificationHistory(query);
    sendSuccess(res, result.notifications, 'Notification history retrieved', 200, result.meta);
  } catch (error) {
    next(error);
  }
});

router.post('/notifications', authorizeRoles('admin'), async (req, res, next) => {
  try {
    const input = sendNotificationSchema.parse(req.body);
    const notification = await notificationService.sendNotification(input, req.user!.id);
    sendSuccess(res, notification, 'Notification sent', 201);
  } catch (error) {
    next(error);
  }
});

export default router;
