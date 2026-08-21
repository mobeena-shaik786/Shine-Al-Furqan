import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ILessonProgress extends Document {
  student: Types.ObjectId;
  lesson: Types.ObjectId;
  course: Types.ObjectId;
  completedAt?: Date;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const lessonProgressSchema = new Schema<ILessonProgress>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lesson: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    completedAt: { type: Date },
    lastAccessedAt: { type: Date, default: Date.now, required: true },
  },
  { timestamps: true },
);

lessonProgressSchema.index({ student: 1, lesson: 1 }, { unique: true });
lessonProgressSchema.index({ student: 1, course: 1 });

export const LessonProgress = mongoose.model<ILessonProgress>('LessonProgress', lessonProgressSchema);
