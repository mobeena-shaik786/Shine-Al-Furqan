import mongoose, { Document, Schema, Types } from 'mongoose';

export const ATTENDANCE_SESSION_STATUSES = ['conducted', 'cancelled'] as const;
export type AttendanceSessionStatus = (typeof ATTENDANCE_SESSION_STATUSES)[number];

export interface IAttendanceSession extends Document {
  batch: Types.ObjectId;
  course: Types.ObjectId;
  sessionDate: Date;
  note?: string;
  status: AttendanceSessionStatus;
  plannedHours: number;
  completedHours: number;
  ustadPresent: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSessionSchema = new Schema<IAttendanceSession>(
  {
    batch: { type: Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    sessionDate: { type: Date, required: true },
    note: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ATTENDANCE_SESSION_STATUSES,
      default: 'conducted',
      required: true,
      index: true,
    },
    plannedHours: { type: Number, default: 2, min: 0, max: 24 },
    completedHours: { type: Number, default: 2, min: 0, max: 24 },
    ustadPresent: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

attendanceSessionSchema.index({ batch: 1, sessionDate: 1 }, { unique: true });
attendanceSessionSchema.index({ sessionDate: 1, course: 1 });

export const AttendanceSession = mongoose.model<IAttendanceSession>(
  'AttendanceSession',
  attendanceSessionSchema,
);
