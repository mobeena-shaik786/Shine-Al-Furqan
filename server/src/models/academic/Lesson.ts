import mongoose, { Document, Schema, Types } from 'mongoose';
import { LESSON_STATUSES, LESSON_TYPES, type LessonStatus, type LessonType } from './constants';

export interface ILesson extends Document {
  course: Types.ObjectId;
  module: Types.ObjectId;
  title: string;
  lessonType: LessonType;
  /** Primary content body or markdown/HTML text (DEFAULT). */
  content: string;
  /** Optional external resource (video URL, PDF, etc.). */
  resourceUrl?: string;
  /** 1-based position within the module. */
  order: number;
  durationMinutes?: number;
  status: LessonStatus;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    module: { type: Schema.Types.ObjectId, ref: 'CourseModule', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    lessonType: {
      type: String,
      enum: LESSON_TYPES,
      default: 'text',
      required: true,
    },
    content: { type: String, default: '', maxlength: 100_000 },
    resourceUrl: { type: String, trim: true, maxlength: 1000 },
    order: { type: Number, required: true, min: 1 },
    durationMinutes: { type: Number, min: 0, max: 24 * 60 },
    status: {
      type: String,
      enum: LESSON_STATUSES,
      default: 'draft',
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

lessonSchema.index({ module: 1, order: 1 }, { unique: true });
lessonSchema.index({ course: 1, order: 1 });

export const Lesson = mongoose.model<ILesson>('Lesson', lessonSchema);
