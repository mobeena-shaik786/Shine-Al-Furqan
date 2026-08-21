import mongoose, { Document, Schema, Types } from 'mongoose';
import { USER_ROLES, type UserRole } from './User';

export const NOTIFICATION_TYPES = ['info', 'success', 'warning', 'alert'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_AUDIENCES = ['all', ...USER_ROLES] as const;
export type NotificationAudience = (typeof NOTIFICATION_AUDIENCES)[number];

export interface INotification extends Document {
  subject: string;
  message: string;
  type: NotificationType;
  audience: NotificationAudience;
  recipientCount: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true, default: 'info' },
    audience: { type: String, enum: NOTIFICATION_AUDIENCES, required: true },
    recipientCount: { type: Number, required: true, min: 0, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ audience: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
