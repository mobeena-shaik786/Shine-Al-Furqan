import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IModule extends Document {
  course: Types.ObjectId;
  title: string;
  /** 1-based position within the course curriculum. */
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const moduleSchema = new Schema<IModule>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    order: { type: Number, required: true, min: 1 },
  },
  { timestamps: true },
);

moduleSchema.index({ course: 1, order: 1 }, { unique: true });

export const CourseModule = mongoose.model<IModule>('CourseModule', moduleSchema);
