import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IQuizQuestion extends Document {
  quiz: Types.ObjectId;
  prompt: string;
  options: Array<{ optionId: string; text: string }>;
  correctOptionId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const optionSchema = new Schema({ optionId: { type: String, required: true, trim: true }, text: { type: String, required: true, trim: true } }, { _id: false });
const quizQuestionSchema = new Schema<IQuizQuestion>({
  quiz: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  prompt: { type: String, required: true, trim: true, maxlength: 5000 },
  options: { type: [optionSchema], required: true, validate: [(value: unknown[]) => value.length >= 2, 'At least two options are required'] },
  correctOptionId: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator(this: IQuizQuestion, value: string) {
        return this.options.some((option) => option.optionId === value);
      },
      message: 'correctOptionId must match an optionId',
    },
  },
  order: { type: Number, required: true, min: 1 },
}, { timestamps: true });

quizQuestionSchema.index({ quiz: 1, order: 1 });
export const QuizQuestion = mongoose.model<IQuizQuestion>('QuizQuestion', quizQuestionSchema);
