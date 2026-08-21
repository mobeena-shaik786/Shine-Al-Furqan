import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IQuiz extends Document {
  lesson: Types.ObjectId;
  course: Types.ObjectId;
  title: string;
  passThresholdPercent: number;
  maxAttempts: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const quizSchema = new Schema<IQuiz>({
  lesson: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, unique: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  passThresholdPercent: { type: Number, default: 70, min: 0, max: 100 },
  maxAttempts: { type: Number, default: 0, min: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);
