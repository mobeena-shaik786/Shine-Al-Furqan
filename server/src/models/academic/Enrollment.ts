import mongoose, { Document, Schema, Types } from 'mongoose';

export const ENROLLMENT_STATUSES = ['active', 'completed', 'dropped', 'pending'] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export interface IEnrollment extends Document {
  student: Types.ObjectId;
  course: Types.ObjectId;
  batch?: Types.ObjectId;
  status: EnrollmentStatus;
  enrolledAt: Date;
  completedAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch' },
    status: { type: String, enum: ENROLLMENT_STATUSES, default: 'active', required: true },
    enrolledAt: { type: Date, default: Date.now, required: true },
    completedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ course: 1, status: 1 });
enrollmentSchema.index({ batch: 1, status: 1 });
enrollmentSchema.index({ student: 1, status: 1 });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
