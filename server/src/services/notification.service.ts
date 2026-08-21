import { Types } from 'mongoose';
import { z } from 'zod';
import { Notification, NOTIFICATION_TYPES } from '../models/Notification';
import { NotificationRead } from '../models/NotificationRead';
import { User, type UserRole } from '../models/User';
import { escapeRegExp } from '../utils/escapeRegExp';
import type {
  ListNotificationsQuery,
  SendNotificationInput,
} from '../validators/settings.validator';

export const listInboxQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(['all', 'unread', 'read']).default('all'),
  type: z.enum(NOTIFICATION_TYPES).optional(),
  search: z.string().trim().max(200).optional(),
});

export type ListInboxQuery = z.infer<typeof listInboxQuerySchema>;

export function toNotificationDto(doc: {
  _id: unknown;
  subject: string;
  message: string;
  type: string;
  audience: string;
  recipientCount: number;
  createdBy: Types.ObjectId | { _id?: unknown; name?: string; email?: string };
  createdAt: Date;
  read?: boolean;
}) {
  const createdBy =
    doc.createdBy && typeof doc.createdBy === 'object' && 'name' in doc.createdBy
      ? {
          _id: String((doc.createdBy as { _id?: unknown })._id ?? ''),
          name: (doc.createdBy as { name?: string }).name || 'Admin',
          email: (doc.createdBy as { email?: string }).email || '',
        }
      : { _id: String(doc.createdBy), name: 'Admin', email: '' };

  return {
    _id: String(doc._id),
    subject: doc.subject,
    message: doc.message,
    type: doc.type,
    audience: doc.audience,
    recipientCount: doc.recipientCount,
    createdBy,
    createdAt: doc.createdAt.toISOString(),
    ...(doc.read !== undefined ? { read: doc.read } : {}),
  };
}

async function countRecipients(audience: SendNotificationInput['audience']) {
  if (audience === 'all') {
    return User.countDocuments({ isActive: true });
  }
  return User.countDocuments({ role: audience as UserRole, isActive: true });
}

export async function sendNotification(input: SendNotificationInput, createdBy: string) {
  const recipientCount = await countRecipients(input.audience);
  const doc = await Notification.create({
    subject: input.subject,
    message: input.message,
    type: input.type,
    audience: input.audience,
    recipientCount,
    createdBy: new Types.ObjectId(createdBy),
  });
  return toNotificationDto(doc);
}

export async function listNotificationHistory(query: ListNotificationsQuery) {
  const [rows, total] = await Promise.all([
    Notification.find()
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .populate('createdBy', 'name email'),
    Notification.countDocuments(),
  ]);
  return {
    notifications: rows.map(toNotificationDto),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

function audienceFilter(role: UserRole) {
  return {
    $or: [{ audience: 'all' as const }, { audience: role }],
  };
}

export async function listMyNotifications(userId: string, role: UserRole, query: ListInboxQuery) {
  const filter: Record<string, unknown> = audienceFilter(role);
  if (query.type) filter.type = query.type;
  if (query.search) {
    const rx = new RegExp(escapeRegExp(query.search), 'i');
    filter.$and = [
      { $or: [{ audience: 'all' }, { audience: role }] },
      { $or: [{ subject: rx }, { message: rx }] },
    ];
    delete filter.$or;
  }

  const allForUser = await Notification.find(filter).sort({ createdAt: -1 });
  const reads = await NotificationRead.find({
    user: userId,
    notification: { $in: allForUser.map((n) => n._id) },
  }).select('notification');
  const readIds = new Set(reads.map((r) => String(r.notification)));

  let rows = allForUser.map((doc) => ({
    doc,
    read: readIds.has(String(doc._id)),
  }));

  if (query.status === 'unread') rows = rows.filter((r) => !r.read);
  if (query.status === 'read') rows = rows.filter((r) => r.read);

  const unreadCount = allForUser.filter((n) => !readIds.has(String(n._id))).length;
  const total = rows.length;
  const start = (query.page - 1) * query.limit;
  const pageRows = rows.slice(start, start + query.limit);

  const populatedIds = pageRows.map((r) => r.doc._id);
  const populatedDocs = await Notification.find({ _id: { $in: populatedIds } })
    .populate('createdBy', 'name email');
  const byId = new Map(populatedDocs.map((d) => [String(d._id), d]));

  return {
    notifications: pageRows.map((row) => {
      const doc = byId.get(String(row.doc._id)) || row.doc;
      return toNotificationDto({
        _id: doc._id,
        subject: doc.subject,
        message: doc.message,
        type: doc.type,
        audience: doc.audience,
        recipientCount: doc.recipientCount,
        createdBy: doc.createdBy,
        createdAt: doc.createdAt,
        read: row.read,
      });
    }),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
      unreadCount,
    },
  };
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const notification = await Notification.findById(notificationId);
  if (!notification) return null;
  await NotificationRead.findOneAndUpdate(
    { user: userId, notification: notificationId },
    { $set: { readAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return { _id: notificationId, read: true };
}

export async function markAllNotificationsRead(userId: string, role: UserRole) {
  const notifications = await Notification.find(audienceFilter(role)).select('_id');
  if (notifications.length === 0) return { marked: 0 };
  const userOid = new Types.ObjectId(userId);
  await NotificationRead.bulkWrite(
    notifications.map((n) => ({
      updateOne: {
        filter: { user: userOid, notification: n._id },
        update: {
          $set: { readAt: new Date() },
          $setOnInsert: { user: userOid, notification: n._id },
        },
        upsert: true,
      },
    })),
  );
  return { marked: notifications.length };
}

export async function getUnreadCount(userId: string, role: UserRole) {
  const notifications = await Notification.find(audienceFilter(role)).select('_id');
  if (notifications.length === 0) return 0;
  const readCount = await NotificationRead.countDocuments({
    user: userId,
    notification: { $in: notifications.map((n) => n._id) },
  });
  return Math.max(0, notifications.length - readCount);
}
