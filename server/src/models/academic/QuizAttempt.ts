import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IQuizAttempt extends Document {
  quiz: Types.ObjectId; student: Types.ObjectId; course: Types.ObjectId;
  answers: Array<{ questionId: Types.ObjectId; optionId: string }>;
  score: number; totalQuestions: number; percent: number; passed: boolean; submittedAt: Date;
}

const answerSchema = new Schema({ questionId: { type: Schema.Types.ObjectId, ref: 'QuizQuestion', required: true }, optionId: { type: String, required: true } }, { _id: false });
const quizAttemptSchema = new Schema<IQuizAttempt>({
  quiz: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  answers: { type: [answerSchema], required: true },
  score: { type: Number, required: true, min: 0 },
  totalQuestions: { type: Number, required: true, min: 0 },
  percent: { type: Number, required: true, min: 0, max: 100 },
  passed: { type: Boolean, required: true },
  submittedAt: { type: Date, required: true, default: Date.now },
}, { timestamps: true });
quizAttemptSchema.index({ quiz: 1, student: 1, submittedAt: -1 });
export const QuizAttempt = mongoose.model<IQuizAttempt>('QuizAttempt', quizAttemptSchema);
