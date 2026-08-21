import mongoose, { Document, Schema, Types } from 'mongoose';
import { COURSE_STATUSES, type CourseStatus } from './constants';

export interface ICourse extends Document {
  title: string;
  code: string;
  description: string;
  category: string;
  thumbnailUrl?: string;
  status: CourseStatus;
  /** Linked syllabus topics from the Topic catalog. */
  topics: Types.ObjectId[];
  /** Assigned ustad instructors (User refs with role ustad). */
  instructors: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 64,
    },
    description: { type: String, default: '', trim: true, maxlength: 5000 },
    category: { type: String, default: 'general', trim: true, maxlength: 120, index: true },
    thumbnailUrl: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: COURSE_STATUSES,
      default: 'draft',
      required: true,
      index: true,
    },
    topics: [{ type: Schema.Types.ObjectId, ref: 'Topic' }],
    instructors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);

courseSchema.index({ status: 1, category: 1 });
courseSchema.index({ instructors: 1 });

export const Course = mongoose.model<ICourse>('Course', courseSchema);
