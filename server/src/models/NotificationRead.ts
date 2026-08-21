import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotificationRead extends Document {
  user: Types.ObjectId;
  notification: Types.ObjectId;
  readAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationReadSchema = new Schema<INotificationRead>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    notification: { type: Schema.Types.ObjectId, ref: 'Notification', required: true, index: true },
    readAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

notificationReadSchema.index({ user: 1, notification: 1 }, { unique: true });

export const NotificationRead = mongoose.model<INotificationRead>(
  'NotificationRead',
  notificationReadSchema,
);
