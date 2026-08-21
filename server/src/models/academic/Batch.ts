import mongoose, { Document, Schema, Types } from 'mongoose';
import { BATCH_STATUSES, type BatchStatus } from './constants';

export const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export interface IScheduleSlot {
  day: Weekday;
  startTime: string;
  endTime: string;
}

/**
 * Batch / cohort delivering a course (academy teaching group).
 */
export interface IBatch extends Document {
  name: string;
  course: Types.ObjectId;
  /** Assigned ustad(s) for this cohort. */
  instructors: Types.ObjectId[];
  /** Optional coordinating staff member. */
  coordinator?: Types.ObjectId;
  capacity: number;
  startDate?: Date;
  endDate?: Date;
  /** Free-text schedule note (legacy). */
  scheduleNote: string;
  /** Structured weekly class times. */
  scheduleSlots: IScheduleSlot[];
  status: BatchStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const scheduleSlotSchema = new Schema<IScheduleSlot>(
  {
    day: { type: String, enum: WEEKDAYS, required: true },
    startTime: { type: String, required: true, trim: true, maxlength: 8 },
    endTime: { type: String, required: true, trim: true, maxlength: 8 },
  },
  { _id: false },
);

const batchSchema = new Schema<IBatch>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    instructors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    coordinator: { type: Schema.Types.ObjectId, ref: 'User' },
    capacity: { type: Number, required: true, min: 1, max: 500, default: 30 },
    startDate: { type: Date },
    endDate: { type: Date },
    scheduleNote: { type: String, default: '', trim: true, maxlength: 1000 },
    scheduleSlots: { type: [scheduleSlotSchema], default: [] },
    status: {
      type: String,
      enum: BATCH_STATUSES,
      default: 'active',
      required: true,
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);

batchSchema.index({ course: 1, status: 1 });
batchSchema.index({ instructors: 1 });
batchSchema.index({ coordinator: 1 });
batchSchema.index({ name: 1, course: 1 }, { unique: true });

export const Batch = mongoose.model<IBatch>('Batch', batchSchema);
